const express = require('express');
const UserModel = require('../Models/User');
const { authenticate, authorizeAdmin, authorizeuser } = require('../Middlewares/authMiddleware');
const PrepaymentRequest = require('../Models/PrepaymentRequest');
const BankAccount = require('../Models/BankAccount');
const PayinTransaction = require('../Models/PayinTransaction');
const PayoutTransaction = require('../Models/PayoutTransaction');
const Userrouter = express.Router();


Userrouter.use(authenticate);
Userrouter.use(authorizeuser);

// ----------------------------dashboard----------------------------
// ----------------------------dashboard----------------------------
Userrouter.get("/dashboard-data/:id", async (req, res) => {
  try {
    // Get user data first
    const user = await UserModel.findById(req.params.id).select('-password -__v');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Get all bank accounts for the user
    const all_bankaccounts = await BankAccount.find({ user_id: req.params.id });
    
    // Get all payin transactions for the user
    const all_payin = await PayinTransaction.find({ userid: req.params.id });
    
    // Get all payout transactions assigned to the user (assuming they're an agent)
    const all_payout = await PayoutTransaction.find({ assignedAgent: req.params.id });
    
    // Calculate totals for bank accounts
    const bankAccountsSummary = all_bankaccounts.reduce((acc, account) => {
      acc.totalAccounts += 1;
      acc.activeAccounts += account.status === 'active' ? 1 : 0;
      acc.totalReceived += account.total_recieved || 0;
      acc.totalPayouts += account.total_payoutno || 0;
      acc.totalCashout += account.total_cashout || 0;
      return acc;
    }, {
      totalAccounts: 0,
      activeAccounts: 0,
      totalReceived: 0,
      totalPayouts: 0,
      totalCashout: 0
    });
    
    // Calculate payin transaction statistics
    const payinStats = all_payin.reduce((acc, transaction) => {
      acc.totalTransactions += 1;
      acc.totalAmount += transaction.receivedAmount || 0;
      
      if (transaction.status === 'completed') {
        acc.completedTransactions += 1;
        acc.completedAmount += transaction.receivedAmount || 0;
      } else if (transaction.status === 'pending') {
        acc.pendingTransactions += 1;
        acc.pendingAmount += transaction.expectedAmount || 0;
      } else if (transaction.status === 'rejected') {
        acc.rejectedTransactions += 1;
      }
      
      return acc;
    }, {
      totalTransactions: 0,
      totalAmount: 0,
      completedTransactions: 0,
      completedAmount: 0,
      pendingTransactions: 0,
      pendingAmount: 0,
      rejectedTransactions: 0
    });
    
    // Calculate payout transaction statistics
    const payoutStats = all_payout.reduce((acc, transaction) => {
      acc.totalTransactions += 1;
      acc.totalAmount += transaction.requestAmount || 0;
      
      if (transaction.status === 'success') {
        acc.completedTransactions += 1;
        acc.completedAmount += transaction.requestAmount || 0;
      } else if (transaction.status === 'pending') {
        acc.pendingTransactions += 1;
        acc.pendingAmount += transaction.requestAmount || 0;
      } else if (transaction.status === 'rejected' || transaction.status === 'reassigned') {
        acc.rejectedTransactions += 1;
      }
      
      return acc;
    }, {
      totalTransactions: 0,
      totalAmount: 0,
      completedTransactions: 0,
      completedAmount: 0,
      pendingTransactions: 0,
      pendingAmount: 0,
      rejectedTransactions: 0
    });
    
    // Recent transactions (last 5 of each type)
    const recentPayins = all_payin
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(tx => ({
        id: tx._id,
        amount: tx.receivedAmount || tx.expectedAmount,
        account: tx.payerAccount,
        status: tx.status,
        date: tx.createdAt,
        type: 'payin'
      }));
    
    const recentPayouts = all_payout
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(tx => ({
        id: tx._id,
        amount: tx.requestAmount,
        account: tx.payeeAccount,
        status: tx.status,
        date: tx.createdAt,
        type: 'payout'
      }));
    
    // Combine recent transactions and sort by date
    const recentTransactions = [...recentPayins, ...recentPayouts]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
    
    // Prepare the response
    const dashboardData = {
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        balance: user.balance,
        currentstatus: user.currentstatus,
        totalpayment: user.totalpayment,
        totalpayout: user.totalpayout,
        totalprepayment: user.totalprepayment,
        providercost: user.providercost,
        currency: user.currency,
        paymentMethod: user.paymentMethod,
        paymentbrand: user.paymentbrand,
        agentAccounts: user.agentAccounts,
        createdAt: user.createdAt
      },
      summary: {
        bankAccounts: bankAccountsSummary,
        payin: payinStats,
        payout: payoutStats
      },
      recentTransactions,
      bankAccounts: all_bankaccounts.map(account => ({
        id: account._id,
        provider: account.provider,
        accountNumber: account.accountNumber,
        status: account.status,
        walletType: account.walletType,
        totalReceived: account.total_recieved,
        totalPayouts: account.total_payoutno
      }))
    };
    
    res.status(200).json({
      success: true,
      data: dashboardData
    });
    
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: error.message
    });
  }
});
Userrouter.get("/single-user/:id", async (req, res) => {
    try {
        const user = await UserModel.findById({ _id: req.params.id });
        if (!user) {
            return res.send({ success: false, message: "User not found." });
        }
        res.send({ success: true, user });
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: "Server error." });
    }
});

// --------------prepayment-request--------------------
// Create new prepayment request
Userrouter.post('/prepayment-request', async (req, res) => {
  try {
    const {
      username,
      email,
      paymentMethod,
      currency,
      currentBalance,
      requestAmount,
      paidAmount,
      channel,
      note,
      requestDate,
      updateDate,
      status,
      userid
    } = req.body;

    const newRequest = new PrepaymentRequest({
      username,
      email,
      paymentMethod,
      currency,
      currentBalance,
      requestAmount,
      paidAmount,
      channel,
      note,
      requestDate,
      updateDate,
      userid,
      status:"Pending"
    });

    await newRequest.save();
    res.status(201).json(newRequest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 🔐 Get all prepayment requests for the logged-in user
Userrouter.get('/my-requests/:email', async (req, res) => {
  try {
   const email = req.user.email;
    const requests = await PrepaymentRequest.find({ email }).sort({ requestDate: -1 });
    res.json(requests);
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});
// 🔍 Get requests by date range for logged-in user
Userrouter.get('/my-requests/filter', async (req, res) => {
  try {
    const email = req.user.email;
    const { startDate, endDate } = req.query;

    const query = {
      email,
      requestDate: {}
    };

    if (startDate) query.requestDate.$gte = new Date(startDate);
    if (endDate) query.requestDate.$lte = new Date(endDate);

    // Clean up empty $gte/$lte if not provided
    if (!startDate) delete query.requestDate.$gte;
    if (!endDate) delete query.requestDate.$lte;
    if (Object.keys(query.requestDate).length === 0) delete query.requestDate;

    const filteredRequests = await PrepaymentRequest.find(query).sort({ requestDate: -1 });
    res.json(filteredRequests);
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Failed to filter requests' });
  }
});
// -------------------add-bank-account----------------------
Userrouter.post('/add-bank-account', async (req, res) => {
  try {
    const { provider, accountNumber, shopName, walletType, isDefault } = req.body;
    const userId = req.user._id; // Assuming you have user info from authentication
    console.log(userId)
    // Validate required fields
    if (!provider || !accountNumber || !shopName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Provider, account number, and shop name are required' 
      });
    }
// hello
    // Validate account number format
    const accountNumberRegex = /^01\d{9}$/;
    if (!accountNumberRegex.test(accountNumber)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid account number format. Must be 11 digits starting with 01' 
      });
    }

    // Check if account number already exists for this user
    const user = await UserModel.findOne({
      _id: userId,
      'agentAccounts.accountNumber': accountNumber
    });
    
    if (user) {
      return res.status(400).json({ 
        success: false, 
        message: 'An account with this number already exists for this user' 
      });
    }

    // Check if P2C method has required fields
    if (provider === 'Bkash P2C') {
      if (!req.body.username || !req.body.password || !req.body.appKey || !req.body.appSecretKey) {
        return res.status(400).json({ 
          success: false, 
          message: 'For Bkash P2C, username, password, appKey, and appSecretKey are required' 
        });
      }
    }

    if (provider === 'Nagad P2C') {
      if (!req.body.publicKey || !req.body.privateKey) {
        return res.status(400).json({ 
          success: false, 
          message: 'For Nagad P2C, publicKey and privateKey are required' 
        });
      }
    }

    // Check if wallet type is required
    if ((provider === 'Bkash P2P' || provider === 'Nagad P2P') && !walletType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Wallet type is required for P2P methods' 
      });
    }

    // Prepare the new agent account data
    const newAccount = {
      provider,
      accountNumber,
      shopName,
      walletType: walletType || '',
      status: 'inactive', // default status
      isDefault: isDefault || false,
      ...req.body
    };

    // Add the new account to the user's agentAccounts array
    const user_account=await UserModel.findById({_id:userId})
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        $push: {
          agentAccounts: newAccount
        }
      },
      { new: true }
    );

    // If this account is set as default, update all other accounts to not be default
    if (isDefault) {
      await UserModel.updateOne(
        { 
          _id: userId,
          'agentAccounts._id': { $ne: updatedUser.agentAccounts[updatedUser.agentAccounts.length - 1]._id }
        },
        {
          $set: {
            'agentAccounts.$[].isDefault': false
          }
        }
      );
    }
       user_account.totalwallet+=1;
       user_account.save();
    // Get the newly added account (last one in the array)
    const addedAccount = updatedUser.agentAccounts[updatedUser.agentAccounts.length - 1];
// Create new bank account
    const bankAccount = new BankAccount({
      user_id: req.user._id,
      ...req.body
    });

    await bankAccount.save();
    res.status(201).json({
      success: true,
      message: 'Bank account added successfully',
      data: addedAccount
    });

  } catch (error) {
    console.error('Error adding bank account:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while adding the bank account',
      error: error.message 
    });
  }
});


// Get a single bank account
Userrouter.get('/user-bank-account/:id', async (req, res) => {
  try {
    const bankAccount = await BankAccount.find({ 
      user_id: req.params.id 
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


// Get a single bank account
Userrouter.get('/bank-account/:id', async (req, res) => {
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
Userrouter.put('/update-bank-account/:id',async (req, res) => {
  try {
    const { provider, accountNumber, shopName, walletType } = req.body;
    
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
      { _id: req.params.id, user_id: req.user._id },
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

// Update bank account status (updates both BankAccount and User's agentAccount)
Userrouter.put('/update-bank-account-status/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const bankAccountId = req.params.id;
    const userId = req.user._id;

    // Validate status
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid status (active/inactive) is required' 
      });
    }

    // Find the bank account first to get the account number
    const bankAccount = await BankAccount.findOne({ 
      _id: bankAccountId, 
      user_id: userId 
    });

    if (!bankAccount) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bank account not found' 
      });
    }

    // Update both records in parallel
    const [updatedBankAccount, updatedUser] = await Promise.all([
      // Update BankAccount
      BankAccount.findOneAndUpdate(
        { _id: bankAccountId, user_id: userId },
        { status },
        { new: true }
      ),
      
      // Update User's agentAccount
      UserModel.findOneAndUpdate(
        { 
          _id: userId,
          'agentAccounts.accountNumber': bankAccount.accountNumber 
        },
        { 
          $set: { 
            'agentAccounts.$.status': status,
            'agentAccounts.$.updatedAt': Date.now()
          } 
        },
        { new: true }
      )
    ]);

    if (!updatedBankAccount || !updatedUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'Failed to update one or both account records' 
      });
    }

    // Find the updated agent account from the user document
    const updatedAgentAccount = updatedUser.agentAccounts.find(
      acc => acc.accountNumber === bankAccount.accountNumber
    );

    res.json({
      success: true,
      message: 'Bank account status updated successfully',
      data: {
        bankAccount: updatedBankAccount,
        agentAccount: updatedAgentAccount
      }
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
// ---------------filter-payin----------------------------
// Filter Payin transactions
Userrouter.post('/filter-transaction', async (req, res) => {
  try {
    const { paymentId, trxId } = req.body;

    if (!paymentId && !trxId) {
      return res.status(400).json({
        success: false,
        message: 'At least one search parameter (paymentId or trxId) is required'
      });
    }

    // Build query dynamically based on provided parameters
    const query = {};
    if (paymentId) query.paymentId = paymentId;
    if (trxId) query.transactionId = trxId;

    const transactions = await PayinTransaction.find(query)
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean();

    return res.json({
      success: true,
      transactions,
      count: transactions.length
    });

  } catch (error) {
    console.error('Error filtering transactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});
// Filter Payin transactions by date range
Userrouter.post('/filter-by-date', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Both start date and end date are required'
      });
    }

    // Convert dates to proper Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include entire end day

    // Query for transactions within date range
    const transactions = await PayinTransaction.find({
      createdAt: {
        $gte: start,
        $lte: end
      },
      status: 'completed' // Only show pending transactions for approval
    })
    .sort({ createdAt: -1 }) // Newest first
    .lean()
    .select('createdAt receivedAmount status paymentId transactionId'); // Only select needed fields

    // Format the response
    const formattedTransactions = transactions.map(txn => ({
      id: txn._id,
      date: txn.createdAt.toLocaleDateString(),
      amount: txn.receivedAmount,
      status: txn.status,
      paymentId: txn.paymentId,
      transactionId: txn.transactionId
    }));

    return res.json({
      success: true,
      transactions: formattedTransactions,
      count: formattedTransactions.length
    });

  } catch (error) {
    console.error('Error filtering by date:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// --------------------bank-account---------------------
Userrouter.get("/bank-accunts/:id",async(req,res)=>{
  try {
    const bankaccount=await BankAccount.find({user_id:req.params.id});
    if(!bankaccount){
      return res.send({success:false,message:"Account not found."})
    }
    res.send({success:true,data:bankaccount})
  } catch (error) {
    console.log(error)
  }
})
// ---------------all-payin---------------

// Get all payin transactions by user ID
Userrouter.get('/user-payin/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query;


    // Find user and get agent accounts
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
   console.log(user)
    // Get all agent account numbers
    const agentAccounts = user.agentAccounts.map(account => account.accountNumber);
    if (agentAccounts.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }
    console.log("agentAccounts,",agentAccounts)
    // Build query
    const query = { agentAccount: { $in: agentAccounts } };
    
    // Add status filter if provided
    if (status && ['pending', 'completed', 'rejected', 'expired', 'suspended'].includes(status)) {
      query.status = status;
    }

    // Find all matching transactions
    const transactions = await PayinTransaction.find(query)
      .sort({ createdAt: -1 })
      .lean();
console.log(transactions)
    res.status(200).json({ success: true, data: transactions });

  } catch (error) {
    console.error('Error fetching payins:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});
// Get all payout transactions assigned to the current user (agent)
// Route to get all payout transactions for a user's agent accounts with filtering
Userrouter.get('/user-payouts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;

    // 1. Find the user and their agent accounts
    const user = await UserModel.findById(userId)
      .select('name email role agentAccounts balance');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
          
    // Extract account numbers from agent accounts
    const agentAccountNumbers = user.agentAccounts.map(acc => acc.accountNumber);
      console.log("agentAccountNumbers",agentAccountNumbers)
    // 2. Build the query
    const query = {
      agent_account: { $in: agentAccountNumbers }
    };

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Add date range filter if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // 3. Get paginated results
    const options = {
      sort: { createdAt: -1 },
      skip: (page - 1) * limit,
      limit: parseInt(limit)
    };

    const [payouts, total] = await Promise.all([
      PayoutTransaction.find(query, null, options),
      PayoutTransaction.countDocuments(query)
    ]);

    // 4. Format the response
    const response = {
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance,
        agentAccounts: user.agentAccounts
      },
      payouts: payouts.map(payout => ({
        id: payout._id,
        paymentId: payout.paymentId,
        orderId: payout.orderId,
        payeeAccount: payout.payeeAccount,
        requestAmount: payout.requestAmount,
        currency: payout.currency,
        status: payout.status,
        createdAt: payout.createdAt,
        provider: payout.provider,
        merchantId: payout.merchantid,
        assignedAgent: payout.assignedAgent,
        transactionDetails: {
          transactionId: payout.transactionId,
          sentAmount: payout.sentAmount
        }
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        status,
        startDate,
        endDate,
        matchedAccountNumbers: agentAccountNumbers
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Error fetching user payouts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// Route to get all payin transactions for a user
Userrouter.get('/user-payins/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      status, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 10,
      paymentType,
      provider
    } = req.query;

    // 1. Find the user and their agent accounts (if needed)
    const user = await UserModel.findById(userId)
      .select('agentAccounts');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // 2. Build the query
    const query = {
      $or: [
        { userid: userId }, // Payins where user is the owner
        { merchantid: userId }, // Payins where user is the merchant
        { 'agentAccount': { $in: user.agentAccounts.map(acc => acc.accountNumber) } } // Payins to user's agent accounts
      ]
    };

    // Add filters if provided
    if (status) query.status = status;
    if (paymentType) query.paymentType = paymentType;
    if (provider) query.provider = provider;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // 3. Get paginated results
    const options = {
      sort: { createdAt: -1 },
      skip: (page - 1) * limit,
      limit: parseInt(limit)
    };

    const [payins, total] = await Promise.all([
      PayinTransaction.find(query, null, options),
      PayinTransaction.countDocuments(query)
    ]);

    // 4. Format the response
    const response = {
      success: true,
      payins: payins.map(payin => ({
        id: payin._id,
        paymentId: payin.paymentId,
        orderId: payin.orderId,
        payerAccount: payin.payerAccount,
        expectedAmount: payin.expectedAmount,
        receivedAmount: payin.receivedAmount,
        currency: payin.currency,
        status: payin.status,
        createdAt: payin.createdAt,
        provider: payin.provider,
        paymentType: payin.paymentType,
        transactionId: payin.transactionId,
        referenceId: payin.referenceId
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        status,
        startDate,
        endDate,
        paymentType,
        provider
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Error fetching user payins:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});


module.exports = Userrouter;