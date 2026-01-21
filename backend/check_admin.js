import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function checkAdmin() {
    try {
        console.log("Connecting to database...");
        // Use the same connection string logic as server.js
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/sms");
        console.log("Connected.");

        const admins = await User.find({ role: 'admin' });

        if (admins.length === 0) {
            console.log("NO_ADMIN_FOUND");
        } else {
            console.log("ADMINS_FOUND:");
            admins.forEach(admin => {
                console.log(`Email: ${admin.email}, ID: ${admin._id}, Name: ${admin.firstName} ${admin.lastName}`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAdmin();
