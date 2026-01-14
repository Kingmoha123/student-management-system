import express from "express"
import { roleMiddleware } from "../middleware/auth.js"
import Class from "../models/Class.js"

const router = express.Router()

router.post("/", roleMiddleware(["admin"]), async (req, res) => {
  try {
    const classData = new Class(req.body)
    await classData.save()
    await classData.populate("teacherId")
    res.status(201).json(classData)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get("/", async (req, res) => {
  try {
    const classes = await Class.find().populate("teacherId", "firstName lastName email")
    res.json(classes)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get("/:id", async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id).populate("teacherId")
    if (!classData) {
      return res.status(404).json({ message: "Class not found" })
    }
    res.json(classData)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.put("/:id", roleMiddleware(["admin"]), async (req, res) => {
  try {
    const classData = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("teacherId")
    res.json(classData)
  } catch (error) {
    console.error("Error updating class:", error)
    res.status(500).json({ message: error.message })
  }
})

router.delete("/:id", roleMiddleware(["admin"]), async (req, res) => {
  try {
    await Class.findByIdAndDelete(req.params.id)
    res.json({ message: "Class deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
