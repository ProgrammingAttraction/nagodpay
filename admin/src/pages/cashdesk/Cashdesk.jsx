import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';

const Cashdesk = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [formData, setFormData] = useState({
    cashdeskId: '',
    cashdesk: '',
    cashdeskHash: '',
    cashierPass: '',
    cashierLogin: '',
    cashdeskApiBase: '',
    defaultLng: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cashdesks, setCashdesks] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCashdeskId, setCurrentCashdeskId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Fetch all cashdesks on component mount
  useEffect(() => {
    fetchCashdesks();
  }, []);

  const fetchCashdesks = async () => {
    try {
      setIsLoading(true);
      // Replace with your actual API endpoint
      const response = await axios.get(`${base_url}/api/admin/cashdesk`);
      if (response.data.success) {
        setCashdesks(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cashdesks:', error);
      toast.error('Failed to fetch cashdesk configurations');
    } finally {
      setIsLoading(false);
    }
  };

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

  const validateForm = () => {
    const newErrors = {};
    
    // Cashdesk ID validation
    if (!formData.cashdeskId.trim()) {
      newErrors.cashdeskId = 'Cashdesk ID is required';
    }
    
    // Cashdesk validation
    if (!formData.cashdesk.trim()) {
      newErrors.cashdesk = 'Cashdesk is required';
    }
    
    // Cashdesk Hash validation
    if (!formData.cashdeskHash.trim()) {
      newErrors.cashdeskHash = 'Cashdesk Hash is required';
    }
    
    // Cashier Password validation
    if (!formData.cashierPass.trim()) {
      newErrors.cashierPass = 'Cashier Password is required';
    } else if (formData.cashierPass.length < 6) {
      newErrors.cashierPass = 'Password must be at least 6 characters';
    }
    
    // Cashier Login validation
    if (!formData.cashierLogin.trim()) {
      newErrors.cashierLogin = 'Cashier Login is required';
    }
    
    // API Base URL validation
    if (!formData.cashdeskApiBase.trim()) {
      newErrors.cashdeskApiBase = 'API Base URL is required';
    } else if (!/^https?:\/\/.+\..+/.test(formData.cashdeskApiBase)) {
      newErrors.cashdeskApiBase = 'Please enter a valid URL';
    }
    
    // Default Language validation
    if (!formData.defaultLng.trim()) {
      newErrors.defaultLng = 'Default Language is required';
    } else if (formData.defaultLng.length !== 2) {
      newErrors.defaultLng = 'Language code must be 2 characters (e.g., en, fr, es)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let response;
      
      if (isEditing) {
        // Update existing cashdesk
        response = await axios.put(`${base_url}/api/admin/cashdesk/${currentCashdeskId}`, formData);
      } else {
        // Create new cashdesk
        response = await axios.post(`${base_url}/api/admin/cashdesk`, formData);
      }
      
      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: response.data.message || 'Cashdesk configuration saved successfully',
          confirmButtonColor: '#4361ee',
        });
        
        // Reset form and refresh data
        resetForm();
        fetchCashdesks();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      
      if (error.response?.data?.errors) {
        // Display validation errors
        error.response.data.errors.forEach(err => {
          toast.error(err);
        });
      } else {
        toast.error(error.response?.data?.message || 'Failed to save cashdesk configuration');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (cashdesk) => {
    setFormData({
      cashdeskId: cashdesk.cashdeskId,
      cashdesk: cashdesk.cashdesk,
      cashdeskHash: cashdesk.cashdeskHash,
      cashierPass: cashdesk.cashierPass,
      cashierLogin: cashdesk.cashierLogin,
      cashdeskApiBase: cashdesk.cashdeskApiBase,
      defaultLng: cashdesk.defaultLng
    });
    setCurrentCashdeskId(cashdesk._id);
    setIsEditing(true);
    
    // Scroll to form
    document.getElementById('cashdesk-form').scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });
    
    if (result.isConfirmed) {
      try {
        const response = await axios.delete(`${base_url}/api/admin/cashdesk/${id}`);
        
        if (response.data.success) {
          Swal.fire(
            'Deleted!',
            response.data.message || 'Cashdesk configuration has been deleted.',
            'success'
          );
          
          // Refresh data
          fetchCashdesks();
          
          // If we were editing the deleted item, reset the form
          if (currentCashdeskId === id) {
            resetForm();
          }
        }
      } catch (error) {
        console.error('Error deleting cashdesk:', error);
        toast.error(error.response?.data?.message || 'Failed to delete cashdesk configuration');
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const response = await axios.patch(`${base_url}/api/admin/cashdesk/${id}/status`, {
        isActive: !currentStatus
      });
      
      if (response.data.success) {
        toast.success(response.data.message || 'Status updated successfully');
        fetchCashdesks();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      cashdeskId: '',
      cashdesk: '',
      cashdeskHash: '',
      cashierPass: '',
      cashierLogin: '',
      cashdeskApiBase: '',
      defaultLng: ''
    });
    setErrors({});
    setIsEditing(false);
    setCurrentCashdeskId(null);
  };

  const handleClearAll = async () => {
    const result = await Swal.fire({
      title: 'Clear All Cashdesks?',
      text: "This will delete ALL cashdesk configurations. This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, clear all!',
      reverseButtons: true
    });
    
    if (result.isConfirmed) {
      try {
        // Delete all cashdesks one by one
        const deletePromises = cashdesks.map(cashdesk => 
          axios.delete(`${base_url}/api/admin/cashdesk/${cashdesk._id}`)
        );
        
        await Promise.all(deletePromises);
        
        Swal.fire(
          'Cleared!',
          'All cashdesk configurations have been deleted.',
          'success'
        );
        
        // Refresh data and reset form
        setCashdesks([]);
        resetForm();
      } catch (error) {
        console.error('Error clearing all cashdesks:', error);
        toast.error('Failed to clear all cashdesk configurations');
      }
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
          <div className="bg-white rounded-xl shadow-md p-6 mb-6" id="cashdesk-form">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Cashdesk Configuration</h1>
                <p className="text-gray-600">
                  {isEditing ? 'Edit existing cashdesk settings' : 'Create new cashdesk settings and API connections'}
                </p>
              </div>
              
              {isEditing && (
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cashdesk ID Field */}
              <div>
                <label htmlFor="cashdeskId" className="block text-sm font-medium text-gray-700 mb-1">
                  Cashdesk ID *
                </label>
                <input
                  type="text"
                  id="cashdeskId"
                  name="cashdeskId"
                  value={formData.cashdeskId}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                    errors.cashdeskId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter cashdesk ID"
                  disabled={isEditing}
                />
                {errors.cashdeskId && (
                  <p className="mt-1 text-sm text-red-600">{errors.cashdeskId}</p>
                )}
              </div>
              
              {/* Cashdesk Field */}
              <div>
                <label htmlFor="cashdesk" className="block text-sm font-medium text-gray-700 mb-1">
                  Cashdesk Name *
                </label>
                <input
                  type="text"
                  id="cashdesk"
                  name="cashdesk"
                  value={formData.cashdesk}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                    errors.cashdesk ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter cashdesk name"
                />
                {errors.cashdesk && (
                  <p className="mt-1 text-sm text-red-600">{errors.cashdesk}</p>
                )}
              </div>
              
              {/* Cashdesk Hash Field */}
              <div>
                <label htmlFor="cashdeskHash" className="block text-sm font-medium text-gray-700 mb-1">
                  Cashdesk Hash *
                </label>
                <input
                  type="text"
                  id="cashdeskHash"
                  name="cashdeskHash"
                  value={formData.cashdeskHash}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                    errors.cashdeskHash ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter cashdesk hash"
                />
                {errors.cashdeskHash && (
                  <p className="mt-1 text-sm text-red-600">{errors.cashdeskHash}</p>
                )}
              </div>
              
              {/* Cashier Password Field */}
              <div>
                <label htmlFor="cashierPass" className="block text-sm font-medium text-gray-700 mb-1">
                  Cashier Password *
                </label>
                <input
                  type="password"
                  id="cashierPass"
                  name="cashierPass"
                  value={formData.cashierPass}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                    errors.cashierPass ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter cashier password"
                />
                {errors.cashierPass && (
                  <p className="mt-1 text-sm text-red-600">{errors.cashierPass}</p>
                )}
              </div>
              
              {/* Cashier Login Field */}
              <div>
                <label htmlFor="cashierLogin" className="block text-sm font-medium text-gray-700 mb-1">
                  Cashier Login *
                </label>
                <input
                  type="text"
                  id="cashierLogin"
                  name="cashierLogin"
                  value={formData.cashierLogin}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                    errors.cashierLogin ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter cashier login"
                />
                {errors.cashierLogin && (
                  <p className="mt-1 text-sm text-red-600">{errors.cashierLogin}</p>
                )}
              </div>
              
              {/* API Base URL Field */}
              <div>
                <label htmlFor="cashdeskApiBase" className="block text-sm font-medium text-gray-700 mb-1">
                  API Base URL *
                </label>
                <input
                  type="url"
                  id="cashdeskApiBase"
                  name="cashdeskApiBase"
                  value={formData.cashdeskApiBase}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                    errors.cashdeskApiBase ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://api.example.com"
                />
                {errors.cashdeskApiBase && (
                  <p className="mt-1 text-sm text-red-600">{errors.cashdeskApiBase}</p>
                )}
              </div>
              
              {/* Default Language Field */}
              <div>
                <label htmlFor="defaultLng" className="block text-sm font-medium text-gray-700 mb-1">
                  Default Language *
                </label>
                <input
                  type="text"
                  id="defaultLng"
                  name="defaultLng"
                  value={formData.defaultLng}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
                    errors.defaultLng ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="en, fr, es, etc."
                  maxLength={2}
                />
                {errors.defaultLng && (
                  <p className="mt-1 text-sm text-red-600">{errors.defaultLng}</p>
                )}
              </div>
              
              {/* Submit Button */}
              <div className="md:col-span-2 flex justify-end mt-4 space-x-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : isEditing ? 'Update Configuration' : 'Save Configuration'}
                </button>
                
                {cashdesks.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Cashdesk List Section */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Cashdesk Configurations</h2>
              <button
                onClick={fetchCashdesks}
                className="px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading cashdesk configurations...</p>
              </div>
            ) : cashdesks.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No cashdesk configurations</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new cashdesk configuration.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Login
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        API Base
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Language
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cashdesks.map((cashdesk) => (
                      <tr key={cashdesk._id} className={cashdesk._id === currentCashdeskId ? 'bg-blue-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {cashdesk.cashdeskId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cashdesk.cashdesk}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cashdesk.cashierLogin}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="max-w-xs truncate" title={cashdesk.cashdeskApiBase}>
                            {cashdesk.cashdeskApiBase}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cashdesk.defaultLng.toUpperCase()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleToggleStatus(cashdesk._id, cashdesk.isActive)}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              cashdesk.isActive 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {cashdesk.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleEdit(cashdesk)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(cashdesk._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </section>
  );
};

export default Cashdesk;