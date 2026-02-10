const isValidStatus = (v) => ['pending', 'in-progress', 'done'].includes(v);
const isValidPriority = (v) => ['low', 'medium', 'high', 'critical'].includes(v);

function validateTaskPayload(body) {
  const errors = [];
  const title = (body.title || '').trim();
  const description = (body.description || '').trim();
  const status = (body.status || 'pending').trim();
  const priority = (body.priority || 'medium').trim();
  const category = (body.category || '').trim();
  const assignee = (body.assignee || '').trim();
  const tags = Array.isArray(body.tags)
    ? body.tags.map((t) => String(t).trim()).filter(Boolean)
    : (body.tags ? String(body.tags).split(',').map((t) => t.trim()).filter(Boolean) : []);

  if (!title || title.length < 2 || title.length > 120) {
    errors.push('Title must be 2-120 characters.');
  }
  if (description.length > 2000) {
    errors.push('Description is too long (max 2000).');
  }
  if (!isValidStatus(status)) {
    errors.push('Invalid status.');
  }
  if (!isValidPriority(priority)) {
    errors.push('Invalid priority.');
  }
  if (category.length > 100) {
    errors.push('Category is too long (max 100).');
  }
  if (assignee.length > 120) {
    errors.push('Assignee is too long (max 120).');
  }
  if (tags.length > 10) {
    errors.push('Too many tags (max 10).');
  }

  let dueDate = null;
  if (body.dueDate) {
    const parsed = new Date(body.dueDate);
    if (Number.isNaN(parsed.getTime())) {
      errors.push('Invalid dueDate.');
    } else {
      dueDate = parsed;
    }
  }

  return {
    errors,
    value: {
      title,
      description,
      status,
      priority,
      category,
      assignee,
      tags,
      ...(dueDate ? { dueDate } : {})
    }
  };
}

function validateUserPayload(body) {
  const errors = [];
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  const name = (body.name || '').trim();

  if (!email) {
    errors.push('Email is required.');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Invalid email format.');
  }

  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters.');
  }

  return {
    errors,
    value: {
      email,
      password,
      name
    }
  };
}

module.exports = {
  validateTaskPayload,
  validateUserPayload
};

