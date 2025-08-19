import React, { useState } from 'react';
import axios from 'axios';
import { FaSpinner } from 'react-icons/fa';
import { MdPayment, MdError, MdInfo, MdAccountCircle, MdAttachMoney } from 'react-icons/md';

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
  
  if (!validateForm()) return;

  setIsLoading(true);

  const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const numericAmount = parseFloat(amount); // Convert amount to number

  try {
    if (selectedMethod.type === 'fast') {
      // Bkash Fast method
      const { data } = await axios.post(
        `${base_url2}/api/payment/bkash`,
        {
          mid: "hobet",
          payerId: playerId,
          amount: numericAmount, // Use numericAmount instead of amount
          currency: "BDT",
          redirectUrl: frontend_url,
          orderId: orderId,
          callbackUrl: `${frontend_url}/callback-payment`
        },
        {
          headers: {
            'x-api-key': '8e91f27afc311cce77c1'
          }
        }
      );
   console.log(data)
      if (data.success) {
        // Redirect directly to the payment URL
        window.location.href = data.link;
      } else {
        setErrors({ form: data.message || 'Bkash Fast payment initiation failed' });
      }
    } else {
      // Regular payment methods
      const postData = {
        provider: selectedMethod.name.toLowerCase(),
        amount: numericAmount, // Use numericAmount instead of amount
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
            'x-api-key': 'b681e4a242dfdcf173db',
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        window.location.href = `http://localhost:5173/checkout/${response.data.paymentId}`;
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
    <div className="min-h-screen font-anek bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Deposit Funds</h2>
              <p className="text-blue-100 text-sm mt-1">Secure and instant deposits</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg flex items-center justify-center">
              <MdPayment className="text-2xl" />
            </div>
          </div>
        </div>

        {/* Form container */}
        <div className="p-6">
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
              <label htmlFor="playerId" className="block text-sm md:text-[16px] font-medium text-gray-700 mb-1 flex items-center">
                Player ID
              </label>
              <input
                type="text"
                id="playerId"
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-[5px] outline-blue-600 transition ${
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

            {/* Amount Field */}
            <div>
              <label htmlFor="amount" className="block text-sm md:text-[16px] font-medium text-gray-700 mb-1  items-center">
                Amount (BDT)
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-[5px] outline-blue-600  transition ${
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
    </div>
  );
};

export default Deposit;