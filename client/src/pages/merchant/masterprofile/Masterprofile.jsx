import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

import logo from "../../../assets/logo.png"
import toast, { Toaster } from 'react-hot-toast';
import Merchantheader from '../../../components/common/merchant/Merchantheader';
import Merchantsidebar from '../../../components/common/merchant/Merchantsidebar';

const Masterprofile = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [merchantData, setMerchantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const merchant_info = JSON.parse(localStorage.getItem("merchantData"));
  const [formData, setFormData] = useState({ 
    name: '',
    email: '', 
    password: '',
    websiteUrl: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const token = localStorage.getItem('merchantToken');

  useEffect(() => {
    const fetchMerchantData = async () => {
      try {
        const response = await axios.get(`${base_url}/api/merchant/merchant-info/${merchant_info._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success) {
          setMerchantData(response.data.merchant);
          setFormData({
            name: response.data.merchant.name,
            email: response.data.merchant.email,
            websiteUrl: response.data.merchant.websiteUrl,
            password: '' // Don't pre-fill password for security
          });
        } else {
          toast.error('Failed to fetch merchant data');
        }
      } catch (err) {
        toast.error('Failed to fetch merchant data');
        console.error('Error fetching merchant data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMerchantData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare update data
      const updateData = {
        name: formData.name,
        email: formData.email,
        websiteUrl: formData.websiteUrl
      };

      // Only include password if it's being changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await axios.put(
        `${base_url}/api/merchant/update-merchant/${merchant_info._id}`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        // Update merchant data in state
        setMerchantData(response.data);
        // Clear password field after successful update
        setFormData(prev => ({ ...prev, password: '' }));
        setEditMode(false);
        toast.success('Merchant updated successfully!');
      }
    } catch (err) {
      // Handle specific error cases
      if (err.response?.data?.message === 'Email already in use') {
        toast.error('Email already in use');
      } else if (err.response?.data?.message === 'Password must be at least 6 characters') {
        toast.error('Password must be at least 6 characters');
      } else {
        toast.error(err.response?.data?.message || 'Failed to update merchant');
      }
      console.error('Update error:', err);
    }
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };



  return (
    <section className="font-anek bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
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
      
      <Merchantheader toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh]">
        <Merchantsidebar isOpen={isSidebarOpen} />

        <main className={`transition-all duration-300 flex-1 p-6 ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-theme py-4 px-6">
              <h1 className="text-2xl font-bold text-white">Merchant Profile</h1>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 mb-4 rounded-full bg-white border-2 border-theme flex items-center justify-center shadow-sm">
                  <img src={logo} alt="Logo" className="w-16" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">{merchantData?.name || 'Merchant'}</h2>
                <p className="text-gray-500">{merchantData?.email}</p>
                {merchantData?.websiteUrl && (
                  <a 
                    href={merchantData.websiteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline mt-1"
                  >
                    {merchantData.websiteUrl}
                  </a>
                )}
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-700 mb-2">API Key</h3>
                <div className="flex items-center">
                  <code className="bg-gray-200 px-3 py-2 rounded text-sm font-mono break-all">
                    {merchantData?.apiKey}
                  </code>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(merchantData?.apiKey);
                      toast.success('API Key copied to clipboard!');
                    }}
                    className="ml-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  >
                    Copy
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Keep your API key secure. Do not share it publicly.
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      disabled={true}
                      name="name"
                      value={editMode ? formData.name : merchantData?.name || ''}
                      onChange={handleInputChange}
                      readOnly={!editMode}
                      className={`block w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition duration-200 ${
                        editMode ? 'border-gray-300 bg-white focus:ring-theme' : 'border-gray-300 bg-gray-100'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={editMode ? formData.email : merchantData?.email || ''}
                      onChange={handleInputChange}
                      disabled={true}
                      readOnly={!editMode}
                      className={`block w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition duration-200 ${
                        editMode ? 'border-gray-300 bg-white focus:ring-theme' : 'border-gray-300 bg-gray-100'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1">
                      Website URL
                    </label>
                    <input
                      type="url"
                      id="websiteUrl"
                      name="websiteUrl"
                      disabled={true}
                      value={editMode ? formData.websiteUrl : merchantData?.websiteUrl || ''}
                      onChange={handleInputChange}
                      readOnly={!editMode}
                      className={`block w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition duration-200 ${
                        editMode ? 'border-gray-300 bg-white focus:ring-theme' : 'border-gray-300 bg-gray-100'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      {editMode && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-xs text-theme hover:underline focus:outline-none"
                        >
                          {showPassword ? 'Hide' : 'Show'} Password
                        </button>
                      )}
                    </div>
                    <input
                      type={editMode && showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder={editMode ? "Enter new password" : "••••••••"}
                      readOnly={!editMode}
                      className={`block w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition duration-200 ${
                        editMode ? 'border-gray-300 bg-white focus:ring-theme' : 'border-gray-300 bg-gray-100'
                      }`}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      {editMode ? "Leave blank to keep current password" : "For security reasons, password is hidden"}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  {editMode ? (
                    <>
                      <button
                        type="button"
                        onClick={toggleEditMode}
                        className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm cursor-pointer font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme transition duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-lg  bg-green-500 shadow-sm text-sm font-medium cursor-pointer text-white bg-theme hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme transition duration-200"
                      >
                        Save Changes
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={toggleEditMode}
                      className="px-4 py-2 border border-transparent rounded-lg shadow-sm  text-sm cursor-pointer font-medium cursor-pointer text-white bg-theme bg-green-500 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme transition duration-200"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        .loader {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #1946c4;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
};

export default Masterprofile;