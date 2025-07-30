const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const TransactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    enum: ["USD", "BDT"],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  transactionId: {
    type: String,
    default:""
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "completed", "failed","fully paid","success"],
    default: "pending"
  },
  method: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: ""
  },
  processedBy: {
    type: String,
    default: ""
  },
  // Additional fields for withdrawal requests
  merchantReference: {
    type: String,
    default: ""
  },
  agent_number:{
    type: String,
  },
  merchantId: {
    type: String,
    default: ""
  },
  withdrawalDetails: {
    bankName: String,
    accountNumber: String,
    accountName: String,
    branchName: String,
    routingNumber: String
  },
  isWithdrawalRequest: {
    type: Boolean,
    default: false
  },
  paymentid:{
    type:String
  },
  payeeAccount:{
    type: String,
  },
  // New payment-related fields
  paymentAmount: {
    type: Number,
    default: 0
  },
  providerCost: {
    type: Number,
    default: 0
  },
  providerNet: {
    type: Number,
    default: 0
  },
  payoutAmount: {
    type: Number,
    default: 0
  },
  prepaymentAmount: {
    type: Number,
    default: 0
  }
});

// Define AgentAccountSchema based on the provided BankAccount schema
const AgentAccountSchema = new Schema({
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
    enum: ['M Plush', 'Daily 300K', 'Daily 30K', ''],
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'inactive'
  },
  isDefault: {
    type: Boolean,
    default: false
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
AgentAccountSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const UserSchema = new Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    minlength: [4, 'Username must be at least 4 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    trim: true,
    lowercase: true,
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores']
  },
  name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  apiKey: {
    type: String,
    unique: true,
    default: function() {
      return generateApiKey(14);
    }
  },
  identity: {
    type: String,
    required: [true, 'Identity verification is required']
  },
  withdracommission: {
    type: Number,
    default: 0
  },
  depositcommission: {
    type: Number,
    default: 0
  },
  balance: {
    type: Number,
    default: 0
  },
  underwithdraw: {
    type: Number,
    default: 0
  },
    withdrawalRequests: {  // New field specifically for withdrawal requests
    type: [TransactionSchema],
    default: []
  },
  uderdeposit: {
    type: Number,
    default: 0
  },
  totalwallet: {
    type: Number,
    default: 0
  },
  providercost:{
    type: Number,
    default: 0
  },
   totalpayment:{
    type: Number,
    default: 0
  },
      currentstatus:{
        type: String,
        default:"online"
    },
     totalprepayment:{
    type: Number,
    default: 0
  },
     totalpayout:{
    type: Number,
    default: 0
  },
paymentMethod: {
  type: [{
    type: String,
  }],
  default: [],
  validate: {
    validator: function(v) {
      return v.length <= 5; // Limit to 5 payment methods max
    },
    message: 'Cannot have more than 5 payment methods!'
  }
},
  paymentbrand: {
    type: String,
  },
  currency: {
    type: String,
    default: 'BDT',
  },
  agentAccounts: {
    type: [AgentAccountSchema],
    default: []
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'agent'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: "inactive"
  },
  is_admin: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Function to generate random API key
function generateApiKey(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Indexes
UserSchema.index({ email: 1, username: 1, apiKey: 1 });
UserSchema.index({ 'agentAccounts.accountNumber': 1 });

// Password hashing middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Generate API key for new users
UserSchema.pre('save', function(next) {
  if (this.isNew && !this.apiKey) {
    this.apiKey = generateApiKey(14);
  }
  next();
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to add a new agent account
UserSchema.methods.addAgentAccount = function(accountData) {
  // Ensure only one default account exists
  if (accountData.isDefault) {
    this.agentAccounts.forEach(account => {
      account.isDefault = false;
    });
  }
  this.agentAccounts.push(accountData);
  return this.save();
};

// Method to set default account
UserSchema.methods.setDefaultAccount = function(accountId) {
  this.agentAccounts.forEach(account => {
    account.isDefault = account._id.equals(accountId);
  });
  return this.save();
};

// Method to remove an agent account
UserSchema.methods.removeAgentAccount = function(accountId) {
  this.agentAccounts = this.agentAccounts.filter(
    account => !account._id.equals(accountId)
  );
  return this.save();
};

const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel;