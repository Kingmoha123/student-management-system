import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import authRoutes from "./routes/auth.js"
import userRoutes from "./routes/users.js"
import studentRoutes from "./routes/students.js"
import classRoutes from "./routes/classes.js"
import attendanceRoutes from "./routes/attendance.js"
import gradeRoutes from "./routes/grades.js"
import assignmentRoutes from "./routes/assignments.js"
import communicationRoutes from "./routes/communication.js"
import feeRoutes from "./routes/fees.js"
import courseRoutes from "./routes/courses.js"
import { authMiddleware } from "./middleware/auth.js"

dotenv.config()

const app = express()

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  process.env.FRONTEND_URL,
].filter(Boolean)

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)

    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.some(allowed => origin?.startsWith(allowed))) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/sms_db_s")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err))

// Routes
app.get("/api/status", (req, res) => res.json({ status: "ok", version: "1.2", time: new Date() }))
app.use("/api/auth", authRoutes)
app.use("/api/users", authMiddleware, userRoutes)
app.use("/api/students", authMiddleware, studentRoutes)
app.use("/api/classes", authMiddleware, classRoutes)
app.use("/api/attendance", authMiddleware, attendanceRoutes)
app.use("/api/grades", authMiddleware, gradeRoutes)
app.use("/api/assignments", authMiddleware, assignmentRoutes)
app.use("/api/communication", authMiddleware, communicationRoutes)
app.use("/api/fees", authMiddleware, feeRoutes)
app.use("/api/courses", authMiddleware, courseRoutes)

const PORT = process.env.PORT || 5003
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`)
})
