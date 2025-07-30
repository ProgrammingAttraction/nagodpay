// models/PrepaymentRequest.js
const mongoose = require('mongoose');

const PrepaymentRequestSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  userid:{type: String, required: true },
  paymentMethod: { type: String, required: true }, // e.g., BKASH P2C
  currency: { type: String, required: true }, // e.g., BDT
  currentBalance: { type: String, required: true }, // Stored as string for formatting
  requestAmount: { type: String, required: true },
  paidAmount: { type: String, required: true },
  channel: { type: String, required: true }, // Bank or M2A
  note: { type: String, default: '' },
  requestDate: { type: Date, required: true },
  updateDate: { type: Date, required: true },
  status: { type: String, enum: ['Resolved', 'Pending', 'Rejected'], required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('PrepaymentRequest', PrepaymentRequestSchema);
