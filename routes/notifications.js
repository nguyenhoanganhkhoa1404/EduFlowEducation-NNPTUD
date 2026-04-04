const express = require('express');
const router = express.Router();
const notificationModel = require('../schemas/notifications');
const { CheckLogin } = require('../utils/authHandler');

// Get all notifications for current user
router.get('/', CheckLogin, async (req, res) => {
  try {
    const notifications = await notificationModel.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('user');
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', CheckLogin, async (req, res) => {
  try {
    const notification = await notificationModel.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a notification
router.delete('/:id', CheckLogin, async (req, res) => {
  try {
    const notification = await notificationModel.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
