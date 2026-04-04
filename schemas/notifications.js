const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  type: { type: String, enum: ['Enrollment', 'Promo', 'System'], default: 'System' }
}, { timestamps: true });

module.exports = mongoose.model('notifications', NotificationSchema);
