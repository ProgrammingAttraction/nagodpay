import React, { useState } from "react";
import {
  FiPhone,
  FiHelpCircle,
  FiGift,
  FiChevronRight,
  FiSmartphone,
  FiLock,
  FiCheck
} from "react-icons/fi";
import { motion } from "framer-motion";
import logo from "../../assets/pi2.png";

const PaymentGateway = () => {
  const [selectedMethod, setSelectedMethod] = useState(null);

  const mobilePaymentMethods = [
    {
      id: "bkash",
      name: "bKash",
      logo: "https://xxxbetgames.com/icons-xxx/payments/226.svg",
      color: "#eb4d4b",
    },
    {
      id: "nagad",
      name: "Nagad",
      logo: "https://xxxbetgames.com/icons-xxx/payments/227.svg",
      color: "#F8A51B",
    },
    {
      id: "rocket",
      name: "Rocket",
      logo: "https://www.dutchbanglabank.com/img/mlogo.png",
      color: "#5D2D8A",
    },
    {
      id: "mycash",
      name: "MyCash",
      logo: "https://mycash.ws/template/files/images/logo.png",
      color: "#00AEEF",
    },
    {
      id: "okwallet",
      name: "OK Wallet",
      logo: "https://okwallet.com.bd/images/ok-logo.png",
      color: "#FF6B00",
    },
    {
      id: "upay",
      name: "Upay",
      logo: "https://www.upaybd.com/images/Upay-logo-revised-new.png",
      color: "#00A651",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 md:p-8">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-3xl mx-auto font-nunito bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-6 px-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
           <div className="border-[2px] w-[65px] h-[65px] border-green-500 rounded-full flex justify-center items-center">
                <img
              src={logo}
              alt="Company Logo"
              className="h-10 "
            />
           </div>
            <div>
              <h2 className="text-white font-bold text-2xl">NagodPay</h2>
              <p className="text-indigo-100 text-sm">Safe and encrypted transactions</p>
            </div>
          </div>
          <div className="text-gray-800 text-lg bg-white bg-opacity-20 px-4 py-2 rounded-[5px] flex items-center">
            <span className="mr-2">Amount:</span>
            <span className="font-bold">৳100.00</span>
          </div>
        </div>

        {/* Payment Steps */}
        <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center text-base">
            <div className="flex items-center">
              <div className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 font-bold">1</div>
              <span className="font-semibold text-indigo-700">Payment Method</span>
            </div>
            <div className="h-1 flex-1 mx-2 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-full"></div>
            <div className="flex items-center text-gray-400">
              <div className="bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center mr-3 font-bold">2</div>
              <span>Payment Details</span>
            </div>
            <div className="h-1 flex-1 mx-2 bg-gray-200 rounded-full"></div>
            <div className="flex items-center text-gray-400">
              <div className="bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center mr-3 font-bold">3</div>
              <span>Confirmation</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="px-8 py-6">
          <h3 className="text-gray-800 font-bold text-xl mb-2">Select Mobile Banking</h3>
          <p className="text-gray-500 mb-6">Choose your preferred mobile banking option</p>

          {/* Payment Options */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
          >
            {mobilePaymentMethods.map((method) => (
              <motion.div 
                key={method.id}
                variants={itemVariants}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedMethod(method.id)}
                className={`relative border-2 rounded-xl p-4 flex flex-col items-center cursor-pointer transition-all ${
                  selectedMethod === method.id 
                    ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg"
                    : "border-gray-200 hover:border-indigo-300"
                }`}
              >
                {/* Active state indicator */}
                {selectedMethod === method.id && (
                  <div className="absolute -top-2 -right-2 bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center">
                    <FiCheck size={14} />
                  </div>
                )}
                
                <div 
                  className="w-16 h-16 rounded-lg mb-3 flex items-center justify-center"
                  style={{ backgroundColor: `${method.color}30` }}
                >
                  <img
                    src={method.logo}
                    alt={method.name}
                    className="h-10 object-contain"
                  />
                </div>
                <span className={`text-sm font-medium ${
                  selectedMethod === method.id ? "text-indigo-700 font-semibold" : "text-gray-700"
                }`}>
                  {method.name}
                </span>
                
      
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Security & Footer */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
   
          
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex space-x-4 mb-4 md:mb-0">
              <a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors flex items-center">
                <FiHelpCircle className="mr-1" size={18} />
                <span className="text-sm">Help</span>
              </a>
              <a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors flex items-center">
                <FiPhone className="mr-1" size={18} />
                <span className="text-sm">Support</span>
              </a>
              <a href="#" className="text-gray-500 hover:text-indigo-600 transition-colors flex items-center">
                <FiGift className="mr-1" size={18} />
                <span className="text-sm">Offers</span>
              </a>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              disabled={!selectedMethod}
              className={`px-8 py-3 rounded-lg text-base font-semibold shadow-md transition-all flex items-center ${
                selectedMethod 
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Continue to Payment
              <FiChevronRight className="ml-2" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentGateway;