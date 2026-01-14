# Student Management System (SMS)

A comprehensive full-stack application for managing students, classes, attendance, grades, assignments, and communication. Built with Next.js, Express, and MongoDB.

## Features

### 8 Core Modules

1. **Authentication & User Management**
   - Role-based access control (Admin, Teacher, Student, Parent)
   - Secure login/registration with JWT tokens
   - User profile management

2. **Student Management**
   - Enrollment tracking
   - Student information management
   - Grade tracking and status monitoring
   - Link students to classes and parents

3. **Class Management**
   - Create and manage classes
   - Assign teachers to classes
   - Track class capacity
   - Academic year and section management

4. **Attendance Management**
   - Record daily attendance
   - Track attendance by class and student
   - Multiple attendance statuses (Present, Absent, Late, Excused)
   - Add remarks to attendance records

5. **Grade Management**
   - Record grades across multiple components (Assignment, Exam, Project)
   - Calculate overall scores
   - Track academic terms
   - Add teacher comments

6. **Assignment Management**
   - Create and distribute assignments
   - Set due dates and point values
   - Student submission tracking
   - Teacher feedback and scoring

7. **Class Management**
   - View class details
   - Track class capacity
   - Manage class structure

8. **Parent Communication & Notifications**
   - Send messages to students, teachers, and parents
   - Message types: Direct messages, Notifications, Announcements
   - Message inbox with read status tracking

## Tech Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **UI**: React with Tailwind CSS v4
- **State Management**: React Context API
- **HTTP Client**: Native Fetch API
- **Styling**: Tailwind CSS with semantic design tokens

### Backend
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Security**: bcryptjs
- **Input Validation**: express-validator
- **CORS**: Enabled for cross-origin requests

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout with Auth Provider
│   ├── page.tsx                # Redirect to login
│   ├── globals.css             # Global styles and design tokens
│   ├── login/                  # Login page
│   ├── register/               # Registration page
│   ├── dashboard/              # Main dashboard
│   ├── users/                  # User management (Admin only)
│   ├── profile/                # User profile page
│   ├── students/               # Student management
│   ├── classes/                # Class management
│   ├── attendance/             # Attendance tracking
│   ├── grades/                 # Grade management
│   ├── assignments/            # Assignment management
│   └── communication/          # Messaging system
├── context/
│   └── AuthContext.tsx         # Authentication context
├── components/
│   ├── ProtectedRoute.tsx      # Auth-protected wrapper
│   └── Sidebar.tsx             # Navigation sidebar
├── lib/
│   └── api.ts                  # API utility functions
└── backend/
    ├── server.js               # Express server entry point
    ├── middleware/
    │   └── auth.js             # JWT authentication middleware
    ├── models/
    │   ├── User.js
    │   ├── Student.js
    │   ├── Class.js
    │   ├── Attendance.js
    │   ├── Grade.js
    │   ├── Assignment.js
    │   ├── AssignmentSubmission.js
    │   └── Communication.js
    └── routes/
        ├── auth.js             # Authentication endpoints
        ├── users.js            # User management endpoints
        ├── students.js         # Student management endpoints
        ├── classes.js          # Class management endpoints
        ├── attendance.js       # Attendance endpoints
        ├── grades.js           # Grade endpoints
        ├── assignments.js      # Assignment endpoints
        └── communication.js    # Communication endpoints
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd student-management-system
   ```

2. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Configure Environment Variables**

   Create `.env.local` in the root directory:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

   Create `backend/.env`:
   ```
   MONGODB_URI=mongodb://localhost:27017/sms
   JWT_SECRET=your-jwt-secret-key-change-in-production
   PORT=5000
   NODE_ENV=development
   ```

### Running the Application

#### Option 1: Run Both Frontend and Backend (Development)

**Terminal 1 - Frontend (Port 3000):**
```bash
npm run dev
```

**Terminal 2 - Backend (Port 5000):**
```bash
cd backend
npm start
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

#### Option 2: Production Build

**Build Frontend:**
```bash
npm run build
npm run start
```

**Build Backend:**
```bash
cd backend
npm run build  # if applicable
npm start
```

## Default Test Credentials

After registering users in the application, you can test with:

- **Admin Account**: Register with role "Admin"
- **Teacher Account**: Register with role "Teacher"
- **Student Account**: Register with role "Student"
- **Parent Account**: Register with role "Parent"

## API Documentation

### Authentication Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### User Routes
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

### Student Routes
- `POST /api/students` - Create student (Admin/Teacher)
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `PUT /api/students/:id` - Update student (Admin/Teacher)
- `DELETE /api/students/:id` - Delete student (Admin only)

### Class Routes
- `POST /api/classes` - Create class (Admin only)
- `GET /api/classes` - Get all classes
- `GET /api/classes/:id` - Get class by ID
- `PUT /api/classes/:id` - Update class (Admin only)

### Attendance Routes
- `POST /api/attendance` - Record attendance (Teacher/Admin)
- `GET /api/attendance/class/:classId` - Get attendance by class
- `GET /api/attendance/student/:studentId` - Get attendance by student
- `PUT /api/attendance/:id` - Update attendance (Teacher/Admin)

### Grade Routes
- `POST /api/grades` - Create grade (Teacher/Admin)
- `GET /api/grades/student/:studentId` - Get grades by student
- `GET /api/grades/class/:classId` - Get grades by class
- `PUT /api/grades/:id` - Update grade (Teacher/Admin)

### Assignment Routes
- `POST /api/assignments` - Create assignment (Teacher/Admin)
- `GET /api/assignments/class/:classId` - Get assignments by class
- `POST /api/assignments/submit/:assignmentId` - Submit assignment (Student)
- `GET /api/assignments/submissions/:assignmentId` - Get submissions (Teacher/Admin)

### Communication Routes
- `POST /api/communication` - Send message
- `GET /api/communication/inbox/:userId` - Get inbox messages
- `PUT /api/communication/:id` - Mark message as read

## Features in Detail

### Authentication
- JWT-based authentication with 7-day expiration
- Password hashing with bcryptjs
- Role-based access control at API and UI levels
- Secure session management with localStorage

### Student Management
- Complete student profiles with enrollment numbers
- Link students to classes and parent accounts
- Track enrollment status (Enrolled, Suspended, Graduated)
- Monitor average grades per student

### Attendance System
- Daily attendance recording
- Multiple status options per student
- Class-level and student-level attendance reports
- Remarks for special attendance cases

### Grade Management
- Multi-component grading (Assignment, Exam, Project)
- Automatic overall score calculation
- Academic term tracking
- Teacher comments on performance

### Assignment System
- Create assignments with due dates
- Student submission tracking
- Score and feedback from teachers
- Assignment submission history

### Communication
- Direct messaging between users
- System notifications
- Announcements (broadcast to multiple recipients)
- Message read status tracking

## Design & UI

- **Color Scheme**: Professional blue primary color with semantic colors (success, warning, error, info)
- **Typography**: Geist font family (sans and mono)
- **Responsive Design**: Mobile-first approach with breakpoints for tablet and desktop
- **Dark Mode Support**: Full dark mode implementation with CSS custom properties

## Security Features

- JWT authentication with expiration
- Password hashing with bcryptjs
- Role-based access control (RBAC)
- Input validation on both frontend and backend
- CORS configuration for API access
- Protected routes with authentication checks

## Future Enhancements

- Email notifications for important events
- Parent portal with student progress tracking
- Advanced analytics and reporting
- File upload for assignments and documents
- Calendar view for events and deadlines
- SMS notifications
- Two-factor authentication
- Advanced permission management

## Deployment

### Deploy Frontend to Vercel
```bash
vercel
```

### Deploy Backend to Railway/Render
1. Push code to GitHub
2. Connect repository to Railway or Render
3. Set environment variables
4. Deploy

### MongoDB Deployment
- Use MongoDB Atlas for cloud-hosted database
- Update `MONGODB_URI` in backend `.env`

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running locally or provide valid MongoDB Atlas URI
- Check `MONGODB_URI` in backend `.env`

### API Connection Error
- Ensure backend is running on port 5000
- Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`
- Verify CORS is enabled in backend

### Authentication Issues
- Clear browser localStorage
- Ensure `JWT_SECRET` is set in backend `.env`
- Check token expiration (default 7 days)

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues, questions, or suggestions, please open an issue in the repository.
