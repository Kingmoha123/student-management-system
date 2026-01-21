import mongoose from "mongoose"

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  subject: String,
  dueDate: {
    type: Date,
    required: true,
  },
  totalPoints: {
    type: Number,
    default: 100,
  },
  questions: [
    {
      questionText: { type: String, required: true },
      type: { type: String, enum: ['short-answer', 'multiple-choice'], default: 'short-answer' },
      options: [String], // for multiple choice
      correctAnswer: String,
      points: Number
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model("Assignment", assignmentSchema)
