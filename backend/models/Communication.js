import mongoose from "mongoose"

const communicationSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  subject: String,
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["message", "notification", "announcement"],
    default: "message",
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model("Communication", communicationSchema)
