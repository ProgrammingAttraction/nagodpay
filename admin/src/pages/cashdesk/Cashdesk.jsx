import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import logo from '../../assets/logo.png';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';

const Cashdesk = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  
  // API constants
  const CASHDESK_API_BASE = 'https://partners.servcul.com/CashdeskBotAPI';
  const CASHDESK_HASH = "a13d615c8ee6f83a12a0645de4d9a1c4068148562f2ea165dea920c66af2ed90";
  const CASHIER_PASS = "901276";
  const CASHIER_LOGIN = "MuktaA1";
  const CASHDESK_ID = "1177830";
  const DEFAULT_LNG = 'en';
  
  // Form state
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    description: '',
    reference: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0';
    }
    
    if (!formData.customerName || formData.customerName.trim().length < 2) {
      newErrors.customerName = 'Customer name is required';
    }
    
    if (formData.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'Please enter a valid email address';
    }
    
    if (formData.customerPhone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.customerPhone.replace(/\s/g, ''))) {
      newErrors.customerPhone = 'Please enter a valid phone number';
    }
    
    if (!formData.description || formData.description.trim().length < 5) {
      newErrors.description = 'Description must be at least 5 characters long';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare the request data
      const requestData = {
        cashdesk_id: CASHDESK_ID,
        cashdesk_hash: CASHDESK_HASH,
        cashier_login: CASHIER_LOGIN,
        cashier_pass: CASHIER_PASS,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        customer_name: formData.customerName,
        customer_email: formData.customerEmail || null,
        customer_phone: formData.customerPhone || null,
        description: formData.description,
        reference: formData.reference || `REF-${Date.now()}`,
        lng: DEFAULT_LNG
      };
      
      // Make the API call
      const response = await axios.post(`${CASHDESK_API_BASE}/transaction`, requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.success) {
        // Show success message
        Swal.fire({
          title: 'Success!',
          text: 'Transaction completed successfully',
          icon: 'success',
          confirmButtonText: 'OK'
        });
        
        // Reset form
        setFormData({
          amount: '',
          currency: 'USD',
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          description: '',
          reference: ''
        });
      } else {
        throw new Error(response.data.message || 'Transaction failed');
      }
    } catch (error) {
      console.error('API Error:', error);
      let errorMessage = 'An error occurred while processing your request';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Swal.fire({
        title: 'Error!',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="font-nunito w-full bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
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
      
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh] w-full">
        <Sidebar isOpen={isSidebarOpen} />

        <main className={`transition-all duration-300 flex-1 p-6 ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Cash Desk Transaction</h1>
              <img src={logo} alt="Logo" className="h-10" />
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Amount Field */}
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                      errors.amount ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                  )}
                </div>
                
                {/* Currency Field */}
                <div>
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                    Currency *
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CAD">CAD</option>
                  </select>
                </div>
                
                {/* Customer Name Field */}
                <div>
                  <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    id="customerName"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                      errors.customerName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.customerName && (
                    <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>
                  )}
                </div>
                
                {/* Customer Email Field */}
                <div>
                  <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Email
                  </label>
                  <input
                    type="email"
                    id="customerEmail"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleChange}
                    placeholder="customer@example.com"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                      errors.customerEmail ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.customerEmail && (
                    <p className="mt-1 text-sm text-red-600">{errors.customerEmail}</p>
                  )}
                </div>
                
                {/* Customer Phone Field */}
                <div>
                  <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Phone
                  </label>
                  <input
                    type="tel"
                    id="customerPhone"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    placeholder="+1234567890"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                      errors.customerPhone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.customerPhone && (
                    <p className="mt-1 text-sm text-red-600">{errors.customerPhone}</p>
                  )}
                </div>
                
                {/* Reference Field */}
                <div>
                  <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1">
                    Reference (Optional)
                  </label>
                  <input
                    type="text"
                    id="reference"
                    name="reference"
                    value={formData.reference}
                    onChange={handleChange}
                    placeholder="Transaction reference"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>
              
              {/* Description Field */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Transaction description"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>
              
              {/* Submit Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition ${
                    isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Processing...' : 'Process Transaction'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </section>
  );
};

export default Cashdesk;