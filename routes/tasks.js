const express = require('express');
const Task = require('../models/Task');
const { requireAuth, enforceOwnershipOrAdmin } = require('../middleware/auth');
const { validateTaskPayload } = require('../utils/validation');

const router = express.Router();

// Get tasks (ownership-aware, с пагинацией)
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10));
    const filter = {};
    if (req.user && req.user.role !== 'admin') {
      filter.owner = req.user.id;
    }
    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Task.countDocuments(filter)
    ]);
    res.json({ tasks, total, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create task
router.post('/', requireAuth, async (req, res) => {
  try {
    const { errors, value } = validateTaskPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    const task = await Task.create({ ...value, owner: req.user.id });
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to create task' });
  }
});

// middleware для проверки владения задачей или роли admin
const canModifyTask = enforceOwnershipOrAdmin(async (req) => {
  const task = await Task.findById(req.params.id, 'owner');
  return task && task.owner;
});

// Update task
router.put('/:id', requireAuth, canModifyTask, async (req, res) => {
  try {
    const { id } = req.params;
    const { errors, value } = validateTaskPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    const task = await Task.findByIdAndUpdate(
      id,
      { ...value, owner: req.user.id },
      {
        new: true,
        runValidators: true
      }
    );
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// Delete task
router.delete('/:id', requireAuth, canModifyTask, async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;


