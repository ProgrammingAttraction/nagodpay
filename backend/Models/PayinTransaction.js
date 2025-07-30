const mongoose = require("mongoose");

const PayinTransactionSchema = new mongoose.Schema(
  {
    paymentId: String,
    provider: String, // bkash, nagad, rocket, upay
    orderId: String,
    payerId: String,
    payerAccount: String,
    agentAccount: String,
    transactionId: String,
    referenceId: String, // for p2c merchantInvoiceNumber
    expectedAmount: Number,
    receivedAmount: Number,
    balanceAmount: Number,
    redirectUrl: String,
    callbackUrl: String,
    sentCallbackDate: Date,
    merchantid:String,
    userid:String,
    currency: {
      type: String,
      enum: ["BDT", "INR", "USD"],
      default: "BDT",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "completed",
        "rejected",
        "expired",
        "suspended"
      ],
      default: "pending",
    },
    transactionDate: Date,
    submitDate: Date,
    statusDate: Date,
    paymentType: String, // 'p2p' or 'p2c'
    mode: {
      type: String,
      enum: ["test", "live"],
      default: "live",
    },
    update_by:{
      type:String,
      default:""
    },
    expireAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Set to 1 month (30 days) from now
      expires: 0, // TTL index for automatic deletion
    },
  },
  { timestamps: true }
);

// Creating a text index for full-text search (optional)
PayinTransactionSchema.index({
  merchant: "text",
  mode: "text",
  transactionId: "text",
  orderId: "text",
  paymentId: "text",
  provider: "text",
  agentAccount: "text",
  payerAccount: "text",
  payerId: "text",
  status: "text",
});

// Model creation
const PayinTransaction = mongoose.model("PayinTransaction", PayinTransactionSchema);
module.exports=PayinTransaction;
