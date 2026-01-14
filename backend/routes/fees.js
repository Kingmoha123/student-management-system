import express from "express"
import { roleMiddleware } from "../middleware/auth.js"
import Fee from "../models/Fee.js"

const router = express.Router()

// Get all fees (Admin/Accountant)
router.get("/", roleMiddleware(["admin", "accountant"]), async (req, res) => {
    try {
        const fees = await Fee.find()
            .populate({
                path: "studentId",
                populate: { path: "userId", select: "firstName lastName" }
            })
            .sort({ date: -1 })
        res.json(fees)
    } catch (error) {
        console.error("Error in GET /api/fees:", error)
        res.status(500).json({ message: error.message })
    }
})

// Add new fee (Admin/Accountant)
router.post("/", roleMiddleware(["admin", "accountant"]), async (req, res) => {
    try {
        const fee = new Fee(req.body)
        await fee.save()
        await fee.populate({
            path: "studentId",
            populate: { path: "userId", select: "firstName lastName" }
        })
        res.status(201).json(fee)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

// Get fees for a specific student
router.get("/student/:studentId", async (req, res) => {
    try {
        const fees = await Fee.find({ studentId: req.params.studentId }).sort({ date: -1 })
        res.json(fees)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

// Update fee status (Admin/Accountant)
router.put("/:id", roleMiddleware(["admin", "accountant"]), async (req, res) => {
    try {
        const fee = await Fee.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate({
                path: "studentId",
                populate: { path: "userId", select: "firstName lastName" }
            })
        res.json(fee)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

// Delete fee record (Admin only)
router.delete("/:id", roleMiddleware(["admin"]), async (req, res) => {
    try {
        await Fee.findByIdAndDelete(req.params.id)
        res.json({ message: "Fee record deleted" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

export default router
