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

// Default bKash credentials (will be overridden by agent accounts)
let BKASH_URL = 'https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout';
let BKASH_USERNAME = '01711799891';
let BKASH_PASSWORD = 'b8t|m:1I|oF';
let BKASH_APP_KEY = 'bMk6yA8dUSi1RjEKjURQablGtc';
let BKASH_APP_SECRET_KEY = 'qbl6yK033pPGUeKyJFs2oppUPPeNyJHZn62oOOkMaU3qA0GecnEC';

// FIXED: Enhanced token generation with proper bKash Tokenized Checkout authentication
const get_token_bkash = async () => {
  try {
    console.log('Attempting to get bKash token with credentials:', {
      username: BKASH_USERNAME,
      app_key: BKASH_APP_KEY.substring(0, 10) + '...'
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
    
    console.log('bKash token response status:', tokenObj.status);
    console.log('bKash token response data:', tokenObj.data);
    
    if (tokenObj.data && tokenObj.data.id_token) {
      console.log('bKash token successfully obtained');
      return tokenObj.data.id_token;
    } else {
      console.log('bKash token response missing id_token:', tokenObj.data);
      
      // Additional debug for common bKash errors
      if (tokenObj.data.statusMessage) {
        console.log('bKash error message:', tokenObj.data.statusMessage);
      }
      if (tokenObj.data.error) {
        console.log('bKash error:', tokenObj.data.error);
      }
      
      return null;
    }

  } catch (error) {
    console.log('bKash token generation failed:');
    
    if (error.response) {
      console.log('Error response status:', error.response.status);
      console.log('Error response data:', JSON.stringify(error.response.data, null, 2));
      
      // Handle specific bKash error codes
      if (error.response.data && error.response.data.statusCode) {
        switch(error.response.data.statusCode) {
          case '2055':
            console.log('Error: Invalid app key or secret');
            break;
          case '2054':
            console.log('Error: Invalid username or password');
            break;
          case '2004':
            console.log('Error: Merchant configuration issue');
            break;
          default:
            console.log('bKash error code:', error.response.data.statusCode);
        }
      }
    } else if (error.request) {
      console.log('No response received:', error.request);
    } else {
      console.log('Error message:', error.message);
    }
    
    return null;
  }  
}

// FIXED: Enhanced payment creation with better error handling
const payment_bkash = async (req, res) => {
  const data = req.body;
  const apiKey = req.headers['x-api-key'] || '';
  
  console.log('bKash payment request received:', {
    orderId: data.orderId,
    payerId: data.payerId,
    amount: data.amount
  });

  // Validation
  if (!data.orderId || !data.payerId || !data.amount || !data.currency || !data.redirectUrl || !data.callbackUrl) {
    return res.status(400).json({
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
      return res.status(400).json({
        success: false,
        orderId: data.orderId,
        message: "Transaction with duplicated order id, " + data.orderId + "."
      });  
    }
    
    // Merchant validation
    const matched_merchant = await Merchantkey.findOne({ apiKey: apiKey });
    if (!matched_merchant) {
      return res.status(401).json({
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
      return res.status(400).json({
        success: false,
        orderId: data.orderId,
        message: "No eligible agents found."
      });
    }

    // Randomly select one user from the eligible users
    const randomIndex = Math.floor(Math.random() * eligibleUsers.length);
    const selectedAgent = eligibleUsers[randomIndex];

    console.log("Selected Agent:", {
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
      console.log('No active bank accounts found for agent:', selectedAgent._id);
      return res.status(400).json({
        success: false,
        orderId: data.orderId,
        message: "No active bank accounts found for the selected agent"
      });
    }

    // Try each account until we get a valid token
    let selectedAccount = null;
    let token = null;
    
    for (const account of agentAccounts) {
      try {
        console.log('Trying account:', account.accountNumber);
        
        // Update BKASH credentials based on selected account
        BKASH_USERNAME = account.username;
        BKASH_PASSWORD = account.password;
        BKASH_APP_KEY = account.appKey;
        BKASH_APP_SECRET_KEY = account.appSecretKey;
        
        // Get bKash token
        token = await get_token_bkash();
        
        if (token) {
          selectedAccount = account;
          console.log('Successfully obtained token for account:', account.accountNumber);
          break;
        }
      } catch (accountError) {
        console.log('Failed with account:', account.accountNumber, accountError.message);
        continue;
      }
    }

    if (!token || !selectedAccount) {
      console.log('Failed to obtain token with any account');
      return res.status(500).json({
        success: false,
        orderId: data.orderId,
        message: "Failed to authenticate with any payment provider account"
      }); 
    }
    
    // Create payment request
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

    const createObj = await axios.post(`${BKASH_URL}/create`, body, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        'x-app-key': BKASH_APP_KEY,
        Authorization: token
      },
      timeout: 30000
    });

    console.log('bKash payment creation response:', createObj.data);
    
    if (createObj.data.statusCode && createObj.data.statusCode === '0000') {
      // Create transaction record
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
        merchantid: matched_merchant._id,
        agentDetails: {
          userId: selectedAgent._id,
          username: selectedAgent.username,
          accountNumber: selectedAccount.accountNumber
        }
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
      return res.status(500).json({
        success: false,
        orderId: data.orderId,
        message: "Payment creation failed: " + (createObj.data.statusMessage || "Unknown error")
      }); 
    }

  } catch (error) {
    console.log('bKash payment error:', error.message);
    
    let errorMessage = "Internal server error";
    if (error.response) {
      errorMessage = `Payment provider error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
    }
    
    res.status(500).json({ 
      success: false,
      orderId: data.orderId,
      message: errorMessage 
    });
  }
};

// FIXED: Enhanced token refresh mechanism
const refreshBkashToken = async () => {
  try {
    const authString = Buffer.from(`${BKASH_APP_KEY}:${BKASH_APP_SECRET_KEY}`).toString('base64');
    
    const response = await axios.post(`${BKASH_URL}/token/refresh`, {
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
    
    if (response.data && response.data.id_token) {
      console.log('bKash token refreshed successfully');
      return response.data.id_token;
    }
    return null;
  } catch (error) {
    console.log('Token refresh failed:', error.message);
    return null;
  }
};

// FIXED: Enhanced callback with token retry mechanism
const callback_bkash = async (req, res) => {
  const data = req.body;
  console.log('bKash callback received:', data);
  
  try {
    const transaction = await PayinTransaction.findOne({
      paymentId: data.paymentID
    });
    
    if (!transaction) {
      console.log('No transaction found for paymentID:', data.paymentID);
      return res.status(404).json({
        success: false,
        message: "There is no transaction with provided payment ID, " + data.paymentID + "."
      });  
    }
    
    // Immediately respond to bKash to prevent timeout
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

    // Get token for execution with retry mechanism
    let token = await get_token_bkash();
    if (!token) {
      // Try to refresh token if initial attempt fails
      console.log('Initial token failed, trying refresh...');
      token = await refreshBkashToken();
      
      if (!token) {
        console.log('Failed to get token for payment execution');
        transaction.status = 'suspended';
        transaction.statusDate = new Date();
        await transaction.save();
        return;
      }
    }
    
    // Execute payment
    const executeObj = await axios.post(`${BKASH_URL}/execute`, {
      paymentID: data.paymentID,
    }, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        'x-app-key': BKASH_APP_KEY,
        Authorization: token
      },
      timeout: 30000
    });

    console.log('bKash execute response:', executeObj.data);

    await processBkashTransactionResponse(transaction, executeObj.data);

  } catch (error) {
    console.log('bKash callback error:', error.message);
    
    // Handle specific transaction if available in error context
    if (error.transaction) {
      error.transaction.status = 'suspended';
      error.transaction.statusDate = new Date();
      await error.transaction.save();
    }
  }
};

// Helper function to process bKash transaction response
async function processBkashTransactionResponse(transaction, responseData) {
  try {
    if (responseData.statusCode && responseData.statusCode === '0000') {
      if (responseData.transactionStatus === "Completed") {
        // Update transaction status
        transaction.status = "completed";
        transaction.transactionId = responseData.trxID;
        transaction.receivedAmount = responseData.amount;
        transaction.payerAccount = responseData.customerMsisdn;
        transaction.statusDate = new Date();
        transaction.transactionDate = new Date();
        
        await transaction.save();
        
        console.log("Transaction completed successfully");

        // Process agent and merchant balances
        const find_account = await BankAccount.findOne({ accountNumber: transaction.agentAccount });
        if (!find_account) {
          console.log('Bank account not found:', transaction.agentAccount);
          return;
        }
        
        const matched_user = await UserModel.findById(find_account.user_id);
        if (!matched_user) {
          console.log('User not found for account:', find_account.user_id);
          return;
        }
        
        // Calculate commissions
        const usercomissionmoney = (transaction.expectedAmount / 100) * matched_user.depositcommission;
        const matchedmerchant = await Merchantkey.findById(transaction.merchantid);
        
        if (!matchedmerchant) {
          console.log('Merchant not found:', transaction.merchantid);
          return;
        }
        
        const comissionmoney = (transaction.expectedAmount / 100) * matchedmerchant.depositCommission;
        
        // Update agent account
        find_account.total_order += 1;
        find_account.total_recieved += transaction.expectedAmount;
        await find_account.save();
        
        // Update user balance
        matched_user.balance -= transaction.expectedAmount;
        matched_user.balance += usercomissionmoney;
        matched_user.providercost += usercomissionmoney;
        matched_user.totalpayment += transaction.expectedAmount;
        await matched_user.save();
        
        // Update merchant balance
        matchedmerchant.balance += transaction.expectedAmount;
        matchedmerchant.balance -= comissionmoney;
        matchedmerchant.total_payin += transaction.expectedAmount;
        matchedmerchant.providercost += comissionmoney;
        await matchedmerchant.save();
        
        // Process CashDesk deposit
        const cashdeskResult = await processCashDeskDeposit(transaction);
        transaction.cashdeskResult = cashdeskResult;
        await transaction.save();
        
      } else if (responseData.transactionStatus === 'Initiated') {
        // Poll for status if initiated
        await sleep(2000);
        await fetch_bkash(data.paymentID);
        return;
      }
      
      // Send callback to merchant
      await sendMerchantCallback(transaction);
      
    } else {
      console.log('bKash execution failed:', responseData);
      transaction.status = 'suspended';
      transaction.statusDate = new Date();
      await transaction.save();
      
      // Still send callback to merchant for failed transactions
      await sendMerchantCallback(transaction);
    }
    
  } catch (error) {
    console.log('Error processing transaction response:', error.message);
    throw error;
  }
}

// Helper function to send callback to merchant
async function sendMerchantCallback(transaction) {
  if (!transaction.callbackUrl) return;
  
  try {
    const hash = generate256Hash(
      transaction.paymentId + 
      transaction.orderId + 
      (transaction.receivedAmount || 0).toString() + 
      transaction.currency
    );

    const payload = {
      paymentId: transaction.paymentId,
      orderId: transaction.orderId,
      amount: transaction.receivedAmount || 0,
      currency: transaction.currency,
      transactionId: transaction.transactionId,
      status: transaction.status,
      hash,
    };

    const callbackResponse = await axios.post(
      transaction.callbackUrl,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 10000
      }
    );

    console.log('Merchant callback response:', callbackResponse.status);
    
    if (callbackResponse.status === 200) {
      transaction.sentCallbackDate = new Date();
      await transaction.save();
    }
    
  } catch (error) {
    console.log('Failed to send merchant callback:', error.message);
  }
}

const fetch_bkash = async (paymentID) => {
  console.log('Fetching bKash payment status for:', paymentID);
  
  try {
    await sleep(2000); // Wait before checking status
    
    const transaction = await PayinTransaction.findOne({
      paymentId: paymentID
    });
    
    if (!transaction) {
      console.log('No transaction found for paymentID:', paymentID);
      return;  
    }

    // Get token for query with retry
    let token = await get_token_bkash();
    if (!token) {
      token = await refreshBkashToken();
      if (!token) {
        console.log('Failed to get token for status query');
        return;
      }
    }
    
    // Query payment status
    const queryObj = await axios.post(
      `${BKASH_URL}/payment/status`,
      { paymentID },
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          'x-app-key': BKASH_APP_KEY,
          Authorization: token
        },
        timeout: 30000
      }
    );

    console.log('bKash status query response:', queryObj.data);
    
    if (queryObj.data.statusCode && queryObj.data.statusCode === '0000') {
      await processBkashTransactionResponse(transaction, queryObj.data);
    } else {
      console.log('bKash status query failed');
      transaction.status = 'suspended';
      transaction.statusDate = new Date();
      await transaction.save();
    }
    
  } catch (error) {
    console.log('bKash fetch error:', error.message);
    
    // Retry after delay if it's a network error
    if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND') {
      console.log('Retrying fetch after delay...');
      await sleep(5000);
      await fetch_bkash(paymentID);
    }
  }
};

// CashDesk deposit function (unchanged)
const processCashDeskDeposit = async (transaction) => {
  try {
    console.log("Processing CashDesk deposit for transaction:", transaction._id);
    
    if (!transaction.payerId || !transaction.expectedAmount) {
      console.log("Skipping CashDesk deposit - missing payerId or received amount");
      return {
        success: false,
        error: "Missing payerId or transaction amount"
      };
    }
    
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

    console.log("Making API call to CashDesk...");

    // Make CashDesk deposit API call
    const cashdeskResponse = await axios.post(
      `${CASHDESK_API_BASE}/Deposit/${transaction.payerId}/Add`,
      depositPayload,
      {
        headers: {
          'sign': finalSignature,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 seconds timeout
      }
    );

    console.log('CashDesk deposit response:', cashdeskResponse.data);
    
    // Check if CashDesk operation was successful
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

module.exports = { payment_bkash, callback_bkash };