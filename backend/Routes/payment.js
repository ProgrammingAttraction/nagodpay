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
const PaymentMethod = require('../Models/PaymentMethod');
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
Paymentrouter.post("/payout", async (req, res) => {
  const { payeeId, paymentId,payeeAccount} = req.body;
  console.log("Payout request received:", req.body);

  if (!payeeId || !paymentId) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields (payeeId or paymentId)."
    });
  }

  try {
    
      // Find all agent users with balance >= payout amount
      const eligibleAgents = await UserModel.find({
        is_admin: false,
        status: 'active',
        currentstatus: "online",
        'agentAccounts.0': { $exists: true }, // Has at least one agent account
      }).select('_id balance agentAccounts withdrawalRequests');
 
      if (eligibleAgents.length === 0) {
        return res.send({
          success: false,
          orderId: req.body.orderId,
          message: "No available agents with sufficient balance to process this payout.",
        });
      }
      
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
      // if (paidOutAmount !== parseFloat(amount)) {
      //   console.warn(`Warning: Requested amount (${amount}) differs from paid out amount (${paidOutAmount})`);
      // }


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
        
        // 2. Map provider to provider_name
        let provider_name;
        if (match_payment.provider === 'bkash') {
            provider_name = 'Bkash P2P';
        } else if (match_payment.provider === 'nagad') {
            provider_name = 'Nagad P2P';
        } else if (match_payment.provider === 'rocket') {
            provider_name = 'Rocket P2P';
        } else if (match_payment.provider === 'upay') {
            provider_name = 'Upay P2P';
        } else {
            console.log(`Unsupported provider: ${match_payment.provider}`);
            return res.status(400).send({ success: false, message: "Unsupported payment provider" });
        }

        console.log("Looking for provider:", provider_name);

        // 3. Find eligible users with sufficient balance (50000 + expectedAmount) and active agent accounts
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

        // 4. Select a random user with weights based on their balance
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

        // 5. Select a random active account
        const selectedAccount = selectedAgent.activeAccounts[
            Math.floor(Math.random() * selectedAgent.activeAccounts.length)
        ];

        console.log("Selected Bank Account:", {
            provider: selectedAccount.provider,
            accountNumber: selectedAccount.accountNumber,
            shopName: selectedAccount.shopName
        });

        // 6. Update payment transaction with agent account
        match_payment.agentAccount = selectedAccount.accountNumber;
        await match_payment.save();
        
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

    // 5. Telegram Notifications (with error handling)
    try {
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
    } catch (telegramError) {
      console.error("Telegram notification failed:", telegramError.message);
      // Continue processing even if Telegram fails
    }

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
    let cashdeskError = null;
    
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

        console.log('CashDesk deposit response:', cashdeskResponse.data);
        
        // Store CashDesk response in transaction
        transaction.cashdeskResponse = cashdeskResponse.data;
        await transaction.save();
        
        // Check if CashDesk operation was successful based on response format
        if (cashdeskResponse.data && cashdeskResponse.data.Success === true) {
          console.log('CashDesk deposit successful');
          cashdeskResult = {
            success: true,
            data: cashdeskResponse.data
          };
        } else {
          console.log('CashDesk deposit failed according to response');
          cashdeskResult = {
            success: false,
            data: cashdeskResponse.data
          };
          
          // Update transaction status to "rejected" if CashDesk fails
          transaction.status = "rejected";
          transaction.statusDate = new Date();
          await transaction.save();
          
          cashdeskError = {
            message: cashdeskResponse.data.Message || "CashDesk deposit failed",
            details: cashdeskResponse.data,
            statusCode: 200 // CashDesk returns 200 even for failed operations
          };
        }
      } catch (error) {
        const errorData = error.response ? {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        } : error.message;
        
        console.error('CashDesk API call failed - Error:', JSON.stringify(errorData, null, 2));
        cashdeskResult = {
          success: false,
          error: errorData
        };
        
        // Store error in transaction
        transaction.cashdeskError = errorData;
        
        // Update transaction status to "rejected" if CashDesk fails
        transaction.status = "rejected";
        transaction.statusDate = new Date();
        await transaction.save();
        
        // Additional troubleshooting for 401/403 errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.error("Authentication failed. Please verify:");
          console.error("1. CASHDESK_HASH is correct:", CASHDESK_HASH);
          console.error("2. CASHIER_PASS is correct:", CASHIER_PASS);
          console.error("3. CASHDESK_ID is correct:", CASHDESK_ID);
          console.error("4. Payer ID is valid:", transaction.payerId);
          
          // For 403 errors, it's likely a player ID mismatch
          if (error.response?.status === 403) {
            console.error("5. Player ID mismatch detected - the provided payerId may not exist or belong to a different system");
          }
        }
        
        // Set the error to be returned to frontend
        cashdeskError = {
          message: "CashDesk API call failed",
          details: errorData,
          statusCode: error.response?.status
        };
      }
    } else {
      console.log("Skipping CashDesk deposit - missing payerId or transaction amount");
      cashdeskResult = {
        success: false,
        error: "Missing payerId or transaction amount"
      };
      
      // Update transaction status to "rejected" if CashDesk is skipped due to missing data
      transaction.status = "rejected";
      transaction.statusDate = new Date();
      await transaction.save();
      
      cashdeskError = {
        message: "Player ID not found!",
        details: "Missing payerId or transaction amount",
        statusCode: 400
      };
    }

    // Return response to frontend based on CashDesk result
    if (cashdeskError || !cashdeskResult.success) {
      // If CashDesk failed with 403 (player ID mismatch), treat as complete failure
      if (cashdeskError && cashdeskError.statusCode === 403) {
        return res.status(200).json({
          success: false,
          type: "cashdesk",
          message: "Player ID verification failed. Please check your player ID and try again.",
          data: {
            transaction,
            cashdeskResult
          }
        });
      }
      
      // For other CashDesk errors, return appropriate message
      const errorMessage = cashdeskError?.message || 
                          (cashdeskResult.data?.Message || "CashDesk deposit failed");
      
      return res.status(200).json({
        success: false,
        type: "cashdesk",
        message: errorMessage,
        data: {
          transaction,
          cashdeskResult
        }
      });
    } else {
      // Everything succeeded - include CashDesk result in response
      return res.status(200).json({
        success: true,
        message: "Payment processed successfully",
        data: {
          transaction,
          cashdeskResult
        }
      });
    }

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
  const { id, status, payment_id,agentnumber, transactionId, admin_name } = req.body;
  console.log("payut",req.body)
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

  if (!status) {
    return res.status(400).json({ message: 'Please check all fields' });
  }
  console.log(status);

  try {
    const transaction = await PayoutTransaction.findOne({paymentId: payment_id});
    console.log("Transaction:", transaction)
    
    if (!transaction) {
      return res.status(400).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    // const forwardedSms = await ForwardedSms.findOne({
    //   transactionId: transactionId,
    //   transactionAmount: transaction.requestAmount,
    //   transactionType: "payout"
    // });

    // if (!forwardedSms) {
    //   return res.status(200).json({
    //     success: false,
    //     type: "tid",
    //     message: "Transaction ID is not valid.",
    //   });
    // }

    // if (forwardedSms.status === "used") {
    //   return res.status(200).json({
    //     success: false,
    //     type: "tid",
    //     message: "Transaction ID is already used.",
    //   });
    // }

    // ---------------------------UPDATE-USER-DATA---------------------
 // Find the user with a withdrawal request matching the paymentId
const userWithdraw = await UserModel.findOne({
  "withdrawalRequests.paymentid": transaction.paymentId
});

console.log("Found user:", userWithdraw);

if (!userWithdraw) {
  console.log("No user found with a withdrawal request matching payment ID:", transaction.paymentId);
} else {
  // Update the specific withdrawal request status using the transactionId from req.body
  const result = await UserModel.findOneAndUpdate(
    {
      _id: userWithdraw._id,
      "withdrawalRequests.paymentid": transaction.paymentId // Match by paymentid
    },
    {
      $set: { 
        "withdrawalRequests.$.status": status === "success" ? "success" : "failed",
        "withdrawalRequests.$.transactionId": transactionId // Also set the transactionId
      }
    },
    { new: true } // Returns the updated document
  );

  if (!result) {
    console.log("Failed to update withdrawal request");
  } else {
    console.log("Withdrawal request updated successfully");
    console.log("Updated document:", result);
  }
}

    // if (status === "success") {
    //   // Update ForwardedSms status to "used"
    //   forwardedSms.status = "used";
    //   await forwardedSms.save();
    // }

    // // Update the transaction status
    transaction.status = status;
    transaction.statusDate = new Date();
    const savedTransaction = await transaction.save();
    console.log("sdasdasd")
    // // Update transaction details
    await PayoutTransaction.findOneAndUpdate(
      { paymentid: userWithdraw.paymentid },
      {
        $set: {
          transactionId: transactionId,
          createdAt: requestTime,
          sentAmount: transaction.requestAmount,
          agent_account: agentnumber
        },
      }
    );

    // // Find the user who owns the agent account used for this transaction
    const user = await UserModel.findOne({ 
      "agentAccounts.accountNumber": agentnumber
    });
    
    if (!user) {
      console.error("User with agent account not found");
      return res.status(400).json({ success: false, message: "User with agent account not found" });
    }

    // // NEW: Update User model with withdrawal information
    if (status === "success") {
      console.log("User:", user)
      
      // Calculate commission based on user's withdrawal commission rate
      const user_commission = (transaction.requestAmount / 100) * user.withdracommission;

      // Update user balance and commission
      user.balance += transaction.requestAmount;
      user.commission += user_commission;
      user.balance += user_commission;
      user.totalpayout += transaction.requestAmount;

      // Add the withdrawal to the user's withdrawals array
      const newWithdrawal = {
        amount: transaction.requestAmount,
        currency: transaction.currency || "BDT",
        date: new Date(),
        transactionId:"",
        status: "success",
        method: transaction.provider || "unknown",
        notes: `Withdrawal to ${transaction.payeeAccount}`,
        processedBy: admin_name || "system"
      };

      // If user doesn't have a withdrawals array, create it
      if (!user.withdrawals) {
        user.withdrawals = [];
      }
      
      user.withdrawals.push(newWithdrawal);
      await user.save();
    }

    res.json({ success: true, message: "Status updated successfully!" });

  } catch (e) {
    res.status(400).json({
      success: false,
      error: e.message,
    });
    console.log(e);
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
Paymentrouter.post("/callbackSms", async (req, res) => {
  console.log('---callback_sms---');
  let data = req.body;
  console.log(data);

  // Fake message detection system
  const isFakeMessage = detectFakeMessage(data);
  if (isFakeMessage) {
    console.log('⚠️ Fake message detected:', data);
    return res.status(200).json({ success: false, message: 'Fake message detected' });
  }

  let text = data?.text?.toString() || '';
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

  try {
    if (provider === 'nagad') {
      if (text.includes("Cash In")) {
        transactionType = "payout";
      } else if (text.includes("Cash Out")) {
        transactionType = "payin";
      } else {
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
      currency = (currency === 'Tk') ? 'BDT' : currency;

    } else if (provider === 'bkash') {
      if (text.includes("Cash In")) {
        transactionType = "payout";
      } else if (text.includes("Cash Out")) {
        transactionType = "payin";
      } else {
        easypay_request_payout_bot.sendMessage(7920367057, JSON.stringify(data));
        return res.sendStatus(200);
      }
      
      transactionAmount = (transactionType === "payout") ? parseFloat(text.match(/Cash In Tk ([\d,.]+)/)[1].replace(/,/g, '')) : parseFloat(text.match(/Cash Out Tk ([\d,.]+)/)[1].replace(/,/g, ''));
      customerAccount = (transactionType === "payout") ? text.match(/to (\d+)/)[1] : text.match(/from (\d+)/)[1];
      transactionId = text.match(/TrxID (\w+)/)[1];
      feeAmount = parseFloat(text.match(/Fee Tk ([\d,.]+)/)[1].replace(/,/g, ''));
      balanceAmount = parseFloat(text.match(/Balance Tk ([\d,.]+)/)[1].replace(/,/g, ''));
      transactionDate = text.match(/(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2})/)[0];
      currency = (transactionType === "payout") ? text.match(/Cash In (Tk)/)[1] : text.match(/Cash Out (Tk)/)[1];
      currency = (currency === 'Tk') ? 'BDT' : currency;

    } else if (provider === 'upay') {
      if (text.includes("Cash-out")) {
        transactionType = "payin";
      } else if (text.includes("Cash-in")) {
        transactionType = "payout";
      } else {
        easypay_request_payout_bot.sendMessage(7920367057, JSON.stringify(data));
        return res.sendStatus(200);
      }
      
      transactionAmount = parseFloat(text.match(/Tk\. ([\d.]+)/)[1]);
      customerAccount = (transactionType === "payin") ? text.match(/from (\d+)/)[1] : text.match(/to (\d+)/)[1];
      transactionId = text.match(/TrxID (\w+)/)[1];
      feeAmount = parseFloat(text.match(/Comm: TK\. ([\d.]+)/)[1]);
      balanceAmount = parseFloat(text.match(/Balance Tk\. ([\d.]+)/)[1]);
      transactionDate = text.match(/(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2})/)[0];
      currency = "BDT";

    } else if (provider === 'rocket') {
      if (text.includes("Cash-Out")) {
        transactionType = "payin";
      } else if (text.includes("Cash-In")) {
        transactionType = "payout";
      } else {
        easypay_request_payout_bot.sendMessage(7920367057, JSON.stringify(data));
        return res.sendStatus(200);
      }
      
      transactionAmount = parseFloat(text.match(/Tk([\d,.]+)/)[1].replace(/,/g, ''));
      customerAccount = text.match(/A\/C: (\*\*\*\d+)/)[1];
      transactionId = text.match(/TxnId: (\d+)/)[1];
      feeAmount = parseFloat(text.match(/Comm:Tk([\d.]+)/)[1]);
      balanceAmount = parseFloat(text.match(/Balance: Tk([\d,.]+)/)[1].replace(/,/g, ''));
      
      // Convert Rocket date format
      const dateMatch = text.match(/(\d{2}-[A-Z]{3}-\d{2} \d{2}:\d{2}:\d{2} [ap]m)/);
      if (dateMatch) {
        const [datePart, timePart, ampm] = dateMatch[0].split(' ');
        const [day, monthStr, year] = datePart.split('-');
        const [hour, minute, second] = timePart.split(':');
        
        const monthMap = {
          'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04', 'MAY': '05', 'JUN': '06',
          'JUL': '07', 'AUG': '08', 'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
        };
        
        let hour24 = parseInt(hour);
        if (ampm === 'pm' && hour24 !== 12) hour24 += 12;
        if (ampm === 'am' && hour24 === 12) hour24 = 0;
        
        transactionDate = `${day}/${monthMap[monthStr]}/20${year} ${hour24.toString().padStart(2, '0')}:${minute}`;
      } else {
        transactionDate = new Date().toLocaleString('en-BD');
      }
      currency = "BDT";

    } else {
      easypay_payout_bot.sendMessage(7920367057, JSON.stringify(data));
      return res.sendStatus(200);
    }

    // Parse transaction date
    const parts = transactionDate.split(/[\s\/:-]/);
    const year = parseInt(parts[2]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[0]);
    const hour = parseInt(parts[3]);
    const minute = parseInt(parts[4]);
    transactionDate = new Date(year, month, day, hour, minute);

    // Save transaction
    const newTransaction = await ForwardedSms.create({
      provider,
      agentAccount,
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

    // Update agent balance and limits
    const agentNumber = await UserModel.findOne({ agentAccount });
    if (agentNumber) {
      agentNumber.balanceAmount = balanceAmount;
      if (transactionType === 'payin') {
        agentNumber.limitRemaining = parseFloat(agentNumber.limitRemaining) - parseFloat(transactionAmount);
      }
      await agentNumber.save();
    }

    // Handle payout transactions
    if (transactionType === 'payout') {
      const payoutTransaction = await PayoutTransaction.findOne({
        provider,
        payeeAccount: customerAccount,
        requestAmount: transactionAmount,
        currency,
        status: 'assigned'
      }).sort({ createdAt: 1 });
      
      if (payoutTransaction) {
        payoutTransaction.agentAccount = agentAccount;
        payoutTransaction.transactionId = transactionId;
        payoutTransaction.sentAmount = transactionAmount;
        payoutTransaction.balanceAmount = balanceAmount;
        payoutTransaction.transactionDate = transactionDate;
        payoutTransaction.status = 'completed';
        await payoutTransaction.save();
      }
    }

    // Send notifications
    if (transactionType === 'payin') {
      easypay_payin_bot.sendMessage(7920367057, JSON.stringify(data));
    } else if (transactionType === 'payout') {
      easypay_payout_bot.sendMessage(7920367057, JSON.stringify(data));
    }

    return res.status(200).json({ success: true, message: 'Transaction processed successfully' });

  } catch (error) {
    console.error('Error processing SMS:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});
// Fake message detection system
function detectFakeMessage(data) {
  const { text, from, number, sentStamp, receivedStamp } = data;
  
  // Check for missing required fields
  if (!text || !from || !number || !sentStamp || !receivedStamp) {
    return true;
  }

  // Check if timestamps are valid and logical
  const sentTime = new Date(sentStamp);
  const receivedTime = new Date(receivedStamp);
  const now = new Date();
  
  if (isNaN(sentTime.getTime()) || isNaN(receivedTime.getTime())) {
    return true;
  }

  // Future timestamps are suspicious
  if (sentTime > now || receivedTime > now) {
    return true;
  }

  // Received time should be after sent time
  if (receivedTime < sentTime) {
    return true;
  }

  // Check phone number format (Bangladeshi numbers)
  const bangladeshiPhoneRegex = /^01[3-9]\d{8}$/;
  if (!bangladeshiPhoneRegex.test(number)) {
    return true;
  }

  // Check provider validity
  const validProviders = ['bkash', 'nagad', 'rocket', 'upay'];
  if (!validProviders.includes(from.toLowerCase())) {
    return true;
  }

  // Check for suspicious patterns in text
  const suspiciousPatterns = [
    /test/i,
    /fake/i,
    /dummy/i,
    /example/i,
    /xxxx/i,
    /aaaa/i,
    /000000/i,
    /111111/i
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(text)) {
      return true;
    }
  }

  // Check for unrealistic amounts
  const amountMatch = text.match(/Tk[\.]? (\d+)/);
  if (amountMatch) {
    const amount = parseFloat(amountMatch[1]);
    if (amount < 1 || amount > 1000000) { // Unrealistic amount range
      return true;
    }
  }

  return false;
}
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
    console.log("Hello",req.params.id)
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
// POST route to forward bank transfer deposit to a new agent
Paymentrouter.post("/forward-bank-transfer-deposit", async (req, res) => {
  const { orderId } = req.body;
  
  if (!orderId) {
    return res.json({
      success: false,
      message: "Order ID is required",
    });
  }

  try {
    // Find the user who currently has this bank transfer deposit
    const currentAgent = await UserModel.findOne({
      'bankTransferDeposits.orderId': orderId
    });

    if (!currentAgent) {
      return res.status(404).json({
        success: false,
        message: "Bank transfer deposit not found",
      });
    }

    // Find the specific deposit
    const deposit = currentAgent.bankTransferDeposits.find(d => d.orderId === orderId);
    
    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Bank transfer deposit not found",
      });
    }

    if (deposit.status !== "pending") {
      return res.json({
        success: false,
        message: "Cannot forward a completed or failed bank transfer deposit",
      });
    }

    // Find eligible agents with the same bankName in their paymentMethod (excluding current agent)
    const eligibleAgents = await UserModel.aggregate([
      {
        $match: {
          _id: { $ne: currentAgent._id },
          balance: { $gte: deposit.amount },
          is_admin: false,
          status: 'active',
          paymentMethod: { $in: [deposit.bankName] }
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
                provider: deposit.bankName
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
          name: 1,
          balance: 1,
          status: 1,
          currentstatus: 1,
          activeAccounts: 1,
          bankTransferDeposits: 1,
          paymentMethod: 1
        }
      }
    ]);

    if (eligibleAgents.length === 0) {
      return res.status(200).json({
        success: false,
        message: `No available ${deposit.bankName} agents with sufficient balance and active accounts to forward this deposit.`,
      });
    }

    // Weighted random selection based on balance
    const totalBalance = eligibleAgents.reduce((sum, agent) => sum + agent.balance, 0);
    let randomPoint = Math.random() * totalBalance;
    let newAgent = null;

    for (const agent of eligibleAgents) {
      randomPoint -= agent.balance;
      if (randomPoint <= 0) {
        newAgent = agent;
        break;
      }
    }

    // Fallback to simple random selection
    if (!newAgent) {
      newAgent = eligibleAgents[Math.floor(Math.random() * eligibleAgents.length)];
    }

    // Remove the deposit from the current agent
    await UserModel.updateOne(
      { _id: currentAgent._id },
      { $pull: { bankTransferDeposits: { orderId: orderId } } }
    );

    // Prepare deposit data for new agent
    const depositData = {
      playerId: deposit.playerId,
      amount: deposit.amount,
      accountNumber: deposit.accountNumber,
      bankName: deposit.bankName,
      orderId: deposit.orderId,
      currency: deposit.currency,
      status: "pending",
      provider: deposit.provider,
      merchantid: deposit.merchantid,
      transactionId: deposit.transactionId || "",
      referenceNumber: deposit.referenceNumber || null,
      cashdeskProcessed: false,
      statusDate: new Date()
    };

    // Add the deposit to the new agent's account
    await UserModel.updateOne(
      { _id: newAgent._id },
      { $push: { bankTransferDeposits: depositData } }
    );

    // Also update the main BankDeposit collection if it exists
    try {
      const BankDeposit = mongoose.model('BankDeposit');
      await BankDeposit.findOneAndUpdate(
        { orderId: orderId },
        { 
          $set: { 
            status: "reassigned",
            reassignedTo: newAgent._id,
            reassignedAt: new Date()
          } 
        }
      );
    } catch (error) {
      console.log("BankDeposit collection update skipped:", error.message);
    }

    return res.status(200).json({
      success: true,
      message: "Bank transfer deposit forwarded to a new agent",
      orderId,
      previousAgent: {
        id: currentAgent._id,
        username: currentAgent.username
      },
      newAgent: {
        id: newAgent._id,
        username: newAgent.username,
        name: newAgent.name
      },
      deposit: {
        amount: deposit.amount,
        currency: deposit.currency,
        playerId: deposit.playerId,
        bankName: deposit.bankName
      }
    });

  } catch (e) {
    console.log("forward-bank-transfer-deposit-error", e.message);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});
// Change bank deposit status
Paymentrouter.patch('/bank-deposits/:id/status', async (req, res) => {
  try {
    const { status, transactionId, referenceNumber, metadata } = req.body;
    const { id } = req.params; // This should be the orderId
    const apiKey = req.headers['x-api-key'];
 console.log(req.body)
    // Find merchant
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

    // Find the actual deposit transaction - YOU NEED TO CREATE A SEPARATE MODEL FOR THIS
    // Currently you're using BankDeposit which seems to be for bank account configurations
    const depositTransaction = await BankDeposit.findOne({ 
      orderId: id,
    });

    if (!depositTransaction) {
      return res.status(404).json({
        success: false,
        message: 'Deposit transaction not found'
      });
    }
   const agentnumber=await BankAccount.findOne({accountNumber:referenceNumber});
   if(!agentnumber){
     return res.send({success:false,message:"Accoutn number not exist!"})
   }
   const  matched_user=await UserModel.findById({_id:agentnumber.user_id})

    // Prepare update object
    const updateData = {
      status,
      statusDate: new Date()
    };

    if (transactionId) updateData.transactionId = transactionId;
    if (referenceNumber) updateData.referenceNumber = referenceNumber;
    if (metadata) updateData.metadata = metadata;

    // If status is being changed to completed, process CashDeskBot deposit
    if (status === 'completed' && depositTransaction.status !== 'completed') {
      try {
        // Generate confirm hash (MD5 of "playerId:CASHDESK_HASH")
        const confirmString = `${depositTransaction.playerId}:${CASHDESK_HASH}`;
        const confirm = crypto.createHash('md5').update(confirmString).digest('hex');
        
        // Generate step1 hash (SHA256 of query string)
        const step1String = `hash=${CASHDESK_HASH}&lng=ru&userid=${depositTransaction.playerId}`;
        const step1 = crypto.createHash('sha256').update(step1String).digest('hex');
        
        // Generate step2 hash (MD5 of parameters)
        const step2String = `summa=${depositTransaction.amount}&cashierpass=${CASHIER_PASS}&cashdeskid=${CASHDESK_ID}`;
        const step2 = crypto.createHash('md5').update(step2String).digest('hex');
        
        // Final signature (SHA256 of step1 + step2)
        const finalSignatureString = step1 + step2;
        const finalSignature = crypto.createHash('sha256').update(finalSignatureString).digest('hex');

        // Prepare deposit payload
        const depositPayload = {
          cashdeskid: parseInt(CASHDESK_ID),
          lng: 'ru',
          summa: parseFloat(depositTransaction.amount),
          confirm
        };

        // Make CashDeskBot API call
        const cashdeskResponse = await axios.post(
          `${CASHDESK_API_BASE}/Deposit/${depositTransaction.playerId}/Add`,
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
        
        // Check if CashDeskBot operation was successful
        if (!cashdeskResponse.data.Success) {
          // If CashDeskBot fails, update status to 'failed' instead of returning
          updateData.status = 'failed';
          updateData.cashdeskResponse = cashdeskResponse.data;
          updateData.cashdeskProcessed = false;
          
          // Continue with the update but with failed status
        } else {
          // Store CashDesk response for successful transactions
          updateData.cashdeskResponse = cashdeskResponse.data;
          updateData.cashdeskProcessed = true;

          // Update merchant balance only if CashDesk was successful
          const commissionsmoney = (depositTransaction.amount / 100) * merchant.depositCommission;
          merchant.balance += depositTransaction.amount;
          merchant.balance -= commissionsmoney;
          merchant.getwaycost += commissionsmoney;
          merchant.total_payin += depositTransaction.amount;
          await merchant.save();
        }

      } catch (cashdeskError) {
        console.error('CashDesk deposit failed:', cashdeskError.response?.data || cashdeskError.message);
        
        // If CashDesk API call fails, set status to failed but continue with update
        updateData.status = 'failed';
        updateData.cashdeskError = cashdeskError.response?.data || cashdeskError.message;
        updateData.cashdeskProcessed = false;
      }
    }

    // Update the deposit transaction
    const updatedDeposit = await BankDeposit.findOneAndUpdate(
      { orderId: id },
      updateData,
      { new: true, runValidators: true }
    );

    // Update user's bank transfer deposit status
    const user = await UserModel.findOne({
      "bankTransferDeposits.orderId": depositTransaction.orderId
    });

    if (user) {
      await UserModel.findOneAndUpdate(
        {
          _id: user._id,
          "bankTransferDeposits.orderId": depositTransaction.orderId
        },
        {
          $set: { 
            "bankTransferDeposits.$.status": updateData.status, // Use the actual status (might be changed to 'failed')
            "bankTransferDeposits.$.statusDate": new Date(),
            "bankTransferDeposits.$.transactionId": transactionId || "",
            "bankTransferDeposits.$.referenceNumber": referenceNumber || null
          }
        }
      );
    }
 // Calculate commission based on user's withdrawal commission rate
      const user_commission = (depositTransaction.amount / 100) * matched_user.depositcommission;

      // Update user balance and commission
      matched_user.balance -=depositTransaction.amount;
      matched_user.commission += user_commission;
      matched_user.totalpayment += depositTransaction.amount;
      matched_user.balance +=user_commission;
      matched_user.providercost+=user_commission;
      matched_user.save();
      agentnumber.total_recieved+=depositTransaction.amount;
      agentnumber.total_order+=1;
      agentnumber.save();



    res.json({
      success: true,
      message: `Bank deposit status updated to ${updateData.status}`,
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
// Delete bank deposit
Paymentrouter.delete('/bank-deposits/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log(`Attempting to delete bank deposit with orderId: ${orderId}`);

    // Find the deposit in the main collection
    const deposit = await BankDeposit.findOne({ 
      orderId: orderId,
    });

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Bank deposit not found'
      });
    }

    // Check if deposit can be deleted (only pending, failed or cancelled deposits can be deleted)
    if (deposit.status === 'completed' || deposit.status === 'processing') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete deposit with status: ${deposit.status}. Only pending, failed, or cancelled deposits can be deleted.`
      });
    }

    // Find and remove the deposit from the user's bankTransferDeposits array
    const userUpdateResult = await UserModel.updateOne(
      { "bankTransferDeposits.orderId": orderId },
      { $pull: { bankTransferDeposits: { orderId: orderId } } }
    );

    console.log(`Removed deposit from user's array: ${userUpdateResult.modifiedCount} document(s) modified`);

    // Delete the deposit from the main collection
    const deleteResult = await BankDeposit.deleteOne({ orderId: orderId });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Failed to delete bank deposit from main collection'
      });
    }

    console.log(`Successfully deleted bank deposit with orderId: ${orderId}`);

    res.status(200).json({
      success: true,
      message: 'Bank deposit deleted successfully',
      data: {
        orderId: orderId,
        deletedFromMainCollection: deleteResult.deletedCount,
        removedFromUser: userUpdateResult.modifiedCount
      }
    });

  } catch (error) {
    console.error('Delete bank deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the bank deposit',
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

        // Find eligible users with sufficient balance, active status, and Nagad Free payment method
        const eligibleUsers = await UserModel.aggregate([
            {
                $match: {
                    balance: { $gte: requiredBalance },
                    status: 'active',
                    paymentMethod: { $in: [provider] }
                }
            },
            {
                $lookup: {
                    from: "bankaccounts", // or the appropriate collection name
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$user_id", "$$userId"] },
                                status: 'active',
                                provider: provider
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
                    name: 1,
                    balance: 1,
                    status: 1,
                    currentstatus: 1,
                    depositcommission: 1,
                    activeAccounts: 1
                }
            }
        ]);

        console.log(`Found ${eligibleUsers.length} eligible Nagad Free users with balance >= ${requiredBalance}`);

        if (eligibleUsers.length === 0) {
            // Diagnostic queries to understand why no users are eligible
            const allUsersCount = await UserModel.countDocuments({
                paymentMethod: { $in: [provider] },
                status: 'active'
            });
            
            const usersWithBalance = await UserModel.countDocuments({
                paymentMethod: { $in: [provider] },
                status: 'active',
                balance: { $gte: requiredBalance }
            });
            
            const usersWithAccounts = await UserModel.countDocuments({
                paymentMethod: { $in: [provider] },
                status: 'active',
                balance: { $gte: requiredBalance }
            });

            console.log(`Diagnostics:
                Total users with provider ${provider}: ${allUsersCount}
                Users with balance >= ${requiredBalance}: ${usersWithBalance}
                Users with accounts: ${usersWithAccounts}`);

            return res.status(404).send({
                success: false,
                message: `No eligible Nagad Free agents found with balance >= ${requiredBalance} and active accounts`,
                diagnostics: {
                    totalUsers: allUsersCount,
                    usersWithRequiredBalance: usersWithBalance,
                    usersWithAccounts: usersWithAccounts,
                    requiredBalance: requiredBalance
                }
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

        console.log("Selected Agent:", {
            _id: selectedAgent._id,
            username: selectedAgent.username,
            balance: selectedAgent.balance,
            activeAccounts: selectedAgent.activeAccounts.length
        });

        // Select a random active account
        const selectedAccount = selectedAgent.activeAccounts[
            Math.floor(Math.random() * selectedAgent.activeAccounts.length)
        ];

        console.log("Selected Nagad Account:", {
            provider: selectedAccount.provider,
            accountNumber: selectedAccount.accountNumber,
            shopName: selectedAccount.shopName
        });

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
                accountType: selectedAccount.accountType || "Regular"
            },
            requirements: {
                minimumRequiredBalance: requiredBalance
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

        // Find eligible users with sufficient balance and active status
        const eligibleUsers = await UserModel.aggregate([
            {
                $match: {
                    balance: { $gte: requiredBalance },
                    status: 'active',
                    paymentMethod: { $in: [provider] }
                }
            },
            {
                $lookup: {
                    from: "bankaccounts", // or the appropriate collection name
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$user_id", "$$userId"] },
                                status: 'active',
                                provider: provider
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
                    name: 1,
                    balance: 1,
                    status: 1,
                    currentstatus: 1,
                    activeAccounts: 1
                }
            }
        ]);

        console.log(`Found ${eligibleUsers.length} eligible ${provider} users with balance >= ${requiredBalance}`);
        
        if (eligibleUsers.length === 0) {
            // Diagnostic queries to understand why no users are eligible
            const allUsersCount = await UserModel.countDocuments({
                paymentMethod: { $in: [provider] },
                status: 'active'
            });
            
            const usersWithBalance = await UserModel.countDocuments({
                paymentMethod: { $in: [provider] },
                status: 'active',
                balance: { $gte: requiredBalance }
            });
            
            const usersWithAccounts = await UserModel.countDocuments({
                paymentMethod: { $in: [provider] },
                status: 'active',
                balance: { $gte: requiredBalance }
            });

            console.log(`Diagnostics:
                Total users with provider ${provider}: ${allUsersCount}
                Users with balance >= ${requiredBalance}: ${usersWithBalance}
                Users with accounts: ${usersWithAccounts}`);

            return res.status(404).send({
                success: false,
                message: `No eligible ${provider} agents found with balance >= ${requiredBalance} and active accounts`,
                diagnostics: {
                    totalUsers: allUsersCount,
                    usersWithRequiredBalance: usersWithBalance,
                    usersWithAccounts: usersWithAccounts,
                    requiredBalance: requiredBalance
                }
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

        console.log("Selected Agent:", {
            _id: selectedAgent._id,
            username: selectedAgent.username,
            balance: selectedAgent.balance,
            activeAccounts: selectedAgent.activeAccounts.length
        });

        // Select a random active account
        const selectedAccount = selectedAgent.activeAccounts[
            Math.floor(Math.random() * selectedAgent.activeAccounts.length)
        ];

        console.log("Selected Bank Account:", {
            provider: selectedAccount.provider,
            accountNumber: selectedAccount.accountNumber,
            shopName: selectedAccount.shopName
        });

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
                shopName: selectedAccount.shopName,
                accountName: selectedAccount.accountName || "",
                branchName: selectedAccount.branchName || ""
            },
            requirements: {
                minimumRequiredBalance: requiredBalance
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
      orderId,
      currency = 'BDT',
      transactionId,
      agentAccount
    } = req.body;
   console.log(req.body)
    const apiKey = req.headers['x-api-key'];
    
    // Validate required fields
    if (!playerId || !amount || !orderId) {
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

    // Find merchant
    const merchant = await Merchantkey.findOne({ apiKey });
    if (!merchant) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }
   // Check if transactionId already exists
    const existingDepositByTransactionId = await NagadFreeDeposit.findOne({ transactionId });
    if (existingDepositByTransactionId) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID already exists'
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
    const matchedaccount=await BankAccount.findOne({accountNumber:agentAccount});
    console.log("agent",matchedaccount)
    // Find all agent users with active status, online status, and "Nagad Free" in paymentMethod
    const eligibleAgents = await UserModel.findById({_id:matchedaccount.user_id});
    console.log("eligibleAgents",eligibleAgents)

    if (!eligibleAgents) {
      return res.json({
        success: false,
        message: "No available agents with Nagad Free payment method to process this deposit.",
      });
    }

    // Randomly select an agent
    const randomAgent =eligibleAgents;
    
    // Create new Nagad Free deposit data
    const nagadFreeDepositData = {
      playerId,
      amount: parseFloat(amount),
      orderId,
      currency,
      merchantid: merchant._id,
      status: 'pending',
      statusDate: new Date(),
      transactionId:transactionId
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


// GET route to check Nagad Free deposit status
Paymentrouter.get("/check-nagad-free-deposit/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find the user who has this Nagad Free deposit
    const agent = await UserModel.findOne({
      'nagadFreeDeposits.orderId': orderId
    }, {
      'nagadFreeDeposits.$': 1,
      username: 1,
      name: 1
    });

    if (!agent || !agent.nagadFreeDeposits || agent.nagadFreeDeposits.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Nagad Free deposit not found",
      });
    }

    const deposit = agent.nagadFreeDeposits[0];

    res.status(200).json({
      success: true,
      deposit: {
        orderId: deposit.orderId,
        playerId: deposit.playerId,
        amount: deposit.amount,
        currency: deposit.currency,
        status: deposit.status,
        assignedAgent: {
          id: agent._id,
          username: agent.username,
          name: agent.name
        },
        createdAt: deposit.createdAt,
        statusDate: deposit.statusDate
      }
    });

  } catch (e) {
    console.log("check-nagad-free-deposit-error", e.message);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});

// Get single Nagad Free deposit
Paymentrouter.get('/nagad-free-deposits/:id', async (req, res) => {
  try {
    const deposit = await NagadFreeDeposit.findOne({
      _id: req.params.id,
    })
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
// POST route to forward Nagad Free deposit to a new agent
Paymentrouter.post("/forward-nagad-free-deposit", async (req, res) => {
  const { orderId } = req.body;
  
  if (!orderId) {
    return res.json({
      success: false,
      message: "Order ID is required",
    });
  }

  try {
    // Find the user who currently has this Nagad Free deposit
    const currentAgent = await UserModel.findOne({
      'nagadFreeDeposits.orderId': orderId
    });

    if (!currentAgent) {
      return res.status(404).json({
        success: false,
        message: "Nagad Free deposit not found",
      });
    }

    // Find the specific deposit
    const deposit = currentAgent.nagadFreeDeposits.find(d => d.orderId === orderId);
    
    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Nagad Free deposit not found",
      });
    }

    if (deposit.status !== "pending") {
      return res.json({
        success: false,
        message: "Cannot forward a completed or failed Nagad Free deposit",
      });
    }

    // Find eligible Nagad Free agents (excluding current agent)
    const eligibleAgents = await UserModel.aggregate([
      {
        $match: {
          _id: { $ne: currentAgent._id },
          balance: { $gte: deposit.amount },
          is_admin: false,
          status: 'active',
          paymentMethod: { $in: ["Nagad Free"] }
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
                provider: "Nagad Free"
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
          name: 1,
          balance: 1,
          status: 1,
          currentstatus: 1,
          activeAccounts: 1,
          nagadFreeDeposits: 1
        }
      }
    ]);

    if (eligibleAgents.length === 0) {
      return res.status(200).json({
        success: false,
        message: "No available Nagad Free agents with sufficient balance and active accounts to forward this deposit.",
      });
    }

    // Weighted random selection based on balance
    const totalBalance = eligibleAgents.reduce((sum, agent) => sum + agent.balance, 0);
    let randomPoint = Math.random() * totalBalance;
    let newAgent = null;

    for (const agent of eligibleAgents) {
      randomPoint -= agent.balance;
      if (randomPoint <= 0) {
        newAgent = agent;
        break;
      }
    }

    // Fallback to simple random selection
    if (!newAgent) {
      newAgent = eligibleAgents[Math.floor(Math.random() * eligibleAgents.length)];
    }

    // Remove the deposit from the current agent
    await UserModel.updateOne(
      { _id: currentAgent._id },
      { $pull: { nagadFreeDeposits: { orderId: orderId } } }
    );

    // Prepare deposit data for new agent
    const depositData = {
      playerId: deposit.playerId,
      amount: deposit.amount,
      accountNumber: deposit.accountNumber,
      orderId: deposit.orderId,
      currency: deposit.currency,
      status: "pending",
      provider: "nagad_free",
      merchantid: deposit.merchantid,
      cashdeskProcessed: false,
      statusDate: new Date()
    };

    // Add the deposit to the new agent's account
    await UserModel.updateOne(
      { _id: newAgent._id },
      { $push: { nagadFreeDeposits: depositData } }
    );

    // Also update the main NagadFreeDeposit collection if it exists
    try {
      const NagadFreeDeposit = mongoose.model('NagadFreeDeposit');
      await NagadFreeDeposit.findOneAndUpdate(
        { orderId: orderId },
        { 
          $set: { 
            status: "reassigned",
            reassignedTo: newAgent._id,
            reassignedAt: new Date()
          } 
        }
      );
    } catch (error) {
      console.log("NagadFreeDeposit collection update skipped:", error.message);
    }

    return res.status(200).json({
      success: true,
      message: "Nagad Free deposit forwarded to a new agent",
      orderId,
      previousAgent: {
        id: currentAgent._id,
        username: currentAgent.username
      },
      newAgent: {
        id: newAgent._id,
        username: newAgent.username,
        name: newAgent.name
      },
      deposit: {
        amount: deposit.amount,
        currency: deposit.currency,
        playerId: deposit.playerId
      }
    });

  } catch (e) {
    console.log("forward-nagad-free-deposit-error", e.message);
    res.status(500).json({
      success: false,
      message: e.message,
    });
  }
});
// Update Nagad Free deposit status
Paymentrouter.patch('/nagad-free-deposits/:id/status', async (req, res) => {
  try {
    const { status, referenceNumber, metadata,userid } = req.body;
    const { id } = req.params; // This is the orderId, not MongoDB _id
    const apiKey = req.headers['x-api-key'];
   console.log(req.body)
    // Find merchant
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

    // Validate referenceNumber if provided
    if (referenceNumber && typeof referenceNumber !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Reference number must be a string'
      });
    }
   // ----------find-the-number-------------------
   const agentnumber=await BankAccount.findOne({user_id:userid,provider:"Nagad Free"});
   if(!agentnumber){
     return res.send({success:false,message:"Nagad Feee Number Not Exist!"})
   }
   const  matched_user=await UserModel.findById({_id:agentnumber.user_id})
    // Find deposit by orderId instead of _id
    const deposit = await NagadFreeDeposit.findOne({
      orderId: id,
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
        finalSignatureString = step1 + step2;
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

        console.log('CashDesk deposit response:', cashdeskResponse.data);
        
        // Check if CashDeskBot operation was successful
        if (!cashdeskResponse.data.Success) {
          // If CashDeskBot returns success: false, don't update anything
          return res.status(400).json({
            success: false,
            message: 'CashDesk deposit failed',
            error: cashdeskResponse.data.Message || 'Unknown error from CashDesk',
            data: cashdeskResponse.data
          });
        }
        
        // Store CashDesk response
        updateData.cashdeskResponse = cashdeskResponse.data;
        updateData.cashdeskProcessed = true;

        // Update merchant balance only if CashDesk was successful
        const commissionsmoney = (deposit.amount / 100) * merchant.depositCommission;
        merchant.balance += deposit.amount;
        merchant.balance -= commissionsmoney;
        merchant.getwaycost += commissionsmoney;
        merchant.total_payin += deposit.amount;
        await merchant.save();
      // Calculate commission based on user's withdrawal commission rate
      const user_commission = (deposit.amount / 100) * matched_user.withdracommission;

      // Update user balance and commission
      matched_user.balance -= deposit.amount;
      matched_user.commission += user_commission;
      matched_user.balance += user_commission;
      matched_user.providercost+=user_commission;
      matched_user.totalpayment += deposit.amount;
      matched_user.save();
      } catch (cashdeskError) {
        console.error('CashDesk deposit failed:', cashdeskError.response?.data || cashdeskError.message);
        
        // If CashDesk API call fails, don't update anything
        return res.status(500).json({
          success: false,
          message: 'CashDesk deposit API call failed',
          error: cashdeskError.response?.data || cashdeskError.message
        });
      }
    }

    // Update the deposit using orderId instead of _id (only if CashDesk was successful or not needed)
    const updatedDeposit = await NagadFreeDeposit.findOneAndUpdate(
      { orderId: id },
      updateData,
      { new: true, runValidators: true }
    );

    // Update user's nagad free deposit status
    const user = await UserModel.findOne({
      "nagadFreeDeposits.orderId": deposit.orderId
    });

    if (user) {
      await UserModel.findOneAndUpdate(
        {
          _id: user._id,
          "nagadFreeDeposits.orderId": deposit.orderId
        },
        {
          $set: { 
            "nagadFreeDeposits.$.status": status,
            "nagadFreeDeposits.$.statusDate": new Date()
          }
        }
      );
    }
 // Calculate commission based on user's withdrawal commission rate
      const user_commission = (deposit.amount / 100) * matched_user.depositcommission;
      agentnumber.total_recieved+=deposit.amount;
      agentnumber.total_order+=1;
      agentnumber.save();
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
// DELETE route to remove Nagad Free deposit
Paymentrouter.delete("/nagad-free-deposits/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    console.log(`Attempting to delete Nagad Free deposit with orderId: ${orderId}`);

    // Find the deposit in the main collection
    const deposit = await NagadFreeDeposit.findOne({ 
      orderId: orderId,
    });

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Nagad Free deposit not found or access denied'
      });
    }

    // Check if deposit can be deleted (only pending or cancelled deposits can be deleted)
    if (deposit.status === 'completed' || deposit.status === 'processing') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete deposit with status: ${deposit.status}. Only pending, failed, or cancelled deposits can be deleted.`
      });
    }

    // Find and remove the deposit from the user's nagadFreeDeposits array
    const userUpdateResult = await UserModel.updateOne(
      { "nagadFreeDeposits.orderId": orderId },
      { $pull: { nagadFreeDeposits: { orderId: orderId } } }
    );

    console.log(`Removed deposit from user's array: ${userUpdateResult.modifiedCount} document(s) modified`);

    // Delete the deposit from the main collection
    const deleteResult = await NagadFreeDeposit.deleteOne({ orderId: orderId });

    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Failed to delete Nagad Free deposit from main collection'
      });
    }

    console.log(`Successfully deleted Nagad Free deposit with orderId: ${orderId}`);

    res.status(200).json({
      success: true,
      message: 'Nagad Free deposit deleted successfully',
      data: {
        orderId: orderId,
        deletedFromMainCollection: deleteResult.deletedCount,
        removedFromUser: userUpdateResult.modifiedCount
      }
    });

  } catch (error) {
    console.error('Delete Nagad Free deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while deleting the Nagad Free deposit',
      error: error.message
    });
  }
});

// GET all payment methods
Paymentrouter.get('/payment-methods', async (req, res) => {
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
module.exports = Paymentrouter;
