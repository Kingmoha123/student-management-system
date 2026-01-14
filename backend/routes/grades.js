import express from "express"
import { roleMiddleware } from "../middleware/auth.js"
import Grade from "../models/Grade.js"

const router = express.Router()

router.post("/", roleMiddleware(["teacher", "admin"]), async (req, res) => {
  try {
    const grade = new Grade(req.body)
    grade.overallScore = (grade.assignmentScore + grade.examScore + grade.projectScore) / 3

    if (req.body.grade) {
      grade.grade = req.body.grade
    } else {
      if (grade.overallScore >= 90) grade.grade = 'A'
      else if (grade.overallScore >= 80) grade.grade = 'B'
      else if (grade.overallScore >= 70) grade.grade = 'C'
      else if (grade.overallScore >= 60) grade.grade = 'D'
      else grade.grade = 'F'
    }

    await grade.save()
    await grade.populate("studentId classId")
    res.status(201).json(grade)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get("/student/:studentId", async (req, res) => {
  try {
    const grades = await Grade.find({ studentId: req.params.studentId }).populate("classId", "name")
    res.json(grades)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.get("/class/:classId", async (req, res) => {
  try {
    const grades = await Grade.find({ classId: req.params.classId }).populate("studentId", "firstName lastName")
    res.json(grades)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.put("/:id", roleMiddleware(["teacher", "admin"]), async (req, res) => {
  try {
    // const grade = await Grade.findByIdAndUpdate(req.params.id, req.body, { new: true })
    // We need to recalculate score and grade, so we find, update fields, and save.
    let grade = await Grade.findById(req.params.id)
    if (!grade) return res.status(404).json({ message: "Grade not found" })

    Object.assign(grade, req.body)

    // Recalculate
    grade.overallScore = (grade.assignmentScore + grade.examScore + grade.projectScore) / 3

    if (req.body.grade) {
      grade.grade = req.body.grade
    } else {
      if (grade.overallScore >= 90) grade.grade = 'A'
      else if (grade.overallScore >= 80) grade.grade = 'B'
      else if (grade.overallScore >= 70) grade.grade = 'C'
      else if (grade.overallScore >= 60) grade.grade = 'D'
      else grade.grade = 'F'
    }

    await grade.save()
    res.json(grade)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.delete("/:id", roleMiddleware(["teacher", "admin"]), async (req, res) => {
  try {
    await Grade.findByIdAndDelete(req.params.id)
    res.json({ message: "Grade deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
