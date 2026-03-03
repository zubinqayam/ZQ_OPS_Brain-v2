# ZQ Ops Brain v2

> AI control room with INNM-WOSDS integration — built with Tauri 2, React 18, and Rust.

---

## Overview

ZQ Ops Brain v2 is a cross-platform desktop/mobile application that combines a
task-management workspace with the **INNM-WOSDS** (Integrated Neural Network
Matrix – Working Object Oriented Document Store) AI engine.

| Platform | Output | Build command |
|----------|--------|---------------|
| Windows | `.exe` | `npm run tauri-build` |
| Android | `.apk` | `npm run tauri-android-build` |
| Linux | `.deb` / `.AppImage` | `npm run tauri-build` |

---

## Features

### ZQ Ops Brain
- 📅 **Today Tab** – task management with priorities and due dates
- 📁 **Projects Tab** – project list view
- ✅ **Tasks Tab** – full task view with search & filter
- 💬 **Chat Tab** – INNM chat interface with Triangular Matrix
- 🧠 **INNM Tab** – WOODS mapping, Matrix status, document indexing
- ⚙️ **Settings Tab** – Keyhole Vault (AES-256-GCM), system info

### INNM-WOSDS Engine
- **WOODS** folder mapping (.txt, .md, .csv, .log)
- **Triangular Matrix** pipeline:
  - **FRONT** – Input Processing & NLP parsing
  - **BACK** – Context Validation & coherence checking
  - **UP** – Response Synthesis & output ranking
- Fully offline, Python sidecar architecture

---

## Quick Start

```bash
# Install dependencies
npm install

# Development (hot-reload)
npm run tauri-dev

# Build Windows .exe
npm run tauri-build

# Build Android .apk
npm run tauri-android-init   # first time only
npm run tauri-android-build
```

See [BUILD.md](BUILD.md) for full build instructions.

---

## Project Structure

```
zq-ops-brain-v2/
├── src/                          # React 18 + TypeScript frontend
│   ├── App.tsx                   # Main UI (6 tabs)
│   ├── App.css                   # Custom styles
│   ├── main.tsx                  # React entry point
│   └── lib/utils.ts              # Utilities & AES-256 vault helpers
├── src-tauri/                    # Tauri 2 backend
│   ├── src/
│   │   ├── lib.rs                # Rust commands + INNM integration
│   │   └── main.rs               # Entry point
│   ├── capabilities/
│   │   └── default.json          # Tauri 2 permissions
│   ├── tauri.conf.json           # Tauri 2 config
│   ├── Cargo.toml                # Rust dependencies
│   ├── binaries/                 # Compiled INNM sidecar goes here
│   └── INNM_ENGINE/              # Python INNM modules
│       ├── ibox_core.py          # Pipeline coordinator (stdin/stdout sidecar)
│       ├── front_matrix.py       # Input Processing
│       ├── back_matrix.py        # Context Validation
│       ├── up_matrix.py          # Response Synthesis
│       └── woods_builder.py      # WOODS document indexer
├── .github/workflows/
│   └── build.yml                 # CI/CD for Windows, Android & Linux
├── BUILD.md                      # Detailed build instructions
├── package.json
└── vite.config.ts
```

---

## Tauri Commands

| Command | Description |
|---------|-------------|
| `create_task(task)` | Create a new task |
| `get_tasks()` | Return all tasks |
| `get_projects()` | Return project tree |
| `create_project(project)` | Create a new project |
| `send_innm_message(message)` | Chat with INNM engine |
| `map_woods_folder(folder_path)` | Map WOODS folder |
| `get_woods_status()` | Check WOODS mapping status |
| `select_folder_dialog()` | Native folder picker |

---

## License

See [LICENSE](LICENSE).
