const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  enrollment: { type: mongoose.Schema.Types.ObjectId, ref: 'enrollment', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  paymentMethod: { type: String, enum: ['CreditCard', 'PayPal', 'COD', 'BankTransfer'], required: true },
  transactionId: { type: String },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Completed', 'Failed', 'Refunded'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('payments', PaymentSchema);
