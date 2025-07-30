const mongoose = require('mongoose');
const crypto = require('crypto');

const merchantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  websiteUrl: { type: String, required: true, trim: true },
  apiKey: {
    type: String,
    unique: true,
    default: () => crypto.randomBytes(10).toString('hex')
  },
  createdAt: { type: Date, default: Date.now },
  balance: { type: Number, default: 0 },
  total_payin: { type: Number, default: 0 },
  total_payout: { type: Number, default: 0 },
  withdrawCommission: { type: Number },
  depositCommission: { type: Number },
  getwaycost: { type: Number, default: 0 },
  getwaycostHistory: [
    {
      amount: { type: Number },
      updatedAt: { type: Date, default: Date.now }
    }
  ]
});

// ✅ Middleware to store the change in getwaycost
merchantSchema.pre('save', async function (next) {
  try {
    if (this.isModified('getwaycost') && !this.isNew) {
      const previous = await this.constructor.findById(this._id).select('getwaycost');

      if (previous) {
        const diff = this.getwaycost - previous.getwaycost;

        // Only log if there is actual change
        if (diff !== 0) {
          this.getwaycostHistory.push({
            amount: diff,
            updatedAt: new Date()
          });
        }
      }
    }
    next(); // ✅ move inside try block
  } catch (error) {
    console.error('Error tracking getwaycost change:', error);
    next(error); // important: call next with error to prevent hanging
  }
});

module.exports = mongoose.model('Merchant', merchantSchema);
