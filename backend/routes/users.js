import express from "express"
import { roleMiddleware } from "../middleware/auth.js"
import User from "../models/User.js"
import bcrypt from "bcryptjs"

const router = express.Router()

router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("-password")
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.put("/:id", async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" })
    }

    const updateData = { ...req.body }

    // If password is being updated, hash it
    if (updateData.password) {
      if (updateData.password.trim() === '') {
        delete updateData.password
      } else {
        const salt = await bcrypt.genSalt(10)
        updateData.password = await bcrypt.hash(updateData.password, salt)
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select("-password")
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.delete("/:id", roleMiddleware(["admin"]), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id)
    res.json({ message: "User deleted" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
