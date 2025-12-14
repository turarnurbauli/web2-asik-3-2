# TaskManager

## Project Description

TaskManager is a simple and intuitive web application designed to help users organize, track, and manage their daily tasks efficiently. This application provides a clean and user-friendly interface for creating, editing, and managing tasks with features such as due dates, priorities, and task categorization. Built with Node.js and Express.js, TaskManager aims to help users stay productive and never miss an important deadline.

## Team Members

- **Nurbauli Turar** - Group SE2425
- **Alkhan Almas** - Group SE2425


## Topic Explanation

Task management is a fundamental productivity tool that helps individuals and teams organize their work effectively. This application will allow users to:

- Create and manage personal task lists
- Set priorities and due dates for tasks
- Organize tasks by categories or projects
- Track task completion status
- Search and filter tasks for easy access

The application will evolve from a simple static landing page to a full-featured task management system with database integration, user authentication, and advanced features.

## Installation Instructions

1. Ensure you have Node.js installed on your system (version 14 or higher recommended).

2. Clone or download this project to your local machine.

3. Open a terminal/command prompt in the project directory.

4. Install dependencies:
   ```bash
   npm install
   ```

5. Start the server:
   ```bash
   node server.js
   ```

6. Open your web browser and navigate to:
   ```
   http://localhost:3000
   ```

## Project Structure

```
project-root/
├── public/
│   └── style.css          # CSS styling for the application
├── views/
│   └── index.html         # Landing page
├── server.js              # Main Express server file
├── package.json           # Node.js dependencies and project metadata
└── README.md              # Project documentation
```

## Development Roadmap

### d 1 - Project Setup & Landing Page ✅
- Express.js server setup
- Basic project structure
- Landing page with project information
- Basic CSS styling

### d 2 - Forms & POST Routes
- Create task form
- Implement POST route for task creation
- Form validation
- Task display on the page

### d 3 - Database Integration
- Set up database (MongoDB or PostgreSQL)
- Connect application to database
- Store and retrieve tasks from database
- Implement data persistence

### d 4 - CRUD Operations
- Complete Create, Read, Update, Delete operations for tasks
- Enhanced user interface
- Task editing functionality
- Task deletion with confirmation

### d 5 - Advanced Features & Polish
- Task filtering and search
- Priority and category management
- User authentication (optional)
- Final UI/UX improvements
- Testing and bug fixes

## Technologies Used

- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **HTML5** - Markup language for structure
- **CSS3** - Styling and layout

## Future Enhancements

- User authentication and personal accounts
- Task reminders and notifications
- Team collaboration features
- Mobile responsive design improvements
- Dark mode theme
- Task statistics and analytics
- Export/import functionality


