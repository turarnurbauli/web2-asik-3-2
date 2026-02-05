# TaskManager

## Project Description

TaskManager is a simple and intuitive full-stack web application designed to help users organize, track, and manage their daily tasks efficiently.  
The application now includes a production-ready web interface connected to a Node.js + Express backend and a MongoDB Atlas database.

## Team Members

- **Turar Nurbauli** - Group SE2425
- **Alkhan Almas** - Group SE2425

*Please update this section with your actual team member names and group numbers before submission.*

## Topic Explanation

Task management is a fundamental productivity tool that helps individuals and teams organize their work effectively. This application will allow users to:

- Create and manage personal task lists
- Set priorities and due dates for tasks
- Organize tasks by categories or projects
- Track task completion status
- Search and filter tasks for easy access

The application will evolve from a simple static landing page to a full-featured task management system with database integration, user authentication, and advanced features.

## Deployed Application (Production)

- **Public URL**: https://web2-asik-3-2.onrender.com
- The root route `/` serves the TaskManager web interface with full CRUD functionality.
- Auth is required for write operations (create/update/delete); default admin: **admin@example.com / admin123**.

## Local Setup and Run Instructions

1. Ensure you have **Node.js** installed (version 16 or higher recommended).

2. Clone this project to your local machine:
   ```bash
   git clone https://github.com/turarnurbauli/web2-asik-3-2.git
   cd web2-asik-3-2
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a `.env` file in the project root with:
   ```env
   PORT=3000
   MONGO_URI=your-mongodb-atlas-connection-string
   SESSION_SECRET=your-strong-session-secret
   ```
   - `MONGO_URI` should be a **MongoDB Atlas** connection string (do not commit `.env` to GitHub).
   - `SESSION_SECRET` is used by `express-session` to sign cookies.

5. Start the server:
   ```bash
   npm start
   ```

6. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

7. From the home page (`/`) you can:
- Login (default admin: **admin@example.com / admin123**)
- Create a new task using the form (auth required)
- Edit an existing task (auth required)
- Delete a task (auth required)
- See data loaded dynamically from the backend API and stored in MongoDB Atlas

## Project Structure

```
project-root/
├── public/
│   ├── style.css          # CSS styling for the application and tasks UI
│   └── app.js             # Frontend logic (CRUD via fetch to /api/tasks)
├── views/
│   ├── index.html         # Landing page (Home)
│   ├── about.html         # About page
│   ├── contact.html       # Contact form page
│   ├── search.html        # Search results page
│   ├── item.html          # Item details page
│   └── 404.html           # 404 error page
├── server.js              # Main Express server file (API + pages + MongoDB connection)
├── package.json           # Node.js dependencies and project metadata
├── messages.json          # JSON file storing contact form submissions (auto-created)
└── README.md              # Project documentation
```

## Development Roadmap

### Week 1 - Project Setup & Landing Page ✅
- Express.js server setup
- Basic project structure
- Landing page with project information
- Basic CSS styling

### Week 2-3 - Routing and Forms ✅
- Implement GET routes: /, /about, /contact
- Create contact form with name, email, and message fields
- Implement POST route for form submission
- Add client-side form validation
- Save form submissions to JSON file (bonus feature)
- Create 404 error page
- Consistent navigation across all pages

### Week 3-4 - Server-side Request Handling ✅
- Custom logger middleware (logs HTTP method + URL)
- Query parameters: /search?q=...
- Route parameters: /item/:id
- JSON API endpoint: /api/info
- Server-side validation (returns 400 for missing parameters)
- Enhanced error handling

### Week 3 - Database Integration
- Set up database (MongoDB or PostgreSQL)
- Connect application to database
- Store and retrieve tasks from database
- Implement data persistence

### Week 4 - CRUD Operations
- Complete Create, Read, Update, Delete operations for tasks
- Enhanced user interface
- Task editing functionality
- Task deletion with confirmation

### Week 5 - Advanced Features & Polish
- Task filtering and search
- Priority and category management
- User authentication (optional)
- Final UI/UX improvements
- Testing and bug fixes

## Routes

### Basic Routes
- **GET /** - Home page with TaskManager CRUD UI (table + form)
- **GET /about** - About page (team information and project details)
- **GET /contact** - Contact page (displays contact form)
- **POST /contact** - Handles form submissions from the contact page
- **404** - Error page for unknown routes

### Assignment 2 / 3 Part 1 Routes
- **GET /search?q=...** - Search page with query parameter
  - Query parameter: `q` (required)
  - Example: `/search?q=task`
  - Returns 400 if query parameter is missing
  
- **GET /item/:id** - Item details page with route parameter
  - Route parameter: `id` (required)
  - Example: `/item/123` or `/item/task-001`
  - Returns 400 if route parameter is missing
  
- **GET /api/info** - API endpoint returning project information in JSON format
  - Returns JSON object with project details, team info, routes, and technologies

### Assignment 3 Part 2 API Routes (CRUD)
- **GET /api/tasks** - Get all tasks (loaded into UI table)
- **POST /api/tasks** - Create a new task (called from form)
- **PUT /api/tasks/:id** - Update an existing task
- **DELETE /api/tasks/:id** - Delete a task

### Authentication & Sessions
- **POST /api/login** — issues session on valid credentials; uses bcrypt to verify password.
- **POST /api/logout** — destroys session.
- **GET /api/me** — returns current session user.
- Session cookie: `sid`, HttpOnly; Secure when `NODE_ENV=production`; no sensitive data stored in cookie.
- Default admin (seeded): **admin@example.com / admin123**.

## Environment Variables

- **LOCAL (.env, not committed to GitHub)**:
  - `PORT` – local port for development (e.g. `3000`)
  - `MONGO_URI` – MongoDB Atlas connection string
  - `SESSION_SECRET` – secret for signing sessions

- **PRODUCTION (Render → Settings → Environment)**:
  - `MONGO_URI` – the same Atlas connection string (required)
  - `PORT` – provided by Render automatically; server uses `process.env.PORT || 3000`
  - `SESSION_SECRET` – set a strong secret value for sessions

- `.env` is listed in `.gitignore` and is **never pushed** to GitHub.

## Local vs Production Differences

- **Local**:
  - Server runs on `http://localhost:3000`
  - Environment variables come from `.env`
  - MongoDB Atlas must allow your local IP in Network Access

- **Production (Render)**:
  - Public URL: https://web2-asik-3-2.onrender.com
  - Environment variables configured in Render dashboard (not from `.env`)
  - MongoDB Atlas must allow Render IPs (e.g. `0.0.0.0/0` for testing)

## Form Features

The contact form includes:
- **Name field** - Required, minimum 2 characters
- **Email field** - Required, email format validation
- **Message field** - Required, minimum 10 characters, maximum 1000 characters
- **Client-side validation** - Real-time validation before form submission
- **Server-side processing** - Form data is logged and saved to `messages.json`
- **Success response** - User-friendly confirmation page after submission

## Technologies Used

- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB Atlas** - Cloud database for storing tasks
- **Mongoose** - ODM for working with MongoDB
- **HTML5** - Markup language for structure
- **CSS3** - Styling and layout
- **JavaScript** - Client-side logic and API calls (`fetch`)

## Features

### Middleware
- **express.static()** - Serves static files from public directory
- **express.urlencoded()** - Parses form data from POST requests
- **Custom Logger** - Logs HTTP method and URL for every request

### Request Handling
- **Query Parameters** - `/search?q=term` demonstrates `req.query`
- **Route Parameters** - `/item/:id` demonstrates `req.params`
- **Server-side Validation** - Returns HTTP 400 for missing required parameters
- **JSON API Endpoint** - `/api/info` returns structured JSON data

### Error Handling
- Custom 400 error pages for validation failures
- 404 page for unknown routes
- Proper HTTP status codes

## Bonus Features Implemented

✅ **Client-side form validation** - Real-time validation with error messages
✅ **JSON file storage** - Form submissions are saved to `messages.json` file
✅ **Character counter** - Shows character count for message field
✅ **Error styling** - Visual feedback for invalid form fields
✅ **Responsive design** - Works on mobile and desktop devices

## Future Enhancements

- User authentication and personal accounts
- Task reminders and notifications
- Team collaboration features
- Mobile responsive design improvements
- Dark mode theme
- Task statistics and analytics
- Export/import functionality
- Email notifications for form submissions

## License

This project is created for educational purposes as part of the Web Development course.


