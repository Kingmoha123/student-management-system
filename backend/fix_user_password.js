import mongoose from "mongoose";
import User from "./models/User.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const fixPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/student-management-system");
        console.log("Connected to MongoDB");

        const email = "mustafabdi@gmail.com";
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User not found: ${email}`);
            return;
        }

        if (user.password.startsWith("$2")) {
            console.log("Password is already hashed. No action needed.");
            return;
        }

        console.log(`Hashing password for user: ${email}`);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);

        user.password = hashedPassword;
        await user.save(); // The pre-save hook check for modified password ensures double-hashing doesn't happen if logic is correct, but here we set it manually. Actually, the pre-save hook WILL run.
        // Wait, if I set user.password to the hash, and then call save(), the pre-save hook might hash it AGAIN if I'm not careful.
        // Let's verify the model.
        // The model says: if (!this.isModified("password")) return next()
        // Since I modified it, it will hash it again!

        // To avoid double hashing via the pre-save hook (which I can't easily bypass with save()), 
        // I should use findByIdAndUpdate which bypasses pre-save hooks.

        await User.findByIdAndUpdate(user._id, { password: hashedPassword });

        console.log("Password successfully hashed and updated.");

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
};

fixPassword();
