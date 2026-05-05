Project Management Web App (MERN Stack)

A full-stack web application that allows users to create projects, assign tasks, and track progress with role-based access control (Admin / Member).


FEATURES

Authentication
- User Signup & Login
- JWT-based authentication
- Secure password hashing

Project & Team Management
- Create and manage projects
- Add/remove team members
- Assign roles (Admin / Member)

Task Management
- Create tasks
- Assign tasks to users
- Update task status (Pending / In Progress / Completed)
- Set deadlines

Dashboard
- View all tasks
- Track task status
- Highlight overdue tasks


TECH STACK

Frontend:
- React.js
- Axios
- CSS / Tailwind

Backend:
- Node.js
- Express.js

Database:
- MongoDB (Mongoose)


REQUIREMENTS

- RESTful APIs
- Proper schema relationships
- Input validation
- Role-based access control
- Secure routes and error handling


FOLDER STRUCTURE

project-root/

client/          -> React frontend
server/          -> Node.js backend
  models/        -> Database schemas
  routes/        -> API routes
  controllers/   -> Business logic
  middleware/    -> Authentication & validation

.env
package.json
README.txt


ROLE-BASED ACCESS

Admin:
- Create projects
- Manage team
- Assign tasks

Member:
- View projects
- Update assigned tasks


API ENDPOINTS (Sample)

Auth:
POST /api/auth/signup
POST /api/auth/login

Projects:
GET /api/projects
POST /api/projects
PUT /api/projects/:id

Tasks:
POST /api/tasks
GET /api/tasks
PUT /api/tasks/:id


SECURITY

- JWT authentication
- Protected routes
- Password hashing (bcrypt)
- Input validation


DEPLOYMENT

Frontend: Vercel
Backend: Render / Railway / VPS
Database: MongoDB Atlas


FUTURE IMPROVEMENTS

- Real-time updates (WebSockets)
- Email notifications
- File attachments
- Activity logs
- Better mobile UI


LICENSE

MIT License
