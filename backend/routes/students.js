import express from "express"
import { roleMiddleware } from "../middleware/auth.js"
import Student from "../models/Student.js"

const router = express.Router()

router.post("/", roleMiddleware(["admin", "teacher"]), async (req, res) => {
  try {
    const student = new Student(req.body)
    await student.save()
    await student.populate("userId classId parentId")
    res.status(201).json(student)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get("/", async (req, res) => {
  try {
    const students = await Student.find().populate("userId classId parentId").populate({
      path: "userId",
      select: "firstName lastName email",
    })
    res.json(students)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get("/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate("userId classId parentId")
    if (!student) {
      return res.status(404).json({ message: "Student not found" })
    }
    res.json(student)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.put("/:id", roleMiddleware(["admin", "teacher"]), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate(
      "userId classId parentId",
    )
    res.json(student)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.delete("/:id", roleMiddleware(["admin"]), async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id)
    res.json({ message: "Student deleted" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get("/class/:classId", async (req, res) => {
  try {
    const students = await Student.find({ classId: req.params.classId }).populate("userId classId")
    res.json(students)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
