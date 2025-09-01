/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from "react-router-dom";
import moment from "moment";

function PaymentCallbackPage() {
  const base_url2 = "https://api.nagodpay.com";
  const [paymentparams] = useSearchParams();
  const navigate = useNavigate();
  
  const [transaction_info, set_transaction_info] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [amount, set_amount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(true);
  const [reloadCount, setReloadCount] = useState(0);
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [user_info, setUserInfo] = useState(null);
  
  const transactionId = paymentparams.get("paymentID");
  const status = paymentparams.get("status");

  // Fetch user info from localStorage or context
  const fetchUserInfo = async () => {
    try {
      // In a real app, you would get this from context, localStorage, or an API call
      const userData = JSON.parse(localStorage.getItem('userInfo')) || { _id: 'user123' };
      setUserInfo(userData);
      return userData;
    } catch (err) {
      console.error("Error fetching user info:", err);
      return null;
    }
  };

  // This function calls your backend API which should handle the balance deduction
  const executePaymentCallback = async (transactionData) => {
    try {
      const response = await axios.post(`${base_url2}/api/payment/p2c/bkash/callback`, {
        payment_type: "Deposit",
        amount: transactionData?.expectedAmount || amount,
        payment_method: transactionData?.provider || "bkash",
        status: status === "cancel" ? "failed" : status,
        customer_id: user_info?._id,
        paymentID: transactionId,
      });
      
      if (response.data.success) {
        setPaymentProcessed(true);
        console.log("Balance deduction completed on server");
      } else {
        setError("Failed to process payment: " + (response.data.message || "Unknown error"));
      }
      
      return response.data;
    } catch (error) {
      console.error("Error processing payment:", error);
      setError("Failed to process payment callback");
      return false;
    }
  };

  // Progress bar effect
  useEffect(() => {
    let interval;
    if (showProgress && loading) {
      interval = setInterval(() => {
        setProgress((oldProgress) => {
          if (oldProgress >= 100) {
            clearInterval(interval);
            return 100;
          }
          return oldProgress + 30;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showProgress, loading]);

  // Auto-reload effect
  useEffect(() => {
    if (reloadCount < 3 && !loading && !transaction_info) {
      const timer = setTimeout(() => {
        console.log(`Auto-reloading, attempt ${reloadCount + 1}/3`);
        setReloadCount(prev => prev + 1);
        user_money_info();
        executePaymentCallback();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [reloadCount, loading, transaction_info]);

  const user_money_info = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!transactionId) {
        setError("No transaction ID provided");
        setLoading(false);
        return;
      }

      // First, get user info
      await fetchUserInfo();
      
      // Then get transaction details
      const { data: transactionResponse } = await axios.get(
        `${base_url2}/api/payment/transaction-status/${transactionId}`
      );
      
      if (transactionResponse) {
        const transactionData = transactionResponse.data;
        set_transaction_info(transactionData);
        set_amount(transactionData.expectedAmount || 0);
        
        // Execute payment callback after we have transaction data
        const paymentResult = await executePaymentCallback(transactionData);
        console.log('Payment callback result:', paymentResult);
      } else {
        setError("Failed to fetch transaction details");
      }
    } catch (error) {
      console.error("Error in user_money_info:", error);
      setError("An error occurred while processing your payment");
    } finally {
      setLoading(false);
      setShowProgress(false);
    }
  };

  useEffect(() => {
      user_money_info();
  }, []);

  const handleDepositAgain = () => {
    navigate('/payment-methods');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900 py-10">
        <div className="text-center">
          <h1 className='text-center text-white font-[500] text-[18px] xl:text-[20px] font-bai mb-[10px]'>
            Payment Is Processing...
          </h1>
          <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden mx-auto">
            <div
              className="h-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-gray-400 mt-4">Please wait while we confirm your payment</p>
          {reloadCount > 0 && (
            <p className="text-gray-500 text-sm mt-2">
              Checking status... ({reloadCount}/3)
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error && reloadCount >= 3) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900 py-10">
        <div className="w-full max-w-2xl px-4">
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-white mb-2">Payment Error</h2>
            <p className="text-gray-300 mb-4">{error}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
              <button 
                onClick={handleDepositAgain}
                className="px-6 py-2 text-lg font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition duration-300"
              >
                Deposit Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-anek justify-center items-center bg-gray-900 py-10">
      <div className="w-full max-w-4xl px-4 sm:px-6 md:px-8">
        <div className="text-center mb-6">
          <h1 className="text-[20px] xl:text-3xl font-semibold text-white">Payment Status</h1>
          <p className="text-[16px] xl:text-lg text-gray-400">Your payment details are below</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg xl:text-xl font-semibold text-white">
              Payment Status:{" "}
              <span className={`${transaction_info?.status === 'completed' ? 'text-green-500' : 
                               transaction_info?.status === 'failed' ? 'text-red-500' : 
                               transaction_info?.status === 'pending' ? 'text-yellow-500' : 'text-gray-500'}`}>
                {transaction_info?.status ? transaction_info.status.toUpperCase() : "UNKNOWN"}
              </span>
            </span>
            <span className="text-sm text-gray-400">
              {transaction_info?.createdAt ? moment(transaction_info.createdAt).format("MMMM Do YYYY, h:mm A") : "N/A"}
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between text-gray-400">
              <span>Transaction ID:</span>
              <span className="font-medium text-white break-all ml-4 text-right">
                {transaction_info?.paymentId || transactionId || "N/A"}
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Amount:</span>
              <span className="font-medium text-white">৳{transaction_info?.expectedAmount || amount || "0"}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Payment Method:</span>
              <span className="font-medium text-orange-300">{transaction_info?.provider || "N/A"}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Balance Deduction:</span>
              <span className="font-medium text-white">
                {paymentProcessed ? "Completed Successfully" : "Not Processed Yet"}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={() => navigate('/payment-methods')}
            className="px-6 py-2 text-[15px] font-semibold text-white cursor-pointer bg-indigo-600 rounded-[3px] hover:bg-indigo-700 transition duration-300"
          >
           Deposit Again
          </button>
          <button 
            onClick={handleDepositAgain}
            className="px-6 py-2 text-[15px] font-semibold text-white cursor-pointer bg-green-600 rounded-[3px] hover:bg-green-700 transition duration-300"
          >
            Withdrawal Again
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentCallbackPage;