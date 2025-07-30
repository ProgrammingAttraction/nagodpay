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

// Protect all admin routes
// Adminroute.use(authenticate);
// Adminroute.use(authorizeAdmin);

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
        if (paymentMethod && paymentMethod.length > 5) {
            return res.status(400).json({ 
                success: false, 
                message: "Cannot have more than 5 payment methods" 
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
            const validMethods = ['Bkash P2C', 'Nagad P2C', 'Bkash P2P', 'Nagad P2P']; // Add all valid methods
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

Adminroute.get('/analytics', async (req, res) => {
  try {
    const { period = 'month', provider } = req.query;
    
    // Get date range based on period
    const now = moment();
    let start, end;
    
    switch(period) {
      case 'today':
        start = now.clone().startOf('day');
        end = now.clone().endOf('day');
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
    
    // Base match query
    const matchQuery = {
      createdAt: { $gte: start.toDate(), $lte: end.toDate() }
    };
    
    // Nagad-specific match query
    const nagadMatchQuery = {
      ...matchQuery,
      provider: /nagad/i // Case-insensitive regex for Nagad
    };
    
    // Add provider filter if specified
    if (provider) {
      matchQuery.provider = new RegExp(provider, 'i');
    }
    
    // Helper function to get the correct amount field based on payment type
    const getPayinAmountField = {
      $cond: {
        if: { $eq: ['$paymentType', 'p2c'] },
        then: '$expectedAmount',
        else: '$receivedAmount'
      }
    };
    
    // Execute all queries in parallel for better performance
    const [
      // General stats
      payinStats,
      payoutStats,
      pendingPayins,
      pendingPayinsAmount,
      completedPayins,
      completedPayinsAmount,
      rejectedPayins,
      rejectedPayinsAmount,
      pendingPayouts,
      pendingPayoutsAmount,
      successPayouts,
      successPayoutsAmount,
      rejectedPayouts,
      rejectedPayoutsAmount,
      payinTrend,
      payoutTrend,
      topPayinAccounts,
      topPayoutAccounts,
      
      // Nagad-specific queries
      nagadPayinStats,
      nagadPayoutStats,
      nagadPendingPayins,
      nagadPendingPayinsAmount,
      nagadCompletedPayins,
      nagadCompletedPayinsAmount,
      nagadRejectedPayins,
      nagadRejectedPayinsAmount,
      nagadPendingPayouts,
      nagadPendingPayoutsAmount,
      nagadSuccessPayouts,
      nagadSuccessPayoutsAmount,
      nagadRejectedPayouts,
      nagadRejectedPayoutsAmount,
      nagadPayinTrend,
      nagadPayoutTrend,
      nagadTopPayinAccounts,
      nagadTopPayoutAccounts
    ] = await Promise.all([
      // Payin stats by provider (completed only)
      PayinTransaction.aggregate([
        { $match: { ...matchQuery, status: 'completed' } },
        { 
          $group: {
            _id: '$provider',
            count: { $sum: 1 },
            totalAmount: { $sum: getPayinAmountField },
            avgAmount: { $avg: getPayinAmountField }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]),
      
      // Payout stats by provider (success only)
      PayoutTransaction.aggregate([
        { $match: { ...matchQuery, status: 'success' } },
        { 
          $group: {
            _id: '$provider',
            count: { $sum: 1 },
            totalAmount: { $sum: '$sentAmount' },
            avgAmount: { $avg: '$sentAmount' }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]),
      
      // Payin status counts and amounts
      PayinTransaction.countDocuments({ ...matchQuery, status: 'pending' }),
      PayinTransaction.aggregate([
        { $match: { ...matchQuery, status: 'pending' } },
        { $group: { _id: null, totalAmount: { $sum: getPayinAmountField } } }
      ]),
      PayinTransaction.countDocuments({ ...matchQuery, status: 'completed' }),
      PayinTransaction.aggregate([
        { $match: { ...matchQuery, status: 'completed' } },
        { $group: { _id: null, totalAmount: { $sum: getPayinAmountField } } }
      ]),
      PayinTransaction.countDocuments({ ...matchQuery, status: 'rejected' }),
      PayinTransaction.aggregate([
        { $match: { ...matchQuery, status: 'rejected' } },
        { $group: { _id: null, totalAmount: { $sum: getPayinAmountField } } }
      ]),
      
      // Payout status counts and amounts
      PayoutTransaction.countDocuments({ ...matchQuery, status: 'pending' }),
      PayoutTransaction.aggregate([
        { $match: { ...matchQuery, status: 'pending' } },
        { $group: { _id: null, totalAmount: { $sum: '$sentAmount' } } }
      ]),
      PayoutTransaction.countDocuments({ ...matchQuery, status: 'success' }),
      PayoutTransaction.aggregate([
        { $match: { ...matchQuery, status: 'success' } },
        { $group: { _id: null, totalAmount: { $sum: '$sentAmount' } } }
      ]),
      PayoutTransaction.countDocuments({ ...matchQuery, status: 'rejected' }),
      PayoutTransaction.aggregate([
        { $match: { ...matchQuery, status: 'rejected' } },
        { $group: { _id: null, totalAmount: { $sum: '$sentAmount' } } }
      ]),
      
      // Payin trend (completed only)
      PayinTransaction.aggregate([
        { $match: { ...matchQuery, status: 'completed' } },
        {
          $group: {
            _id: period === 'today' ? { $hour: '$createdAt' } : 
                 period === 'month' ? { $dayOfMonth: '$createdAt' } : 
                 { $month: '$createdAt' },
            count: { $sum: 1 },
            amount: { $sum: getPayinAmountField }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Payout trend (success only)
      PayoutTransaction.aggregate([
        { $match: { ...matchQuery, status: 'success' } },
        {
          $group: {
            _id: period === 'today' ? { $hour: '$createdAt' } : 
                 period === 'month' ? { $dayOfMonth: '$createdAt' } : 
                 { $month: '$createdAt' },
            count: { $sum: 1 },
            amount: { $sum: '$sentAmount' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Top payin accounts (completed only)
      PayinTransaction.aggregate([
        { $match: { ...matchQuery, status: 'completed' } },
        {
          $group: {
            _id: '$payerAccount',
            count: { $sum: 1 },
            totalAmount: { $sum: getPayinAmountField }
          }
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 5 }
      ]),
      
      // Top payout accounts (success only)
      PayoutTransaction.aggregate([
        { $match: { ...matchQuery, status: 'success' } },
        {
          $group: {
            _id: '$payeeAccount',
            count: { $sum: 1 },
            totalAmount: { $sum: '$sentAmount' }
          }
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 5 }
      ]),
      
      // Nagad-specific analytics
      // Nagad payin stats (completed only)
      PayinTransaction.aggregate([
        { $match: { ...nagadMatchQuery, status: 'completed' } },
        { 
          $group: {
            _id: '$provider',
            count: { $sum: 1 },
            totalAmount: { $sum: getPayinAmountField },
            avgAmount: { $avg: getPayinAmountField }
          }
        }
      ]),
      
      // Nagad payout stats (success only)
      PayoutTransaction.aggregate([
        { $match: { ...nagadMatchQuery, status: 'success' } },
        { 
          $group: {
            _id: '$provider',
            count: { $sum: 1 },
            totalAmount: { $sum: '$sentAmount' },
            avgAmount: { $avg: '$sentAmount' }
          }
        }
      ]),
      
      // Nagad payin status counts and amounts
      PayinTransaction.countDocuments({ ...nagadMatchQuery, status: 'pending' }),
      PayinTransaction.aggregate([
        { $match: { ...nagadMatchQuery, status: 'pending' } },
        { $group: { _id: null, totalAmount: { $sum: getPayinAmountField } } }
      ]),
      PayinTransaction.countDocuments({ ...nagadMatchQuery, status: 'completed' }),
      PayinTransaction.aggregate([
        { $match: { ...nagadMatchQuery, status: 'completed' } },
        { $group: { _id: null, totalAmount: { $sum: getPayinAmountField } } }
      ]),
      PayinTransaction.countDocuments({ ...nagadMatchQuery, status: 'rejected' }),
      PayinTransaction.aggregate([
        { $match: { ...nagadMatchQuery, status: 'rejected' } },
        { $group: { _id: null, totalAmount: { $sum: getPayinAmountField } } }
      ]),
      
      // Nagad payout status counts and amounts
      PayoutTransaction.countDocuments({ ...nagadMatchQuery, status: 'pending' }),
      PayoutTransaction.aggregate([
        { $match: { ...nagadMatchQuery, status: 'pending' } },
        { $group: { _id: null, totalAmount: { $sum: '$sentAmount' } } }
      ]),
      PayoutTransaction.countDocuments({ ...nagadMatchQuery, status: 'success' }),
      PayoutTransaction.aggregate([
        { $match: { ...nagadMatchQuery, status: 'success' } },
        { $group: { _id: null, totalAmount: { $sum: '$sentAmount' } } }
      ]),
      PayoutTransaction.countDocuments({ ...nagadMatchQuery, status: 'rejected' }),
      PayoutTransaction.aggregate([
        { $match: { ...nagadMatchQuery, status: 'rejected' } },
        { $group: { _id: null, totalAmount: { $sum: '$sentAmount' } } }
      ]),
      
      // Nagad payin trend (completed only)
      PayinTransaction.aggregate([
        { $match: { ...nagadMatchQuery, status: 'completed' } },
        {
          $group: {
            _id: period === 'today' ? { $hour: '$createdAt' } : 
                 period === 'month' ? { $dayOfMonth: '$createdAt' } : 
                 { $month: '$createdAt' },
            count: { $sum: 1 },
            amount: { $sum: getPayinAmountField }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Nagad payout trend (success only)
      PayoutTransaction.aggregate([
        { $match: { ...nagadMatchQuery, status: 'success' } },
        {
          $group: {
            _id: period === 'today' ? { $hour: '$createdAt' } : 
                 period === 'month' ? { $dayOfMonth: '$createdAt' } : 
                 { $month: '$createdAt' },
            count: { $sum: 1 },
            amount: { $sum: '$sentAmount' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Top Nagad payin accounts (completed only)
      PayinTransaction.aggregate([
        { $match: { ...nagadMatchQuery, status: 'completed' } },
        {
          $group: {
            _id: '$payerAccount',
            count: { $sum: 1 },
            totalAmount: { $sum: getPayinAmountField }
          }
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 5 }
      ]),
      
      // Top Nagad payout accounts (success only)
      PayoutTransaction.aggregate([
        { $match: { ...nagadMatchQuery, status: 'success' } },
        {
          $group: {
            _id: '$payeeAccount',
            count: { $sum: 1 },
            totalAmount: { $sum: '$sentAmount' }
          }
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 5 }
      ])
    ]);
    
    // Extract amount totals from aggregation results
    const getAmount = (result) => result[0]?.totalAmount || 0;
    
    // Calculate totals for all transactions
    const totalPayinPendingAmount = getAmount(pendingPayinsAmount);
    const totalPayinCompletedAmount = getAmount(completedPayinsAmount);
    const totalPayinRejectedAmount = getAmount(rejectedPayinsAmount);
    const totalPayinAmount = totalPayinPendingAmount + totalPayinCompletedAmount + totalPayinRejectedAmount;
    
    const totalPayoutPendingAmount = getAmount(pendingPayoutsAmount);
    const totalPayoutSuccessAmount = getAmount(successPayoutsAmount);
    const totalPayoutRejectedAmount = getAmount(rejectedPayoutsAmount);
    const totalPayoutAmount = totalPayoutPendingAmount + totalPayoutSuccessAmount + totalPayoutRejectedAmount;
    
    // Calculate totals for Nagad transactions
    const totalNagadPayinPendingAmount = getAmount(nagadPendingPayinsAmount);
    const totalNagadPayinCompletedAmount = getAmount(nagadCompletedPayinsAmount);
    const totalNagadPayinRejectedAmount = getAmount(nagadRejectedPayinsAmount);
    const totalNagadPayinAmount = totalNagadPayinPendingAmount + totalNagadPayinCompletedAmount + totalNagadPayinRejectedAmount;
    
    const totalNagadPayoutPendingAmount = getAmount(nagadPendingPayoutsAmount);
    const totalNagadPayoutSuccessAmount = getAmount(nagadSuccessPayoutsAmount);
    const totalNagadPayoutRejectedAmount = getAmount(nagadRejectedPayoutsAmount);
    const totalNagadPayoutAmount = totalNagadPayoutPendingAmount + totalNagadPayoutSuccessAmount + totalNagadPayoutRejectedAmount;
    
    // Response data
    const analyticsData = {
      period: {
        start: start.toDate(),
        end: end.toDate(),
        name: period
      },
      totals: {
        // All transactions
        payin: {
          total: totalPayinAmount,
          completed: totalPayinCompletedAmount,
          pending: totalPayinPendingAmount,
          rejected: totalPayinRejectedAmount
        },
        payout: {
          total: totalPayoutAmount,
          success: totalPayoutSuccessAmount,
          pending: totalPayoutPendingAmount,
          rejected: totalPayoutRejectedAmount
        },
        net: totalPayinCompletedAmount - totalPayoutSuccessAmount,
        
        // Nagad-specific
        nagadPayin: {
          total: totalNagadPayinAmount,
          completed: totalNagadPayinCompletedAmount,
          pending: totalNagadPayinPendingAmount,
          rejected: totalNagadPayinRejectedAmount
        },
        nagadPayout: {
          total: totalNagadPayoutAmount,
          success: totalNagadPayoutSuccessAmount,
          pending: totalNagadPayoutPendingAmount,
          rejected: totalNagadPayoutRejectedAmount
        },
        nagadNet: totalNagadPayinCompletedAmount - totalNagadPayoutSuccessAmount
      },
      payin: {
        byProvider: payinStats,
        trend: payinTrend,
        topAccounts: topPayinAccounts
      },
      payout: {
        byProvider: payoutStats,
        trend: payoutTrend,
        topAccounts: topPayoutAccounts
      },
      nagad: {
        payin: {
          byProvider: nagadPayinStats,
          trend: nagadPayinTrend,
          topAccounts: nagadTopPayinAccounts
        },
        payout: {
          byProvider: nagadPayoutStats,
          trend: nagadPayoutTrend,
          topAccounts: nagadTopPayoutAccounts
        }
      },
      statusCounts: {
        payin: {
          pending: pendingPayins,
          completed: completedPayins,
          rejected: rejectedPayins
        },
        payout: {
          pending: pendingPayouts,
          success: successPayouts,
          rejected: rejectedPayouts
        }
      }
    };
    
    res.json({
      success: true,
      data: analyticsData
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment analytics',
      error: error.message
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
module.exports = Adminroute;