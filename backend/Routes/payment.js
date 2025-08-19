const express = require('express');
// const { fetch_status, update_trans_status, payment, payout, checkout, payment_submit, change_payment_status, change_payout_status, resend_callback_payment, resend_callback_payout, callback_sms } = require('../Controllers/payment_controller');
const { authenticate, authorizeuser } = require('../Middlewares/authMiddleware');
const PayinTransaction = require('../Models/PayinTransaction');
const UserModel = require('../Models/User');
const BankAccount = require('../Models/BankAccount');
const ForwardedSms = require('../Models/ForwardedSms');
const PayoutTransaction = require('../Models/PayoutTransaction');
const Paymentrouter = express.Router();
const nanoid=require('nanoid').nanoid;
const customAlphabet=require('nanoid').customAlphabet;
const crypto = require('crypto');
const TelegramBot =require('node-telegram-bot-api');
const easypay_bot = new TelegramBot('7992374649:AAFqP7MTXUaM9UjpBAlKEDHQW2ppb9h_mzQ');
const easypay_payin_bot = new TelegramBot('7741087073:AAEXov8j6Fv4-ffzHB3rO4f3Y3F0kVNQI60');
const easypay_payout_bot = new TelegramBot('7214733744:AAEYeWybSG_GzboNANrmC73wouf39_ryqD4');
const easypay_request_payout_bot = new TelegramBot('7379994941:AAGBT6O7vAdVuM1_A5aRzyIgykql1ZEDAXk');
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const axios=require('axios');
const { payment_bkash, callback_bkash } = require('../Controllers/payment_bkash_controller');
const Merchantkey = require('../Models/Merchantkey');
const qs=require('qs');
// Paymentrouter.use(authenticate);
// Paymentrouter.use(authorizeuser);

// Paymentrouter.post("/status", fetch_status);
// Paymentrouter.get("/updateTransStatus", update_trans_status);
const CASHDESK_API_BASE = 'https://partners.servcul.com/CashdeskBotAPI';
const CASHDESK_HASH = "a13d615c8ee6f83a12a0645de4d9a1c4068148562f2ea165dea920c66af2ed90";
const CASHIER_PASS = "901276";
const CASHIER_LOGIN = "MuktaA1";
const CASHDESK_ID = "1177830";
const DEFAULT_LNG = 'en';
function generate256Hash(data) {
  // Use SHA256 to generate a hash
  const hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest('hex');
}
crypto.createHash
Paymentrouter.post("/payment",async(req, res)=>{
  try {
    const apiKey = req.headers['x-api-key']?req.headers['x-api-key']:'';
  var data = req.body;
    if (
      !data.provider ||
      !data.orderId ||
      !data.payerId ||
      !data.amount ||
      !data.currency ||
      !data.redirectUrl
    ) {
      return res.status(200).json({
        success: false,
        orderId: data.orderId,
        message: "Required fields are not filled out.",
      });
    }
    console.log(req.body)
    // const find_user=await UserModel.findOne({apiKey: data.apiKey});
    // if(!find_user){
    //      res.send({
    //       success: false,
    //       orderId: data.orderId,
    //       message: "There is not existing activated acccount with API key", 
    //     });
    //      return;
    // }

     // -----------------------check-existing-transaction-------------------
    const payinTransaction = await PayinTransaction.findOne({
      orderId: data.orderId,
      merchant: data.mid,
    });

    if (payinTransaction) {
      console.log(
        "same order id for payment",
        data.orderId,
        payinTransaction.status
      );
      return res.status(200).json({
        success: false,
        orderId: data.orderId,
        message: "Transaction with duplicated order id, " + data.orderId + ".",
      });
    }

    // ---------------------------matched-merchant------------------
    const matched_merchant=await Merchantkey.findOne({apiKey:apiKey});
    if(!matched_merchant){
      return res.send({success:false,message:"Wrong merchant api key!"})
    }
    // -----------------------create-new-transaction-------------------
        const paymentId = nanoid(8); // uuidv4();

    const newTransaction = await PayinTransaction.create({
      paymentId,
      provider: data.provider,
      orderId: data.orderId,
      payerId: data.payerId,
      expectedAmount: data.amount,
      currency: data.currency,
      redirectUrl: data.redirectUrl,
      callbackUrl: data.callbackUrl,
      paymentType: "p2p",
      merchantid:matched_merchant._id,
      
    });

    return res.status(200).json({
      success: true,
      message: "Payment link created.",
      orderId: data.orderId,
      paymentId,
      link: `https://nagodpay.com/checkout/${paymentId}`,
    });
  } catch (error) {
    console.log(error)
  }
});


// Utility functions for hash generation
function generateMD5Hash(data) {
  return crypto.createHash('md5').update(data).digest('hex');
}

function generateSHA256Hash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Payout endpoint
Paymentrouter.post("/payout", async (req, res) => {
  const { payeeId, paymentId, amount } = req.body;
  const apiKey = req.headers['x-api-key'] || '';
  console.log("Payout request received:", req.body);
  if (!payeeId || !paymentId || !amount) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields."
    });
  }

  try {
    // Step 1: Generate confirm hash (MD5 of payeeId:CASHDESK_HASH)
    const confirm = generateMD5Hash(`${payeeId}:${CASHDESK_HASH}`);
    console.log("Generated confirm hash:", confirm);

    // Step 2: Generate step1 hash (SHA256 of hash={CASHDESK_HASH}&lng={DEFAULT_LNG}&Userid={payeeId})
    const step1 = generateSHA256Hash(`hash=${CASHDESK_HASH}&lng=${DEFAULT_LNG}&Userid=${payeeId}`);
    console.log("Generated step1 hash:", step1);

    // Step 3: Generate step2 hash (MD5 of code={paymentId}&cashierpass={CASHIER_PASS}&cashdeskid={CASHDESK_ID})
    const step2 = generateMD5Hash(`code=${paymentId}&cashierpass=${CASHIER_PASS}&cashdeskid=${CASHDESK_ID}`);
    console.log("Generated step2 hash:", step2);

    // Step 4: Final signature (SHA256 of step1 + step2)
    const finalSignature = generateSHA256Hash(step1 + step2);
    console.log("Final generated signature:", finalSignature);

    // Step 5: Prepare the payout payload
    const payoutPayload = {
      cashdeskid: parseInt(CASHDESK_ID),
      lng: DEFAULT_LNG,
      code: paymentId,
      confirm: confirm
    };
    console.log("Payout Payload:", payoutPayload);

    // Step 6: Make CashDeskBot API request to process the payout
    const cashdeskResponse = await axios.post(
      `${CASHDESK_API_BASE}/Deposit/${payeeId}/Payout`,
      payoutPayload,
      {
        headers: {
          'sign': finalSignature,
          'Content-Type': 'application/json'
        }
      }
    );

    // Log the CashDeskBot response
    console.log('CashDesk payout successful:', cashdeskResponse.data);

    // Store CashDeskBot response in the transaction record if needed
    const newPayoutTransaction = await PayoutTransaction.create({
      paymentId,
      payeeId,
      amount,
      status: 'pending',
      cashdeskResponse: cashdeskResponse.data
    });

    return res.status(200).json({
      success: true,
      message: "Payout request successfully processed and CashDeskBot withdrawal initiated.",
      response: cashdeskResponse.data
    });
  } catch (e) {
    console.log("Error during payout process:", e.message);

    // Handle error responses
    if (e.response) {
      console.log("Error response from CashDeskBot:", e.response.data);
      console.log("Error status code:", e.response.status);
      console.log("Error headers:", e.response.headers);
    }

    // Additional checks for 401 Error (authentication failure)
    if (e.response && e.response.status === 401) {
      console.error("Authentication failed. Please verify:");
      console.error("1. CASHDESK_HASH is correct:", CASHDESK_HASH);
      console.error("2. CASHIER_PASS is correct:", CASHIER_PASS);
      console.error("3. CASHDESK_ID is correct:", CASHDESK_ID);
      console.error("4. Payer ID is valid:", payeeId);
    }

    return res.status(500).json({
      success: false,
      message: "Error occurred during payout request.",
      errorDetails: e.message
    });
  }
});




Paymentrouter.post("/checkout", async (req, res) => {
    const { paymentId } = req.body;
    const apiKey = req.headers['x-api-key'] ? req.headers['x-api-key'] : '';
    
    try {
        // 1. Find the payment transaction
        const match_payment = await PayinTransaction.findOne({ paymentId });
        if (!match_payment) {
            console.log(`Payment ID ${paymentId} not found`);
            return res.send({ success: false, message: "Payment ID not found!" });
        }

        const expectedAmount = Number(match_payment.expectedAmount || 0);
        const requiredBalance = 50000 + expectedAmount;
        console.log(`Required Balance: ${requiredBalance} (50000 + ${expectedAmount})`);
        
        let provider_name;
        if (match_payment.provider === 'bkash') {
            provider_name = 'Bkash P2P';
        } else if (match_payment.provider === 'nagad') {
            provider_name = 'Nagad P2P';
        } else {
            console.log(`Unsupported provider: ${match_payment.provider}`);
            return res.status(400).send({ success: false, message: "Unsupported payment provider" });
        }

        console.log("Looking for provider:", provider_name);

        // 2. Find eligible users with sufficient balance (50000 + expectedAmount) and active agent accounts
        const eligibleUsers = await UserModel.aggregate([
            {
                $match: {
                    balance: { $gte: requiredBalance },
                    status: 'active',
                    paymentMethod: { $in: [provider_name] }
                }
            },
            {
                $lookup: {
                    from: "bankaccounts",
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$user_id", "$$userId"] },
                                status: 'active',
                                provider: provider_name
                            }
                        }
                    ],
                    as: "activeAccounts"
                }
            },
            {
                $match: {
                    "activeAccounts.0": { $exists: true }
                }
            },
            {
                $project: {
                    _id: 1,
                    username: 1,
                    balance: 1,
                    activeAccounts: 1,
                    paymentMethod: 1
                }
            }
        ]);

        console.log(`Found ${eligibleUsers.length} eligible users with balance >= ${requiredBalance}`);

        if (eligibleUsers.length === 0) {
            // Diagnostic queries to understand why no users are eligible
            const allUsersCount = await UserModel.countDocuments({
                paymentMethod: { $in: [provider_name] },
                status: 'active'
            });
            
            const usersWithBalance = await UserModel.countDocuments({
                paymentMethod: { $in: [provider_name] },
                status: 'active',
                balance: { $gte: requiredBalance }
            });
            
            const usersWithAccounts = await UserModel.countDocuments({
                paymentMethod: { $in: [provider_name] },
                status: 'active',
                balance: { $gte: requiredBalance },
                'agentAccounts.0': { $exists: true }
            });

            console.log(`Diagnostics:
                Total users with provider ${provider_name}: ${allUsersCount}
                Users with balance >= ${requiredBalance}: ${usersWithBalance}
                Users with agent accounts: ${usersWithAccounts}`);

            return res.send({
                success: false,
                message: `No eligible agents found with balance >= ${requiredBalance} and active accounts`,
                diagnostics: {
                    totalUsers: allUsersCount,
                    usersWithRequiredBalance: usersWithBalance,
                    usersWithAccounts: usersWithAccounts,
                    requiredBalance: requiredBalance
                }
            });
        }

        // 3. Select a random user with weights based on their balance
        const totalBalance = eligibleUsers.reduce((sum, user) => sum + user.balance, 0);
        let randomPoint = Math.random() * totalBalance;
        let selectedAgent = null;

        for (const user of eligibleUsers) {
            randomPoint -= user.balance;
            if (randomPoint <= 0) {
                selectedAgent = user;
                break;
            }
        }

        // Fallback to simple random selection if needed
        if (!selectedAgent) {
            selectedAgent = eligibleUsers[Math.floor(Math.random() * eligibleUsers.length)];
        }

        console.log("Selected Agent:", {
            _id: selectedAgent._id,
            username: selectedAgent.username,
            balance: selectedAgent.balance,
            activeAccounts: selectedAgent.activeAccounts.length
        });

        // 4. Select a random active account
        const selectedAccount = selectedAgent.activeAccounts[
            Math.floor(Math.random() * selectedAgent.activeAccounts.length)
        ];

        console.log("Selected Bank Account:", {
            provider: selectedAccount.provider,
            accountNumber: selectedAccount.accountNumber,
            shopName: selectedAccount.shopName
        });
match_payment.agentAccount=selectedAccount.accountNumber;
match_payment.save();
return res.status(200).send({
            success: true,
            message: "Agent and bank account selected successfully",
            agent: {
                id: selectedAgent._id,
                username: selectedAgent.username,
                balance: selectedAgent.balance
            },
            bankAccount: {
                provider: selectedAccount.provider,
                accountNumber: selectedAccount.accountNumber,
                shopName: selectedAccount.shopName
            },
            paymentDetails: {
                paymentId: match_payment.paymentId,
                expectedAmount: match_payment.expectedAmount,
                provider: match_payment.provider
            },
            requirements: {
                minimumRequiredBalance: requiredBalance
            }
        });



    } catch (error) {
        console.error("Checkout error:", error);
        return res.status(500).send({
            success: false,
            message: "An error occurred during checkout",
            error: error.message
        });
    }
});
// Paymentrouter.post("/checkout", async (req, res) => {
//     const { paymentId } = req.body;
//     const apiKey = req.headers['x-api-key']?req.headers['x-api-key']:'';
//     console.log(apiKey)
//     // const matched_api=await Merchantkey.findOne({apiKey:apiKey});
//     // if(!matched_api){
//     //   return res.send({success:false,message:"Merchnat Key Not Found."})
//     // }
//     const data = req.body;
//     console.log('bkash-payment-data', req.body.paymentId);
    
//     try {
//         // 1. Find the payment transaction
//         const match_payment = await PayinTransaction.findOne({ paymentId });
//         if (!match_payment) {
//             return res.send({ success: false, message: "Payment ID not found!" });
//         }

//         const expectedAmount = Number(match_payment.expectedAmount || 0);
//         console.log("Expected Amount:", expectedAmount);
//         let provoder_name;
//         if(match_payment.provider === 'bkash'){
//             provoder_name = 'Bkash P2P';
//         }else if(match_payment.provider === 'nagad'){
//             provoder_name = 'Nagad P2P';
//         }
//         console.log(provoder_name)
//  // 2. Find eligible users with sufficient balance (balance >= 50000 + expectedAmount) and at least one agent account
//     const eligibleUsers = await UserModel.find({
//             balance: { $gte: 50000 + expectedAmount }, // Balance must be at least 50,000 + expectedAmount
//             'agentAccounts.0': { $exists: true }, // Has at least one agent account
//             status: 'active', // Only active users
//             paymentMethod: { $in: [provoder_name] } // Updated to check if provoder_name is in the paymentMethod array
//         });
//         if (eligibleUsers.length === 0) {
//             return res.status(404).send({
//                 success: false,
//                 message: "No eligible agents found with sufficient balance"
//             });
//         }

//         // 3. Randomly select one user from the eligible users
//         const randomIndex = Math.floor(Math.random() * eligibleUsers.length);
//         const selectedAgent = eligibleUsers[randomIndex];

//         // 4. Log the selected agent for debugging
//         console.log("Selected Agent:", {
//             _id: selectedAgent._id,
//             username: selectedAgent.username,
//             balance: selectedAgent.balance,
//             agentAccountsCount: selectedAgent.agentAccounts.length
//         });

//         // 5. Get all active bank accounts for the selected agent
//         const agentAccounts = await BankAccount.find({
//             user_id: selectedAgent._id,
//             status: 'active',
//             provider:provoder_name
//         });

//         if (agentAccounts.length === 0) {
//             return res.status(404).send({
//                 success: false,
//                 message: "No active bank accounts found for the selected agent"
//             });
//         }

//         // 6. Randomly select one bank account
//         const randomAccountIndex = Math.floor(Math.random() * agentAccounts.length);
//         const selectedAccount = agentAccounts[randomAccountIndex];

//         console.log("Selected Bank Account:", {
//             provider: selectedAccount.provider,
//             accountNumber: selectedAccount.accountNumber,
//             shopName: selectedAccount.shopName
//         });

//         // Now you can proceed with the payment using the selectedAccount
//         // ... rest of your payment processing logic ...

//         // Example response (modify as needed)
//         return res.status(200).send({
//             success: true,
//             message: "Agent and bank account selected successfully",
//             agent: {
//                 id: selectedAgent._id,
//                 username: selectedAgent.username
//             },
//             bankAccount: {
//                 provider: selectedAccount.provider,
//                 accountNumber: selectedAccount.accountNumber,
//                 shopName: selectedAccount.shopName
//             },
//             paymentDetails: match_payment
//         });

//     } catch (error) {
//         console.error("Checkout error:", error);
//         return res.status(500).send({
//             success: false,
//             message: "An error occurred during checkout",
//             error: error.message || error
//         });
//     }
// });


// Paymentrouter.post("/checkout", async (req, res) => {
//     const { paymentId } = req.body;
//     const apiKey = req.headers['x-api-key'] ? req.headers['x-api-key'] : '';
    
//     try {
//         // 1. Find the payment transaction
//         const match_payment = await PayinTransaction.findOne({ paymentId });
//         if (!match_payment) {
//             console.log(`Payment ID ${paymentId} not found`);
//             return res.status(404).send({ success: false, message: "Payment ID not found!" });
//         }

//         const expectedAmount = Number(match_payment.expectedAmount || 0);
//         console.log("Expected Amount:", expectedAmount);
        
//         let provider_name;
//         if (match_payment.provider === 'bkash') {
//             provider_name = 'Bkash P2P';
//         } else if (match_payment.provider === 'nagad') {
//             provider_name = 'Nagad P2P';
//         } else {
//             console.log(`Unsupported provider: ${match_payment.provider}`);
//             return res.status(400).send({ success: false, message: "Unsupported payment provider" });
//         }

//         console.log("Looking for provider:", provider_name);

//         // 2. Find eligible users with sufficient balance and active agent accounts
//         const eligibleUsers = await UserModel.aggregate([
//             {
//                 $match: {
//                     balance: { $gte: expectedAmount }, // Removed the 50000 minimum for testing
//                     status: 'active',
//                     paymentMethod: { $in: [provider_name] }
//                 }
//             },
//             {
//                 $lookup: {
//                     from: "bankaccounts",
//                     let: { userId: "$_id" },
//                     pipeline: [
//                         {
//                             $match: {
//                                 $expr: { $eq: ["$user_id", "$$userId"] },
//                                 status: 'active',
//                                 provider: provider_name
//                             }
//                         }
//                     ],
//                     as: "activeAccounts"
//                 }
//             },
//             {
//                 $match: {
//                     "activeAccounts.0": { $exists: true }
//                 }
//             },
//             {
//                 $project: {
//                     _id: 1,
//                     username: 1,
//                     balance: 1,
//                     activeAccounts: 1,
//                     paymentMethod: 1
//                 }
//             }
//         ]);

//         console.log(`Found ${eligibleUsers.length} eligible users`);

//         if (eligibleUsers.length === 0) {
//             // Diagnostic query to understand why no users are eligible
//             const allUsersCount = await UserModel.countDocuments({
//                 paymentMethod: { $in: [provider_name] },
//                 status: 'active'
//             });
            
//             const usersWithBalance = await UserModel.countDocuments({
//                 paymentMethod: { $in: [provider_name] },
//                 status: 'active',
//                 balance: { $gte: expectedAmount }
//             });
            
//             const usersWithAccounts = await UserModel.countDocuments({
//                 paymentMethod: { $in: [provider_name] },
//                 status: 'active',
//                 balance: { $gte: expectedAmount },
//                 'agentAccounts.0': { $exists: true }
//             });

//             console.log(`Diagnostics:
//                 Total users with provider ${provider_name}: ${allUsersCount}
//                 Users with sufficient balance: ${usersWithBalance}
//                 Users with agent accounts: ${usersWithAccounts}`);

//             return res.status(404).send({
//                 success: false,
//                 message: "No eligible agents found with sufficient balance and active accounts",
//                 diagnostics: {
//                     totalUsers: allUsersCount,
//                     usersWithBalance: usersWithBalance,
//                     usersWithAccounts: usersWithAccounts
//                 }
//             });
//         }

//         // 3. Select a random user with weights based on their balance
//         // This gives users with higher balance a better chance of being selected
//         const totalBalance = eligibleUsers.reduce((sum, user) => sum + user.balance, 0);
//         let randomPoint = Math.random() * totalBalance;
//         let selectedAgent = null;

//         for (const user of eligibleUsers) {
//             randomPoint -= user.balance;
//             if (randomPoint <= 0) {
//                 selectedAgent = user;
//                 break;
//             }
//         }

//         // Fallback to simple random selection if something went wrong
//         if (!selectedAgent) {
//             selectedAgent = eligibleUsers[Math.floor(Math.random() * eligibleUsers.length)];
//         }

//         console.log("Selected Agent:", {
//             _id: selectedAgent._id,
//             username: selectedAgent.username,
//             balance: selectedAgent.balance,
//             activeAccounts: selectedAgent.activeAccounts.length
//         });

//         // 4. Select a random active account
//         const selectedAccount = selectedAgent.activeAccounts[
//             Math.floor(Math.random() * selectedAgent.activeAccounts.length)
//         ];

//         console.log("Selected Bank Account:", {
//             provider: selectedAccount.provider,
//             accountNumber: selectedAccount.accountNumber,
//             shopName: selectedAccount.shopName
//         });

//         return res.status(200).send({
//             success: true,
//             message: "Agent and bank account selected successfully",
//             agent: {
//                 id: selectedAgent._id,
//                 username: selectedAgent.username,
//                 balance: selectedAgent.balance
//             },
//             bankAccount: {
//                 provider: selectedAccount.provider,
//                 accountNumber: selectedAccount.accountNumber,
//                 shopName: selectedAccount.shopName
//             },
//             paymentDetails: {
//                 paymentId: match_payment.paymentId,
//                 expectedAmount: match_payment.expectedAmount,
//                 provider: match_payment.provider
//             }
//         });

//     } catch (error) {
//         console.error("Checkout error:", error);
//         return res.status(500).send({
//             success: false,
//             message: "An error occurred during checkout",
//             error: error.message
//         });
//     }
// });
// --------------------main-part
// Paymentrouter.post("/paymentSubmit",  async (req, res) => {
//   console.log("---payment-submit-data---");
//   const { paymentId, provider, agentAccount, payerAccount, transactionId } = req.body;
//   const currentTime = new Date();

//   try {
//     // 1. Validate forwarded SMS
// const forwardedSms = await ForwardedSms.findOne({
//   transactionId,
//   transactionType: "payin",
//   $expr: {
//     $eq: [
//       { $substr: ["$customerAccount", 0, 4] },
//       { $substr: [payerAccount, 0, 4] }
//     ]
//   }
// });
//    console.log(forwardedSms)
//     if (!forwardedSms) {
//       return res.status(200).json({
//         success: false,
//         type: "tid",
//         message: "Transaction ID is not valid.",
//       });
//     }

//     // 2. Prevent duplicate transactions
//     const transaction_old = await PayinTransaction.findOne({ transactionId });
//     if (transaction_old) {
//       return res.status(200).json({
//         success: false,
//         type: "tid",
//         message: "Transaction ID is used already.",
//       });
//     }

//     // 3. Validate payment ID
//     const transaction = await PayinTransaction.findOne({ paymentId });
//     if (!transaction) {
//       return res.status(200).json({
//         success: false,
//         type: "pid",
//         message: "There is no transaction with your payment id.",
//       });
//     }

//     const expirationDuration = 24 * 60 * 60 * 1000;
//     const elapsedTime = currentTime - transaction.createdAt;
//    const bankaccount=await BankAccount.findOne({accountNumber:transaction.agentAccount});
//       const matcheduser=await UserModel.findById({_id:bankaccount.user_id});
//     // 4. Update transaction
//     // transaction.agentAccount = forwardedSms.agentAccount;
//     transaction.payerAccount = forwardedSms.customerAccount;
//     transaction.transactionId = forwardedSms.transactionId;
//     transaction.receivedAmount = forwardedSms.transactionAmount;
//     transaction.balanceAmount = forwardedSms.balanceAmount;
//     transaction.transactionDate = forwardedSms.transactionDate;
//     transaction.submitDate = currentTime;
//     transaction.userid=matcheduser._id;
//     transaction.statusDate = currentTime;
//     transaction.status = elapsedTime > expirationDuration ? "expired" : "completed";
//     await transaction.save();



//     // 7. Telegram Notifications
//     const find_payment = await PayinTransaction.findOne({ paymentId });
//     const payinPayload =
//       "🎉 **New Payin Alert!** 🎉\n" +
//       "\n" +
//       "🆔 **Payment ID:** `" + find_payment.paymentId + "`\n" +
//       "💼 **Provider:** " + (forwardedSms.provider || "").toUpperCase() + " Personal\n" +
//       "📲 **Agent Wallet:** `" + forwardedSms.agentAccount + "`\n" +
//       "📥 **Receive Wallet:** `" + forwardedSms.customerAccount + "`\n" +
//       "🔢 **Transaction ID:** `" + forwardedSms.transactionId + "`\n" +
//       "💰 **" + forwardedSms.currency + " Amount:** `" + forwardedSms.transactionAmount + "`\n";

//     easypay_payin_bot.sendMessage(7920367057, payinPayload, { parse_mode: "Markdown" });
//     easypay_bot.sendMessage(7920367057, payinPayload, { parse_mode: "Markdown" });

//     forwardedSms.status = "used";
//     await forwardedSms.save();

//     if (elapsedTime > expirationDuration) {
//       return res.status(200).json({
//         success: false,
//         type: "pid",
//         message: "Your payment transaction is expired.",
//       });
//     }
    

//        if(!bankaccount){
//         return res.send({success:false,message:"Bank account not found."})
//        }
//        bankaccount.total_order+=1;
//        bankaccount.total_recieved+=forwardedSms.transactionAmount;
//        bankaccount.save();

//       //  ------------------merchant---------------------
//       const merchant_info=await Merchantkey.findById({_id:transaction.merchantid});
//       const commissionsmoney=(forwardedSms.transactionAmount/100)*merchant_info.depositCommission;
//       merchant_info.balance+=forwardedSms.transactionAmount;
//       merchant_info.balance-=commissionsmoney;
//       merchant_info.getwaycost+=commissionsmoney;
//       merchant_info.total_payin+=forwardedSms.transactionAmount;
//       merchant_info.save();
//       //  ------------------update-agent-------------------
//       const comissionmoney=(forwardedSms.transactionAmount/100)*matcheduser.depositcommission;
//       console.log(comissionmoney)
//       matcheduser.balance-=forwardedSms.transactionAmount;
//       matcheduser.balance+=comissionmoney;
//       matcheduser.providercost+=comissionmoney;
//       matcheduser.totalpayment+=forwardedSms.transactionAmount;
//       matcheduser.save();
//       //  --------------------user-find means-agent-account------------------------
      
//     // 8. Send callback to merchant
//     try {
//       const callbackResp = await axios.post(transaction.callbackUrl, {
//         paymentId: transaction.orderId,
//         transactionId: transaction.transactionId,
//         amount: forwardedSms.transactionAmount,
//         player_id: transaction.payerId,
//         status: "success",
//       }, {
//         headers: {
//           'Content-Type': 'application/json',
//           'Accept': 'application/json',
//         }
//       });

//       transaction.sentCallbackDate = new Date();
//       await transaction.save();

//       if (!callbackResp.data.success) {
//         return res.status(200).json({
//           success: false,
//           message: "Callback has not been sent to the merchant successfully"
//         });
//       }

//       return res.status(200).json({
//         success: true,
//         message: "Callback has been sent to the merchant successfully",
//         data: transaction
//       });
//     } catch (callbackErr) {
//       console.error('Callback error:', callbackErr.message);
//       return res.status(200).json({
//         success: false,
//         message: "Callback to the merchant failed"
//       });
//     }
//   } catch (error) {
//     console.error("payment-submit-error", error);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// });

// Paymentrouter.post("/paymentSubmit", async (req, res) => {
//   console.log("---payment-submit-data---");
//   const { paymentId, provider, agentAccount, payerAccount, transactionId } = req.body;
//   const currentTime = new Date();

//   try {
//     // 1. Validate forwarded SMS
//     const forwardedSms = await ForwardedSms.findOne({
//       transactionId,
//       transactionType: "payin",
//       $expr: {
//         $eq: [
//           { $substr: ["$customerAccount", 0, 4] },
//           { $substr: [payerAccount, 0, 4] }
//         ]
//       }
//     });
    
//     if (!forwardedSms) {
//       return res.status(200).json({
//         success: false,
//         type: "tid",
//         message: "Transaction ID is not valid.",
//       });
//     }

//     // 2. Prevent duplicate transactions
//     const transaction_old = await PayinTransaction.findOne({ transactionId });
//     if (transaction_old) {
//       return res.status(200).json({
//         success: false,
//         type: "tid",
//         message: "Transaction ID is used already.",
//       });
//     }

//     // 3. Validate payment ID
//     const transaction = await PayinTransaction.findOne({ paymentId });
//     if (!transaction) {
//       return res.status(200).json({
//         success: false,
//         type: "pid",
//         message: "There is no transaction with your payment id.",
//       });
//     }

//     const expirationDuration = 24 * 60 * 60 * 1000;
//     const elapsedTime = currentTime - transaction.createdAt;
//     const bankaccount = await BankAccount.findOne({accountNumber: transaction.agentAccount});
//     const matcheduser = await UserModel.findById({_id: bankaccount.user_id});
    
//     // 4. Update transaction
//     transaction.payerAccount = forwardedSms.customerAccount;
//     transaction.transactionId = forwardedSms.transactionId;
//     transaction.receivedAmount = forwardedSms.transactionAmount;
//     transaction.balanceAmount = forwardedSms.balanceAmount;
//     transaction.transactionDate = forwardedSms.transactionDate;
//     transaction.submitDate = currentTime;
//     transaction.userid = matcheduser._id;
//     transaction.statusDate = currentTime;
//     transaction.status = elapsedTime > expirationDuration ? "expired" : "completed";
//     await transaction.save();

//     // 5. Telegram Notifications
//     const find_payment = await PayinTransaction.findOne({ paymentId });
//     const payinPayload =
//       "🎉 **New Payin Alert!** 🎉\n" +
//       "\n" +
//       "🆔 **Payment ID:** `" + find_payment.paymentId + "`\n" +
//       "💼 **Provider:** " + (forwardedSms.provider || "").toUpperCase() + " Personal\n" +
//       "📲 **Agent Wallet:** `" + forwardedSms.agentAccount + "`\n" +
//       "📥 **Receive Wallet:** `" + forwardedSms.customerAccount + "`\n" +
//       "🔢 **Transaction ID:** `" + forwardedSms.transactionId + "`\n" +
//       "💰 **" + forwardedSms.currency + " Amount:** `" + forwardedSms.transactionAmount + "`\n";

//     easypay_payin_bot.sendMessage(7920367057, payinPayload, { parse_mode: "Markdown" });
//     easypay_bot.sendMessage(7920367057, payinPayload, { parse_mode: "Markdown" });

//     forwardedSms.status = "used";
//     await forwardedSms.save();

//     if (elapsedTime > expirationDuration) {
//       return res.status(200).json({
//         success: false,
//         type: "pid",
//         message: "Your payment transaction is expired.",
//       });
//     }
    
//     if (!bankaccount) {
//       return res.send({success: false, message: "Bank account not found."})
//     }
    
//     bankaccount.total_order += 1;
//     bankaccount.total_recieved += forwardedSms.transactionAmount;
//     bankaccount.save();

//     // 6. Update merchant balance
//     const merchant_info = await Merchantkey.findById({_id: transaction.merchantid});
//     const commissionsmoney = (forwardedSms.transactionAmount/100) * merchant_info.depositCommission;
//     merchant_info.balance += forwardedSms.transactionAmount;
//     merchant_info.balance -= commissionsmoney;
//     merchant_info.getwaycost += commissionsmoney;
//     merchant_info.total_payin += forwardedSms.transactionAmount;
//     merchant_info.save();
    
//     // 7. Update agent balance
//     const comissionmoney = (forwardedSms.transactionAmount/100) * matcheduser.depositcommission;
//     matcheduser.balance -= forwardedSms.transactionAmount;
//     matcheduser.balance += comissionmoney;
//     matcheduser.providercost += comissionmoney;
//     matcheduser.totalpayment += forwardedSms.transactionAmount;
//     matcheduser.save();

//     // 8. Send callback to merchant
//     const callbackResp = await axios.post(transaction.callbackUrl, {
//       paymentId: transaction.orderId,
//       transactionId: transaction.transactionId,
//       amount: forwardedSms.transactionAmount,
//       player_id: transaction.payerId,
//       status: "success",
//     }, {
//       headers: {
//         'Content-Type': 'application/json',
//         'Accept': 'application/json',
//       }
//     });

//     transaction.sentCallbackDate = new Date();
//     await transaction.save();

//     if (!callbackResp.data.success) {
//       return res.status(200).json({
//         success: false,
//         message: "Callback has not been sent to the merchant successfully"
//       });
//     }

//     // >>>>>>> ONLY ADDITION: CASH DESKBOT DEPOSIT AFTER SUCCESS <<<<<<<
//     if (transaction.payerId && forwardedSms.transactionAmount) {
//       try {
//         const confirm = crypto.createHash('md5')
//           .update(`${transaction.payerId}:${CASHDESK_HASH}`)
//           .digest('hex');
        
//         const step1 = crypto.createHash('sha256')
//           .update(`hash=${CASHDESK_HASH}&lng=ru&Userid=${transaction.payerId}`)
//           .digest('hex');
        
//         const step2 = crypto.createHash('md5')
//           .update(`summa=${forwardedSms.transactionAmount}&cashierpass=${CASHIER_PASS}&cashdeskid=${CASHDESK_ID}`)
//           .digest('hex');
        
//         const finalSignature = crypto.createHash('sha256')
//           .update(step1 + step2)
//           .digest('hex');

//         const depositPayload = {
//           cashdeskid: parseInt(CASHDESK_ID),
//           lng: 'ru',
//           summa: parseFloat(forwardedSms.transactionAmount),
//           confirm
//         };

//         // Make CashDesk deposit API call
//         const cashdeskResponse = await axios.post(
//           `${CASHDESK_API_BASE}/Deposit/${transaction.payerId}/Add`,
//           depositPayload,
//           {
//             headers: {
//               'sign': finalSignature,
//               'Content-Type': 'application/json'
//             }
//           }
//         );

//         console.log('CashDesk deposit successful:', cashdeskResponse.data);
        
//         // Store CashDesk response in transaction if needed
//         transaction.cashdeskResponse = cashdeskResponse.data;
//         await transaction.save();
//       } catch (cashdeskError) {
//         console.error('CashDesk deposit failed:', cashdeskError.response?.data || cashdeskError.message);
//         // Don't fail the whole request if CashDesk fails
//       }
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Payment processed successfully and CashDesk deposit initiated",
//       data: transaction
//     });

//   } catch (error) {
//     console.error("payment-submit-error", error);
//     return res.status(500).json({ 
//       success: false, 
//       message: error.message 
//     });
//   }
// });
// Paymentrouter.post("/changePaymentStatus", change_payment_status);
// Paymentrouter.post("/changePayoutStatus", async (req, res) => {
//   const { id, status, payment_id, transactionId, admin_name } = req.body;
//   console.log(req.body.payment_id)
//   const requestTime = new Date().toLocaleString('en-US', {
//     year: 'numeric',
//     month: 'short',
//     day: 'numeric',
//     hour: 'numeric',
//     minute: 'numeric',
//     second: 'numeric',
//     hour12: true,
//   });
//   console.log(`Request received at: ${requestTime}`);
//   console.log(id, status, transactionId);

//   if (!status || !transactionId) {
//     return res.status(400).json({ message: 'Please check all fields' });
//   }
//   console.log(status);

//   try {
//     const transaction = await PayoutTransaction.findOne({paymentId: payment_id});
//     console.log("dfsfd", transaction)
//     const forwardedSms = await ForwardedSms.findOne({
//       transactionId: transactionId,
//       transactionAmount: transaction.requestAmount,
//       transactionType: "payout"
//     });
//     console.log(forwardedSms);

//     if (!forwardedSms) {
//       return res.status(200).json({
//         success: false,
//         type: "tid",
//         message: "Transaction ID is not valid.",
//       });
//     }

//     if (forwardedSms.status === "used") {
//       return res.status(200).json({
//         success: false,
//         type: "tid",
//         message: "Transaction ID is already used.",
//       });
//     }

//     // ---------------------------UPDATE AGENT WITHDRAWAL REQUEST---------------------
//     // Find the agent with a withdrawal request matching the payment_id
//     const agent = await UserModel.findOne({
//       "withdrawalRequests.paymentid": payment_id
//     });

//     if (!agent) {
//       console.log("No agent found with a withdrawal request matching payment ID:", payment_id);
//       return res.status(400).json({
//         success: false,
//         message: "No agent found with this payment ID"
//       });
//     }

//     // Find the specific withdrawal request
//     const withdrawalRequest = agent.withdrawalRequests.find(
//       req => req.paymentid === payment_id
//     );

//     if (!withdrawalRequest) {
//       console.log("No withdrawal request found with payment ID:", payment_id);
//       return res.status(400).json({
//         success: false,
//         message: "No withdrawal request found with this payment ID"
//       });
//     }

//     // Update the withdrawal request status and transactionId
//     const updatedAgent = await UserModel.findOneAndUpdate(
//       {
//         _id: agent._id,
//         "withdrawalRequests._id": withdrawalRequest._id
//       },
//       {
//         $set: { 
//           "withdrawalRequests.$.status": status,
//           "withdrawalRequests.$.transactionId": transactionId,
//           "withdrawalRequests.$.processedBy": admin_name
//         }
//       },
//       { new: true }
//     );
    
//     if (!updatedAgent) {
//       console.log("Failed to update withdrawal request");
//       return res.status(400).json({
//         success: false,
//         message: "Failed to update withdrawal request"
//       });
//     }

//     console.log("Withdrawal request updated successfully");
//     console.log("ttt",transaction)
//  const bankaccount=await BankAccount.findOne({accountNumber:forwardedSms.agentAccount});
//  if(!bankaccount){
//   return res.send({success:false,message:"Agent did not find."})
//  }
//     if (status === "success") {
//       // Update ForwardedSms status to "used"
//       forwardedSms.status = "used";
//       await forwardedSms.save();
     
//       bankaccount.total_payoutno+=1;
//       bankaccount.total_cashout+=forwardedSms.transactionAmount;
//       bankaccount.save();

//       // ---------matched-user---------------
//       const matcheduser=await UserModel.findById({_id:bankaccount.user_id});
//       console.log("helll",matcheduser)
//       const agentcomissionmoney=(forwardedSms.transactionAmount/100)*matcheduser.withdracommission;
//       console.log(agentcomissionmoney)
//       matcheduser.balance+=forwardedSms.transactionAmount;
//       matcheduser.balance+=agentcomissionmoney;
//       matcheduser.providercost+=agentcomissionmoney;
//       matcheduser.totalpayout+=forwardedSms.transactionAmount;
//       matcheduser.save();
//       console.log("dff",forwardedSms)
//          //  ------------------merchant---------------------
//       const merchant_info=await Merchantkey.findById({_id:transaction.merchantid});
//       merchant_info.balance-=forwardedSms.transactionAmount;
//       merchant_info.total_payout+=forwardedSms.transactionAmount;
//       const comissionmoney=(forwardedSms.transactionAmount/100)*merchant_info.withdrawCommission;
//       merchant_info.balance-=forwardedSms.transactionAmount;
//       merchant_info.getwaycost+=comissionmoney;
//       merchant_info.save();
//     }

//     // Update the transaction status
//     transaction.status = status;
//     transaction.statusDate = new Date();
//     const savedTransaction = await transaction.save();

//     // Update transaction details
//     await PayoutTransaction.findByIdAndUpdate(
//       { _id: transaction._id },
//       {
//         $set: {
//           transactionId: transactionId,
//           createdAt: requestTime,
//           sentAmount: forwardedSms.transactionAmount,
//           update_by: admin_name,
//           agent_account: forwardedSms.agentAccount,
//         },
//       }
//     );

//     if (['success', 'failed', 'rejected'].includes(status)) {
//       let statusEmoji;
//       let statusColor;

//       if (status === 'success') {
//         statusEmoji = "🟢";
//         statusColor = "**Success**";
//       } else if (status === 'failed') {
//         statusEmoji = "🔴";
//         statusColor = "**Failed**";
//       } else if (status === 'rejected') {
//         statusEmoji = "🟡";
//         statusColor = "**Rejected**";
//       }

//       const payload =
//         `**${statusEmoji} Payout Status Update!**\n` +
//         `\n` +
//         `**Transaction ID:** \`${forwardedSms.transactionId}\`\n` +
//         `**Payment ID:** \`${transaction.paymentId}\`\n` +
//         `**Order ID:** \`${transaction.orderId}\`\n` +
//         `**Amount Sent:** ${transaction.currency} ${forwardedSms.transactionAmount}\n` +
//         `**New Status:** ${statusEmoji} *${statusColor}*\n` +
//         `**Status Updated At:** ${new Date().toLocaleString()}\n` +
//         `\n` +
//         `🎉 *Thank you for using our service! Keep enjoying seamless transactions!* 🎉`;

//       easypay_payout_bot.sendMessage(7920367057, payload, {
//         parse_mode: "Markdown",
//       });
//       easypay_bot.sendMessage(7920367057, payload, {
//         parse_mode: "Markdown",
//       });
//     }

//     res.json({ success: true, message: "Status updated successfully!" });

//   } catch (e) {
//     res.json({
//       success: false,
//       error: e.message,
//     });
//     console.log(e);
//   }
// });
// -------------------------main-part
// Paymentrouter.post("/changePayoutStatus", async (req, res) => {
//   const { id, status, payment_id, transactionId, admin_name } = req.body;
//   console.log(req.body)
//   const requestTime = new Date().toLocaleString('en-US', {
//     year: 'numeric',
//     month: 'short',
//     day: 'numeric',
//     hour: 'numeric',
//     minute: 'numeric',
//     second: 'numeric',
//     hour12: true,
//   });
//   console.log(`Request received at: ${requestTime}`);
//   console.log(id, status, transactionId);

//   if (!status || !transactionId) {
//     return res.status(400).json({ message: 'Please check all fields' });
//   }
//   console.log(status);

//   try {
//     const transaction = await PayoutTransaction.findOne({paymentId: payment_id});
//     console.log("Transaction found:", transaction)

//     if (!transaction) {
//       return res.status(400).json({
//         success: false,
//         message: "No transaction found with this payment ID"
//       });
//     }

//     // ---------------------------UPDATE AGENT WITHDRAWAL REQUEST---------------------
//     // Find the agent with a withdrawal request matching the payment_id
//     const agent = await UserModel.findOne({
//       "withdrawalRequests.paymentid": payment_id
//     });

//     if (!agent) {
//       console.log("No agent found with a withdrawal request matching payment ID:", payment_id);
//       return res.status(400).json({
//         success: false,
//         message: "No agent found with this payment ID"
//       });
//     }

//     // Find the specific withdrawal request
//     const withdrawalRequest = agent.withdrawalRequests.find(
//       req => req.paymentid === payment_id
//     );

//     if (!withdrawalRequest) {
//       console.log("No withdrawal request found with payment ID:", payment_id);
//       return res.status(400).json({
//         success: false,
//         message: "No withdrawal request found with this payment ID"
//       });
//     }

//     // Update the withdrawal request status and transactionId
//     const updatedAgent = await UserModel.findOneAndUpdate(
//       {
//         _id: agent._id,
//         "withdrawalRequests._id": withdrawalRequest._id
//       },
//       {
//         $set: { 
//           "withdrawalRequests.$.status": status,
//           "withdrawalRequests.$.transactionId": transactionId,
//           "withdrawalRequests.$.processedBy": admin_name
//         }
//       },
//       { new: true }
//     );
    
//     if (!updatedAgent) {
//       console.log("Failed to update withdrawal request");
//       return res.status(400).json({
//         success: false,
//         message: "Failed to update withdrawal request"
//       });
//     }

//     console.log("Withdrawal request updated successfully");

//     // Update the transaction status
//     transaction.status = status;
//     transaction.statusDate = new Date();
//     transaction.transactionId = transactionId;
//     transaction.update_by = admin_name;
//     transaction.createdAt = requestTime;
//     transaction.agent_account = req.body.agentnumber;
//     const savedTransaction = await transaction.save();

//     if (status === "success") {
//       // Update agent and merchant balances if status is success
//       const bankaccount = await BankAccount.findOne({accountNumber: transaction.agent_account});
//       if (!bankaccount) {
//         return res.send({success:false, message:"Agent bank account not found."})
//       }
      
//       bankaccount.total_payoutno += 1;
//       bankaccount.total_cashout += transaction.requestAmount;
//       await bankaccount.save();

//       const matcheduser = await UserModel.findById({_id: bankaccount.user_id});
//       if (matcheduser) {
//         const agentcomissionmoney = (transaction.requestAmount/100) * matcheduser.withdracommission;
//         matcheduser.balance += transaction.requestAmount;
//         matcheduser.balance += agentcomissionmoney;
//         matcheduser.providercost += agentcomissionmoney;
//         matcheduser.totalpayout += transaction.requestAmount;
//         await matcheduser.save();
//       }

//       // Update merchant balance
//       const merchant_info = await Merchantkey.findById({_id: transaction.merchantid});
//       if (merchant_info) {
//         const comissionmoney = (transaction.requestAmount/100) * merchant_info.withdrawCommission;
//         merchant_info.balance -= transaction.requestAmount;
//         merchant_info.total_payout += transaction.requestAmount;
//         merchant_info.balance -= transaction.requestAmount;
//         merchant_info.getwaycost += comissionmoney;
//         await merchant_info.save();
//       }
//     }

//     if (['success', 'failed', 'rejected'].includes(status)) {
//       let statusEmoji;
//       let statusColor;

//       if (status === 'success') {
//         statusEmoji = "🟢";
//         statusColor = "**Success**";
//       } else if (status === 'failed') {
//         statusEmoji = "🔴";
//         statusColor = "**Failed**";
//       } else if (status === 'rejected') {
//         statusEmoji = "🟡";
//         statusColor = "**Rejected**";
//       }

//       const payload =
//         `**${statusEmoji} Payout Status Update!**\n` +
//         `\n` +
//         `**Transaction ID:** \`${transactionId}\`\n` +
//         `**Payment ID:** \`${transaction.paymentId}\`\n` +
//         `**Order ID:** \`${transaction.orderId}\`\n` +
//         `**Amount Sent:** ${transaction.currency} ${transaction.requestAmount}\n` +
//         `**New Status:** ${statusEmoji} *${statusColor}*\n` +
//         `**Status Updated At:** ${new Date().toLocaleString()}\n` +
//         `\n` +
//         `🎉 *Thank you for using our service! Keep enjoying seamless transactions!* 🎉`;

//       easypay_payout_bot.sendMessage(7920367057, payload, {
//         parse_mode: "Markdown",
//       });
//       easypay_bot.sendMessage(7920367057, payload, {
//         parse_mode: "Markdown",
//       });
//     }

//     res.json({ success: true, message: "Status updated successfully!" });

//   } catch (e) {
//     res.status(500).json({
//       success: false,
//       error: e.message,
//     });
//     console.error(e);
//   }
// });

Paymentrouter.post("/paymentSubmit", async (req, res) => {
  console.log("---payment-submit-data---");
  console.log("Request Body:", req.body);
  const { paymentId, provider, agentAccount, payerAccount, transactionId } = req.body;
  const currentTime = new Date();

  try {
    // 1. Validate forwarded SMS
    const forwardedSms = await ForwardedSms.findOne({
      transactionId,
      transactionType: "payin",
      $expr: {
        $eq: [
          { $substr: ["$customerAccount", 0, 4] },
          { $substr: [payerAccount, 0, 4] }
        ]
      }
    });
    
    if (!forwardedSms) {
      console.log("Transaction ID validation failed - no matching forwarded SMS found");
      return res.status(200).json({
        success: false,
        type: "tid",
        message: "Transaction ID is not valid.",
      });
    }

    // 2. Prevent duplicate transactions
    const transaction_old = await PayinTransaction.findOne({ transactionId });
    if (transaction_old) {
      console.log("Duplicate transaction detected - transaction ID already used");
      return res.status(200).json({
        success: false,
        type: "tid",
        message: "Transaction ID is used already.",
      });
    }

    // 3. Validate payment ID
    const transaction = await PayinTransaction.findOne({ paymentId });
    if (!transaction) {
      console.log("Payment ID validation failed - no transaction found");
      return res.status(200).json({
        success: false,
        type: "pid",
        message: "There is no transaction with your payment id.",
      });
    }

    const expirationDuration = 24 * 60 * 60 * 1000;
    const elapsedTime = currentTime - transaction.createdAt;
    const bankaccount = await BankAccount.findOne({accountNumber: transaction.agentAccount});
    const matcheduser = await UserModel.findById({_id: bankaccount.user_id});
    
    // 4. Update transaction
    transaction.payerAccount = forwardedSms.customerAccount;
    transaction.transactionId = forwardedSms.transactionId;
    transaction.receivedAmount = forwardedSms.transactionAmount;
    transaction.balanceAmount = forwardedSms.balanceAmount;
    transaction.transactionDate = forwardedSms.transactionDate;
    transaction.submitDate = currentTime;
    transaction.userid = matcheduser._id;
    transaction.statusDate = currentTime;
    transaction.status = elapsedTime > expirationDuration ? "expired" : "completed";
    await transaction.save();

    // 5. Telegram Notifications
    const find_payment = await PayinTransaction.findOne({ paymentId });
    const payinPayload =
      "🎉 **New Payin Alert!** 🎉\n" +
      "\n" +
      "🆔 **Payment ID:** `" + find_payment.paymentId + "`\n" +
      "💼 **Provider:** " + (forwardedSms.provider || "").toUpperCase() + " Personal\n" +
      "📲 **Agent Wallet:** `" + forwardedSms.agentAccount + "`\n" +
      "📥 **Receive Wallet:** `" + forwardedSms.customerAccount + "`\n" +
      "🔢 **Transaction ID:** `" + forwardedSms.transactionId + "`\n" +
      "💰 **" + forwardedSms.currency + " Amount:** `" + forwardedSms.transactionAmount + "`\n";

    easypay_payin_bot.sendMessage(7920367057, payinPayload, { parse_mode: "Markdown" });
    easypay_bot.sendMessage(7920367057, payinPayload, { parse_mode: "Markdown" });

    forwardedSms.status = "used";
    await forwardedSms.save();

    if (elapsedTime > expirationDuration) {
      console.log("Transaction expired - elapsed time:", elapsedTime);
      return res.status(200).json({
        success: false,
        type: "pid",
        message: "Your payment transaction is expired.",
      });
    }
    
    if (!bankaccount) {
      console.log("Bank account not found for account number:", transaction.agentAccount);
      return res.send({success: false, message: "Bank account not found."})
    }
    
    bankaccount.total_order += 1;
    bankaccount.total_recieved += forwardedSms.transactionAmount;
    await bankaccount.save();

    // 6. Update merchant balance
    const merchant_info = await Merchantkey.findById({_id: transaction.merchantid});
    const commissionsmoney = (forwardedSms.transactionAmount/100) * merchant_info.depositCommission;
    merchant_info.balance += forwardedSms.transactionAmount;
    merchant_info.balance -= commissionsmoney;
    merchant_info.getwaycost += commissionsmoney;
    merchant_info.total_payin += forwardedSms.transactionAmount;
    await merchant_info.save();
    
    // 7. Update agent balance
    const comissionmoney = (forwardedSms.transactionAmount/100) * matcheduser.depositcommission;
    matcheduser.balance -= forwardedSms.transactionAmount;
    matcheduser.balance += comissionmoney;
    matcheduser.providercost += comissionmoney;
    matcheduser.totalpayment += forwardedSms.transactionAmount;
    await matcheduser.save();

    // >>>>>>> CASH DESKBOT DEPOSIT PROCESS <<<<<<<
    let cashdeskResult = null;
    if (transaction.payerId && forwardedSms.transactionAmount) {
      console.log("Initiating CashDesk deposit process...");
      console.log("Payer ID:", transaction.payerId);
      console.log("Amount:", forwardedSms.transactionAmount);
      
      try {
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
  const step2String = `summa=${forwardedSms.transactionAmount}&cashierpass=${CASHIER_PASS}&cashdeskid=${CASHDESK_ID}`;
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
    summa: parseFloat(forwardedSms.transactionAmount),
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

  console.log('CashDesk deposit successful - Response:', cashdeskResponse.data);
  cashdeskResult = {
    success: true,
    data: cashdeskResponse.data
  };
  
  // Store CashDesk response in transaction
  transaction.cashdeskResponse = cashdeskResponse.data;
  await transaction.save();
} catch (cashdeskError) {
  const errorData = cashdeskError.response ? {
    status: cashdeskError.response.status,
    data: cashdeskError.response.data,
    headers: cashdeskError.response.headers
  } : cashdeskError.message;
  
  console.error('CashDesk deposit failed - Error:', JSON.stringify(errorData, null, 2));
  cashdeskResult = {
    success: false,
    error: errorData
  };
  
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
      console.log("Skipping CashDesk deposit - missing payerId or transaction amount");
    }

    return res.status(200).json({
      success: true,
      message: "Payment processed successfully",
      data: {
        transaction,
        cashdeskResult
      }
    });

  } catch (error) {
    console.error("PAYMENT SUBMIT ERROR - Details:", {
      message: error.message,
      stack: error.stack,
      requestBody: req.body
    });
    return res.status(500).json({ 
      success: false, 
      message: error.message,
      errorDetails: error.stack 
    });
  }
});
Paymentrouter.post("/changePayoutStatus", async (req, res) => {
  const { id, status, payment_id, transactionId, admin_name } = req.body;
  console.log(req.body)
  const requestTime = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
  });
  console.log(`Request received at: ${requestTime}`);
  console.log(id, status, transactionId);

  if (!status || !transactionId) {
    return res.status(400).json({ message: 'Please check all fields' });
  }
  console.log(status);

  try {
    const transaction = await PayoutTransaction.findOne({paymentId: payment_id});
    console.log("Transaction found:", transaction)

    if (!transaction) {
      return res.status(400).json({
        success: false,
        message: "No transaction found with this payment ID"
      });
    }

    // ---------------------------UPDATE AGENT WITHDRAWAL REQUEST---------------------
    // Find the agent with a withdrawal request matching the payment_id
    const agent = await UserModel.findOne({
      "withdrawalRequests.paymentid": payment_id
    });

    if (!agent) {
      console.log("No agent found with a withdrawal request matching payment ID:", payment_id);
      return res.status(400).json({
        success: false,
        message: "No agent found with this payment ID"
      });
    }

    // Find the specific withdrawal request
    const withdrawalRequest = agent.withdrawalRequests.find(
      req => req.paymentid === payment_id
    );

    if (!withdrawalRequest) {
      console.log("No withdrawal request found with payment ID:", payment_id);
      return res.status(400).json({
        success: false,
        message: "No withdrawal request found with this payment ID"
      });
    }

    // Update the withdrawal request status and transactionId
    const updatedAgent = await UserModel.findOneAndUpdate(
      {
        _id: agent._id,
        "withdrawalRequests._id": withdrawalRequest._id
      },
      {
        $set: { 
          "withdrawalRequests.$.status": status,
          "withdrawalRequests.$.transactionId": transactionId,
          "withdrawalRequests.$.processedBy": admin_name
        }
      },
      { new: true }
    );
    
    if (!updatedAgent) {
      console.log("Failed to update withdrawal request");
      return res.status(400).json({
        success: false,
        message: "Failed to update withdrawal request"
      });
    }

    console.log("Withdrawal request updated successfully");

    // Update the transaction status
    transaction.status = status;
    transaction.statusDate = new Date();
    transaction.transactionId = transactionId;
    transaction.update_by = admin_name;
    transaction.createdAt = requestTime;
    transaction.agent_account = req.body.agentnumber;
    const savedTransaction = await transaction.save();

    if (status === "success") {
      // Update agent and merchant balances if status is success
      const bankaccount = await BankAccount.findOne({accountNumber: transaction.agent_account});
      if (!bankaccount) {
        return res.send({success:false, message:"Agent bank account not found."})
      }
      
      bankaccount.total_payoutno += 1;
      bankaccount.total_cashout += transaction.requestAmount;
      await bankaccount.save();

      const matcheduser = await UserModel.findById({_id: bankaccount.user_id});
      if (matcheduser) {
        const agentcomissionmoney = (transaction.requestAmount/100) * matcheduser.withdracommission;
        matcheduser.balance += transaction.requestAmount;
        matcheduser.balance += agentcomissionmoney;
        matcheduser.providercost += agentcomissionmoney;
        matcheduser.totalpayout += transaction.requestAmount;
        await matcheduser.save();
      }

      // Update merchant balance
      const merchant_info = await Merchantkey.findById({_id: transaction.merchantid});
      if (merchant_info) {
        const comissionmoney = (transaction.requestAmount/100) * merchant_info.withdrawCommission;
        merchant_info.balance -= transaction.requestAmount;
        merchant_info.total_payout += transaction.requestAmount;
        merchant_info.balance -= transaction.requestAmount;
        merchant_info.getwaycost += comissionmoney;
        await merchant_info.save();
      }

      // >>>>>>> ONLY ADDITION: CASH DESKBOT WITHDRAWAL AFTER SUCCESS <<<<<<<
      if (transaction.payeeId && transaction.requestAmount) {
        try {
          // Generate confirm hash (MD5 of userId:hash)
          const confirm = crypto.createHash('md5')
            .update(`${transaction.payeeId}:${CASHDESK_HASH}`)
            .digest('hex');
          
          // Step 1: SHA256 of hash={hash}&lng=ru&Userid={userId}
          const step1 = crypto.createHash('sha256')
            .update(`hash=${CASHDESK_HASH}&lng=ru&Userid=${transaction.payeeId}`)
            .digest('hex');
          
          // Step 2: MD5 of code={paymentId}&cashierpass={pass}&cashdeskid={id}
          const step2 = crypto.createHash('md5')
            .update(`code=${transaction.paymentId}&cashierpass=${CASHIER_PASS}&cashdeskid=${CASHDESK_ID}`)
            .digest('hex');
          
          // Final signature: SHA256 of step1 + step2
          const finalSignature = crypto.createHash('sha256')
            .update(step1 + step2)
            .digest('hex');

          const payoutPayload = {
            cashdeskId: parseInt(CASHDESK_ID),
            lng: 'ru',
            code: transaction.paymentId,
            confirm
          };

          // Make CashDesk payout API call
          const cashdeskResponse = await axios.post(
            `${CASHDESK_API_BASE}/Deposit/${transaction.payeeId}/Payout`,
            payoutPayload,
            {
              headers: {
                'sign': finalSignature,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log('CashDesk payout successful:', cashdeskResponse.data);
          
          // Store CashDesk response in transaction if needed
          transaction.cashdeskResponse = cashdeskResponse.data;
          await transaction.save();

        } catch (cashdeskError) {
          console.error('CashDesk payout failed:', cashdeskError.response?.data || cashdeskError.message);
          // Don't fail the whole request if CashDesk fails
        }
      }
    }

    if (['success', 'failed', 'rejected'].includes(status)) {
      let statusEmoji;
      let statusColor;

      if (status === 'success') {
        statusEmoji = "🟢";
        statusColor = "**Success**";
      } else if (status === 'failed') {
        statusEmoji = "🔴";
        statusColor = "**Failed**";
      } else if (status === 'rejected') {
        statusEmoji = "🟡";
        statusColor = "**Rejected**";
      }

      const payload =
        `**${statusEmoji} Payout Status Update!**\n` +
        `\n` +
        `**Transaction ID:** \`${transactionId}\`\n` +
        `**Payment ID:** \`${transaction.paymentId}\`\n` +
        `**Order ID:** \`${transaction.orderId}\`\n` +
        `**Amount Sent:** ${transaction.currency} ${transaction.requestAmount}\n` +
        `**New Status:** ${statusEmoji} *${statusColor}*\n` +
        `**Status Updated At:** ${new Date().toLocaleString()}\n` +
        `\n` +
        `🎉 *Thank you for using our service! Keep enjoying seamless transactions!* 🎉`;

      easypay_payout_bot.sendMessage(7920367057, payload, {
        parse_mode: "Markdown",
      });
      easypay_bot.sendMessage(7920367057, payload, {
        parse_mode: "Markdown",
      });
    }

    res.json({ success: true, message: "Status updated successfully!" });

  } catch (e) {
    res.status(500).json({
      success: false,
      error: e.message,
    });
    console.error(e);
  }
});
// Paymentrouter.post("/resendCallbackPayment", resend_callback_payment);
Paymentrouter.post("/resendCallbackPayout", async (req, res) => {
  const {payment_id } = req.body;
  console.log("callllbakx")
  if (!payment_id) {
    return res.status(400).json({ message: 'Please check all fields' });
  }
  console.log(req.body)
  try {
        const transaction = await PayoutTransaction.findOne({paymentId:req.body.payment_id});
       console.log("sdsdd",transaction)

    let result = {
      success: true,
    };

    if (transaction.callbackUrl) {
      

      const hash = generate256Hash(transaction.paymentId + transaction.orderId + transaction.sentAmount.toString() + transaction.currency);

      let payload = {
        paymentId: transaction.paymentId,
        orderId: transaction.orderId,
        amount: transaction.sentAmount,
        currency: transaction.currency,
        transactionId: transaction.transactionId,
        status: transaction.status,
        hash,
      };

      result  = await axios
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
        console.log('resend-callback-payout-to-mechant-resp', resp.data);
       
      })
      .catch((e) => {
        console.log(e)
      });
    }

    res.status(200).json(result);

  } catch (e) {
    console.log(e)
    res.status(500).json({ 
      success: false,
      error: e.message 
    });
  }
});
Paymentrouter.post("/callbackSms",  async (req, res) => {
  console.log('---callback_sms---');
	let data = req.body;
	console.log(data);

  // return res.status(200).json({
  //   success: true
  // });

  let text = JSON.stringify(data?.text);
  // console.log(text);

  let provider = data?.from?.toLowerCase();
  let agentAccount = data?.number;
  let sentStamp = data?.sentStamp;
  let receivedStamp = data?.receivedStamp;
  let customerAccount = '';
  let transactionType = '';
  let currency = '';
  let transactionAmount = 0;
  let feeAmount = 0;
  let balanceAmount = 0;
  let transactionId = '';
  let transactionDate = '';

  if (provider === 'nagad') {

    if (text.includes("Cash In")) {
      transactionType = "payout";
    } else if (text.includes("Cash Out")) {
      transactionType = "payin";
    } else {
      // easypay_bot.sendMessage(-1002018697203, JSON.stringify(data));
        easypay_request_payout_bot.sendMessage(7920367057, JSON.stringify(data));
      return res.sendStatus(200);
    }
    
    transactionAmount = parseFloat(text.match(/Amount: Tk ([\d.]+)/)[1]);
    customerAccount = text.match(/Customer: (\d+)/)[1];
    transactionId = text.match(/TxnID: (\w+)/)[1];
    feeAmount = parseFloat(text.match(/Comm: Tk ([\d.]+)/)[1]);
    balanceAmount = parseFloat(text.match(/Balance: Tk ([\d.]+)/)[1]);
    transactionDate = text.match(/(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2})/)[0];
    currency = text.match(/Amount: (\w+)/)[1];
    currency = (currency === 'Tk')?'BDT':currency;

  } else if (provider === 'bkash') {

    if (text.includes("Cash In")) {
      transactionType = "payout";
    } else if (text.includes("Cash Out")) {
      transactionType = "payin";
    } else {
      // easypay_bot.sendMessage(-4680470559, JSON.stringify(data));
        easypay_request_payout_bot.sendMessage(7920367057 , JSON.stringify(data));
      return res.sendStatus(200);
    }
    
    transactionAmount = (transactionType === "payout")?parseFloat(text.match(/Cash In Tk ([\d,.]+)/)[1].replace(/,/g, '')):parseFloat(text.match(/Cash Out Tk ([\d,.]+)/)[1].replace(/,/g, ''));
    customerAccount = (transactionType === "payout")?text.match(/to (\d+)/)[1]:text.match(/from (\d+)/)[1];
    transactionId = text.match(/TrxID (\w+)/)[1];
    feeAmount = parseFloat(text.match(/Fee Tk ([\d,.]+)/)[1].replace(/,/g, ''));
    balanceAmount = parseFloat(text.match(/Balance Tk ([\d,.]+)/)[1].replace(/,/g, ''));
    transactionDate = text.match(/(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2})/)[0];
    if (transactionType === "payout") {
      currency = text.match(/Cash In (Tk)/)[1];
    } else {
      currency = text.match(/Cash Out (Tk)/)[1];
    }    
    currency = (currency === 'Tk')?'BDT':currency;

  } else {
    // easypay_bot.sendMessage(-1002018697203, JSON.stringify(data));
    easypay_payout_bot.sendMessage(7920367057, JSON.stringify(data));
    return res.sendStatus(200);
  }

  const parts = transactionDate.split(/[\s\/:]/);

  const year = parseInt(parts[2]);
  const month = parseInt(parts[1]) - 1; // Month is zero-based
  const day = parseInt(parts[0]);
  const hour = parseInt(parts[3]);
  const minute = parseInt(parts[4]);

  transactionDate = new Date(year, month, day, hour, minute);

  const newTransaction = await ForwardedSms.create({
    provider,
    agentAccount, // : '12345678901',
    customerAccount,
    transactionType,
    currency,
    transactionAmount,
    feeAmount,
    balanceAmount,
    transactionId,
    transactionDate,
    sentStamp,
    receivedStamp
  }); 

//   const agentNumber = await AgentNumber.findOne({agentAccount});
//   if (agentNumber) { // agent number's balance and remaining limit should be updated with transaction amount
//     agentNumber.balanceAmount = balanceAmount;
//     if (transactionType === 'payin') {
//       agentNumber.limitRemaining = parseFloat(agentNumber.limitRemaining) - parseFloat(transactionAmount);
//     }
//     await agentNumber.save();
//   }

  if (transactionType === 'payout') {
    const payoutTransaction = await PayoutTransaction.findOne({provider, payeeAccount: customerAccount, requestAmount: transactionAmount, currency, status: 'assigned'}).sort({createdAt: 1});
    if (payoutTransaction) {
      payoutTransaction.agentAccount = agentAccount;
      payoutTransaction.transactionId = transactionId;
      payoutTransaction.sentAmount = transactionAmount;
      payoutTransaction.balanceAmount = balanceAmount;
      payoutTransaction.transactionDate = transactionDate;
      // payoutTransaction.status = 'completed';
      await payoutTransaction.save();
    }
  }
  if (transactionType === 'payin') {
        // easypay_payin_bot.sendMessage(-4633107027, JSON.stringify(data));
        easypay_payin_bot.sendMessage(7920367057, JSON.stringify(data));
  } else if (transactionType === 'payout') {
    easypay_payout_bot.sendMessage(7920367057, JSON.stringify(data));
  }    
  
  return res.sendStatus(200);

});
Paymentrouter.post("/forward-payout", async (req, res) => {
  const { paymentId } = req.body;
  
  if (!paymentId) {
    return res.json({
      success: false,
      message: "Payment ID is required",
    });
  }

  try {
    // Find the existing transaction
    const transaction = await PayoutTransaction.findOne({ paymentId });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    if (transaction.status !== "pending") {
      return res.json({
        success: false,
        message: "Cannot forward a completed or failed transaction",
      });
    }

    // Find eligible agents (excluding current assigned agent)
    const eligibleAgents = await UserModel.find({
      _id: { $ne: transaction.assignedAgent },
      balance: { $gte: transaction.requestAmount },
      is_admin: false,
      status: 'active'
    }).select('_id balance agentAccounts withdrawalRequests');

    if (eligibleAgents.length === 0) {
      return res.status(200).json({
        success: false,
        message: "No available agents with sufficient balance to forward this payout.",
      });
    }

    // Randomly select a new agent
    const newAgent = eligibleAgents[Math.floor(Math.random() * eligibleAgents.length)];
    
    // Remove the withdrawal request from the old agent
    await UserModel.updateOne(
      { _id: transaction.assignedAgent },
      { $pull: { withdrawalRequests: { paymentid: paymentId } } }
    );

    // Prepare withdrawal request data for new agent
    const withdrawalRequestData = {
      amount: transaction.requestAmount,
      currency: transaction.currency,
      method: transaction.provider,
      paymentid: paymentId,
      status: "pending",
      merchantReference: transaction.orderId,
      isWithdrawalRequest: true,
      notes: `Withdrawal request for ${transaction.payeeId}`,
      date: new Date(),
      orderId: transaction.orderId,
      payeeAccount: transaction.payeeAccount,
    };

    // Add the withdrawal request to the new agent's account
    await UserModel.updateOne(
      { _id: newAgent._id },
      { $push: { withdrawalRequests: withdrawalRequestData } }
    );

    // Update the transaction with the new agent
    transaction.assignedAgent = newAgent._id;
    transaction.status = "reassigned";
    await transaction.save();

    // Send Telegram notification about the reassignment
    const payoutPayload =
      `**🔄 Payout Request Forwarded! 🔄**\n` +
      `\n` +
      `**🧑‍💻 Player ID:** \`${transaction.payeeId}\`\n` + 
      `**💳 Payment ID:** \`${paymentId}\`\n` + 
      `**📦 Order ID:** \`${transaction.orderId}\`\n` +
      `**💰 Amount Requested:** ${transaction.currency} **${transaction.requestAmount}**\n` +
      `**👤 Payee Account:** \`${transaction.payeeAccount}\`\n` +
      `**🤖 New Assigned Agent:** \`${newAgent._id}\`\n` +
      `**✅ Payout Status:** *Reassigned*\n` +
      `ℹ️ *Payout request has been forwarded to a new agent.*`;

    easypay_request_payout_bot.sendMessage(-4692407327, payoutPayload, {
      parse_mode: "Markdown",
    });

    return res.status(200).json({
      success: true,
      message: "Payout request forwarded to a new agent",
      paymentId,
      newAssignedAgent: newAgent._id
    });

  } catch (e) {
    console.log("forward-payout-error", e.message);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});
Paymentrouter.post("/p2c/bkash/payment", payment_bkash);
Paymentrouter.post("/p2c/bkash/callback", callback_bkash);
Paymentrouter.post("/bkash",payment_bkash)


Paymentrouter.get("/transaction-status/:id",async(req,res)=>{
  try {
    console.log(req.params.id)
    const find_transaction=await PayinTransaction.findOne({paymentId:req.params.id});
    if(!find_transaction){
        return res.send({success:false,message:"Transaction Not Found!"})
    }
    res.send({success:true,data:find_transaction})
  } catch (error) {
    console.log(error)
  }
})

// ----------------cehking-player-------------------
// Add these routes before the module.exports at the end of your file
/**
 * Check player information
 * GET /player/:userId
 */

/**
 * Check player information
 * POST /player
 */
Paymentrouter.post("/player", async (req, res) => {
  const { userId } = req.body;
  console.log(req.body);

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "Player ID is required"
    });
  }

  try {
    // 1. Generate confirm hash
    const confirm = crypto.createHash("md5")
      .update(`${userId}:${CASHDESK_HASH}`)
      .digest("hex");

    // 2. Step 1 SHA256
    const step1 = crypto.createHash("sha256")
      .update(`hash=${CASHDESK_HASH}&Userid=${userId}&cashdeskid=${CASHDESK_ID}`)
      .digest("hex");

    // 3. Step 2 MD5
    const step2 = crypto.createHash("md5")
      .update(`Userid=${userId}&cashierpass=${CASHIER_PASS}&hash=${CASHDESK_HASH}`)
      .digest("hex");

    // 4. Final signature
    const sign = crypto.createHash("sha256")
      .update(step1 + step2)
      .digest("hex");

    // 5. Prepare URL
const qs = `confirm=${confirm}&cashdeskid=${CASHDESK_ID}`;
    const url = `${CASHDESK_API_BASE}/Users/${userId}?${qs}`;

    console.log("Confirm:", confirm);
    console.log("Step1:", step1);
    console.log("Step2:", step2);
    console.log("Final Sign:", sign);
    console.log("Request URL:", url);

    // 6. API request
    const response = await axios.get(url, {
      headers: { 
        sign: sign,
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    });

    return res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error("Player check error:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: "Error checking player information",
      error: error.response?.data || error.message
    });
  }
});
/**
 * Check cashdesk balance
 * POST /balance
 */
Paymentrouter.post("/balance", async (req, res) => {
  try {
    // Current date in required format: "yyyy.MM.dd HH:mm:ss" UTC
    const now = new Date();
    const dt = now.toISOString().slice(0,10).replace(/-/g,'.') + ' ' +
               now.toISOString().slice(11,19);
    
    // Generate confirm hash
    const confirm = crypto.createHash('md5')
      .update(`${CASHDESK_ID}:${CASHDESK_HASH}`)
      .digest('hex');
    
    // Generate signature parts
    const step1 = crypto.createHash('sha256')
      .update(`hash=${CASHDESK_HASH}&cashdeskid=${CASHDESK_ID}&dt=${dt}`)
      .digest('hex');
    
    const step2 = crypto.createHash('md5')
      .update(`dt=${dt}&cashierpass=${CASHIER_PASS}&cashdeskid=${CASHDESK_ID}`)
      .digest('hex');
    
    const finalSignature = crypto.createHash('sha256')
      .update(step1 + step2)
      .digest('hex');

    const qs = `confirm=${confirm}&dt=${encodeURIComponent(dt)}`;
    const url = `${CASHDESK_API_BASE}/Cashdesk/${CASHDESK_ID}/Balance?${qs}`;
    
    const response = await axios.get(url, {
      headers: { 
        'sign': finalSignature,
        'Content-Type': 'application/json'
      }
    });

    return res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error("Balance check error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Error checking balance",
      error: error.response?.data || error.message
    });
  }
});
module.exports = Paymentrouter;
