import React, { useState, useEffect } from "react";
import { FaRegCopy, FaCheckCircle } from "react-icons/fa";
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
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
            setAmount(res.data.amount);
            setCurrency(res.data.currency);
            setWebsiteUrl(res.data.websiteUrl);
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

    setIsLoading(true);

    try {
      const res = await axios.post(`${base_url}/api/payment/paymentSubmit`, {
        paymentId,
        provider: provider,
        agentAccount: walletNumber,
        payerAccount,
        transactionId
      });

      if (res.data.success) {
        toast.success('Your payment has been received!');
        settransactiondata(res.data.data);
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
      toast.error('An error occurred while processing your payment');
      console.error(err);
    } finally {
      setIsLoading(false);
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

  const goToPaymentMethods = () => {
    navigate('/payment-methods');
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
        <div className="bg-white rounded-xl shadow-sm w-full sm:w-[80%] lg:w-[70%] xl:w-[60%] overflow-hidden">
          {/* Header with Logo */}
          <div className="bg-gradient-to-r from-theme to-blue-600 text-white p-6 text-center relative">
            <div className="absolute top-4 left-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
              <img src={logo} alt="Logo" className="w-8" />
            </div>
            <h1 className="text-2xl font-bold">Payment Gateway</h1>
            <p className="mt-1 text-blue-100">Complete your payment securely</p>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* Left Section - Form */}
            <div className={`w-full ${paidStatus !== 1 ? 'md:w-full' : ''} p-8`}>
              {paidStatus === 1 ? (
                // Success State
                <div className="text-center py-8">
                  <div className="mx-auto">
                    {/* Animated Checkmark */}
                    <div className="relative mb-6">
                      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <div className="success-checkmark">
                          <div className="check-icon">
                            <span className="icon-line line-tip"></span>
                            <span className="icon-line line-long"></span>
                            <div className="icon-circle"></div>
                            <div className="icon-fix"></div>
                          </div>
                        </div>
                      </div>
                      {/* <div className="absolute -top-2 -right-2">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <FaCheckCircle className="text-white text-xl" />
                        </div>
                      </div> */}
                    </div>

                    {/* Success Message */}
                    <h3 className="text-3xl font-bold text-gray-800 mt-6">Payment Successful!</h3>
                    <p className="text-gray-600 mt-3">Your payment of <span className="font-semibold text-theme">{amount} {currency}</span> has been processed successfully.</p>
                    
                    {/* Transaction Details */}
                    <div className="border-[1px] border-gray-200 rounded-xl p-5 mt-8 text-left">
                      <h4 className="font-semibold text-gray-700 mb-4  pb-2">Transaction Details</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Amount:</span>
                          <span className="font-medium">{amount} {currency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment Method:</span>
                          <span className="font-medium">{provider}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Transaction ID:</span>
                          <span className="font-medium text-theme">{transactionId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className="font-medium text-green-600">Completed</span>
                        </div>
                      </div>
                    </div>

                    {/* Confetti Animation Elements */}
                    <div className="confetti">
                      <div className="confetti-piece"></div>
                      <div className="confetti-piece"></div>
                      <div className="confetti-piece"></div>
                      <div className="confetti-piece"></div>
                      <div className="confetti-piece"></div>
                      <div className="confetti-piece"></div>
                      <div className="confetti-piece"></div>
                      <div className="confetti-piece"></div>
                      <div className="confetti-piece"></div>
                      <div className="confetti-piece"></div>
                      <div className="confetti-piece"></div>
                      <div className="confetti-piece"></div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={goToPaymentMethods}
                      className="px-8 py-4 mt-8 cursor-pointer bg-gradient-to-r from-theme to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-theme transition-all font-bold w-full shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-transform duration-300"
                    >
                      AGAIN DEPOSIT
                    </button>
                  </div>
                </div>
              ) : (
                <>
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

                  {/* Wallet Info */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <label className="block font-medium text-gray-700 mb-2">
                        Send Payment To
                        <span className="block text-xs text-gray-500">Recipient wallet information</span>
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
                        <span className="block text-xs text-gray-500">Your details</span>
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

            {/* Right Section - Information (Only show when not in success state) */}
      
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

        /* Success Checkmark Animation */
        .success-checkmark {
          width: 80px;
          height: 80px;
          margin: 0 auto;
        }
        
        .check-icon {
            width: 80px;
            height: 80px;
            position: relative;
            border-radius: 50%;
            box-sizing: content-box;
            border: 4px solid #4CAF50;
        }
        
        .check-icon::before {
            top: 3px;
            left: -2px;
            transform: rotate(45deg);
            transform-origin: 100% 50%;
            border-radius: 100px 0 0 100px;
        }
        
        .check-icon::after {
            top: 0;
            left: 30px;
            transform: rotate(-45deg);
            transform-origin: 0 50%;
            border-radius: 0 100px 100px 0;
            animation: rotate-circle 4.25s ease-in;
        }
        
        .check-icon::before, .check-icon::after {
            content: '';
            height: 100px;
            position: absolute;
            background: #FFFFFF;
            transform: rotate(-45deg);
        }
        
        .icon-line {
            height: 5px;
            background-color: #4CAF50;
            display: block;
            border-radius: 2px;
            position: absolute;
            z-index: 10;
        }
        
        .icon-line.line-tip {
            top: 46px;
            left: 14px;
            width: 25px;
            transform: rotate(45deg);
            animation: icon-line-tip 0.75s;
        }
        
        .icon-line.line-long {
            top: 38px;
            right: 8px;
            width: 47px;
            transform: rotate(-45deg);
            animation: icon-line-long 0.75s;
        }
        
        .icon-circle {
            top: -4px;
            left: -4px;
            z-index: 10;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            position: absolute;
            box-sizing: content-box;
            border: 4px solid rgba(76, 175, 80, .5);
        }
        
        .icon-fix {
            top: 8px;
            width: 5px;
            left: 26px;
            z-index: 1;
            height: 85px;
            position: absolute;
            transform: rotate(-45deg);
            background-color: #FFFFFF;
        }
        
        @keyframes rotate-circle {
            0% { transform: rotate(-45deg); }
            5% { transform: rotate(-45deg); }
            12% { transform: rotate(-405deg); }
            100% { transform: rotate(-405deg); }
        }
        
        @keyframes icon-line-tip {
            0% { width: 0; left: 1px; top: 19px; }
            54% { width: 0; left: 1px; top: 19px; }
            70% { width: 50px; left: -8px; top: 37px; }
            84% { width: 17px; left: 21px; top: 48px; }
            100% { width: 25px; left: 14px; top: 45px; }
        }
        
        @keyframes icon-line-long {
            0% { width: 0; right: 46px; top: 54px; }
            65% { width: 0; right: 46px; top: 54px; }
            84% { width: 55px; right: 0px; top: 35px; }
            100% { width: 47px; right: 8px; top: 38px; }
        }

        /* Confetti Animation */
        .confetti {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          pointer-events: none;
          z-index: 1;
        }
        
        .confetti-piece {
          position: absolute;
          width: 10px;
          height: 16px;
          background: #ffd300;
          top: 0;
          opacity: 0;
          animation: makeItRain 1000ms infinite linear;
        }
        
        .confetti-piece:nth-child(1) {
          left: 7%;
          transform: rotate(-86deg);
          animation-delay: 182ms;
          background: #1946c4;
        }
        
        .confetti-piece:nth-child(2) {
          left: 14%;
          transform: rotate(0deg);
          animation-delay: 161ms;
          background: #ffd300;
        }
        
        .confetti-piece:nth-child(3) {
          left: 21%;
          transform: rotate(80deg);
          animation-delay: 481ms;
          background: #4CAF50;
        }
        
        .confetti-piece:nth-child(4) {
          left: 28%;
          transform: rotate(145deg);
          animation-delay: 334ms;
          background: #1946c4;
        }
        
        .confetti-piece:nth-child(5) {
          left: 35%;
          transform: rotate(30deg);
          animation-delay: 102ms;
          background: #ffd300;
        }
        
        .confetti-piece:nth-child(6) {
          left: 42%;
          transform: rotate(105deg);
          animation-delay: 329ms;
          background: #4CAF50;
        }
        
        .confetti-piece:nth-child(7) {
          left: 49%;
          transform: rotate(60deg);
          animation-delay: 117ms;
          background: #1946c4;
        }
        
        .confetti-piece:nth-child(8) {
          left: 56%;
          transform: rotate(165deg);
          animation-delay: 334ms;
          background: #ffd300;
        }
        
        .confetti-piece:nth-child(9) {
          left: 63%;
          transform: rotate(30deg);
          animation-delay: 493ms;
          background: #4CAF50;
        }
        
        .confetti-piece:nth-child(10) {
          left: 70%;
          transform: rotate(155deg);
          animation-delay: 491ms;
          background: #1946c4;
        }
        
        .confetti-piece:nth-child(11) {
          left: 77%;
          transform: rotate(40deg);
          animation-delay: 106ms;
          background: #ffd300;
        }
        
        .confetti-piece:nth-child(12) {
          left: 84%;
          transform: rotate(95deg);
          animation-delay: 424ms;
          background: #4CAF50;
        }
        
        @keyframes makeItRain {
          from {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          to {
            transform: translateY(200px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Checkout;