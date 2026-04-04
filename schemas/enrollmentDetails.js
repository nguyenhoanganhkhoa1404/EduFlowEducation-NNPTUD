const mongoose = require('mongoose');

const EnrollmentDetailSchema = new mongoose.Schema({
  enrollment: { type: mongoose.Schema.Types.ObjectId, ref: 'enrollment', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'course', required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('enrollmentDetails', EnrollmentDetailSchema);
