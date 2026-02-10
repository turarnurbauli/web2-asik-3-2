const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'done'],
      default: 'pending'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    dueDate: { type: Date },
    category: { type: String, trim: true, maxlength: 100 },
    assignee: { type: String, trim: true, maxlength: 120 },
    tags: { type: [String], default: [], validate: (arr) => arr.length <= 10 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);

