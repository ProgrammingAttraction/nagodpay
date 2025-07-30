"use strict"
const axios = require('axios');
const uuidv4 = require('uuid').v4;
const nanoid = require('nanoid').nanoid;
const customAlphabet = require('nanoid').customAlphabet;
const crypto = require('crypto');
const TelegramBot = require('node-telegram-bot-api');
const ForwardedSms = require("../model/ForwardedSms.js");
const cron = require('node-cron');


const easypay_bot = new TelegramBot('7992374649:AAFqP7MTXUaM9UjpBAlKEDHQW2ppb9h_mzQ');
const easypay_payin_bot = new TelegramBot('7741087073:AAEXov8j6Fv4-ffzHB3rO4f3Y3F0kVNQI60');
const easypay_payout_bot = new TelegramBot('7214733744:AAEYeWybSG_GzboNANrmC73wouf39_ryqD4');
const easypay_request_payout_bot = new TelegramBot('7379994941:AAGBT6O7vAdVuM1_A5aRzyIgykql1ZEDAXk');
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const SERVER_URL = 'https://eassypay.com/api';
const BASE_URL = 'https://eassypay.com';

function generate256Hash(data) {
  // Use SHA256 to generate a hash
  const hash = crypto.createHash('sha256');
  hash.update(data);
  return hash.digest('hex');
}

function generateHmacSha512(data, key) {
  // Use HMAC-SHA512 to generate a hash
  const hmac = crypto.createHmac('sha512', key);
  hmac.update(data);
  return hmac.digest('hex');
}

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const fetch_status = async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  const data = req.body;
  console.log('fetch-status', data);

  try {
    const merchant = await User.findOne({name: data.mid, apiKey, status: 'activated'});
    // console.log('merchant', merchant);
    if (!merchant) {
      return res.status(200).json({
        success: false,
        message: "There is not existing activated merchant with API key"
      })
    }

    if (!data.mid || !data.orderId) {
      return res.status(200).json({
        success: false,
        message: "Please send correct mid and orderId for checking PayinTransaction."
      })
    }

    let where = {
			merchantId: data.mid,
      orderId: data.orderId,
		};
    if (data.transactionId) {
      where.transactionId =  data.transactionId;
    }
    const PayinTransaction = await PayinTransaction.findOne(where);

		if (!PayinTransaction) {
			return res.status(200).json({
        success: false,
        message: "There is not existing PayinTransaction with provided order id and PayinTransaction id"
      })
		}
		
    return res.status(200).json({
      success: true,
      status: PayinTransaction.status,
      amount: PayinTransaction.amount,
      currency: PayinTransaction.currency,
      time: PayinTransaction.statusDate,
    })

  } catch (e) {
    console.log('fetch-status-error', e.message)
    res.status(400).json({ 
      success: false,
      message: "Bad request" 
    });
  }
};

const update_trans_status = async (req, res) => {
  console.log('---update_trans_status---');
	console.log('req.query', req.query); // https://easypay.com/api/payment/updateTransStatus?transactionId=GwiMnCU7&status=approved
	const data = req.query;
	const txId = data.transactionId;
	try {
		const payinTransaction = await PayinTransaction.findOne({
			transactionId: txId,
		});
		if (!payinTransaction) {
			return res.send("There is no PayinTransaction.");
		}
		
    payinTransaction.status = data.status;
    payinTransaction.response = JSON.stringify(data);
    payinTransaction.statusDate = new Date();
    if (data.paymentId)
      payinTransaction.paymentId = data.paymentId;
    if (data.mode)
      payinTransaction.mode = data.mode;
    await payinTransaction.save();

    
    let payload = {};
    if (payinTransaction.status === "approved") {
      payload = {
        orderId: payinTransaction.orderId,
        status: "success",
        hash: payinTransaction.hash,
        transactionId: payinTransaction.transactionId,
        amount: payinTransaction.amount,
        currency: payinTransaction.currency,
        message: "This PayinTransaction has been completed."
      };
    } else {
      payload = {
        orderId: payinTransaction.orderId,
        status: "fail",
        message: "An error occured. PayinTransaction failed or not founds."
      };
    }

    if (payinTransaction.callbackUrl) {
      await axios
      .post(
        payinTransaction.callbackUrl,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      )
      .then(async (resp) => {
        console.log('update-trans-status-callback-trnsxnd-hpp-callback-to-mechant-resp', resp.data);
        res.send('PayinTransaction status has been updated and returned callback to its callbackUrl. ' + JSON.stringify(resp.data));  
      })
      .catch((e) => {
        console.log('update-trans-status-callback-trnsxnd-hpp-callback-to-mechant-resp-error', e.message);
        res.send('PayinTransaction status has been updated and returned callback to its callbackUrl. ' + e.message);  
      });
    }
    
  } catch (e) {
    console.log('update_trans_status_error', e.message);
    return res.send('Updating PayinTransaction status failed.');  
  }
};

const capitalize = (str) => {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}
// -----------------after message forwarding-------------
exports.payment = async (req, res) => {
  const apiKey = req.headers["x-api-key"] ? req.headers["x-api-key"] : "";
  const data = req.body;
  console.log("payment-data", data);
    const matchapikey=await User.findOne({apiKey});
    console.log(matchapikey)
    if(!matchapikey){
     return  res.status(200).json({
        success: false,
        message: "Merchant does not exist."
      })
    }
  if (
    !data.mid ||
    !data.provider ||
    !data.orderId ||
    !data.payerId ||
    !data.amount ||
    !data.currency ||
    !data.redirectUrl
  ) {
    // || !data.callbackUrl
    return res.status(200).json({
      success: false,
      orderId: data.orderId,
      message: "Required fields are not filled out.",
    });
  }

  if (
    (data.currency === "BDT" || data.currency === "INR") &&
    parseFloat(data.amount) < 300
  ) {
    return res.status(200).json({
      success: false,
      orderId: data.orderId,
      message: `Minimum deposit amount should be at least 300 for ${data.currency} currency.`,
    });
  } else if (data.currency === "USD" && parseFloat(data.amount) < 10) {
    return res.status(200).json({
      success: false,
      orderId: data.orderId,
      message: "Minimum deposit amount should be at least 10 for USD currency.",
    });
  }

  try {
    const merchant = await User.findOne({
      name: data.mid,
      status: "activated",
    });
    if (data.mid !== "shihab" && (!merchant || merchant.apiKey !== apiKey)) {
      return res.status(200).json({
        success: false,
        orderId: data.orderId,
        message: "There is not existing activated merchant with API key",
      });
    }

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

    let criteria = {};
    criteria = {
      $and: [
        {
          limitRemaining: {
            $gte: 0, // $gte: transaction.expectedAmount
            // $lte: transaction.expectedAmount
          },
        },
        { merchant: data.mid },
        { mfs: data.provider },
        { currency: data.currency },
        { status: "activated" },
      ],
    };

    const agentNumbers = await AgentNumber.find(criteria)
      .sort({ limitRemaining: -1 })
      .limit(1);

    // if (agentNumbers.length == 0) {
    //   return res.status(200).json({
    //     success: false,
    //     orderId: data.orderId,
    //     message: "There is no available agent number for a specific provider",
    //   });
    // }

    const paymentId = nanoid(8); // uuidv4();

    const newTransaction = await PayinTransaction.create({
      paymentId,
      merchant: data.mid,
      provider: data.provider,
      orderId: data.orderId,
      payerId: data.payerId,
      expectedAmount: data.amount,
      currency: data.currency,
      redirectUrl: data.redirectUrl,
      callbackUrl: data.callbackUrl,
      paymentType: "p2p",
    });

    return res.status(200).json({
      success: true,
      message: "Payment link created.",
      orderId: data.orderId,
      paymentId,
      link: `http://localhost:3000/checkout/${paymentId}`,
    });
  } catch (e) {
    console.log("payment-general-error", e.message);

    res.status(500).json({
      success: false,
      orderId: data.orderId,
      message: e.message,
    });
  }
};
// -----------------------------
exports.payout = async (req, res) => {
  const data = req.body;
  console.log("payout-data", data);
  const generateAlphaId = customAlphabet(alphabet, 8);
  
  // Validation checks (same as before)
  if (
    !data.mid ||
    !data.provider ||
    !data.orderId ||
    !data.payeeId ||
    !data.payeeAccount ||
    !data.callbackUrl ||
    !data.amount ||
    !data.currency
  ) {
    return res.status(200).json({
      success: false,
      orderId: data.orderId,
      message: "Required fields are not filled out.",
    });
  }
  
  if (
    (data.currency === "BDT" || data.currency === "INR") &&
    (parseFloat(data.amount) < 10 || parseFloat(data.amount) > 25000)
  ) {
    return res.status(200).json({
      success: false,
      orderId: data.orderId,
      message: `Withdraw amount should be in 10 ~ 25000 for ${data.currency} currency.`,
    });
  } else if (
    data.currency === "USD" &&
    (parseFloat(data.amount) < 10 || parseFloat(data.amount) > 2000)
  ) {
    return res.status(200).json({
      success: false,
      orderId: data.orderId,
      message: "Withdraw amount should be in 10 ~ 2000 for USD currency.",
    });
  }

  try {
    const merchant = await User.findOne({
      name: data.mid,
      status: "activated",
    });
    if (!merchant) {
      return res.status(200).json({
        success: false,
        orderId: data.orderId,
        message: "There is not existing activated merchant with API key",
      });
    }

    // Check for duplicate orderId across all agents' withdrawalRequests
    const agentWithDuplicateRequest = await Agent_model.findOne({
      "withdrawalRequests.orderId": data.orderId
    });
    
    if (agentWithDuplicateRequest) {
      return res.status(200).json({
        success: false,
        orderId: data.orderId,
        message: "Transaction with duplicated order id, " + data.orderId + ".",
      });
    }

    // Create the payout transaction (same as before)
    const paymentId = generateAlphaId();
    const newTransaction = await PayoutTransaction.create({
      paymentId,
      merchant: data.mid,
      provider: data.provider,
      orderId: data.orderId,
      payeeId: data.payeeId,
      payeeAccount: data.payeeAccount,
      requestAmount: data.amount,
      currency: data.currency,
      callbackUrl: data.callbackUrl,
      status: "assigned",
    });

    if (!newTransaction) {
      return res.status(500).json({
        success: false,
        orderId: data.orderId,
        message: "Failed to send request!",
      });
    }

    // Prepare withdrawal request data for agent
    const withdrawalRequestData = {
      amount: data.amount,
      currency: data.currency,
      method: data.provider,
      transactionId: paymentId,
      status: "pending",
      merchantReference: data.orderId,
      merchantId: data.mid,
      isWithdrawalRequest: true,
      notes: `Withdrawal request for ${data.payeeId}`,
      date: new Date(),
      orderId: data.orderId, // Adding orderId to easily track duplicates
      payeeAccount: data.payeeAccount,
    };
   console.log("withdrawalRequestData",withdrawalRequestData)
    // Find all active agents that can handle this currency
    const eligibleAgents = await Agent_model.find({
      status: "activated",
      account_type:"main",
      $or: [
        { "balance_in_bdt": { $gte: (data.currency === "BDT" || data.currency === "INR") ? data.amount : 0 } }
      ]
    });

    if (eligibleAgents.length === 0) {
      return res.status(200).json({
        success: false,
        orderId: data.orderId,
        message: "No available agents with sufficient balance to process this withdrawal.",
      });
    }

    // Randomly select an agent
    const randomAgent = eligibleAgents[Math.floor(Math.random() * eligibleAgents.length)];
    
    // Add the withdrawal request to the selected agent
    await Agent_model.findByIdAndUpdate(
      randomAgent._id,
      { $push: { withdrawalRequests: withdrawalRequestData } }
    );

    // Send Telegram notification (same as before)
    const payoutPayload =
      `**💸 Payout Request ! 💸**\n` +
      `\n` +
      `**🧑‍💻 Player ID:** \`${data.payeeId}\`\n` + 
      `**💳 Payment ID:** \`${paymentId}\`\n` + 
      `**📦 Order ID:** \`${data.orderId}\`\n` +
      `**💰 Amount Requested:** ${data.currency} **${data.amount}**\n` +
      `**👤 Payee Account:** \`${data.payeeAccount}\`\n` +
      `**✅ Payout Status:** *Assigned*\n` +
      `**🎯 Assigned Agent:** ${randomAgent.name} (${randomAgent.accountNumber})\n` +
      `\n` +
      `🎉 *Payout request processed successfully.* 🎉`;

    easypay_request_payout_bot.sendMessage(-4692407327, payoutPayload, {
      parse_mode: "Markdown",
    });

    // Handle merchant callback (same as before)
    if (data.mid !== "easypay") {
      const hash = generate256Hash(
        paymentId +
          newTransaction.orderId +
          newTransaction.requestAmount.toString() +
          newTransaction.currency +
          merchant.apiKey
      );

      let paybody = {
        success: true,
        paymentId: paymentId,
        orderId: newTransaction.orderId,
        amount: newTransaction.requestAmount,
        currency: newTransaction.currency,
        transactionId: "",
        status: newTransaction.status,
        hash,
      };

      await axios
        .post(data.callbackUrl, paybody, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        })
        .then(async (resp) => {
          console.log("payout-callback-to-mechant-resp", resp.data);
          if (resp.data.success) {
            newTransaction.sentCallbackDate = new Date();
            await newTransaction.save();
          }
        })
        .catch((e) => {
          console.log("payout-callback-to-mechant-resp-error", e.message);
        });
    }

    return res.status(200).json({
      success: true,
      message: "Payout request received and assigned to an agent.",
      orderId: data.orderId,
      link: data.callbackUrl,
      paymentId,
      assignedAgent: randomAgent.name,
    });
  } catch (e) {
    console.log("payout-general-error", e.message);
    res.status(500).json({
      success: false,
      orderId: data.orderId,
      message: e.message,
    });
  }
};
exports.checkout = async (req, res) => {
  const { paymentId } = req.body;
  console.log("checkout-paymentId", paymentId);
    const apiKey = req.headers['x-api-key']?req.headers['x-api-key']:'';
    const data = req.body;
    console.log('bkash-payment-data', req.body.payerId);
    const matchapikey=await User.findOne({apiKey});
    console.log(matchapikey)
    // if(!matchapikey){
    //  return  res.status(200).json({
    //     success: false,
    //     message: "Merchant does not exist."
    //   })
    // }
  const { mid } = req.params;

  try {
    // 1. Find the payment transaction
    const match_payment = await PayinTransaction.findOne({ paymentId });
    if (!match_payment) {
      return res.status(404).send({ success: false, message: "Payment ID not found!" });
    }

    const expectedAmount = Number(match_payment.expectedAmount || 0);
    console.log("Expected Amount:", expectedAmount);

    // 2. Find all agents for the merchant
    const match_agent = await Agent_model.find({status:"activated",merchant_name: match_payment.merchant,api_account:false,account_type:"agent",mfs:match_payment.provider});
    if (!match_agent || match_agent.length === 0) {
      return res.send({ success: false, message: "No agents available for this merchant" });
    }

    // Debug: Log agent balances
    match_agent.forEach(agent => {
      console.log(`Agent: ${agent.name || agent._id}, Balance: ${agent.balance_in_bdt}, Limit Remaining: ${agent.limitRemaining}`);
    });

    // 3. Filter agents with sufficient balance AND limitRemaining
    const eligibleAgents = match_agent.filter(agent => {
      const balance = Number(agent.balance_in_bdt || 0);
      const limitRemaining = Number(agent.limitRemaining || 0);
      return !isNaN(balance) && !isNaN(limitRemaining) &&
        // balance >= expectedAmount && limitRemaining >= expectedAmount;
        balance >= expectedAmount 

    });

    // Debug: Log eligible agents
    console.log("Eligible Agents:", eligibleAgents);

    if (eligibleAgents.length === 0) {
      return res.status(400).send({
        success: false,
        message: "No agents available with sufficient balance and limit",
        requiredAmount: expectedAmount
      });
    }

    // 4. Randomly select an eligible agent
    const randomIndex = Math.floor(Math.random() * eligibleAgents.length);
    const selectedAgent = eligibleAgents[randomIndex];

    console.log("Selected Agent:", selectedAgent);

    // 5. Return response
    return res.status(200).send({
      success: true,
      data: match_payment,
      agent: selectedAgent
    });
console.log(selectedAgent)
  } catch (error) {
    console.error("Checkout error:", error);
    return res.status(500).send({
      success: false,
      message: "An error occurred during checkout",
      error: error.message || error
    });
  }
};


exports.payment_submit = async (req, res) => {
  console.log("---payment-submit-data---");
  const { paymentId, provider, agentAccount, payerAccount, transactionId } = req.body;
  const currentTime = new Date();

  try {
    // 1. Validate forwarded SMS
    const forwardedSms = await ForwardedSms.findOne({
      transactionId,
      transactionType: "payin",
      provider: { $regex: new RegExp(`^${provider}$`, 'i') },
      agentAccount,
      customerAccount: payerAccount,
    });

    if (!forwardedSms) {
      return res.status(200).json({
        success: false,
        type: "tid",
        message: "Transaction ID is not valid.",
      });
    }

    // 2. Prevent duplicate transactions
    const transaction_old = await PayinTransaction.findOne({ transactionId });
    if (transaction_old) {
      return res.status(200).json({
        success: false,
        type: "tid",
        message: "Transaction ID is used already.",
      });
    }

    // 3. Validate payment ID
    const transaction = await PayinTransaction.findOne({ paymentId });
    if (!transaction) {
      return res.status(200).json({
        success: false,
        type: "pid",
        message: "There is no transaction with your payment id.",
      });
    }

    const expirationDuration = 24 * 60 * 60 * 1000;
    const elapsedTime = currentTime - transaction.createdAt;

    // 4. Update transaction
    transaction.agentAccount = forwardedSms.agentAccount;
    transaction.payerAccount = forwardedSms.customerAccount;
    transaction.transactionId = forwardedSms.transactionId;
    transaction.receivedAmount = forwardedSms.transactionAmount;
    transaction.balanceAmount = forwardedSms.balanceAmount;
    transaction.transactionDate = forwardedSms.transactionDate;
    transaction.submitDate = currentTime;
    transaction.statusDate = currentTime;
    transaction.status = elapsedTime > expirationDuration ? "expired" : "fully paid";
    await transaction.save();

    // 5. Update AgentNumber limit
    const agentNumber = await AgentNumber.findOne({ agentAccount });
    if (agentNumber) {
      agentNumber.limitRemaining -= parseFloat(forwardedSms.transactionAmount);
      await agentNumber.save();
    }

    // 6. Update Agent_model balance & add deposit
    const agent = await Agent_model.findOne({ accountNumber: agentAccount });
    console.log("agentagent",agent)
if (!agent.createdby_id) {
    console.error("Agent has no createdby_id");
    return res.status(400).json({ success: false, message: "Agent has no parent agent" });
}
const main_agent = await Agent_model.findById(agent.createdby_id);
if (!main_agent) {
    console.error("Main agent not found");
    return res.status(404).json({ success: false, message: "Parent agent not found" });
}
    console.log("main_agent",main_agent)
    if (main_agent) {
      const newDeposit = {
        amount: forwardedSms.transactionAmount,
        currency: forwardedSms.currency || "BDT",
        date: currentTime,
        transactionId: forwardedSms.transactionId,
        status: "fully paid",
        method: provider,
        notes: `Deposit from ${payerAccount}`,
        processedBy: "system"
      };
      const agent_commission = (forwardedSms.transactionAmount / 100) * agent.commission_rate;

      // if (forwardedSms.currency === "USD") {
      //   agent.balance_in_dollar += parseFloat(forwardedSms.transactionAmount);
      // } else {
      //   agent.balance_in_bdt += parseFloat(forwardedSms.transactionAmount);
      // }
      agent.balance_in_bdt -= parseFloat(forwardedSms.transactionAmount);
      agent.commission += agent_commission;
      main_agent.balance_in_bdt-=parseFloat(forwardedSms.transactionAmount);
      main_agent.remain_balance-=parseFloat(forwardedSms.transactionAmount);
      main_agent.deposits.push(newDeposit);

      main_agent.commission+= agent_commission;
      await main_agent.save();
      await agent.save();
    }

    // 7. Telegram Notifications
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
      return res.status(200).json({
        success: false,
        type: "pid",
        message: "Your payment transaction is expired.",
      });
    }

    // 8. Send callback to merchant
    try {
      const callbackResp = await axios.post(transaction.callbackUrl, {
        paymentId: transaction.paymentId,
        transactionId: transaction.transactionId,
        amount: forwardedSms.transactionAmount,
        player_id: transaction.payerId,
        status: "success",
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      });

      transaction.sentCallbackDate = new Date();
      await transaction.save();

      if (!callbackResp.data.success) {
        return res.status(200).json({
          success: false,
          message: "Callback has not been sent to the merchant successfully"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Callback has been sent to the merchant successfully",
        data: transaction
      });
    } catch (callbackErr) {
      console.error('Callback error:', callbackErr.message);
      return res.status(200).json({
        success: false,
        message: "Callback to the merchant failed"
      });
    }
  } catch (error) {
    console.error("payment-submit-error", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


exports.change_payment_status = async (req, res) => {
  const { id, status,admin_name} = req.body;
  
  if (!id || !status) {
    return res.status(400).json({ message: 'Please check all fields' });
  }

  try {
    const transaction = await PayinTransaction.findById(id);
    if (!transaction) throw Error('Transaction does not exists');

    transaction.status = status;
    transaction.statusDate = new Date();
    transaction.update_by=admin_name;
       // Find the user
    const user = await merchant_model.findOne({player_id:transaction.payerId});
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    console.log(transaction.payerId)
     console.log(status)
    const savedTransaction = await transaction.save();
     // If the status is 'fully paid', update the user's balance
    if (status === 'fully paid') {
      user.balance += transaction.expectedAmount;
      console.log(transaction.expectedAmount)
   const payload =
  `**🎉 Payment Status Update! 🎉**\n` +
  `\n` +
  `**🧑‍💻 Player ID:** \`${transaction.payerId}\`\n` +
  `**💳 Payment ID:** \`${transaction.paymentId}\`\n` +
  `**📦 Order ID:** \`${transaction.orderId}\`\n` +
  `**💰 Amount Received:** ${transaction.currency} **${transaction.expectedAmount}**\n` +
  `**✅ New Status:** *Fully Paid* ✅\n` +
  `\n` +
  `🎉 *Transaction completed successfully. Thank you for using our service!* 🎉`;

easypay_payin_bot.sendMessage(7920367057, payload, {
  parse_mode: "Markdown",
});
easypay_bot.sendMessage(7920367057, payload, {
  parse_mode: "Markdown",
});
      await user.save();
      return res.status(200).json({
        message: 'Deposit status updated to fully paid and balance credited',
        balance: user.balance,
      });
    }
    if (!savedTransaction) throw Error('Something went wrong saving the status of transaction');
    
    let result = {
      success: true,
    };

    if (transaction.callbackUrl && (status === 'fully paid' || status === 'partially paid' || status === 'suspended')) {
      
      const merchant = await User.findOne({name: transaction.merchant, role: 'merchant'});
      if (!merchant) throw Error('Merchant does not exist for callback');

      const hash = generate256Hash(transaction.paymentId + transaction.orderId + transaction.receivedAmount.toString() + transaction.currency + merchant.apiKey);

      let payload = {
        paymentId: transaction.paymentId,
        orderId: transaction.orderId,
        amount: transaction.receivedAmount,
        currency: transaction.currency,
        transactionId: transaction.transactionId,
        status,
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
        console.log('change-payment-status-callback-to-mechant-resp', resp.data);
        if (resp.data.success) {
          transaction.sentCallbackDate = new Date();
          await transaction.save();
        }
        return {
          success: true,
          message: 'Callback has been sent to the merchant successfully'
        }; 
      })
      .catch((e) => {
        console.log('change-payment-status-callback-to-mechant-resp-error', e.message);
        return {
          success: false,
          message: 'Callback to the merchant failed'
        };   
      });
    }

    res.status(200).json(result);

  } catch (e) {
    res.status(400).json({ 
      success: false,
      error: e.message 
    });
  }
};
exports.change_payout_status = async (req, res) => {
  const { id, status,payment_id, transactionId, admin_name } = req.body;
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
    const transaction = await PayoutTransaction.findOne({paymentId:payment_id});
    console.log("dfsfd",transaction)
    const forwardedSms = await ForwardedSms.findOne({
      transactionId: transactionId,
      transactionAmount: transaction.requestAmount,
      transactionType: "payout"
    });
    console.log(forwardedSms);

    if (!forwardedSms) {
      return res.status(200).json({
        success: false,
        type: "tid",
        message: "Transaction ID is not valid.",
      });
    }

    if (forwardedSms.status === "used") {
      return res.status(200).json({
        success: false,
        type: "tid",
        message: "Transaction ID is already used.",
      });
    }
// ---------------------------UPDATE-AGENT-DATA---------------------
 // Find the agent with a withdrawal request matching the transactionId
    const agentwithdraw = await Agent_model.findOne({
      "withdrawalRequests.transactionId": transaction.paymentId
    });

    if (!agentwithdraw) {
      console.log("No agent found with a withdrawal request matching transaction ID:", transaction.paymentId);
      return null;
    }

    // Find the specific withdrawal request
 const result = await Agent_model.findOneAndUpdate(
  {
    _id: agentwithdraw._id,
    "withdrawalRequests.transactionId": transaction.paymentId
  },
  {
    $set: { "withdrawalRequests.$.status": "success" }
  },
  { new: true } // Returns the updated document
);

if (!result) {
  console.log("Failed to update withdrawal request");
} else {
  console.log("Withdrawal request updated successfully");
}
    if (status === "success") {
      // Update ForwardedSms status to "used"
      forwardedSms.status = "used";
      await forwardedSms.save();
    }

    // Update the transaction status
    transaction.status = status;
    transaction.statusDate = new Date();
    const savedTransaction = await transaction.save();

    // Update transaction details
    await PayoutTransaction.findByIdAndUpdate(
      { _id: transaction._id },
      {
        $set: {
          transactionId: transactionId,
          createdAt: requestTime,
          sentAmount: forwardedSms.transactionAmount,
          update_by: admin_name,
          agent_account:ForwardedSms.agentAccount
        },
      }
    );
 const agent = await Agent_model.findOne({ accountNumber: forwardedSms.agentAccount });
       if (!agent) {
    console.error("Agent has no account");
    return res.status(400).json({ success: false, message: "Agent has no account" });
}
    // NEW: Update Agent model with withdrawal information
    if (status === "success") {
     
      console.log(agent)
      if (!agent.createdby_id) {
    console.error("Agent has no createdby_id");
    return res.status(400).json({ success: false, message: "Agent has no parent agent" });
}
const main_agent = await Agent_model.findById(agent.createdby_id);
if (!main_agent) {
    console.error("Main agent not found");
    return res.status(404).json({ success: false, message: "Parent agent not found" });
}
      if (agent) {
        const newWithdrawal = {
          amount: forwardedSms.transactionAmount,
          currency: transaction.currency || "BDT", // Default to BDT if not specified
          date: new Date(),
          transactionId: forwardedSms.transactionId,
          status: "completed",
          method: forwardedSms.provider || "unknown",
          notes: `Withdrawal to ${transaction.payeeAccount}`,
          processedBy: admin_name || "system"
        };
       const agent_commission = (forwardedSms.transactionAmount / 100) * agent.withdraw_commission_rate;

      agent.balance_in_bdt+=forwardedSms.transactionAmount;
      agent.limitRemaining-=forwardedSms.transactionAmount;
      agent.commission+=agent_commission;
      main_agent.balance_in_bdt+=forwardedSms.transactionAmount;
      main_agent.commission+=agent_commission;
      main_agent.remain_balance+=forwardedSms.transactionAmount;
        // Add the withdrawal to the agent's withdrawals array
        main_agent.withdrawals.push(newWithdrawal);
        await main_agent.save();
        await agent.save();
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
        `**Transaction ID:** \`${forwardedSms.transactionId}\`\n` +
        `**Payment ID:** \`${transaction.paymentId}\`\n` +
        `**Order ID:** \`${transaction.orderId}\`\n` +
        `**Amount Sent:** ${transaction.currency} ${forwardedSms.transactionAmount}\n` +
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
    res.status(400).json({
      success: false,
      error: e.message,
    });
    console.log(e);
  }
};

exports.resend_callback_payment = async (req, res) => {
  const {id} = req.body;
  if (!id) {
    return res.status(400).json({ message: 'Please check all fields' });
  }

  try {
    const transaction = await PayinTransaction.findById(id);
    if (!transaction) throw Error('Transaction does not exists');

    let result = {
      success: true,
    };

    if (transaction.callbackUrl) {
      
      const merchant = await User.findOne({name: transaction.merchant, role: 'merchant'});
      if (!merchant) throw Error('Merchant does not exists for callback');

      const hash = generate256Hash(transaction.paymentId + transaction.orderId + transaction.receivedAmount.toString() + transaction.currency + merchant.apiKey);

      let payload = {
        paymentId: transaction.paymentId,
        orderId: transaction.orderId,
        amount: transaction.receivedAmount,
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
        console.log('resend-callback-payment-to-mechant-resp', resp.data);
        if (resp.data.success) {
          transaction.sentCallbackDate = new Date();
          await transaction.save();
        }
        return {
          success: true,
          message: 'Callback has been sent to the merchant successfully'
        }; 
      })
      .catch((e) => {
        console.log('resend-callback-payment-to-mechant-resp-error', e.message);
        return {
          success: false,
          message: 'Callback to the merchant failed'
        };   
      });
    }

    res.status(200).json(result);

  } catch (e) {
    res.status(400).json({ 
      success: false,
      error: e.message 
    });
  }
};

exports.resend_callback_payout = async (req, res) => {
  const {payment_id } = req.body;

  if (!payment_id) {
    return res.status(400).json({ message: 'Please check all fields' });
  }
  console.log(req.body)
  try {
        const transaction = await PayoutTransaction.findOne({paymentId:payment_id});
    if (!transaction) throw Error('Transaction does not exists');

    let result = {
      success: true,
    };

    if (transaction.callbackUrl) {
      
      const merchant = await User.findOne({name: transaction.merchant, role: 'merchant'});
      if (!merchant) throw Error('Merchant does not exists for callback');

      const hash = generate256Hash(transaction.paymentId + transaction.orderId + transaction.sentAmount.toString() + transaction.currency + merchant.apiKey);

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
    res.status(400).json({ 
      success: false,
      error: e.message 
    });
  }
};
// ------------main callback sms----------
exports.callback_sms = async (req, res) => {
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

  const agentNumber = await AgentNumber.findOne({agentAccount});
  if (agentNumber) { // agent number's balance and remaining limit should be updated with transaction amount
    agentNumber.balanceAmount = balanceAmount;
    if (transactionType === 'payin') {
      agentNumber.limitRemaining = parseFloat(agentNumber.limitRemaining) - parseFloat(transactionAmount);
    }
    await agentNumber.save();
  }

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

};
// Schedule the task to run daily at midnight (00:00)
cron.schedule('0 0 * * *', async () => {
  try {

    const documentsToUpdate = await AgentNumber.find({});

    // Update each document to set remainingDailyLimit to dailyLimit
    const updatePromises = documentsToUpdate.map(async (doc) => {
      doc.limitRemaining = doc.limitAmount;
      await doc.save();
    });

    await Promise.all(updatePromises);

    console.log('Daily task completed successfully');
  } catch (error) {
    console.error('Error running daily task:', error);
  }
});
