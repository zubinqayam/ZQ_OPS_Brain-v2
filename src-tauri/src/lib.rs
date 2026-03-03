use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{command, State};
use uuid::Uuid;
use chrono::Utc;

/* ------------------------------------------------------------------ */
/*  Shared application state                                            */
/* ------------------------------------------------------------------ */

#[derive(Default)]
pub struct AppState {
    pub tasks: Mutex<Vec<Task>>,
    pub projects: Mutex<Vec<Project>>,
    pub woods_status: Mutex<WoodsStatus>,
    pub innm_messages: Mutex<Vec<InnmMessage>>,
}

/* ------------------------------------------------------------------ */
/*  Domain types                                                        */
/* ------------------------------------------------------------------ */

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub description: String,
    pub priority: String,
    pub status: String,
    pub project_id: Option<String>,
    pub due_date: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: String,
    pub parent_id: Option<String>,
    pub created_at: String,
    pub task_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct WoodsStatus {
    pub mapped: bool,
    pub folder_path: String,
    pub document_count: usize,
    pub last_updated: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InnmMessage {
    pub id: String,
    pub role: String,
    pub content: String,
    pub timestamp: String,
}

/* ------------------------------------------------------------------ */
/*  Tauri commands                                                      */
/* ------------------------------------------------------------------ */

/// Create a new task and store it in application state.
#[command]
pub fn create_task(task: Task, state: State<AppState>) -> Result<Task, String> {
    let mut tasks = state.tasks.lock().map_err(|e| e.to_string())?;
    tasks.push(task.clone());
    Ok(task)
}

/// Return all stored tasks.
#[command]
pub fn get_tasks(state: State<AppState>) -> Result<Vec<Task>, String> {
    let tasks = state.tasks.lock().map_err(|e| e.to_string())?;
    Ok(tasks.clone())
}

/// Return all stored projects, enriched with live task counts.
#[command]
pub fn get_projects(state: State<AppState>) -> Result<Vec<Project>, String> {
    let tasks = state.tasks.lock().map_err(|e| e.to_string())?;
    let mut projects = state.projects.lock().map_err(|e| e.to_string())?;
    for p in projects.iter_mut() {
        p.task_count = tasks.iter().filter(|t| t.project_id.as_deref() == Some(&p.id)).count();
    }
    Ok(projects.clone())
}

/// Create a new project and store it in application state.
#[command]
pub fn create_project(project: Project, state: State<AppState>) -> Result<Project, String> {
    let mut projects = state.projects.lock().map_err(|e| e.to_string())?;
    projects.push(project.clone());
    Ok(project)
}

/// Send a message to the INNM engine sidecar and return its response.
///
/// The sidecar binary (innm-engine) is expected to be bundled alongside
/// the application.  If it is not available the command returns a
/// descriptive fallback message so the UI can degrade gracefully.
#[command]
pub async fn send_innm_message(
    message: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    // Record the user message
    {
        let mut msgs = state.innm_messages.lock().map_err(|e| e.to_string())?;
        msgs.push(InnmMessage {
            id: Uuid::new_v4().to_string(),
            role: "user".into(),
            content: message.clone(),
            timestamp: Utc::now().to_rfc3339(),
        });
    }

    // Attempt to call the sidecar; fall back to a local response when
    // the sidecar is not present (e.g. development without Python env).
    let response = call_innm_sidecar(&message).await.unwrap_or_else(|_| {
        format!(
            "INNM [offline]: received \"{}\".\n\
             Triangular Matrix engaged:\n\
             • FRONT: intent parsed\n\
             • BACK:  context validated\n\
             • UP:    response synthesised (sidecar not running)",
            message
        )
    });

    // Record the assistant response
    {
        let mut msgs = state.innm_messages.lock().map_err(|e| e.to_string())?;
        msgs.push(InnmMessage {
            id: Uuid::new_v4().to_string(),
            role: "assistant".into(),
            content: response.clone(),
            timestamp: Utc::now().to_rfc3339(),
        });
    }

    Ok(response)
}

/// Map a WOODS folder: walk the directory tree and count supported documents.
#[command]
pub fn map_woods_folder(
    folder_path: String,
    state: State<AppState>,
) -> Result<WoodsStatus, String> {
    let count = count_documents(&folder_path);
    let status = WoodsStatus {
        mapped: true,
        folder_path: folder_path.clone(),
        document_count: count,
        last_updated: Utc::now().to_rfc3339(),
    };
    *state.woods_status.lock().map_err(|e| e.to_string())? = status.clone();
    Ok(status)
}

/// Return the current WOODS mapping status.
#[command]
pub fn get_woods_status(state: State<AppState>) -> Result<WoodsStatus, String> {
    let s = state.woods_status.lock().map_err(|e| e.to_string())?;
    Ok(s.clone())
}

/// Open a native folder-picker dialog and return the selected path.
#[command]
pub async fn select_folder_dialog(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    use tokio::task;

    let app_handle = app.clone();
    let path = task::spawn_blocking(move || {
        app_handle.dialog().file().blocking_pick_folder()
    })
    .await
    .map_err(|e| e.to_string())?;
    Ok(path.map(|p| p.to_string_lossy().into_owned()))
}

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                    */
/* ------------------------------------------------------------------ */

/// Count documents with supported extensions under `root`.
fn count_documents(root: &str) -> usize {
    let supported = ["txt", "md", "csv", "log"];
    let Ok(entries) = std::fs::read_dir(root) else {
        return 0;
    };
    let mut count = 0usize;
    for entry in entries.flatten() {
        let Ok(file_type) = entry.file_type() else {
            continue;
        };
        let path = entry.path();
        if file_type.is_dir() {
            // Do not follow symlinked directories: DirEntry::file_type() does not
            // follow symlinks, so only real directories will recurse.
            count += count_documents(&path.to_string_lossy());
        } else if file_type.is_file() {
            if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                if supported.contains(&ext.to_lowercase().as_str()) {
                    count += 1;
                }
            }
        }
    }
    count
}

/// Call the INNM Python sidecar via stdin/stdout.
async fn call_innm_sidecar(message: &str) -> Result<String, String> {
    use tauri::api::process::{Command, CommandEvent};

    // Resolve and spawn the bundled sidecar instead of relying on PATH.
    let (mut rx, mut child) = Command::new_sidecar("innm-engine")
        .map_err(|e| e.to_string())?
        .spawn()
        .map_err(|e| e.to_string())?;

    // Write the request message to the sidecar's stdin.
    child
        .write(message.as_bytes())
        .map_err(|e| e.to_string())?;

    // Collect all stdout output until the process terminates.
    let mut output = String::new();
    while let Some(event) = rx.recv().await {
        match event {
            CommandEvent::Stdout(line) => {
                output.push_str(&line);
            }
            CommandEvent::Terminated(_) => {
                break;
            }
            _ => {
                // Ignore other events (e.g., Stderr, Error) for now,
                // preserving the previous "stdout-only" behavior.
            }
        }
    }
    Ok(output.trim().to_string())
}

/* ------------------------------------------------------------------ */
/*  App entry-point (called from main.rs)                              */
/* ------------------------------------------------------------------ */

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            create_task,
            get_tasks,
            get_projects,
            create_project,
            send_innm_message,
            map_woods_folder,
            get_woods_status,
            select_folder_dialog,
        ])
        .run(tauri::generate_context!())
        .expect("error while running ZQ Ops Brain");
}
