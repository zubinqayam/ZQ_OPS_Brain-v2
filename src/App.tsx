import { useState, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { generateId, today, type Priority, type TaskStatus } from "./lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  project_id: string | null;
  due_date: string | null;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  parent_id: string | null;
  created_at: string;
  task_count: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface WoodsStatus {
  mapped: boolean;
  folder_path: string;
  document_count: number;
  last_updated: string;
}

type Tab = "today" | "projects" | "tasks" | "chat" | "innm" | "settings";

/* ------------------------------------------------------------------ */
/*  Tauri-safe invoke wrapper (falls back gracefully in browser)       */
/* ------------------------------------------------------------------ */

async function safeInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T | null> {
  try {
    return await invoke<T>(cmd, args);
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Main App                                                            */
/* ------------------------------------------------------------------ */

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Load initial data
  useEffect(() => {
    (async () => {
      const t = await safeInvoke<Task[]>("get_tasks");
      if (t) setTasks(t);
      const p = await safeInvoke<Project[]>("get_projects");
      if (p) setProjects(p);
    })();
  }, []);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "today", label: "Today", icon: "📅" },
    { id: "projects", label: "Projects", icon: "📁" },
    { id: "tasks", label: "Tasks", icon: "✅" },
    { id: "chat", label: "Chat", icon: "💬" },
    { id: "innm", label: "INNM", icon: "🧠" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <h1>⚡ ZQ Ops Brain v2</h1>
        <span className="header-meta">INNM-WOSDS · Offline Ready</span>
      </header>

      {/* Tab Bar */}
      <nav className="tab-bar">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`tab-btn${activeTab === t.id ? " active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="tab-content">
        {activeTab === "today" && (
          <TodayTab tasks={tasks} setTasks={setTasks} projects={projects} />
        )}
        {activeTab === "projects" && (
          <ProjectsTab
            projects={projects}
            setProjects={setProjects}
            tasks={tasks}
          />
        )}
        {activeTab === "tasks" && (
          <TasksTab tasks={tasks} setTasks={setTasks} projects={projects} />
        )}
        {activeTab === "chat" && <ChatTab />}
        {activeTab === "innm" && <InnmTab />}
        {activeTab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Today Tab                                                           */
/* ------------------------------------------------------------------ */

function TodayTab({
  tasks,
  setTasks,
  projects,
}: {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  projects: Project[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [newDue, setNewDue] = useState(today());
  const [newProject, setNewProject] = useState<string>("");

  const todayTasks = tasks.filter(
    (t) => t.due_date === today() || t.status === "in-progress"
  );

  async function addTask() {
    if (!newTitle.trim()) return;
    const task: Task = {
      id: generateId(),
      title: newTitle.trim(),
      description: "",
      priority: newPriority,
      status: "pending",
      project_id: newProject || null,
      due_date: newDue || null,
      created_at: new Date().toISOString(),
    };
    await safeInvoke("create_task", { task });
    setTasks((prev) => [task, ...prev]);
    setNewTitle("");
    setShowForm(false);
  }

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "completed" ? "pending" : "completed" }
          : t
      )
    );
  }

  return (
    <div>
      <div className="flex" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", marginBottom: 2 }}>Today</h2>
          <p className="text-muted text-sm">{new Date().toDateString()}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          + Add Task
        </button>
      </div>

      {showForm && (
        <div className="card mb-4">
          <p className="card-title">New Task</p>
          <div className="flex flex-col gap-2">
            <input
              className="input"
              placeholder="Task title…"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
            />
            <div className="flex gap-2">
              <select
                className="select"
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as Priority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <input
                type="date"
                className="input"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
              />
              <select
                className="select"
                value={newProject}
                onChange={(e) => setNewProject(e.target.value)}
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary w-full" onClick={addTask}>
                Add
              </button>
              <button
                className="btn btn-secondary w-full"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <p className="card-title">Due Today / In Progress ({todayTasks.length})</p>
        {todayTasks.length === 0 && (
          <p className="text-muted text-sm">No tasks due today 🎉</p>
        )}
        {todayTasks.map((t) => (
          <TaskRow key={t.id} task={t} onToggle={toggleTask} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Projects Tab                                                        */
/* ------------------------------------------------------------------ */

function ProjectsTab({
  projects,
  setProjects,
  tasks,
}: {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  tasks: Task[];
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  function addProject() {
    if (!newName.trim()) return;
    const p: Project = {
      id: generateId(),
      name: newName.trim(),
      description: newDesc.trim(),
      parent_id: null,
      created_at: new Date().toISOString(),
      task_count: 0,
    };
    setProjects((prev) => [...prev, p]);
    setNewName("");
    setNewDesc("");
    setShowForm(false);
  }

  const selectedProject = projects.find((p) => p.id === selected);
  const projectTasks = tasks.filter((t) => t.project_id === selected);

  return (
    <div className="flex gap-3">
      {/* Sidebar */}
      <div style={{ width: 220, flexShrink: 0 }}>
        <div className="flex" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontWeight: 600 }}>Projects</span>
          <button
            className="btn btn-primary"
            style={{ padding: "4px 10px", fontSize: "0.75rem" }}
            onClick={() => setShowForm(!showForm)}
          >
            + New
          </button>
        </div>

        {showForm && (
          <div className="card mb-3">
            <input
              className="input mb-2"
              placeholder="Project name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input
              className="input mb-2"
              placeholder="Description (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
            <div className="flex gap-2">
              <button className="btn btn-primary w-full" onClick={addProject}>
                Create
              </button>
              <button
                className="btn btn-secondary w-full"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="project-tree">
          {projects.map((p) => (
            <div
              key={p.id}
              className={`project-node${selected === p.id ? " selected" : ""}`}
              onClick={() => setSelected(p.id)}
            >
              <span className="project-icon">📁</span>
              <span className="project-name">{p.name}</span>
              <span className="project-count">
                {tasks.filter((t) => t.project_id === p.id).length}
              </span>
            </div>
          ))}
          {projects.length === 0 && (
            <p className="text-muted text-sm">No projects yet</p>
          )}
        </div>
      </div>

      {/* Detail */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {selectedProject ? (
          <div className="card">
            <p className="card-title">📁 {selectedProject.name}</p>
            {selectedProject.description && (
              <p className="text-muted text-sm mb-3">{selectedProject.description}</p>
            )}
            <p className="card-title">Tasks ({projectTasks.length})</p>
            {projectTasks.length === 0 && (
              <p className="text-muted text-sm">No tasks in this project.</p>
            )}
            {projectTasks.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={() => {}} />
            ))}
          </div>
        ) : (
          <div className="card">
            <p className="text-muted">Select a project to view its tasks.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tasks Tab                                                           */
/* ------------------------------------------------------------------ */

function TasksTab({
  tasks,
  setTasks,
  projects,
}: {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  projects: Project[];
}) {
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = tasks.filter((t) => {
    const statusOk = filter === "all" || t.status === filter;
    const searchOk =
      !search || t.title.toLowerCase().includes(search.toLowerCase());
    return statusOk && searchOk;
  });

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "completed" ? "pending" : "completed" }
          : t
      )
    );
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div>
      <div className="flex gap-2 mb-4" style={{ flexWrap: "wrap" }}>
        <input
          className="input"
          style={{ maxWidth: 240 }}
          placeholder="Search tasks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="select"
          style={{ maxWidth: 160 }}
          value={filter}
          onChange={(e) => setFilter(e.target.value as TaskStatus | "all")}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <span className="text-muted text-sm" style={{ alignSelf: "center" }}>
          {filtered.length} task{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="card">
        {filtered.length === 0 && (
          <p className="text-muted text-sm">No tasks match the current filter.</p>
        )}
        {filtered.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            onToggle={toggleTask}
            onDelete={deleteTask}
            showProject
            projects={projects}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chat Tab                                                            */
/* ------------------------------------------------------------------ */

function ChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "sys-1",
      role: "assistant",
      content:
        "Hello! I'm ZQ Ops Brain with INNM-WOSDS integration. Ask me anything or type a command (e.g. 'map woods /path/to/folder').",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await safeInvoke<string>("send_innm_message", {
        message: text,
      });
      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content:
          response ??
          "⚠️ INNM engine not connected. Start the sidecar to enable AI responses.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((m) => (
          <div key={m.id} className={`chat-msg ${m.role}`}>
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="chat-msg assistant">
            <span className="text-muted">INNM is thinking…</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="chat-input-row">
        <input
          className="input"
          placeholder="Message INNM…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          disabled={loading}
        />
        <button
          className="btn btn-primary"
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  INNM Tab                                                            */
/* ------------------------------------------------------------------ */

function InnmTab() {
  const [woodsStatus, setWoodsStatus] = useState<WoodsStatus | null>(null);
  const [folderPath, setFolderPath] = useState("");
  const [mapping, setMapping] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await safeInvoke<WoodsStatus>("get_woods_status");
      if (s) setWoodsStatus(s);
    })();
  }, []);

  async function selectFolder() {
    const path = await safeInvoke<string>("select_folder_dialog");
    if (path) setFolderPath(path);
  }

  async function mapWoods() {
    if (!folderPath.trim()) return;
    setMapping(true);
    try {
      const status = await safeInvoke<WoodsStatus>("map_woods_folder", {
        folderPath: folderPath.trim(),
      });
      if (status) setWoodsStatus(status);
    } finally {
      setMapping(false);
    }
  }

  const matrices = [
    {
      name: "FRONT Matrix",
      description: "Input Processing\nNLP parsing & intent extraction",
      icon: "🔵",
    },
    {
      name: "BACK Matrix",
      description: "Context Validation\nMemory & coherence checking",
      icon: "🟡",
    },
    {
      name: "UP Matrix",
      description: "Response Synthesis\nOutput generation & ranking",
      icon: "🟢",
    },
  ];

  return (
    <div>
      <h2 style={{ fontSize: "1.05rem", marginBottom: 16 }}>
        🧠 INNM-WOSDS Status
      </h2>

      {/* Matrix cards */}
      <div className="innm-grid">
        {matrices.map((m) => (
          <div key={m.name} className="innm-matrix-card">
            <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>{m.icon}</div>
            <h3>{m.name}</h3>
            <p style={{ whiteSpace: "pre-line" }}>{m.description}</p>
          </div>
        ))}
      </div>

      {/* WOODS mapping */}
      <div className="card mb-4">
        <p className="card-title">WOODS Folder Mapping</p>

        {woodsStatus?.mapped && (
          <div
            className="flex gap-2 mb-3"
            style={{ alignItems: "center", flexWrap: "wrap" }}
          >
            <span className="status-dot online" />
            <span className="text-sm">
              Mapped:{" "}
              <span className="text-accent">{woodsStatus.folder_path}</span>
            </span>
            <span className="text-muted text-sm">
              · {woodsStatus.document_count} document
              {woodsStatus.document_count !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        <div className="flex gap-2 mb-2">
          <input
            className="input"
            placeholder="/path/to/woods-folder"
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
          />
          <button className="btn btn-secondary" onClick={selectFolder}>
            Browse
          </button>
        </div>
        <button
          className="btn btn-primary"
          onClick={mapWoods}
          disabled={mapping || !folderPath.trim()}
        >
          {mapping ? "Mapping…" : "Map WOODS Folder"}
        </button>
      </div>

      {/* Engine info */}
      <div className="card">
        <p className="card-title">Engine Status</p>
        <div className="flex flex-col gap-2">
          {[
            { name: "ibox_core", label: "IBox Core" },
            { name: "front_matrix", label: "FRONT Matrix" },
            { name: "back_matrix", label: "BACK Matrix" },
            { name: "up_matrix", label: "UP Matrix" },
            { name: "woods_builder", label: "WOODS Builder" },
          ].map((mod) => (
            <div
              key={mod.name}
              className="flex gap-2"
              style={{ alignItems: "center" }}
            >
              <span className={`status-dot ${woodsStatus?.mapped ? "online" : "offline"}`} />
              <span className="text-sm">{mod.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Settings Tab                                                        */
/* ------------------------------------------------------------------ */

function SettingsTab() {
  const [vaultPassword, setVaultPassword] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [secretValue, setSecretValue] = useState("");
  const [vaultMsg, setVaultMsg] = useState("");
  const [offlineMode, setOfflineMode] = useState(true);

  async function saveSecret() {
    if (!vaultPassword || !secretKey || !secretValue) {
      setVaultMsg("All fields required.");
      return;
    }
    try {
      const { encryptSecret } = await import("./lib/utils");
      const encrypted = await encryptSecret(secretValue, vaultPassword);
      localStorage.setItem(`vault_${secretKey}`, encrypted);
      setVaultMsg(`✅ Secret "${secretKey}" saved to Keyhole Vault.`);
      setSecretKey("");
      setSecretValue("");
    } catch {
      setVaultMsg("❌ Encryption failed.");
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: "1.05rem", marginBottom: 20 }}>⚙️ Settings</h2>

      {/* Keyhole Vault */}
      <div className="settings-section">
        <h3>🔐 Keyhole Vault (AES-256)</h3>
        <div className="card">
          <div className="flex flex-col gap-2">
            <input
              className="input"
              type="password"
              placeholder="Vault password"
              value={vaultPassword}
              onChange={(e) => setVaultPassword(e.target.value)}
            />
            <input
              className="input"
              placeholder="Secret key (e.g. api_key)"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
            />
            <input
              className="input"
              type="password"
              placeholder="Secret value"
              value={secretValue}
              onChange={(e) => setSecretValue(e.target.value)}
            />
            <button className="btn btn-primary" onClick={saveSecret}>
              Store Secret
            </button>
            {vaultMsg && (
              <p className="text-sm" style={{ color: vaultMsg.startsWith("✅") ? "var(--color-low)" : "var(--color-high)" }}>
                {vaultMsg}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* System */}
      <div className="settings-section">
        <h3>System</h3>
        <div className="settings-row">
          <label>Offline Mode</label>
          <input
            type="checkbox"
            checked={offlineMode}
            onChange={(e) => setOfflineMode(e.target.checked)}
          />
        </div>
        <div className="settings-row">
          <label>Version</label>
          <span className="text-muted text-sm">2.0.0</span>
        </div>
        <div className="settings-row">
          <label>Build</label>
          <span className="text-muted text-sm">Tauri 2 · React 18 · INNM-WOSDS</span>
        </div>
      </div>

      {/* INNM Engine */}
      <div className="settings-section">
        <h3>INNM Engine</h3>
        <div className="settings-row">
          <label>Sidecar</label>
          <span className="text-muted text-sm">innm-engine (Python)</span>
        </div>
        <div className="settings-row">
          <label>Supported documents</label>
          <span className="text-muted text-sm">.txt · .md · .csv · .log</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared: TaskRow                                                     */
/* ------------------------------------------------------------------ */

function TaskRow({
  task,
  onToggle,
  onDelete,
  showProject = false,
  projects = [],
}: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete?: (id: string) => void;
  showProject?: boolean;
  projects?: Project[];
}) {
  const projectName = showProject
    ? projects.find((p) => p.id === task.project_id)?.name
    : null;

  return (
    <div className="task-item">
      <input
        type="checkbox"
        className="task-checkbox"
        checked={task.status === "completed"}
        onChange={() => onToggle(task.id)}
      />
      <div className="task-body">
        <p className={`task-title${task.status === "completed" ? " done" : ""}`}>
          {task.title}
        </p>
        <div className="task-meta">
          <span className={`badge badge-${task.priority}`}>{task.priority}</span>
          <span className={`badge badge-${task.status}`}>{task.status}</span>
          {task.due_date && (
            <span className="task-due">📅 {task.due_date}</span>
          )}
          {projectName && (
            <span className="task-due">📁 {projectName}</span>
          )}
        </div>
      </div>
      {onDelete && (
        <div className="task-actions">
          <button
            className="btn btn-danger"
            style={{ padding: "4px 10px", fontSize: "0.75rem" }}
            onClick={() => onDelete(task.id)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
