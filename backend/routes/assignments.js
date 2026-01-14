import express from "express"
import { roleMiddleware } from "../middleware/auth.js"
import Assignment from "../models/Assignment.js"
import AssignmentSubmission from "../models/AssignmentSubmission.js"

const router = express.Router()

router.post("/", roleMiddleware(["teacher", "admin"]), async (req, res) => {
  try {
    const assignment = new Assignment(req.body)
    await assignment.save()
    await assignment.populate("classId teacherId")
    res.status(201).json(assignment)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get("/", async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate("teacherId", "firstName lastName")
      .populate("classId", "name")
      .sort({ createdAt: -1 })
    res.json(assignments)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get("/class/:classId", async (req, res) => {
  try {
    const assignments = await Assignment.find({ classId: req.params.classId }).populate(
      "teacherId",
      "firstName lastName",
    )
    res.json(assignments)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.post("/submit/:assignmentId", roleMiddleware(["student"]), async (req, res) => {
  try {
    const submission = new AssignmentSubmission({
      assignmentId: req.params.assignmentId,
      studentId: req.body.studentId,
      submissionFile: req.body.submissionFile,
      submissionText: req.body.submissionText,
    })
    await submission.save()
    res.status(201).json(submission)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get("/submissions/:assignmentId", roleMiddleware(["teacher", "admin"]), async (req, res) => {
  try {
    const submissions = await AssignmentSubmission.find({ assignmentId: req.params.assignmentId }).populate(
      "studentId",
      "firstName lastName",
    )
    res.json(submissions)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
