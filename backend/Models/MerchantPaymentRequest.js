const mongoose = require('mongoose');

const MerchantPaymentRequestSchema = new mongoose.Schema({
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchantkey',
    required: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Amount must be at least 0.01'],
  },
  provider: {
    type: String,
    required: true,

  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  referenceId: {
  type: String,
  unique: true,
  required: true,
},

});



module.exports = mongoose.model('MerchantPaymentRequest', MerchantPaymentRequestSchema);