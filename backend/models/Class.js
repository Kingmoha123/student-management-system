import mongoose from "mongoose"

const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  academicYear: {
    type: String,
    required: true,
  },
  section: String,
  maxCapacity: {
    type: Number,
    default: 30,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model("Class", classSchema)
