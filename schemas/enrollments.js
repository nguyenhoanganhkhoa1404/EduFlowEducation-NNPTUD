const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'enrollmentDetails' }],
  totalAmount: { type: Number, required: true },
  additionalNotes: { type: String, default: "" },
  status: { type: String, enum: ['Pending', 'Enrolled', 'Completed', 'Dropped'], default: 'Pending' },
  paymentStatus: { type: String, enum: ['Unpaid', 'Paid', 'Refunded'], default: 'Unpaid' },
  coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'coupons' },
  discount: { type: Number, default: 0 },
  finalAmount: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('enrollment', EnrollmentSchema);
