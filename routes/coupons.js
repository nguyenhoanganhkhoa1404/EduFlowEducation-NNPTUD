const express = require('express');
const router = express.Router();
const couponModel = require('../schemas/coupons');
const { CheckLogin, checkRole } = require('../utils/authHandler');

router.get('/', async (req, res) => {
  const coupons = await couponModel.find();
  res.status(200).json({ success: true, data: coupons });
});

router.post('/', CheckLogin, checkRole('admin'), async (req, res) => {
  try {
    const { code, discountType, discountValue, expiryDate, isActive, minEnrollmentAmount } = req.body;
    
    // Set default expiry date to 30 days if not provided
    const finalExpiryDate = expiryDate ? new Date(expiryDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    const newCoupon = new couponModel({
      code,
      discountType,
      discountValue,
      expiryDate: finalExpiryDate,
      isActive: isActive !== undefined ? isActive : true,
      minEnrollmentAmount: minEnrollmentAmount || 0
    });
    
    await newCoupon.save();
    res.status(201).json({ success: true, data: newCoupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
