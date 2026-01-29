const API_URL = '/api/tasks';

const taskForm = document.getElementById('taskForm');
const taskIdInput = document.getElementById('taskId');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const statusSelect = document.getElementById('status');
const tasksBody = document.getElementById('tasksBody');
const tasksEmptyMessage = document.getElementById('tasksEmptyMessage');
const formTitle = document.getElementById('form-title');
const cancelEditBtn = document.getElementById('cancelEditBtn');

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
    status: statusSelect.value
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
    if (!res.ok) throw new Error('Failed to delete task');
    await fetchTasks();
  } catch (err) {
    console.error(err);
    alert('Error deleting task');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchTasks();
});

