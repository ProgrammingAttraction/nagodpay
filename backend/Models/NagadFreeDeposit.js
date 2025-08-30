const mongoose = require('mongoose');

const NagadFreeDepositSchema = new mongoose.Schema({
  // Basic transaction details
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
    trim: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  currency: {
    type: String,
    default: 'BDT',
    uppercase: true
  },
  
  // Transaction status and tracking
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  transactionId: {
    type: String,
    trim: true
  },
  referenceNumber: {
    type: String,
    trim: true
  },
  
  // Provider information
  provider: {
    type: String,
    default: 'nagad_free'
  },
  
  // Merchant information
  merchantid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchantkey',
    required: true
  },
  
  // CashDesk integration
  cashdeskResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  cashdeskError: {
    type: mongoose.Schema.Types.Mixed
  },
  cashdeskProcessed: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  statusDate: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for better query performance
NagadFreeDepositSchema.index({ orderId: 1 });
NagadFreeDepositSchema.index({ playerId: 1 });
NagadFreeDepositSchema.index({ status: 1 });
NagadFreeDepositSchema.index({ merchantid: 1 });
NagadFreeDepositSchema.index({ createdAt: 1 });

// Static method to get deposit statistics
NagadFreeDepositSchema.statics.getStats = async function(merchantId = null) {
  const matchStage = merchantId ? { merchantid: new mongoose.Types.ObjectId(merchantId) } : {};
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
};

module.exports = mongoose.model('NagadFreeDeposit', NagadFreeDepositSchema);