import express from "express"
import { roleMiddleware } from "../middleware/auth.js"
import Attendance from "../models/Attendance.js"

const router = express.Router()

router.post("/", roleMiddleware(["teacher", "admin"]), async (req, res) => {
  try {
    const { studentId, classId, date, status, remarks } = req.body

    // Attempt to update existing or create new (upsert)
    const attendance = await Attendance.findOneAndUpdate(
      { studentId, classId, date: new Date(date) },
      { status, remarks },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate({
      path: "studentId",
      populate: { path: "userId", select: "firstName lastName" },
    })

    res.status(201).json(attendance)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get("/", async (req, res) => {
  try {
    const attendance = await Attendance.find()
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "firstName lastName" },
      })
      .populate("classId", "name")
      .sort({ createdAt: -1 })
    res.json(attendance)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get("/class/:classId", async (req, res) => {
  try {
    const attendance = await Attendance.find({ classId: req.params.classId }).populate({
      path: "studentId",
      populate: { path: "userId", select: "firstName lastName" },
    })
    res.json(attendance)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get("/student/:studentId", async (req, res) => {
  try {
    const attendance = await Attendance.find({ studentId: req.params.studentId }).populate("classId", "name")
    res.json(attendance)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get attendance stats for a student
router.get("/stats/student/:studentId", async (req, res) => {
  try {
    const total = await Attendance.countDocuments({ studentId: req.params.studentId })
    const present = await Attendance.countDocuments({
      studentId: req.params.studentId,
      status: { $in: ["present", "late"] } // Counting late as present for now, or we can separate
    })

    // Simple calculation: Status 'present' or 'late' counts as present. 'absent'/'excused' as absent.
    // Or maybe just 'present'. Let's stick strictly to 'present' if strict, but schools often count late as present.
    // Let's count "present" and "late" as Attended.

    const percentage = total === 0 ? 0 : Math.round((present / total) * 100)

    res.json({
      total,
      present,
      percentage
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.put("/:id", roleMiddleware(["teacher", "admin"]), async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(attendance)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
