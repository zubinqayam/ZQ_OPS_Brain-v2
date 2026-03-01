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
}
