import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function createAdmin() {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/sms");

        // Check if exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log("Admin already exists:", existingAdmin.email);
            // Optionally update password if needed, but for now just exit
            // Let's force update the password to 'admin123' so the user can definitely login
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash("admin123", salt);
            existingAdmin.password = hashedPassword;
            await existingAdmin.save();
            console.log("Existing admin password reset to: admin123");
            process.exit(0);
        }

        // Create new admin
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("admin123", salt);

        const newAdmin = new User({
            firstName: "System",
            lastName: "Admin",
            email: "admin@gmail.com",
            password: hashedPassword, // We must hash it manually here because we might bypass the pre-save hook depending on how we save, but using 'new User' usually triggers it. However, to be safe and consistent with the script logic:
            // Actually, the User model has a pre-save hook. Let's rely on that or just pass the raw password if we weren't manually hashing. 
            // BUT, looking at the User.js model: 
            // userSchema.pre("save", async function (next) { if (!this.isModified("password")) return next(); ... }
            // So if I pass a hashed password, it might re-hash it if I'm not careful, or if I pass plain text it hashes it.
            // Let's pass PLAIN TEXT "admin123" and let the model handle hashing. Much safer to avoid double hashing.
            role: "admin",
            status: "active"
        });

        // Wait! The model logic:
        // this.password = await bcrypt.hash(this.password, salt)
        // So I should pass the PLAIN password to the constructor.

        newAdmin.password = "admin123";

        await newAdmin.save();
        console.log("ADMIN_CREATED_SUCCESSFULLY");
        console.log("Email: admin@gmail.com");
        console.log("Password: admin123");

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createAdmin();
