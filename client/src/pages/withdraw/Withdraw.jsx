import React, { useState } from 'react';
import axios from 'axios';
import { FaSpinner, FaMoneyBillWave } from 'react-icons/fa';
import { MdError, MdInfo } from 'react-icons/md';
import withdraw_img from "../../assets/withdraw_img.png";

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

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    if (!playerId.trim()) {
      newErrors.playerId = 'Player ID is required';
    }

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
      merchantId: "shihab", // Changed from 'mid' to 'merchantId'
      provider: selectedMethod.name.toLowerCase(),
      amount: parseFloat(amount), // Ensure it's a number
      orderId: orderId,
      playerId: playerId, // Changed from 'payeeId' to 'playerId'
      code: code, // Changed from 'payeeCode' to 'code'
      accountNumber: accountNumber, // Changed from 'payeeAccount' to 'accountNumber'
      callbackUrl: `${base_url}/api/payment/payout/callback`, // Updated callback URL
      currency: "BDT",
      payeeId:playerId,
      paymentId: code, // Added paymentId
    };
    try {
      const response = await axios.post(
        `${base_url}/api/payment/payout`, // Updated endpoint
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
    <div className="min-h-screen font-anek bg-gray-50 flex items-center justify-center py-3 px-3 md:p-4">
      <div className="w-full md:max-w-md bg-white rounded-[3px] md:rounded-xl shadow-lg overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-bold">Withdraw Funds</h2>
              <p className="text-blue-100 text-[14px] md:text-sm mt-1">City : Narsingdi Street : Vip Service (24/7)</p>
            </div>
            <div className="flex flex-col items-end">
              <div className="bg-white/20 p-3 rounded-lg flex items-center justify-center mb-2">
                <FaMoneyBillWave className="text-2xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Form container */}
        <div className="p-3 md:p-6">
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
              <label htmlFor="playerId" className="block text-sm md:text-[16px] font-medium text-gray-700 mb-1 flex items-center">
                Player ID
              </label>
              <input
                type="text"
                id="playerId"
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                className={`w-full px-4 py-2 md:py-2.5 border rounded-[5px] outline-blue-600 transition ${
                  errors.playerId ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-blue-400'
                }`}
                placeholder="Enter your player ID"
              />
              {errors.playerId && (
                <p className="mt-1 text-xs text-red-600 flex items-center">
                  <MdError className="mr-1 text-xs" />
                  {errors.playerId}
                </p>
              )}
            </div>

            {/* Code Field */}
            <div>
              <label htmlFor="code" className="block text-sm md:text-[16px] font-medium text-gray-700 mb-1 flex items-center">
                Code
              </label>
              <input
                type="text"
                id="code"
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
              <label htmlFor="amount" className="block text-sm md:text-[16px] font-medium text-gray-700 mb-1 flex items-center">
                Amount (BDT)
              </label>
              <input
                type="number"
                id="amount"
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
              <label htmlFor="accountNumber" className="block text-sm md:text-[16px] font-medium text-gray-700 mb-1 flex items-center">
                {selectedMethod?.name || 'Payment Method'} Account Number
              </label>
              <input
                type="text"
                id="accountNumber"
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
    </div>
  );
};

export default Withdraw;