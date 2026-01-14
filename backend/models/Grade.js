import mongoose from "mongoose"

const gradeSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  assignmentScore: {
    type: Number,
    default: 0,
  },
  examScore: {
    type: Number,
    default: 0,
  },
  projectScore: {
    type: Number,
    default: 0,
  },
  overallScore: Number,
  grade: String,
  academicTerm: String,
  comments: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model("Grade", gradeSchema)
