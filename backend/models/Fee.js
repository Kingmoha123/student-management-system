import mongoose from "mongoose"

const feeSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: ["Tuition", "Uniform", "Transportation", "Exams", "Library", "Other"],
    },
    date: {
        type: Date,
        default: Date.now,
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ["Cash", "Bank Transfer", "Card", "Online"],
    },
    status: {
        type: String,
        required: true,
        enum: ["Paid", "Pending", "Overdue"],
        default: "Paid",
    },
    remarks: String,
    transactionId: {
        type: String,
        unique: true,
        sparse: true,
    },
    academicYear: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

export default mongoose.model("Fee", feeSchema)
