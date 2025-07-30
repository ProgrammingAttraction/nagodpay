import React, { useState } from 'react';
import axios from 'axios';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { useUser } from '../../context/UserContext';

const Addbankaccount = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userData } = useUser();
  const [selectedMethod, setSelectedMethod] = useState('');
  const [formData, setFormData] = useState({
    user_id: userData?._id,
    provider: '',
    accountNumber: '',
    shopName: '',
    username: '',
    password: '',
    appKey: '',
    appSecretKey: '',
    publicKey: '',
    privateKey: '',
    walletType: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
    const token = localStorage.getItem('authToken');

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleMethodChange = (e) => {
    const value = e.target.value;
    setSelectedMethod(value);
    setFormData(prev => ({
      ...prev,
      provider: value
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.provider) {
      newErrors.provider = 'Provider is required';
    }
    
    if (!formData.accountNumber) {
      newErrors.accountNumber = 'Account number is required';
    } else if (!/^01\d{9}$/.test(formData.accountNumber)) {
      newErrors.accountNumber = 'Invalid account number format. Must be 11 digits starting with 01';
    }
    
    if (!formData.shopName) {
      newErrors.shopName = 'Shop name is required';
    }
    
    if (formData.provider === 'Bkash P2C') {
      if (!formData.username) newErrors.username = 'Username is required';
      if (!formData.password) newErrors.password = 'Password is required';
      if (!formData.appKey) newErrors.appKey = 'App key is required';
      if (!formData.appSecretKey) newErrors.appSecretKey = 'App secret key is required';
    }
    
    if (formData.provider === 'Nagad P2C') {
      if (!formData.publicKey) newErrors.publicKey = 'Public key is required';
      if (!formData.privateKey) newErrors.privateKey = 'Private key is required';
    }
    
    if ((formData.provider === 'Bkash P2P' || formData.provider === 'Nagad P2P') && !formData.walletType) {
      newErrors.walletType = 'Wallet type is required for P2P methods';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess(false);
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await axios.post(`${base_url}/api/user/add-bank-account`, formData,  {
        headers: {
          'Authorization': `Bearer ${token}`
        }});
      
      if (response.data.success) {
        setSubmitSuccess(true);
        // Reset form after successful submission
        setFormData({
          user_id: userData._id,
          provider: '',
          accountNumber: '',
          shopName: '',
          username: '',
          password: '',
          appKey: '',
          appSecretKey: '',
          publicKey: '',
          privateKey: '',
          walletType: ''
        });
        setSelectedMethod('');
      } else {
        setSubmitError(response.data.message || 'Failed to add bank account');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError(error.response?.data?.message || 'An error occurred while submitting the form');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex h-screen font-fira overflow-hidden">
      {/* Sidebar */}
      <div className="shrink-0 h-screen overflow-y-auto overflow-x-hidden bg-white border-r">
        <Sidebar isOpen={sidebarOpen} />
      </div>

      {/* Main Content */}
      <section className="flex-1 w-full h-screen overflow-y-auto bg-gray-50">
        <Header toggleSidebar={toggleSidebar} />

        <div className="p-6">
          <h1 className="text-xl font-semibold text-gray-800 border-gray-200 mb-4">Add Bank Account</h1>

          {submitSuccess && (
            <div className="mb-4 p-4 bg-green-100 text-green-700 rounded border border-green-200">
              Bank account added successfully!
            </div>
          )}

          {submitError && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded border border-red-200">
              {submitError}
            </div>
          )}

          <div className="bg-white rounded-md shadow border border-gray-200">
            {/* Tab Navigation */}
            <div className="border-b px-4 py-3 text-sm font-medium border-gray-200 text-gray-700 bg-gray-50 rounded-t-md">
              Bank Account Info
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">Provider - Payment Method</label>
                <select 
                  className={`border rounded px-3 py-2 text-sm border-gray-200 outline-theme ${errors.provider ? 'border-red-500' : ''}`}
                  onChange={handleMethodChange}
                  value={formData.provider}
                  name="provider"
                >
                  <option value="">Select Provider Payment Method</option>
                {userData?.paymentMethod.map((data)=>{
                  return(
                  <option value={data}>{userData?.username} ({data})</option>
                  ) 
                })}
                </select>
                {errors.provider && <span className="text-red-500 text-xs mt-1">{errors.provider}</span>}
              </div>

              {/* Common fields for all methods */}
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">Account Number</label>
                <input
                  type="text"
                  className={`border rounded px-3 py-2 text-sm border-gray-200 outline-theme ${errors.accountNumber ? 'border-red-500' : ''}`}
                  placeholder="01XXXXXXXXX (11 digits)"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  maxLength="11"
                />
                {errors.accountNumber && <span className="text-red-500 text-xs mt-1">{errors.accountNumber}</span>}
              </div>

              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">Shop Name</label>
                <input
                  type="text"
                  className={`border rounded px-3 py-2 text-sm border-gray-200 outline-theme ${errors.shopName ? 'border-red-500' : ''}`}
                  placeholder="My Shop"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleChange}
                />
                {errors.shopName && <span className="text-red-500 text-xs mt-1">{errors.shopName}</span>}
              </div>

              {/* Fields for Bkash P2C */}
              {formData.provider === 'Bkash P2C' && (
                <>
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-medium text-gray-700">Username</label>
                    <input
                      type="text"
                      className={`border rounded px-3 py-2 text-sm border-gray-200 outline-theme ${errors.username ? 'border-red-500' : ''}`}
                      placeholder="Username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                    />
                    {errors.username && <span className="text-red-500 text-xs mt-1">{errors.username}</span>}
                  </div>
  <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">Wallet Type</label>
                  <select 
                    className={`border rounded px-3 py-2 text-sm border-gray-200 outline-theme ${errors.walletType ? 'border-red-500' : ''}`}
                    name="walletType"
                    value={formData.walletType}
                    onChange={handleChange}
                  >
                    <option value="">Select Wallet Type</option>
                    <option value="M Plush">M Plush</option>
                    <option value="Daily 300K">Daily 300K</option>
                    <option value="Daily 30K">Daily 30K</option>
                  </select>
                  {errors.walletType && <span className="text-red-500 text-xs mt-1">{errors.walletType}</span>}
                </div>
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-medium text-gray-700">Password</label>
                    <input
                      type="password"
                      className={`border rounded px-3 py-2 text-sm border-gray-200 ${errors.password ? 'border-red-500' : ''}`}
                      placeholder="Password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    {errors.password && <span className="text-red-500 text-xs mt-1">{errors.password}</span>}
                  </div>

                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-medium text-gray-700">App Key</label>
                    <input
                      type="text"
                      className={`border rounded px-3 py-2 text-sm border-gray-200 ${errors.appKey ? 'border-red-500' : ''}`}
                      placeholder="App Key"
                      name="appKey"
                      value={formData.appKey}
                      onChange={handleChange}
                    />
                    {errors.appKey && <span className="text-red-500 text-xs mt-1">{errors.appKey}</span>}
                  </div>

                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-medium text-gray-700">App Secret Key</label>
                    <input
                      type="text"
                      className={`border rounded px-3 py-2 text-sm border-gray-200 ${errors.appSecretKey ? 'border-red-500' : ''}`}
                      placeholder="App Secret Key"
                      name="appSecretKey"
                      value={formData.appSecretKey}
                      onChange={handleChange}
                    />
                    {errors.appSecretKey && <span className="text-red-500 text-xs mt-1">{errors.appSecretKey}</span>}
                  </div>
                </>
              )}

              {/* Fields for Nagad P2C */}
              {formData.provider === 'Nagad P2C' && (
                <>
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-medium text-gray-700">Public Key</label>
                    <input
                      type="text"
                      className={`border rounded px-3 py-2 text-sm border-gray-200 ${errors.publicKey ? 'border-red-500' : ''}`}
                      placeholder="Public Key"
                      name="publicKey"
                      value={formData.publicKey}
                      onChange={handleChange}
                    />
                    {errors.publicKey && <span className="text-red-500 text-xs mt-1">{errors.publicKey}</span>}
                  </div>
  <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">Wallet Type</label>
                  <select 
                    className={`border rounded px-3 py-2 text-sm border-gray-200 outline-theme ${errors.walletType ? 'border-red-500' : ''}`}
                    name="walletType"
                    value={formData.walletType}
                    onChange={handleChange}
                  >
                    <option value="">Select Wallet Type</option>
                    <option value="M Plush">M Plush</option>
                    <option value="Daily 300K">Daily 300K</option>
                    <option value="Daily 30K">Daily 30K</option>
                  </select>
                  {errors.walletType && <span className="text-red-500 text-xs mt-1">{errors.walletType}</span>}
                </div>
                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-medium text-gray-700">Private Key</label>
                    <input
                      type="text"
                      className={`border rounded px-3 py-2 text-sm border-gray-200 ${errors.privateKey ? 'border-red-500' : ''}`}
                      placeholder="Private Key"
                      name="privateKey"
                      value={formData.privateKey}
                      onChange={handleChange}
                    />
                    {errors.privateKey && <span className="text-red-500 text-xs mt-1">{errors.privateKey}</span>}
                  </div>
                </>
              )}

              {/* Wallet Type for P2P methods */}
              {(formData.provider === 'Bkash P2P' || formData.provider === 'Nagad P2P') && (
                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">Wallet Type</label>
                  <select 
                    className={`border rounded px-3 py-2 text-sm border-gray-200 outline-theme ${errors.walletType ? 'border-red-500' : ''}`}
                    name="walletType"
                    value={formData.walletType}
                    onChange={handleChange}
                  >
                    <option value="">Select Wallet Type</option>
                    <option value="M Plush">M Plush</option>
                    <option value="Daily 300K">Daily 300K</option>
                    <option value="Daily 30K">Daily 30K</option>
                  </select>
                  {errors.walletType && <span className="text-red-500 text-xs mt-1">{errors.walletType}</span>}
                </div>
              )}

              {/* Submit Button */}
              <div className="col-span-1 md:col-span-2 flex justify-center mt-2">
                <button 
                  type="submit"
                  className="bg-theme hover:bg-green-700 cursor-pointer text-white text-sm font-semibold px-6 py-2 rounded disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : 'Add Bank Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </section>
  );
};

export default Addbankaccount;