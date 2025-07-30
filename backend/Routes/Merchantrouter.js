const express = require('express');
const Merchantrouter = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Merchantkey = require('../Models/Merchantkey');
const MerchantPaymentRequest = require('../Models/MerchantPaymentRequest');
const PayinTransaction = require('../Models/PayinTransaction');
const PayoutTransaction = require('../Models/PayoutTransaction');
const { v4: uuidv4 } = require('uuid');
const Merchantwithdraw = require('../Models/Merchantwithdraw');

// Middleware to protect routes
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get merchant from token
    req.merchant = await Merchantkey.findById(decoded.id).select('-password');

    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d' // token expires in 30 days
  });
};

// @access  Public
Merchantrouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
 console.log(req.body)
  // Basic validation
  if (!email || !password) {
    return res.status(400).json({success:false,message: 'Please provide email and password' });
  }

  // Simple email validation
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({success:false,message: 'Please include a valid email' });
  }

  try {
    // Check if merchant exists
    const merchant = await Merchantkey.findOne({ email });
    console.log(merchant)
    if (!merchant) {
      return res.json({success:false, message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, merchant.password);
    if (!isMatch) {
      return res.json({success:false,message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(merchant._id);

    // Return merchant data (excluding password) and token
    res.json({
        success:true,
      _id: merchant._id,
      name: merchant.name,
      email: merchant.email,
      websiteUrl: merchant.websiteUrl,
      apiKey: merchant.apiKey,
      createdAt: merchant.createdAt,
      merchant,
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @access  Private
Merchantrouter.get('/merchant-info/:id', protect, async (req, res) => {
  try {
    console.log("first")
    const merchant = await Merchantkey.findById(req.params.id);
    console.log(merchant)
    if(!merchant){
        return res.json({success:true,merchant});
    }
    res.json({success:true,merchant});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Update merchant details
Merchantrouter.put('/update-merchant/:id',protect, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Validate merchant exists
    const merchant = await Merchantkey.findById(id);
    if (!merchant) {
      return res.status(404).json({ message: 'Merchant not found' });
    }
    
    // Handle password update separately to hash it
    if (updates.password) {
      if (updates.password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    
    // Prevent updating certain fields
    const restrictedFields = ['apiKey', 'createdAt', 'balance', 'total_payin', 'total_payout'];
    restrictedFields.forEach(field => {
      if (updates[field]) {
        delete updates[field];
      }
    });
    
    // Handle email uniqueness check if email is being updated
    if (updates.email && updates.email !== merchant.email) {
      const existingMerchant = await Merchantkey.findOne({ email: updates.email });
      if (existingMerchant) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    // Update merchant
    const updatedMerchant = await Merchantkey.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password'); // Exclude password from the response
    
    res.json(updatedMerchant);
    
  } catch (error) {
    console.error('Error updating merchant:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @access  Private (Merchant only)
Merchantrouter.post('/merchant-payment-request', protect, async (req, res) => {
  const { email, name, amount, provider } = req.body;

  // Basic validation
  if (!email || !name || !amount || !provider) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
const paymentRequest = new MerchantPaymentRequest({
  merchantId: req.merchant._id,
  email,
  name,
  amount,
  provider,
  referenceId: uuidv4(), // <-- generate unique value
});


    await paymentRequest.save();

    res.status(201).json({
      success: true,
      data: paymentRequest,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

Merchantrouter.get("/merchant-payment/:id",async(req,res)=>{
    try {
        const merchant_payment=await MerchantPaymentRequest.find({merchantId:req.params.id});
        console.log(req.params.id)
        if(!merchant_payment){
           return res.send({success:false,message:"Merchant did not find!"})
        }
        res.send({success:true,payment:merchant_payment});

    } catch (error) {
        console.log(error)
    }
})
// ---------------merchant-payin---------------------
Merchantrouter.get("/merchant-payin/:id",async(req,res)=>{
    try {
        const merchant_payin=await PayinTransaction.find({merchantid:req.params.id}).sort({ createdAt: -1 });;
        console.log(req.params.id)
        if(!merchant_payin){
           return res.send({success:false,message:"Merchant Payin did not find!"})
        }
        res.send({success:true,payment:merchant_payin});
    } catch (error) {
        console.log(error)
    }
});

// Get gateway cost history with filters
Merchantrouter.get('/:merchantId/gateway-history', async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { period, customStart, customEnd } = req.query;

    // Find the merchant
    const merchant = await Merchantkey.findById(merchantId);
    if (!merchant) {
      return res.status(404).json({ message: 'Merchant not found' });
    }

    let filteredHistory = [...merchant.getwaycostHistory];
    
    // Apply filters based on the period
    if (period) {
      const now = moment();
      
      switch (period) {
        case 'today':
          filteredHistory = filteredHistory.filter(entry => 
            moment(entry.updatedAt).isSame(now, 'day')
          );
          break;
          
        case 'tomorrow':
          const tomorrow = now.clone().add(1, 'day');
          filteredHistory = filteredHistory.filter(entry => 
            moment(entry.updatedAt).isSame(tomorrow, 'day')
          );
          break;
          
        case 'month':
          filteredHistory = filteredHistory.filter(entry => 
            moment(entry.updatedAt).isSame(now, 'month')
          );
          break;
          
        case 'year':
          filteredHistory = filteredHistory.filter(entry => 
            moment(entry.updatedAt).isSame(now, 'year')
          );
          break;
          
        case 'custom':
          if (!customStart || !customEnd) {
            return res.status(400).json({ message: 'Custom range requires both start and end dates' });
          }
          const startDate = moment(customStart);
          const endDate = moment(customEnd);
          
          filteredHistory = filteredHistory.filter(entry => 
            moment(entry.updatedAt).isBetween(startDate, endDate, null, '[]')
          );
          break;
          
        default:
          return res.status(400).json({ message: 'Invalid period specified' });
      }
    }

    // Sort by date (newest first)
    filteredHistory.sort((a, b) => b.updatedAt - a.updatedAt);

    res.json({
      merchantId,
      merchantName: merchant.name,
      currentGatewayCost: merchant.getwaycost,
      history: filteredHistory,
      count: filteredHistory.length,
      totalChange: filteredHistory.reduce((sum, entry) => sum + entry.amount, 0)
    });

  } catch (error) {
    console.error('Error fetching gateway history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// ----------------------merchant-payout-----------------------------
Merchantrouter.get("/merchant-payout/:id",async(req,res)=>{
    try {
        const merchant_payout=await PayoutTransaction.find({merchantid:req.params.id});
        console.log(req.params.id)
        if(!merchant_payout){
           return res.send({success:false,message:"Merchant Payout did not find!"})
        }
        res.send({success:true,payment:merchant_payout});

    } catch (error) {
        console.log(error)
    }
})
// Route to get all transaction data and counts by merchantid
Merchantrouter.get('/transactions/:merchantid', async (req, res) => {
  try {
    const { merchantid } = req.params;
    
    // Get all transactions in parallel
    const [payinTransactions, payoutTransactions, paymentRequests] = await Promise.all([
      PayinTransaction.find({ merchantid }),
      PayoutTransaction.find({ merchantid }),
      MerchantPaymentRequest.find({ merchantId: new mongoose.Types.ObjectId(merchantid) })
    ]);
    const mathed_merchant=await Merchantkey.findById({_id:req.params.merchantid});
    // Get counts in parallel
    const [payinCount, payoutCount, paymentRequestCount] = await Promise.all([
      PayinTransaction.countDocuments({ merchantid }),
      PayoutTransaction.countDocuments({ merchantid }),
      MerchantPaymentRequest.countDocuments({ merchantId: new mongoose.Types.ObjectId(merchantid) })
    ]);
    
    // Get status counts for payin
    const payinStatusCounts = await PayinTransaction.aggregate([
      { $match: { merchantid } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    // Get status counts for payout
    const payoutStatusCounts = await PayoutTransaction.aggregate([
      { $match: { merchantid } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    // Get status counts for payment requests
    const paymentRequestStatusCounts = await MerchantPaymentRequest.aggregate([
      { $match: { merchantId: new mongoose.Types.ObjectId(merchantid) } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    // Prepare response
    const response = {
      counts: {
        totalPayin: payinCount,
        totalPayout: payoutCount,
        totalPaymentRequests: paymentRequestCount,
        payinStatusCounts: payinStatusCounts.reduce((acc, { _id, count }) => {
          acc[_id] = count;
          return acc;
        }, {}),
        payoutStatusCounts: payoutStatusCounts.reduce((acc, { _id, count }) => {
          acc[_id] = count;
          return acc;
        }, {}),
        paymentRequestStatusCounts: paymentRequestStatusCounts.reduce((acc, { _id, count }) => {
          acc[_id] = count;
          return acc;
        }, {})
      },
      data: {
        payinTransactions,
        payoutTransactions,
        paymentRequests
      },
      mathed_merchant
    };
    
    res.status(200).json({
      success: true,
      message: 'All transactions retrieved successfully',
      data: response
    });
    
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

// POST - Create a new withdrawal request
// POST - Create a new withdrawal request
Merchantrouter.post('/withdraw', async (req, res) => {
  try {
    const { merchant, amount, paymentMethod, paymentDetails } = req.body;

    // Validate input
    if (!merchant || !amount || !paymentMethod || !paymentDetails) {
      return res.json({ success: false, message: "All fields are required" });
    }

    if (amount <= 0) {
      return res.json({ success: false, message: "Withdrawal amount must be positive" });
    }

    // Find merchant and check balance
    const matchedMerchant = await Merchantkey.findById(merchant);
    if (!matchedMerchant) {
      return res.json({ success: false, message: "Merchant not found" });
    }

    const MINIMUM_BALANCE = 50000;
    const availableBalance = matchedMerchant.balance - MINIMUM_BALANCE;

    if (amount > availableBalance) {
      return res.json({ 
        success: false, 
        message: `Insufficient balance. You can withdraw maximum ${availableBalance} Taka while maintaining minimum balance of ${MINIMUM_BALANCE} Taka` 
      });
    }

    // Create withdrawal request
    const newRequest = new Merchantwithdraw({
      merchant,
      amount,
      paymentMethod,
      paymentDetails,
      status: 'pending' // assuming you want to track status
    });

    const savedRequest = await newRequest.save();

    // Update merchant balance
    matchedMerchant.balance -= amount;
    await matchedMerchant.save();

    res.status(201).json({
      success: true,
      message: "Withdrawal request successful",
      data: savedRequest,
      newBalance: matchedMerchant.balance
    });

  } catch (error) {
    console.error("Withdrawal error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Internal server error" 
    });
  }
});

// GET - Retrieve all withdrawal requests
Merchantrouter.get('/withdraw', async (req, res) => {
  try {
    const requests = await Merchantwithdraw.find().populate('merchant');
    res.json(requests);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
});

// GET - Retrieve a specific withdrawal request by ID
Merchantrouter.get('/withdraw/:id', async (req, res) => {
  try {
    const request = await Merchantwithdraw.findById(req.params.id).populate('merchant');
    if (!request) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = Merchantrouter;