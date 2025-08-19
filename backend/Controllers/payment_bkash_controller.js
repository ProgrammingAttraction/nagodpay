const PayinTransaction = require("../Models/PayinTransaction.js")
const User = require("../Models/User.js")
const axios = require('axios');
const { nanoid } = require('nanoid');
const crypto = require('crypto');
const UserModel = require("../Models/User.js");
const BankAccount = require("../Models/BankAccount.js");
const Merchantkey = require("../Models/Merchantkey.js");
const { sign } = crypto;


const SERVER_URL = 'https://eassypay.com/api';
const BASE_URL = 'http://localhost:3000';

function generate256Hash(data) {
  // Use SHA256 to generate a hash
  const hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest('hex');
}

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// const BKASH_URL = 'https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout'; 
let BKASH_URL = 'https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout';
// const BKASH_USERNAME = '01894292898'; 
let BKASH_USERNAME = '01711799891';
// const BKASH_PASSWORD = 'VOqd7H]5j[!'; 
let BKASH_PASSWORD = 'b8t|m:1I|oF';
// const BKASH_APP_KEY = '2aTnOgA6sdaZ5hz9SfPK4Aajtc'; 
let BKASH_APP_KEY = 'bMk6yA8dUSi1RjEKjURQablGtc';
// const BKASH_APP_SECRET_KEY = 'vHqUepso0iRbToaEe4O1Vwl0b2tBDnPylSDX2hSq8g1hNd05V2Gr'; 
let BKASH_APP_SECRET_KEY = 'qbl6yK033pPGUeKyJFs2oppUPPeNyJHZn62oOOkMaU3qA0GecnEC';
const CASHDESK_API_BASE = 'https://partners.servcul.com/CashdeskBotAPI';
const CASHDESK_HASH = "a13d615c8ee6f83a12a0645de4d9a1c4068148562f2ea165dea920c66af2ed90";
const CASHIER_PASS = "901276";
const CASHIER_LOGIN = "MuktaA1";
const CASHDESK_ID = "1177830";
const DEFAULT_LNG = 'ru';
const get_token_bkash = async () => {
  try {
    const body = {
      app_key: BKASH_APP_KEY, 
      app_secret: BKASH_APP_SECRET_KEY
    };

    const tokenObj = await axios.post(`${BKASH_URL}/token/grant`, body, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        username: BKASH_USERNAME,
        password: BKASH_PASSWORD
      }
    });
    // console.log('bkash-get-token-resp', tokenObj.data);
    return tokenObj.data.id_token;

  } catch (error) {

    console.log('bkash-get-token-error', error);

    return null;
  }  
}

// ----------------------------bkash pament----------------------
const payment_bkash = async (req, res) => {
  const data = req.body;
  console.log('bkash-payment-data', req.body.payerId);
      const apiKey = req.headers['x-api-key']?req.headers['x-api-key']:'';
    console.log(apiKey)
    console.log(req.body)
  if (!data.orderId || !data.payerId || !data.amount || !data.currency || !data.redirectUrl || !data.callbackUrl) {
    return res.status(200).json({
      success: false,
      orderId: data.orderId,
      message: "Required fields are not filled out."
    });
  }

  
  console.log("pass-condition-1");
  try {
    
    const payinTransaction = await PayinTransaction.findOne({
      orderId: data.orderId,
    });
    
    if (payinTransaction) {
      console.log('same order id for payment', data.orderId, payinTransaction.status);
      return res.status(200).json({
        success: false,
        orderId: data.orderId,
        message: "Transaction with duplicated order id, " + data.orderId + "."
      });  
    }
      // ---------------------------matched-merchant------------------
    const matched_merchant=await Merchantkey.findOne({apiKey:apiKey});
    if(!matched_merchant){
      return res.send({success:false,message:"Wrong merchant api key!"})
    }
    // Account selection logic
    let provoder_name = 'Bkash P2C'; // Since this is the bkash payment function
    
    // Find eligible users with sufficient balance (balance >= 50000 + expectedAmount) and at least one agent account
    const eligibleUsers = await UserModel.find({
      balance: { $gte: 50000 + data.amount }, // Balance must be at least 50,000 + expectedAmount
      'agentAccounts.0': { $exists: true }, // Has at least one agent account
      status: 'active', // Only active users
      paymentMethod: provoder_name
    });
  console.log(eligibleUsers)
    if (eligibleUsers.length === 0) {
      return res.status(200).json({
        success: false,
        orderId: data.orderId,
        message: "No eligible agents found."
      });
    }

    // Randomly select one user from the eligible users
    const randomIndex = Math.floor(Math.random() * eligibleUsers.length);
    const selectedAgent = eligibleUsers[randomIndex];

    // Log the selected agent for debugging
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
      return res.status(200).json({
        success: false,
        orderId: data.orderId,
        message: "No active bank accounts found for the selected agent"
      });
    }

    // Randomly select one bank account
    const randomAccountIndex = Math.floor(Math.random() * agentAccounts.length);
    const selectedAccount = agentAccounts[randomAccountIndex];
    console.log(selectedAccount)
    // Update BKASH credentials based on selected account
    if (selectedAccount) {
      BKASH_URL = 'https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout';
      BKASH_USERNAME = selectedAccount.username;
      BKASH_PASSWORD = selectedAccount.password;
      BKASH_APP_KEY = selectedAccount.appKey;
      BKASH_APP_SECRET_KEY = selectedAccount.appSecretKey;
    }

    const token = await get_token_bkash();
    if (!token) {
      console.log('bkash-token-is-null');
      return res.status(200).json({
        success: false,
        orderId: data.orderId,
        message: "Internal Error"
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

    const createObj = await axios.post(`${BKASH_URL}/create`, body, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        'x-app-key': BKASH_APP_KEY,
        Authorization: token
      }
    });

    console.log('bkash-payment-create-resp', createObj.data);
    
    
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
        merchantid:matched_merchant._id
      }); 

      return res.status(200).json({
        success: true,
        message: "Payment link created.",
        orderId: data.orderId,
        paymentId: createObj.data.paymentID,
        link: createObj.data.bkashURL
      });
    } else {
      // console.log('bkash-payment-create-fail', createObj.data.errorCode, createObj.data.errorMessage);
      return res.status(200).json({
        success: false,
        orderId: data.orderId,
        message: "Internal Error"
      }); 
    }

  } catch (e) {
    console.log('bkash-payment-error', e);
    res.status(500).json({ 
      success: false,
      orderId: data.orderId,
      message: e.message 
    });
  }
};
const callback_bkash = async (req, res) => {
  const data = req.body;
  console.log('bkash-callback-data', data);
  try {
    const transaction = await PayinTransaction.findOne({
      paymentId: data.paymentID
    });
    if (!transaction) {
      console.log('bkash-callback-no-transaction-with-paymentID', data.paymentID);
      return res.status(200).json({
        success: false,
        message: "There is no transaction with provided payment ID, " + data.paymentID + "."
      });  
    }
    res.status(200).json({
      success: true,
      redirectUrl: transaction.redirectUrl
    }); 

    if (data.status !== 'success') return;

    if (transaction.status !== 'pending') {
      console.log('bkash-callback-transaction-already-done');
      return; 
    }

    const token = await get_token_bkash();
    if (!token) {
      console.log('bkash-token-is-null');
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
      }
    });

    console.log('bkash-payment-execute-resp', executeObj.data);

    if (executeObj.data.statusCode && executeObj.data.statusCode === '0000') {
      if(executeObj.data.transactionStatus === "Completed"){
        transaction.status = "completed";
        await transaction.save();
        console.log("Transaction completed successfully");
        
        // >>>>>>> CASH DESKBOT DEPOSIT AFTER SUCCESS <<<<<<<
        if (transaction.payerId && executeObj.data.amount) {
          try {
            console.log("========== CASH DESKBOT DEPOSIT PROCESS STARTED ==========");
            console.log("Payer ID:", transaction.payerId);
            console.log("Amount to deposit:", executeObj.data.amount);
            console.log("CashDesk ID:", CASHDESK_ID);
            console.log("CashDesk API Base:", CASHDESK_API_BASE);
            
            // Generate confirm hash (MD5 of "payerId:CASHDESK_HASH")
            const confirmString = `${transaction.payerId}:${CASHDESK_HASH}`;
            const confirm = crypto.createHash('md5').update(confirmString).digest('hex');
            console.log("Confirm string:", confirmString);
            console.log("Confirm hash:", confirm);
            
            // Generate step1 hash (SHA256 of query string) - use lowercase 'userid'
            const step1String = `hash=${CASHDESK_HASH}&lng=ru&userid=${transaction.payerId}`;
            const step1 = crypto.createHash('sha256').update(step1String).digest('hex');
            console.log("Step1 string:", step1String);
            console.log("Step1 hash:", step1);
            
            // Generate step2 hash (MD5 of parameters)
            const step2String = `summa=${executeObj.data.amount}&cashierpass=${CASHIER_PASS}&cashdeskid=${CASHDESK_ID}`;
            const step2 = crypto.createHash('md5').update(step2String).digest('hex');
            console.log("Step2 string:", step2String);
            console.log("Step2 hash:", step2);
            
            // Generate final signature (SHA256 of step1 + step2)
            const finalSignatureString = step1 + step2;
            const finalSignature = crypto.createHash('sha256').update(finalSignatureString).digest('hex');
            console.log("Final signature string:", finalSignatureString);
            console.log("Final signature:", finalSignature);

            // ✅ Payload now includes userid + summa + confirm
            const depositPayload = {
              cashdeskid: parseInt(CASHDESK_ID),
              lng: 'ru',
              userid: parseInt(transaction.payerId),
              summa: parseFloat(executeObj.data.amount),
              confirm
            };

            console.log("CashDesk deposit payload:", JSON.stringify(depositPayload, null, 2));
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

            console.log('========== CASH DESKBOT DEPOSIT SUCCESSFUL ==========');
            console.log('Response status:', cashdeskResponse.status);
            console.log('Response data:', JSON.stringify(cashdeskResponse.data, null, 2));
            
            // Store CashDesk response in transaction
            transaction.cashdeskResponse = cashdeskResponse.data;
            await transaction.save();
            
            console.log("CashDesk response saved to transaction");
          } catch (cashdeskError) {
            console.error('========== CASH DESKBOT DEPOSIT FAILED ==========');
            
            const errorData = cashdeskError.response ? {
              status: cashdeskError.response.status,
              data: cashdeskError.response.data,
              headers: cashdeskError.response.headers
            } : cashdeskError.message;
            
            console.error('Error details:', JSON.stringify(errorData, null, 2));
            
            // Store error in transaction
            transaction.cashdeskError = errorData;
            await transaction.save();
            
            // Additional troubleshooting for 401 errors
            if (cashdeskError.response?.status === 401) {
              console.error("Authentication failed. Please verify:");
              console.error("1. CASHDESK_HASH is correct:", CASHDESK_HASH);
              console.error("2. CASHIER_PASS is correct:", CASHIER_PASS);
              console.error("3. CASHDESK_ID is correct:", CASHDESK_ID);
              console.error("4. Payer ID is valid:", transaction.payerId);
            }
          }
        } else {
          console.log("CashDesk deposit skipped - missing payerId or amount");
        }
      }
      
      if (executeObj.data.transactionStatus === 'Initiated') {
        console.log("Transaction initiated, starting fetch process");
        return fetch_bkash(data.paymentID);
      } else {
        let transaction_status = 'processing';
         
        if (executeObj.data.transactionStatus === 'Completed') {
          transaction_status = 'completed';
          console.log("Processing commission calculations for completed transaction");
          
          const find_account = await BankAccount.findOne({accountNumber: transaction.agentAccount});
          const matched_user = await UserModel.findById({_id: find_account.user_id});
          
          console.log("Found bank account:", find_account);
          console.log("Matched user:", matched_user);
          
          const usercomissionmoney = (transaction.expectedAmount/100) * matched_user.depositcommission;
          console.log("User commission calculated:", usercomissionmoney);
          
          find_account.total_order += 1;
          find_account.total_recieved += transaction.expectedAmount;
          await find_account.save();
          console.log("Bank account updated");
          
          matched_user.balance -= transaction.expectedAmount;
          matched_user.balance += usercomissionmoney;
          matched_user.providercost += usercomissionmoney;
          matched_user.totalpayment += transaction.expectedAmount;
          await matched_user.save();
          console.log("User account updated");

          const matchedmerchant = await Merchantkey.findById({_id: transaction.merchantid});
          const comissionmoney = (transaction.expectedAmount/100) * matchedmerchant.depositCommission;
          console.log("Merchant commission calculated:", comissionmoney);
          console.log("Merchant details:", matchedmerchant);
          
          matchedmerchant.balance += transaction.expectedAmount;
          matchedmerchant.balance -= comissionmoney;
          matchedmerchant.total_payin += transaction.expectedAmount;
          matchedmerchant.providercost += comissionmoney;
          await matchedmerchant.save();
          console.log("Merchant account updated");
        } else if (executeObj.data.transactionStatus === 'Pending Authorized') {
          transaction_status = 'pending';
          console.log("Transaction status: Pending Authorized");
        } else if (executeObj.data.transactionStatus === 'Expired') {
          transaction_status = 'expired';
          console.log("Transaction status: Expired");
        } else if (executeObj.data.transactionStatus === 'Declined') {
          transaction_status = 'rejected';
          console.log("Transaction status: Declined");
        }

        const currentTime = new Date();
        transaction.status = transaction_status;
        transaction.statusDate = currentTime;
        transaction.transactionDate = currentTime;
        transaction.transactionId = executeObj.data.trxID;
        transaction.receivedAmount = executeObj.data.amount;
        transaction.payerAccount = executeObj.data.customerMsisdn;
        await transaction.save();
        console.log("Transaction saved with status:", transaction_status);
        
        if (transaction.callbackUrl && (transaction.status === 'completed' || transaction.status === 'expired' || transaction.status === 'suspended')) {
          console.log("Preparing callback to merchant");
          const hash = generate256Hash(transaction.paymentId + transaction.orderId + transaction.receivedAmount.toString() + transaction.currency);

          let payload = {
            paymentId: transaction.paymentId,
            orderId: transaction.orderId,
            amount: transaction.receivedAmount,
            currency: transaction.currency,
            transactionId: transaction.transactionId,
            status: transaction.status,
            hash,
          };

          console.log("Callback payload:", JSON.stringify(payload, null, 2));
          console.log("Callback URL:", transaction.callbackUrl);

          await axios
          .post(
            transaction.callbackUrl,
            payload,
            {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
            }
          )
          .then(async (resp) => {
            console.log('========== MERCHANT CALLBACK SUCCESS ==========');
            console.log('Response status:', resp.status);
            console.log('Response data:', JSON.stringify(resp.data, null, 2));
            
            if (resp.status == 200) {
              transaction.sentCallbackDate = new Date();
              await transaction.save();
              console.log("Callback date saved to transaction");
            }
          })
          .catch((e) => {
            console.log('========== MERCHANT CALLBACK FAILED ==========');
            console.log('Error:', e.message);
            if (e.response) {
              console.log('Response status:', e.response.status);
              console.log('Response data:', e.response.data);
            }
          });
        }
      }

    } else if (executeObj.data.statusCode) {
      console.log('bkash-payment-execute-others', executeObj.data.statusCode, executeObj.data.statusMessage); 
      return;
    } else if (executeObj.data.errorCode) {
      console.log('bkash-payment-execute-fail', executeObj.data.errorCode, executeObj.data.errorMessage);      
      
      if (transaction.status !== 'pending') {
        console.log('bkash-callback-transaction-already-done');
        return; 
      }

      const currentTime = new Date();
      transaction.status = 'suspended';
      transaction.statusDate = currentTime;
      await transaction.save();
      console.log("Transaction suspended due to error");
      
      if (transaction.callbackUrl) {
        console.log("Preparing error callback to merchant");
        const hash = generate256Hash(transaction.paymentId + transaction.orderId + '0' + transaction.currency);

        let payload = {
          paymentId: transaction.paymentId,
          orderId: transaction.orderId,
          amount: 0,
          currency: transaction.currency,
          transactionId: null,
          status: transaction.status,
          hash,
        };

        console.log("Error callback payload:", JSON.stringify(payload, null, 2));

        await axios
        .post(
          transaction.callbackUrl,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          }
        )
        .then(async (resp) => {
          console.log('Error callback sent successfully');
          console.log('Response:', resp.data);
          if (resp.data.success) {
            transaction.sentCallbackDate = new Date();
            await transaction.save();
            console.log("Error callback date saved");
          }
        })
        .catch((e) => {
          console.log('Error callback failed:', e.message);
        });
      }
    }

  } catch (e) {
    console.log('========== UNEXPECTED ERROR IN CALLBACK ==========');
    console.log('Error message:', e.message);
    console.log('Error stack:', e.stack);
  }
};




const fetch_bkash = async (paymentID) => {
  
  console.log('bkash-fetch-data', paymentID);
  sleep(1000);

  try {
    
    const transaction = await PayinTransaction.findOne({
      paymentId: paymentID
    });
    if (!transaction) {
      console.log('bkash-fetch-no-transaction-with-paymentID', paymentID);
      return;  
    }

    const token = await get_token_bkash();
    if (!token) {
      console.log('bkash-token-is-null');
      return res.status(200).json({
        success: false,
        orderId: data.orderId,
        message: "Internal Error"
      }); 
    }
    
    const body = {
      paymentID
    };

    const queryObj = await axios.post(`${BKASH_URL}/payment/status`, body, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        'x-app-key': BKASH_APP_KEY,
        Authorization: token
      }
    });

    console.log('bkash-payment-query-resp', queryObj.data); // return;

    if (queryObj.data.statusCode && queryObj.data.statusCode === '0000') {
      
      if (queryObj.data.transactionStatus === 'Initiated') {
        fetch_bkash(paymentID);
      } else {
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
        
        if (transaction.callbackUrl && (transaction.status === 'completed' || transaction.status === 'expired' || transaction.status === 'suspended') && !transaction.sentCallbackDate) {
          
      

          const hash = generate256Hash(transaction.paymentId + transaction.orderId + transaction.receivedAmount.toString() + transaction.currency);

          let payload = {
            paymentId: transaction.paymentId,
            orderId: transaction.orderId,
            amount: transaction.receivedAmount,
            currency: transaction.currency,
            transactionId: transaction.transactionId,
            status: transaction.status,
            hash,
          };

          await axios
          .post(
            transaction.callbackUrl,
            payload,
            {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
            }
          )
          .then(async (resp) => {
            console.log('bkash-fetch-callback-to-mechant-resp', resp.data);
            if (resp.data.success) {
              transaction.sentCallbackDate = new Date();
              await transaction.save();
            }
            console.log('Callback has been sent to the merchant successfully'); 
          })
          .catch((e) => {
            console.log('bkash-fetch-callback-to-mechant-resp-error', e.message);
            console.log('Callback to the merchant failed');   
          });
        }
      }

    } else {
      console.log('bkash-payment-query-fail', queryObj.data.errorCode, queryObj.data.errorMessage);      
      const currentTime = new Date();
      transaction.status = 'suspended';
      transaction.statusDate = currentTime;
      await transaction.save();
    }

  } catch (e) {

    console.log('bkash-fetch-error', e.message);
    fetch_bkash(paymentID);

  }
};

module.exports={payment_bkash,callback_bkash}