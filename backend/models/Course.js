import mongoose from "mongoose"

const courseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
    },
    credits: {
        type: Number,
        required: true,
        default: 3,
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

export default mongoose.model("Course", courseSchema)
