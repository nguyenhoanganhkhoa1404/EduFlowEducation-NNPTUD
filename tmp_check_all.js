const mongoose = require('mongoose');
require('dotenv').config();
const DB_URI = process.env.MONGODB_URI;

async function check() {
    try {
        await mongoose.connect(DB_URI);
        const User = mongoose.model('user', new mongoose.Schema({}, { strict: false }));
        const Notification = mongoose.model('notifications', new mongoose.Schema({}, { strict: false }));
        const Enrollment = mongoose.model('enrollment', new mongoose.Schema({}, { strict: false }));
        
        const users = await User.find({}, '_id username email role').lean();
        const notifications = await Notification.find().lean();
        const enrollments = await Enrollment.find().lean();
        
        console.log('--- USERS ---');
        users.forEach(u => console.log(`${u._id} | ${u.username || u.email} | ${u.role}`));
        
        console.log('--- NOTIFICATIONS ---');
        notifications.forEach(n => console.log(`${n.user} | ${n.title} | ${n.isRead}`));
        
        console.log('--- ENROLLMENTS ---');
        enrollments.forEach(e => console.log(`${e.user} | ${e.finalAmount}`));
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
