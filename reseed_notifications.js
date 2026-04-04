const mongoose = require('mongoose');
require('dotenv').config();
const DB_URI = process.env.MONGODB_URI;

// Import schemas
const Enrollment = require('./schemas/enrollments');
const Notification = require('./schemas/notifications');
const User = require('./schemas/users');

async function run() {
    try {
        console.log("Connecting to Database...");
        await mongoose.connect(DB_URI);
        console.log("Connected.");
        
        await Notification.deleteMany({});
        console.log("Deleted all notifications.");
        
        const enrollments = await Enrollment.find().populate('user');
        console.log(`Found ${enrollments.length} enrollments.`);
        
        for (const en of enrollments) {
            const userId = en.user?._id || en.user;
            if (!userId) {
                console.log(`Skipping enrollment ${en._id} because user is missing.`);
                continue;
            }
            console.log(`Creating notification for User ID: ${userId}`);
            await new Notification({
                user: userId,
                title: "Đăng ký thành công",
                message: `Bạn đã đăng ký thành công khóa học. Tổng tiền: ${en.finalAmount ? en.finalAmount.toLocaleString() : '500,000'} VNĐ`,
                isRead: false,
                type: 'Enrollment'
            }).save();
        }
        
        console.log(`Successfully re-seeded notifications.`);
        process.exit(0);
    } catch (e) {
        console.error("Error during re-seeding:", e);
        process.exit(1);
    }
}
run();
