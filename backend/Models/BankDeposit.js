const mongoose = require('mongoose');

const bankDepositSchema = new mongoose.Schema({
  playerId: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  accountNumber: {
    type: String,
    required: true,
    trim: true
  },
  bankName: {
    type: String,
    required: true,
    trim: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    default: null
  },
  referenceNumber: {
    type: String,
    default: null
  },
  currency: {
    type: String,
    default: 'BDT'
  },
  provider: {
    type: String,
    required: true
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

// Index for better query performance
bankDepositSchema.index({ user_id: 1, status: 1 });
bankDepositSchema.index({ orderId: 1 });
bankDepositSchema.index({ createdAt: 1 });

module.exports = mongoose.model('BankDeposit', bankDepositSchema);