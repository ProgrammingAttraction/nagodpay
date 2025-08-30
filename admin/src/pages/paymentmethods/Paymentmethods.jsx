import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { FaSync, FaTrashAlt, FaEdit, FaPlus } from 'react-icons/fa';
import Swal from 'sweetalert2';

const Paymentmethods = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    name_bn: '',
    image: '',
    type: 'regular',
    category: 'mobile',
    minAmount: 100,
    maxAmount: 30000,
    isEnabled: true,
    priority: 0
  });
  
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('authToken');

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${base_url}/api/admin/payment-methods`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setPaymentMethods(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setError('Failed to fetch payment methods');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingMethod) {
        // Update existing payment method
        await axios.put(
          `${base_url}/api/admin/payment-methods/${editingMethod._id}`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        Swal.fire('Success!', 'Payment method updated successfully', 'success');
      } else {
        // Create new payment method
        await axios.post(
          `${base_url}/api/admin/payment-methods`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        Swal.fire('Success!', 'Payment method created successfully', 'success');
      }
      
      setShowForm(false);
      setEditingMethod(null);
      setFormData({
        name: '',
        name_bn: '',
        image: '',
        type: 'regular',
        category: 'mobile',
        minAmount: 100,
        maxAmount: 30000,
        isEnabled: true,
        priority: 0
      });
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error saving payment method:', error);
      Swal.fire('Error!', error.response?.data?.message || 'Failed to save payment method', 'error');
    }
  };

  const editPaymentMethod = (method) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      name_bn: method.name_bn,
      image: method.image,
      type: method.type,
      category: method.category,
      minAmount: method.minAmount,
      maxAmount: method.maxAmount,
      isEnabled: method.isEnabled,
      priority: method.priority
    });
    setShowForm(true);
  };

  const deletePaymentMethod = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Payment Method',
      text: 'Are you sure you want to delete this payment method?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-lg shadow-xl'
      }
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Deleting...',
          html: 'Please wait while we delete the payment method',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await axios.delete(
          `${base_url}/api/admin/payment-methods/${id}`, 
          { 
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        await Swal.fire({
          title: 'Deleted!',
          text: 'The payment method has been deleted.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          timer: 2000,
          timerProgressBar: true
        });

        fetchPaymentMethods();
      } catch (error) {
        console.error('Error deleting payment method:', error);
        
        Swal.fire({
          title: 'Error!',
          text: error.response?.data?.message || 'Failed to delete payment method',
          icon: 'error',
          confirmButtonColor: '#3085d6'
        });
      }
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const response = await axios.patch(
        `${base_url}/api/admin/payment-methods/${id}/status`,
        { isEnabled: !currentStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        Swal.fire('Success!', `Payment method ${!currentStatus ? 'enabled' : 'disabled'} successfully`, 'success');
        fetchPaymentMethods();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      Swal.fire('Error!', error.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  const StatusSwitch = ({ method }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={method.isEnabled}
        onChange={() => toggleStatus(method._id, method.isEnabled)}
        className="sr-only peer"
      />
      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer 
        ${method.isEnabled ? 'peer-checked:bg-blue-600' : ''} 
        peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
        after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}
      />
    </label>
  );

  const TypeBadge = ({ type }) => {
    const getTypeColor = () => {
      switch (type) {
        case 'regular':
          return 'bg-blue-100 text-blue-800';
        case 'fast':
          return 'bg-green-100 text-green-800';
        case 'nagad_free':
          return 'bg-purple-100 text-purple-800';
        case 'bank':
          return 'bg-orange-100 text-orange-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor()}`}>
        {type.replace('_', ' ')}
      </span>
    );
  };

  const CategoryBadge = ({ category }) => {
    const getCategoryColor = () => {
      switch (category) {
        case 'mobile':
          return 'bg-indigo-100 text-indigo-800';
        case 'bank':
          return 'bg-amber-100 text-amber-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor()}`}>
        {category}
      </span>
    );
  };

  return (
    <section className="font-nunito h-screen">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh] h-[90vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'ml-[17%]' : 'ml-0'
          }`}
        >
          <div className="bg-white rounded-lg shadow-sm py-4 px-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Payment Methods</h2>
              <div className="flex gap-2">
                <button 
                  onClick={fetchPaymentMethods}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <FaSync /> Refresh
                </button>
                <button 
                  onClick={() => {
                    setEditingMethod(null);
                    setFormData({
                      name: '',
                      name_bn: '',
                      image: '',
                      type: 'regular',
                      category: 'mobile',
                      minAmount: 100,
                      maxAmount: 30000,
                      isEnabled: true,
                      priority: 0
                    });
                    setShowForm(true);
                  }}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  <FaPlus /> Add New
                </button>
              </div>
            </div>

            {/* Payment Method Form */}
            {showForm && (
              <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">
                  {editingMethod ? 'Edit Payment Method' : 'Add New Payment Method'}
                </h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name (English)</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name (Bengali)</label>
                    <input
                      type="text"
                      name="name_bn"
                      value={formData.name_bn}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                    <input
                      type="url"
                      name="image"
                      value={formData.image}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="regular">Regular</option>
                      <option value="fast">Fast</option>
                      <option value="nagad_free">Nagad Free</option>
                      <option value="bank">Bank</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="mobile">Mobile</option>
                      <option value="bank">Bank</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Amount</label>
                    <input
                      type="number"
                      name="minAmount"
                      value={formData.minAmount}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Amount</label>
                    <input
                      type="number"
                      name="maxAmount"
                      value={formData.maxAmount}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <input
                      type="number"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="isEnabled"
                        checked={formData.isEnabled}
                        onChange={handleInputChange}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Enabled</span>
                    </label>
                  </div>
                  <div className="md:col-span-2 flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      {editingMethod ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Payment Methods Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">No payment methods found</p>
                </div>
              ) : (
                <div className="shadow border-b border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Bengali Name</th>
                        <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Amount Range</th>
                        <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paymentMethods.map((method) => (
                        <tr key={method._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img src={method.image} alt={method.name} className="h-8 w-8 mr-3 rounded" />
                              <span className="text-sm font-medium text-gray-900">{method.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {method.name_bn}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <TypeBadge type={method.type} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <CategoryBadge category={method.category} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {method.minAmount} - {method.maxAmount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {method.priority}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusSwitch method={method} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={() => editPaymentMethod(method)}
                                className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => deletePaymentMethod(method._id)}
                                className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                                title="Delete"
                              >
                                <FaTrashAlt />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </section>
  );
};

export default Paymentmethods;