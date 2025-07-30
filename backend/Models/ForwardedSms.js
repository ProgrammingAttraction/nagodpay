const mongoose = require("mongoose");


const ForwardedSmsSchema = new mongoose.Schema(
  {
    provider: String, // BKASH Agent, Nagad Agent, Rocket Agent, Upay Agent
    agentAccount: String,
    customerAccount: String,
    transactionType: String, // payin, payout
    currency: {
      type: String,
      enum: ["BDT", "INR", "USD"],
      default: "BDT",
    },
    transactionAmount: Number,
    feeAmount: Number,
    balanceAmount: Number,
    transactionId: String,
    transactionDate: Date,
    sentStamp: String,
    receivedStamp: String,
    status: {
      type: String,
      enum: ["arrived", "used", "confirmed"],
      default: "arrived",
    },
  expireAt: {
      type: Date,
      default: () => new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Set to 5 days from now
      expires: 0, // TTL index for automatic deletion
    },
  },
  { timestamps: true }
);

const ForwardedSms = mongoose.model("ForwardedSms", ForwardedSmsSchema);
module.exports=ForwardedSms;
