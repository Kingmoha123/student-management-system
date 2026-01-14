import mongoose from "mongoose";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/student-management-system");
        console.log("Connected to MongoDB");

        const email = "mustafabdi@gmil.com";
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User not found: ${email}`);
        } else {
            console.log(`User found: ${user.email}`);
            console.log(`Role: ${user.role}`);
            console.log(`Password (start): ${user.password.substring(0, 10)}...`);
            console.log(`Password length: ${user.password.length}`);

            if (user.password.startsWith("$2")) {
                console.log("Password appears to be hashed.");
            } else {
                console.log("Password appears to be PLAIN TEXT (Not hashed).");
            }
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
};

checkUser();
