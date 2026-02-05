const API_URL = '/api/tasks';

const taskForm = document.getElementById('taskForm');
const taskIdInput = document.getElementById('taskId');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const statusSelect = document.getElementById('status');
const prioritySelect = document.getElementById('priority');
const dueDateInput = document.getElementById('dueDate');
const categoryInput = document.getElementById('category');
const assigneeInput = document.getElementById('assignee');
const tagsInput = document.getElementById('tags');
const tasksBody = document.getElementById('tasksBody');
const tasksEmptyMessage = document.getElementById('tasksEmptyMessage');
const formTitle = document.getElementById('form-title');
const cancelEditBtn = document.getElementById('cancelEditBtn');

const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const logoutBtn = document.getElementById('logoutBtn');
const authStatus = document.getElementById('authStatus');
const authError = document.getElementById('authError');

let currentUser = null;

async function fetchTasks() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Failed to load tasks');
    const tasks = await res.json();
    renderTasks(tasks);
  } catch (err) {
    console.error(err);
    alert('Error loading tasks from server.');
  }
}

async function fetchMe() {
  try {
    const res = await fetch('/api/me');
    const data = await res.json();
    currentUser = data.user;
    updateAuthUI();
  } catch (err) {
    console.error(err);
    currentUser = null;
    updateAuthUI();
  }
}

function renderTasks(tasks) {
  tasksBody.innerHTML = '';

  if (!tasks.length) {
    tasksEmptyMessage.style.display = 'block';
    return;
  }

  tasksEmptyMessage.style.display = 'none';

  tasks.forEach((task) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(task.title)}</td>
      <td>${escapeHtml(task.description || '')}</td>
      <td>
        <span class="status-pill status-${task.status}">
          ${task.status}
        </span>
      </td>
      <td>${escapeHtml(task.priority || '')}</td>
      <td>${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ''}</td>
      <td>${escapeHtml(task.category || '')}</td>
      <td>${escapeHtml(task.assignee || '')}</td>
      <td>${escapeHtml((task.tags || []).join(', '))}</td>
      <td>${new Date(task.createdAt).toLocaleString()}</td>
      <td>
        <button class="btn-small btn-edit" data-id="${task._id}">Edit</button>
        <button class="btn-small btn-delete" data-id="${task._id}">Delete</button>
      </td>
    `;
    tasksBody.appendChild(tr);
  });

  // Attach events after rendering
  document.querySelectorAll('.btn-edit').forEach((btn) => {
    btn.addEventListener('click', () => startEditTask(btn.dataset.id));
  });
  document.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', () => deleteTask(btn.dataset.id));
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = taskIdInput.value;
  const payload = {
    title: titleInput.value.trim(),
    description: descriptionInput.value.trim(),
    status: statusSelect.value,
    priority: prioritySelect.value,
    dueDate: dueDateInput.value,
    category: categoryInput.value.trim(),
    assignee: assigneeInput.value.trim(),
    tags: tagsInput.value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
  };

  if (!payload.title) {
    alert('Title is required');
    return;
  }

  try {
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/${id}` : API_URL;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        throw new Error('Unauthorized: please login first');
      }
      throw new Error(data.error || 'Request failed');
    }

    resetForm();
    await fetchTasks();
  } catch (err) {
    console.error(err);
    alert('Error saving task: ' + err.message);
  }
});

async function startEditTask(id) {
  try {
    const res = await fetch(API_URL);
    const tasks = await res.json();
    const task = tasks.find((t) => t._id === id);
    if (!task) {
      alert('Task not found');
      return;
    }

    taskIdInput.value = task._id;
    titleInput.value = task.title;
    descriptionInput.value = task.description || '';
    statusSelect.value = task.status;
    prioritySelect.value = task.priority || 'medium';
    categoryInput.value = task.category || '';
    assigneeInput.value = task.assignee || '';
    dueDateInput.value = task.dueDate ? task.dueDate.slice(0, 10) : '';
    tagsInput.value = (task.tags || []).join(', ');

    formTitle.textContent = 'Edit Task';
    cancelEditBtn.style.display = 'inline-block';
  } catch (err) {
    console.error(err);
    alert('Error starting edit');
  }
}

cancelEditBtn.addEventListener('click', () => {
  resetForm();
});

function resetForm() {
  taskIdInput.value = '';
  titleInput.value = '';
  descriptionInput.value = '';
  statusSelect.value = 'pending';
  formTitle.textContent = 'Create New Task';
  cancelEditBtn.style.display = 'none';
}

async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  try {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      if (res.status === 401) throw new Error('Unauthorized: please login first');
      throw new Error('Failed to delete task');
    }
    await fetchTasks();
  } catch (err) {
    console.error(err);
    alert('Error deleting task: ' + err.message);
  }
}

// ====== AUTH HANDLERS ======
function updateAuthUI() {
  if (currentUser) {
    authStatus.textContent = `Logged in as ${currentUser.email}`;
    logoutBtn.style.display = 'inline-block';
  } else {
    authStatus.textContent = 'Not logged in';
    logoutBtn.style.display = 'none';
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.textContent = '';
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: loginEmail.value.trim(),
        password: loginPassword.value
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    currentUser = { email: data.email, role: data.role, name: data.name };
    updateAuthUI();
    await fetchTasks();
  } catch (err) {
    console.error(err);
    authError.textContent = err.message;
  }
});

logoutBtn.addEventListener('click', async () => {
  try {
    await fetch('/api/logout', { method: 'POST' });
    currentUser = null;
    updateAuthUI();
  } catch (err) {
    console.error(err);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  fetchMe().then(fetchTasks);
});

