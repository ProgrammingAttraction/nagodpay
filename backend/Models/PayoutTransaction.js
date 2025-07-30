const mongoose = require("mongoose");

const PayoutTransactionSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true
    },
    provider: {
      type: String,
      required: true
    },
    orderId: {
      type: String,
      required: true,
      unique: true
    },
    payeeId: {
      type: String,
      required: true
    },
    payeeAccount: {
      type: String,
      required: true
    },
    agentAccount: {
      type: String,
      default: ""
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      default: null
    },
    transactionId: {
      type: String,
      default: ""
    },
        merchantid:String,
    requestAmount: {
      type: Number,
      required: true,
      min: [10, "Minimum amount is 10"],
      validate: {
        validator: function(value) {
          if (this.currency === "BDT" || this.currency === "INR") {
            return value <= 25000;
          } else if (this.currency === "USD") {
            return value <= 2000;
          }
          return true;
        },
        message: "Amount exceeds maximum limit for currency"
      }
    },
    sentAmount: {
      type: Number,
      default: 0
    },
    balanceAmount: {
      type: Number,
      default: 0
    },
    callbackUrl: {
      type: String,
      required: true
    },
    sentCallbackDate: {
      type: Date,
      default: null
    },
    agent_account: {
      type: String,
      default: ""
    },
    currency: {
      type: String,
      enum: ["BDT", "INR", "USD"],
      default: "BDT",
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "success", "rejected","reassigned"],
      default: "pending"
    },
    statusHistory: [{
      status: String,
      changedAt: Date,
      changedBy: String,
      notes: String
    }],
    transactionDate: {
      type: Date,
      default: null
    },
    statusDate: {
      type: Date,
      default: null
    },
    mode: {
      type: String,
      enum: ["test", "live"],
      default: "live"
    },
    update_by: {
      type: String,
      default: ""
    },
    merchantReference: String,
    withdrawalDetails: {
      bankName: String,
      accountNumber: String,
      accountName: String,
      branchName: String,
      routingNumber: String,
      providerSpecific: mongoose.Schema.Types.Mixed
    },
    commission: {
      rate: Number,
      amount: Number,
      calculatedAt: Date
    },
    expireAt: {
      type: Date,
      default: function() { return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); },
      index: { expires: 0 }
    },
    attempts: {
      count: { type: Number, default: 0 },
      lastAttempt: Date,
      maxAttempts: { type: Number, default: 3 }
    },
    auditLog: [{
      action: String,
      performedBy: String,
      performedAt: Date,
      details: mongoose.Schema.Types.Mixed
    }]
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

PayoutTransactionSchema.virtual('formattedAmount').get(function() {
  return this.currency + " " + this.requestAmount.toFixed(2);
});

PayoutTransactionSchema.index({ merchant: 1, status: 1 });
PayoutTransactionSchema.index({ assignedAgent: 1, status: 1 });
PayoutTransactionSchema.index({ payeeId: 1 });
PayoutTransactionSchema.index({ payeeAccount: 1 });
PayoutTransactionSchema.index({ orderId: 1 }, { unique: true });
PayoutTransactionSchema.index({ paymentId: 1 }, { unique: true });
PayoutTransactionSchema.index({ status: 1, expireAt: 1 });
PayoutTransactionSchema.index({ createdAt: 1 });

PayoutTransactionSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (!this.statusHistory) {
      this.statusHistory = [];
    }
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      changedBy: this.update_by || 'system',
      notes: "Status changed to " + this.status
    });
    this.statusDate = new Date();
  }
  next();
});

PayoutTransactionSchema.statics.findPending = function() {
  return this.find({ status: 'pending' });
};

PayoutTransactionSchema.statics.findByMerchantAndStatus = function(merchant, status) {
  return this.find({ merchant: merchant, status: status });
};

PayoutTransactionSchema.methods.markAsProcessed = function(agentId, transactionId) {
  this.status = 'processing';
  this.assignedAgent = agentId;
  this.transactionId = transactionId;
  this.attempts.count += 1;
  this.attempts.lastAttempt = new Date();
  return this.save();
};

var PayoutTransaction = mongoose.model("PayoutTransaction", PayoutTransactionSchema);
module.exports = PayoutTransaction;