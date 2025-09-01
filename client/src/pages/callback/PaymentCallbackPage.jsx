/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from "react-router-dom";
import moment from "moment";

function PaymentCallbackPage() {
  const base_url = "https://api.nagodpay.com";
  const base_url2 = "https://api.nagodpay.com";

  const [paymentparams] = useSearchParams();
  const user_info = JSON.parse(localStorage.getItem("user"));

  const [transaction_info, set_transaction_info] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amount, set_amount] = useState();
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(true);
  
  const transactionId = paymentparams.get("paymentID");
  const status = paymentparams.get("status");

  const executePaymentCallback = async () => {
    try {
      const response = await axios.post(`${base_url2}/api/payment/p2c/bkash/callback`, {
        payment_type: "Deposit",
        amount: amount,
        payment_method: transaction_info?.provider,
        status: status === "cancel" ? "failed" : status,
        customer_id: "dsf2323sfdsf",
        paymentID: transactionId,
      });
      console.log("callback",response)
      return response.data;
    } catch (error) {
      console.error("Error processing payment:", error);
      return false;
    }
  };

  useEffect(() => {
    let interval;
    if (showProgress) {
      interval = setInterval(() => {
        setProgress((oldProgress) => {
          if (oldProgress >= 100) {
            clearInterval(interval);
            setShowProgress(false);
            return 100;
          }
          return oldProgress + 30;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showProgress]);

  const user_money_info = async () => {
    try {
      setLoading(true);
      const { data: transactionResponse } = await axios.get(`${base_url2}/api/payment/transaction-status/${transactionId}`);
      
      if (transactionResponse.success) {
        const transactionData = transactionResponse.data;
        set_transaction_info(transactionData);
        set_amount(transactionData.expectedAmount);

       const { data: paymentResult } = await executePaymentCallback();
          console.log('paymentResult', paymentResult);
      }
    } catch (error) {
      console.error("Error in user_money_info:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (transactionId) {
      user_money_info();
    }
  }, [transactionId]);

  if (loading || !transaction_info) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900 py-10">
        {showProgress ? (
          <div>
            <h1 className='text-center text-white font-[500] text-[18px] xl:text-[20px] font-bai mb-[10px]'>Payment Is Processing...</h1>
            <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="text-white">Loading payment details...</div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900 py-10">
      <div className="w-full max-w-4xl px-4 sm:px-6 md:px-8">
        <div className="text-center mb-6">
          <h1 className="text-[20px] xl:text-3xl font-semibold text-white">Payment Status</h1>
          <p className="text-[16px] xl:text-lg text-gray-400">Your payment details are below</p>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg xl:text-xl font-semibold text-white">
              Payment Status: <span className={`text-${transaction_info.status === 'success' ? 'green' : 'red'}-500`}>
                {transaction_info.status}
              </span>
            </span>
            <span className="text-sm text-gray-400">
              {moment(transaction_info.createdAt).format("MMMM Do YYYY, h:mm A")}
            </span>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between text-gray-400">
              <span>Transaction ID:</span>
              <span className="font-medium text-white">{transaction_info?.paymentId}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Amount:</span>
              <span className="font-medium text-white">৳{transaction_info?.expectedAmount}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Payment Method:</span>
              <span className="font-medium text-orange-300">{transaction_info?.provider}</span>
            </div>
          </div>
        </div>
        <div className="mt-6 text-center">
          <a href="/" className="inline-block px-6 py-3 text-lg font-semibold text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition duration-300">
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

export default PaymentCallbackPage;