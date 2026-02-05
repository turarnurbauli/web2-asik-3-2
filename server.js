require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();

// ====== ENV & DB CONFIG ======
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-session-secret-change-me';

if (!MONGO_URI) {
  console.warn('Warning: MONGO_URI is not set. MongoDB connection will fail in production.');
}

mongoose
  .connect(MONGO_URI, {})
  .then(async () => {
    console.log('MongoDB connected');
    await seedTasksIfNeeded();
    await ensureAdminUser();
  })
  .catch((err) => console.error('MongoDB connection error:', err));

// ====== MIDDLEWARE ======
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ====== SESSION CONFIG ======
// Нужен trust proxy, чтобы Secure-cookie работали за прокси (Render)
app.set('trust proxy', 1);

app.use(
  session({
    name: 'sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGO_URI,
      collectionName: 'sessions',
      ttl: 60 * 60 * 24 * 7 // 7 days
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
  })
);

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ====== TASK MODEL (CRUD DOMAIN) ======
const taskSchema = new mongoose.Schema(
  {
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

const Task = mongoose.model('Task', taskSchema);

// ====== USER MODEL ======
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    name: { type: String, trim: true },
    role: { type: String, enum: ['admin', 'user'], default: 'admin' }
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

// ====== TASK VALIDATION (simple manual) ======
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

// ====== AUTH HELPERS ======
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ====== TASK SEED DATA (20 realistic records) ======
const seedTasksData = [
  { title: 'Подготовить презентацию', description: 'Слайды для итоговой защиты', status: 'in-progress', priority: 'high', category: 'Учёба', assignee: 'Turar', dueDate: '2026-02-05', tags: ['slides', 'defense'] },
  { title: 'Написать README', description: 'Описать установку и деплой', status: 'pending', priority: 'medium', category: 'Документация', assignee: 'Alkhan', tags: ['docs'] },
  { title: 'Проверить CRUD UI', description: 'Создание/редактирование/удаление задач', status: 'pending', priority: 'high', category: 'Тесты', assignee: 'Turar', tags: ['ui', 'qa'] },
  { title: 'Настроить Render env', description: 'Добавить MONGO_URI в переменные', status: 'done', priority: 'critical', category: 'Деплой', assignee: 'Turar', tags: ['deploy'] },
  { title: 'Добавить auth middleware', description: 'Защита POST/PUT/DELETE', status: 'pending', priority: 'high', category: 'Безопасность', assignee: 'Alkhan', tags: ['auth', 'security'] },
  { title: 'Хеширование пароля', description: 'bcrypt для пользователей', status: 'pending', priority: 'high', category: 'Безопасность', assignee: 'Turar', tags: ['password', 'bcrypt'] },
  { title: 'Создать тестового админа', description: 'admin@example.com / admin123', status: 'pending', priority: 'medium', category: 'Учёба', assignee: 'Alkhan', tags: ['seed', 'user'] },
  { title: 'Валидация задач', description: 'Проверка обязательных полей', status: 'in-progress', priority: 'medium', category: 'Код', assignee: 'Turar', tags: ['validation'] },
  { title: 'Логирование ошибок', description: 'Без падений на неверных данных', status: 'pending', priority: 'medium', category: 'Код', assignee: 'Turar' },
  { title: 'Обновить DEFENSE.md', description: 'Добавить шаги по сессиям', status: 'pending', priority: 'medium', category: 'Документация', assignee: 'Alkhan', tags: ['defense'] },
  { title: 'Добавить категории задач', description: 'Категории Учёба/Деплой/Код', status: 'pending', priority: 'low', category: 'Идеи', assignee: 'Turar' },
  { title: 'Проверить cookie флаги', description: 'HttpOnly и Secure в проде', status: 'pending', priority: 'high', category: 'Безопасность', assignee: 'Alkhan', tags: ['cookie'] },
  { title: 'UI поля приоритет/дата', description: 'Добавить в форму и таблицу', status: 'pending', priority: 'medium', category: 'UI', assignee: 'Turar', tags: ['ui'] },
  { title: 'Тест на мобильном', description: 'Проверить адаптивность', status: 'pending', priority: 'low', category: 'Тесты', assignee: 'Alkhan' },
  { title: 'Настроить сессии', description: 'express-session + MongoStore', status: 'pending', priority: 'critical', category: 'Безопасность', assignee: 'Turar', tags: ['session'] },
  { title: 'Проверить сетевые правила Atlas', description: '0.0.0.0/0 для Render', status: 'done', priority: 'medium', category: 'Деплой', assignee: 'Turar', tags: ['atlas'] },
  { title: 'Генерик ошибки авторизации', description: 'Сообщение Invalid credentials', status: 'pending', priority: 'medium', category: 'Безопасность', assignee: 'Alkhan' },
  { title: 'HTTP коды на API', description: '400/401/500 по стандарту', status: 'pending', priority: 'medium', category: 'Код', assignee: 'Turar', tags: ['http'] },
  { title: 'Создать демо-теги', description: 'tags: deploy, ui, docs', status: 'pending', priority: 'low', category: 'Данные', assignee: 'Alkhan' },
  { title: 'Проверить статус done', description: 'Закрыть задачи после проверки', status: 'pending', priority: 'low', category: 'Учёба', assignee: 'Turar' }
];

async function seedTasksIfNeeded() {
  const count = await Task.countDocuments();
  if (count >= 20) return;
  // избежать дубликатов по title
  const existingTitles = new Set((await Task.find({}, 'title')).map((t) => t.title));
  const toInsert = seedTasksData.filter((t) => !existingTitles.has(t.title));
  if (toInsert.length) {
    await Task.insertMany(toInsert);
    console.log(`Seeded ${toInsert.length} tasks`);
  }
}

async function ensureAdminUser() {
  const existing = await User.findOne({ email: 'admin@example.com' });
  if (existing) return;
  const passwordHash = await bcrypt.hash('admin123', 10);
  await User.create({
    email: 'admin@example.com',
    passwordHash,
    name: 'Admin User',
    role: 'admin'
  });
  console.log('Seeded admin user: admin@example.com / admin123');
}

// ====== API ROUTES (CRUD) ======
// Auth: login
app.post('/api/login', async (req, res) => {
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

// Auth: logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.status(204).end();
  });
});

// Auth: session info
app.get('/api/me', (req, res) => {
  if (!req.session.user) {
    return res.status(200).json({ user: null });
  }
  res.json({ user: req.session.user });
});

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Create task
app.post('/api/tasks', requireAuth, async (req, res) => {
  try {
    const { errors, value } = validateTaskPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    const task = await Task.create(value);
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to create task' });
  }
});

// Update task
app.put('/api/tasks/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { errors, value } = validateTaskPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    const task = await Task.findByIdAndUpdate(id, value, {
      new: true,
      runValidators: true
    });
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
app.delete('/api/tasks/:id', requireAuth, async (req, res) => {
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

// ====== PAGES ======
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});


app.get('/about', (req, res) => {
  res.sendFile(__dirname + '/views/about.html');
});


app.get('/contact', (req, res) => {
  res.sendFile(__dirname + '/views/contact.html');
});


app.post('/contact', (req, res) => {
  
  const { name, email, message } = req.body;
  
  
  if (!name || !email || !message) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error - TaskManager</title>
        <link rel="stylesheet" href="/style.css">
      </head>
      <body>
        <header>
          <nav>
            <div class="logo">
              <h1>TaskManager</h1>
            </div>
            <ul class="nav-links">
              <li><a href="/">Home</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </nav>
        </header>
        <main>
          <div class="error-message">
            <h2>Error 400: Bad Request</h2>
            <p>Please fill in all required fields (name, email, message).</p>
            <a href="/contact" class="btn-primary">Back to Contact Form</a>
          </div>
        </main>
      </body>
      </html>
    `);
  }
  
  
  console.log('Form data received:', req.body);
  
  
  const contactData = {
    name: name,
    email: email,
    message: message,
    timestamp: new Date().toISOString()
  };
  
  
  const dataFilePath = path.join(__dirname, 'messages.json');
  
  
  let messages = [];
  if (fs.existsSync(dataFilePath)) {
    try {
      const data = fs.readFileSync(dataFilePath, 'utf8');
      messages = JSON.parse(data);
    } catch (error) {
      console.error('Error reading messages file:', error);
    }
  }
  
  
  messages.push(contactData);
  
  
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(messages, null, 2), 'utf8');
    console.log('Message saved to messages.json');
  } catch (error) {
    console.error('Error saving message:', error);
  }
  
  
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thank You - TaskManager</title>
      <link rel="stylesheet" href="/style.css">
    </head>
    <body>
      <header>
        <nav>
          <div class="logo">
            <h1>TaskManager</h1>
          </div>
          <ul class="nav-links">
            <li><a href="/">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </nav>
      </header>
      <main>
        <div class="success-message">
          <h2>Thank you, ${name}!</h2>
          <p>Your message has been received successfully.</p>
          <p>We will get back to you at <strong>${email}</strong> as soon as possible.</p>
          <a href="/" class="btn-primary">Return to Home</a>
        </div>
      </main>
    </body>
    </html>
  `);
});




app.get('/search', (req, res) => {
  const query = req.query.q; 
  
  
  if (!query || query.trim() === '') {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error - TaskManager</title>
        <link rel="stylesheet" href="/style.css">
      </head>
      <body>
        <header>
          <nav>
            <div class="logo">
              <h1>TaskManager</h1>
            </div>
            <ul class="nav-links">
              <li><a href="/">Home</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </nav>
        </header>
        <main>
          <div class="error-message">
            <h2>Error 400: Bad Request</h2>
            <p>Missing required query parameter 'q'.</p>
            <p>Usage: <code>/search?q=your_search_term</code></p>
            <a href="/" class="btn-primary">Return to Home</a>
          </div>
        </main>
      </body>
      </html>
    `);
  }
  
  
  res.sendFile(__dirname + '/views/search.html');
});


app.get('/item/:id', (req, res) => {
  const itemId = req.params.id; 
  
  
  if (!itemId || itemId.trim() === '') {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error - TaskManager</title>
        <link rel="stylesheet" href="/style.css">
      </head>
      <body>
        <header>
          <nav>
            <div class="logo">
              <h1>TaskManager</h1>
            </div>
            <ul class="nav-links">
              <li><a href="/">Home</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </nav>
        </header>
        <main>
          <div class="error-message">
            <h2>Error 400: Bad Request</h2>
            <p>Missing required route parameter 'id'.</p>
            <p>Usage: <code>/item/:id</code></p>
            <a href="/" class="btn-primary">Return to Home</a>
          </div>
        </main>
      </body>
      </html>
    `);
  }
  
  
  res.sendFile(__dirname + '/views/item.html');
});


app.get('/api/info', (req, res) => {
  
  res.json({
    project: {
      name: 'TaskManager',
      version: '2.0.0',
      description: 'A simple and intuitive web application for task management',
      team: [
        {
          name: 'Turar Nurbauli',
          group: 'SE2425',
          role: 'Developer & Project Manager'
        },
        {
          name: 'Alkhan Almas',
          group: 'SE2425',
          role: 'Developer & UI/UX Designer'
        }
      ],
      technologies: [
        'Node.js',
        'Express.js',
        'HTML5',
        'CSS3',
        'JavaScript'
      ],
      routes: [
        { method: 'GET', path: '/', description: 'Home page' },
        { method: 'GET', path: '/about', description: 'About page' },
        { method: 'GET', path: '/contact', description: 'Contact form page' },
        { method: 'POST', path: '/contact', description: 'Submit contact form' },
        { method: 'GET', path: '/search?q=...', description: 'Search with query parameter' },
        { method: 'GET', path: '/item/:id', description: 'Item details by ID' },
        { method: 'GET', path: '/api/info', description: 'Project information (JSON)' }
      ],
      timestamp: new Date().toISOString()
    }
  });
});


app.use((req, res) => {
  res.status(404).sendFile(__dirname + '/views/404.html');
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));