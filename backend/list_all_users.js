import mongoose from "mongoose";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/student-management-system");
        console.log("Connected to MongoDB");

        const users = await User.find({}, "email firstName lastName role");
        console.log("Users in database:");
        users.forEach(u => {
            console.log(`- ${u.email} (${u.firstName} ${u.lastName}) [${u.role}]`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
};

listUsers();
