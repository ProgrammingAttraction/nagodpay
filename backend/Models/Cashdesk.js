const mongoose = require('mongoose');

const cashdeskSchema = new mongoose.Schema({
  cashdeskId: {
    type: String,
    required: [true, 'Cashdesk ID is required'],
    unique: true,
    trim: true
  },
  cashdesk: {
    type: String,
    required: [true, 'Cashdesk name is required'],
    trim: true
  },
  cashdeskHash: {
    type: String,
    required: [true, 'Cashdesk hash is required'],
    trim: true
  },
  cashierPass: {
    type: String,
    required: [true, 'Cashier password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  cashierLogin: {
    type: String,
    required: [true, 'Cashier login is required'],
    trim: true
  },
  cashdeskApiBase: {
    type: String,
    required: [true, 'API base URL is required'],
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\..+/.test(v);
      },
      message: 'Please enter a valid URL'
    }
  },
  defaultLng: {
    type: String,
    required: [true, 'Default language is required'],
    minlength: [2, 'Language code must be 2 characters'],
    maxlength: [2, 'Language code must be 2 characters'],
    uppercase: true
  },
  isActive: {
    type: Boolean,
    default: true
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
cashdeskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Cashdesk', cashdeskSchema);