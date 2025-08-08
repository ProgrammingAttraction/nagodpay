import React, { useState, useEffect } from 'react';
import { FaCreditCard, FaExchangeAlt, FaChevronLeft, FaChevronRight, FaRegQuestionCircle } from 'react-icons/fa';
import { FiHome, FiX, FiInfo, FiCheck } from 'react-icons/fi';
import { RiBankFill, RiSecurePaymentLine } from 'react-icons/ri';
import { BsPhoneFill, BsArrowRight } from 'react-icons/bs';
import { MdPayment, MdSecurity } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast,{Toaster} from 'react-hot-toast';

const PaymentGateway = ({ user_info}) => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const base_url2 = import.meta.env.VITE_API_KEY_Base_URL2;
  const frontend_url = import.meta.env.VITE_API_KEY_Fontend;

  const [activeTab, setActiveTab] = useState('mobile');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [amount, setAmount] = useState(500);
  const [showMethodDetails, setShowMethodDetails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    accountHolder: '',
    accountNumber: '',
    transactionId: ''
  });
  const [loading, setLoading] = useState(false);
  const [depositMessage, setDepositMessage] = useState('');
  const [orderId, setOrderId] = useState(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));

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
        ]
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
        ]
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
        ]
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
        ]
      },
    ],
    bank: [
      {
        id: 'ebl',
        name: 'Eastern Bank',
        type: 'Bank Transfer',
        image: 'data:image/jpeg;base64,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',
        fee: '৳15',
        limit: 'No limit',
        time: '1-3 hours',
        description: 'Transfer from any Eastern Bank account',
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
          accountNumber: '123456789',
          branch: 'Main Branch',
          routingNumber: '123456789'
        }
      },
      {
        id: 'ibbl',
        name: 'Islami Bank',
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
    if (method.type === 'Bank Transfer') {
      setShowMethodDetails(true);
    }
  };

  const handle_p2p_payment = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
  
    const postData = {
      provider: selectedMethod.name.toLowerCase().includes('bkash') ? 'bkash' : 'nagad',
      amount: amount,
      orderId: orderId,
      currency: "BDT",
      payerId: user_info.player_id,
      redirectUrl: `${frontend_url}`,
      callbackUrl: `${base_url}/admin/deposit-success`
    };
  
    try {
      const response = await axios.post(
        `${base_url2}/api/payment/payment`,
        postData,
        {
          headers: {
            'x-api-key': '8e91f27afc311cce77c1'
          }
        }
      );
      
      if (response.data.success) {
        window.location.href = `https://pi2payz.nagodpay.com/checkout/${response.data.paymentId}`;
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
    e.preventDefault();
    setIsProcessing(true);
    
    if (!amount || amount < 300 || amount > 10000) {
      toast.error("Enter a valid amount between 300 BDT and 10000 BDT!");
      setIsProcessing(false);
      return;
    }

    try {
      const { data } = await axios.post(
        `${base_url2}/api/payment/bkash`,
        {
          mid: "hobet",
          payerId: user_info.player_id,
          amount: amount,
          currency: "BDT",
          redirectUrl: `${frontend_url}`,
          orderId: orderId,
          callbackUrl: `${frontend_url}/callback-payment`
        },
        {
          headers: {
            'x-api-key': '8e91f27afc311cce77c1'
          }
        }
      );

      if (data.success) {
        window.location.href = data.link;
      } else {
        toast.error(data.message || "Bkash payment failed");
      }
    } catch (error) {
      console.error("Bkash error:", error);
      toast.error("Failed to process Bkash payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBankTransfer = async (e) => {
    e.preventDefault();
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

    if (selectedMethod.name.includes('P2P')) {
      handle_p2p_payment({ preventDefault: () => {} });
    } else if (selectedMethod.name === 'Bkash Fast') {
      handle_bkash_deposit({ preventDefault: () => {} });
    } else if (selectedMethod.name === 'Nagad Fast') {
      toast.info("Nagad Fast payment coming soon!");
    } else if (selectedMethod.type === 'Bank Transfer') {
      setShowMethodDetails(true);
    }
  };

  const resetPayment = () => {
    setSelectedMethod(null);
    setPaymentSuccess(false);
    setBankDetails({
      accountHolder: '',
      accountNumber: '',
      transactionId: ''
    });
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
          ) : (
            <motion.div
              key="payment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              {/* Payment Amount */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
                <h2 className="text-lg font-semibold mb-2">Payment Amount</h2>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full pl-4 pr-12 py-2 border-0 rounded-[5px] text-gray-700 bg-white bg-opacity-20 focus:ring-2 focus:ring-white focus:ring-opacity-50 text-2xl font-bold placeholder-white placeholder-opacity-70"
                    placeholder="Enter Amount"
                    min="100"
                    max="100000"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <span className="text-white text-2xl font-bold">৳</span>
                  </div>
                </div>
              </div>

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
                      Pay ৳{amount.toLocaleString()}
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
                          handleBankTransfer({ preventDefault: () => {} });
                        } else if (selectedMethod.name.includes('P2P')) {
                          handle_p2p_payment({ preventDefault: () => {} });
                        } else if (selectedMethod.name === 'Bkash Fast') {
                          handle_bkash_deposit({ preventDefault: () => {} });
                        } else if (selectedMethod.name === 'Nagad Fast') {
                          toast.info("Nagad Fast payment coming soon!");
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