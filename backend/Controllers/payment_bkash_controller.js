const PayinTransaction = require("../Models/PayinTransaction.js")
const User = require("../Models/User.js")
const axios = require('axios');
const { nanoid } = require('nanoid');
const crypto = require('crypto');
const UserModel = require("../Models/User.js");
const BankAccount = require("../Models/BankAccount.js");
const Merchantkey = require("../Models/Merchantkey.js");

const SERVER_URL = 'https://eassypay.com/api';
const BASE_URL = 'http://localhost:3000';
const CASHDESK_API_BASE = 'https://partners.servcul.com/CashdeskBotAPI';
const CASHDESK_HASH = "a13d615c8ee6f83a12a0645de4d9a1c4068148562f2ea165dea920c66af2ed90";
const CASHIER_PASS = "901276";
const CASHIER_LOGIN = "MuktaA1";
const CASHDESK_ID = "1177830";
const DEFAULT_LNG = 'en';

function generate256Hash(data) {
  const hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest('hex');
}

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Default bKash credentials (will be overridden by agent account credentials)
let BKASH_URL = 'https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout';
let BKASH_USERNAME = '01711799891';
let BKASH_PASSWORD = 'b8t|m:1I|oF';
let BKASH_APP_KEY = 'bMk6yA8dUSi1RjEKjURQablGtc';
let BKASH_APP_SECRET_KEY = 'qbl6yK033pPGUeKyJFs2oppUPPeNyJHZn62oOOkMaU3qA0GecnEC';

// FIXED: Enhanced token generation with proper bKash authentication
const get_token_bkash = async (retryCount = 0) => {
  try {
    console.log('Attempting to get bKash token with credentials:', {
      username: BKASH_USERNAME,
      appKey: BKASH_APP_KEY,
      url: BKASH_URL
    });

    // bKash Tokenized Checkout uses basic authentication for token grant
    const authString = Buffer.from(`${BKASH_APP_KEY}:${BKASH_APP_SECRET_KEY}`).toString('base64');
    
    const tokenObj = await axios.post(`${BKASH_URL}/token/grant`, {
      app_key: BKASH_APP_KEY,
      app_secret: BKASH_APP_SECRET_KEY
    }, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Basic ${authString}`,
        "username": BKASH_USERNAME,
        "password": BKASH_PASSWORD
      },
      timeout: 30000
    });
    
    console.log('bKash token response:', tokenObj.data);
    
    if (tokenObj.data && tokenObj.data.id_token) {
      return tokenObj.data.id_token;
    } else {
      console.log('Token response missing id_token:', tokenObj.data);
      
      // Retry with different agent if available
      if (retryCount < 3) {
        console.log(`Retrying token generation (attempt ${retryCount + 1})`);
        await sleep(2000);
        return get_token_bkash(retryCount + 1);
      }
      
      return null;
    }

  } catch (error) {
    console.log('bKash get token error:', error.response ? error.response.data : error.message);
    
    if (error.response) {
      console.log('Error details:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    }
    
    // Retry with different agent if available
    if (retryCount < 3) {
      console.log(`Retrying token generation (attempt ${retryCount + 1})`);
      await sleep(2000);
      return get_token_bkash(retryCount + 1);
    }
    
    return null;
  }  
}

// CashDesk deposit function
const processCashDeskDeposit = async (transaction) => {
  try {
    console.log("transaction", transaction)
    if (!transaction.payerId || !transaction.expectedAmount) {
      console.log("Skipping CashDesk deposit - missing payerId or received amount");
      return {
        success: false,
        error: "Missing payerId or transaction amount"
      };
    }
    
    console.log("Initiating CashDesk deposit process...");
    console.log("Payer ID:", transaction.payerId);
    console.log("Amount:", transaction.expectedAmount);
    
    // Generate confirm hash (MD5 of "payerId:CASHDESK_HASH")
    const confirmString = `${transaction.payerId}:${CASHDESK_HASH}`;
    const confirm = crypto.createHash('md5').update(confirmString).digest('hex');
    
    // Generate step1 hash (SHA256 of query string)
    const step1String = `hash=${CASHDESK_HASH}&lng=ru&userid=${transaction.payerId}`;
    const step1 = crypto.createHash('sha256').update(step1String).digest('hex');
    
    // Generate step2 hash (MD5 of parameters)
    const step2String = `summa=${transaction.expectedAmount}&cashierpass=${CASHIER_PASS}&cashdeskid=${CASHDESK_ID}`;
    const step2 = crypto.createHash('md5').update(step2String).digest('hex');
    
    // Generate final signature (SHA256 of step1 + step2)
    const finalSignatureString = step1 + step2;
    const finalSignature = crypto.createHash('sha256').update(finalSignatureString).digest('hex');

    // Payload for CashDesk deposit
    const depositPayload = {
      cashdeskid: parseInt(CASHDESK_ID),
      lng: 'ru',
      userid: parseInt(transaction.payerId),
      summa: parseFloat(transaction.expectedAmount),
      confirm
    };

    console.log("CashDesk deposit payload:", JSON.stringify(depositPayload, null, 2));
    
    // Make CashDesk deposit API call
    const cashdeskResponse = await axios.post(
      `${CASHDESK_API_BASE}/Deposit/${transaction.payerId}/Add`,
      depositPayload,
      {
        headers: {
          'sign': finalSignature,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('CashDesk deposit response:', cashdeskResponse.data);
    
    if (cashdeskResponse.data && cashdeskResponse.data.Success === true) {
      console.log('CashDesk deposit successful');
      return {
        success: true,
        data: cashdeskResponse.data
      };
    } else {
      console.log('CashDesk deposit failed according to response');
      return {
        success: false,
        data: cashdeskResponse.data,
        error: cashdeskResponse.data.Message || "CashDesk deposit failed"
      };
    }
  } catch (error) {
    const errorData = error.response ? {
      status: error.response.status,
      data: error.response.data,
      headers: error.response.headers
    } : error.message;
    
    console.error('CashDesk API call failed - Error:', JSON.stringify(errorData, null, 2));
    
    return {
      success: false,
      error: errorData
    };
  }
};

// bKash payment function
const payment_bkash = async (req, res) => {
  const data = req.body;
  const apiKey = req.headers['x-api-key'] || '';
  
  console.log('bKash payment request data:', data);
  console.log('API Key:', apiKey);

  if (!data.orderId || !data.payerId || !data.amount || !data.currency || !data.redirectUrl || !data.callbackUrl) {
    return res.status(200).json({
      success: false,
      orderId: data.orderId,
      message: "Required fields are not filled out."
    });
  }

  try {
    // Check for duplicate order ID
    const payinTransaction = await PayinTransaction.findOne({
      orderId: data.orderId,
    });
    
    if (payinTransaction) {
      console.log('Duplicate order ID:', data.orderId);
      return res.status(200).json({
        success: false,
        orderId: data.orderId,
        message: "Transaction with duplicated order id, " + data.orderId + "."
      });  
    }

    // Validate merchant API key
    const matched_merchant = await Merchantkey.findOne({ apiKey: apiKey });
    if (!matched_merchant) {
      return res.status(200).json({
        success: false,
        message: "Wrong merchant api key!"
      });
    }

    // Account selection logic
    const provoder_name = 'Bkash P2C';
    
    // Find eligible users with sufficient balance
    const eligibleUsers = await UserModel.find({
      balance: { $gte: 50000 + data.amount },
      'agentAccounts.0': { $exists: true },
      status: 'active',
      paymentMethod: provoder_name
    });

    if (eligibleUsers.length === 0) {
      console.log('No eligible agents found');
      return res.status(200).json({
        success: false,
        orderId: data.orderId,
        message: "No eligible agents found."
      });
    }

    // Try each eligible agent until we find one that works
    let token = null;
    let selectedAgent = null;
    let selectedAccount = null;
    
    // Shuffle agents to distribute load
    const shuffledAgents = [...eligibleUsers].sort(() => 0.5 - Math.random());
    
    for (const agent of shuffledAgents) {
      selectedAgent = agent;
      
      console.log("Trying Agent:", {
        _id: selectedAgent._id,
        username: selectedAgent.username,
        balance: selectedAgent.balance,
        agentAccountsCount: selectedAgent.agentAccounts.length
      });

      // Get all active bank accounts for the selected agent
      const agentAccounts = await BankAccount.find({
        user_id: selectedAgent._id,
        status: 'active'
      });

      if (agentAccounts.length === 0) {
        console.log('No active bank accounts found for agent');
        continue;
      }

      // Try each account until we find one that works
      const shuffledAccounts = [...agentAccounts].sort(() => 0.5 - Math.random());
      
      for (const account of shuffledAccounts) {
        selectedAccount = account;
        
        console.log("Trying Account:", {
          accountNumber: selectedAccount.accountNumber,
          username: selectedAccount.username,
          appKey: selectedAccount.appKey
        });

        // Update BKASH credentials based on selected account
        BKASH_URL = selectedAccount.url || 'https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout';
        BKASH_USERNAME = selectedAccount.username;
        BKASH_PASSWORD = selectedAccount.password;
        BKASH_APP_KEY = selectedAccount.appKey;
        BKASH_APP_SECRET_KEY = selectedAccount.appSecretKey;
        
        console.log('Updated bKash credentials for account:', selectedAccount.accountNumber);

        // Get bKash token
        token = await get_token_bkash();
        if (token) {
          console.log('Successfully obtained token with account:', selectedAccount.accountNumber);
          break; // Break out of account loop if token is obtained
        } else {
          console.log('Failed to get token with account:', selectedAccount.accountNumber);
        }
      }
      
      if (token) {
        break; // Break out of agent loop if token is obtained
      }
    }

    // If no token after trying all agents and accounts
    if (!token) {
      console.log('Failed to get token with any agent account');
      return res.status(200).json({
        success: false,
        orderId: data.orderId,
        message: "Payment provider authentication failed. Please try again later."
      }); 
    }
    
    const referenceId = nanoid(16);
    const body = {
      mode: '0011', 
      payerReference: data.payerId,
      callbackURL: data.callbackUrl,
      amount: data.amount,
      currency: data.currency,
      intent: 'sale',
      merchantInvoiceNumber: referenceId,
    };

    console.log('Creating bKash payment with body:', body);

    const createObj = await axios.post(`${BKASH_URL}/create`, body, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        'x-app-key': BKASH_APP_KEY,
        Authorization: token
      },
      timeout: 30000
    });

    console.log('bKash payment create response:', createObj.data);
    
    if (createObj.data.statusCode && createObj.data.statusCode === '0000') {
      const newTransaction = await PayinTransaction.create({
        paymentId: createObj.data.paymentID,
        agentAccount: selectedAccount.accountNumber,
        provider: 'bkash',
        orderId: data.orderId,
        payerId: data.payerId,
        expectedAmount: data.amount,
        currency: data.currency,
        redirectUrl: data.redirectUrl,
        callbackUrl: data.callbackUrl,
        referenceId,
        submitDate: new Date(),
        paymentType: 'p2c',
        merchantid: matched_merchant._id
      }); 

      return res.status(200).json({
        success: true,
        message: "Payment link created.",
        orderId: data.orderId,
        paymentId: createObj.data.paymentID,
        link: createObj.data.bkashURL
      });
    } else {
      console.log('bKash payment creation failed:', createObj.data);
      return res.status(200).json({
        success: false,
        orderId: data.orderId,
        message: createObj.data.statusMessage || "Payment creation failed"
      }); 
    }

  } catch (error) {
    console.log('bKash payment error:', error.response ? error.response.data : error.message);
    
    res.status(200).json({ 
      success: false,
      orderId: data.orderId,
      message: error.response?.data?.errorMessage || "Internal server error"
    });
  }
};

const callback_bkash = async (req, res) => {
  const data = req.body;
  console.log('bKash callback data:', data);
  
  try {
    const transaction = await PayinTransaction.findOne({
      paymentId: data.paymentID
    });
    
    if (!transaction) {
      console.log('No transaction found with paymentID:', data.paymentID);
      return res.status(200).json({
        success: false,
        message: "There is no transaction with provided payment ID, " + data.paymentID + "."
      });  
    }
    
    res.status(200).json({
      success: true,
      redirectUrl: transaction.redirectUrl
    }); 

    if (data.status !== 'success') {
      console.log('Callback status is not success:', data.status);
      return;
    }

    if (transaction.status !== 'pending') {
      console.log('Transaction already processed:', transaction.status);
      return; 
    }

    // Get the agent account used for this transaction
    const account = await BankAccount.findOne({ accountNumber: transaction.agentAccount });
    if (account) {
      // Update BKASH credentials based on the account used in the transaction
      BKASH_URL = account.url || 'https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout';
      BKASH_USERNAME = account.username;
      BKASH_PASSWORD = account.password;
      BKASH_APP_KEY = account.appKey;
      BKASH_APP_SECRET_KEY = account.appSecretKey;
    }

    const token = await get_token_bkash();
    if (!token) {
      console.log('bKash token is null in callback');
      
      // Update transaction status to suspended if token fails
      transaction.status = 'suspended';
      transaction.statusDate = new Date();
      await transaction.save();
      return;
    }
    
    const body = {
      paymentID: data.paymentID,
    };

    const executeObj = await axios.post(`${BKASH_URL}/execute`, body, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        'x-app-key': BKASH_APP_KEY,
        Authorization: token
      },
      timeout: 30000
    });

    console.log('bKash payment execute response:', executeObj.data);

    if (executeObj.data.statusCode && executeObj.data.statusCode === '0000') {
      if (executeObj.data.transactionStatus === "Completed") {
        transaction.status = "completed";
        await transaction.save();
        
        // Process commission and update balances
        const find_account = await BankAccount.findOne({ accountNumber: transaction.agentAccount });
        const matched_user = await UserModel.findById(find_account.user_id);
        
        if (find_account && matched_user) {
          const usercomissionmoney = (transaction.expectedAmount / 100) * matched_user.depositcommission;
          find_account.total_order += 1;
          find_account.total_recieved += transaction.expectedAmount;
          await find_account.save();
          
          matched_user.balance -= transaction.expectedAmount;
          matched_user.balance += usercomissionmoney;
          matched_user.providercost += usercomissionmoney;
          matched_user.totalpayment += transaction.expectedAmount;
          await matched_user.save();

          const matchedmerchant = await Merchantkey.findById(transaction.merchantid);
          if (matchedmerchant) {
            const comissionmoney = (transaction.expectedAmount / 100) * matchedmerchant.depositCommission;
            matchedmerchant.balance += transaction.expectedAmount;
            matchedmerchant.balance -= comissionmoney;
            matchedmerchant.total_payin += transaction.expectedAmount;
            matchedmerchant.providercost += comissionmoney;
            await matchedmerchant.save();
          }
        }

        // Process CashDesk deposit
        const cashdeskResult = await processCashDeskDeposit(transaction);
        transaction.cashdeskResult = cashdeskResult;
        await transaction.save();
        
      } else if (executeObj.data.transactionStatus === 'Initiated') {
        // If initiated, fetch status later
        setTimeout(() => fetch_bkash(data.paymentID), 5000);
        return;
      }
      
      let transaction_status = 'processing';
      if (executeObj.data.transactionStatus === 'Completed') {
        transaction_status = 'completed';
      } else if (executeObj.data.transactionStatus === 'Pending Authorized') {
        transaction_status = 'pending';
      } else if (executeObj.data.transactionStatus === 'Expired') {
        transaction_status = 'expired';
      } else if (executeObj.data.transactionStatus === 'Declined') {
        transaction_status = 'rejected';
      }

      const currentTime = new Date();
      transaction.status = transaction_status;
      transaction.statusDate = currentTime;
      transaction.transactionDate = currentTime;
      transaction.transactionId = executeObj.data.trxID;
      transaction.receivedAmount = executeObj.data.amount;
      transaction.payerAccount = executeObj.data.customerMsisdn;
      await transaction.save();
      
      // Send callback to merchant
      if (transaction.callbackUrl && (transaction.status === 'completed' || transaction.status === 'expired' || transaction.status === 'suspended')) {
        await sendCallbackToMerchant(transaction);
      }

    } else if (executeObj.data.statusCode) {
      console.log('bKash execute failed:', executeObj.data.statusCode, executeObj.data.statusMessage);
      
      transaction.status = 'suspended';
      transaction.statusDate = new Date();
      await transaction.save();
      
      if (transaction.callbackUrl) {
        await sendCallbackToMerchant(transaction);
      }
    }

  } catch (error) {
    console.log('bKash callback error:', error.response ? error.response.data : error.message);
  }
};

const fetch_bkash = async (paymentID) => {
  console.log('Fetching bKash payment status for:', paymentID);
  
  try {
    const transaction = await PayinTransaction.findOne({
      paymentId: paymentID
    });
    
    if (!transaction) {
      console.log('No transaction found for paymentID:', paymentID);
      return;  
    }

    // Get the agent account used for this transaction
    const account = await BankAccount.findOne({ accountNumber: transaction.agentAccount });
    if (account) {
      // Update BKASH credentials based on the account used in the transaction
      BKASH_URL = account.url || 'https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout';
      BKASH_USERNAME = account.username;
      BKASH_PASSWORD = account.password;
      BKASH_APP_KEY = account.appKey;
      BKASH_APP_SECRET_KEY = account.appSecretKey;
    }

    const token = await get_token_bkash();
    if (!token) {
      console.log('bKash token is null in fetch');
      return;
    }
    
    const body = { paymentID };

    const queryObj = await axios.post(`${BKASH_URL}/payment/status`, body, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        'x-app-key': BKASH_APP_KEY,
        Authorization: token
      },
      timeout: 30000
    });

    console.log('bKash payment status response:', queryObj.data);

    if (queryObj.data.statusCode && queryObj.data.statusCode === '0000') {
      if (queryObj.data.transactionStatus === 'Initiated') {
        // If still initiated, fetch again later
        setTimeout(() => fetch_bkash(paymentID), 5000);
        return;
      }
      
      let transaction_status = 'processing';
      if (queryObj.data.transactionStatus === 'Completed') {
        transaction_status = 'completed';
      } else if (queryObj.data.transactionStatus === 'Pending Authorized') {
        transaction_status = 'pending';
      } else if (queryObj.data.transactionStatus === 'Expired') {
        transaction_status = 'expired';
      } else if (queryObj.data.transactionStatus === 'Declined') {
        transaction_status = 'rejected';
      }

      const currentTime = new Date();
      transaction.status = transaction_status;
      transaction.statusDate = currentTime;
      transaction.transactionDate = currentTime;
      transaction.transactionId = queryObj.data.trxID;
      transaction.receivedAmount = queryObj.data.amount;
      transaction.payerAccount = queryObj.data.customerMsisdn;
      await transaction.save();
      
      // Send callback to merchant if needed
      if (transaction.callbackUrl && (transaction.status === 'completed' || transaction.status === 'expired' || transaction.status === 'suspended') && !transaction.sentCallbackDate) {
        await sendCallbackToMerchant(transaction);
      }

    } else {
      console.log('bKash payment status query failed:', queryObj.data);
      transaction.status = 'suspended';
      transaction.statusDate = new Date();
      await transaction.save();
    }

  } catch (error) {
    console.log('bKash fetch error:', error.response ? error.response.data : error.message);
    // Retry after delay if still pending
    setTimeout(() => fetch_bkash(paymentID), 5000);
  }
};

// Helper function to send callback to merchant
const sendCallbackToMerchant = async (transaction) => {
  try {
    const hash = generate256Hash(transaction.paymentId + transaction.orderId + transaction.receivedAmount.toString() + transaction.currency);

    const payload = {
      paymentId: transaction.paymentId,
      orderId: transaction.orderId,
      amount: transaction.receivedAmount,
      currency: transaction.currency,
      transactionId: transaction.transactionId,
      status: transaction.status,
      hash,
    };

    const resp = await axios.post(transaction.callbackUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 10000
    });

    console.log('Callback sent to merchant successfully:', resp.data);
    
    if (resp.status === 200) {
      transaction.sentCallbackDate = new Date();
      await transaction.save();
    }
    
  } catch (error) {
    console.log('Callback to merchant failed:', error.response ? error.response.data : error.message);
  }
};

module.exports = { payment_bkash, callback_bkash };