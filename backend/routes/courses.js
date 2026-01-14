import express from "express"
import { body, validationResult } from "express-validator"
import { authMiddleware, roleMiddleware } from "../middleware/auth.js"
import Course from "../models/Course.js"

const router = express.Router()

router.use(authMiddleware)

// Get all courses (with optional classId filter)
router.get("/", async (req, res) => {
    try {
        const query = {}
        if (req.query.classId) {
            query.classId = req.query.classId
        }
        const courses = await Course.find(query)
            .populate("teacherId", "firstName lastName email")
            .populate("classId", "name section")
        res.json(courses)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

// Create a course (Admin only)
router.post(
    "/",
    roleMiddleware(["admin"]),
    [
        body("name").notEmpty(),
        body("code").notEmpty(),
        body("credits").isNumeric(),
        body("classId").notEmpty().withMessage("Class is required"),
    ],
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        try {
            const { name, code, description, credits, teacherId, classId } = req.body

            const courseData = {
                name,
                code,
                description,
                credits,
                classId
            }
            // Only add teacherId if it's a valid value (not empty string)
            if (teacherId) {
                courseData.teacherId = teacherId
            }

            const course = new Course(courseData)

            await course.save()
            const populatedCourse = await Course.findById(course._id)
                .populate("teacherId", "firstName lastName email")
                .populate("classId", "name section")
            res.json(populatedCourse)
        } catch (error) {
            res.status(500).json({ message: error.message })
        }
    }
)

// Update a course
router.put("/:id", roleMiddleware(["admin"]), async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate("teacherId", "firstName lastName email")
            .populate("classId", "name section")
        res.json(course)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

// Delete a course
router.delete("/:id", roleMiddleware(["admin"]), async (req, res) => {
    try {
        await Course.findByIdAndDelete(req.params.id)
        res.json({ message: "Course deleted" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

export default router
