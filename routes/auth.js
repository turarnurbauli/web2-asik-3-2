const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { validateUserPayload } = require('../utils/validation');

const router = express.Router();

// signup (registration)
router.post('/signup', async (req, res) => {
  try {
    const { errors, value } = validateUserPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    const existing = await User.findOne({ email: value.email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered. Use Login instead.' });
    }
    const passwordHash = await bcrypt.hash(value.password, 10);
    const user = await User.create({
      email: value.email,
      passwordHash,
      name: value.name,
      role: 'user'
    });
    req.session.user = { id: user._id.toString(), email: user.email, role: user.role, name: user.name };
    res.status(201).json({ email: user.email, role: user.role, name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// login
router.post('/login', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await User.findOne({ email });
    const passwordOk = user && (await bcrypt.compare(password, user.passwordHash));
    if (!user || !passwordOk) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    req.session.user = { id: user._id.toString(), email: user.email, role: user.role, name: user.name };
    res.json({ email: user.email, role: user.role, name: user.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.status(204).end();
  });
});

// current user
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(200).json({ user: null });
  }
  res.json({ user: req.session.user });
});

module.exports = router;

