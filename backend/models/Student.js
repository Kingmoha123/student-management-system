import mongoose from "mongoose"

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  enrollmentNumber: {
    type: String,
    required: true,
    unique: true,
  },
  dateOfBirth: Date,
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  enrollmentDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["enrolled", "suspended", "graduated"],
    default: "enrolled",
  },
  averageGrade: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model("Student", studentSchema)
