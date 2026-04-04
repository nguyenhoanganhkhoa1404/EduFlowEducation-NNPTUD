const mongoose = require('mongoose');
require('dotenv').config();
const DB_URI = process.env.MONGODB_URI;

async function check() {
    try {
        await mongoose.connect(DB_URI);
        const Enrollment = mongoose.model('enrollment', new mongoose.Schema({}, { strict: false }));
        const Notification = mongoose.model('notifications', new mongoose.Schema({}, { strict: false }));
        const User = mongoose.model('user', new mongoose.Schema({}, { strict: false }));
        
        const notifications = await Notification.find().lean();
        console.log('Notifications in DB:', JSON.stringify(notifications, null, 2));
        
        const users = await User.find().lean();
        console.log('Users in DB (IDs only):', users.map(u => ({ id: u._id, username: u.username || u.email })));
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
