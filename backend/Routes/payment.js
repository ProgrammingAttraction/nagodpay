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
const BankDeposit = require('../Models/BankDeposit');
const NagadFreeDeposit = require('../Models/NagadFreeDeposit');
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
// wokring payout------
// Paymentrouter.post("/payout", async (req, res) => {
//   const { payeeId, paymentId, amount } = req.body;
//   console.log("Payout request received:", req.body);

//   if (!payeeId || !paymentId) {
//     return res.status(400).json({
//       success: false,
//       message: "Missing required fields (payeeId or paymentId)."
//     });
//   }

//   try {
//     const existcode = await PayoutTransaction.findOne({ paymentId });
//     if (existcode) {
//       return res.send({ success: false, message: "Already withdrawal code used!" });
//     }

//     // 1. Generate confirm hash (MD5 of "payeeId:CASHDESK_HASH")
//     const confirmString = `${payeeId}:${CASHDESK_HASH}`;
//     const confirm = crypto.createHash('md5').update(confirmString).digest('hex');

//     // 2. Generate step1 hash (SHA256 of query string)
//     const step1String = `hash=${CASHDESK_HASH}&lng=ru&userid=${payeeId}`;
//     const step1 = crypto.createHash('sha256').update(step1String).digest('hex');

//     // 3. Generate step2 hash (MD5 of parameters)
//     const step2String = `code=${paymentId}&cashierpass=${CASHIER_PASS}&cashdeskid=${CASHDESK_ID}`;
//     const step2 = crypto.createHash('md5').update(step2String).digest('hex');

//     // 4. Final signature
//     const finalSignature = crypto.createHash('sha256').update(step1 + step2).digest('hex');

//     // 5. Prepare payload
//     const payoutPayload = {
//       cashdeskid: parseInt(CASHDESK_ID),
//       lng: 'ru',
//       code: paymentId,
//       confirm: confirm
//     };

//     // 6. Call CashDeskBot API
//     const cashdeskResponse = await axios.post(
//       `${CASHDESK_API_BASE}/Deposit/${payeeId}/Payout`,
//       payoutPayload,
//       {
//         headers: {
//           'sign': finalSignature,
//           'Content-Type': 'application/json'
//         },
//         timeout: 10000
//       }
//     );

//     console.log("CashDesk response:", cashdeskResponse.data);

//     // Handle API response - UPDATED VALIDATION
//     if (cashdeskResponse.data && 
//         cashdeskResponse.data.Success === true && 
//         cashdeskResponse.data.Summa < 0) {
      
//       const paidOutAmount = Math.abs(cashdeskResponse.data.Summa); // Convert negative to positive

//       // Validate if the paid out amount matches the requested amount (optional)
//       if (amount && paidOutAmount !== parseFloat(amount)) {
//         console.warn(`Warning: Requested amount (${amount}) differs from paid out amount (${paidOutAmount})`);
//       }

//       // Save successful payout transaction
//       const newPayoutTransaction = new PayoutTransaction({
//         paymentId,
//         orderId: req.body.orderId || `ORD-${Date.now()}`,
//         payeeId,
//         payeeAccount: req.body.payeeAccount,
//         callbackUrl: req.body.callbackUrl,
//         requestAmount: paidOutAmount,
//         currency: req.body.currency || 'BDT',
//         provider: "CashDeskBot",
//         status: "pending",
//         statusHistory: [{
//           status: "completed",
//           changedAt: new Date(),
//           changedBy: "system",
//           notes: `Payout successful. Amount: ${paidOutAmount}`
//         }],
//         withdrawalDetails: {
//           providerSpecific: cashdeskResponse.data,
//           actualPayoutAmount: paidOutAmount,
//           originalResponseAmount: cashdeskResponse.data.Summa
//         },
//         mode: req.body.mode || "live",
//         merchantid: req.body.merchantid || "",
//         update_by: req.body.update_by || "",
//         auditLog: [{
//           action: "Payout Completed",
//           performedBy: "system",
//           performedAt: new Date(),
//           details: {
//             payoutPayload,
//             cashdeskResponse: cashdeskResponse.data
//           }
//         }]
//       });

//       await newPayoutTransaction.save();

//       // If callback URL is provided, send success notification
//       if (req.body.callbackUrl) {
//         try {
//           await axios.post(req.body.callbackUrl, {
//             success: true,
//             paymentId,
//             orderId: newPayoutTransaction.orderId,
//             amount: paidOutAmount,
//             status: "completed",
//             timestamp: new Date().toISOString()
//           });
//         } catch (callbackError) {
//           console.error("Callback notification failed:", callbackError.message);
//         }
//       }

//       return res.status(200).json({
//         success: true,
//         message: `Payout request successfully processed. Amount ${paidOutAmount} withdrawn.`,
//         response: cashdeskResponse.data,
//         payoutAmount: paidOutAmount
//       });

//     } else {
//       // Handle cases where CashDeskBot returns success: false or invalid amount
//       let errorMessage = "CashDeskBot rejected payout";
      
//       if (cashdeskResponse.data && cashdeskResponse.data.Success === true && cashdeskResponse.data.Summa >= 0) {
//         errorMessage = `Invalid payout amount: ${cashdeskResponse.data.Summa}. Expected negative value for withdrawal.`;
//       } else if (cashdeskResponse.data && cashdeskResponse.data.Message) {
//         errorMessage = cashdeskResponse.data.Message;
//       }

//       // Save failed payout attempt for auditing
//       const failedPayoutTransaction = new PayoutTransaction({
//         paymentId,
//         orderId: req.body.orderId || `ORD-${Date.now()}`,
//         payeeId,
//         payeeAccount: req.body.payeeAccount,
//         callbackUrl: req.body.callbackUrl,
//         requestAmount: amount,
//         currency: req.body.currency || 'BDT',
//         provider: "CashDeskBot",
//         status: "failed",
//         statusHistory: [{
//           status: "failed",
//           changedAt: new Date(),
//           changedBy: "system",
//           notes: errorMessage
//         }],
//         withdrawalDetails: {
//           providerSpecific: cashdeskResponse.data || {},
//           failureReason: errorMessage
//         },
//         mode: req.body.mode || "live",
//         merchantid: req.body.merchantid || "",
//         update_by: req.body.update_by || "",
//         auditLog: [{
//           action: "Payout Failed",
//           performedBy: "system",
//           performedAt: new Date(),
//           details: {
//             payoutPayload,
//             cashdeskResponse: cashdeskResponse.data || {},
//             error: errorMessage
//           }
//         }]
//       });

//       await failedPayoutTransaction.save();

//       return res.status(400).json({
//         success: false,
//         message: errorMessage,
//         response: cashdeskResponse.data
//       });
//     }
//   } catch (e) {
//     console.error("Error during payout process:", e.message);

//     // Save error case for auditing
//     const errorPayoutTransaction = new PayoutTransaction({
//       paymentId,
//       orderId: req.body.orderId || `ORD-${Date.now()}`,
//       payeeId,
//       payeeAccount: req.body.payeeAccount,
//       callbackUrl: req.body.callbackUrl,
//       requestAmount: amount,
//       currency: req.body.currency || 'BDT',
//       provider: "CashDeskBot",
//       status: "error",
//       statusHistory: [{
//         status: "error",
//         changedAt: new Date(),
//         changedBy: "system",
//         notes: `System error: ${e.message}`
//       }],
//       mode: req.body.mode || "live",
//       merchantid: req.body.merchantid || "",
//       update_by: req.body.update_by || "",
//       auditLog: [{
//         action: "Payout Error",
//         performedBy: "system",
//         performedAt: new Date(),
//         details: {
//           error: e.message,
//           response: e.response?.data || {}
//         }
//       }]
//     });

//     await errorPayoutTransaction.save();

//     if (e.response) {
//       console.error("CashDeskBot error:", e.response.data);
//       return res.status(500).json({
//         success: false,
//         message: "CashDeskBot API error occurred",
//         errorDetails: e.response.data
//       });
//     }

//     return res.status(500).json({
//       success: false,
//       message: "Internal server error during payout request",
//       errorDetails: e.message
//     });
//   }
// });
Paymentrouter.post("/payout", async (req, res) => {
  const { payeeId, paymentId, amount,payeeAccount} = req.body;
  console.log("Payout request received:", req.body);

  if (!payeeId || !paymentId) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields (payeeId or paymentId)."
    });
  }

  try {
    const existcode = await PayoutTransaction.findOne({ paymentId });
    if (existcode) {
      return res.send({ success: false, message: "Already withdrawal code used!" });
    }

    // 1. Generate confirm hash (MD5 of "payeeId:CASHDESK_HASH")
    const confirmString = `${payeeId}:${CASHDESK_HASH}`;
    const confirm = crypto.createHash('md5').update(confirmString).digest('hex');

    // 2. Generate step1 hash (SHA256 of query string)
    const step1String = `hash=${CASHDESK_HASH}&lng=ru&userid=${payeeId}`;
    const step1 = crypto.createHash('sha256').update(step1String).digest('hex');

    // 3. Generate step2 hash (MD5 of parameters)
    const step2String = `code=${paymentId}&cashierpass=${CASHIER_PASS}&cashdeskid=${CASHDESK_ID}`;
    const step2 = crypto.createHash('md5').update(step2String).digest('hex');

    // 4. Final signature
    const finalSignature = crypto.createHash('sha256').update(step1 + step2).digest('hex');

    // 5. Prepare payload
    const payoutPayload = {
      cashdeskid: parseInt(CASHDESK_ID),
      lng: 'ru',
      code: paymentId,
      confirm: confirm
    };

    // 6. Call CashDeskBot API
    const cashdeskResponse = await axios.post(
      `${CASHDESK_API_BASE}/Deposit/${payeeId}/Payout`,
      payoutPayload,
      {
        headers: {
          'sign': finalSignature,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log("CashDesk response:", cashdeskResponse.data);

    // Handle API response - UPDATED VALIDATION
    if (cashdeskResponse.data && 
        cashdeskResponse.data.Success === true && 
        cashdeskResponse.data.Summa < 0) {
      
      const paidOutAmount = Math.abs(cashdeskResponse.data.Summa); // Convert negative to positive

      // Validate if the paid out amount matches the requested amount (optional)
      if (amount && paidOutAmount !== parseFloat(amount)) {
        console.warn(`Warning: Requested amount (${amount}) differs from paid out amount (${paidOutAmount})`);
      }

      // Find all agent users with balance >= payout amount
      const eligibleAgents = await UserModel.find({
        is_admin: false,
        status: 'active',
        currentstatus: "online",
        'agentAccounts.0': { $exists: true }, // Has at least one agent account
      }).select('_id balance agentAccounts withdrawalRequests');

      if (eligibleAgents.length === 0) {
        return res.status(200).json({
          success: false,
          orderId: req.body.orderId,
          message: "No available agents with sufficient balance to process this payout.",
        });
      }

      // Randomly select an agent
      const randomAgent = eligibleAgents[Math.floor(Math.random() * eligibleAgents.length)];
      
      // Prepare withdrawal request data for agent
      const withdrawalRequestData = {
        amount: paidOutAmount,
        currency: req.body.currency || 'BDT',
        method: "CashDeskBot",
        paymentid: paymentId,
        status: "pending",
        merchantReference: req.body.orderId || `ORD-${Date.now()}`,
        isWithdrawalRequest: true,
        notes: `Withdrawal request for ${payeeId}`,
        date: new Date(),
        orderId: req.body.orderId || `ORD-${Date.now()}`,
        payeeAccount: req.body.payeeAccount,
      };

      // Add the withdrawal request to the agent's account
      randomAgent.withdrawalRequests.push(withdrawalRequestData);
      await randomAgent.save();

      // Save successful payout transaction
      const newPayoutTransaction = new PayoutTransaction({
        paymentId,
        orderId: req.body.orderId || `ORD-${Date.now()}`,
        payeeId,
        payeeAccount: req.body.payeeAccount,
        callbackUrl: req.body.callbackUrl,
        requestAmount: paidOutAmount,
        currency: req.body.currency || 'BDT',
        provider: "CashDeskBot",
        status: "pending",
        assignedAgent: randomAgent._id, // Track which agent this was assigned to
        statusHistory: [{
          status: "completed",
          changedAt: new Date(),
          changedBy: "system",
          notes: `Payout successful. Amount: ${paidOutAmount}. Assigned to agent: ${randomAgent._id}`
        }],
        withdrawalDetails: {
          providerSpecific: cashdeskResponse.data,
          actualPayoutAmount: paidOutAmount,
          originalResponseAmount: cashdeskResponse.data.Summa
        },
        mode: req.body.mode || "live",
        merchantid: req.body.merchantid || "",
        update_by: req.body.update_by || "",
        auditLog: [{
          action: "Payout Completed",
          performedBy: "system",
          performedAt: new Date(),
          details: {
            payoutPayload,
            cashdeskResponse: cashdeskResponse.data,
            assignedAgent: randomAgent._id
          }
        }]
      });

      await newPayoutTransaction.save();

     

      // If callback URL is provided, send success notification
      if (req.body.callbackUrl) {
        try {
          await axios.post(req.body.callbackUrl, {
            success: true,
            paymentId,
            orderId: newPayoutTransaction.orderId,
            amount: paidOutAmount,
            status: "completed",
            timestamp: new Date().toISOString()
          });
        } catch (callbackError) {
          console.error("Callback notification failed:", callbackError.message);
        }
      }

      return res.status(200).json({
        success: true,
        message: `Payout request successfully processed. Amount ${paidOutAmount} withdrawn. Assigned to agent: ${randomAgent._id}`,
        response: cashdeskResponse.data,
        payoutAmount: paidOutAmount,
        assignedAgent: randomAgent._id
      });

    } else {
      // Handle cases where CashDeskBot returns success: false or invalid amount
      let errorMessage = "CashDeskBot rejected payout";
      
      if (cashdeskResponse.data && cashdeskResponse.data.Success === true && cashdeskResponse.data.Summa >= 0) {
        errorMessage = `Invalid payout amount: ${cashdeskResponse.data.Summa}. Expected negative value for withdrawal.`;
      } else if (cashdeskResponse.data && cashdeskResponse.data.Message) {
        errorMessage = cashdeskResponse.data.Message;
      }

      // Save failed payout attempt for auditing
      const failedPayoutTransaction = new PayoutTransaction({
        paymentId,
        orderId: req.body.orderId || `ORD-${Date.now()}`,
        payeeId,
        payeeAccount: req.body.payeeAccount,
        callbackUrl: req.body.callbackUrl,
        requestAmount: amount,
        currency: req.body.currency || 'BDT',
        provider: "CashDeskBot",
        status: "failed",
        statusHistory: [{
          status: "failed",
          changedAt: new Date(),
          changedBy: "system",
          notes: errorMessage
        }],
        withdrawalDetails: {
          providerSpecific: cashdeskResponse.data || {},
          failureReason: errorMessage
        },
        mode: req.body.mode || "live",
        merchantid: req.body.merchantid || "",
        update_by: req.body.update_by || "",
        auditLog: [{
          action: "Payout Failed",
          performedBy: "system",
          performedAt: new Date(),
          details: {
            payoutPayload,
            cashdeskResponse: cashdeskResponse.data || {},
            error: errorMessage
          }
        }]
      });

      await failedPayoutTransaction.save();

      return res.status(400).json({
        success: false,
        message: errorMessage,
        response: cashdeskResponse.data
      });
    }
  } catch (e) {
    console.error("Error during payout process:", e.message);

    // Save error case for auditing
    const errorPayoutTransaction = new PayoutTransaction({
      paymentId,
      orderId: req.body.orderId || `ORD-${Date.now()}`,
      payeeId,
      payeeAccount: req.body.payeeAccount,
      callbackUrl: req.body.callbackUrl,
      requestAmount: amount,
      currency: req.body.currency || 'BDT',
      provider: "CashDeskBot",
      status: "error",
      statusHistory: [{
        status: "error",
        changedAt: new Date(),
        changedBy: "system",
        notes: `System error: ${e.message}`
      }],
      mode: req.body.mode || "live",
      merchantid: req.body.merchantid || "",
      update_by: req.body.update_by || "",
      auditLog: [{
        action: "Payout Error",
        performedBy: "system",
        performedAt: new Date(),
        details: {
          error: e.message,
          response: e.response?.data || {}
        }
      }]
    });

    await errorPayoutTransaction.save();

    if (e.response) {
      console.error("CashDeskBot error:", e.response.data);
      return res.status(500).json({
        success: false,
        message: "CashDeskBot API error occurred",
        errorDetails: e.response.data
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error during payout request",
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

//       // >>>>>>> ONLY ADDITION: CASH DESKBOT WITHDRAWAL AFTER SUCCESS <<<<<<<
//       if (transaction.payeeId && transaction.requestAmount) {
//         try {
//           // Generate confirm hash (MD5 of userId:hash)
//           const confirm = crypto.createHash('md5')
//             .update(`${transaction.payeeId}:${CASHDESK_HASH}`)
//             .digest('hex');
          
//           // Step 1: SHA256 of hash={hash}&lng=ru&Userid={userId}
//           const step1 = crypto.createHash('sha256')
//             .update(`hash=${CASHDESK_HASH}&lng=ru&Userid=${transaction.payeeId}`)
//             .digest('hex');
          
//           // Step 2: MD5 of code={paymentId}&cashierpass={pass}&cashdeskid={id}
//           const step2 = crypto.createHash('md5')
//             .update(`code=${transaction.paymentId}&cashierpass=${CASHIER_PASS}&cashdeskid=${CASHDESK_ID}`)
//             .digest('hex');
          
//           // Final signature: SHA256 of step1 + step2
//           const finalSignature = crypto.createHash('sha256')
//             .update(step1 + step2)
//             .digest('hex');

//           const payoutPayload = {
//             cashdeskId: parseInt(CASHDESK_ID),
//             lng: 'ru',
//             code: transaction.paymentId,
//             confirm
//           };

//           // Make CashDesk payout API call
//           const cashdeskResponse = await axios.post(
//             `${CASHDESK_API_BASE}/Deposit/${transaction.payeeId}/Payout`,
//             payoutPayload,
//             {
//               headers: {
//                 'sign': finalSignature,
//                 'Content-Type': 'application/json'
//               }
//             }
//           );

//           console.log('CashDesk payout successful:', cashdeskResponse.data);
          
//           // Store CashDesk response in transaction if needed
//           transaction.cashdeskResponse = cashdeskResponse.data;
//           await transaction.save();

//         } catch (cashdeskError) {
//           console.error('CashDesk payout failed:', cashdeskError.response?.data || cashdeskError.message);
//           // Don't fail the whole request if CashDesk fails
//         }
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
// Paymentrouter.post("/resendCallbackPayment", resend_callback_payment);
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
    // --------------------------- New Code Block ---------------------------
    const bankaccount = await BankAccount.findOne({accountNumber: transaction.agent_account});
    if (!bankaccount) {
        return res.status(400).json({success: false, message: "Agent bank account not found."});
    }
    // --------------------------- End New Code Block ---------------------------

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


// Helper function to generate SHA256 hash
function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Helper function to generate MD5 hash
function md5(data) {
  return crypto.createHash('md5').update(data).digest('hex');
}

// Function to generate the 'sign' header
function makeSign(params1, params2) {
  const part1 = sha256(params1);
  const part2 = md5(params2);
  return sha256(part1 + part2);
}

// Function to generate the 'confirm' field (MD5 of "userId:hash")
function makeConfirm(id) {
  return md5(`${id}:${CASHDESK_HASH}`);
}

// Player search endpoint
// Player search endpoint (Directly using 1355931989 as the userId)
Paymentrouter.get("/player", async (req, res) => {
  const userId = '1355931989';  // Directly using the player ID
  const { cashdeskid = CASHDESK_ID, confirm } = req.query;

  console.log("Player search request:", { userId, cashdeskid, confirm });

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required"
    });
  }

  try {
    // Step 1: Compute the SHA256 hash for the string: hash={CASHDESK_HASH}&userId={userId}&cashdeskid={cashdeskid}
    const step1String = `hash=${CASHDESK_HASH}&userId=${userId}&cashdeskid=${cashdeskid}`;
    const step1Hash = sha256(step1String);

    // Step 2: Calculate the MD5 for the request parameters: userId={userId}&cashierpass={CASHIER_PASS}&hash={CASHDESK_HASH}
    const step2String = `userId=${userId}&cashierpass=${CASHIER_PASS}&hash=${CASHDESK_HASH}`;
    const step2Hash = md5(step2String);

    // Step 3: Compute the SHA256 hash for the combined strings from steps 1 and 2
    const finalSignatureString = step1Hash + step2Hash;
    const finalSignature = sha256(finalSignatureString);

    // Generate confirm hash if not provided in query
    const confirmHash = confirm || makeConfirm(userId);

    // Prepare query parameters
    const queryParams = new URLSearchParams({
      confirm: confirmHash,
      cashdeskid: cashdeskid
    }).toString();

    const url = `${CASHDESK_API_BASE}/Users/${userId}?${queryParams}`;

    // Make API request to CashDeskBot
    const response = await axios.get(url, {
      headers: {
        'sign': finalSignature,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    // Extract the required fields from the response
    const playerData = response.data;

    return res.json({
      success: true,
      data: {
        currencyId: playerData.currencyId || 0,
        userId: playerData.userId || parseInt(userId),
        name: playerData.name || "Unknown Player"
      }
    });

  } catch (error) {
    console.error("Player search error:", error.response?.data || error.message);

    // Handle different error scenarios
    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: "Player not found"
      });
    }

    if (error.response?.status === 401) {
      console.error("Authentication failed. Please verify the following credentials:");
      console.error("1. CASHDESK_HASH is correct:", CASHDESK_HASH);
      console.error("2. CASHIER_PASS is correct:", CASHIER_PASS);
      console.error("3. CASHDESK_ID is correct:", cashdeskid);
      console.error("4. The userId is valid:", userId);
    }

    if (error.response?.status === 403) {
      console.error("Error 403: Forbidden - Authentication or permission failure.");
      console.error("This error typically occurs when the server is rejecting the request due to invalid credentials or permissions.");
      console.error("Possible issues:");
      console.error("1. Incorrect `CASHDESK_HASH`.");
      console.error("2. Invalid `CASHIER_PASS`.");
      console.error("3. The `CASHDESK_ID` might not be authorized.");
      console.error("4. The API key or credentials used may not have the correct permissions.");
      console.error("5. Ensure that the user ID is correctly registered and has sufficient access rights.");
    }

    return res.status(error.response?.status || 500).json({
      success: false,
      message: "Error searching for player",
      error: error.response?.data || error.message
    });
  }
});
Paymentrouter.get("/balance", async (req, res) => {
  try {
    // Current date in required format: "yyyy.MM.dd HH:mm:ss" UTC
    const now = new Date();
    const dt = now.toISOString().slice(0,10).replace(/-/g,'.') + ' ' +
               now.toISOString().slice(11,19);
    
    console.log("Date string:", dt);

    // Generate confirm hash (MD5 of "cashdeskid:hash")
    const confirmString = `${CASHDESK_ID}:${CASHDESK_HASH}`;
    const confirm = md5(confirmString);
    console.log("Confirm string:", confirmString);
    console.log("Confirm hash:", confirm);

    // CORRECT SIGNATURE GENERATION FOR BALANCE ENDPOINT:
    
    // 1. SHA256 of "hash={hash}&cashdeskid={cashdeskid}&dt={dt}"
    const step1String = `hash=${CASHDESK_HASH}&cashdeskid=${CASHDESK_ID}&dt=${dt}`;
    const step1 = sha256(step1String);
    console.log("Step1 string:", step1String);
    console.log("Step1 hash:", step1);

    // 2. MD5 of "dt={dt}&cashierpass={cashierpass}&cashdeskid={cashdeskid}"
    const step2String = `dt=${dt}&cashierpass=${CASHIER_PASS}&cashdeskid=${CASHDESK_ID}`;
    const step2 = md5(step2String);
    console.log("Step2 string:", step2String);
    console.log("Step2 hash:", step2);

    // 3. Final signature (SHA256 of step1 + step2)
    const finalSignatureString = step1 + step2;
    const finalSignature = sha256(finalSignatureString);
    console.log("Final signature string:", finalSignatureString);
    console.log("Final signature:", finalSignature);

    // Prepare query parameters
    const queryParams = new URLSearchParams({
      confirm: confirm,
      dt: dt
    }).toString();
    
    const url = `${CASHDESK_API_BASE}/Cashdesk/${CASHDESK_ID}/Balance?${queryParams}`;
    console.log("Request URL:", url);

    // Make API request
    const response = await axios.get(url, {
      headers: { 
        'sign': finalSignature,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    return res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error("Balance check error:", error.response?.data || error.message);
    
    // Additional troubleshooting
    if (error.response?.status === 401) {
      console.error("Authentication failed. Please verify:");
      console.error("1. CASHDESK_HASH:", CASHDESK_HASH);
      console.error("2. CASHIER_PASS:", CASHIER_PASS);
      console.error("3. CASHDESK_ID:", CASHDESK_ID);
      
      // Debug info
      console.log("=== DEBUG INFO ===");
      const now = new Date();
      const dt = now.toISOString().slice(0,10).replace(/-/g,'.') + ' ' + now.toISOString().slice(11,19);
      console.log("DT:", dt);
      console.log("Step 1 string:", `hash=${CASHDESK_HASH}&cashdeskid=${CASHDESK_ID}&dt=${dt}`);
      console.log("Step 2 string:", `dt=${dt}&cashierpass=${CASHIER_PASS}&cashdeskid=${CASHDESK_ID}`);
      console.log("Confirm string:", `${CASHDESK_ID}:${CASHDESK_HASH}`);
    }

    return res.status(error.response?.status || 500).json({
      success: false,
      message: "Error checking balance",
      error: error.response?.data || error.message
    });
  }
});
// Bank deposit route
Paymentrouter.post('/bank-deposit', async (req, res) => {
  try {
    const {
      playerId,
      amount,
      accountNumber,
      bankName,
      provider,
      orderId,
      currency = 'BDT'
    } = req.body;
 console.log(req.body)
    const apiKey = req.headers['x-api-key'];
    
    // Validate required fields
    if (!playerId || !amount || !accountNumber || !bankName || !provider || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: playerId, amount, accountNumber, bankName, provider, orderId'
      });
    }

    // Validate amount
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }

    // Find merchant
    const merchant = await Merchantkey.findOne({ apiKey });
    if (!merchant) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    // Check if orderId already exists
    const existingDeposit = await BankDeposit.findOne({ orderId });
    if (existingDeposit) {
      return res.status(400).json({
        success: false,
        message: 'Order ID already exists'
      });
    }

    // Find all agent users with active status, online status, and matching provider in paymentMethod
    const eligibleAgents = await UserModel.find({
      is_admin: false,
      status: 'active',
      currentstatus: "online",
      paymentMethod: bankName, // Only agents with the specific provider in their payment methods
      'agentAccounts.0': { $exists: true }, // Has at least one agent account
    }).select('_id username name balance agentAccounts bankTransferDeposits paymentMethod');

    if (eligibleAgents.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No available agents with ${provider} payment method to process this deposit.`,
      });
    }

    // Randomly select an agent
    const randomAgent = eligibleAgents[Math.floor(Math.random() * eligibleAgents.length)];
    
    // Create new bank deposit data
    const bankDepositData = {
      playerId,
      amount: parseFloat(amount),
      accountNumber,
      bankName,
      orderId,
      currency,
      provider,
      merchantid: merchant._id,
      status: 'pending'
    };

    // Save to BankDeposit model
    const bankDeposit = new BankDeposit(bankDepositData);
    await bankDeposit.save();

    // Also save to the user's bankTransferDeposits array
    randomAgent.bankTransferDeposits.push(bankDepositData);
    await randomAgent.save();

    res.status(201).json({
      success: true,
      message: 'Bank deposit request created successfully',
      data: {
        depositId: bankDeposit._id,
        orderId: bankDeposit.orderId,
        status: bankDeposit.status,
        amount: bankDeposit.amount,
        currency: bankDeposit.currency,
        provider: bankDeposit.provider,
        assignedAgent: {
          id: randomAgent._id,
          username: randomAgent.username,
          name: randomAgent.name
        },
        createdAt: bankDeposit.createdAt
      }
    });

  } catch (error) {
    console.error('Bank deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get all bank deposits with optional filtering
Paymentrouter.get('/bank-deposits', async (req, res) => {
  try {
    const {
      status,
      playerId,
      provider,
      bankName,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (playerId) filter.playerId = playerId;
    if (provider) filter.provider = provider;
    if (bankName) filter.bankName = bankName;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get deposits with filtering and pagination
    const deposits = await BankDeposit.find(filter)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await BankDeposit.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: deposits,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('Get bank deposits error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get single bank deposit by ID
Paymentrouter.get('/bank-deposits/:id', async (req, res) => {
  try {
    const deposit = await BankDeposit.findById(req.params.id);
    
    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Bank deposit not found'
      });
    }

    res.json({
      success: true,
      data: deposit
    });

  } catch (error) {
    console.error('Get bank deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Change bank deposit status
Paymentrouter.patch('/bank-deposits/:id/status', async (req, res) => {
  try {
    const { status, transactionId, referenceNumber, metadata } = req.body;
    const { id } = req.params;

    // Validate status
    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const deposit = await BankDeposit.findById(id);
    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Bank deposit not found'
      });
    }

    // Prepare update object
    const updateData = {
      status,
      statusDate: new Date()
    };

    if (transactionId) updateData.transactionId = transactionId;
    if (referenceNumber) updateData.referenceNumber = referenceNumber;
    if (metadata) updateData.metadata = metadata;

    // If status is being changed to completed, process CashDeskBot deposit
    if (status === 'completed' && deposit.status !== 'completed') {
      try {
        // Generate confirm hash (MD5 of "playerId:CASHDESK_HASH")
        const confirmString = `${deposit.playerId}:${CASHDESK_HASH}`;
        const confirm = crypto.createHash('md5').update(confirmString).digest('hex');
        
        // Generate step1 hash (SHA256 of query string)
        const step1String = `hash=${CASHDESK_HASH}&lng=ru&userid=${deposit.playerId}`;
        const step1 = crypto.createHash('sha256').update(step1String).digest('hex');
        
        // Generate step2 hash (MD5 of parameters)
        const step2String = `summa=${deposit.amount}&cashierpass=${CASHIER_PASS}&cashdeskid=${CASHDESK_ID}`;
        const step2 = crypto.createHash('md5').update(step2String).digest('hex');
        
        // Final signature (SHA256 of step1 + step2)
        const finalSignatureString = step1 + step2;
        const finalSignature = crypto.createHash('sha256').update(finalSignatureString).digest('hex');

        // Prepare deposit payload
        const depositPayload = {
          cashdeskid: parseInt(CASHDESK_ID),
          lng: 'ru',
          summa: parseFloat(deposit.amount),
          confirm
        };

        // Make CashDeskBot API call
        const cashdeskResponse = await axios.post(
          `${CASHDESK_API_BASE}/Deposit/${deposit.playerId}/Add`,
          depositPayload,
          {
            headers: {
              'sign': finalSignature,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        console.log('CashDesk deposit successful:', cashdeskResponse.data);
        
        // Store CashDesk response
        updateData.cashdeskResponse = cashdeskResponse.data;
        updateData.cashdeskProcessed = true;

      } catch (cashdeskError) {
        console.error('CashDesk deposit failed:', cashdeskError.response?.data || cashdeskError.message);
        
        // If CashDesk fails, don't complete the deposit
        return res.status(500).json({
          success: false,
          message: 'CashDesk deposit failed. Deposit not completed.',
          error: cashdeskError.response?.data || cashdeskError.message
        });
      }
    }

    // Update the deposit
    const updatedDeposit = await BankDeposit.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Bank deposit status updated successfully',
      data: updatedDeposit
    });

  } catch (error) {
    console.error('Update bank deposit status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Delete bank deposit
Paymentrouter.delete('/bank-deposits/:id', async (req, res) => {
  try {
    const deposit = await BankDeposit.findById(req.params.id);
    
    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Bank deposit not found'
      });
    }

    // Prevent deletion of completed deposits
    if (deposit.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete completed deposits'
      });
    }

    await BankDeposit.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Bank deposit deleted successfully'
    });

  } catch (error) {
    console.error('Delete bank deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// POST route to find eligible Nagad Free agent (auto-find)
Paymentrouter.post("/find-nagad-free-agent-auto", async (req, res) => {
    try {
        const { amount = 0 } = req.body;
        const provider = "Nagad Free";
        const expectedAmount = Number(amount || 0);
        const requiredBalance = 50000 + expectedAmount;
        
        console.log(`Auto-finding Nagad Free agent with balance >= ${requiredBalance}`);

        // Find eligible users with sufficient balance and active Nagad Free accounts
        const eligibleUsers = await UserModel.aggregate([
            {
                $match: {
                    balance: { $gte: requiredBalance },
                    status: 'active',
                    paymentMethod: { $in: [provider] },
                    "agentAccounts.status": "active",
                    "agentAccounts.provider": provider
                }
            },
            {
                $addFields: {
                    activeAccounts: {
                        $filter: {
                            input: "$agentAccounts",
                            as: "account",
                            cond: {
                                $and: [
                                    { $eq: ["$$account.status", "active"] },
                                    { $eq: ["$$account.provider", provider] }
                                ]
                            }
                        }
                    }
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
                    name: 1,
                    balance: 1,
                    status: 1,
                    currentstatus: 1,
                    depositcommission: 1,
                    activeAccounts: 1
                }
            }
        ]);

        if (eligibleUsers.length === 0) {
            return res.status(404).send({
                success: false,
                message: `No eligible Nagad Free agents found with balance >= ${requiredBalance}`
            });
        }

        // Select a random user with weights based on their balance
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

        // Select a random active account
        const selectedAccount = selectedAgent.activeAccounts[
            Math.floor(Math.random() * selectedAgent.activeAccounts.length)
        ];

        return res.status(200).send({
            success: true,
            message: "Nagad Free agent found successfully",
            agent: {
                id: selectedAgent._id,
                username: selectedAgent.username,
                name: selectedAgent.name,
                balance: selectedAgent.balance,
                depositCommission: selectedAgent.depositcommission
            },
            nagadAccount: {
                provider: selectedAccount.provider,
                accountNumber: selectedAccount.accountNumber,
                shopName: selectedAccount.shopName,
                accountType: selectedAccount.walletType || "Regular"
            }
        });

    } catch (error) {
        console.error("Auto-find Nagad Free agent error:", error);
        return res.status(500).send({
            success: false,
            message: "An error occurred while finding Nagad Free agent",
            error: error.message
        });
    }
});

// POST route to find eligible Bank agent (auto-find)
Paymentrouter.post("/find-bank-agent-auto", async (req, res) => {
    try {
        const { amount = 0, provider } = req.body;
        const expectedAmount = Number(amount || 0);
        const requiredBalance = 50000 + expectedAmount;
        
        console.log(`Auto-finding ${provider} agent with balance >= ${requiredBalance}`);

        // Find eligible users with sufficient balance and active bank accounts
        const eligibleUsers = await UserModel.aggregate([
            {
                $match: {
                    balance: { $gte: requiredBalance },
                    status: 'active',
                    paymentMethod: { $in: [provider] },
                    "agentAccounts.status": "active",
                    "agentAccounts.provider": provider
                }
            },
            {
                $addFields: {
                    activeAccounts: {
                        $filter: {
                            input: "$agentAccounts",
                            as: "account",
                            cond: {
                                $and: [
                                    { $eq: ["$$account.status", "active"] },
                                    { $eq: ["$$account.provider", provider] }
                                ]
                            }
                        }
                    }
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
                    name: 1,
                    balance: 1,
                    status: 1,
                    currentstatus: 1,
                    activeAccounts: 1
                }
            }
        ]);

        if (eligibleUsers.length === 0) {
            return res.status(404).send({
                success: false,
                message: `No eligible ${provider} agents found with balance >= ${requiredBalance}`
            });
        }

        // Select a random user with weights based on their balance
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

        // Select a random active account
        const selectedAccount = selectedAgent.activeAccounts[
            Math.floor(Math.random() * selectedAgent.activeAccounts.length)
        ];

        return res.status(200).send({
            success: true,
            message: `${provider} agent found successfully`,
            agent: {
                id: selectedAgent._id,
                username: selectedAgent.username,
                name: selectedAgent.name,
                balance: selectedAgent.balance
            },
            bankAccount: {
                provider: selectedAccount.provider,
                accountNumber: selectedAccount.accountNumber,
                shopName: selectedAccount.shopName
            }
        });

    } catch (error) {
        console.error("Auto-find bank agent error:", error);
        return res.status(500).send({
            success: false,
            message: "An error occurred while finding bank agent",
            error: error.message
        });
    }
});

// Create Nagad Free deposit
Paymentrouter.post('/nagad-free-deposit', async (req, res) => {
  try {
    const {
      playerId,
      amount,
      accountNumber,
      orderId,
      currency = 'BDT'
    } = req.body;

    const apiKey = req.headers['x-api-key'];
    
    // Validate required fields
    if (!playerId || !amount || !accountNumber || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: playerId, amount, accountNumber, orderId'
      });
    }

    // Validate amount
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }

    // Validate account number (Nagad specific validation)
    if (!/^01[3-9]\d{8}$/.test(accountNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Nagad account number format'
      });
    }

    // Find merchant
    const merchant = await Merchantkey.findOne({ apiKey });
    if (!merchant) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    // Check if orderId already exists
    const existingDeposit = await NagadFreeDeposit.findOne({ orderId });
    if (existingDeposit) {
      return res.status(400).json({
        success: false,
        message: 'Order ID already exists'
      });
    }

    // Find all agent users with active status, online status, and "Nagad Free" in paymentMethod
    const eligibleAgents = await UserModel.find({
      is_admin: false,
      status: 'active',
      currentstatus: "online",
      paymentMethod: "Nagad Free", // Only agents with Nagad Free in their payment methods
      'agentAccounts.0': { $exists: true }, // Has at least one agent account
    }).select('_id username name balance agentAccounts nagadFreeDeposits paymentMethod');

    if (eligibleAgents.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No available agents with Nagad Free payment method to process this deposit.",
      });
    }

    // Randomly select an agent
    const randomAgent = eligibleAgents[Math.floor(Math.random() * eligibleAgents.length)];
    
    // Create new Nagad Free deposit data
    const nagadFreeDepositData = {
      playerId,
      amount: parseFloat(amount),
      accountNumber,
      orderId,
      currency,
      merchantid: merchant._id,
      status: 'pending',
      statusDate: new Date()
    };

    // Save to NagadFreeDeposit model
    const nagadFreeDeposit = new NagadFreeDeposit(nagadFreeDepositData);
    await nagadFreeDeposit.save();

    // Also save to the user's nagadFreeDeposits array
    randomAgent.nagadFreeDeposits.push(nagadFreeDepositData);
    await randomAgent.save();

    res.status(201).json({
      success: true,
      message: 'Nagad Free deposit request created successfully',
      data: {
        depositId: nagadFreeDeposit._id,
        orderId: nagadFreeDeposit.orderId,
        status: nagadFreeDeposit.status,
        amount: nagadFreeDeposit.amount,
        currency: nagadFreeDeposit.currency,
        assignedAgent: {
          id: randomAgent._id,
          username: randomAgent.username,
          name: randomAgent.name
        },
        createdAt: nagadFreeDeposit.createdAt
      }
    });

  } catch (error) {
    console.error('Nagad Free deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get all Nagad Free deposits
Paymentrouter.get('/nagad-free-deposits', async (req, res) => {
  try {
    // Get deposits with filtering and pagination
    const deposits = await NagadFreeDeposit.find({})
      .sort({createdAt:-1})
    res.json({
      success: true,
      data: deposits,
    });

  } catch (error) {
    console.error('Get Nagad Free deposits error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get single Nagad Free deposit
Paymentrouter.get('/nagad-free-deposits/:id', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const merchant = await Merchantkey.findOne({ apiKey });

    if (!merchant) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    const deposit = await NagadFreeDeposit.findOne({
      _id: req.params.id,
      merchantid: merchant._id
    }).populate('merchantid', 'merchantName email');
    
    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Nagad Free deposit not found'
      });
    }

    res.json({
      success: true,
      data: deposit
    });

  } catch (error) {
    console.error('Get Nagad Free deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update Nagad Free deposit status
Paymentrouter.patch('/nagad-free-deposits/:id/status', async (req, res) => {
  try {
    const { status, transactionId, referenceNumber, metadata } = req.body;
    const { id } = req.params;
    const apiKey = req.headers['x-api-key'];

    const merchant = await Merchantkey.findOne({ apiKey });
    if (!merchant) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    // Validate status
    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const deposit = await NagadFreeDeposit.findOne({
      _id: id,
      merchantid: merchant._id
    });

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Nagad Free deposit not found'
      });
    }

    // Prepare update object
    const updateData = {
      status,
      statusDate: new Date()
    };

    if (transactionId) updateData.transactionId = transactionId;
    if (referenceNumber) updateData.referenceNumber = referenceNumber;
    if (metadata) updateData.metadata = metadata;

    // If status is being changed to completed, process CashDeskBot deposit
    if (status === 'completed' && deposit.status !== 'completed') {
      try {
        // Generate confirm hash (MD5 of "playerId:CASHDESK_HASH")
        const confirmString = `${deposit.playerId}:${CASHDESK_HASH}`;
        const confirm = crypto.createHash('md5').update(confirmString).digest('hex');
        
        // Generate step1 hash (SHA256 of query string)
        const step1String = `hash=${CASHDESK_HASH}&lng=ru&userid=${deposit.playerId}`;
        const step1 = crypto.createHash('sha256').update(step1String).digest('hex');
        
        // Generate step2 hash (MD5 of parameters)
        const step2String = `summa=${deposit.amount}&cashierpass=${CASHIER_PASS}&cashdeskid=${CASHDESK_ID}`;
        const step2 = crypto.createHash('md5').update(step2String).digest('hex');
        
        // Final signature (SHA256 of step1 + step2)
        const finalSignatureString = step1 + step2;
        const finalSignature = crypto.createHash('sha256').update(finalSignatureString).digest('hex');

        // Prepare deposit payload
        const depositPayload = {
          cashdeskid: parseInt(CASHDESK_ID),
          lng: 'ru',
          summa: parseFloat(deposit.amount),
          confirm
        };

        // Make CashDeskBot API call
        const cashdeskResponse = await axios.post(
          `${CASHDESK_API_BASE}/Deposit/${deposit.playerId}/Add`,
          depositPayload,
          {
            headers: {
              'sign': finalSignature,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );

        console.log('CashDesk deposit successful:', cashdeskResponse.data);
        
        // Store CashDesk response
        updateData.cashdeskResponse = cashdeskResponse.data;
        updateData.cashdeskProcessed = true;

        // Update merchant balance
        const commissionsmoney = (deposit.amount / 100) * merchant.depositCommission;
        merchant.balance += deposit.amount;
        merchant.balance -= commissionsmoney;
        merchant.getwaycost += commissionsmoney;
        merchant.total_payin += deposit.amount;
        await merchant.save();

      } catch (cashdeskError) {
        console.error('CashDesk deposit failed:', cashdeskError.response?.data || cashdeskError.message);
        
        // If CashDesk fails, don't complete the deposit
        return res.status(500).json({
          success: false,
          message: 'CashDesk deposit failed. Deposit not completed.',
          error: cashdeskError.response?.data || cashdeskError.message
        });
      }
    }

    // Update the deposit
    const updatedDeposit = await NagadFreeDeposit.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('merchantid', 'merchantName email');

    // Send Telegram notification for status change
    if (status !== deposit.status) {
      let statusEmoji = '';
      switch(status) {
        case 'completed': statusEmoji = '✅'; break;
        case 'failed': statusEmoji = '❌'; break;
        case 'processing': statusEmoji = '🔄'; break;
        case 'cancelled': statusEmoji = '🚫'; break;
        default: statusEmoji = '⏳';
      }

      const telegramPayload = 
        `📊 **Nagad Free Deposit Update** 📊\n` +
        `\n` +
        `🆔 **Order ID:** \`${deposit.orderId}\`\n` +
        `👤 **Player ID:** \`${deposit.playerId}\`\n` +
        `💰 **Amount:** ${deposit.currency} ${deposit.amount}\n` +
        `📱 **Nagad Account:** \`${deposit.accountNumber}\`\n` +
        `🔄 **Status:** ${statusEmoji} ${status.charAt(0).toUpperCase() + status.slice(1)}\n` +
        `⏰ **Updated:** ${new Date().toLocaleString()}`;

      easypay_payin_bot.sendMessage(7920367057, telegramPayload, { parse_mode: "Markdown" });
    }

    res.json({
      success: true,
      message: 'Nagad Free deposit status updated successfully',
      data: updatedDeposit
    });

  } catch (error) {
    console.error('Update Nagad Free deposit status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get Nagad Free deposit statistics
Paymentrouter.get('/nagad-free-deposits/stats', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    const merchant = await Merchantkey.findOne({ apiKey });

    if (!merchant) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    const stats = await NagadFreeDeposit.getStats(merchant._id);
    
    const totalStats = {
      total: 0,
      completed: 0,
      pending: 0,
      failed: 0,
      processing: 0,
      cancelled: 0,
      totalAmount: 0,
      completedAmount: 0
    };

    stats.forEach(stat => {
      totalStats[stat._id] = stat.count;
      totalStats.total += stat.count;
      totalStats.totalAmount += stat.totalAmount;
      
      if (stat._id === 'completed') {
        totalStats.completedAmount = stat.totalAmount;
      }
    });

    res.json({
      success: true,
      data: totalStats
    });

  } catch (error) {
    console.error('Get Nagad Free deposit stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = Paymentrouter;
