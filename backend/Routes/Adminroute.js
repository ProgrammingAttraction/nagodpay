const express = require('express');
const Adminroute = express.Router();
const adminController = require("../Controllers/adminController");
const { authenticate, authorizeAdmin } = require('../Middlewares/authMiddleware');
const UserModel = require('../Models/User');
const PrepaymentRequest = require('../Models/PrepaymentRequest');
const BankAccount = require('../Models/BankAccount');
const PayinTransaction = require('../Models/PayinTransaction');
const ForwardedSms = require('../Models/ForwardedSms');
const PayoutTransaction = require('../Models/PayoutTransaction');
const bcrypt=require("bcrypt")
const Cashdesk = require('../Models/Cashdesk');
// Protect all admin routes
// Adminroute.use(authenticate);
// Adminroute.use(authorizeAdmin);
// Add this route to your existing Adminroute
Adminroute.get('/transaction-totals', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      merchantId, 
      provider, 
      currency 
    } = req.query;

    // Build base query for date filtering
    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }

    // Build merchant query if specified
    const merchantQuery = merchantId ? { merchantid: merchantId } : {};

    // Build provider query if specified
    const providerQuery = provider ? { provider: new RegExp(provider, 'i') } : {};

    // Build currency query if specified
    const currencyQuery = currency ? { currency: currency.toUpperCase() } : {};

    // Combine all queries
    const combinedQuery = {
      ...dateQuery,
      ...merchantQuery,
      ...providerQuery,
      ...currencyQuery
    };

    // Execute all queries in parallel for better performance
    const [
      payinTransactions,
      payoutTransactions,
      nagadDeposits,
      bankDeposits,
      successfulPayins,
      successfulPayouts,
      successfulNagadDeposits,
      successfulBankDeposits
    ] = await Promise.all([
      // All transactions
      PayinTransaction.find(combinedQuery),
      PayoutTransaction.find(combinedQuery),
      NagadFreeDeposit.find(combinedQuery),
      BankDeposit.find(combinedQuery),
      
      // Successful transactions only
      PayinTransaction.find({ ...combinedQuery, status: 'completed' }),
      PayoutTransaction.find({ 
        ...combinedQuery, 
        status: { $in: ['success', 'completed'] } 
      }),
      NagadFreeDeposit.find({ 
        ...combinedQuery, 
        status: { $in: ['completed', 'processing', 'success'] } 
      }),
      BankDeposit.find({ 
        ...combinedQuery, 
        status: { $in: ['completed', 'processing', 'success'] } 
      })
    ]);

    // Helper function to calculate amount based on transaction type
    const getPayinAmount = (txn) => txn.receivedAmount || txn.expectedAmount || 0;
    const getPayoutAmount = (txn) => txn.requestAmount || txn.sentAmount || 0;
    const getDepositAmount = (txn) => txn.amount || 0;

    // Calculate totals for all transactions
    const totalPayinAmount = payinTransactions.reduce((sum, txn) => sum + getPayinAmount(txn), 0);
    const totalPayoutAmount = payoutTransactions.reduce((sum, txn) => sum + getPayoutAmount(txn), 0);
    const totalNagadDepositAmount = nagadDeposits.reduce((sum, txn) => sum + getDepositAmount(txn), 0);
    const totalBankDepositAmount = bankDeposits.reduce((sum, txn) => sum + getDepositAmount(txn), 0);

    // Calculate totals for successful transactions only
    const totalSuccessfulPayinAmount = successfulPayins.reduce((sum, txn) => sum + getPayinAmount(txn), 0);
    const totalSuccessfulPayoutAmount = successfulPayouts.reduce((sum, txn) => sum + getPayoutAmount(txn), 0);
    const totalSuccessfulNagadDepositAmount = successfulNagadDeposits.reduce((sum, txn) => sum + getDepositAmount(txn), 0);
    const totalSuccessfulBankDepositAmount = successfulBankDeposits.reduce((sum, txn) => sum + getDepositAmount(txn), 0);

    // Calculate transaction counts
    const totalTransactions = {
      payin: payinTransactions.length,
      payout: payoutTransactions.length,
      nagadDeposit: nagadDeposits.length,
      bankDeposit: bankDeposits.length,
      total: payinTransactions.length + payoutTransactions.length + 
             nagadDeposits.length + bankDeposits.length
    };

    const successfulTransactions = {
      payin: successfulPayins.length,
      payout: successfulPayouts.length,
      nagadDeposit: successfulNagadDeposits.length,
      bankDeposit: successfulBankDeposits.length,
      total: successfulPayins.length + successfulPayouts.length + 
             successfulNagadDeposits.length + successfulBankDeposits.length
    };

    // Calculate success rates
    const successRates = {
      payin: totalTransactions.payin > 0 
        ? (successfulTransactions.payin / totalTransactions.payin) * 100 
        : 0,
      payout: totalTransactions.payout > 0 
        ? (successfulTransactions.payout / totalTransactions.payout) * 100 
        : 0,
      nagadDeposit: totalTransactions.nagadDeposit > 0 
        ? (successfulTransactions.nagadDeposit / totalTransactions.nagadDeposit) * 100 
        : 0,
      bankDeposit: totalTransactions.bankDeposit > 0 
        ? (successfulTransactions.bankDeposit / totalTransactions.bankDeposit) * 100 
        : 0,
      overall: totalTransactions.total > 0 
        ? (successfulTransactions.total / totalTransactions.total) * 100 
        : 0
    };

    // Calculate net amounts (deposits - withdrawals)
    const netAmount = (totalSuccessfulPayinAmount + totalSuccessfulNagadDepositAmount + 
                      totalSuccessfulBankDepositAmount) - totalSuccessfulPayoutAmount;

    // Group by provider for detailed breakdown
    const payinByProvider = {};
    payinTransactions.forEach(txn => {
      const provider = txn.provider || 'unknown';
      if (!payinByProvider[provider]) {
        payinByProvider[provider] = { count: 0, amount: 0, successfulCount: 0, successfulAmount: 0 };
      }
      payinByProvider[provider].count++;
      payinByProvider[provider].amount += getPayinAmount(txn);
      
      if (txn.status === 'completed') {
        payinByProvider[provider].successfulCount++;
        payinByProvider[provider].successfulAmount += getPayinAmount(txn);
      }
    });

    const payoutByProvider = {};
    payoutTransactions.forEach(txn => {
      const provider = txn.provider || 'unknown';
      if (!payoutByProvider[provider]) {
        payoutByProvider[provider] = { count: 0, amount: 0, successfulCount: 0, successfulAmount: 0 };
      }
      payoutByProvider[provider].count++;
      payoutByProvider[provider].amount += getPayoutAmount(txn);
      
      if (['success', 'completed'].includes(txn.status)) {
        payoutByProvider[provider].successfulCount++;
        payoutByProvider[provider].successfulAmount += getPayoutAmount(txn);
      }
    });

    // Prepare response
    const response = {
      success: true,
      data: {
        totals: {
          // All transactions (including failed)
          allTransactions: {
            payin: totalPayinAmount,
            payout: totalPayoutAmount,
            nagadDeposit: totalNagadDepositAmount,
            bankDeposit: totalBankDepositAmount,
            total: totalPayinAmount + totalPayoutAmount + 
                   totalNagadDepositAmount + totalBankDepositAmount
          },
          // Successful transactions only
          successfulTransactions: {
            payin: totalSuccessfulPayinAmount,
            payout: totalSuccessfulPayoutAmount,
            nagadDeposit: totalSuccessfulNagadDepositAmount,
            bankDeposit: totalSuccessfulBankDepositAmount,
            total: totalSuccessfulPayinAmount + totalSuccessfulPayoutAmount + 
                   totalSuccessfulNagadDepositAmount + totalSuccessfulBankDepositAmount,
            net: netAmount
          }
        },
        counts: {
          allTransactions: totalTransactions,
          successfulTransactions: successfulTransactions
        },
        successRates: Object.fromEntries(
          Object.entries(successRates).map(([key, value]) => [key, Math.round(value * 100) / 100])
        ),
        breakdown: {
          payinByProvider,
          payoutByProvider
        },
        filters: {
          startDate: startDate || 'not specified',
          endDate: endDate || 'not specified',
          merchantId: merchantId || 'not specified',
          provider: provider || 'not specified',
          currency: currency || 'not specified'
        }
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Error fetching transaction totals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction totals',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});
// Get all users
Adminroute.get('/users', adminController.getAllUsers);

// Get active users
Adminroute.get('/users/active', adminController.getActiveUsers);

// Get inactive users
Adminroute.get('/users/inactive', adminController.getInactiveUsers);

// delete user by ID
Adminroute.delete('/users/:id',async (req,res)=>{
    try {
        const user=await UserModel.findById({_id:req.params.id});
        if(!user){
            return res.send({success:false,message:"Agent did not find."})
        }
        await UserModel.findByIdAndDelete({_id:req.params.id});
        res.send({success:true,message:"Agent deleted successfully."})
    } catch (error) {
        console.log(error)
    }
});
Adminroute.get("/single-user-payin/:id",async(req,res)=>{
  try {
    const payin=await PayinTransaction.find({userid:req.params.id});
    const payout=await PayoutTransaction.find({update_by:req.params.id});
    if(!payin){
       return res.send({success:false,message:"Payin not found."})
    }
        if(!payout){
       return res.send({success:false,message:"Payin not found."})
    }
    res.send({success:true,payin,payout})
  } catch (error) {
    console.log(error)
  }
})
// update user
// Updated Admin route for commissions
Adminroute.put('/users-commissions/:id', async (req, res) => {
    try {
        let { withdracommission, depositcommission, paymentMethod, paymentBrand } = req.body;
        console.log('Received request body:', req.body);

        // Convert string numbers to actual numbers if they're string representations
        if (typeof withdracommission === 'string') {
            withdracommission = parseFloat(withdracommission);
        }
        if (typeof depositcommission === 'string') {
            depositcommission = parseFloat(depositcommission);
        }

        // Validate commission values are now valid numbers
        if (typeof withdracommission !== 'number' || isNaN(withdracommission) ||
            typeof depositcommission !== 'number' || isNaN(depositcommission)) {
            return res.status(400).json({ 
                success: false, 
                message: "Commission values must be valid numbers" 
            });
        }

        // Validate commission ranges (0-100 as example)
        if (withdracommission < 0 || withdracommission > 100 ||
            depositcommission < 0 || depositcommission > 100) {
            return res.status(400).json({
                success: false,
                message: "Commission values must be between 0 and 100"
            });
        }

        // Validate paymentMethod is an array if provided
        if (paymentMethod && !Array.isArray(paymentMethod)) {
            return res.status(400).json({ 
                success: false, 
                message: "Payment method must be an array" 
            });
        }

        // Check if payment methods exceed the limit (5 as per your schema)
        if (paymentMethod && paymentMethod.length > 15) {
            return res.status(400).json({ 
                success: false, 
                message: "Cannot have more than 15 payment methods" 
            });
        }

        // Check if user exists
        const user = await UserModel.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "Agent not found" 
            });
        }

        // Prepare update object
        const updateData = {
            withdracommission,
            depositcommission
        };
        
        // Only update paymentMethod if it's provided
        if (paymentMethod) {
            // Validate each payment method (optional)
           const validMethods = [
  'Bkash P2C',
  'Bkash P2P',
  'Nagad Free',
  'Upay P2P',
  'Brac Bank',
  'Nagad P2C',
  'Nagad P2P',
  'Rocket P2P',
  'Dutch Bangla Bank',
  'UCB Bank'
];

            const invalidMethods = paymentMethod.filter(method => !validMethods.includes(method));
            
            if (invalidMethods.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid payment methods: ${invalidMethods.join(', ')}`
                });
            }
            
            updateData.paymentMethod = paymentMethod;
        }
        
        if (paymentBrand) {
            // Validate payment brand (optional)
            const validBrands = ['bKash', 'Nagad', 'Rocket', 'Upay']; // Add all valid brands
            if (!validBrands.includes(paymentBrand)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid payment brand. Must be one of: ${validBrands.join(', ')}`
                });
            }
            
            updateData.paymentbrand = paymentBrand;
        }

        // Update the user with validation
        const updatedUser = await UserModel.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { 
                new: true, 
                runValidators: true, // Ensures schema validations run
                context: 'query' // Needed for some validation to work properly
            }
        ).select('-password -__v'); // Exclude sensitive fields

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "Agent not found after update attempt"
            });
        }

        res.status(200).json({ 
            success: true, 
            message: "Agent commissions updated successfully",
            data: updatedUser 
        });
    } catch (error) {
        console.error('Error updating agent commissions:', error);
        
        // Handle specific errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ 
                success: false, 
                message: "Validation error",
                errors: messages 
            });
        }
        
        if (error.name === 'CastError') {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid ID format" 
            });
        }

        res.status(500).json({ 
            success: false, 
            message: "Internal server error",
            error: error.message 
        });
    }
});
// Update user status
Adminroute.patch('/users/:id/status', adminController.updateUserStatus);
Adminroute.put("/user-currentstatus/:id",async (req, res) => {
  try {
    const { currentstatus } = req.body;
      console.log(currentstatus)


    const user = await UserModel.findByIdAndUpdate(
      req.params.id,
      { currentstatus },
      { new: true }
    ).select('-password -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
})
// Get all prepayment requests
Adminroute.get('/prepayment-requests', async (req, res) => {
    try {
        const requests = await PrepaymentRequest.find().sort({ requestDate: -1 });
        res.send({ success: true, data: requests });
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Error fetching prepayment requests" });
    }
});
Adminroute.get('/single-user/:id',async(req,res)=>{
    try {
        const user=await UserModel.findById({_id:req.params.id});
        const bankaccount=await BankAccount.find({user_id:req.params.id})
        if(!user){
            return res.send({success:false,message:"User did not find."})
        }
        res.send({success:true,user,bankaccount});
    } catch (error) {
        console.log(error)
    }
});
// -------------------------update-user-information----------------------------
// Update user profile
Adminroute.put('/users/:id', async (req, res) => {
  try {
    const {
      username,
      name,
      email,
      identity,
      role,
      status,
      is_admin,
      withdracommission,
      depositcommission,
      paymentMethod,
      paymentbrand,
      currency
    } = req.body;

    // Find the user
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).send({ success: false, message: 'User not found' });
    }

    // Prepare update object
    const updateData = {
      username: username || user.username,
      name: name || user.name,
      email: email || user.email,
      identity: identity || user.identity,
      role: role || user.role,
      status: status || user.status,
      is_admin: is_admin !== undefined ? is_admin : user.is_admin,
      withdracommission: withdracommission !== undefined ? withdracommission : user.withdracommission,
      depositcommission: depositcommission !== undefined ? depositcommission : user.depositcommission,
      paymentMethod: paymentMethod || user.paymentMethod,
      paymentbrand: paymentbrand || user.paymentbrand,
      currency: currency || user.currency
    };

    // Update the user
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password -__v');

    res.send({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      // Handle duplicate key error (unique fields)
      return res.status(400).send({
        success: false,
        message: 'Username or email already exists'
      });
    }
    res.status(500).send({
      success: false,
      message: 'Error updating user'
    });
  }
});

// Update agent account
Adminroute.put('/users/:userId/agent-accounts/:accountId', async (req, res) => {
  try {
    const { userId, accountId } = req.params;
    const updateData = req.body;

    // Find the user
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).send({ success: false, message: 'User not found' });
    }

    // Find the agent account
    const accountIndex = user.agentAccounts.findIndex(acc => acc._id.equals(accountId));
    if (accountIndex === -1) {
      return res.status(404).send({ success: false, message: 'Agent account not found' });
    }

    // Handle default account setting
    if (updateData.isDefault) {
      user.agentAccounts.forEach(account => {
        account.isDefault = false;
      });
    }

    // Update the account
    user.agentAccounts[accountIndex] = {
      ...user.agentAccounts[accountIndex].toObject(),
      ...updateData,
      updatedAt: Date.now()
    };

    // Save the user
    const updatedUser = await user.save();

    res.send({
      success: true,
      message: 'Agent account updated successfully',
      data: updatedUser.agentAccounts[accountIndex]
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: 'Error updating agent account'
    });
  }
});

// Update user balance
Adminroute.put('/users/:id/balance', async (req, res) => {
  try {
    const { balance } = req.body;

    if (typeof balance !== 'number') {
      return res.status(400).send({ success: false, message: 'Balance must be a number' });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.params.id,
      { balance },
      { new: true }
    ).select('-password -__v');

    if (!updatedUser) {
      return res.status(404).send({ success: false, message: 'User not found' });
    }

    res.send({
      success: true,
      message: 'Balance updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: 'Error updating balance'
    });
  }
});

// Update user password (admin can reset password)
Adminroute.put('/users/:id/password', async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).send({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.params.id,
      { password: hashedPassword }, // Use the hashed password here instead of newPassword
      { new: true }
    ).select('-password -__v');

    if (!updatedUser) {
      return res.status(404).send({ success: false, message: 'User not found' });
    }

    res.send({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: 'Error updating password'
    });
  }
});
// Get requests by status
Adminroute.get('/prepayment-requests/:status', async (req, res) => {
    try {
        const status = req.params.status;
        if (!['Resolved', 'Pending', 'Rejected'].includes(status)) {
            return res.status(400).send({ success: false, message: "Invalid status" });
        }
        const requests = await PrepaymentRequest.find({ status }).sort({ requestDate: -1 });
        res.send({ success: true, data: requests });
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Error fetching prepayment requests" });
    }
});

// Update prepayment request status
Adminroute.patch('/prepayment-requests/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!['Resolved', 'Pending', 'Rejected'].includes(status)) {
            return res.status(400).send({ success: false, message: "Invalid status" });
        }
        
        const request = await PrepaymentRequest.findByIdAndUpdate(
            req.params.id,
            { status, updateDate: new Date() },
            { new: true }
        );
          
        if (!request) {
            return res.status(404).send({ success: false, message: "Request not found" });
        }
    
        res.send({ success: true, message: "Status updated successfully", data: request });
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Error updating request status" });
    }
});

// Update prepayment request details
Adminroute.put('/prepayment-requests/:id', async (req, res) => {
    try {
        const { requestAmount, paidAmount, note, status } = req.body;

        // Convert paidAmount to number
        const paidAmountNumber = Number(paidAmount);

        const request = await PrepaymentRequest.findByIdAndUpdate(
            req.params.id,
            { 
                requestAmount, 
                paidAmount: paidAmountNumber,  // Use the converted number
                note,
                status,
                updateDate: new Date() 
            },
            { new: true }
        );
        
        const find_user = await UserModel.findById({_id: request.userid});
        
        if(status === "Resolved") {
            // Ensure we're adding a number to the balance
            find_user.balance += paidAmountNumber;
            find_user.totalprepayment+=paidAmountNumber;
            await find_user.save();
        }
        
        if (!request) {
            return res.status(404).send({ success: false, message: "Request not found" });
        }

        res.send({ success: true, message: "Request updated successfully", data: request });
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Error updating request" });
    }
});
// Delete prepayment request
Adminroute.delete('/prepayment-requests/:id', async (req, res) => {
    try {
        const request = await PrepaymentRequest.findByIdAndDelete(req.params.id);
        if (!request) {
            return res.status(404).send({ success: false, message: "Request not found" });
        }
        res.send({ success: true, message: "Request deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Error deleting request" });
    }
});
// Get a single bank account
Adminroute.get('/bank-account/:id', async (req, res) => {
  try {
    const bankAccount = await BankAccount.findOne({ 
      _id: req.params.id, 
      user_id: req.user._id 
    });

    if (!bankAccount) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bank account not found' 
      });
    }

    res.json({
      success: true,
      data: bankAccount
    });
  } catch (error) {
    console.error('Error fetching bank account:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while fetching the bank account',
      error: error.message 
    });
  }
});

// Update a bank account
Adminroute.put('/update-bank-account/:id',async (req, res) => {
  try {
    const { provider, accountNumber, shopName, walletType } = req.body;
    console.log(req.params.id)
    // Validate required fields
    if (!provider || !accountNumber || !shopName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Provider, account number, and shop name are required' 
      });
    }

    // Validate account number format
    const accountNumberRegex = /^01\d{9}$/;
    if (!accountNumberRegex.test(accountNumber)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid account number format. Must be 11 digits starting with 01' 
      });
    }

    const bankAccount = await BankAccount.findOneAndUpdate(
      { _id: req.params.id},
      req.body,
      { new: true, runValidators: true }
    );

    if (!bankAccount) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bank account not found' 
      });
    }

    res.json({
      success: true,
      message: 'Bank account updated successfully',
      data: bankAccount
    });
  } catch (error) {
    console.error('Error updating bank account:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while updating the bank account',
      error: error.message 
    });
  }
});

// Delete a bank account
Adminroute.delete('/delete-bank-account/:id', async (req, res) => {
  try {
    // First find the bank account to get the user_id
    const bankAccount = await BankAccount.findOne({ _id: req.params.id });
    
    if (!bankAccount) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bank account not found' 
      });
    }

    // Find the user
    const matchedUser = await UserModel.findById(bankAccount.user_id);
    
    if (!matchedUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Delete the bank account
    await BankAccount.findOneAndDelete({ _id: req.params.id });

    // Remove the corresponding agent account if it exists
    // Assuming the bank account's accountNumber matches the agent account's accountNumber
    matchedUser.agentAccounts = matchedUser.agentAccounts.filter(
      account => account.accountNumber !== bankAccount.accountNumber
    );
    
    // Decrement the total wallet count
    matchedUser.totalwallet -= 1;
    
    // Save the updated user
    await matchedUser.save();

    res.json({
      success: true,
      message: 'Bank account and corresponding agent account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bank account:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while deleting the bank account',
      error: error.message 
    });
  }
});
// Admin route to update bank account status
Adminroute.put('/bank-account-status/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    // Validate status
    if (!['active', 'inactive', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: active, inactive, pending'
      });
    }

    const bankAccount = await BankAccount.findOneAndUpdate(
      { _id: id },
      { status },
      { new: true, runValidators: true }
    );

    if (!bankAccount) {
      return res.status(404).json({
        success: false,
        message: 'Bank account not found'
      });
    }

    res.json({
      success: true,
      message: 'Bank account status updated successfully',
      data: bankAccount
    });

  } catch (error) {
    console.error('Error updating bank account status:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating the bank account status',
      error: error.message
    });
  }
});



// -----------------------payment--=------------------------------------
// Create new transaction
Adminroute.post('/payin', async (req, res) => {
  try {
    const transaction = new PayinTransaction(req.body);
    const savedTransaction = await transaction.save();
    res.status(201).json(savedTransaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
// Get all transactions with pagination, filtering, and sorting
Adminroute.get('/all-payin', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt', status, provider, paymentType, search } = req.query;
    
    const query = {};
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Filter by provider if provided
    if (provider) {
      query.provider = provider;
    }
    
    // Filter by paymentType if provided
    if (paymentType) {
      query.paymentType = paymentType;
    }
    
    // Search functionality using text index
    if (search) {
      query.$text = { $search: search };
    }
    
    const transactions = await PayinTransaction.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((page - 1) * limit)
      .exec();
    
    const count = await PayinTransaction.countDocuments(query);
    
    res.json({
      transactions,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalTransactions: count
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single transaction by ID
Adminroute.get('/payin/:id', async (req, res) => {
  try {
    const transaction = await PayinTransaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



// Update transaction
Adminroute.put('/payin/:id', async (req, res) => {
  try {
    const transaction = await PayinTransaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete transaction
Adminroute.delete('/payin/:id', async (req, res) => {
  try {
    const transaction = await PayinTransaction.findByIdAndDelete(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Change transaction status
Adminroute.patch('/payin/:id/status', async (req, res) => {
  try {
    const { status, update_by } = req.body;
    console.log(req.body)
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
        const transaction = await PayinTransaction.findByIdAndUpdate({_id:req.params.id});
    const transaction2 = await PayinTransaction.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        statusDate: new Date(),
        update_by: update_by || ''
      },
      { new: true, runValidators: true }
    );
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    const bankaccount=await BankAccount.findOne({accountNumber:transaction.agentAccount});
 if(!bankaccount){
  return res.send({success:false,message:"Agent did not find."})
 }
    if (status === "completed") {
    bankaccount.total_order+=1;
         bankaccount.total_recieved+=transaction.expectedAmount;
         bankaccount.save();
  
        //  ------------------merchant---------------------
        const merchant_info=await Merchantkey.findById({_id:transaction.merchantid});
        const matcheduser=await UserModel.findById({_id:bankaccount.user_id});
        const commissionsmoney=(transaction.expectedAmount/100)*merchant_info.depositCommission;
        merchant_info.balance+=transaction.expectedAmount;
        merchant_info.balance-=commissionsmoney;
        merchant_info.getwaycost+=commissionsmoney;
        merchant_info.total_payin+=transaction.expectedAmount;
        merchant_info.save();
        //  ------------------update-agent-------------------
        const comissionmoney=(transaction.expectedAmount/100)*matcheduser.depositcommission;
        console.log(comissionmoney)
        matcheduser.balance-=transaction.expectedAmount;
        matcheduser.balance+=comissionmoney;
        matcheduser.providercost+=comissionmoney;
        matcheduser.totalpayment+=transaction.expectedAmount;
        matcheduser.save();
    }
    res.json(transaction2);
  } catch (err) {
    console.log(err)
    res.status(400).json({ message: err.message });
  }
});

// Search transactions (using text index)
Adminroute.get('/payin/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const transactions = await PayinTransaction.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });
    
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// -----------------------all-payout---------------------------
// Get all transactions with pagination, filtering, and sorting
Adminroute.get('/all-payout', async (req, res) => {
  try {
     const allpayout=await PayoutTransaction.find().sort({ createdAt: -1 });
     if(!allpayout){
      return res.send({success:false,message:"No Payout Found!"})
     }
     res.send({success:true,data:allpayout})
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

Adminroute.put('/change-payout-status/:id', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const transaction = await PayoutTransaction.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        statusDate: new Date(),
      },
      { new: true, runValidators: true }
    );
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
Adminroute.delete('/payout/:id', async (req, res) => {
  try {
    const transaction = await PayoutTransaction.findByIdAndDelete(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Filter payout transactions by date range
Adminroute.post('/payout-filter-by-date', async (req, res) => {
  try {
    const { startDate, endDate, transactionId } = req.body;

    // Validate input
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false,
        message: 'Start date and end date are required' 
      });
    }

    // Convert dates to proper Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the entire end day

    // Build query
    const query = { 
      createdAt: { 
        $gte: start,
        $lte: end
      }
    };

    // Add transactionId filter if provided
    if (transactionId) {
      query.$or = [
        { paymentId: transactionId },
        { orderId: transactionId },
        { transactionId: transactionId }
      ];
    }

    // Fetch transactions
    const transactions = await PayoutTransaction.find(query)
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean();

    // Format response data to match what the frontend expects
    const formattedTransactions = transactions.map(txn => ({
      id: txn._id,
      date: txn.createdAt.toLocaleDateString(),
      amount: txn.requestAmount,
      currency: txn.currency,
      status: txn.status.charAt(0).toUpperCase() + txn.status.slice(1), // Capitalize first letter
      paymentId: txn.paymentId,
      orderId: txn.orderId,
      payeeAccount: txn.payeeAccount
    }));

    res.json({ 
      success: true,
      transactions: formattedTransactions 
    });

  } catch (error) {
    console.error('Error filtering transactions:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while filtering transactions' 
    });
  }
});
// ---------------forwardms---------------------
Adminroute.get("/forward-sms",async(req,res)=>{
  try {
     const allsms=await ForwardedSms.find();
     if(!allsms){
      return res.send({success:false,message:"Do not have any message."})
     }
     res.send({success:true,data:allsms})
  } catch (error){
    console.log(error)
  }
})
Adminroute.delete("/forward-sms/:id",async(req,res)=>{
  try {
     const singlemesssage=await ForwardedSms.findByIdAndDelete({_id:req.params.id});
     if(!singlemesssage){
      return res.send({success:false,message:"Do not have any message."})
     }
     res.send({success:true,message:"Deleted successfully."})
  } catch (error){
    console.log(error)
  }
})

// ----------------total-analytics--------------------------------
const moment = require('moment');
const Merchantkey = require('../Models/Merchantkey');
const MerchantPaymentRequest = require('../Models/MerchantPaymentRequest');
const Merchantwithdraw = require('../Models/Merchantwithdraw');

Adminroute.get("/admin-overview", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set start of the day

    // Fetch all successful deposits and withdrawals
    const success_deposit = await NagadFreeDeposit.find({ status: "success" });
    const rejected_deposit = await NagadFreeDeposit.find({ status: "failed" });
    const rejected_withdraw = await BankDeposit.find({ status: "rejected" });
    const successful_withdraw = await BankDeposit.find({ status: "success" });

    // Fetch payin data
    const successful_payin = await PayinTransaction.find({ status: "completed" });
    const rejected_payin = await PayinTransaction.find({ 
      status: { $in: ["rejected", "expired", "suspended"] } 
    });

    // Fetch payout data
    const successful_payout = await PayoutTransaction.find({ 
      status: { $in: ["success", "completed"] } 
    });
    const rejected_payout = await PayoutTransaction.find({ 
      status: { $in: ["rejected", "failed", "error"] } 
    });

    // Fetch nagad free data
    const successful_nagad_free = await NagadFreeDeposit.find({ 
      status: { $in: ["completed", "processing"] } 
    });
    const rejected_nagad_free = await NagadFreeDeposit.find({ 
      status: { $in: ["failed", "cancelled"] } 
    });

    // Fetch bank transfer data
    const successful_bank_transfer = await BankDeposit.find({ 
      status: { $in: ["completed", "processing"] } 
    });
    const rejected_bank_transfer = await BankDeposit.find({ 
      status: { $in: ["failed", "cancelled"] } 
    });

    // Calculate total rejected amounts
    const totalRejectedDeposit = rejected_deposit.reduce((sum, txn) => sum + txn.amount, 0);
    const totalRejectedWithdraw = rejected_withdraw.reduce((sum, txn) => sum + txn.amount, 0);
    const totalRejectedPayin = rejected_payin.reduce((sum, txn) => sum + (txn.receivedAmount || txn.expectedAmount || 0), 0);
    const totalRejectedPayout = rejected_payout.reduce((sum, txn) => sum + txn.requestAmount, 0);
    const totalRejectedNagadFree = rejected_nagad_free.reduce((sum, txn) => sum + txn.amount, 0);
    const totalRejectedBankTransfer = rejected_bank_transfer.reduce((sum, txn) => sum + txn.amount, 0);

    // Calculate total successful amounts
    const totalDeposit = success_deposit.reduce((sum, txn) => sum + txn.amount, 0);
    const totalWithdraw = successful_withdraw.reduce((sum, txn) => sum + txn.amount, 0);
    const totalPayin = successful_payin.reduce((sum, txn) => sum + (txn.receivedAmount || txn.expectedAmount || 0), 0);
    const totalPayout = successful_payout.reduce((sum, txn) => sum + txn.requestAmount, 0);
    const totalNagadFree = successful_nagad_free.reduce((sum, txn) => sum + txn.amount, 0);
    const totalBankTransfer = successful_bank_transfer.reduce((sum, txn) => sum + txn.amount, 0);

    // Calculate today's amounts
    const todaysDeposit = success_deposit
      .filter(txn => new Date(txn.createdAt) >= today)
      .reduce((sum, txn) => sum + txn.amount, 0);

    const todaysWithdraw = successful_withdraw
      .filter(txn => new Date(txn.createdAt) >= today)
      .reduce((sum, txn) => sum + txn.amount, 0);

    const todaysPayin = successful_payin
      .filter(txn => new Date(txn.createdAt) >= today)
      .reduce((sum, txn) => sum + (txn.receivedAmount || txn.expectedAmount || 0), 0);

    const todaysPayout = successful_payout
      .filter(txn => new Date(txn.createdAt) >= today)
      .reduce((sum, txn) => sum + txn.requestAmount, 0);

    const todaysNagadFree = successful_nagad_free
      .filter(txn => new Date(txn.createdAt) >= today)
      .reduce((sum, txn) => sum + txn.amount, 0);

    const todaysBankTransfer = successful_bank_transfer
      .filter(txn => new Date(txn.createdAt) >= today)
      .reduce((sum, txn) => sum + txn.amount, 0);

    // Calculate history data for charts
    const depositHistory = success_deposit.map(txn => ({
      date: new Date(txn.createdAt).toLocaleDateString(),
      amount: txn.amount,
    }));

    const withdrawHistory = successful_withdraw.map(txn => ({
      date: new Date(txn.createdAt).toLocaleDateString(),
      amount: txn.amount,
    }));

    const payinHistory = successful_payin.map(txn => ({
      date: new Date(txn.createdAt).toLocaleDateString(),
      amount: txn.receivedAmount || txn.expectedAmount || 0,
    }));

    const payoutHistory = successful_payout.map(txn => ({
      date: new Date(txn.createdAt).toLocaleDateString(),
      amount: txn.requestAmount,
    }));

    // Calculate tax data for withdrawal
    const totalWithdrawTax = successful_withdraw.reduce((sum, txn) => sum + (txn.tax_amount || 0), 0);
    const todaysWithdrawTax = successful_withdraw
      .filter(txn => new Date(txn.createdAt) >= today)
      .reduce((sum, txn) => sum + (txn.tax_amount || 0), 0);

    // Calculate trends and differences
    const withdrawDifference = todaysWithdraw - todaysDeposit;
    const withdrawPercentageDifference = todaysDeposit > 0 ? ((withdrawDifference / todaysDeposit) * 100).toFixed(2) : 0;
    const withdrawTrend = withdrawDifference > 0 ? "up" : "down";

    const depositDifference = todaysDeposit - todaysWithdraw;
    const depositPercentageDifference = todaysWithdraw > 0 ? ((depositDifference / todaysWithdraw) * 100).toFixed(2) : 0;
    const depositTrend = depositDifference > 0 ? "up" : "down";

    // Calculate overall totals
    const totalAllDeposits = totalDeposit + totalPayin + totalNagadFree + totalBankTransfer;
    const totalAllWithdrawals = totalWithdraw + totalPayout;
    const todaysAllDeposits = todaysDeposit + todaysPayin + todaysNagadFree + todaysBankTransfer;
    const todaysAllWithdrawals = todaysWithdraw + todaysPayout;

    res.send({
      success: true,
      message: "ok",
      // Individual totals
      totalDeposit,
      todaysDeposit,
      totalWithdraw,
      todaysWithdraw,
      totalPayin,
      todaysPayin,
      totalPayout,
      todaysPayout,
      totalNagadFree,
      todaysNagadFree,
      totalBankTransfer,
      todaysBankTransfer,
      
      // Combined totals
      totalAllDeposits,
      totalAllWithdrawals,
      todaysAllDeposits,
      todaysAllWithdrawals,
      
      // Tax information
      totalWithdrawTax,
      todaysWithdrawTax,
      
      // Trends and differences
      withdrawDifference,
      withdrawPercentageDifference,
      withdrawTrend,
      depositDifference,
      depositPercentageDifference,
      depositTrend,
      
      // Rejected amounts
      totalRejectedDeposit,
      totalRejectedWithdraw,
      totalRejectedPayin,
      totalRejectedPayout,
      totalRejectedNagadFree,
      totalRejectedBankTransfer,
      
      // History data for charts
      depositHistory,
      withdrawHistory,
      payinHistory,
      payoutHistory
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Server Error" });
  }
});
Adminroute.get('/analytics', async (req, res) => {
  try {
    const { 
      period = 'month', 
      provider, 
      merchantId,
      startDate,
      endDate,
      currency = 'BDT'
    } = req.query;
    
    // Get date range based on period or custom dates
    let start, end;
    
    if (startDate && endDate) {
      start = moment(startDate).startOf('day');
      end = moment(endDate).endOf('day');
    } else {
      const now = moment();
      switch(period) {
        case 'today':
          start = now.clone().startOf('day');
          end = now.clone().endOf('day');
          break;
        case 'week':
          start = now.clone().startOf('week');
          end = now.clone().endOf('week');
          break;
        case 'month':
          start = now.clone().startOf('month');
          end = now.clone().endOf('month');
          break;
        case 'year':
          start = now.clone().startOf('year');
          end = now.clone().endOf('year');
          break;
        case 'all':
        default:
          start = moment(0); // beginning of time
          end = moment().endOf('day');
          break;
      }
    }
    
    // Base match query
    const baseMatchQuery = {
      createdAt: { $gte: start.toDate(), $lte: end.toDate() }
    };
    
    // Add merchant filter if specified
    if (merchantId) {
      baseMatchQuery.merchantid = merchantId;
    }
    
    // Add currency filter if specified
    if (currency) {
      baseMatchQuery.currency = currency.toUpperCase();
    }
    
    // Provider-specific match queries
    const nagadMatchQuery = {
      ...baseMatchQuery,
      provider: /nagad/i
    };
    
    const bankMatchQuery = {
      ...baseMatchQuery,
      provider: /bank/i
    };
    
    // Add provider filter if specified
    if (provider) {
      baseMatchQuery.provider = new RegExp(provider, 'i');
    }
    
    // Helper function to get the correct amount field based on payment type
    const getPayinAmountField = {
      $cond: {
        if: { $eq: ['$paymentType', 'p2c'] },
        then: '$expectedAmount',
        else: '$receivedAmount'
      }
    };
    
    // Common aggregation pipelines
    const createPayinStatsPipeline = (matchQuery) => [
      { $match: { ...matchQuery, status: 'completed' } },
      { 
        $group: {
          _id: '$provider',
          count: { $sum: 1 },
          totalAmount: { $sum: getPayinAmountField },
          avgAmount: { $avg: getPayinAmountField },
          minAmount: { $min: getPayinAmountField },
          maxAmount: { $max: getPayinAmountField }
        }
      },
      { $sort: { totalAmount: -1 } }
    ];
    
    const createPayoutStatsPipeline = (matchQuery) => [
      { $match: { ...matchQuery, status: 'success' } },
      { 
        $group: {
          _id: '$provider',
          count: { $sum: 1 },
          totalAmount: { $sum: '$sentAmount' },
          avgAmount: { $avg: '$sentAmount' },
          minAmount: { $min: '$sentAmount' },
          maxAmount: { $max: '$sentAmount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ];
    
    const createStatusCountPipeline = (model, matchQuery, statusField, amountField) => [
      { $match: matchQuery },
      {
        $group: {
          _id: `$${statusField}`,
          count: { $sum: 1 },
          totalAmount: { $sum: amountField }
        }
      }
    ];
    
    const createTrendPipeline = (matchQuery, status, amountField, period) => [
      { $match: { ...matchQuery, status } },
      {
        $group: {
          _id: period === 'today' ? { $hour: '$createdAt' } : 
               period === 'week' ? { $dayOfWeek: '$createdAt' } :
               period === 'month' ? { $dayOfMonth: '$createdAt' } : 
               { $month: '$createdAt' },
          count: { $sum: 1 },
          amount: { $sum: amountField }
        }
      },
      { $sort: { _id: 1 } }
    ];
    
    // Execute all queries in parallel
    const queries = {
      // General stats
      payinStats: PayinTransaction.aggregate(createPayinStatsPipeline(baseMatchQuery)),
      payoutStats: PayoutTransaction.aggregate(createPayoutStatsPipeline(baseMatchQuery)),
      
      // Payin status breakdown
      payinStatusBreakdown: PayinTransaction.aggregate(
        createStatusCountPipeline(PayinTransaction, baseMatchQuery, 'status', getPayinAmountField)
      ),
      
      // Payout status breakdown
      payoutStatusBreakdown: PayoutTransaction.aggregate(
        createStatusCountPipeline(PayoutTransaction, baseMatchQuery, 'status', '$sentAmount')
      ),
      
      // Trends
      payinTrend: PayinTransaction.aggregate(
        createTrendPipeline(baseMatchQuery, 'completed', getPayinAmountField, period)
      ),
      payoutTrend: PayoutTransaction.aggregate(
        createTrendPipeline(baseMatchQuery, 'success', '$sentAmount', period)
      ),
      
      // Top accounts
      topPayinAccounts: PayinTransaction.aggregate([
        { $match: { ...baseMatchQuery, status: 'completed' } },
        {
          $group: {
            _id: '$payerAccount',
            count: { $sum: 1 },
            totalAmount: { $sum: getPayinAmountField }
          }
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 10 }
      ]),
      
      topPayoutAccounts: PayoutTransaction.aggregate([
        { $match: { ...baseMatchQuery, status: 'success' } },
        {
          $group: {
            _id: '$payeeAccount',
            count: { $sum: 1 },
            totalAmount: { $sum: '$sentAmount' }
          }
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 10 }
      ]),
      
      // Nagad-specific queries
      nagadPayinStats: PayinTransaction.aggregate(createPayinStatsPipeline(nagadMatchQuery)),
      nagadPayoutStats: PayoutTransaction.aggregate(createPayoutStatsPipeline(nagadMatchQuery)),
      nagadPayinTrend: PayinTransaction.aggregate(
        createTrendPipeline(nagadMatchQuery, 'completed', getPayinAmountField, period)
      ),
      nagadPayoutTrend: PayoutTransaction.aggregate(
        createTrendPipeline(nagadMatchQuery, 'success', '$sentAmount', period)
      ),
      
      // Bank-specific queries
      bankPayinStats: PayinTransaction.aggregate(createPayinStatsPipeline(bankMatchQuery)),
      bankPayoutStats: PayoutTransaction.aggregate(createPayoutStatsPipeline(bankMatchQuery)),
      
      // Transaction counts by type
      totalTransactions: Promise.all([
        PayinTransaction.countDocuments(baseMatchQuery),
        PayoutTransaction.countDocuments(baseMatchQuery),
        NagadFreeDeposit.countDocuments(baseMatchQuery),
        BankDeposit.countDocuments(baseMatchQuery)
      ]),
      
      // Success rates
      payinSuccessRate: PayinTransaction.aggregate([
        { $match: baseMatchQuery },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            }
          }
        }
      ]),
      
      payoutSuccessRate: PayoutTransaction.aggregate([
        { $match: baseMatchQuery },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            success: {
              $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] }
            }
          }
        }
      ])
    };
    
    // Execute all queries
    const results = await Promise.all(Object.values(queries));
    const data = {};
    Object.keys(queries).forEach((key, index) => {
      data[key] = results[index];
    });
    
    // Helper function to extract amount from aggregation results
    const getAmount = (result) => result[0]?.totalAmount || 0;
    const getStatusAmount = (breakdown, status) => 
      breakdown.find(item => item._id === status)?.totalAmount || 0;
    const getStatusCount = (breakdown, status) => 
      breakdown.find(item => item._id === status)?.count || 0;
    
    // Calculate success rates
    const payinSuccessRateData = data.payinSuccessRate[0] || { total: 0, completed: 0 };
    const payoutSuccessRateData = data.payoutSuccessRate[0] || { total: 0, success: 0 };
    
    const payinSuccessRate = payinSuccessRateData.total > 0 
      ? (payinSuccessRateData.completed / payinSuccessRateData.total) * 100 
      : 0;
      
    const payoutSuccessRate = payoutSuccessRateData.total > 0 
      ? (payoutSuccessRateData.success / payoutSuccessRateData.total) * 100 
      : 0;
    
    // Response data
    const analyticsData = {
      period: {
        start: start.toDate(),
        end: end.toDate(),
        name: period,
        currency
      },
      summary: {
        totalTransactions: data.totalTransactions.reduce((sum, count) => sum + count, 0),
        totalPayins: data.totalTransactions[0],
        totalPayouts: data.totalTransactions[1],
        totalNagadFreeDeposits: data.totalTransactions[2],
        totalBankDeposits: data.totalTransactions[3],
        successRates: {
          payin: Math.round(payinSuccessRate * 100) / 100,
          payout: Math.round(payoutSuccessRate * 100) / 100
        }
      },
      totals: {
        // All transactions
        payin: {
          total: data.payinStatusBreakdown.reduce((sum, item) => sum + item.totalAmount, 0),
          completed: getStatusAmount(data.payinStatusBreakdown, 'completed'),
          pending: getStatusAmount(data.payinStatusBreakdown, 'pending'),
          rejected: getStatusAmount(data.payinStatusBreakdown, 'rejected')
        },
        payout: {
          total: data.payoutStatusBreakdown.reduce((sum, item) => sum + item.totalAmount, 0),
          success: getStatusAmount(data.payoutStatusBreakdown, 'success'),
          pending: getStatusAmount(data.payoutStatusBreakdown, 'pending'),
          rejected: getStatusAmount(data.payoutStatusBreakdown, 'rejected')
        },
        net: getStatusAmount(data.payinStatusBreakdown, 'completed') - 
             getStatusAmount(data.payoutStatusBreakdown, 'success'),
        
        // Nagad-specific
        nagad: {
          payin: data.nagadPayinStats.reduce((sum, item) => sum + item.totalAmount, 0),
          payout: data.nagadPayoutStats.reduce((sum, item) => sum + item.totalAmount, 0),
          net: data.nagadPayinStats.reduce((sum, item) => sum + item.totalAmount, 0) - 
               data.nagadPayoutStats.reduce((sum, item) => sum + item.totalAmount, 0)
        },
        
        // Bank-specific
        bank: {
          payin: data.bankPayinStats.reduce((sum, item) => sum + item.totalAmount, 0),
          payout: data.bankPayoutStats.reduce((sum, item) => sum + item.totalAmount, 0),
          net: data.bankPayinStats.reduce((sum, item) => sum + item.totalAmount, 0) - 
               data.bankPayoutStats.reduce((sum, item) => sum + item.totalAmount, 0)
        }
      },
      counts: {
        payin: {
          total: data.payinStatusBreakdown.reduce((sum, item) => sum + item.count, 0),
          completed: getStatusCount(data.payinStatusBreakdown, 'completed'),
          pending: getStatusCount(data.payinStatusBreakdown, 'pending'),
          rejected: getStatusCount(data.payinStatusBreakdown, 'rejected')
        },
        payout: {
          total: data.payoutStatusBreakdown.reduce((sum, item) => sum + item.count, 0),
          success: getStatusCount(data.payoutStatusBreakdown, 'success'),
          pending: getStatusCount(data.payoutStatusBreakdown, 'pending'),
          rejected: getStatusCount(data.payoutStatusBreakdown, 'rejected')
        }
      },
      providers: {
        payin: data.payinStats,
        payout: data.payoutStats,
        nagad: {
          payin: data.nagadPayinStats,
          payout: data.nagadPayoutStats
        },
        bank: {
          payin: data.bankPayinStats,
          payout: data.bankPayoutStats
        }
      },
      trends: {
        payin: data.payinTrend,
        payout: data.payoutTrend,
        nagad: {
          payin: data.nagadPayinTrend,
          payout: data.nagadPayoutTrend
        }
      },
      topAccounts: {
        payin: data.topPayinAccounts,
        payout: data.topPayoutAccounts
      }
    };
    
    res.json({
      success: true,
      data: analyticsData,
      metadata: {
        generatedAt: new Date(),
        filters: {
          period,
          provider,
          merchantId,
          currency,
          startDate: start.toISOString(),
          endDate: end.toISOString()
        }
      }
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Route to get the total gateway cost of all merchants
Adminroute.get('/total-getwaycost', async (req, res) => {
  try {
    const merchants = await Merchantkey.find();

    // Calculate the total getwaycost
    const totalGetwaycost = merchants.reduce((total, merchant) => total + (merchant.getwaycost || 0), 0);

    // Return the total gateway cost
    res.status(200).json({ totalGetwaycost });
  } catch (error) {
    console.error('Error fetching total getwaycost:', error);
    res.status(500).json({ error: 'An error occurred while fetching the total gateway cost.' });
  }
});
// -----------------------api-key-----------------------------------

// POST - Create new merchant
Adminroute.post('/merchant-key', async (req, res) => {
  try {
    const { name, email, password, websiteUrl, withdrawCommission, depositCommission } = req.body;
    
    // Validate required fields
    if (!name || !email || !password || !websiteUrl || withdrawCommission === undefined || depositCommission === undefined) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Validate commission values
    if (isNaN(withdrawCommission) || withdrawCommission < 0 || withdrawCommission > 100) {
      return res.status(400).json({ error: 'Withdraw commission must be a number between 0 and 100' });
    }
    if (isNaN(depositCommission) || depositCommission < 0 || depositCommission > 100) {
      return res.status(400).json({ error: 'Deposit commission must be a number between 0 and 100' });
    }

    const hashpassword = await bcrypt.hash(password, 10);
    
    // Create new merchant with all required fields
    const merchant = new Merchantkey({
      name,
      email,
      password: hashpassword,
      websiteUrl,
      withdrawCommission,
      depositCommission
      // apiKey and createdAt will be automatically generated
    });

    await merchant.save();
    
    // Return response without the hashed password
    res.status(201).json({
      message: 'Merchant created successfully',
      merchant: {
        id: merchant._id,
        name: merchant.name,
        email: merchant.email,
        websiteUrl: merchant.websiteUrl,
        withdrawCommission: merchant.withdrawCommission,
        depositCommission: merchant.depositCommission,
        apiKey: merchant.apiKey,
        createdAt: merchant.createdAt
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      // Handle duplicate email or apiKey
      const field = err.message.includes('email') ? 'Email' : 'API key';
      return res.status(400).json({ error: `${field} already exists` });
    }
    if (err.name === 'ValidationError') {
      // Handle mongoose validation errors
      return res.status(400).json({ error: err.message });
    }
    console.error('Error creating merchant:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT - Update merchant by ID
Adminroute.put('/merchant-key/:id', async (req, res) => {
  try {
    const { name, email, websiteUrl, withdrawCommission, depositCommission } = req.body;
    
    // Validate commission values if provided
    if (withdrawCommission !== undefined) {
      if (isNaN(withdrawCommission) || withdrawCommission < 0 || withdrawCommission > 100) {
        return res.status(400).json({ error: 'Withdraw commission must be a number between 0 and 100' });
      }
    }
    if (depositCommission !== undefined) {
      if (isNaN(depositCommission) || depositCommission < 0 || depositCommission > 100) {
        return res.status(400).json({ error: 'Deposit commission must be a number between 0 and 100' });
      }
    }

    const updateData = {
      name,
      email,
      websiteUrl
    };

    // Only add commission fields if they're provided
    if (withdrawCommission !== undefined) updateData.withdrawCommission = withdrawCommission;
    if (depositCommission !== undefined) updateData.depositCommission = depositCommission;

    const merchant = await Merchantkey.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    res.json({
      message: 'Merchant updated successfully',
      merchant: {
        id: merchant._id,
        name: merchant.name,
        email: merchant.email,
        websiteUrl: merchant.websiteUrl,
        withdrawCommission: merchant.withdrawCommission,
        depositCommission: merchant.depositCommission,
        apiKey: merchant.apiKey,
        createdAt: merchant.createdAt
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    console.error('Error updating merchant:', err);
    res.status(500).json({ error: 'Server error' });
  }
});
// DELETE - Remove merchant by ID
Adminroute.delete('/merchant-key/:id', async (req, res) => {
  try {
    const merchant = await Merchantkey.findByIdAndDelete(req.params.id);

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    res.json({
      message: 'Merchant deleted successfully',
      merchantId: req.params.id
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
Adminroute.get('/merchant-key', async (req, res) => {
  try {
    const merchant = await Merchantkey.find();

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    res.json({
      message: 'Merchant successfully',
      merchant:merchant
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
// ------------------------merchant-payment---------------------
// Get all payment requests
// Get all payment requests with pagination
Adminroute.get('/merchant-payment', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count of documents
    const total = await MerchantPaymentRequest.countDocuments();

    // Get paginated data
    const requests = await MerchantPaymentRequest.find()
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      count: requests.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: requests
    });
  } catch (err) {
    console.error('Error fetching merchant payments:', err);
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + err.message
    });
  }
});

// Get single payment request by ID
Adminroute.get('/merchant-payment/:id', async (req, res) => {
  try {
    const request = await MerchantPaymentRequest.findById(req.params.id)
      .populate('merchantId', '-__v');

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'No payment request found with that ID'
      });
    }

    res.json({
      success: true,
      data: request
    });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'No payment request found with that ID'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + err.message
    });
  }
});

// Delete a payment request
Adminroute.delete('/merchant-payment/:id', async (req, res) => {
  try {
    const request = await MerchantPaymentRequest.findByIdAndDelete(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'No payment request found with that ID'
      });
    }

    res.json({
      success: true,
      data: {}
    });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'No payment request found with that ID'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + err.message
    });
  }
});

// Update payment request status
Adminroute.patch('/merchant-payment/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['pending', 'completed', 'failed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid status (pending, completed, failed, cancelled)'
      });
    }

    const request = await MerchantPaymentRequest.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'No payment request found with that ID'
      });
    }
   const matchedpayment=await MerchantPaymentRequest.findOne({_id:req.params.id});
   const merchant=await Merchantkey.findById({_id:matchedpayment.merchantId});
   if(status=="completed"){
       merchant.balance+=matchedpayment.amount;
       merchant.save();
   }
    res.json({
      success: true,
      data: request
    });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'No payment request found with that ID'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + err.message
    });
  }
});

// ----------------------disabled-all-bank-account-------------------
// Disable all payment methods for a user
Adminroute.put('/disable-all-payments/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { disableAllPayments } = req.body;

    // Validate user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update all bank accounts for this user
    await BankAccount.updateMany(
      { user_id: userId },
      { status: disableAllPayments ? 'inactive' : 'active' }
    );

    // Also update agent accounts in User model if they exist
    if (user.agentAccounts && user.agentAccounts.length > 0) {
      await UserModel.updateOne(
        { _id: userId },
        { 
          $set: { 
            'agentAccounts.$[].status': disableAllPayments ? 'inactive' : 'active' 
          } 
        }
      );
    }

    res.json({ 
      success: true, 
      message: `All payment methods ${disableAllPayments ? 'disabled' : 'enabled'} successfully` 
    });

  } catch (error) {
    console.error('Error updating payment methods:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update payment methods' 
    });
  }
});


// Get all withdrawal requests with filtering and pagination
Adminroute.get('/withdraw-requests', async (req, res) => {
  try {
    // Extract query parameters
    const { page = 1, limit = 10, status, merchant, paymentMethod, fromDate, toDate } = req.query;
    const skip = (page - 1) * limit;

    // Build the query object
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (merchant) {
      query.merchant = merchant;
    }
    
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }
    
    // Date range filtering
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.createdAt.$lte = new Date(toDate);
      }
    }

    // Get total count for pagination
    const total = await Merchantwithdraw.countDocuments(query);

    // Get paginated data
    const requests = await Merchantwithdraw.find(query)
      .populate('merchant', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: requests,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page),
        itemsPerPage: Number(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch withdrawal requests',
      error: error.message 
    });
  }
});

// Get a specific withdrawal request by ID
Adminroute.get('/withdraw-requests/:id', async (req, res) => {
  try {
    const request = await Merchantwithdraw.findById(req.params.id)
      .populate('merchant', 'name email phone');
      
    if (!request) {
      return res.status(404).json({ 
        success: false,
        message: 'Withdrawal request not found' 
      });
    }
    
    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Error fetching withdrawal request:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch withdrawal request',
      error: error.message 
    });
  }
});

// Delete a withdrawal request
Adminroute.delete('/withdraw-requests/:id', async (req, res) => {
  try {
    const deletedRequest = await Merchantwithdraw.findByIdAndDelete(req.params.id);
    
    if (!deletedRequest) {
      return res.status(404).json({ 
        success: false,
        message: 'Withdrawal request not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Withdrawal request deleted successfully',
      data: deletedRequest
    });
  } catch (error) {
    console.error('Error deleting withdrawal request:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete withdrawal request',
      error: error.message 
    });
  }
});
// Update withdrawal request status
Adminroute.patch('/withdraw-requests/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected', 'processed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const updatedRequest = await Merchantwithdraw.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('merchant', 'name email'); // Adjust fields as needed
     if(status=="rejected"){
              const matchedmerchant=await Merchantkey.findById({_id:updatedRequest.merchant._id});
              matchedmerchant.balance+=updatedRequest.amount;
              matchedmerchant.save();
              console.log(matchedmerchant)
     }
    if (!updatedRequest) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }
    
    res.json(updatedRequest);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message });
  }
});
const Banner = require('../Models/Banner'); // Add this import at the top with other models
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = './public/uploads/banners';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Banner Routes

// GET all banners
Adminroute.get('/banners', async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: banners
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banners',
      error: error.message
    });
  }
});

// GET single banner by ID
Adminroute.get('/banners/:id', async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }
    
    res.json({
      success: true,
      data: banner
    });
  } catch (error) {
    console.error('Error fetching banner:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid banner ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banner',
      error: error.message
    });
  }
});

// POST create new banner
Adminroute.post('/banners', upload.single('bannerImage'), async (req, res) => {
  try {
    const { title, description, position, isActive } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Banner image is required'
      });
    }
    
    // Create new banner
    const newBanner = new Banner({
      title,
      description,
      imageUrl: req.file.filename,
      position: position || 'top',
      isActive: isActive === 'true' || isActive === true
    });
    
    const savedBanner = await newBanner.save();
    
    res.status(201).json({
      success: true,
      message: 'Banner created successfully',
      data: savedBanner
    });
  } catch (error) {
    console.error('Error creating banner:', error);
    
    // Delete uploaded file if there was an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create banner',
      error: error.message
    });
  }
});

// PUT update banner
Adminroute.put('/banners/:id', upload.single('bannerImage'), async (req, res) => {
  try {
    const { title, description, position, isActive } = req.body;
    
    // Find existing banner
    const existingBanner = await Banner.findById(req.params.id);
    if (!existingBanner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }
    
    const updateData = {
      title: title || existingBanner.title,
      description: description || existingBanner.description,
      position: position || existingBanner.position,
      isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : existingBanner.isActive
    };
    
    // If new image is uploaded, update imageUrl and delete old image
    if (req.file) {
      // Delete old image file
      if (existingBanner.imageUrl && fs.existsSync(existingBanner.imageUrl)) {
        fs.unlinkSync(existingBanner.imageUrl);
      }
      updateData.imageUrl = req.file.path;
    }
    
    const updatedBanner = await Banner.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true,
        runValidators: true
      }
    );
    
    res.json({
      success: true,
      message: 'Banner updated successfully',
      data: updatedBanner
    });
  } catch (error) {
    console.error('Error updating banner:', error);
    
    // Delete uploaded file if there was an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid banner ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update banner',
      error: error.message
    });
  }
});

// DELETE banner
Adminroute.delete('/banners/:id', async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }
    
    // Delete image file
    if (banner.imageUrl && fs.existsSync(banner.imageUrl)) {
      fs.unlinkSync(banner.imageUrl);
    }
    
    await Banner.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting banner:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid banner ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete banner',
      error: error.message
    });
  }
});

// PATCH update banner status
Adminroute.patch('/banners/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }
    
    const updatedBanner = await Banner.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );
    
    if (!updatedBanner) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found'
      });
    }
    
    res.json({
      success: true,
      message: `Banner ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedBanner
    });
  } catch (error) {
    console.error('Error updating banner status:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid banner ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update banner status',
      error: error.message
    });
  }
});

// GET active banners for frontend
Adminroute.get('/banners-active', async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ position: 1, createdAt: -1 });
    res.json({
      success: true,
      data: banners
    });
  } catch (error) {
    console.error('Error fetching active banners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active banners',
      error: error.message
    });
  }
});

// // GET all cashdesk configurations
// Adminroute.get('/cashdesk', async (req, res) => {
//   try {
//     const { page = 1, limit = 10, search, isActive } = req.query;
//     const skip = (page - 1) * limit;
    
//     // Build query
//     const query = {};
    
//     if (search) {
//       query.$or = [
//         { cashdeskId: { $regex: search, $options: 'i' } },
//         { cashdesk: { $regex: search, $options: 'i' } },
//         { cashierLogin: { $regex: search, $options: 'i' } }
//       ];
//     }
    
//     if (isActive !== undefined) {
//       query.isActive = isActive === 'true';
//     }
    
//     // Get cashdesks with pagination
//     const cashdesks = await Cashdesk.find(query)
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(parseInt(limit));
    
//     // Get total count
//     const total = await Cashdesk.countDocuments(query);
    
//     res.json({
//       success: true,
//       data: cashdesks,
//       pagination: {
//         total,
//         totalPages: Math.ceil(total / limit),
//         currentPage: parseInt(page),
//         itemsPerPage: parseInt(limit)
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching cashdesks:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch cashdesk configurations',
//       error: error.message
//     });
//   }
// });

// // GET single cashdesk configuration by ID
// Adminroute.get('/cashdesk/:id', async (req, res) => {
//   try {
//     const cashdesk = await Cashdesk.findById(req.params.id);
    
//     if (!cashdesk) {
//       return res.status(404).json({
//         success: false,
//         message: 'Cashdesk configuration not found'
//       });
//     }
    
//     res.json({
//       success: true,
//       data: cashdesk
//     });
//   } catch (error) {
//     console.error('Error fetching cashdesk:', error);
    
//     if (error.name === 'CastError') {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid cashdesk ID format'
//       });
//     }
    
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch cashdesk configuration',
//       error: error.message
//     });
//   }
// });

// // POST create new cashdesk configuration
// Adminroute.post('/cashdesk', async (req, res) => {
//   try {
//     const {
//       cashdeskId,
//       cashdesk,
//       cashdeskHash,
//       cashierPass,
//       cashierLogin,
//       cashdeskApiBase,
//       defaultLng
//     } = req.body;
    
//     // Check if cashdeskId already exists
//     const existingCashdesk = await Cashdesk.findOne({ cashdeskId });
//     if (existingCashdesk) {
//       return res.status(400).json({
//         success: false,
//         message: 'Cashdesk ID already exists'
//       });
//     }
    
//     // Create new cashdesk
//     const newCashdesk = new Cashdesk({
//       cashdeskId,
//       cashdesk,
//       cashdeskHash,
//       cashierPass,
//       cashierLogin,
//       cashdeskApiBase,
//       defaultLng
//     });
    
//     const savedCashdesk = await newCashdesk.save();
    
//     res.status(201).json({
//       success: true,
//       message: 'Cashdesk configuration created successfully',
//       data: savedCashdesk
//     });
//   } catch (error) {
//     console.error('Error creating cashdesk:', error);
    
//     if (error.name === 'ValidationError') {
//       const errors = Object.values(error.errors).map(err => err.message);
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors
//       });
//     }
    
//     res.status(500).json({
//       success: false,
//       message: 'Failed to create cashdesk configuration',
//       error: error.message
//     });
//   }
// });

// // PUT update cashdesk configuration
// Adminroute.put('/cashdesk/:id', async (req, res) => {
//   try {
//     const {
//       cashdeskId,
//       cashdesk,
//       cashdeskHash,
//       cashierPass,
//       cashierLogin,
//       cashdeskApiBase,
//       defaultLng,
//       isActive
//     } = req.body;
    
//     // Check if cashdeskId already exists (excluding current document)
//     if (cashdeskId) {
//       const existingCashdesk = await Cashdesk.findOne({
//         cashdeskId,
//         _id: { $ne: req.params.id }
//       });
      
//       if (existingCashdesk) {
//         return res.status(400).json({
//           success: false,
//           message: 'Cashdesk ID already exists'
//         });
//       }
//     }
    
//     const updateData = {};
//     if (cashdeskId) updateData.cashdeskId = cashdeskId;
//     if (cashdesk) updateData.cashdesk = cashdesk;
//     if (cashdeskHash) updateData.cashdeskHash = cashdeskHash;
//     if (cashierPass) updateData.cashierPass = cashierPass;
//     if (cashierLogin) updateData.cashierLogin = cashierLogin;
//     if (cashdeskApiBase) updateData.cashdeskApiBase = cashdeskApiBase;
//     if (defaultLng) updateData.defaultLng = defaultLng;
//     if (isActive !== undefined) updateData.isActive = isActive;
    
//     const updatedCashdesk = await Cashdesk.findByIdAndUpdate(
//       req.params.id,
//       updateData,
//       { 
//         new: true,
//         runValidators: true
//       }
//     );
    
//     if (!updatedCashdesk) {
//       return res.status(404).json({
//         success: false,
//         message: 'Cashdesk configuration not found'
//       });
//     }
    
//     res.json({
//       success: true,
//       message: 'Cashdesk configuration updated successfully',
//       data: updatedCashdesk
//     });
//   } catch (error) {
//     console.error('Error updating cashdesk:', error);
    
//     if (error.name === 'ValidationError') {
//       const errors = Object.values(error.errors).map(err => err.message);
//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors
//       });
//     }
    
//     if (error.name === 'CastError') {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid cashdesk ID format'
//       });
//     }
    
//     res.status(500).json({
//       success: false,
//       message: 'Failed to update cashdesk configuration',
//       error: error.message
//     });
//   }
// });

// // DELETE cashdesk configuration
// Adminroute.delete('/cashdesk/:id', async (req, res) => {
//   try {
//     const deletedCashdesk = await Cashdesk.findByIdAndDelete(req.params.id);
    
//     if (!deletedCashdesk) {
//       return res.status(404).json({
//         success: false,
//         message: 'Cashdesk configuration not found'
//       });
//     }
    
//     res.json({
//       success: true,
//       message: 'Cashdesk configuration deleted successfully',
//       data: deletedCashdesk
//     });
//   } catch (error) {
//     console.error('Error deleting cashdesk:', error);
    
//     if (error.name === 'CastError') {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid cashdesk ID format'
//       });
//     }
    
//     res.status(500).json({
//       success: false,
//       message: 'Failed to delete cashdesk configuration',
//       error: error.message
//     });
//   }
// });

// // PATCH toggle cashdesk status
// Adminroute.patch('/cashdesk/:id/status', async (req, res) => {
//   try {
//     const { isActive } = req.body;
    
//     if (typeof isActive !== 'boolean') {
//       return res.status(400).json({
//         success: false,
//         message: 'isActive must be a boolean value'
//       });
//     }
    
//     const updatedCashdesk = await Cashdesk.findByIdAndUpdate(
//       req.params.id,
//       { isActive },
//       { new: true }
//     );
    
//     if (!updatedCashdesk) {
//       return res.status(404).json({
//         success: false,
//         message: 'Cashdesk configuration not found'
//       });
//     }
    
//     res.json({
//       success: true,
//       message: `Cashdesk ${isActive ? 'activated' : 'deactivated'} successfully`,
//       data: updatedCashdesk
//     });
//   } catch (error) {
//     console.error('Error updating cashdesk status:', error);
    
//     if (error.name === 'CastError') {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid cashdesk ID format'
//       });
//     }
    
//     res.status(500).json({
//       success: false,
//       message: 'Failed to update cashdesk status',
//       error: error.message
//     });
//   }
// });

const PaymentMethod = require('../Models/PaymentMethod'); // Add this import at the top with other models
const NagadFreeDeposit = require('../Models/NagadFreeDeposit');
const BankDeposit = require('../Models/BankDeposit');

// Payment Method Routes

// GET all payment methods
Adminroute.get('/payment-methods', async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.find().sort({ priority: -1, createdAt: -1 });
    res.json({
      success: true,
      data: paymentMethods
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment methods',
      error: error.message
    });
  }
});

// GET single payment method by ID
Adminroute.get('/payment-methods/:id', async (req, res) => {
  try {
    const paymentMethod = await PaymentMethod.findById(req.params.id);
    
    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }
    
    res.json({
      success: true,
      data: paymentMethod
    });
  } catch (error) {
    console.error('Error fetching payment method:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment method',
      error: error.message
    });
  }
});

// POST create new payment method
Adminroute.post('/payment-methods', async (req, res) => {
  try {
    const {
      name,
      name_bn,
      image,
      type,
      category,
      minAmount,
      maxAmount,
      isEnabled,
      priority
    } = req.body;
    
    // Check if payment method name already exists
    const existingPaymentMethod = await PaymentMethod.findOne({ name });
    if (existingPaymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method name already exists'
      });
    }
    
    // Create new payment method
    const newPaymentMethod = new PaymentMethod({
      name,
      name_bn,
      image,
      type,
      category,
      minAmount: minAmount || 100,
      maxAmount: maxAmount || 30000,
      isEnabled: isEnabled !== undefined ? isEnabled : true,
      priority: priority || 0
    });
    
    const savedPaymentMethod = await newPaymentMethod.save();
    
    res.status(201).json({
      success: true,
      message: 'Payment method created successfully',
      data: savedPaymentMethod
    });
  } catch (error) {
    console.error('Error creating payment method:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create payment method',
      error: error.message
    });
  }
});

// PUT update payment method
Adminroute.put('/payment-methods/:id', async (req, res) => {
  try {
    const {
      name,
      name_bn,
      image,
      type,
      category,
      minAmount,
      maxAmount,
      isEnabled,
      priority
    } = req.body;
    
    // Check if payment method name already exists (excluding current document)
    if (name) {
      const existingPaymentMethod = await PaymentMethod.findOne({
        name,
        _id: { $ne: req.params.id }
      });
      
      if (existingPaymentMethod) {
        return res.status(400).json({
          success: false,
          message: 'Payment method name already exists'
        });
      }
    }
    
    const updateData = {};
    if (name) updateData.name = name;
    if (name_bn) updateData.name_bn = name_bn;
    if (image) updateData.image = image;
    if (type) updateData.type = type;
    if (category) updateData.category = category;
    if (minAmount !== undefined) updateData.minAmount = minAmount;
    if (maxAmount !== undefined) updateData.maxAmount = maxAmount;
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled;
    if (priority !== undefined) updateData.priority = priority;
    
    const updatedPaymentMethod = await PaymentMethod.findByIdAndUpdate(
      req.params.id,
      updateData,
      { 
        new: true,
        runValidators: true
      }
    );
    
    if (!updatedPaymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Payment method updated successfully',
      data: updatedPaymentMethod
    });
  } catch (error) {
    console.error('Error updating payment method:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update payment method',
      error: error.message
    });
  }
});

// DELETE payment method
Adminroute.delete('/payment-methods/:id', async (req, res) => {
  try {
    const deletedPaymentMethod = await PaymentMethod.findByIdAndDelete(req.params.id);
    
    if (!deletedPaymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Payment method deleted successfully',
      data: deletedPaymentMethod
    });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment method',
      error: error.message
    });
  }
});

// PATCH update payment method status (enable/disable)
Adminroute.patch('/payment-methods/:id/status', async (req, res) => {
  try {
    const { isEnabled } = req.body;
    
    if (typeof isEnabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isEnabled must be a boolean value'
      });
    }
    
    const updatedPaymentMethod = await PaymentMethod.findByIdAndUpdate(
      req.params.id,
      { isEnabled },
      { new: true }
    );
    
    if (!updatedPaymentMethod) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found'
      });
    }
    
    res.json({
      success: true,
      message: `Payment method ${isEnabled ? 'enabled' : 'disabled'} successfully`,
      data: updatedPaymentMethod
    });
  } catch (error) {
    console.error('Error updating payment method status:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update payment method status',
      error: error.message
    });
  }
});
module.exports = Adminroute;