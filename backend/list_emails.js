import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function listEmails() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sms_db_s');
        const users = await User.find({}, { email: 1, _id: 0 });
        console.log('EMAILS_START');
        users.forEach(u => console.log(u.email));
        console.log('EMAILS_END');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

listEmails();
