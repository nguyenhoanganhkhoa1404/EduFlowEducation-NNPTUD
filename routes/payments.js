const express = require('express');
const router = express.Router();
const paymentModel = require('../schemas/payments');
const { CheckLogin, checkRole } = require('../utils/authHandler');

router.get('/', CheckLogin, checkRole('admin'), async (req, res) => {
  try {
    const payments = await paymentModel.find().populate('user').populate('enrollment');
    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
