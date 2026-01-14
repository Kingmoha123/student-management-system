# Getting Started with Student Management System

## Quick Start (5 minutes)

### Prerequisites
- Node.js 18+ installed
- MongoDB running locally (or MongoDB Atlas account)

### Step 1: Clone & Install
```bash
# Clone repository
git clone <your-repo-url>
cd student-management-system

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Step 2: Configure
Create `backend/.env`:
```
MONGODB_URI=mongodb://localhost:27017/sms
JWT_SECRET=your-super-secret-key-min-32-chars-long
PORT=5000
```

Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Step 3: Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# Should see: "Server running on port 5000"
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# Should see: "Ready in X.XXs"
```

### Step 4: Access Application
- Open [http://localhost:3000](http://localhost:3000)
- Click "Register here" to create an account
- Select role: Admin, Teacher, Student, or Parent
- Start exploring!

## First Steps in the Application

### 1. Admin Setup
- Register as Admin
- Go to Users → Add User (create teacher and student accounts)
- Go to Classes → Create Class (assign teacher)

### 2. Teacher Actions
- Register as Teacher
- View assigned classes
- Record attendance
- Create assignments
- Enter grades

### 3. Student Actions
- Register as Student
- View classes and assignments
- Submit assignments
- Check grades

### 4. Parent Actions
- Register as Parent
- Send messages to teachers
- View student information

## Common Tasks

### Create a New Class
1. Login as Admin
2. Navigate to Classes
3. Click "Create Class"
4. Select teacher and fill details
5. Click "Create Class"

### Record Student Attendance
1. Login as Teacher
2. Go to Attendance
3. Select class
4. Click "Record Attendance"
5. Select students and status
6. Save

### Create an Assignment
1. Login as Teacher
2. Go to Assignments
3. Click "Create Assignment"
4. Fill title, description, due date
5. Students can then submit

### Check Student Grades
1. Login as Teacher/Student
2. Go to Grades
3. View grades by subject and term

## File Structure Overview

```
student-management-system/
├── app/                 # Next.js pages and layouts
├── components/          # Reusable React components
├── context/            # React Context for auth
├── lib/                # Utility functions
├── backend/            # Express.js API server
└── public/             # Static files
```

## Troubleshooting

### "Cannot connect to MongoDB"
- Ensure MongoDB is running: `mongod`
- Or update `MONGODB_URI` to MongoDB Atlas

### "API connection failed"
- Check backend is running on port 5000
- Verify `NEXT_PUBLIC_API_URL` is correct

### "Page shows 404"
- Make sure you're logged in
- Check browser console for errors

### "Button doesn't work"
- Check browser console (F12 → Console tab)
- Make sure backend is running

## Next Steps

- Customize theme colors in `app/globals.css`
- Add more fields to student profiles
- Implement file uploads for assignments
- Add email notifications
- Deploy to production (see DEPLOYMENT.md)

## Need Help?

- Check README.md for full documentation
- Review code comments in components
- Check browser console for error messages
- Verify all environment variables are set correctly

Happy managing!
