const mongoose = require('mongoose');
require('dotenv').config();
const DB_URI = process.env.MONGODB_URI;

async function check() {
    try {
        await mongoose.connect(DB_URI);
        const Enrollment = mongoose.model('enrollment', new mongoose.Schema({}, { strict: false }));
        const Notification = mongoose.model('notifications', new mongoose.Schema({}, { strict: false }));
        
        const enrollmentCount = await Enrollment.countDocuments();
        const notificationCount = await Notification.countDocuments();
        
        console.log(`Enrollments: ${enrollmentCount}`);
        console.log(`Notifications: ${notificationCount}`);
        
        if (enrollmentCount > 0) {
            const latestEnrollment = await Enrollment.findOne().sort({ createdAt: -1 });
            console.log('Latest Enrollment User:', latestEnrollment.user);
        }
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
