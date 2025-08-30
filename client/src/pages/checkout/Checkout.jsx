import React, { useState, useEffect } from "react";
import { FaRegCopy, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from "axios";
import toast, { Toaster } from 'react-hot-toast';
import logo from '../../assets/logo.png';

// Professional Loading Animation Component
const LoadingAnimation = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.4)]  z-50 ">
      <div className="flex flex-col items-center">
        {/* Modern Spinner */}
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-blue-200 border-t-theme animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-4 border-blue-100 border-t-blue-400 animate-spin-reverse"></div>
          <div className="absolute inset-4 rounded-full bg-theme/20 flex items-center justify-center">
            <div className="w-2 h-2 bg-theme rounded-full animate-pulse"></div>
          </div>
        </div>
        
        {/* Animated Text */}
        <div className="text-center">
          <p className="text-white text-lg font-semibold mb-1">প্রসেসিং হচ্ছে</p>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
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
  const [paidStatus, setPaidStatus] = useState(0); // 0: not paid, 1: success, 2: failed, 3: cashdesk failed, 4: player ID mismatch
  const [payerAccountError, setPayerAccountError] = useState('');
  const [transactionIdError, setTransactionIdError] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [walletNumber, setWalletNumber] = useState('');
  const { paymentId } = useParams();
  const [randomAgent, setRandomAgent] = useState([]);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [transactiondata, settransactiondata] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false);
      setShowContent(true);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (showContent) {
      setIsLoading(true);
      axios.post(`${base_url}/api/payment/checkout`, { paymentId })
        .then(res => {
          console.log(res.data)
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
          toast.error('পেমেন্ট বিবরণ লোড করতে ব্যর্থ হয়েছে');
          setPaidStatus(2);
          setIsLoading(false);
        });
    }
  }, [paymentId, showContent]);

  const handleCopy = () => {
    navigator.clipboard.writeText(randomAgent);
    setIsCopied(true);
    toast.success('ক্লিপবোর্ডে কপি করা হয়েছে!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePayerAccountChange = (e) => {
    setPayerAccount(e.target.value);
    if (!/^[0-9]{11}$/.test(e.target.value)) {
      setPayerAccountError('সঠিক ১১-অঙ্কের অ্যাকাউন্ট নম্বর দিন');
    } else {
      setPayerAccountError('');
    }
  };

  const handleTransactionIdChange = (e) => {
    setTransactionId(e.target.value);
    if (!e.target.value) {
      setTransactionIdError('একটি লেনদেন আইডি দিন');
    } else {
      setTransactionIdError('');
    }
  };

  const handleSubmit = async () => {
    if (!payerAccount || !/^[0-9]{11}$/.test(payerAccount)) {
      setPayerAccountError('সঠিক ১১-অঙ্কের অ্যাকাউন্ট নম্বর দিন');
      return;
    }

    if (!transactionId) {
      setTransactionIdError('একটি লেনদেন আইডি দিন');
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
      
      console.log("Payment response:", res.data);
      
      if (res.data.success) {
        // Main success case
        toast.success('আপনার পেমেন্ট সফলভাবে গ্রহণ করা হয়েছে!');
        settransactiondata(res.data.data);
        setPaidStatus(1);
      } else if (res.data.type === 'cashdesk') {
        // CashDesk specific errors
        if (res.data.message && res.data.message.includes("Player ID verification failed")) {
          toast.error('প্লেয়ার আইডি যাচাই ব্যর্থ হয়েছে');
          settransactiondata(res.data.data);
          setPaidStatus(4); // Player ID mismatch
          setErrorMessage(res.data.message);
        } else {
          toast.error('পেমেন্ট প্রসেস করা হয়েছে কিন্তু ক্যাশডেস্ক ডিপোজিট ব্যর্থ হয়েছে');
          settransactiondata(res.data.data);
          setPaidStatus(3); // CashDesk failed
          setErrorMessage(res.data.message);
        }
      } else {
        // Other errors
        toast.error(res.data.message);
        if (res.data.type === 'tid') {
          setTransactionIdError(res.data.message);
        } else if (res.data.type === 'pid') {
          setPaidStatus(2);
        }
      }
    } catch (err) {
      toast.error('আপনার পেমেন্ট প্রসেস করার সময় একটি ত্রুটি ঘটেছে');
      console.error(err);
      setPaidStatus(2);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    Swal.fire({
      icon: 'warning',
      title: 'রিডাইরেক্ট হচ্ছে...',
      text: 'আপনাকে হোমপেজে নিয়ে যাওয়া হচ্ছে',
      showConfirmButton: false,
      timer: 2000
    }).then(() => {
      navigate('/');
    });
  };

  const goToPaymentMethods = () => {
    navigate('/payment-methods');
  };

  const contactSupport = () => {
    Swal.fire({
      title: 'সাপোর্টে যোগাযোগ করুন',
      html: `
        <div class="text-left">
          <p class="mb-3">এই লেনদেন সম্পর্কিত সাহায্যের জন্য আমাদের সাপোর্ট টিমে যোগাযোগ করুন।</p>
          <p class="font-semibold">লেনদেন আইডি: <span class="text-theme">${transactionId}</span></p>
          <p class="font-semibold mt-2">পেমেন্ট আইডি: <span class="text-theme">${paymentId}</span></p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'ঠিক আছে',
      confirmButtonColor: '#1946c4'
    });
  };

  return (
    <div className="min-h-screen font-anek bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
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
        <div className="bg-white rounded-xl shadow-sm w-full max-w-4xl overflow-hidden">
          {/* Header with Logo */}
          <div className="bg-gradient-to-r from-theme to-blue-600 text-white p-4 md:p-6 text-center relative">
            <div className="absolute top-2 md:top-4 left-2 md:left-4 w-8 h-8 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shadow-md">
              <img src={logo} alt="Logo" className="w-4 md:w-8" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold">পেমেন্ট গেটওয়ে</h1>
            <p className="mt-1 text-blue-100 text-sm md:text-base">সুরক্ষিতভাবে আপনার পেমেন্ট সম্পূর্ণ করুন</p>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* Left Section - Form */}
            <div className={`w-full ${paidStatus !== 1 ? 'md:w-full' : ''} p-4 md:p-6 lg:p-8`}>
              {paidStatus === 1 ? (
                // Success State
                <div className="text-center py-4 md:py-8">
                  <div className="mx-auto">
                    {/* Animated Checkmark */}
                    <div className="relative mb-4 md:mb-6">
                      <div className="w-16 h-16 md:w-24 md:h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <div className="success-checkmark">
                          <div className="check-icon">
                            <span className="icon-line line-tip"></span>
                            <span className="icon-line line-long"></span>
                            <div className="icon-circle"></div>
                            <div className="icon-fix"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Success Message */}
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mt-4 md:mt-6">পেমেন্ট সফল হয়েছে!</h3>
                    <p className="text-gray-600 mt-2 md:mt-3">আপনার {amount} {currency} এর পেমেন্ট সফলভাবে প্রসেস করা হয়েছে।</p>
                    
                    {/* Transaction Details */}
                    <div className="border-[1px] border-gray-200 rounded-xl p-4 md:p-5 mt-6 md:mt-8 text-left">
                      <h4 className="font-semibold text-gray-700 mb-3 md:mb-4 pb-2 border-b border-gray-100">লেনদেনের বিবরণ</h4>
                      <div className="space-y-2 md:space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">পরিমাণ:</span>
                          <span className="font-medium">{amount} {currency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">পেমেন্ট পদ্ধতি:</span>
                          <span className="font-medium">{provider}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">লেনদেন আইডি:</span>
                          <span className="font-medium text-theme break-all">{transactionId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">স্ট্যাটাস:</span>
                          <span className="font-medium text-green-600">সম্পন্ন</span>
                        </div>
                      </div>
                    </div>

                    {/* Confetti Animation Elements */}
                    <div className="confetti">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="confetti-piece"></div>
                      ))}
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={goToPaymentMethods}
                      className="px-6 py-3 md:px-8 md:py-4 mt-6 md:mt-8 cursor-pointer bg-gradient-to-r from-theme to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-theme transition-all font-bold w-full shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-transform duration-300"
                    >
                      আবার ডিপোজিট করুন
                    </button>
                  </div>
                </div>
              ) : paidStatus === 3 ? (
                // CashDesk Failed State
                <div className="text-center py-4 md:py-8">
                  <div className="mx-auto">
                    {/* Error Icon */}
                    <div className="relative mb-4 md:mb-6">
                      <div className="w-16 h-16 md:w-24 md:h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-12 md:w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                    </div>

                    {/* Error Message */}
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mt-4 md:mt-6">প্লেয়ার আইডি মিলছে না</h3>
                    <p className="text-gray-600 mt-2 md:mt-3">এই লেনদেনের সাথে সম্পর্কিত প্লেয়ার আইডি যাচাই করা যায়নি।</p>
                    <p className="text-gray-600 mt-2">আপনার প্লেয়ার আইডি পরীক্ষা করে আবার চেষ্টা করুন, অথবা সাহায্যের জন্য সাপোর্টে যোগাযোগ করুন।</p>

                    {/* Transaction Details */}
                    <div className="border-[1px] border-gray-200 rounded-xl p-4 md:p-5 mt-6 md:mt-8 text-left">
                      <h4 className="font-semibold text-gray-700 mb-3 md:mb-4 pb-2 border-b border-gray-100">লেনদেনের বিবরণ</h4>
                      <div className="space-y-2 md:space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">পরিমাণ:</span>
                          <span className="font-medium">{amount} {currency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">পেমেন্ট পদ্ধতি:</span>
                          <span className="font-medium">{provider}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">লেনদেন আইডি:</span>
                          <span className="font-medium text-theme break-all">{transactionId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">স্ট্যাটাস:</span>
                          <span className="font-medium text-red-600">প্লেয়ার আইডি মিলছে না</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-6 md:mt-8">
                      {/* <button
                        onClick={contactSupport}
                        className="px-4 py-2 md:px-6 md:py-3 cursor-pointer bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex-1"
                      >
                        সাপোর্টে যোগাযোগ করুন
                      </button> */}
                      <button
                        onClick={goToPaymentMethods}
                        className="px-4 py-2 md:px-6 md:py-3 cursor-pointer bg-gradient-to-r from-theme to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-theme transition-all flex-1"
                      >
                        আবার চেষ্টা করুন
                      </button>
                    </div>
                  </div>
                </div>
              ) : paidStatus === 4 ? (
                // Player ID Mismatch State
                <div className="text-center py-4 md:py-8">
                  <div className="mx-auto">
                    {/* Error Icon */}
                    <div className="relative mb-4 md:mb-6">
                      <div className="w-16 h-16 md:w-24 md:h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-12 md:w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                    </div>

                    {/* Error Message */}
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mt-4 md:mt-6">প্লেয়ার আইডি মিলছে না</h3>
                    <p className="text-gray-600 mt-2 md:mt-3">এই লেনদেনের সাথে সম্পর্কিত প্লেয়ার আইডি যাচাই করা যায়নি।</p>
                    <p className="text-gray-600 mt-2">আপনার প্লেয়ার আইডি পরীক্ষা করে আবার চেষ্টা করুন, অথবা সাহায্যের জন্য সাপোর্টে যোগাযোগ করুন।</p>

                    {/* Transaction Details */}
                    <div className="border-[1px] border-gray-200 rounded-xl p-4 md:p-5 mt-6 md:mt-8 text-left">
                      <h4 className="font-semibold text-gray-700 mb-3 md:mb-4 pb-2 border-b border-gray-100">লেনদেনের বিবরণ</h4>
                      <div className="space-y-2 md:space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">পরিমাণ:</span>
                          <span className="font-medium">{amount} {currency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">পেমেন্ট পদ্ধতি:</span>
                          <span className="font-medium">{provider}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">লেনদেন আইডি:</span>
                          <span className="font-medium text-theme break-all">{transactionId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">স্ট্যাটাস:</span>
                          <span className="font-medium text-red-600">প্লেয়ার আইডি মিলছে না</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-6 md:mt-8">
                      <button
                        onClick={contactSupport}
                        className="px-4 py-2 md:px-6 md:py-3 cursor-pointer bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex-1"
                      >
                        সাপোর্টে যোগাযোগ করুন
                      </button>
                      <button
                        onClick={goToPaymentMethods}
                        className="px-4 py-2 md:px-6 md:py-3 cursor-pointer bg-gradient-to-r from-theme to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-theme transition-all flex-1"
                      >
                        আবার চেষ্টা করুন
                      </button>
                    </div>
                  </div>
                </div>
              ) : paidStatus === 2 ? (
                // Enhanced Failed State
                <div className="text-center py-4 md:py-8">
                  <div className="mx-auto max-w-md">
                    {/* Animated Error Icon */}
                    <div className="relative mb-4 md:mb-6">
                      <div className="w-16 h-16 md:w-24 md:h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                        <div className="error-x-mark">
                          <span className="error-x-line line-left animate-x-left"></span>
                          <span className="error-x-line line-right animate-x-right"></span>
                        </div>
                      </div>
                    </div>

                    {/* Error Message */}
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mt-4 md:mt-6">পেমেন্ট ব্যর্থ হয়েছে</h3>
                    <p className="text-gray-600 mt-2 md:mt-3">আপনার পেমেন্ট প্রসেস করতে সমস্যা হয়েছে।</p>
                    <p className="text-gray-600 mt-2">আবার চেষ্টা করুন অথবা সমস্যা থাকলে সাপোর্টে যোগাযোগ করুন।</p>

                    {/* Additional Help Section */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100 text-left">
                      <h4 className="font-semibold text-blue-800 mb-2">সাহায্য প্রয়োজন?</h4>
                      <ul className="text-sm text-blue-600 list-disc pl-5 space-y-1">
                        <li>আপনার ইন্টারনেট সংযোগ পরীক্ষা করুন</li>
                        <li>আপনার পেমেন্ট বিবরণ যাচাই করুন</li>
                        <li>আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স আছে কিনা নিশ্চিত করুন</li>
                        <li>সমস্যা থাকলে সাপোর্টে যোগাযোগ করুন</li>
                      </ul>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={goToPaymentMethods}
                      className="px-6 py-3 md:px-8 md:py-4 mt-6 md:mt-8 cursor-pointer bg-gradient-to-r from-theme to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-theme transition-all font-bold w-full shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-transform duration-300"
                    >
                      আবার চেষ্টা করুন
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Payment Summary Card */}
                  <div className="bg-gradient-to-r from-theme/10 to-blue-100 border border-theme/20 rounded-xl p-4 mb-4 md:mb-6 flex items-center">
                    <div className="bg-theme text-white p-2 md:p-3 rounded-lg mr-3 md:mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-700 text-sm md:text-base">পেমেন্টের পরিমাণ</h3>
                      <p className="text-xl md:text-2xl font-bold text-theme">{amount} {currency}</p>
                    </div>
                  </div>

                  {/* Wallet Info */}
                  <div className="space-y-4 md:space-y-6">
                    <div className="bg-gray-50 rounded-xl p-3 md:p-4 border border-gray-200">
                      <label className="block font-medium text-gray-700 mb-2">
                        পেমেন্ট পাঠান
                      </label>
                      <div className="space-y-3 md:space-y-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">ওয়ালেট প্রদানকারী</p>
                          <div className="flex items-center bg-white p-2 md:p-3 rounded-lg border border-gray-200">
                            <span className="font-medium text-sm md:text-base">{provider}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">ওয়ালেট নম্বর</p>
                          <div className="flex items-center bg-white p-2 md:p-3 rounded-lg border border-gray-200">
                            <input
                              type="text"
                              value={randomAgent}
                              readOnly
                              className="w-full bg-transparent border-none text-gray-800 outline-none font-medium text-sm md:text-base"
                            />
                            <button
                              onClick={handleCopy}
                              className="ml-2 text-theme cursor-pointer hover:text-blue-700 transition-colors p-1 rounded-full hover:bg-blue-50"
                              title="Copy to clipboard"
                            >
                              <FaRegCopy size={14} className="md:size-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payer Info */}
                    <div className="bg-gray-50 rounded-xl p-3 md:p-4 border border-gray-200">
                      <label className="block font-medium text-gray-700 mb-2">
                        আপনার তথ্য
                      </label>
                      <div className="space-y-3 md:space-y-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">আপনার অ্যাকাউন্ট নম্বর*</p>
                          <input
                            type="text"
                            value={payerAccount}
                            onChange={handlePayerAccountChange}
                            placeholder="আপনার ১১-অঙ্কের অ্যাকাউন্ট নম্বর লিখুন"
                            className={`w-full px-3 py-2 md:px-4 md:py-3 rounded-lg border ${
                              payerAccountError ? 'border-red-500' : 'border-gray-300'
                            } focus:outline-none focus:ring-2 ${
                              payerAccountError ? 'focus:ring-red-500' : 'focus:ring-theme'
                            } transition duration-200 bg-white text-sm md:text-base`}
                          />
                          {payerAccountError && <p className="mt-1 text-sm text-red-600">{payerAccountError}</p>}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">লেনদেন আইডি*</p>
                          <input
                            type="text"
                            value={transactionId}
                            onChange={handleTransactionIdChange}
                            placeholder="আপনার লেনদেন আইডি লিখুন"
                            className={`w-full px-3 py-2 md:px-4 md:py-3 rounded-lg border ${
                              transactionIdError ? 'border-red-500' : 'border-gray-300'
                            } focus:outline-none focus:ring-2 ${
                              transactionIdError ? 'focus:ring-red-500' : 'focus:ring-theme'
                            } transition duration-200 bg-white text-sm md:text-base`}
                          />
                          {transactionIdError && <p className="mt-1 text-sm text-red-600">{transactionIdError}</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 md:mt-8">
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 md:px-6 md:py-3 cursor-pointer bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex-1 sm:flex-none text-sm md:text-base"
                      disabled={isLoading}
                    >
                      পেমেন্ট বাতিল করুন
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="px-4 py-2 md:px-6 md:py-3 cursor-pointer bg-gradient-to-r from-theme to-blue-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-theme transition-all flex-1 sm:flex-none shadow-md text-sm md:text-base"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          প্রসেসিং হচ্ছে...
                        </span>
                      ) : (
                        'পেমেন্ট নিশ্চিত করুন'
                      )}
                    </button>
                  </div>
                </>
              )}
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

        @keyframes spin-reverse {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
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
          width: 60px;
          height: 60px;
          margin: 0 auto;
        }
        
        @media (min-width: 768px) {
          .success-checkmark {
            width: 80px;
            height: 80px;
          }
        }
        
        .check-icon {
            width: 100%;
            height: 100%;
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
            width: 100%;
            height: 100%;
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

        /* Error X Mark Animation */
        .error-x-mark {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .error-x-line {
          position: absolute;
          height: 5px;
          width: 50%;
          background-color: #ef4444;
          border-radius: 2px;
          top: 48%;
        }
        
        .line-left {
          left: 15%;
          transform: rotate(45deg);
        }
        
        .line-right {
          right: 15%;
          transform: rotate(-45deg);
        }
        
        .animate-x-left {
          animation: animate-x-left 0.5s;
        }
        
        .animate-x-right {
          animation: animate-x-right 0.5s;
        }
        
        @keyframes animate-x-left {
          0% { transform: rotate(45deg) scale(0); }
          100% { transform: rotate(45deg) scale(1); }
        }
        
        @keyframes animate-x-right {
          0% { transform: rotate(-45deg) scale(0); }
          100% { transform: rotate(-45deg) scale(1); }
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
          width: 8px;
          height: 12px;
          background: #ffd300;
          top: 0;
          opacity: 0;
          animation: makeItRain 1000ms infinite linear;
        }
        
        @media (min-width: 768px) {
          .confetti-piece {
            width: 10px;
            height: 16px;
          }
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