use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

#[derive(Serialize, Deserialize, Clone)]
struct Task {
    id: String,
    title: String,
    priority: String,
    due_date: Option<String>,
    project: Option<String>,
    completed: bool,
}

#[derive(Serialize, Deserialize)]
struct WoodsNode {
    name: String,
    path: String,
    r#type: String,
    children: Option<Vec<WoodsNode>>,
}

#[allow(dead_code)]
struct AppState {
    tasks: Mutex<Vec<Task>>,
    woods_root: Mutex<Option<PathBuf>>,
    innm_engine: Mutex<Option<std::process::Child>>,
    matrix_status: Mutex<MatrixStatus>,
}

struct MatrixStatus {
    front_active: bool,
    back_active: bool,
    up_active: bool,
}

#[tauri::command]
async fn send_innm_message(
    message: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    // Simulate INNM Triangular Matrix processing
    let mut status = state.matrix_status.lock().unwrap();
    status.front_active = true;

    // In real implementation, this would communicate with the Python sidecar
    let response = format!("INNM processed: {} [FRONT->BACK->UP]", message);

    status.back_active = true;
    status.up_active = true;

    Ok(response)
}

#[tauri::command]
async fn get_matrix_status(
    state: State<'_, AppState>,
) -> Result<HashMap<String, bool>, String> {
    let status = state.matrix_status.lock().unwrap();
    let mut map = HashMap::new();
    map.insert("front".to_string(), status.front_active);
    map.insert("back".to_string(), status.back_active);
    map.insert("up".to_string(), status.up_active);
    Ok(map)
}

#[tauri::command]
async fn map_woods_folder(
    folder_path: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let path = PathBuf::from(folder_path);
    if !path.exists() {
        return Err("Path does not exist".to_string());
    }

    let mut woods = state.woods_root.lock().unwrap();
    *woods = Some(path);
    Ok(())
}

#[tauri::command]
async fn get_woods_status(state: State<'_, AppState>) -> Result<WoodsNode, String> {
    let woods = state.woods_root.lock().unwrap();
    if let Some(ref path) = *woods {
        Ok(scan_directory(path)?)
    } else {
        Err("No WOODS folder mapped".to_string())
    }
}

fn scan_directory(path: &PathBuf) -> Result<WoodsNode, String> {
    let name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    let mut node = WoodsNode {
        name,
        path: path.to_string_lossy().to_string(),
        r#type: if path.is_dir() {
            "folder".to_string()
        } else {
            "file".to_string()
        },
        children: if path.is_dir() { Some(vec![]) } else { None },
    };

    if path.is_dir() {
        let mut children = vec![];
        if let Ok(entries) = std::fs::read_dir(path) {
            for entry in entries.flatten() {
                if let Ok(child) = scan_directory(&entry.path()) {
                    children.push(child);
                }
            }
        }
        node.children = Some(children);
    }

    Ok(node)
}

#[tauri::command]
async fn toggle_task(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut tasks = state.tasks.lock().unwrap();
    if let Some(task) = tasks.iter_mut().find(|t| t.id == id) {
        task.completed = !task.completed;
        Ok(())
    } else {
        Err(format!("Task {} not found", id))
    }
}

#[tauri::command]
async fn create_task(
    title: String,
    priority: String,
    due_date: Option<String>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut tasks = state.tasks.lock().unwrap();
    tasks.push(Task {
        id: uuid::Uuid::new_v4().to_string(),
        title,
        priority,
        due_date,
        project: None,
        completed: false,
    });
    Ok(())
}

#[tauri::command]
async fn get_tasks(state: State<'_, AppState>) -> Result<Vec<Task>, String> {
    let tasks = state.tasks.lock().unwrap();
    Ok(tasks.clone())
}

#[tauri::command]
async fn get_projects() -> Result<Vec<String>, String> {
    // Placeholder for project hierarchy
    Ok(vec![
        "Project Alpha".to_string(),
        "Project Beta".to_string(),
    ])
}

#[tauri::command]
async fn initialize_vault(key: String) -> Result<(), String> {
    // AES-256 encryption initialization placeholder
    println!("Vault initialized with key length: {}", key.len());
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            tasks: Mutex::new(vec![]),
            woods_root: Mutex::new(None),
            innm_engine: Mutex::new(None),
            matrix_status: Mutex::new(MatrixStatus {
                front_active: false,
                back_active: false,
                up_active: false,
            }),
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            send_innm_message,
            get_matrix_status,
            map_woods_folder,
            get_woods_status,
            create_task,
            toggle_task,
            get_tasks,
            get_projects,
            initialize_vault
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
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
    app: tauri::AppHandle,
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
    let response = call_innm_sidecar(&app, &message).await.unwrap_or_else(|_| {
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
    let count = count_documents(std::path::Path::new(&folder_path));
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
fn count_documents(root: &std::path::Path) -> usize {
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
            // DirEntry::file_type() does not follow symlinks, so only real
            // directories recurse — prevents stack overflows from symlink cycles.
            count += count_documents(&path);
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

/// Call the INNM Python sidecar via stdin/stdout using Tauri's bundled-sidecar
/// resolution so the correct `innm-engine-<target-triple>[.exe]` is found at
/// runtime regardless of `PATH`.
async fn call_innm_sidecar(app: &tauri::AppHandle, message: &str) -> Result<String, String> {
    use tauri_plugin_shell::ShellExt;
    use tauri_plugin_shell::process::CommandEvent;

    let (mut rx, mut child) = app
        .shell()
        .sidecar("innm-engine")
        .map_err(|e| e.to_string())?
        .spawn()
        .map_err(|e| e.to_string())?;

    // Send the message to the sidecar via stdin.
    child
        .write(message.as_bytes())
        .map_err(|e| e.to_string())?;

    // Collect raw bytes from all Stdout events, then decode once to avoid
    // repeated intermediate allocations from per-line from_utf8_lossy calls.
    let mut raw: Vec<u8> = Vec::new();
    while let Some(event) = rx.recv().await {
        match event {
            CommandEvent::Stdout(mut line) => {
                raw.append(&mut line);
            }
            CommandEvent::Terminated(_) => break,
            _ => {
                // Ignore Stderr, Error, etc.
            }
        }
    }
    Ok(String::from_utf8_lossy(&raw).trim().to_string())
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
