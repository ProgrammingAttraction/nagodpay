import React, { useState, useEffect } from 'react';
import Header from "../../components/Header";
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaEye, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaSearch, FaTimes } from 'react-icons/fa';
import { NavLink } from "react-router-dom";

const Userlist = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: '',
    status: ''
  });

  // Status change form state
  const [statusFormData, setStatusFormData] = useState({
    withdrawCommission: '',
    depositCommission: '',
    paymentMethod: [],
    paymentBrand: '',
    status: ''
  });

  const [statusFormErrors, setStatusFormErrors] = useState({
    withdrawCommission: '',
    depositCommission: '',
    paymentMethod: '',
    paymentBrand: ''
  });

  // Payment methods and brands
  const paymentMethods = ['Bkash P2C', 'Nagad P2C', 'Bkash P2P', 'Nagad P2P'];
  const paymentBrands = {
    'Bkash P2C': ['bKash', 'Nagad', 'Rocket', 'Upay'],
    'Nagad P2C': ['bKash', 'Nagad', 'Rocket', 'Upay'],
    'Bkash P2P': ['bKash', 'Nagad', 'Rocket', 'Upay'],
    'Nagad P2P': ['bKash', 'Nagad', 'Rocket', 'Upay'],
  };

  // Get token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('authToken');
  };

  // Axios instance with authorization header
  const api = axios.create({
    baseURL: base_url,
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Fetch users based on active tab
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        let endpoint = '/api/admin/users';
        
        if (activeTab === 'active') {
          endpoint = '/api/admin/users/active';
        } else if (activeTab === 'inactive') {
          endpoint = '/api/admin/users/inactive';
        }

        const response = await api.get(endpoint);
        setUsers(response.data.data || response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setLoading(false);
        
        if (error.response?.status === 401) {
          Swal.fire({
            icon: 'error',
            title: 'Session Expired',
            text: 'Please login again',
          }).then(() => {
            localStorage.removeItem('token');
            window.location.href = '/login';
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to fetch users',
          });
        }
      }
    };

    fetchUsers();
  }, [activeTab]);

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Open status change modal
  const openStatusModal = (userId, currentStatus) => {
    const user = users.find(u => u._id === userId);
    if (!user) return;

    setSelectedUser(user);
    
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    setStatusFormData({
      withdrawCommission: user.withdracommission || '',
      depositCommission: user.depositcommission || '',
      paymentMethod: Array.isArray(user.paymentMethod) ? user.paymentMethod : [],
      paymentBrand: user.paymentbrand || '',
      status: newStatus
    });
    
    setStatusFormErrors({
      withdrawCommission: '',
      depositCommission: '',
      paymentMethod: '',
      paymentBrand: ''
    });
    
    setIsStatusModalOpen(true);
  };

  // Handle status form change
  const handleStatusFormChange = (e) => {
    const { name, value } = e.target;
    
    setStatusFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field changes
    if (statusFormErrors[name]) {
      setStatusFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle payment method checkbox change
  const handlePaymentMethodChange = (method, isChecked) => {
    setStatusFormData(prev => {
      const newMethods = isChecked
        ? [...prev.paymentMethod, method]
        : prev.paymentMethod.filter(m => m !== method);
      
      return {
        ...prev,
        paymentMethod: newMethods
      };
    });

    // Clear error when field changes
    if (statusFormErrors.paymentMethod) {
      setStatusFormErrors(prev => ({
        ...prev,
        paymentMethod: ''
      }));
    }
  };

  // Validate status form
  const validateStatusForm = () => {
    let valid = true;
    const newErrors = {
      withdrawCommission: '',
      depositCommission: '',
      paymentMethod: '',
      paymentBrand: ''
    };
    
    // Validate withdraw commission
    if (!statusFormData.withdrawCommission) {
      newErrors.withdrawCommission = 'Withdraw commission is required';
      valid = false;
    } else if (isNaN(statusFormData.withdrawCommission)) {
      newErrors.withdrawCommission = 'Must be a number';
      valid = false;
    } else if (parseFloat(statusFormData.withdrawCommission) < 0) {
      newErrors.withdrawCommission = 'Cannot be negative';
      valid = false;
    } else if (parseFloat(statusFormData.withdrawCommission) > 100) {
      newErrors.withdrawCommission = 'Cannot exceed 100%';
      valid = false;
    }
    
    // Validate deposit commission
    if (!statusFormData.depositCommission) {
      newErrors.depositCommission = 'Deposit commission is required';
      valid = false;
    } else if (isNaN(statusFormData.depositCommission)) {
      newErrors.depositCommission = 'Must be a number';
      valid = false;
    } else if (parseFloat(statusFormData.depositCommission) < 0) {
      newErrors.depositCommission = 'Cannot be negative';
      valid = false;
    } else if (parseFloat(statusFormData.depositCommission) > 100) {
      newErrors.depositCommission = 'Cannot exceed 100%';
      valid = false;
    }
    
    // Validate at least one payment method is selected
    if (statusFormData.paymentMethod.length === 0) {
      newErrors.paymentMethod = 'At least one payment method is required';
      valid = false;
    }
    
    // Validate payment brand
    if (!statusFormData.paymentBrand) {
      newErrors.paymentBrand = 'Payment brand is required';
      valid = false;
    }
    
    setStatusFormErrors(newErrors);
    return valid;
  };

  // Submit status change
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStatusForm()) return;
    
    try {
      // First update the status
      await api.patch(`/api/admin/users/${selectedUser._id}/status`, {
        status: statusFormData.status
      });
      
      // Then update the commission and payment info
      await api.put(`/api/admin/users-commissions/${selectedUser._id}`, {
        withdracommission: statusFormData.withdrawCommission,
        depositcommission: statusFormData.depositCommission,
        paymentMethod: statusFormData.paymentMethod,
        paymentBrand: statusFormData.paymentBrand
      });
      
      // Update local state
      setUsers(users.map(user => 
        user._id === selectedUser._id ? { 
          ...user, 
          status: statusFormData.status,
          withdracommission: statusFormData.withdrawCommission,
          depositcommission: statusFormData.depositCommission,
          paymentMethod: statusFormData.paymentMethod,
          paymentbrand: statusFormData.paymentBrand
        } : user
      ));
      
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: `User status and commission updated to ${statusFormData.status}`,
      });
      
      setIsStatusModalOpen(false);
    } catch (error) {
      console.error('Error updating user status:', error);
      
      if (error.response?.status === 401) {
        Swal.fire({
          icon: 'error',
          title: 'Session Expired',
          text: 'Please login again',
        }).then(() => {
          localStorage.removeItem('token');
          window.location.href = '/login';
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to update user status and commission',
        });
      }
    }
  };

  // Handle edit user
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    });
    setIsEditModalOpen(true);
  };

  // Handle edit form change
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit edit form
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/admin/users/${selectedUser._id}`, editFormData);
      
      setUsers(users.map(user => 
        user._id === selectedUser._id ? { ...user, ...editFormData } : user
      ));
      
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'User updated successfully',
      });
      
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating user:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update user',
      });
    }
  };

  // Handle delete user
  const handleDeleteUser = (userId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/api/admin/users/${userId}`);
          
          setUsers(users.filter(user => user._id !== userId));
          
          Swal.fire(
            'Deleted!',
            'User has been deleted.',
            'success'
          );
        } catch (error) {
          console.error('Error deleting user:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to delete user',
          });
        }
      }
    });
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <section className="font-nunito h-screen bg-gray-50">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh] h-[90vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main className={`transition-all duration-300 flex-1 p-2 md:p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
          <div className="bg-white md:rounded-xl shadow-sm p-2 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h1 className="text-[19px] md:text-2xl font-bold text-gray-800">Agent Management</h1>
              
              <div className="relative mt-4 md:mt-0">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search users..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-blue-500 w-full md:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <FaTimes className="text-gray-400 cursor-pointer hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex mb-6">
              <button
                className={`px-4 py-2 font-medium text-sm cursor-pointer ${activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('all')}
              >
                All Agents
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm cursor-pointer ${activeTab === 'active' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('active')}
              >
                Active Agents
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm cursor-pointer ${activeTab === 'inactive' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('inactive')}
              >
                Inactive Agents
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 text-nowrap ">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-[600] text-gray-500 uppercase tracking-wider">Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-[600] text-gray-500 uppercase tracking-wider">Balance</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-[600] text-gray-500 uppercase tracking-wider">Total Wallet</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-[600] text-gray-500 uppercase tracking-wider">Withdraw Commissions</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-[600] text-gray-500 uppercase tracking-wider">Deposit Commissions</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-[600] text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-[600] text-gray-500 uppercase tracking-wider">Joined</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-[600] text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => {
                        const firstLetter = user.name.charAt(0).toUpperCase();
                        
                        const getBackgroundColor = (letter) => {
                          const charCode = letter.charCodeAt(0);
                          if (charCode >= 65 && charCode <= 70) return 'bg-blue-600 text-white';
                          if (charCode >= 71 && charCode <= 75) return 'bg-green-600 text-white';
                          if (charCode >= 76 && charCode <= 80) return 'bg-purple-600 text-white';
                          if (charCode >= 81 && charCode <= 85) return 'bg-orange-600 text-white';
                          if (charCode >= 86 && charCode <= 90) return 'bg-pink-600 text-white';
                          return 'bg-gray-100 text-gray-600';
                        };
                        
                        const avatarClass = `flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center font-semibold ${getBackgroundColor(firstLetter)}`;
                        
                        return (
                          <tr key={user._id} className="hover:bg-gray-50 text-[15px] font-[600] transition-colors">
                            <td className="px-6 py-4 text-nowrap">
                              <div className="flex items-center">
                                <div className={avatarClass}>
                                  {firstLetter}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                  <div className="text-sm text-gray-500">@{user.username}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">৳{user.balance}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.totalwallet}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.withdracommission}%</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.depositcommission}%</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={user.status === 'active'}
                                  onChange={() => openStatusModal(user._id, user.status)}
                                  className="sr-only peer"
                                />
                                <div className={`w-11 h-6 rounded-full peer ${user.status === 'active' ? 'bg-blue-600' : 'bg-gray-300'} peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
                                <span className="ml-2 text-sm font-medium text-gray-700 capitalize">
                                  {user.status}
                                </span>
                              </label>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(user.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <NavLink to={`/dashboard/view-agents/${user._id}`}>
                                  <button
                                    className="p-2 text-white cursor-pointer bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    title="View"
                                  >
                                    <FaEye className="w-4 h-4" />
                                  </button>
                                </NavLink>
                                <NavLink to={`/dashboard/edit-agents/${user._id}`}>
                                  <button
                                    className="p-2 text-white cursor-pointer bg-yellow-600 rounded-lg hover:bg-yellow-700 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                                    title="Edit"
                                  >
                                    <FaEdit className="w-4 h-4" />
                                  </button>
                                </NavLink>
                                <button
                                  onClick={() => handleDeleteUser(user._id)}
                                  className="p-2 text-white bg-red-600 cursor-pointer rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                  title="Delete"
                                >
                                  <FaTrash className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                          {searchTerm ? 'No matching users found' : 'No users available'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Status Change Modal */}
      {isStatusModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] bg-opacity-50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  {statusFormData.status === 'active' ? 'Activate' : 'Deactivate'} User
                </h2>
                <button
                  onClick={() => setIsStatusModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleStatusSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Withdraw Commission (%)
                    </label>
                    <input
                      type="text"
                      name="withdrawCommission"
                      value={statusFormData.withdrawCommission}
                      onChange={handleStatusFormChange}
                      className={`w-full p-2 border outline-blue-500 ${statusFormErrors.withdrawCommission ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
                      placeholder="Enter withdraw commission"
                    />
                    {statusFormErrors.withdrawCommission && (
                      <p className="mt-1 text-sm text-red-600">{statusFormErrors.withdrawCommission}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deposit Commission (%)
                    </label>
                    <input
                      type="text"
                      name="depositCommission"
                      value={statusFormData.depositCommission}
                      onChange={handleStatusFormChange}
                      className={`w-full p-2 border outline-blue-500 ${statusFormErrors.depositCommission ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
                      placeholder="Enter deposit commission"
                    />
                    {statusFormErrors.depositCommission && (
                      <p className="mt-1 text-sm text-red-600">{statusFormErrors.depositCommission}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Methods
                    </label>
                    <div className="space-y-2">
                      {paymentMethods.map(method => (
                        <div key={method} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`method-${method}`}
                            checked={statusFormData.paymentMethod.includes(method)}
                            onChange={(e) => handlePaymentMethodChange(method, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor={`method-${method}`} className="ml-2 block text-sm text-gray-700">
                            {method}
                          </label>
                        </div>
                      ))}
                    </div>
                    {statusFormErrors.paymentMethod && (
                      <p className="mt-1 text-sm text-red-600">{statusFormErrors.paymentMethod}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Brand
                    </label>
                    <select
                      name="paymentBrand"
                      value={statusFormData.paymentBrand}
                      onChange={handleStatusFormChange}
                      className={`w-full p-2 border outline-blue-500 ${statusFormErrors.paymentBrand ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
                      disabled={statusFormData.paymentMethod.length === 0}
                    >
                      <option value="">Select Payment Brand</option>
                      {statusFormData.paymentMethod.length > 0 && 
                        paymentBrands[statusFormData.paymentMethod[0]]?.map(brand => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))
                      }
                    </select>
                    {statusFormErrors.paymentBrand && (
                      <p className="mt-1 text-sm text-red-600">{statusFormErrors.paymentBrand}</p>
                    )}
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <div className={`p-2 rounded-lg border ${statusFormData.status === 'active' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                      {statusFormData.status}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsStatusModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 cursor-pointer text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                  >
                    {statusFormData.status === 'active' ? 'Activate' : 'Deactivate'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Userlist;