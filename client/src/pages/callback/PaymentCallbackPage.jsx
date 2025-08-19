/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from "react-router-dom";
import moment from "moment";

function PaymentCallbackPage() {
  const base_url2 = import.meta.env.VITE_API_KEY_Base_URL2;

  const [paymentparams] = useSearchParams();
  const [transaction_info, set_transaction_info] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(true);
  const [executionCompleted, setExecutionCompleted] = useState(false);
  
  const transactionId = paymentparams.get("paymentID");
  const status = paymentparams.get("status");

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

  // Function to navigate to Google homepage
  const navigateToGoogle = () => {
    window.location.href = "https://www.google.com";
  };

  // This function triggers the backend to execute the payment
  const triggerPaymentExecution = async () => {
    try {
      // This API call should trigger your backend's callback_bkash function
      // The backend will handle the actual payment execution with bKash
      await axios.post(`https://api.nagodpay.com/api/payment/p2c/bkash/callback`, {
        paymentID: transactionId,
        status: status
      });
      setExecutionCompleted(true);
    } catch (error) {
      console.error("Error triggering payment execution:", error);
    }
  };

  const fetchTransactionStatus = async () => {
    try {
      setLoading(true);
      
      // First trigger the payment execution on backend
      if (status === 'success') {
        await triggerPaymentExecution();
      }
      
      // Then fetch the updated transaction status
      const { data: transactionResponse } = await axios.get(`${base_url2}/api/payment/transaction-status/${transactionId}`);
      
      if (transactionResponse.success) {
        set_transaction_info(transactionResponse.data);
      }
    } catch (error) {
      console.error("Error fetching transaction status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (transactionId) {
      fetchTransactionStatus();
    }
  }, [transactionId]);

  // Auto-reload the page after execution is completed
  useEffect(() => {
    if (executionCompleted) {
      // Reload the page after a short delay to show the updated status
      const timer = setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [executionCompleted]);

  if (loading) {
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
          <div className="text-white">Processing payment execution...</div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center font-anek items-center bg-gray-900 py-10">
      <div className="w-full max-w-4xl px-4 sm:px-6 md:px-8">
        <div className="text-center mb-6">
          <h1 className="text-[20px] xl:text-3xl font-semibold text-white">Payment Status</h1>
          <p className="text-[16px] xl:text-lg text-gray-400">Your payment details are below</p>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg xl:text-xl font-semibold text-white">
              Payment Status: <span className={`text-${transaction_info.status === 'success' || transaction_info.status === 'completed' ? 'green' : 'red'}-500`}>
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
          <button 
            onClick={navigateToGoogle}
            className="inline-block px-6 py-3 text-lg font-semibold text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition duration-300"
          >
            Exit Page
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentCallbackPage;