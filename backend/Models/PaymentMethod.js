const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  name_bn: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['regular', 'fast', 'nagad_free', 'bank'],
    required: true
  },
  category: {
    type: String,
    enum: ['mobile', 'bank'],
    required: true
  },
  minAmount: {
    type: Number,
    required: true,
    default: 100
  },
  maxAmount: {
    type: Number,
    required: true,
    default: 30000
  },
  isEnabled: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
paymentMethodSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);