import express from "express"
import jwt from "jsonwebtoken"
import { body, validationResult } from "express-validator"
import User from "../models/User.js"
import Student from "../models/Student.js"

import { authMiddleware, roleMiddleware } from "../middleware/auth.js"

const router = express.Router()

router.post(
  "/register",
  authMiddleware,
  roleMiddleware(["admin"]),
  [
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
    body("firstName").notEmpty(),
    body("lastName").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    try {
      const { email, password, firstName, lastName, role } = req.body

      let user = await User.findOne({ email })
      if (user) {
        return res.status(400).json({ message: "User already exists" })
      }

      // Check if admin already exists if role is admin
      if (role === "admin") {
        const adminExists = await User.findOne({ role: "admin" })
        if (adminExists) {
          return res.status(400).json({ message: "An admin already exists. Multiple admins are not allowed." })
        }
      }

      user = new User({
        email,
        password,
        firstName,
        lastName,
        role: role || "student",
      })

      await user.save()

      // If registered as student, create a student profile
      if (user.role === "student") {
        const enrollmentNumber = `STU${Date.now()}${Math.floor(Math.random() * 1000)}`
        const newStudent = new Student({
          userId: user._id,
          enrollmentNumber: enrollmentNumber,
          status: 'enrolled'
        })
        await newStudent.save()
      }

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "7d" },
      )

      res.json({
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      })
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  },
)

router.post("/login", [body("email").isEmail(), body("password").notEmpty()], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" },
    )

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post("/forgot-password", [body("email").isEmail()], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  try {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      // For security reasons, don't reveal if user exists or not
      return res.json({ message: "If an account with that email exists, a password reset link has been sent." })
    }

    // In a real app, we would generate a token and send an email here.
    console.log(`[SIMULATED EMAIL] Password reset requested for: ${email}`)

    res.json({ message: "If an account with that email exists, a password reset link has been sent." })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
