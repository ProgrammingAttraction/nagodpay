const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: String,
    required: true,
    enum: ['Bkash P2C', 'Nagad P2C', 'Bkash P2P', 'Nagad P2P']
  },
  accountNumber: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^01\d{9}$/.test(v);
      },
      message: props => `${props.value} is not a valid account number!`
    }
  },
  shopName: {
    type: String,
    required: true
  },
  // Bkash P2C specific fields
  username: String,
  password: String,
  appKey: String,
  appSecretKey: String,
  // Nagad P2C specific fields
  publicKey: String,
  privateKey: String,
  // Common fields
  walletType: {
    type: String,
    enum: ['M Plush', 'Daily 300K', 'Daily 30K', '']
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'inactive'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  total_order:{
      type: Number,
        default: 0
  },
  total_recieved:{
   type: Number,
        default: 0
  },
  total_payoutno:{
       type: Number,
        default: 0
  },
  total_cashout:{
       type: Number,
        default: 0
  }
});

// Update the updatedAt field before saving
bankAccountSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const BankAccount = mongoose.model('BankAccount', bankAccountSchema);

module.exports = BankAccount;