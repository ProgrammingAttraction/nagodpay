import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSpinner, FaMoneyBillWave, FaCheckCircle } from 'react-icons/fa';
import { MdPayment, MdError, MdInfo, MdAccountCircle, MdAttachMoney } from 'react-icons/md';
import withdraw_img from "../../assets/withdraw_img.png";

const DepositWithdrawTabs = () => {
  const [activeTab, setActiveTab] = useState('deposit');
  
  return (
    <div className="min-h-screen font-anek bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Tab headers */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('deposit')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-300 ${
              activeTab === 'deposit'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Deposit
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-300 ${
              activeTab === 'withdraw'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Withdraw
          </button>
        </div>
        
        {/* Tab content with animation */}
        <div className="relative overflow-hidden">
          <div
            className={`transition-transform duration-300 ease-in-out ${
              activeTab === 'deposit' ? 'translate-x-0' : '-translate-x-full absolute inset-0'
            }`}
          >
            <Deposit />
          </div>
          <div
            className={`transition-transform duration-300 ease-in-out ${
              activeTab === 'withdraw' ? 'translate-x-0' : 'translate-x-full absolute inset-0'
            }`}
          >
            <Withdraw />
          </div>
        </div>
      </div>
    </div>
  );
};

// Deposit Component
const Deposit = () => {
  // Configuration
  const frontend_url = window.location.origin;
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const base_url2 =  import.meta.env.VITE_API_KEY_Base_URL; // Fallback to base_url if not defined

  // State management
  const [playerId, setPlayerId] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [playerValidation, setPlayerValidation] = useState({
    isValid: false,
    isLoading: false,
    message: ''
  });

  const availableMethods = [
    { 
      id: 1, 
      name: 'Nagad', 
      icon: 'https://xxxbetgames.com/icons-xxx/payments/76.svg',
      color: 'bg-[#FFEEEE] hover:bg-[#FFE5E5] border border-[#FFD5D5]', // Very light red
      textColor: 'text-[#E11F26]', // Nagad brand red for text
      type: 'regular',
      iconFilter: 'brightness(0.9) saturate(1.2)' // Makes icon match better
    },
    { 
      id: 2, 
      name: 'Bkash', 
      icon: 'https://xxxbetgames.com/icons-xxx/payments/75.svg',
      color: 'bg-[#FFF0F5] hover:bg-[#FFE5EF] border border-[#FFD5E5]', // Very light pink
      textColor: 'text-[#E2136E]', // Bkash brand pink for text
      type: 'regular',
      iconFilter: 'brightness(0.9) saturate(1.2)'
    },
    { 
      id: 3, 
      name: 'Bkash Fast', 
      icon: 'https://xxxbetgames.com/icons-xxx/payments/75.svg',
      color: 'bg-[#FFE5EF] hover:bg-[#FFD5E5] border border-[#FFC5DB]', // Slightly stronger pink
      textColor: 'text-[#C51162]', // Darker pink for text
      type: 'fast',
      iconFilter: 'brightness(0.9) saturate(1.2)'
    },
  ];

  // Validate player ID using the player route
  const validatePlayerId = async () => {
    if (!playerId.trim()) {
      setPlayerValidation({
        isValid: false,
        isLoading: false,
        message: ''
      });
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(playerId)) {
      setPlayerValidation({
        isValid: false,
        isLoading: false,
        message: 'Player ID should be alphanumeric'
      });
      return;
    }

    setPlayerValidation({
      isValid: false,
      isLoading: true,
      message: 'Checking player ID...'
    });

    try {
      // Using the player route endpoint
      const response = await axios.get(
        `${base_url}/api/payment/player/${playerId}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Player validation response:', response.data);

      if (response.data.success) {
        setPlayerValidation({
          isValid: true,
          isLoading: false,
          message: `Player verified: ${response.data.data.name}`
        });
      } else {
        setPlayerValidation({
          isValid: false,
          isLoading: false,
          message: response.data.message || 'Player ID not found'
        });
      }
    } catch (error) {
      console.error('Player validation error:', error);
      const errorMessage = error.response?.data?.message || 'Error validating player ID';
      setPlayerValidation({
        isValid: false,
        isLoading: false,
        message: errorMessage
      });
    }
  };

  // Validate player ID when it changes (with debounce)
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     if (playerId.trim()) {
  //       validatePlayerId();
  //     } else {
  //       setPlayerValidation({
  //         isValid: false,
  //         isLoading: false,
  //         message: ''
  //       });
  //     }
  //   }, 800); // Increased debounce time

  //   return () => clearTimeout(timer);
  // }, [playerId]);

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    if (!amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(amount)) {
      newErrors.amount = 'Amount must be a number';
    } else if (parseFloat(amount) < 100) {
      newErrors.amount = 'Minimum deposit amount is 100 BDT';
    } else if (parseFloat(amount) > 30000) {
      newErrors.amount = 'Maximum deposit amount is 30,000 BDT';
    }

    if (!selectedMethod) {
      newErrors.method = 'Please select a payment method';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');

    setIsLoading(true);

    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const numericAmount = parseFloat(amount);

    try {
      if (selectedMethod.type === 'fast') {
        // Bkash Fast method
        const { data } = await axios.post(
          `${base_url2}/api/payment/bkash`,
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
              'x-api-key': '07f511d662a122719303'
            }
          }
        );
     
        if (data.success) {
          window.location.href = data.link;
        } else {
          setErrors({ form: data.message || 'Bkash Fast payment initiation failed' });
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
              'x-api-key': '07f511d662a122719303',
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.success) {
          window.location.href = `https://nagodpay.com/checkout/${response.data.paymentId}`;
        } else {
          setErrors({ form: response.data.message || 'Payment initiation failed' });
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      setErrors({ 
        form: error.response?.data?.message || 
             'An error occurred while processing your payment. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 md:p-6 text-white rounded-t-lg -mt-4 -mx-4 md:-mx-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Deposit Funds</h2>
            <p className="text-blue-100 text-xs md:text-sm mt-1">Secure and instant deposits</p>
          </div>
          <div className="bg-white/20 p-2 md:p-3 rounded-lg flex items-center justify-center">
            <MdPayment className="text-xl md:text-2xl" />
          </div>
        </div>
      </div>

      <div className="mt-4">
        {errors.form && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start">
            <MdError className="mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{errors.form}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-start">
            <MdInfo className="mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Player ID Field */}
          <div>
            <label htmlFor="deposit-playerId" className="block text-sm md:text-[16px] font-medium text-gray-700 mb-1 flex items-center">
              Player ID
            </label>
            <input
              type="text"
              id="deposit-playerId"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-[5px] outline-blue-600 transition ${
                errors.playerId ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-blue-400'
              }`}
              placeholder="Enter your player ID"
            />
          </div>

          {/* Amount Field */}
          <div>
            <label htmlFor="deposit-amount" className="block text-sm md:text-[16px] font-medium text-gray-700 mb-1  items-center">
              Amount (BDT)
            </label>
            <input
              type="number"
              id="deposit-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full px-4 py-2.5 border rounded-[5px] outline-blue-600  transition ${
                errors.amount ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-blue-400'
              }`}
              placeholder="Enter amount"
              min="100"
              max="30000"
            />
            {errors.amount && (
              <p className="mt-1 text-xs text-red-600 flex items-center">
                <MdError className="mr-1 text-xs" />
                {errors.amount}
              </p>
            )}
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>Min: 100 BDT</span>
              <span>Max: 30,000 BDT</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              {availableMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedMethod(method)}
                  className={`p-3 border rounded-lg transition-all cursor-pointer flex flex-col items-center ${method.color} ${method.textColor} ${
                    selectedMethod?.id === method.id
                      ? 'ring-2 ring-blue-500 ring-offset-2'
                      : 'hover:shadow-md'
                  }`}
                >
                  <img 
                    src={method.icon} 
                    alt={method.name} 
                    className="h-8 w-8 object-contain mb-2"
                  />
                  <span className="text-sm font-medium">{method.name}</span>
                </button>
              ))}
            </div>
            {errors.method && (
              <p className="mt-1 text-xs text-red-600 flex items-center">
                <MdError className="mr-1 text-xs" />
                {errors.method}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading }
            className={`w-full py-2.5 px-4 cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all shadow hover:shadow-lg flex items-center justify-center ${
              isLoading ? 'opacity-80 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                Proceed to Payment
              </>
            )}
          </button>

          {/* Additional Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <p className="text-xs text-blue-800 flex items-start">
              <MdInfo className="mr-2 mt-0.5 flex-shrink-0 text-blue-600" />
              <span>
                You will be redirected to a secure payment gateway to complete your transaction.
                Please do not refresh or close the window during the process.
              </span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

// Withdraw Component
const Withdraw = () => {
  // Configuration
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  
  // State management
  const [playerId, setPlayerId] = useState('');
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [playerValidation, setPlayerValidation] = useState({
    isValid: false,
    isLoading: false,
    message: ''
  });

  // Withdrawal methods data
  const availableMethods = [
    { 
      id: 1, 
      name: 'Nagad', 
      icon: 'https://xxxbetgames.com/icons-xxx/payments/76.svg',
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      textColor: 'text-white'
    },
    { 
      id: 2, 
      name: 'Bkash', 
      icon: 'https://xxxbetgames.com/icons-xxx/payments/75.svg',
      color: 'bg-gradient-to-r from-pink-400 to-pink-400',
      textColor: 'text-white'
    },
  ];

  // Validate player ID using the player route
  const validatePlayerId = async () => {
    if (!playerId.trim()) {
      setPlayerValidation({
        isValid: false,
        isLoading: false,
        message: ''
      });
      return;
    }

    setPlayerValidation({
      isValid: false,
      isLoading: true,
      message: 'Checking player ID...'
    });

    try {
      // Using the player route endpoint
      const response = await axios.get(
        `${base_url}/api/payment/player/${playerId}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setPlayerValidation({
          isValid: true,
          isLoading: false,
          message: `Player verified: ${response.data.data.name}`
        });
      } else {
        setPlayerValidation({
          isValid: false,
          isLoading: false,
          message: response.data.message || 'Player ID not found'
        });
      }
    } catch (error) {
      console.error('Player validation error:', error);
      setPlayerValidation({
        isValid: false,
        isLoading: false,
        message: error.response?.data?.message || 'Error validating player ID'
      });
    }
  };

  // Validate player ID when it changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (playerId.trim()) {
        validatePlayerId();
      } else {
        setPlayerValidation({
          isValid: false,
          isLoading: false,
          message: ''
        });
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [playerId]);

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    if (!code.trim()) {
      newErrors.code = 'Code is required';
    } else if (!/^[a-zA-Z0-9]+$/.test(code)) {
      newErrors.code = 'Code should be alphanumeric';
    }

    if (!amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(amount)) {
      newErrors.amount = 'Amount must be a number';
    } else if (parseFloat(amount) < 100) {
      newErrors.amount = 'Minimum withdrawal amount is 100 BDT';
    } else if (parseFloat(amount) > 30000) {
      newErrors.amount = 'Maximum withdrawal amount is 30,000 BDT';
    }
    if (!accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (!/^[0-9]+$/.test(accountNumber)) {
      newErrors.accountNumber = 'Account number should contain only numbers';
    } else if (accountNumber.length < 10 || accountNumber.length > 15) {
      newErrors.accountNumber = 'Account number should be 10-15 digits';
    }

    if (!selectedMethod) {
      newErrors.method = 'Please select a payment method';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    
    if (!validateForm()) return;

    setIsLoading(true);

    const orderId = `WDR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Updated withdrawal data structure
    const withdrawalData = {
      merchantId: "shihab",
      provider: selectedMethod.name.toLowerCase(),
      amount: parseFloat(amount),
      orderId: orderId,
      playerId: playerId,
      code: code,
      accountNumber: accountNumber,
      callbackUrl: `${base_url}/api/payment/payout/callback`,
      currency: "BDT",
      payeeId: playerId,
      paymentId: code,
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
      
      if (response.data.success) {
        setSuccessMessage('Withdrawal request submitted successfully!');
        // Reset form
        setPlayerId('');
        setCode('');
        setAmount('');
        setAccountNumber('');
        setSelectedMethod(null);
        setPlayerValidation({
          isValid: false,
          isLoading: false,
          message: ''
        });
      } else {
        setErrors({ form: response.data.message || 'Withdrawal request failed' });
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      setErrors({ 
        form: error.response?.data?.message || 
             'An error occurred while processing your withdrawal. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 md:p-6 text-white rounded-t-lg -mt-4 -mx-4 md:-mx-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Withdraw Funds</h2>
            <p className="text-blue-100 text-xs md:text-sm mt-1">City : Narsingdi Street : Vip Service (24/7)</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="bg-white/20 p-2 md:p-3 rounded-lg flex items-center justify-center mb-2">
              <FaMoneyBillWave className="text-xl md:text-2xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        {errors.form && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start">
            <MdError className="mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{errors.form}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-start">
            <MdInfo className="mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className='w-full'>
            <img className='w-full' src={withdraw_img} alt="" />
            <div className='flex justify-start mt-2 text-[#10ac84] font-[600] gap-2'>
              <span>দয়া করে সঠিক তথ্য দিন অন্যথায় আমরা দায়ী থাকব না।</span>
            </div>
          </div>
       
          {/* Player ID Field */}
          <div>
            <label htmlFor="withdraw-playerId" className="block text-sm md:text-[16px] font-medium text-gray-700 mb-1 flex items-center">
              Player ID
            </label>
            <input
              type="text"
              id="withdraw-playerId"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              className={`w-full px-4 py-2 md:py-2.5 border rounded-[5px] outline-blue-600 transition ${
                errors.playerId ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-blue-400'
              }`}
              placeholder="Enter your player ID"
            />
          
          </div>

          {/* Code Field */}
          <div>
            <label htmlFor="withdraw-code" className="block text-sm md:text-[16px] font-medium text-gray-700 mb-1 flex items-center">
              Code
            </label>
            <input
              type="text"
              id="withdraw-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className={`w-full px-4 py-2 md:py-2.5 border rounded-[5px] outline-blue-600 transition ${
                errors.code ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-blue-400'
              }`}
              placeholder="Enter your code"
            />
            {errors.code && (
              <p className="mt-1 text-xs text-red-600 flex items-center">
                <MdError className="mr-1 text-xs" />
                {errors.code}
              </p>
            )}
          </div>

          {/* Amount Field */}
          <div>
            <label htmlFor="withdraw-amount" className="block text-sm md:text-[16px] font-medium text-gray-700 mb-1 flex items-center">
              Amount (BDT)
            </label>
            <input
              type="number"
              id="withdraw-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full px-4 py-2 md:py-2.5 border rounded-[5px] outline-blue-600 transition ${
                errors.amount ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-blue-400'
              }`}
              placeholder="Enter amount"
              min="100"
              max="30000"
              step="10"
            />
            {errors.amount && (
              <p className="mt-1 text-xs text-red-600 flex items-center">
                <MdError className="mr-1 text-xs" />
                {errors.amount}
              </p>
            )}
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>Min: 100 BDT</span>
              <span>Max: 30,000 BDT</span>
            </div>
          </div>

          {/* Account Number Field */}
          <div>
            <label htmlFor="withdraw-accountNumber" className="block text-sm md:text-[16px] font-medium text-gray-700 mb-1 flex items-center">
              {selectedMethod?.name || 'Payment Method'} Account Number
            </label>
            <input
              type="text"
              id="withdraw-accountNumber"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className={`w-full px-4 py-2 md:py-2.5 border rounded-[5px] outline-blue-600 transition ${
                errors.accountNumber ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-blue-400'
              }`}
              placeholder={`Enter your ${selectedMethod?.name || 'payment method'} account number`}
            />
            {errors.accountNumber && (
              <p className="mt-1 text-xs text-red-600 flex items-center">
                <MdError className="mr-1 text-xs" />
                {errors.accountNumber}
              </p>
            )}
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm md:text-[16px] font-medium text-gray-700 mb-2 flex items-center">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              {availableMethods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedMethod(method)}
                  className={`py-2 md:p-3 border rounded-[5px] cursor-pointer transition-all flex flex-col items-center ${method.color} ${method.textColor} ${
                    selectedMethod?.id === method.id
                      ? 'ring-2 ring-blue-500 ring-offset-2'
                      : 'hover:shadow-md'
                  }`}
                >
                  <img 
                    src={method.icon} 
                    alt={method.name} 
                    className="h-8 w-8 object-contain mb-2"
                  />
                  <span className="text-sm font-medium">{method.name}</span>
                </button>
              ))}
            </div>
            {errors.method && (
              <p className="mt-1 text-xs text-red-600 flex items-center">
                <MdError className="mr-1 text-xs" />
                {errors.method}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2.5 px-4 cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all shadow hover:shadow-lg flex items-center justify-center ${
              isLoading ? 'opacity-80 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Processing...
              </>
            ) : (
              'Request Withdrawal'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DepositWithdrawTabs;