import React, { useState, useEffect } from 'react';
import { FaCreditCard, FaExchangeAlt, FaChevronLeft, FaChevronRight, FaRegQuestionCircle } from 'react-icons/fa';
import { FiHome, FiX, FiInfo, FiCheck } from 'react-icons/fi';
import { RiBankFill, RiSecurePaymentLine } from 'react-icons/ri';
import { BsPhoneFill, BsArrowRight } from 'react-icons/bs';
import { MdPayment, MdSecurity } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

const PaymentGateway = ({ user_info }) => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const base_url2 = import.meta.env.VITE_API_KEY_Base_URL2;
  const frontend_url = import.meta.env.VITE_API_KEY_Fontend;

  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('mobile');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [amount, setAmount] = useState(500);
  const [showMethodDetails, setShowMethodDetails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [userId, setUserId] = useState("");
  const [bankDetails, setBankDetails] = useState({
    accountHolder: '',
    accountNumber: '',
    transactionId: ''
  });
  const [loading, setLoading] = useState(false);
  const [depositMessage, setDepositMessage] = useState('');
  const [orderId, setOrderId] = useState(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  const [showAmountInput, setShowAmountInput] = useState(false);
  const [transactionAmount, setTransactionAmount] = useState('');

  // Check for NagodPay callback data
  useEffect(() => {
    const amountParam = searchParams.get('amount');
    const userId = searchParams.get('userId');
    const playerId = searchParams.get('playerId');
    
    if (amountParam && userId && playerId) {
      setTransactionAmount(amountParam);
      setAmount(Number(amountParam));
      setUserId(userId);
    }
  }, [searchParams]);

  // Generate a new order ID when amount changes
  useEffect(() => {
    setOrderId(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  }, [amount]);

  // Payment methods data
  const paymentMethods = {
    mobile: [
      {
        id: 'bkash_personal',
        name: 'bKash P2P',
        type: 'Personal',
        image: 'https://xxxbetgames.com/icons-xxx/payments/75.svg',
        time: 'Instant',
        description: 'Send money from your personal bKash account',
        fee: '৳10',
        limit: '৳25,000',
        instructions: [
          'Go to your bKash Mobile Menu',
          'Select "Send Money"',
          'Enter our bKash Account Number: 01234567890',
          'Enter amount',
          'Enter your bKash PIN',
          'Confirm payment'
        ],
        handler: () => setShowAmountInput(true)
      },
      {
        id: 'nagad_personal',
        name: 'Nagad P2P',
        type: 'Personal',
        image: 'https://xxxbetgames.com/icons-xxx/payments/76.svg',
        time: 'Instant',
        description: 'Send money from your personal Nagad account',
        fee: '৳10',
        limit: '৳25,000',
        instructions: [
          'Go to your Nagad Mobile Menu',
          'Select "Send Money"',
          'Enter our Nagad Account Number: 01234567890',
          'Enter amount',
          'Enter your Nagad PIN',
          'Confirm payment'
        ],
        handler: () => setShowAmountInput(true)
      },
      {
        id: 'bkash_merchant',
        name: 'Bkash Fast',
        type: 'Merchant',
        image: 'https://xxxbetgames.com/icons-xxx/payments/75.svg',
        time: 'Instant',
        description: 'Send money to merchant bKash account',
        fee: '৳15',
        limit: '৳50,000',
        instructions: [
          'Go to your bKash Mobile Menu',
          'Select "Payment"',
          'Enter Merchant ID: XYZ123',
          'Enter amount',
          'Enter your bKash PIN',
          'Confirm payment'
        ],
        handler: () => handle_bkash_deposit()
      },
      {
        id: 'nagad_merchant',
        name: 'Nagad Fast',
        type: 'Merchant',
        image: 'https://xxxbetgames.com/icons-xxx/payments/76.svg',
        time: 'Instant',
        description: 'Send money to merchant Nagad account',
        fee: '৳15',
        limit: '৳50,000',
        instructions: [
          'Go to your Nagad Mobile Menu',
          'Select "Payment"',
          'Enter Merchant ID: XYZ123',
          'Enter amount',
          'Enter your Nagad PIN',
          'Confirm payment'
        ],
        handler: () => {
          toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} 
              max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <FiInfo className="h-10 w-10 text-blue-500" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Coming Soon!
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Nagad Fast payment option will be available soon.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-200">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Close
                </button>
              </div>
            </div>
          ));
        }
      },
    ],
    bank: [
      {
        id: 'ebl',
        name: 'Eastern Bank',
        type: 'Bank Transfer',
        image: 'data:image/png;base64,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',
        fee: '৳10',
        limit: 'No limit',
        time: '1-3 hours',
        description: 'Transfer from any Islami Bank account',
        instructions: [
          'Go to your bank\'s internet banking',
          'Select "Send Money" or "Fund Transfer"',
          'Enter our account details:',
          'Account Name: XYZ Company',
          'Account Number: 123456789',
          'Branch: Main Branch',
          'Enter amount and complete transaction'
        ],
        bankDetails: {
          accountName: 'XYZ Company',
          accountNumber: '987654321',
          branch: 'Main Branch',
          routingNumber: '987654321'
        }
      },
      {
        id: 'dbbl',
        name: 'Dutch-Bangla',
        type: 'Bank Transfer',
        image: 'data:image/jpeg;base64,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',
        fee: '৳10',
        limit: 'No limit',
        time: '1-3 hours',
        description: 'Transfer from any Dutch-Bangla Bank account',
        instructions: [
          'Go to your bank\'s internet banking',
          'Select "Send Money" or "Fund Transfer"',
          'Enter our account details:',
          'Account Name: XYZ Company',
          'Account Number: 123456789',
          'Branch: Main Branch',
          'Enter amount and complete transaction'
        ],
        bankDetails: {
          accountName: 'XYZ Company',
          accountNumber: '456789123',
          branch: 'Main Branch',
          routingNumber: '456789123'
        }
      }
    ]
  };

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    if (method.handler) {
      method.handler();
    } else if (method.type === 'Bank Transfer') {
      setShowMethodDetails(true);
    }
  };

  const handle_p2p_payment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsProcessing(true);
  
    const postData = {
      provider: selectedMethod.name.toLowerCase().includes('bkash') ? 'bkash' : 
                selectedMethod.name.toLowerCase().includes('nagad') ? 'nagad' : 
                selectedMethod.name.toLowerCase().includes('nagodpay') ? 'nagodpay' : 'other',
      amount: amount,
      orderId: orderId,
      currency: "BDT",
      payerId: userId,
      redirectUrl: `${frontend_url}`,
      callbackUrl: `${base_url}/admin/deposit-success`
    };
  
    try {
      const response = await axios.post(
        `https://api.nagodpay.com/api/payment/payment`,
        postData,
        {
          headers: {
            'x-api-key': '8e91f27afc311cce77c1'
          }
        }
      );
      
      if (response.data.success) {
          window.location.href = `https://nagodpay.com/checkout/${response.data.paymentId}`;
      } else {
        toast.error(response.data.message || "Payment initiation failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to initiate payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handle_bkash_deposit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoading(true);
    
    // if (!amount || amount < 300 || amount > 10000) {
    //   toast.error("Enter a valid amount between 300 BDT and 10000 BDT!");
    //   setDepositMessage("Enter a valid amount between 300 BDT and 10000 BDT!");
    //   setLoading(false);
    //   return;
    // }

    try {
      const { data } = await axios.post(
        `${base_url2}/api/payment/bkash`,
        {
          mid: "hobet",
          payerId: userId,
          amount: amount,
          currency: "BDT",
          redirectUrl: `${frontend_url}`,
          orderId: orderId,
          callbackUrl: `${frontend_url}/callback-payment`,
          redirectUrl:`${frontend_url}`
        },
        {
          headers: {
            'x-api-key': '8e91f27afc311cce77c1'
          }
        }
      );

      if (data.success) {
        window.location.href = data.link;
        setTransactionAmount("");
        setOrderId("");
      } else {
        toast.error(data.message || "Bkash payment failed");
        setDepositMessage(data.message);
      }
    } catch (error) {
      console.error("Bkash error:", error);
      toast.error(error.name || "Failed to process Bkash payment. Please try again.");
      setDepositMessage("Failed to connect to the server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleBankTransfer = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsProcessing(true);
    
    if (!bankDetails.accountHolder || !bankDetails.accountNumber || !bankDetails.transactionId) {
      toast.error("Please fill all bank details");
      setIsProcessing(false);
      return;
    }

    // Simulate bank transfer processing
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
      toast.success("Bank transfer details submitted successfully!");
    }, 2000);
  };

  const handlePaymentSubmit = () => {
    if (!selectedMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (selectedMethod.handler) {
      selectedMethod.handler();
    } else if (selectedMethod.name.includes('P2P')) {
      setShowAmountInput(true);
    } else if (selectedMethod.type === 'Bank Transfer') {
      setShowMethodDetails(true);
    }
  };

  const handleAmountSubmit = (e) => {
    e.preventDefault();
    if (!amount || amount < 300) {
      toast.error("Minimum amount is 300 BDT");
      return;
    }
    handle_p2p_payment();
  };

  const resetPayment = () => {
    setSelectedMethod(null);
    setPaymentSuccess(false);
    setBankDetails({
      accountHolder: '',
      accountNumber: '',
      transactionId: ''
    });
    setShowAmountInput(false);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  const tabsVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="min-h-screen font-anek bg-gradient-to-br from-blue-50 to-gray-50 flex flex-col">
      {/* Main Content */}
      <Toaster/>
      <main className="flex-grow container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {paymentSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto bg-white rounded-2xl shadow-lg overflow-hidden p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6"
              >
                <FiCheck className="h-8 w-8 text-green-600" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
              <p className="text-gray-600 mb-6">Your payment of ৳{amount.toLocaleString()} has been processed successfully.</p>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-50 p-5 rounded-xl mb-6 border border-gray-100"
              >
                <div className="flex justify-between mb-3">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-medium">TXN{Math.floor(Math.random() * 1000000)}</span>
                </div>
                <div className="flex justify-between mb-3">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">{selectedMethod.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date & Time:</span>
                  <span className="font-medium">{new Date().toLocaleString()}</span>
                </div>
              </motion.div>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={resetPayment}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl font-medium transition shadow-md"
              >
                Make Another Payment
              </motion.button>
            </motion.div>
          ) : showAmountInput ? (
            <motion.div
              key="amount-input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto bg-white rounded-2xl shadow-lg overflow-hidden p-6"
            >
              <div className="flex items-center mb-4">
                <button 
                  onClick={() => setShowAmountInput(false)}
                  className="mr-3 text-gray-500 hover:text-gray-700"
                >
                  <FaChevronLeft />
                </button>
                <h2 className="text-xl font-bold text-gray-800">Enter Amount</h2>
              </div>
              
              <form onSubmit={handleAmountSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (BDT)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-lg"
                      placeholder="Enter amount"
                      min="300"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500">৳</span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Minimum amount: ৳300</p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Summary</h3>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">{selectedMethod.name}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">৳{amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fee:</span>
                    <span className="font-medium">৳10</span>
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isProcessing}
                  className={`w-full py-3 px-4 rounded-xl font-medium text-white transition flex items-center justify-center ${
                    isProcessing ? 'bg-blue-400' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-md'
                  }`}
                >
                  {isProcessing ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <>
                      Confirm Payment
                      <BsArrowRight className="ml-2" />
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="payment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              {/* Payment Methods Tabs */}
              <motion.div 
                variants={tabsVariants}
                initial="hidden"
                animate="visible"
                className="border-b border-gray-200"
              >
                <nav className="flex -mb-px">
                  <button
                    onClick={() => {
                      setActiveTab('mobile');
                      setSelectedMethod(null);
                    }}
                    className={`flex-1 py-4 px-1 text-center border-b-2 cursor-pointer font-medium text-sm flex items-center justify-center ${
                      activeTab === 'mobile'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <BsPhoneFill className="mr-2" />
                    Mobile Banking
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('bank');
                      setSelectedMethod(null);
                    }}
                    className={`flex-1 py-4 px-1 text-center border-b-2 cursor-pointer font-medium text-sm flex items-center justify-center ${
                      activeTab === 'bank'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <RiBankFill className="mr-2" />
                    Bank Transfer
                  </button>
                </nav>
              </motion.div>

              {/* Payment Methods List */}
              <div className="p-6">
                <h3 className="text-md font-semibold text-gray-800 mb-4">
                  Select {activeTab === 'mobile' ? 'Mobile Banking' : 'Bank'} Option
                </h3>
                
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  {paymentMethods[activeTab].map((method) => (
                    <motion.div
                      key={method.id}
                      variants={itemVariants}
                      whileHover={{ y: -2 }}
                      onClick={() => handleMethodSelect(method)}
                      className={`p-4 border rounded-xl cursor-pointer transition ${
                        selectedMethod?.id === method.id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                          <img
                            src={method.image}
                            alt={method.name}
                            className="h-10 w-10 object-contain"
                          />
                        </div>
                        <div className="ml-4 flex-grow">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-800">{method.name}</h4>
                            {method.type && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {method.type}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center text-xs text-gray-500">
                            <span>Fee: {method.fee}</span>
                            <span className="mx-2">•</span>
                            <span>Limit: {method.limit}</span>
                          </div>
                        </div>
                        <div className="ml-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMethod(method);
                              setShowMethodDetails(true);
                            }}
                            className="text-gray-400 hover:text-blue-500 transition"
                          >
                            <FiInfo />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              {/* Payment Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <AnimatePresence>
                  {selectedMethod ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 overflow-hidden"
                    >
                      <div className="flex justify-between items-center bg-blue-50 rounded-xl p-3 border border-blue-100">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden mr-3">
                            <img
                              src={selectedMethod.image}
                              alt={selectedMethod.name}
                              className="h-8 w-8 object-contain"
                            />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-800">{selectedMethod.name}</h4>
                            <p className="text-xs text-gray-500">{selectedMethod.type}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedMethod(null)}
                          className="text-gray-400 hover:text-gray-600 transition"
                        >
                          <FiX />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 overflow-hidden"
                    >
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
                        <p className="text-sm text-yellow-700">Please select a payment method</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <motion.button
                  whileHover={selectedMethod ? { scale: 1.02 } : {}}
                  whileTap={selectedMethod ? { scale: 0.98 } : {}}
                  onClick={handlePaymentSubmit}
                  disabled={!selectedMethod || isProcessing}
                  className={`w-full py-3 px-4 rounded-xl font-medium text-white transition flex items-center justify-center ${
                    selectedMethod
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-md'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {isProcessing ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <>
                      Proceed to Payment
                      <BsArrowRight className="ml-2" />
                    </>
                  )}
                </motion.button>
                
                <div className="mt-3 flex items-center justify-center text-xs text-gray-500">
                  <RiSecurePaymentLine className="mr-1 text-blue-500" />
                  <span>All transactions are secure and encrypted</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Method Details Modal */}
        <AnimatePresence>
          {showMethodDetails && selectedMethod && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000] p-4"
              onClick={() => setShowMethodDetails(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{selectedMethod.name} Payment</h3>
                    <button 
                      onClick={() => setShowMethodDetails(false)}
                      className="text-gray-500 hover:text-gray-700 transition"
                    >
                      <FiX className="text-xl" />
                    </button>
                  </div>
                  
                  <div className="flex justify-center mb-6">
                    <div className="h-24 w-24 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                      <img
                        src={selectedMethod.image}
                        alt={selectedMethod.name}
                        className="h-20 w-20 object-contain"
                      />
                    </div>
                  </div>
                  
                  {selectedMethod.type === 'Bank Transfer' ? (
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                        <h4 className="font-medium text-gray-800 mb-2">Our Bank Details</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Bank Name:</span>
                            <span className="font-medium">{selectedMethod.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Account Name:</span>
                            <span className="font-medium">{selectedMethod.bankDetails.accountName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Account Number:</span>
                            <span className="font-medium">{selectedMethod.bankDetails.accountNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Branch:</span>
                            <span className="font-medium">{selectedMethod.bankDetails.branch}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Your Account Holder Name</label>
                          <input
                            type="text"
                            value={bankDetails.accountHolder}
                            onChange={(e) => setBankDetails({...bankDetails, accountHolder: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your name as in bank account"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Your Bank Account Number</label>
                          <input
                            type="text"
                            value={bankDetails.accountNumber}
                            onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your bank account number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                          <input
                            type="text"
                            value={bankDetails.transactionId}
                            onChange={(e) => setBankDetails({...bankDetails, transactionId: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter transaction ID from bank"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 mb-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                        <p className="text-gray-800">{selectedMethod.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Transaction Fee</h4>
                          <p className="text-gray-800 font-medium">{selectedMethod.fee}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Processing Time</h4>
                          <p className="text-gray-800 font-medium">{selectedMethod.time}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Limit</h4>
                          <p className="text-gray-800 font-medium">{selectedMethod.limit}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Account Type</h4>
                          <p className="text-gray-800 font-medium">{selectedMethod.type}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Payment Instructions</h4>
                        <ul className="space-y-2">
                          {selectedMethod.instructions.map((step, index) => (
                            <li key={index} className="flex items-start">
                              <span className="flex-shrink-0 h-5 w-5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center mr-2 text-xs font-medium">
                                {index + 1}
                              </span>
                              <span className="text-gray-700">{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-3 mt-6">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowMethodDetails(false)}
                      className="flex-1 py-2 px-4 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      Back
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (selectedMethod.type === 'Bank Transfer') {
                          handleBankTransfer();
                        } else if (selectedMethod.handler) {
                          selectedMethod.handler();
                        } else if (selectedMethod.name.includes('P2P')) {
                          setShowAmountInput(true);
                          setShowMethodDetails(false);
                        }
                        setShowMethodDetails(false);
                      }}
                      disabled={selectedMethod.type === 'Bank Transfer' && 
                        (!bankDetails.accountHolder || !bankDetails.accountNumber || !bankDetails.transactionId)}
                      className={`flex-1 py-2 px-4 rounded-xl font-medium transition shadow-md ${
                        selectedMethod.type === 'Bank Transfer' && 
                        (!bankDetails.accountHolder || !bankDetails.accountNumber || !bankDetails.transactionId)
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white'
                      }`}
                    >
                      {isProcessing ? 'Processing...' : 'Proceed to Pay'}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default PaymentGateway;