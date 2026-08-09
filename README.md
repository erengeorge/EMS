Simple Employee Management System

A full-stack Employee Management System developed using React, Node.js, Express.js, and Microsoft SQL Server.

- JWT-based authentication
- bcrypt password hashing
- Protected REST API
- Employee CRUD operations
  - Create
  - Retrieve
  - Update
  - Delete
- Employee reporting
- PDF report generation
- Responsive user interface

Programs Used:
Frontend | React, Vite, JavaScript, CSS |
Backend | Node.js, Express.js |
Database | Microsoft SQL Server |
Authentication | JWT, bcrypt |
PDF Generation | jsPDF |
Development | Nodemon |
Version Control | Git, GitHub |

Structure:
EMS/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── .env.example
│   └── server.js
├── frontend/
│   └── src/
├── EMS.sql
└── README.md

1. Configuration
  Create backend/.env based on backend/.env.example.
  DB_SERVER=localhost
  DB_DATABASE=EMS
  DB_USER=emsadmin
  DB_PASSWORD=admin123
  DB_PORT=1433
  JWT_SECRET=ems_super_secret_key_2026

2. Database Setup
  The project includes EMS.sql, which creates and initializes the EMS database.
  The script creates:
  Users table
  Employees table
  emsadmin SQL Server login
  emsadmin database user
  Initial application account
  Initial employee record

3. Application Login
  Username: emsadmin
  Password: admin123

4. Running the Application
  4.1 Clone of Fork the repository
      git clone <repository-url>
      cd EMS
  4.2 Import the database
  4.3 Configure the backend
      create backend/.env
  4.4 Install backend dependencies
      cd backend
      npm install
  4.5 Start the backend
      npx nodemon server.js
      (The API runs on: http://localhost:5000)
  4.6 Install frontend dependencies
      cd frontend
      npm install
  4.7 Start the frontend
      npm run dev
  4.8 Login
      The employee endpoints are protected using JWT authentication.

5. API Endpoints
  Authentication
    POST /api/auth/login
  Employees
    GET    /api/employees
    POST   /api/employees
    PUT    /api/employees/:id
    DELETE /api/employees/:id
    GET    /api/employees/report

6. Reporting
  The system provides an employee report containing:

  Total employees
  Total salary
  Average salary
  Employee details

  The report can also be exported as a PDF through the frontend.

7. Authentication Flow
  React Login
      ↓
  POST /api/auth/login
      ↓
  Express Authentication Controller
      ↓
  bcrypt Password Verification
      ↓
  JWT Generation
      ↓
  Protected Employee API
      ↓
  JWT Middleware
      ↓
  SQL Server

8. Application Tutorial
  8.1 Login using the credentials above.
  8.2 Fill up the form to add an employee (All fields are required).
  8.3 Click employee name/photo to view the employee's full information.
  8.4 Click Edit to modify employee informations.
  8.5 Click Delete to delete employee.
  8.6 Click Generate Report to show the overall system report and Download PDF to export.

CHALLENGES ENCOUNTERED
Configuring the Node.js backend to communicate with Microsoft SQL Server

VERSION CONTROL
This exam is maintained using Git and hosted on Github


Through this project, I realized that this technology stack feels more practical and flexible for me compared with PHP. I know I still have a lot to learn, and I am willing to continue improving my skills and gain more experience with React, Node.js, Express.js, and related technologies.
I developed this project while learning how the different components of a modern web application work together, particularly React, Express.js, REST APIs, authentication, and Microsoft SQL Server. I also used AI as a learning and development aid during the process, which helped me understand concepts and troubleshoot issues as I built the system.

