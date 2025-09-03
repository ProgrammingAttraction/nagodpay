import React, { useState,useEffect  } from 'react';
import axios from 'axios';
import { FaSpinner, FaMoneyBillWave } from 'react-icons/fa';
import { MdError, MdInfo, MdPayment, MdAccountCircle, MdAttachMoney } from 'react-icons/md';
import { toast, Toaster } from 'react-hot-toast';
import withdraw_img from "../../assets/withdraw_img.png";
import { FaArrowRight } from "react-icons/fa6";
import { FaCheckCircle } from "react-icons/fa";
import { FaArrowLeft } from "react-icons/fa6";
import { FaCopy } from "react-icons/fa";
import { FaInfoCircle } from "react-icons/fa";
import { GiWallet } from "react-icons/gi";
import location_img from "../../assets/withdraw_img.png"
// -----------all-methods-images----------------------
import bkash_img from "../../assets/methods/bkash.jpg";
import bkash_fast from "../../assets/methods/bkash.jpg";
import nagad_img from "../../assets/methods/nagad.svg";
import nagad_free_img from "../../assets/methods/nagad_free.jpg";
import rocket_img from "../../assets/methods/rocket.jpg";
import upay_img from "../../assets/methods/upay.jpg";
import brac_img from "../../assets/methods/brac.jpg";
import duch_bangla_img from "../../assets/methods/duch_bangla.jpg";
import udb_bank_img from "../../assets/methods/udb_bank.jpg";
import mobile_img from "../../assets/booking.png";
import bank_img from "../../assets/bank.png"
import { MdArrowBackIos } from "react-icons/md";
import { IoMdAdd } from "react-icons/io";

const PaymentTabs = () => {
  const [activeTab, setActiveTab] = useState('deposit');
  
  return (
    <div className="min-h-screen font-anek bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-3 px-3 md:p-6">
      <Toaster 
        position="top-center"
      />
      
      <div className="w-full md:max-w-lg bg-white rounded-[5px] shadow-md overflow-hidden">
        {/* Tab headers */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('deposit')}
            className={`flex-1 py-4 px-6 cursor-pointer text-center font-semibold transition-all duration-300 ${
              activeTab === 'deposit'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span>Deposit</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`flex-1 py-4 px-6 text-center cursor-pointer font-semibold transition-all duration-300 ${
              activeTab === 'withdraw'
                ? 'bg-gradient-to-r from-green-600 to-teal-700 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span>Withdraw</span>
            </div>
          </button>
        </div>
        
        {/* Tab content */}
        <div className="p-4 md:p-6">
          {activeTab === 'deposit' ? <DepositForm /> : <WithdrawForm />}
        </div>
      </div>
    </div>
  );
};

import { FaMobileAlt } from "react-icons/fa";
import { FaBuilding } from "react-icons/fa";

import { 
    MdAccountBalance,
  MdAccountBalanceWallet
} from 'react-icons/md';

const DepositForm = () => {
  const merchantkey = "28915f245e5b2f4b7637";
  const [step, setStep] = useState(1); // 1: Select category, 2: Select method, 3: Enter details, 4: Show agent, 5: Success
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [playerId, setPlayerId] = useState('');
  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFindingAgent, setIsFindingAgent] = useState(false);
  const [errors, setErrors] = useState({});
  const [successData, setSuccessData] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentAccount, setAgentAccount] = useState(null);
  const [availableMethods, setAvailableMethods] = useState([]);
  const [methodsInDatabase, setMethodsInDatabase] = useState([]);

  // Configuration
  const frontend_url = window.location.origin;
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const base_url2 = "https://api.nagodpay.com";

  // Payment categories
  const paymentCategories = [
    {
      id: 'mobile',
      name: 'মোবাইল ব্যাংকিং',
      name_en: 'Mobile Banking',
      description: 'দ্রুত ডিপোজিটের জন্য মোবাইল ওয়ালেট ব্যবহার করুন',
      description_en: 'Quick deposits using mobile wallets',
      icon: mobile_img
    },
    {
      id: 'bank',
      name: 'ব্যাংক ট্রান্সফার',
      name_en: 'Bank Transfer',
      description: 'সরাসরি ব্যাংক ট্রান্সফার',
      description_en: 'Direct bank transfers',
      icon: bank_img
    }
  ];

  // All available payment methods with their images
  const allAvailableMethods = [
    { 
      id: 1, 
      name: 'Nagad', 
      name_bn: 'নগদ',
      image: "https://xxxbetgames.com/icons-xxx/payments/227.svg",
      type: 'regular',
      category: 'mobile',
      minAmount: 100,
      maxAmount: 30000,
    },
    { 
      id: 2, 
      name: 'Bkash', 
      name_bn: 'বিকাশ',
      image: "https://xxxbetgames.com/icons-xxx/payments/75.svg",
      type: 'regular',
      category: 'mobile',
      minAmount: 100,
      maxAmount: 30000,
    },
    { 
      id: 3, 
      name: 'Bkash Fast', 
      name_bn: 'বিকাশ ফাস্ট',
      image: "https://xxxbetgames.com/icons-xxx/payments/75.svg",
      type: 'fast',
      category: 'mobile',
      minAmount: 100,
      maxAmount: 30000,
    },
    { 
      id: 4, 
      name: 'Nagad Free', 
      name_bn: 'নগদ ফ্রি',
      image: nagad_free_img,
      type: 'nagad_free',
      category: 'mobile',
      minAmount: 100,
      maxAmount: 100000,
    },
    { 
      id: 5, 
      name: 'Rocket', 
      name_bn: 'রকেট',
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Rocket_mobile_banking_logo.svg/200px-Rocket_mobile_banking_logo.svg.png",
      type: 'regular',
      category: 'mobile',
      minAmount: 100,
      maxAmount: 30000,
    },
    { 
      id: 6, 
      name: 'Upay', 
      name_bn: 'উপায়',
      image: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Upay_logo.svg",
      type: 'regular',
      category: 'mobile',
      minAmount: 100,
      maxAmount: 30000,
    },
    { 
      id: 7, 
      name: 'Brac Bank', 
      name_bn: 'ব্র্যাক ব্যাংক',
      image: "https://play-lh.googleusercontent.com/xbBwfeUNIru5qMU0giaQIATfrt_AdMWujIhVu_M-RHG0SEVNY6lK_JQFQ_bER7k1jm8",
      type: 'bank',
      category: 'bank',
      minAmount: 100,
      maxAmount: 30000,
    },
    { 
      id: 8, 
      name: 'Dutch Bangla Bank', 
      name_bn: 'ডাচ-বাংলা ব্যাংক',
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8e4SixYh3d4Me6HuncJHAA60BCGS6HFx-kQ&s",
      type: 'bank',
      category: 'bank',
      minAmount: 100,
      maxAmount: 30000,
    },
    { 
      id: 9, 
      name: 'UCB Bank', 
      name_bn: 'ইউসিবি ব্যাংক',
      image: "https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/Logo_of_United_Commercial_Bank.svg/800px-Logo_of_United_Commercial_Bank.svg.png",
      type: 'bank',
      category: 'bank',
      minAmount: 100,
      maxAmount: 30000,
    },
  ];

  // Function to check if method exists in database
  const checkMethodsInDatabase = async () => {
    try {
      // This would be your actual API call to check which methods exist in the database
      // For now, I'll simulate it with a mock response
      const response = await axios.get(`${base_url}/api/admin/payment-methods`, {
        headers: {
          'x-api-key': 'your-admin-api-key-here'
        }
      });
      
      if (response.data.success) {
        setMethodsInDatabase(response.data.data);
        
        // Filter available methods to only show those that exist in the database
        const enabledMethods = allAvailableMethods.filter(method => 
          response.data.data.some(dbMethod => dbMethod.name === method.name && dbMethod.isEnabled)
        );
        
        setAvailableMethods(enabledMethods);
      }
    } catch (error) {
      console.error('Error checking methods in database:', error);
      // If there's an error, show all methods as fallback
      setAvailableMethods(allAvailableMethods);
    }
  };

  // Check methods on component mount
  React.useEffect(() => {
    checkMethodsInDatabase();
  }, []);

  // Filter methods by category
  const filteredMethods = selectedCategory 
    ? availableMethods.filter(method => method.category === selectedCategory.id)
    : [];

  // Copy to clipboard function
  const copyToClipboard = (text, message) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(message || 'কপি করা হয়েছে!');
    }).catch(err => {
      toast.error('কপি করতে ব্যর্থ: ' + err);
    });
  };

  // Find eligible agent for bank transfer or nagad free
  const findEligibleAgent = async () => {
    if (!amount || !playerId) {
      toast.error('প্রথমে Player ID এবং Amount লিখুন');
      return;
    }

    setIsFindingAgent(true);
    try {
      let endpoint = '';
      if (selectedMethod.type === 'bank') {
        endpoint = `${base_url}/api/payment/find-bank-agent-auto`;
      } else if (selectedMethod.type === 'nagad_free') {
        endpoint = `${base_url}/api/payment/find-nagad-free-agent-auto`;
      } else {
        return;
      }

      const response = await axios.post(endpoint, {
        provider: selectedMethod.name,
        amount: parseFloat(amount)
      }, {
        headers: {
          'x-api-key': merchantkey
        }
      });

      if (response.data.success) {
        setSelectedAgent(response.data.agent);
        setAgentAccount(response.data.bankAccount || response.data.nagadAccount);
        setStep(4); // Move to agent details step
        toast.success('এজেন্ট পাওয়া গেছে!');
      } else {
        toast.error(response.data.message || 'কোনো এজেন্ট পাওয়া যায়নি');
      }
    } catch (error) {
      console.error('Agent finding error:', error);
      toast.error(error.response?.data?.message || 'এজেন্ট খুঁজে পেতে সমস্যা হয়েছে');
    } finally {
      setIsFindingAgent(false);
    }
  };

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    if (!playerId.trim()) {
      newErrors.playerId = 'Player ID প্রয়োজন';
    } else if (!/^[a-zA-Z0-9]+$/.test(playerId)) {
      newErrors.playerId = 'Player ID শুধুমাত্র অক্ষর এবং সংখ্যা হতে পারে';
    }

    if (!amount) {
      newErrors.amount = 'Amount প্রয়োজন';
    } else if (isNaN(amount)) {
      newErrors.amount = 'Amount必须是数字';
    } else if (parseFloat(amount) < selectedMethod.minAmount) {
      newErrors.amount = `ন্যূনতম ডিপোজিট Amount ${selectedMethod.minAmount} BDT`;
    } else if (parseFloat(amount) > selectedMethod.maxAmount) {
      newErrors.amount = `সর্বোচ্চ ডিপোজিট Amount ${selectedMethod.maxAmount} BDT`;
    }

    // Account number validation for bank methods only (not for nagad_free)
    if (selectedMethod.type === 'bank') {
      if (!accountNumber.trim()) {
        newErrors.accountNumber = 'অ্যাকাউন্ট নম্বর প্রয়োজন';
      } else if (!/^[0-9]+$/.test(accountNumber)) {
        newErrors.accountNumber = 'অ্যাকাউন্ট নম্বর শুধুমাত্র সংখ্যা হতে পারে';
      } else if (accountNumber.length < 5) {
        newErrors.accountNumber = 'অ্যাকাউন্ট নম্বর কমপক্ষে 5 ডিজিট হতে হবে';
      }
    }

    // Transaction ID validation for nagad free only (not for bank)
    if (selectedMethod.type === 'nagad_free' && step === 4) {
      if (!transactionId.trim()) {
        newErrors.transactionId = 'ট্রানজেকশন ID প্রয়োজন';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setStep(2);
    setSelectedAgent(null);
    setAgentAccount(null);
  };

  // Handle method selection
  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    if (method.type === 'bank' || method.type === 'nagad_free') {
      setStep(3); // Go to details entry step first
    } else {
      setStep(3); // For other methods, go directly to details
    }
    setSelectedAgent(null);
    setAgentAccount(null);
    setTransactionId('');
  };

  // Handle back to category selection
  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setStep(1);
    setSelectedAgent(null);
    setAgentAccount(null);
  };

  // Handle back to method selection
  const handleBackToMethods = () => {
    setSelectedMethod(null);
    setAccountNumber('');
    setTransactionId('');
    setSelectedAgent(null);
    setAgentAccount(null);
    setStep(2);
  };

  // Handle back to details entry from agent step
  const handleBackToDetails = () => {
    setStep(3);
  };

  // Reset form for new deposit
  const handleNewDeposit = () => {
    setSelectedCategory(null);
    setPlayerId('');
    setAmount('');
    setAccountNumber('');
    setTransactionId('');
    setSelectedMethod(null);
    setSuccessData(null);
    setSelectedAgent(null);
    setAgentAccount(null);
    setStep(1);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      Object.values(errors).forEach(error => {
        toast.error(error);
      });
      return;
    }

    setIsLoading(true);

    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const numericAmount = parseFloat(amount);

    try {
      if (selectedMethod.type === 'fast') {
        // Bkash Fast method
        const { data } = await axios.post(
          `${base_url}/api/payment/p2c/bkash/payment`,
          {
            mid: "nagodpay",
            payerId: playerId,
            amount: numericAmount,
            currency: "BDT",
            redirectUrl: "https://nagodpay.com",
            orderId: orderId,
            callbackUrl: `https://nagodpay.com/callback`
          },
          {
            headers: {
              'x-api-key': merchantkey
            }
          }
        );

        if (data.success) {
          window.location.href = data.link;
        } else {
          setErrors({ form: data.message || 'Bkash Fast payment initiation failed' });
          toast.error(data.message || 'Bkash Fast payment initiation failed');
        }
      } else if (selectedMethod.type === 'bank') {
        // Bank account payment - using the new bank-deposit route
        const postData = {
          playerId,
          amount: numericAmount,
          accountNumber,
          bankName: selectedMethod.name,
          provider: selectedMethod.name.toLowerCase(),
          orderId,
          currency: "BDT",
          // No transactionId for bank transfers
        };

        const response = await axios.post(
          `${base_url}/api/payment/bank-deposit`,
          postData,
          {
            headers: {
              'x-api-key': merchantkey,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.success) {
          // Store success data and show success screen
          setSuccessData({
            method: selectedMethod.name,
            amount: numericAmount,
            playerId,
            orderId,
            accountNumber,
            timestamp: new Date().toLocaleString('bn-BD'),
            agent: selectedAgent,
            account: agentAccount
          });
          setStep(5);
          toast.success('ব্যাংক ডিপোজিট রিকোয়েস্ট সফলভাবে জমা হয়েছে!');
        } else {
          toast.error(response.data.message || 'ব্যাংক ডিপোজিট রিকোয়েস্ট ব্যর্থ হয়েছে');
        }
      } else if (selectedMethod.type === 'nagad_free') {
        // Nagad Free payment method - no account number needed
        const postData = {
          playerId,
          amount: numericAmount,
          provider: 'nagad_free',
          orderId,
          currency: "BDT",
          agentAccount:agentAccount.accountNumber,
          transactionId
        };

        const response = await axios.post(
          `${base_url}/api/payment/nagad-free-deposit`,
          postData,
          {
            headers: {
              'x-api-key': merchantkey,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.success) {
          // Store success data and show success screen
          setSuccessData({
            method: selectedMethod.name,
            amount: numericAmount,
            playerId,
            orderId,
            transactionId,
            timestamp: new Date().toLocaleString('bn-BD'),
            agent: selectedAgent,
            account: agentAccount
          });
          setStep(5);
          toast.success('নগদ ফ্রি ডিপোজিট রিকোয়েস্ট সফলভাবে জমা হয়েছে!');
        } else {
          toast.error(response.data.message || 'নগদ ফ্রি ডিপোজিট রিকোয়েস্ট ব্যর্থ হয়েছে');
        }
      } else {
        // Regular payment methods
        const postData = {
          provider: selectedMethod.name.toLowerCase(),
          amount: numericAmount,
          orderId: orderId,
          currency: "BDT",
          payerId: playerId,
          redirectUrl: frontend_url,
          callbackUrl: `${base_url}/admin/deposit-success`
        };

        const response = await axios.post(
          `${base_url}/api/payment/payment`,
          postData,
          {
            headers: {
              'x-api-key': merchantkey,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.success) {
          // Store success data and show success screen
          setSuccessData({
            method: selectedMethod.name,
            amount: numericAmount,
            playerId,
            orderId,
            timestamp: new Date().toLocaleString('bn-BD')
          });
          toast.success('পেমেন্ট গেটওয়েতে রিডাইরেক্ট হচ্ছে...');
          setTimeout(() => {
            window.location.href = `https://nagodpay.com/checkout/${response.data.paymentId}`;
          }, 1500);
        } else {
          toast.error(response.data.message || 'পেমেন্ট শুরু করতে ব্যর্থ হয়েছে');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'আপনার পেমেন্ট প্রসেস করতে একটি ত্রুটি হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="font-anek max-w-4xl mx-auto bg-white  py-6">
      <div className="text-gray-700 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ফান্ড ডিপোজিট করুন
            </h2>
            <p className="text-sm md:text-base mt-1 text-gray-500">সুরক্ষিত এবং তাত্ক্ষণিক ডিপোজিট</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md flex items-center justify-center">
            <MdPayment className="text-2xl text-white" />
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      {step !== 5 && (
        <div className="mt-8 mb-8">
          <div className="flex justify-between items-center relative">
            {/* Progress line */}
            <div className="absolute top-4 left-0 right-0 mx-10 h-2 bg-gray-200 rounded-full">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-700 ease-in-out" 
                style={{ width: `${(step - 1) / 4 * 100}%` }}
              ></div>
            </div>
            
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex flex-col items-center z-10 relative">
                {/* Step circle */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                  step >= stepNum 
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg scale-110 ring-4 ring-blue-100' 
                    : 'bg-white border-2 border-gray-300 text-gray-400'
                } font-bold relative`}>
                  {step > stepNum ? (
                    <FaCheckCircle className="text-lg" />
                  ) : (
                    stepNum
                  )}
                  
                  {/* Pulse animation for current step */}
                  {step === stepNum && (
                    <span className="absolute -inset-2 bg-blue-400 rounded-full opacity-0 animate-ping"></span>
                  )}
                </div>
                
                {/* Step label - shorter text */}
                <div className={`text-xs font-medium mt-3 transition-colors duration-300 ${
                  step >= stepNum ? 'text-blue-700 font-semibold' : 'text-gray-500'
                } text-center`}>
                  {stepNum === 1 && 'ক্যাটাগরি'}
                  {stepNum === 2 && 'পদ্ধতি'}
                  {stepNum === 3 && 'বিবরণ'}
                  {stepNum === 4 && (selectedMethod?.type === 'bank' || selectedMethod?.type === 'nagad_free') ? 'এজেন্ট' : <span className='ml-1'>নিশ্চিত</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Category Selection */}
      {step === 1 && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
            {paymentCategories.map((category) => (
              <div
                key={category.id}
                onClick={() => handleCategorySelect(category)}
                className={`p-6 border-1 rounded-[5px] cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  selectedCategory?.id === category.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="p-2 rounded-full bg-white mb-1">
                  <img className='w-[50px]' src={category.icon} alt="" />
                  </div>
                  <div>
                    <h4 className={`text-[16px] font-semibold ${selectedCategory?.id === category.id ? 'text-blue-600' : 'text-gray-800'}`}>
                      {category.name} ({category.name_en})
                    </h4>
                    <p className="text-sm text-gray-600 mt-2">
                      {category.description}
                    </p>
                  </div>
                  {selectedCategory?.id === category.id && (
                    <div className="mt-4 bg-blue-600 rounded-full p-1">
                      <FaCheckCircle className="text-white text-sm" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {selectedCategory && (
            <div className="p-4 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 shadow-sm">
              <div className="flex items-center">
                <div className="bg-white p-2 rounded-lg mr-3 border border-blue-200">
                  {selectedCategory.icon}
                </div>
                <div>
                  <h4 className="font-semibold">নির্বাচিত: {selectedCategory.name}</h4>
                  <p className="text-sm opacity-90 mt-1">
                    {selectedCategory.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setStep(2)}
              disabled={!selectedCategory}
              className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-[5px] transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              পরবর্তী ধাপ <MdOutlineArrowForwardIos className="ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Method Selection */}
      {step === 2 && selectedCategory && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
            {filteredMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => handleMethodSelect(method)}
                className={`p-4 border-1 rounded-[5px] cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  selectedMethod?.id === method.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="p-3 rounded-xl ">
                    <img 
                      src={method.image} 
                      alt={method.name} 
                      className="h-8 w-8 object-contain mx-auto"
                    />
                  </div>
                  <div>
                    <h4 className={`font-semibold text-sm ${selectedMethod?.id === method.id ? 'text-blue-600' : 'text-gray-800'}`}>
                      {method.name} ({method.name_bn})
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {method.minAmount} - {method.maxAmount} BDT
                    </p>
                  </div>
                  {selectedMethod?.id === method.id && (
                    <div className="mt-3 bg-blue-600 rounded-full p-1">
                      <FaCheckCircle className="text-white text-sm" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {selectedMethod && (
            <div className="p-4 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 shadow-sm">
              <div className="flex items-center">
                <div className="bg-white p-2 rounded-lg mr-3 border border-blue-200">
                  <img 
                    src={selectedMethod.image} 
                    alt={selectedMethod.name} 
                    className="h-10 w-10 object-contain"
                  />
                </div>
                <div>
                  <h4 className="font-semibold">নির্বাচিত: {selectedMethod.name} ({selectedMethod.name_bn})</h4>
                  <p className="text-sm opacity-90 mt-1">
                    আপনার ডিপোজিট {selectedMethod.name} এর মাধ্যমে প্রসেস করা হবে
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button
              onClick={handleBackToCategories}
              className="flex items-center justify-center px-6 py-3 border-1 border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-semibold rounded-[5px] cursor-pointer transition-all"
            >
              <MdArrowBackIos className="mr-2" /> পিছনে
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!selectedMethod}
              className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-[5px] transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              পরবর্তী ধাপ <MdOutlineArrowForwardIos className="ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Deposit Details for all methods */}
      {step === 3 && selectedMethod && (
        <form onSubmit={selectedMethod.type === 'bank' || selectedMethod.type === 'nagad_free' ? (e) => {e.preventDefault(); findEligibleAgent();} : handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center bg-white px-4 w-full border-[1px] border-gray-200 py-2">
              <div className="p-2 rounded-lg mr-2">
                <img 
                  src={selectedMethod.image} 
                  alt={selectedMethod.name} 
                  className="h-6 w-6 object-contain"
                />
              </div>
              <span className="text-sm font-semibold text-gray-700">{selectedMethod.name} ({selectedMethod.name_bn})</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            {/* Player ID Field */}
            <div>
              <label htmlFor="depositPlayerId" className="block text-sm font-semibold text-gray-700 mb-2">
                প্লেয়ার ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="depositPlayerId"
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                className={`w-full px-4 py-3 rounded-[5px] border-1 outline-blue-500 ${
                  errors.playerId ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="আপনার প্লেয়ার ID লিখুন"
              />
              {errors.playerId && (
                <p className="mt-1 text-sm text-red-600">{errors.playerId}</p>
              )}
            </div>

            {/* Account Number Field for bank methods only (not for nagad_free) */}
            {selectedMethod.type === 'bank' && (
              <div>
                <label htmlFor="accountNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                  ব্যাংক অ্যাকাউন্ট নম্বর <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="accountNumber"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className={`w-full px-4 py-3 rounded-[5px] border-1 outline-blue-500 ${
                    errors.accountNumber ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="আপনার ব্যাংক অ্যাকাউন্ট নম্বর লিখুন"
                />
                {errors.accountNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>
                )}
              </div>
            )}

            {/* Amount Field */}
            <div>
              <label htmlFor="depositAmount" className="block text-sm font-semibold text-gray-700 mb-2">
                Amount (BDT) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="depositAmount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full px-4 py-3 rounded-[5px] border-1 outline-blue-500 ${
                  errors.amount ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="Amount লিখুন"
                min={selectedMethod.minAmount}
                max={selectedMethod.maxAmount}
              />
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>সর্বনিম্ন: {selectedMethod.minAmount} BDT</span>
                <span>সর্বোচ্চ: {selectedMethod.maxAmount} BDT</span>
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-[5px] p-4">
            <p className="text-sm text-yellow-800 flex items-start">
              <MdInfo className="mr-2 mt-0.5 flex-shrink-0 text-yellow-600 text-lg" />
              <span> সঠিক তথ্য দিন অন্যথায় আমরা দায়ী থাকব না। (Provide correct information otherwise we will not be responsible.)</span>
            </p>
          </div>

          <div className="flex flex-col-reverse md:flex-row justify-between gap-4 pt-4">
            <button
              type="button"
              onClick={handleBackToMethods}
              className="flex items-center justify-center px-6 py-3 border-2 border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-semibold rounded-lg cursor-pointer transition-all"
            >
              <MdArrowBackIos className="mr-2" /> পিছনে
            </button>
            <button
              type="submit"
              disabled={isLoading || !amount || !playerId || (selectedMethod.type === 'bank' && !accountNumber)}
              className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg cursor-pointer transition-all duration-300 disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  প্রসেস হচ্ছে...
                </>
              ) : (
                <>
                  {(selectedMethod.type === 'bank' || selectedMethod.type === 'nagad_free') ? 'এজেন্ট খুঁজুন' : 'ডিপোজিট নিশ্চিত করুন'} <MdOutlineArrowForwardIos className="ml-2" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Step 4: Agent Information for Nagad Free and Bank Transfer */}
      {step === 4 && selectedMethod && (selectedMethod.type === 'nagad_free' || selectedMethod.type === 'bank') && agentAccount && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center bg-white px-4 w-full border-[1px] border-gray-200 py-2">
              <div className="p-2 rounded-lg mr-2">
                <img 
                  src={selectedMethod.image} 
                  alt={selectedMethod.name} 
                  className="h-6 w-6 object-contain"
                />
              </div>
              <span className="text-sm font-semibold text-gray-700">{selectedMethod.name} ({selectedMethod.name_bn})</span>
            </div>
          </div>

          {/* Agent Account Information */}
          <div className=" rounded-xl ">
            <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center">
              <MdAccountBalanceWallet className="mr-2" />
              মার্চেন্ট অ্যাকাউন্ট তথ্য
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <p className="text-sm font-medium text-blue-600">প্রদানকারী</p>
                <p className="text-lg font-semibold text-gray-900">{agentAccount.provider}</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <p className="text-sm font-medium text-blue-600">অ্যাকাউন্ট নম্বর</p>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-gray-900 font-mono">{agentAccount.accountNumber}</p>
                  <button
                    onClick={() => copyToClipboard(agentAccount.accountNumber, 'অ্যাকাউন্ট নম্বর কপি করা হয়েছে!')}
                    className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100 transition-colors"
                    title="কপি করুন"
                  >
                    <FaCopy size={16} />
                  </button>
                </div>
              </div>
            </div>
      
          </div>

          {/* Transaction ID Field for Nagad Free only */}
          {selectedMethod.type === 'nagad_free' && (
            <div className="bg-white ">
              <div className="mb-4">
                <label htmlFor="transactionId" className="block text-sm font-semibold text-gray-700 mb-2">
                  ট্রানজেকশন ID (UTR, Reference No) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="transactionId"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className={`w-full px-4 py-3 rounded-[5px] border-1 outline-blue-500 ${
                    errors.transactionId ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="আপনার ট্রানজেকশন ID লিখুন"
                />
                {errors.transactionId && (
                  <p className="mt-1 text-sm text-red-600">{errors.transactionId}</p>
                )}
              </div>
            </div>
          )}
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800 flex items-start">
              <FaInfoCircle className="mr-2 mt-0.5 flex-shrink-0 text-yellow-600" />
              <span>
                 উপরের অ্যাকাউন্টে {amount} BDT পেমেন্ট করুন {selectedMethod.type === 'nagad_free' ? 'এবং ট্রানজেকশন ID প্রদান করুন।' : ''}
                {selectedMethod.type === 'bank' ? ' ব্যাংক ট্রানজেকশন সম্পূর্ণ হলে Confirm Deposit বাটনে ক্লিক করুন।' : ' নগদ ট্রানজেকশন সম্পূর্ণ হলে Confirm Deposit বাটনে ক্লিক করুন।'}
              </span>
            </p>
          </div>

          <div className="flex flex-col-reverse md:flex-row justify-between gap-4 pt-4">
            <button
              type="button"
              onClick={handleBackToDetails}
              className="flex items-center justify-center px-6 py-3 border-2 border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-semibold rounded-lg cursor-pointer transition-all"
            >
              <MdArrowBackIos className="mr-2" /> পিছনে
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || (selectedMethod.type === 'nagad_free' && !transactionId)}
              className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg cursor-pointer transition-all duration-300 disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  প্রসেস হচ্ছে...
                </>
              ) : (
                <>
                  ডিপোজিট নিশ্চিত করুন <MdOutlineArrowForwardIos className="ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Success Message */}
      {step === 5 && successData && (
        <div className="bg-white">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
              <FaCheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="mt-5 text-2xl font-semibold text-gray-900">ডিপোজিট সফল!</h3>
            <div className="mt-6 bg-gray-50 p-5 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-sm font-medium text-gray-500">পেমেন্ট পদ্ধতি</p>
                  <p className="text-lg font-semibold text-gray-900">{successData.method}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Amount</p>
                  <p className="text-lg font-semibold text-gray-900">{successData.amount} BDT</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">প্লেয়ার ID</p>
                  <p className="text-lg font-semibold text-gray-900">{successData.playerId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">অর্ডার ID</p>
                  <p className="text-lg font-semibold text-gray-900">{successData.orderId}</p>
                </div>
                {successData.accountNumber && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">অ্যাকাউন্ট নম্বর</p>
                    <p className="text-lg font-semibold text-gray-900">{successData.accountNumber}</p>
                  </div>
                )}
                {successData.transactionId && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">ট্রানজেকশন ID</p>
                    <p className="text-lg font-semibold text-gray-900">{successData.transactionId}</p>
                  </div>
                )}
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">ট্রানজেকশন সময়</p>
                  <p className="text-lg font-semibold text-gray-900">{successData.timestamp}</p>
                </div>
              </div>
            </div>


            <p className="mt-6 text-sm text-gray-600">
              আপনার ডিপোজিট সফলভাবে প্রসেস করা হয়েছে। এমাউন্ট শীঘ্রই রিভিউ করার পরে আপনার অ্যাকাউন্টে জমা করা হবে।
            </p>
            <div className="mt-8">
              <button
                onClick={handleNewDeposit}
                className="inline-flex items-center cursor-pointer justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                আরেকটি ডিপোজিট করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



import { MdOutlineArrowBackIos } from "react-icons/md";
import { MdOutlineArrowForwardIos } from "react-icons/md";
import { FaTimesCircle } from "react-icons/fa";
const WithdrawForm = () => {
  const [activeTab, setActiveTab] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    playerId: '',
    code: '',
    amount: '',
    accountNumber: '',
    selectedMethod: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [withdrawalResult, setWithdrawalResult] = useState(null);
  const [availableMethods, setAvailableMethods] = useState([]);
  const [methodsInDatabase, setMethodsInDatabase] = useState([]);

  // Configuration
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const merchantkey = "28915f245e5b2f4b7637";
  
  // Payment categories
  const paymentCategories = [
    {
      id: 'mobile',
      name: 'মোবাইল ব্যাংকিং',
      name_en: 'Mobile Banking',
      description: 'দ্রুত উত্তোলনের জন্য মোবাইল ওয়ালেট ব্যবহার করুন',
      description_en: 'Quick withdrawals to mobile wallets',
      icon: mobile_img
    },
    {
      id: 'bank',
      name: 'ব্যাংক ট্রান্সফার',
      name_en: 'Bank Transfer',
      description: 'সরাসরি ব্যাংক ট্রান্সফার',
      description_en: 'Direct bank transfers',
      icon: bank_img
    }
  ];

  // All available withdrawal methods with their images
  const allAvailableMethods = [
    { 
      id: 1, 
      name: 'Nagad', 
      name_bn: 'নগদ',
      image: "https://xxxbetgames.com/icons-xxx/payments/227.svg",
      category: 'mobile',
      minAmount: 200,
      maxAmount: 50000
    },
    { 
      id: 2, 
      name: 'Bkash', 
      name_bn: 'বিকাশ',
      image: "https://xxxbetgames.com/icons-xxx/payments/75.svg",
      category: 'mobile',
      minAmount: 200,
      maxAmount: 50000
    },
    { 
      id: 5, 
      name: 'Rocket', 
      name_bn: 'রকেট',
      image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Rocket_mobile_banking_logo.svg/200px-Rocket_mobile_banking_logo.svg.png",
      category: 'mobile',
      minAmount: 200,
      maxAmount: 50000
    },
    { 
      id: 6, 
      name: 'Upay', 
      name_bn: 'উপায়',
      image: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Upay_logo.svg",
      category: 'mobile',
      minAmount: 200,
      maxAmount: 50000
    },
    { 
      id: 7, 
      name: 'BRAC Bank', 
      name_bn: 'ব্র্যাক ব্যাংক',
      image: "https://play-lh.googleusercontent.com/xbBwfeUNIru5qMU0giaQIATfrt_AdMWujIhVu_M-RHG0SEVNY6lK_JQFQ_bER7k1jm8",
      category: 'bank',
      minAmount: 200,
      maxAmount: 50000
    },
    { 
      id: 8, 
      name: 'Dutch Bangla', 
      name_bn: 'ডাচ-বাংলা ব্যাংক',
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR8e4SixYh3d4Me6HuncJHAA60BCGS6HFx-kQ&s",
      category: 'bank',
      minAmount: 200,
      maxAmount: 50000
    },
    { 
      id: 9, 
      name: 'UCB Bank', 
      name_bn: 'ইউসিবি ব্যাংক',
      image: "https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/Logo_of_United_Commercial_Bank.svg/800px-Logo_of_United_Commercial_Bank.svg.png",
      category: 'bank',
      minAmount: 200,
      maxAmount: 50000
    },
  ];

  // Function to check if method exists in database
  const checkMethodsInDatabase = async () => {
    try {
      // This would be your actual API call to check which methods exist in the database
      // For now, I'll simulate it with a mock response
      const response = await axios.get(`${base_url}/api/admin/payment-methods`, {
        headers: {
          'x-api-key': 'your-admin-api-key-here'
        }
      });
      
      if (response.data.success) {
        setMethodsInDatabase(response.data.data);
        
        // Filter available methods to only show those that exist in the database
        const enabledMethods = allAvailableMethods.filter(method => 
          response.data.data.some(dbMethod => dbMethod.name === method.name && dbMethod.isEnabled)
        );
        
        setAvailableMethods(enabledMethods);
      }
    } catch (error) {
      console.error('Error checking methods in database:', error);
      // If there's an error, show all methods as fallback
      setAvailableMethods(allAvailableMethods);
    }
  };

  // Check methods on component mount
  useEffect(() => {
    checkMethodsInDatabase();
  }, []);

  // Filter methods by category
  const filteredMethods = selectedCategory 
    ? availableMethods.filter(method => method.category === selectedCategory.id)
    : [];

  // Copy to clipboard function
  const copyToClipboard = (text, message) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(message || 'কপি করা হয়েছে!');
    }).catch(err => {
      toast.error('কপি করতে ব্যর্থ: ' + err);
    });
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
    
    // Clear error when field is updated
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      });
    }
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  // Handle method selection
  const handleMethodSelect = (method) => {
    setFormData({
      ...formData,
      selectedMethod: method
    });
  };

  // Handle back to category selection
  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setFormData({
      ...formData,
      selectedMethod: null
    });
  };

  // Validate current tab
  const validateTab = (tabNumber) => {
    const newErrors = {};
    
    if (tabNumber === 1) {
      // No validation needed for tab 1 as we're only selecting payment method
    }
    
    if (tabNumber === 2) {
      if (!formData.playerId.trim()) {
        newErrors.playerId = 'প্লেয়ার ID প্রয়োজন';
      }
      
      if (!formData.code.trim()) {
        newErrors.code = 'কোড প্রয়োজন';
      } else if (!/^[a-zA-Z0-9]+$/.test(formData.code)) {
        newErrors.code = 'কোড শুধুমাত্র অক্ষর এবং সংখ্যা হতে পারে';
      }
    }
    
    if (tabNumber === 3) {
      if (isNaN(formData.amount)) {
        newErrors.amount = 'Amount';
      } else if (parseFloat(formData.amount) < formData.selectedMethod.minAmount) {
        newErrors.amount = `ন্যূনতম উত্তোলন Amount ${formData.selectedMethod.minAmount} BDT`;
      } else if (parseFloat(formData.amount) > formData.selectedMethod.maxAmount) {
        newErrors.amount = `সর্বোচ্চ উত্তোলন Amount ${formData.selectedMethod.maxAmount} BDT`;
      }
      
      if (!formData.accountNumber.trim()) {
        newErrors.accountNumber = 'অ্যাকাউন্ট নম্বর প্রয়োজন';
      } else if (!/^[0-9]+$/.test(formData.accountNumber)) {
        newErrors.accountNumber = 'অ্যাকাউন্ট নম্বর শুধুমাত্র সংখ্যা হতে পারে';
      } else if (formData.accountNumber.length < 10 || formData.accountNumber.length > 15) {
        newErrors.accountNumber = 'অ্যাকাউন্ট নম্বর ১০-১৫ ডিজিট হতে হবে';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigate to next tab
  const goToNextTab = () => {
    if (activeTab === 1 && !selectedCategory) {
      setErrors({ category: 'দয়া করে একটি ক্যাটাগরি নির্বাচন করুন' });
      toast.error('দয়া করে একটি ক্যাটাগরি নির্বাচন করুন');
      return;
    }
    
    if (activeTab === 1 && !formData.selectedMethod) {
      setErrors({ method: 'দয়া করে একটি পেমেন্ট পদ্ধতি নির্বাচন করুন' });
      toast.error('দয়া করে একটি পেমেন্ট পদ্ধতি নির্বাচন করুন');
      return;
    }
    
    if (validateTab(activeTab)) {
      setActiveTab(activeTab + 1);
    } else {
      // Show error toasts for all errors
      Object.values(errors).forEach(error => {
        toast.error(error);
      });
    }
  };

  // Navigate to previous tab
  const goToPrevTab = () => {
    setActiveTab(activeTab - 1);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateTab(3)) {
      Object.values(errors).forEach(error => {
        toast.error(error);
      });
      return;
    }

    setIsLoading(true);

    const orderId = `WDR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const withdrawalData = {
      merchantId: "shihab",
      provider: formData.selectedMethod.name.toLowerCase(),
      amount: parseFloat(formData.amount),
      orderId: orderId,
      playerId: formData.playerId,
      code: formData.code,
      payeeAccount: formData.accountNumber,
      callbackUrl: `${base_url}/api/payment/payout/callback`,
      currency: "BDT",
      payeeId: formData.playerId,
      paymentId: formData.code,
    };

    try {
      const response = await axios.post(
        `${base_url}/api/payment/payout`,
        withdrawalData,
        {
          headers: {
            'x-api-key': merchantkey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data) {
        setWithdrawalResult({
          success: true,
          message: 'উত্তোলন রিকোয়েস্ট সফলভাবে জমা হয়েছে!',
          transactionId: orderId
        });
        setActiveTab(4); // Success tab
      }
    } catch (error) {
      console.error('Player not found!');
      setWithdrawalResult({
        success: false,
        message: 'প্লেয়ার খুঁজে পাওয়া যায়নি!',
        details: 'দয়া করে আপনার প্লেয়ার ID এবং উত্তোলন কোড পরীক্ষা করে আবার চেষ্টা করুন।'
      });
      setActiveTab(4); // Show result tab even for failure
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form and start over
  const resetForm = () => {
    setSelectedCategory(null);
    setFormData({
      playerId: '',
      code: '',
      amount: '',
      accountNumber: '',
      selectedMethod: null
    });
    setActiveTab(1);
    setErrors({});
    setWithdrawalResult(null);
  };

  return (
    <div className="font-anek flex items-center justify-center w-full">
      <Toaster 
        position="top-center"
      />
      
      <div className="w-full bg-white text-gray-700 overflow-hidden">
        {/* Header with gradient */}
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className='flex justify-between items-center w-full'>
              <div>
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  ফান্ড উত্তোলন করুন
                </h2>
                <p className="text-sm md:text-base mt-1 text-gray-500">সুরক্ষিত এবং দ্রুত উত্তোলন</p>
              </div>
              <div className="bg-green-600 p-3 text-white rounded-[5px] flex items-center justify-center">
                <GiWallet className="text-2xl" />
              </div>
            </div>
          </div>
          
          {/* Progress Steps - Only show for tabs 1-3 */}
          {activeTab < 4 && (
            <div className="mt-8 mb-6 px-4">
              <div className="flex justify-between items-center relative">
                {/* Progress line */}
                <div className="absolute top-4 left-10 right-10 h-1.5 bg-gray-200 rounded-full">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-700 ease-in-out" 
                    style={{ width: `${(activeTab - 1) / 3 * 100}%` }}
                  ></div>
                </div>
                
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex flex-col items-center z-10 relative">
                    {/* Step circle */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                      activeTab >= step 
                        ? 'bg-gradient-to-br from-green-600 to-green-600 text-white shadow-lg scale-110' 
                        : 'bg-white border-2 border-gray-300 text-gray-400'
                    } font-bold relative`}>
                      {activeTab > step ? (
                        <FaCheckCircle className="text-lg" />
                      ) : (
                        step
                      )}
                      
                      {/* Pulse animation for current step */}
                      {activeTab === step && (
                        <span className="absolute -inset-2 bg-green-400 rounded-full opacity-0 animate-ping"></span>
                      )}
                    </div>
                    
                    {/* Step label */}
                    <div className={`text-xs font-medium mt-3 transition-colors duration-300 ${
                      activeTab >= step ? 'text-green-700 font-semibold' : 'text-gray-500'
                    }`}>
                      {step === 1 && 'পদ্ধতি'}
                      {step === 2 && 'অ্যাকাউন্ট'}
                      {step === 3 && 'Amount'}
                    </div>
                    
                    {/* Connector lines between steps */}
                    {step < 3 && (
                      <div className="absolute top-6 left-16 w-10 h-0.5 bg-transparent"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Form container */}
        <div className="pb-6">
          {/* Tab 1: Payment Method Selection */}
          {activeTab === 1 && (
            <div className="space-y-6">
              {!selectedCategory ? (
                // Category selection
                <>
                  <div className="w-full">
                    <img className='w-full' src={location_img} alt="Payment methods" />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                    {paymentCategories.map((category) => (
                      <div
                        key={category.id}
                        onClick={() => handleCategorySelect(category)}
                        className={`p-4 border-2 rounded-[5px] cursor-pointer transition-all ${
                          selectedCategory?.id === category.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className="p-3 rounded-full bg-white mb-2">
                         <img className='w-[50px]' src={category.icon} alt="" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800">{category.name} ({category.name_en})</h4>
                            <p className="text-xs text-gray-600 mt-1">{category.description}</p>
                          </div>
                          {selectedCategory?.id === category.id && (
                            <div className="mt-3 bg-blue-500 rounded-full p-1">
                              <FaCheckCircle className="text-white text-sm" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {errors.category && (
                    <p className="text-sm text-red-600 text-center">{errors.category}</p>
                  )}
                </>
              ) : (
                // Method selection
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-3 gap-4">
                    {filteredMethods.map((method) => (
                      <div
                        key={method.id}
                        onClick={() => handleMethodSelect(method)}
                        className={`p-4 border-2 rounded-[5px] cursor-pointer transition-all ${
                          formData.selectedMethod?.id === method.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className="p-3 rounded-xl ">
                            <img 
                              src={method.image} 
                              alt={method.name} 
                              className="h-8 w-8 object-contain mx-auto"
                            />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800 text-sm">{method.name} ({method.name_bn})</h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {method.minAmount} - {method.maxAmount} BDT
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {formData.selectedMethod && (
                    <div className="p-4 rounded-[2px] text-blue-800 border border-blue-200 ">
                      <div className="flex items-center">
                        <div className="bg-white p-2 rounded-lg mr-3 border border-blue-200">
                          <img 
                            src={formData.selectedMethod.image} 
                            alt={formData.selectedMethod.name} 
                            className="h-10 w-10 object-contain"
                          />
                        </div>
                        <div>
                          <h4 className="font-semibold">নির্বাচিত: {formData.selectedMethod.name} ({formData.selectedMethod.name_bn})</h4>
                          <p className="text-sm opacity-90 mt-1">
                            আপনার উত্তোলন {formData.selectedMethod.name} এর মাধ্যমে প্রসেস করা হবে
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {errors.method && (
                    <p className="text-sm text-red-600 text-center">{errors.method}</p>
                  )}
                </>
              )}

              <div className="flex justify-between pt-4">
                {selectedCategory ? (
                  <button
                    onClick={handleBackToCategories}
                    className="flex items-center justify-center cursor-pointer px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-[5px] border-[1px] border-gray-200 transition-all"
                  >
                    <MdOutlineArrowBackIos className="mr-2" /> পিছনে
                  </button>
                ) : (
                  <div></div> // Empty div to maintain flex spacing
                )}
                
                <button
                  onClick={goToNextTab}
                  disabled={!formData.selectedMethod}
                  className="flex items-center justify-center cursor-pointer px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-medium rounded-[5px] transition-all shadow hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  পরবর্তী <MdOutlineArrowForwardIos className="ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Player ID and Withdrawal Code */}
          {activeTab === 2 && (
            <div className="space-y-6">
              <div className="flex items-center  px-5 py-3 border border-gray-200">
                <div className="p-2  mr-3 ">
                  <img 
                    src={formData.selectedMethod.image} 
                    alt={formData.selectedMethod.name} 
                    className="h-7 w-7 object-contain"
                  />
                </div>
                <span className="text-md font-semibold text-gray-800">{formData.selectedMethod.name} ({formData.selectedMethod.name_bn})</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="playerId" className="block text-sm md:text-[16px] font-medium text-gray-700 mb-1 flex items-center">
                    প্লেয়ার ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="playerId"
                    value={formData.playerId}
                    onChange={(e) => handleInputChange('playerId', e.target.value)}
                    className={`w-full px-4 py-3 rounded-[3px] border-[1px] border-gray-200 outline-blue-600 transition ${
                      errors.playerId ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="আপনার প্লেয়ার ID লিখুন"
                  />
                  {errors.playerId && (
                    <p className="mt-1 text-sm text-red-600">{errors.playerId}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="code" className="block text-sm md:text-[16px] font-medium text-gray-700 mb-1 flex items-center">
                    উত্তোলন কোড <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    className={`w-full px-4 py-3 rounded-[3px] border-[1px] border-gray-200 transition ${
                      errors.code ? 'border-red-500 bg-red-50' : 'border-gray-300 outline-blue-600'
                    }`}
                    placeholder="আপনার সিকিউরিটি কোড লিখুন"
                  />
                  {errors.code && (
                    <p className="mt-1 text-sm text-red-600">{errors.code}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={goToPrevTab}
                  className="flex items-center cursor-pointer justify-center px-6 py-3 border-[1px] border-gray-200 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-[5px] transition-all"
                >
                  <MdOutlineArrowBackIos className="mr-2" /> পিছনে
                </button>
                <button
                  onClick={goToNextTab}
                  className="flex items-center justify-center cursor-pointer px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-medium rounded-[5px] transition-all shadow hover:shadow-lg"
                >
                  পরবর্তী <MdOutlineArrowForwardIos className="ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Amount and Account Number */}
          {activeTab === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center bg-white px-4 py-2 rounded-full ">
                  <div className="p-2 rounded-lg mr-2">
                    <img 
                      src={formData.selectedMethod.image} 
                      alt={formData.selectedMethod.name} 
                      className="h-6 w-6 object-contain"
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{formData.selectedMethod.name} ({formData.selectedMethod.name_bn})</span>
                </div>
              </div>

              <div className="space-y-4">
                {/* <div>
                  <label htmlFor="amount" className="block text-sm md:text-[16px] font-medium text-gray-700 mb-1 flex items-center">
                    Amount (BDT) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="amount"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className={`w-full px-4 py-3 rounded-[3px] border-[1px] border-gray-200 outline-blue-600 transition ${
                      errors.amount ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Amount লিখুন"
                    min={formData.selectedMethod.minAmount}
                    max={formData.selectedMethod.maxAmount}
                  />
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>ন্যূনতম: {formData.selectedMethod.minAmount} BDT</span>
                    <span>সর্বোচ্চ: {formData.selectedMethod.maxAmount} BDT</span>
                  </div>
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                  )}
                </div> */}

                <div>
                  <label htmlFor="accountNumber" className="block text-sm md:text-[16px] font-medium text-gray-700 mb-1 flex items-center">
                    অ্যাকাউন্ট নম্বর <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                    className={`w-full px-4 py-3 rounded-[3px] border-[1px] border-gray-200 transition outline-blue-600 ${
                      errors.accountNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="আপনার অ্যাকাউন্ট নম্বর লিখুন"
                  />
                  {errors.accountNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>
                  )}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 flex items-start">
                  <MdInfo className="mr-2 mt-0.5 flex-shrink-0 text-yellow-600" />
                  <span> সঠিক তথ্য দিন অন্যথায় আমরা দায়ী থাকব না। (Please provide correct information otherwise we will not be responsible.)</span>
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={goToPrevTab}
                  className="flex items-center cursor-pointer justify-center px-6 py-3 border-[1px] border-gray-200 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-[5px] transition-all"
                >
                  <MdOutlineArrowBackIos className="mr-2" /> পিছনে
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex items-center justify-center cursor-pointer px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-medium rounded-[5px] transition-all shadow hover:shadow-lg disabled:opacity-75"
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      প্রসেস হচ্ছে...
                    </>
                  ) : (
                    'উত্তোলন নিশ্চিত করুন'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Tab 4: Result (Success or Failure) */}
          {activeTab === 4 && (
            <div className="text-center py-8">
              {withdrawalResult?.success ? (
                // Success case
                <>
                  <div className="bg-gradient-to-r from-green-100 to-teal-100 inline-flex p-4 rounded-full mb-6">
                    <div className="bg-green-500 p-4 rounded-full">
                      <FaCheckCircle className="text-white text-4xl" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">উত্তোলন রিকোয়েস্ট জমা হয়েছে!</h3>
                  <p className="text-gray-600 mb-6">{withdrawalResult.message}</p>
                  
                  <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                    <h4 className="font-medium text-gray-700 mb-4">ট্রানজেকশন বিবরণ</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">ট্রানজেকশন ID:</span>
                        <span className="font-medium">{withdrawalResult.transactionId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-medium">{formData.amount} BDT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">পেমেন্ট পদ্ধতি:</span>
                        <span className="font-medium">{formData.selectedMethod?.name} ({formData.selectedMethod?.name_bn})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">অ্যাকাউন্ট নম্বর:</span>
                        <span className="font-medium">{formData.accountNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">আনুমানিক প্রসেসিং সময়:</span>
                        <span className="font-medium">২-২৪ ঘন্টা</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // Failure case
                <>
                  <div className="bg-gradient-to-r from-red-100 to-pink-100 inline-flex p-4 rounded-full mb-6">
                    <div className="bg-red-500 p-4 rounded-full">
                      <FaTimesCircle className="text-white text-4xl" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">উত্তোলন ব্যর্থ হয়েছে</h3>
                  <p className="text-gray-600 mb-4">{withdrawalResult?.message}</p>
                  {withdrawalResult?.details && (
                    <p className="text-gray-500 mb-6">{withdrawalResult.details}</p>
                  )}
                </>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-green-500 cursor-pointer text-white font-medium rounded-[5px] transition-all"
                >
                  আবার উত্তোলন করুন
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentTabs;