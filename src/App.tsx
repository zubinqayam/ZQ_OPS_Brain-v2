import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import './App.css';

interface Task {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  project?: string;
  completed: boolean;
}

interface WoodsNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: WoodsNode[];
}

export default function App() {
  const [activeTab, setActiveTab] = useState('today');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([]);
  const [woodsData, setWoodsData] = useState<WoodsNode | null>(null);
  const [matrixStatus, setMatrixStatus] = useState({front: false, back: false, up: false});
  const [vaultKey, setVaultKey] = useState('');

  useEffect(() => {
    loadTasks();
    loadProjects();
  }, []);

  const loadTasks = async () => {
    try {
      const result = await invoke<Task[]>('get_tasks');
      setTasks(result);
    } catch (e) {
      console.error('Failed to load tasks:', e);
    }
  };

  const loadProjects = async () => {
    try {
      const result = await invoke<string[]>('get_projects');
      setProjects(result);
    } catch (e) {
      console.error('Failed to load projects:', e);
    }
  };

  const handleToggleTask = async (id: string) => {
    await invoke('toggle_task', { id });
    loadTasks();
  };

  const handleCreateTask = async (title: string, priority: string) => {
    await invoke('create_task', { title, priority, dueDate: null });
    loadTasks();
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    setChatHistory(prev => [...prev, {role: 'user', content: chatInput}]);
    
    try {
      const response = await invoke<string>('send_innm_message', { message: chatInput });
      setChatHistory(prev => [...prev, {role: 'innm', content: response}]);
      
      // Update matrix status
      const status = await invoke<{front: boolean, back: boolean, up: boolean}>('get_matrix_status');
      setMatrixStatus(status);
    } catch (e) {
      console.error('INNM Error:', e);
    }
    
    setChatInput('');
  };

  const handleMapWoods = async () => {
    try {
      const selected = await open({ directory: true });
      if (selected) {
        await invoke('map_woods_folder', { folderPath: selected as string });
        const status = await invoke<WoodsNode>('get_woods_status');
        setWoodsData(status);
      }
    } catch (e) {
      console.error('WOODS mapping failed:', e);
    }
  };

  const renderTab = () => {
    switch(activeTab) {
      case 'today':
        return (
          <div className="tab-content">
            <h2>Today</h2>
            <div className="task-list">
              {tasks.filter(t => !t.completed).map(task => (
                <div key={task.id} className={`task-card priority-${task.priority}`}>
                  <input type="checkbox" checked={task.completed} 
                         onChange={() => handleToggleTask(task.id)} />
                  <span>{task.title}</span>
                  {task.dueDate && <span className="due-date">{task.dueDate}</span>}
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'chat':
        return (
          <div className="tab-content chat-interface">
            <div className="chat-history">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role}`}>
                  <div className="bubble">{msg.content}</div>
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input 
                value={chatInput} 
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask INNM..."
              />
              <button onClick={handleSendMessage}>Send</button>
            </div>
          </div>
        );
      
      case 'innm':
        return (
          <div className="tab-content">
            <h2>INNM-WOSDS Core</h2>
            <div className="matrix-visualization">
              <div className={`matrix-node ${matrixStatus.front ? 'active' : ''}`}>
                <h3>FRONT</h3>
                <p>Input Processing</p>
              </div>
              <div className={`matrix-node ${matrixStatus.back ? 'active' : ''}`}>
                <h3>BACK</h3>
                <p>Context Validation</p>
              </div>
              <div className={`matrix-node ${matrixStatus.up ? 'active' : ''}`}>
                <h3>UP</h3>
                <p>Response Synthesis</p>
              </div>
            </div>
            <button onClick={handleMapWoods}>Map WOODS Folder</button>
            {woodsData && (
              <div className="woods-tree">
                <pre>{JSON.stringify(woodsData, null, 2)}</pre>
              </div>
            )}
          </div>
        );
      
      case 'settings':
        return (
          <div className="tab-content">
            <h2>Keyhole Vault</h2>
            <div className="vault-section">
              <input 
                type="password" 
                placeholder="Enter encryption key..."
                value={vaultKey}
                onChange={(e) => setVaultKey(e.target.value)}
              />
              <button onClick={() => invoke('initialize_vault', { key: vaultKey })}>
                Initialize Vault
              </button>
            </div>
          </div>
        );
      
      default:
        return <div className="tab-content">Tab under construction</div>;
    }
  };

  return (
    <div className="app-container">
      <nav className="sidebar">
        <div className="logo">ZQ Ops Brain</div>
        {['today', 'projects', 'tasks', 'chat', 'innm', 'settings'].map(tab => (
          <button 
            key={tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>
      <main className="main-content">
        {renderTab()}
      </main>
    </div>
  );
}
