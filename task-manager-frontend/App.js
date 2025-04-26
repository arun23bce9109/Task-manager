import React, { useState, useEffect } from 'react';
import './App.css';

const API = 'http://localhost:5000/api';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const login = async () => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
    }
  };

  const register = async () => {
    await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ username, password })
    });
    login();
  };

  const loadTasks = async () => {
    const res = await fetch(`${API}/tasks`, { headers });
    const data = await res.json();
    setTasks(data);
  };

  const addTask = async () => {
    const res = await fetch(`${API}/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title: newTask })
    });
    const data = await res.json();
    setTasks([...tasks, data]);
    setNewTask('');
  };

  const toggleComplete = async (id, completed) => {
    const res = await fetch(`${API}/tasks/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ completed: !completed })
    });
    const updated = await res.json();
    setTasks(tasks.map(t => (t._id === id ? updated : t)));
  };

  const deleteTask = async (id) => {
    await fetch(`${API}/tasks/${id}`, {
      method: 'DELETE',
      headers
    });
    setTasks(tasks.filter(t => t._id !== id));
  };

  useEffect(() => {
    if (token) loadTasks();
  }, [token]);

  if (!token) {
    return (
      <div className="auth-form">
        <h2>Login or Register</h2>
        <input aria-label="Username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
        <input aria-label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
        <button onClick={login}>Login</button>
        <button onClick={register}>Register</button>
      </div>
    );
  }

  return (
    <div className="app">
      <h1>📝 Task Manager</h1>
      <div className="add-task">
        <input
          aria-label="New Task Title"
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          placeholder="Add new task..."
        />
        <button onClick={addTask}>Add</button>
        <button onClick={() => { localStorage.removeItem('token'); setToken(null); }}>Logout</button>
      </div>
      <ul aria-label="Task List">
        {tasks.map(task => (
          <li key={task._id} className="task-item">
            <input
              aria-label={`Mark ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleComplete(task._id, task.completed)}
            />
            <span style={{ textDecoration: task.completed ? 'line-through' : 'none' }}>
              {task.title}
            </span>
            <button onClick={() => deleteTask(task._id)} aria-label={`Delete ${task.title}`}>❌</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
