require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { connectDB } = require('./config/db');
const authRouter = require('./routes/auth');
const tasksRouter = require('./routes/tasks');
const { attachUserIfExists } = require('./middleware/auth');

const app = express();

// ====== ENV & DB CONFIG ======
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-session-secret-change-me';

if (!MONGO_URI) {
  console.warn('Warning: MONGO_URI is not set. MongoDB connection will fail in production.');
}

connectDB(MONGO_URI).catch((err) => console.error('MongoDB connection error:', err));

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

app.use(attachUserIfExists);

// ====== API ROUTES (modular) ======
app.use('/api', authRouter);
app.use('/api/tasks', tasksRouter);

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