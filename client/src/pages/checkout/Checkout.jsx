import React, { useState, useRef, useEffect } from "react";
import { FaRegCopy, FaClipboard } from "react-icons/fa";
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { nanoid } from "nanoid";
import axios from "axios";
import toast, { Toaster } from 'react-hot-toast';
import logo from '../../assets/logo.png';

// Loading Animation Component
const LoadingAnimation = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.4)] bg-opacity-50 z-50">
      <div className="flex flex-col items-center">
        <div className="loader"></div>
        <p className="mt-4 text-white text-lg font-semibold">Loading Payment Details...</p>
      </div>
    </div>
  );
};

const Checkout = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [provider, setProvider] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('');
  const [payerAccount, setPayerAccount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paidStatus, setPaidStatus] = useState(0);
  const [payerAccountError, setPayerAccountError] = useState('');
  const [transactionIdError, setTransactionIdError] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [walletNumber, setWalletNumber] = useState('');
  const { paymentId } = useParams();
  const [randomAgent, setRandomAgent] = useState([]);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [transactiondata, settransactiondata] = useState([]);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false);
      setShowContent(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showContent) {
      setIsLoading(true);
      axios.post(`${base_url}/api/payment/checkout`, { paymentId })
        .then(res => {
          if (res.data.success) {
            const agentAccount = res.data.bankAccount;
            setRandomAgent(res.data.bankAccount.accountNumber)
            setProvider(agentAccount.provider);
            setWalletNumber(res.data.bankAccount.accountNumber);
          } else {
            toast.error(res.data.message);
            setPaidStatus(2);
          }
          setIsLoading(false);
        })
        .catch(err => {
          console.log(err)
          toast.error('Failed to load payment details');
          setPaidStatus(2);
          setIsLoading(false);
        });
    }
  }, [paymentId, showContent]);

  const handleCopy = () => {
    navigator.clipboard.writeText(randomAgent);
    setIsCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePayerAccountChange = (e) => {
    setPayerAccount(e.target.value);
    if (!/^[0-9]{11}$/.test(e.target.value)) {
      setPayerAccountError('Please enter a valid 11-digit account number');
    } else {
      setPayerAccountError('');
    }
  };

  const handleTransactionIdChange = (e) => {
    setTransactionId(e.target.value);
    if (!e.target.value) {
      setTransactionIdError('Please enter a transaction ID');
    } else {
      setTransactionIdError('');
    }
  };

  const handleSubmit = async () => {
    if (!payerAccount || !/^[0-9]{11}$/.test(payerAccount)) {
      setPayerAccountError('Please enter a valid 11-digit account number');
      return;
    }

    if (!transactionId) {
      setTransactionIdError('Please enter a transaction ID');
      return;
    }

    setShowLoader(true);
    setIsLoading(true);

    try {
      const res = await axios.post(`${base_url}/api/payment/paymentSubmit`, {
        paymentId,
        provider: provider,
        agentAccount: walletNumber,
        payerAccount,
        transactionId
      });

      setShowLoader(false);
      setIsLoading(false);

      if (res.data.success) {
        toast.success('Your payment has been received!');
        settransactiondata(res.data.data)
        setPaidStatus(1);
      } else {
        toast.error(res.data.message);
        if (res.data.type === 'tid') {
          setTransactionIdError(res.data.message);
        } else if (res.data.type === 'pid') {
          setPaidStatus(2);
        }
      }
    } catch (err) {
      setShowLoader(false);
      setIsLoading(false);
      toast.error('An error occurred while processing your payment');
      console.error(err);
    }
  };

  const handleCancel = () => {
    Swal.fire({
      icon: 'warning',
      title: 'Redirecting...',
      text: 'You are being redirected to the homepage',
      showConfirmButton: false,
      timer: 2000
    }).then(() => {
      navigate('/');
    });
  };

  const goToWebsite = () => {
    window.location.href = transactiondata.redirectUrl || websiteUrl;
  };

  return (
    <div className="min-h-screen font-fira bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '8px',
            background: '#fff',
            color: '#333',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
        }}
      />
      
      {showLoader && <LoadingAnimation />}
      
      {showContent && (
        <div className="bg-white rounded-xl shadow-md w-full sm:w-[80%] lg:w-[70%] xl:w-[60%] overflow-hidden">
          {/* Header with Logo */}
          <div className="bg-gradient-to-r from-theme to-blue-600 text-white p-6 text-center relative">
            <div className="absolute top-4 left-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
              <img src={logo} alt="Logo" className="w-8" />
            </div>
            <h1 className="text-2xl font-bold">NagodPay Gateway</h1>
            <p className="mt-1 text-blue-100">Complete your payment securely</p>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* Left Section - Form */}
            <div className="w-full md:w-2/3 p-8">
              {/* Payment Summary Card */}
              <div className="bg-gradient-to-r from-theme/10 to-blue-100 border border-theme/20 rounded-xl p-4 mb-6 flex items-center">
                <div className="bg-theme text-white p-3 rounded-lg mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Payment Amount</h3>
                  <p className="text-2xl font-bold text-theme">{amount} {currency}</p>
                </div>
              </div>

              {paidStatus === 1 ? (
                <div className="text-center py-8">
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mt-4">Payment Successful!</h3>
                    <p className="text-gray-600 mt-2">Your payment of {amount} {currency} has been processed successfully.</p>
                  </div>
                  <button
                    onClick={goToWebsite}
                    className="px-6 py-3 cursor-pointer bg-gradient-to-r from-theme to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-theme transition-all font-bold w-full shadow-md"
                  >
                    CONTINUE TO WEBSITE
                  </button>
                </div>
              ) : (
                <>
                  {/* Wallet Info */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <label className="block font-medium text-gray-700 mb-2">
                        Send Payment To
                        <span className="block text-xs text-gray-500">প্রাপকের ওয়ালেট তথ্য</span>
                      </label>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Wallet Provider</p>
                          <div className="flex items-center bg-white p-3 rounded-lg border border-gray-200">
                            <span className="font-medium">{provider}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Wallet Number</p>
                          <div className="flex items-center bg-white p-3 rounded-lg border border-gray-200">
                            <input
                              type="text"
                              value={randomAgent}
                              readOnly
                              className="w-full bg-transparent border-none text-gray-800 outline-none font-medium"
                            />
                            <button
                              onClick={handleCopy}
                              className="ml-2 text-theme cursor-pointer hover:text-blue-700 transition-colors p-1 rounded-full hover:bg-blue-50"
                              title="Copy to clipboard"
                            >
                              <FaRegCopy size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payer Info */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <label className="block font-medium text-gray-700 mb-2">
                        Your Information
                        <span className="block text-xs text-gray-500">আপনার তথ্য</span>
                      </label>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Your Account No*</p>
                          <input
                            type="text"
                            value={payerAccount}
                            onChange={handlePayerAccountChange}
                            placeholder="Enter your 11-digit account number"
                            className={`w-full px-4 py-3 rounded-lg border ${
                              payerAccountError ? 'border-red-500' : 'border-gray-300'
                            } focus:outline-none focus:ring-2 ${
                              payerAccountError ? 'focus:ring-red-500' : 'focus:ring-theme'
                            } transition duration-200 bg-white`}
                          />
                          {payerAccountError && <p className="mt-1 text-sm text-red-600">{payerAccountError}</p>}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Transaction ID*</p>
                          <input
                            type="text"
                            value={transactionId}
                            onChange={handleTransactionIdChange}
                            placeholder="Enter your transaction ID"
                            className={`w-full px-4 py-3 rounded-lg border ${
                              transactionIdError ? 'border-red-500' : 'border-gray-300'
                            } focus:outline-none focus:ring-2 ${
                              transactionIdError ? 'focus:ring-red-500' : 'focus:ring-theme'
                            } transition duration-200 bg-white`}
                          />
                          {transactionIdError && <p className="mt-1 text-sm text-red-600">{transactionIdError}</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
                    <button
                      onClick={handleCancel}
                      className="px-6 py-3 cursor-pointer bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex-1 sm:flex-none"
                      disabled={isLoading}
                    >
                      CANCEL PAYMENT
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="px-6 py-3 cursor-pointer bg-gradient-to-r from-theme to-blue-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-theme transition-all flex-1 sm:flex-none shadow-md"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          PROCESSING...
                        </span>
                      ) : (
                        'CONFIRM PAYMENT'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Right Section - Information */}
            <div className="w-full md:w-1/3 bg-gradient-to-b from-blue-50 to-indigo-50 p-6 border-t md:border-t-0 md:border-l border-gray-200">
              <div className="sticky top-6">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm mr-3">
                    <img src={logo} alt="Logo" className="w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-theme">Secure Payment</h3>
                </div>
                
                <div className="space-y-5">
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                    <div className="flex items-start">
                      <div className="bg-blue-100 p-2 rounded-full mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Payment Amount</h4>
                        <p className="text-sm text-gray-600">Please ensure you send exactly <strong>{amount} {currency}</strong></p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm border border-yellow-100">
                    <div className="flex items-start">
                      <div className="bg-yellow-100 p-2 rounded-full mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Important Notice</h4>
                        <p className="text-sm text-gray-600">Send payment from your {provider} account only</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
                    <div className="flex items-start">
                      <div className="bg-green-100 p-2 rounded-full mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">Secure Transaction</h4>
                        <p className="text-sm text-gray-600">Your payment is processed securely</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 bg-white/80 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-2">Need help?</h4>
                  <p className="text-sm text-gray-600">Contact our support team if you encounter any issues with your payment.</p>
                  <button className="mt-3 text-sm text-theme font-medium hover:underline">
                    Contact Support
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .loader {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #1946c4;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .bg-theme {
          background-color: #1946c4;
        }

        .text-theme {
          color: #1946c4;
        }

        .border-theme {
          border-color: #1946c4;
        }

        .from-theme {
          --tw-gradient-from: #1946c4;
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
        }

        .to-blue-600 {
          --tw-gradient-to: #2563eb;
        }
      `}</style>
    </div>
  );
};

export default Checkout;