import React, { useState } from 'react';
import axios from 'axios';
import { FaSpinner, FaMoneyBillWave } from 'react-icons/fa';
import { MdError, MdInfo, MdPayment, MdAccountCircle, MdAttachMoney } from 'react-icons/md';
import { toast, Toaster } from 'react-hot-toast';
import withdraw_img from "../../assets/withdraw_img.png";
import { FaArrowRight } from "react-icons/fa6";
import { FaCheckCircle } from "react-icons/fa";
import { FaArrowLeft } from "react-icons/fa6";
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

const DepositForm = () => {
  const [step, setStep] = useState(1); // 1: Select method, 2: Enter details, 3: Success
  const [playerId, setPlayerId] = useState('');
  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successData, setSuccessData] = useState(null);

  // Configuration
  const frontend_url = window.location.origin;
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const base_url2 = "https://api.nagodpay.com";

  // All available payment methods with their images
  const availableMethods = [
    { 
      id: 1, 
      name: 'Nagad', 
      image: "https://xxxbetgames.com/icons-xxx/payments/227.svg",
      type: 'regular',
      minAmount: 100,
      maxAmount: 30000,
    },
    { 
      id: 2, 
      name: 'Bkash', 
      image: "https://xxxbetgames.com/icons-xxx/payments/75.svg",
      type: 'regular',
      minAmount: 100,
      maxAmount: 30000,
    },
    { 
      id: 3, 
      name: 'Bkash Fast', 
      image: "https://xxxbetgames.com/icons-xxx/payments/75.svg",
      type: 'fast',
      minAmount: 100,
      maxAmount: 30000,
    },
    { 
      id: 4, 
      name: 'Nagad Free', 
      image: nagad_free_img,
      type: 'regular',
      minAmount: 100,
      maxAmount: 30000,
    },
    { 
      id: 5, 
      name: 'Rocket', 
      image: rocket_img,
      type: 'regular',
      minAmount: 100,
      maxAmount: 30000,
    },
    { 
      id: 6, 
      name: 'Upay', 
      image: upay_img,
      type: 'regular',
      minAmount: 100,
      maxAmount: 30000,
    },
    { 
      id: 7, 
      name: 'BRAC Bank', 
      image: brac_img,
      type: 'bank',
      minAmount: 100,
      maxAmount: 30000,
    },
    { 
      id: 8, 
      name: 'Dutch Bangla', 
      image: duch_bangla_img,
      type: 'bank',
      minAmount: 100,
      maxAmount: 30000,
    },
    { 
      id: 9, 
      name: 'UDB Bank', 
      image: udb_bank_img,
      type: 'bank',
      minAmount: 100,
      maxAmount: 30000,
    },
  ];

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    if (!playerId.trim()) {
      newErrors.playerId = 'Player ID is required';
    } else if (!/^[a-zA-Z0-9]+$/.test(playerId)) {
      newErrors.playerId = 'Player ID should be alphanumeric';
    }

    if (!amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(amount)) {
      newErrors.amount = 'Amount must be a number';
    } else if (parseFloat(amount) < selectedMethod.minAmount) {
      newErrors.amount = `Minimum deposit amount is ${selectedMethod.minAmount} BDT`;
    } else if (parseFloat(amount) > selectedMethod.maxAmount) {
      newErrors.amount = `Maximum deposit amount is ${selectedMethod.maxAmount} BDT`;
    }

    // Bank account validation
    if (selectedMethod.type === 'bank') {
      if (!accountNumber.trim()) {
        newErrors.accountNumber = 'Account number is required';
      } else if (!/^[0-9]+$/.test(accountNumber)) {
        newErrors.accountNumber = 'Account number should contain only numbers';
      } else if (accountNumber.length < 10) {
        newErrors.accountNumber = 'Account number should be at least 10 digits';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle method selection
  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    setStep(2);
  };

  // Handle back to method selection
  const handleBackToMethods = () => {
    setSelectedMethod(null);
    setAccountNumber('');
    setStep(1);
  };

  // Reset form for new deposit
  const handleNewDeposit = () => {
    setPlayerId('');
    setAmount('');
    setAccountNumber('');
    setSelectedMethod(null);
    setSuccessData(null);
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
            mid: "hobet",
            payerId: playerId,
            amount: numericAmount,
            currency: "BDT",
            redirectUrl: "https://nagodpay.com",
            orderId: orderId,
            callbackUrl: `https://nagodpay.com/callback`
          },
          {
            headers: {
              'x-api-key': '28915f245e5b2f4b7637'
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
          currency: "BDT"
        };

        const response = await axios.post(
          `${base_url}/api/payment/bank-deposit`,
          postData,
          {
            headers: {
              'x-api-key': '28915f245e5b2f4b7637',
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
            timestamp: new Date().toLocaleString()
          });
          setStep(3);
          toast.success('Bank deposit request submitted successfully!');
        } else {
          toast.error(response.data.message || 'Bank deposit request failed');
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
              'x-api-key': '28915f245e5b2f4b7637',
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
            timestamp: new Date().toLocaleString()
          });
          toast.success('Redirecting to payment gateway...');
          setTimeout(() => {
            window.location.href = `https://nagodpay.com/checkout/${response.data.paymentId}`;
          }, 1500);
        } else {
          toast.error(response.data.message || 'Payment initiation failed');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'An error occurred while processing your payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="font-anek max-w-4xl mx-auto bg-white ">
      <div className="text-gray-700 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Deposit Funds
            </h2>
            <p className="text-sm md:text-base mt-1 text-gray-500">Secure and instant deposits</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md flex items-center justify-center">
            <MdPayment className="text-2xl text-white" />
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      {step !== 3 && (
        <div className="mt-8 mb-8">
          <div className="flex justify-between items-center relative">
            {/* Progress line */}
            <div className="absolute top-4 left-10 right-10 h-2 bg-gray-200 rounded-full">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-700 ease-in-out" 
                style={{ width: `${(step - 1) / 2 * 100}%` }}
              ></div>
            </div>
            
            {[1, 2].map((stepNum) => (
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
                
                {/* Step label */}
                <div className={`text-sm font-medium mt-3 transition-colors duration-300 ${
                  step >= stepNum ? 'text-blue-700 font-semibold' : 'text-gray-500'
                }`}>
                  {stepNum === 1 && 'Select Method'}
                  {stepNum === 2 && 'Enter Details'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Method Selection */}
      {step === 1 && (
        <div className="space-y-8">
          <div className="text-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Select Payment Method</h3>
            <p className="text-gray-600 mt-1">Choose your preferred deposit method</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => handleMethodSelect(method)}
                className={`p-4 border-1 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
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
                    <h4 className={`font-semibold ${selectedMethod?.id === method.id ? 'text-blue-600' : 'text-gray-800'}`}>
                      {method.name}
                    </h4>
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
                  <h4 className="font-semibold">Selected: {selectedMethod.name}</h4>
                  <p className="text-sm opacity-90 mt-1">
                    Your deposit will be processed via {selectedMethod.name}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setStep(2)}
              disabled={!selectedMethod}
              className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-[5px] transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Continue to Details 
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Deposit Details */}
      {step === 2 && selectedMethod && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
              <div className="p-2 rounded-lg bg-gray-100 mr-2">
                <img 
                  src={selectedMethod.image} 
                  alt={selectedMethod.name} 
                  className="h-6 w-6 object-contain"
                />
              </div>
              <span className="text-sm font-semibold text-gray-700">{selectedMethod.name}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            {/* Player ID Field */}
            <div>
              <label htmlFor="depositPlayerId" className="block text-sm font-semibold text-gray-700 mb-2">
                Player ID
              </label>
              <input
                type="text"
                id="depositPlayerId"
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                className={`w-full px-4 py-3 rounded-[5px] border-2 outline-blue-600 ${
                  errors.playerId ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter your player ID"
              />
              {errors.playerId && (
                <p className="mt-1 text-sm text-red-600">{errors.playerId}</p>
              )}
            </div>

            {/* Account Number Field (only for bank methods) */}
            {selectedMethod.type === 'bank' && (
              <div>
                <label htmlFor="accountNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  id="accountNumber"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className={`w-full px-4 py-3 rounded-[5px] border-2 outline-blue-600 ${
                    errors.accountNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter your account number"
                />
                {errors.accountNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>
                )}
              </div>
            )}

            {/* Amount Field */}
            <div>
              <label htmlFor="depositAmount" className="block text-sm font-semibold text-gray-700 mb-2">
                Amount (BDT)
              </label>
              <input
                type="number"
                id="depositAmount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full px-4 py-3 rounded-[5px] border-2 outline-blue-600 ${
                  errors.amount ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter amount"
                min={selectedMethod.minAmount}
                max={selectedMethod.maxAmount}
              />
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Min: {selectedMethod.minAmount} BDT</span>
                <span>Max: {selectedMethod.maxAmount} BDT</span>
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-800 flex items-start">
              <MdInfo className="mr-2 mt-0.5 flex-shrink-0 text-yellow-600 text-lg" />
              <span>দয়া করে সঠিক তথ্য দিন অন্যথায় আমরা দায়ী থাকব না। (Please provide correct information otherwise we will not be responsible.)</span>
            </p>
          </div>

          <div className="flex flex-col-reverse md:flex-row justify-between gap-4 pt-4">
            <button
              type="button"
              onClick={handleBackToMethods}
              className="flex items-center justify-center px-6 py-3 border-1 border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-semibold rounded-[5px] cursor-pointer transition-all"
            >
              <MdArrowBackIos className="mr-2" /> Back
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-[5px] cursor-pointer transition-all duration-300 disabled:opacity-75"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  Confirm Deposit <MdOutlineArrowForwardIos className="ml-2" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Success Message */}
      {step === 3 && successData && (
        <div className="bg-white p-6  border border-green-200">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
              <FaCheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="mt-5 text-2xl font-semibold text-gray-900">Deposit Successful!</h3>
            <div className="mt-6 bg-gray-50 p-5 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div>
                  <p className="text-sm font-medium text-gray-500">Payment Method</p>
                  <p className="text-lg font-semibold text-gray-900">{successData.method}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Amount</p>
                  <p className="text-lg font-semibold text-gray-900">{successData.amount} BDT</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Player ID</p>
                  <p className="text-lg font-semibold text-gray-900">{successData.playerId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Order ID</p>
                  <p className="text-lg font-semibold text-gray-900">{successData.orderId}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Transaction Time</p>
                  <p className="text-lg font-semibold text-gray-900">{successData.timestamp}</p>
                </div>
              </div>
            </div>
            <p className="mt-6 text-sm text-gray-600">
              Your deposit has been processed successfully. The amount will be credited to your account after reviewing shortly.
            </p>
            <div className="mt-8">
              <button
                onClick={handleNewDeposit}
                className="inline-flex items-center cursor-pointer justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
               Make Another Deposit
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
const WithdrawForm = () => {
  const [activeTab, setActiveTab] = useState(1);
  const [formData, setFormData] = useState({
    playerId: '',
    code: '',
    amount: '',
    accountNumber: '',
    selectedMethod: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Configuration
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  
  // Withdrawal methods data
  const availableMethods = [
    { 
      id: 1, 
      name: 'Nagad', 
      icon: 'https://xxxbetgames.com/icons-xxx/payments/76.svg',
      color: 'from-green-500 to-green-600',
      textColor: 'text-white',
      bgColor: 'bg-green-100'
    },
    { 
      id: 2, 
      name: 'Bkash', 
      icon: 'https://xxxbetgames.com/icons-xxx/payments/75.svg',
      color: 'from-pink-500 to-pink-600',
      textColor: 'text-white',
      bgColor: 'bg-pink-100'
    },
  ];

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

  // Validate current tab
  const validateTab = (tabNumber) => {
    const newErrors = {};
    
    if (tabNumber === 1) {
      if (!formData.playerId.trim()) {
        newErrors.playerId = 'Player ID is required';
      }
      
      if (!formData.code.trim()) {
        newErrors.code = 'Code is required';
      } else if (!/^[a-zA-Z0-9]+$/.test(formData.code)) {
        newErrors.code = 'Code should be alphanumeric';
      }
    }
    
    // Updated validation for tab 2 (now payment method)
    if (tabNumber === 2 && !formData.selectedMethod) {
      newErrors.method = 'Please select a payment method';
    }
    
    // Updated validation for tab 3 (now amount and account number)
    if (tabNumber === 3) {
      if (!formData.amount) {
        newErrors.amount = 'Amount is required';
      } else if (isNaN(formData.amount)) {
        newErrors.amount = 'Amount must be a number';
      } else if (parseFloat(formData.amount) < 200) {
        newErrors.amount = 'Minimum withdrawal amount is 200 BDT';
      } else if (parseFloat(formData.amount) > 50000) {
        newErrors.amount = 'Maximum withdrawal amount is 50,000 BDT';
      }
      
      if (!formData.accountNumber.trim()) {
        newErrors.accountNumber = 'Account number is required';
      } else if (!/^[0-9]+$/.test(formData.accountNumber)) {
        newErrors.accountNumber = 'Account number should contain only numbers';
      } else if (formData.accountNumber.length < 10 || formData.accountNumber.length > 15) {
        newErrors.accountNumber = 'Account number should be 10-15 digits';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigate to next tab
  const goToNextTab = () => {
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
      accountNumber: formData.accountNumber,
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
            'x-api-key': '28915f245e5b2f4b7637',
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data) {
        toast.success('Withdrawal request submitted successfully!');
        setActiveTab(4); // Success tab
      }
    } catch (error) {
      console.error('Player di not find!');
      toast.error('Player di not find!');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form and start over
  const resetForm = () => {
    setFormData({
      playerId: '',
      code: '',
      amount: '',
      accountNumber: '',
      selectedMethod: null
    });
    setActiveTab(1);
    setErrors({});
  };

  return (
    <div className="font-anek  flex items-center justify-center w-full">
      <Toaster 
        position="top-center"
      />
      
      <div className="w-full  bg-white text-gray-700 overflow-hidden">
        {/* Header with gradient */}
        <div className=" relative">
          <div className="flex items-center justify-between">
            <div className='flex justify-between items-center w-full'>
              <h2 className="text-2xl font-bold">Withdraw Funds</h2>
              <div className="bg-green-600 p-3 text-white rounded-[5px] flex items-center justify-center">
                <GiWallet className="text-2xl" />
              </div>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="mt-8 mb-6 px-4">
            <div className="flex justify-between items-center relative">
              {/* Progress line */}
              <div className="absolute top-4 left-10 right-10 h-1.5 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-700 ease-in-out" 
                  style={{ width: `${(activeTab - 1) / 3 * 100}%` }}
                ></div>
              </div>
              
              {[1, 2, 3, 4].map((step) => (
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
                    {step === 1 && 'Account'}
                    {step === 2 && 'Method'} {/* Updated label */}
                    {step === 3 && 'Amount'} {/* Updated label */}
                    {step === 4 && 'Complete'}
                  </div>
                  
                  {/* Connector lines between steps */}
                  {step < 4 && (
                    <div className="absolute top-6 left-16 w-10 h-0.5 bg-transparent"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form container */}
        <div className="pb-6">
          {/* Tab 1: Account Information (unchanged) */}
          {activeTab === 1 && (
            <div className="space-y-6">
              <div className="w-full">
                <img className='w-full' src={location_img} alt="" />
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="playerId" className="block text-sm md:text-[16px] font-medium text-gray-700 mb-1 flex items-center">
                    Player ID
                  </label>
                  <input
                    type="text"
                    id="playerId"
                    value={formData.playerId}
                    onChange={(e) => handleInputChange('playerId', e.target.value)}
                    className={`w-full px-4 py-3  rounded-[3px] border-[1px] border-gray-200 outline-blue-600 transition ${
                      errors.playerId ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter your player ID"
                  />
                </div>

                <div>
                  <label htmlFor="code" className="block text-sm md:text-[16px] font-medium text-gray-700 mb-1 flex items-center">
                    Withdrawal Code
                  </label>
                  <input
                    type="text"
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    className={`w-full px-4 py-3 rounded-[3px] border-[1px] border-gray-200  transition ${
                      errors.code ? 'border-red-500 bg-red-50' : 'border-gray-300 outline-blue-600'
                    }`}
                    placeholder="Enter your security code"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={goToNextTab}
                  className="flex items-center w-full justify-center px-6 py-3 bg-[#009F49] hover:to-indigo-700 text-white font-medium rounded-[5px] cursor-pointer transition-all shadow hover:shadow-lg"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Payment Method (moved from tab 3) */}
          {activeTab === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-2">
                <h3 className="text-xl font-semibold text-gray-800">Payment Method</h3>
                <p className="text-gray-600">Select your preferred withdrawal method</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableMethods.map((method) => (
                  <div
                    key={method.id}
                    onClick={() => handleInputChange('selectedMethod', method)}
                    className={`p-4 border-2 rounded-[5px] cursor-pointer transition-all ${
                      formData.selectedMethod?.id === method.id
                        ? `border-blue-500 bg-blue-50`
                        : `border-gray-200 hover:border-blue-300 hover:bg-blue-50`
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`p-2 rounded-[3px] ${method.bgColor} mr-3`}>
                        <img 
                          src={method.icon} 
                          alt={method.name} 
                          className="h-8 w-8 object-contain"
                        />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{method.name}</h4>
                        <p className="text-xs text-gray-600">Processing time: 2-24 hours</p>
                      </div>
                      {formData.selectedMethod?.id === method.id && (
                        <div className="ml-auto bg-blue-500 rounded-full p-1">
                          <FaCheckCircle className="text-white text-sm" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {formData.selectedMethod && (
                <div className={`p-4 rounded-[5px] bg-gradient-to-r ${formData.selectedMethod.color} text-white`}>
                  <div className="flex items-center">
                    <img 
                      src={formData.selectedMethod.icon} 
                      alt={formData.selectedMethod.name} 
                      className="h-10 w-10 object-contain mr-3 bg-white/20 p-2 rounded-lg"
                    />
                    <div>
                      <h4 className="font-medium">Selected: {formData.selectedMethod.name}</h4>
                      <p className="text-xs opacity-90">Your withdrawal will be processed via {formData.selectedMethod.name}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button
                  onClick={goToPrevTab}
                  className="flex items-center justify-center cursor-pointer px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-[5px] border-[1px] border-gray-200 transition-all"
                >
                  <MdOutlineArrowBackIos  className="mr-2" /> Back
                </button>
                <button
                  onClick={goToNextTab}
                  className="flex items-center justify-center cursor-pointer px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-medium rounded-[5px] transition-all shadow hover:shadow-lg"
                >
                  Next <MdOutlineArrowForwardIos className="ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Amount Details (moved from tab 2) */}
          {activeTab === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="amount" className="block text-sm md:text-[16px] font-medium text-gray-700 mb-1 flex items-center">
                    Amount (BDT)
                  </label>
                  <input
                    type="number"
                    id="amount"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className={`w-full px-4 py-3 rounded-[3px] border-[1px] border-gray-200  outline-blue-600 transition ${
                      errors.amount ? 'border-red-500 bg-red-50' : 'border-gray-300 '
                    }`}
                    placeholder="Enter amount"
                    min="200"
                    max="50000"
                  />
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>Min: 200 BDT</span>
                    <span>Max: 50,000 BDT</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="accountNumber" className="block text-sm md:text-[16px] font-medium text-gray-700 mb-1 flex items-center">
                    Account Number
                  </label>
                  <input
                    type="text"
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                    className={`w-full px-4 py-3 rounded-[3px] border-[1px] border-gray-200 transition outline-blue-600 ${
                      errors.accountNumber ? 'border-red-500 bg-red-50' : 'border-gray-300 '
                    }`}
                    placeholder="Enter your account number"
                  />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 flex items-start">
                  <MdInfo className="mr-2 mt-0.5 flex-shrink-0 text-yellow-600" />
                  <span>দয়া করে সঠিক তথ্য দিন অন্যথায় আমরা দায়ী থাকব না। (Please provide correct information otherwise we will not be responsible.)</span>
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={goToPrevTab}
                  className="flex items-center cursor-pointer justify-center px-6 py-3 border-[1px] border-gray-200 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-[5px] transition-all"
                >
                  <MdOutlineArrowBackIos className="mr-2" /> Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="flex items-center justify-center cursor-pointer px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-medium rounded-[5px] transition-all shadow hover:shadow-lg disabled:opacity-75"
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Confirm Withdrawal'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Tab 4: Success (unchanged) */}
          {activeTab === 4 && (
            <div className="text-center py-8">
              <div className="bg-gradient-to-r from-green-100 to-teal-100 inline-flex p-4 rounded-full mb-6">
                <div className="bg-green-500 p-4 rounded-full">
                  <FaCheckCircle className="text-white text-4xl" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Withdrawal Request Submitted!</h3>
              <p className="text-gray-600 mb-6">Your withdrawal request has been successfully submitted and is being processed.</p>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                <h4 className="font-medium text-gray-700 mb-4">Transaction Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-medium">WDR-{Date.now()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">{formData.amount} BDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">{formData.selectedMethod?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Account Number:</span>
                    <span className="font-medium">{formData.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Processing Time:</span>
                    <span className="font-medium">2-24 hours</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 cursor-pointer to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all"
                >
                  New Withdrawal
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