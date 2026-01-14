import express from "express"
import Communication from "../models/Communication.js"

const router = express.Router()

// Send a message
router.post("/send", async (req, res) => {
  try {
    const communication = new Communication(req.body)
    await communication.save()
    await communication.populate("senderId recipientId")
    res.status(201).json(communication)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get messages for the logged-in user
router.get("/inbox", async (req, res) => {
  try {
    const messages = await Communication.find({ recipientId: req.user.id })
      .populate("senderId", "firstName lastName email")
      .sort({ createdAt: -1 })
    res.json(messages)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

router.put("/:id", async (req, res) => {
  try {
    const communication = await Communication.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(communication)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
