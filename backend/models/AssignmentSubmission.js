import mongoose from "mongoose"

const submissionSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment",
    required: true,
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  submissionFile: String,
  submissionText: String,
  submittedDate: {
    type: Date,
    default: Date.now,
  },
  score: Number,
  feedback: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model("AssignmentSubmission", submissionSchema)
