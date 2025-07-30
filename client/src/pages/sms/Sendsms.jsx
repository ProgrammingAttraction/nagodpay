import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaChevronDown, FaExclamationCircle } from 'react-icons/fa';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { useUser } from '../../context/UserContext';
import toast, { Toaster } from "react-hot-toast";

const Sendsms = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    provider: '', // 'bkash' or 'nagad'
    agentAccount: '',
    customerAccount: '',
    transactionType: '', // 'payin' or 'payout'
    transactionAmount: '',
    feeAmount: '',
    balanceAmount: '',
    transactionId: '',
    transactionDate: '',
    currency: 'BDT',
    text: '' // Raw SMS text
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userData } = useUser();
  const navigate = useNavigate();

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.provider) newErrors.provider = 'Provider is required';
    if (!formData.agentAccount) newErrors.agentAccount = 'Agent account is required';
    if (!formData.customerAccount) newErrors.customerAccount = 'Customer account is required';
    if (!formData.transactionType) newErrors.transactionType = 'Transaction type is required';
    if (!formData.transactionAmount) {
      newErrors.transactionAmount = 'Amount is required';
    } else if (isNaN(formData.transactionAmount)) {
      newErrors.transactionAmount = 'Amount must be a number';
    }
    if (!formData.transactionId) newErrors.transactionId = 'Transaction ID is required';
    if (!formData.transactionDate) newErrors.transactionDate = 'Transaction date is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatDateForSMS = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const generateSmsText = () => {
    const formattedDate = formatDateForSMS(formData.transactionDate);
    
    if (formData.provider === 'bkash') {
      if (formData.transactionType === 'payout') {
        return `Cash In Tk ${formData.transactionAmount} from ${formData.agentAccount} to ${formData.customerAccount}. Fee Tk ${formData.feeAmount}. Balance Tk ${formData.balanceAmount}. TrxID ${formData.transactionId} at ${formattedDate}`;
      } else {
        return `Cash Out Tk ${formData.transactionAmount} from ${formData.customerAccount} to ${formData.agentAccount}. Fee Tk ${formData.feeAmount}. Balance Tk ${formData.balanceAmount}. TrxID ${formData.transactionId} at ${formattedDate}`;
      }
    } else if (formData.provider === 'nagad') {
      if (formData.transactionType === 'payout') {
        return `Cash In Tk ${formData.transactionAmount} from ${formData.agentAccount} to ${formData.customerAccount}. Comm: Tk ${formData.feeAmount}. Balance: Tk ${formData.balanceAmount}. TxnID: ${formData.transactionId} at ${formattedDate}`;
      } else {
        return `Cash Out Tk ${formData.transactionAmount} from ${formData.customerAccount} to ${formData.agentAccount}. Comm: Tk ${formData.feeAmount}. Balance: Tk ${formData.balanceAmount}. TxnID: ${formData.transactionId} at ${formattedDate}`;
      }
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const smsText = generateSmsText();
      
      const payload = {
        from: formData.provider,
        number: formData.agentAccount,
        text: smsText,
        sentStamp: new Date().toISOString(),
        receivedStamp: new Date().toISOString()
      };

      const response = await axios.post(`${base_url}/api/payment/callbackSms`, payload);
      
      toast.success('SMS sent successfully!');
      setFormData({
        provider: '',
        agentAccount: '',
        customerAccount: '',
        transactionType: '',
        transactionAmount: '',
        feeAmount: '',
        balanceAmount: '',
        transactionId: '',
        transactionDate: '',
        currency: 'BDT',
        text: ''
      });
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast.error(error.response?.data?.error || 'Failed to send SMS');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex h-screen overflow-hidden bg-gray-50 font-fira">
      {/* Sidebar */}
      <div className={`shrink-0 h-screen overflow-y-auto overflow-x-hidden bg-white border-r transition-all duration-300 `}>
        <Sidebar isOpen={sidebarOpen} />
      </div>
      <Toaster/>
      {/* Main Content */}
      <section className="flex-1 w-full h-screen overflow-y-auto ">
        <Header toggleSidebar={toggleSidebar} />

        <div className='p-[15px]'>
          <h1 className="text-2xl font-semibold mb-6 text-gray-800">Send SMS</h1>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
            <h2 className="text-lg font-medium mb-4 text-gray-700">Create SMS</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provider*</label>
                  <select
                    name="provider"
                    value={formData.provider}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-md ${errors.provider ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select Provider</option>
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                  </select>
                  {errors.provider && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FaExclamationCircle className="mr-1" /> {errors.provider}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type*</label>
                  <select
                    name="transactionType"
                    value={formData.transactionType}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-md ${errors.transactionType ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select Type</option>
                    <option value="payin">Pay In (Cash Out)</option>
                    <option value="payout">Pay Out (Cash In)</option>
                  </select>
                  {errors.transactionType && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FaExclamationCircle className="mr-1" /> {errors.transactionType}
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Agent Account Number*</label>
                <input
                  type="text"
                  name="agentAccount"
                  value={formData.agentAccount}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md ${errors.agentAccount ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Agent's mobile number"
                />
                {errors.agentAccount && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <FaExclamationCircle className="mr-1" /> {errors.agentAccount}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Account Number*</label>
                <input
                  type="text"
                  name="customerAccount"
                  value={formData.customerAccount}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded-md ${errors.customerAccount ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Customer's mobile number"
                />
                {errors.customerAccount && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <FaExclamationCircle className="mr-1" /> {errors.customerAccount}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Tk)*</label>
                  <input
                    type="number"
                    name="transactionAmount"
                    value={formData.transactionAmount}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-md ${errors.transactionAmount ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="0.00"
                    step="0.01"
                  />
                  {errors.transactionAmount && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FaExclamationCircle className="mr-1" /> {errors.transactionAmount}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.provider === 'bkash' ? 'Fee (Tk)' : 'Commission (Tk)'}*
                  </label>
                  <input
                    type="number"
                    name="feeAmount"
                    value={formData.feeAmount}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-md ${errors.feeAmount ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="0.00"
                    step="0.01"
                  />
                  {errors.feeAmount && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FaExclamationCircle className="mr-1" /> {errors.feeAmount}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Balance (Tk)*</label>
                  <input
                    type="number"
                    name="balanceAmount"
                    value={formData.balanceAmount}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-md ${errors.balanceAmount ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="0.00"
                    step="0.01"
                  />
                  {errors.balanceAmount && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FaExclamationCircle className="mr-1" /> {errors.balanceAmount}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID*</label>
                  <input
                    type="text"
                    name="transactionId"
                    value={formData.transactionId}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-md ${errors.transactionId ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="Transaction ID"
                  />
                  {errors.transactionId && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FaExclamationCircle className="mr-1" /> {errors.transactionId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Date*</label>
                  <input
                    type="datetime-local"
                    name="transactionDate"
                    value={formData.transactionDate}
                    onChange={handleChange}
                    className={`w-full p-2 border rounded-md ${errors.transactionDate ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.transactionDate && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <FaExclamationCircle className="mr-1" /> {errors.transactionDate}
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">SMS Preview</label>
                <div className="p-3 bg-gray-100 rounded-md text-sm">
                  {formData.provider ? generateSmsText() : 'Select a provider to see SMS preview'}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {isSubmitting ? 'Sending...' : 'Send SMS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </section>
  );
};

export default Sendsms;