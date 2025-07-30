import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaChevronDown, FaExclamationCircle } from 'react-icons/fa';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { useUser } from '../../context/UserContext';
import toast, { Toaster } from "react-hot-toast";

const Prepaymenthistory = () => {
  // State management
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    paymentMethod: '',
    amount: '',
    bank: '',
    note: '',
    startDate: '',
    endDate: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { userData } = useUser();
  const navigate = useNavigate();

  // Toggle sidebar
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  // Fetch requests when component mounts or filter changes
  useEffect(() => {
    fetchRequests();
  }, []); // Empty dependency array to run only on mount

  // Fetch requests with optional date filtering
  const fetchRequests = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('authToken');
    
    try {
      const params = {};
      if (formData.startDate) params.startDate = formData.startDate;
      if (formData.endDate) params.endDate = formData.endDate;

      const response = await axios.get(`${base_url}/api/user/my-requests/filter`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params
      });
      
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch requests');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
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

  // Handle filter submission
  const handleFilter = (e) => {
    e.preventDefault();
    fetchRequests();
  };

  // Form validation for payment request
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.paymentMethod) newErrors.paymentMethod = 'Payment method is required';
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(formData.amount)) {
      newErrors.amount = 'Amount must be a number';
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.bank) newErrors.bank = 'Channel is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle payment request submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    const token = localStorage.getItem('authToken');
    
    try {
      const requestData = {
        username: userData?.username,
        email: userData?.email,
        paymentMethod: formData.paymentMethod,
        currency: 'USD', // Assuming default currency
        currentBalance: userData?.balance || 0,
        requestAmount: parseFloat(formData.amount),
        paidAmount: 0, // Initially zero
        channel: formData.bank,
        note: formData.note,
        requestDate: new Date().toISOString(),
        updateDate: new Date().toISOString(),
        status: 'pending'
      };

      const response = await axios.post(`${base_url}/api/user/prepayment-request`, requestData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Prepayment request submitted successfully!');
      // Refresh the requests after submission
      fetchRequests();
      // Reset form fields except for dates
      setFormData(prev => ({
        ...prev,
        paymentMethod: prev.paymentMethod,
        amount: '',
        bank: '',
        note: ''
      }));
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error.response?.data?.error || 'Failed to submit prepayment request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Set user's default payment method if available
  useEffect(() => {
    if (userData?.paymentMethod) {
      setFormData(prev => ({
        ...prev,
        paymentMethod: userData.paymentMethod
      }));
    }
  }, [userData]);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Status badge styling
  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          {/* Title */}
          <h1 className="text-2xl font-semibold mb-6 text-gray-800">Prepayment History</h1>

    

          {/* Requests Filter Section */}
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-lg font-medium mb-4 text-gray-700">Request History</h2>
            
            <form onSubmit={handleFilter}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mb-4">
                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-600">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-theme"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-600">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 outline-theme"
                  />
                </div>

                {/* Filter Button */}
                <div className="md:col-span-2">
                  <button 
                    type="submit"
                    className="bg-theme text-white px-6 py-2 rounded-lg hover:bg-theme focus:outline-none focus:ring-2 focus:ring-theme focus:ring-offset-2 transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Filtering...' : 'Filter Requests'}
                  </button>
                </div>
              </div>
            </form>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-theme"></div>
                <p className="mt-2 text-gray-600">Loading requests...</p>
              </div>
            ) : requests.length === 0 ? (
              // Empty State
              <div className="mt-6 text-center py-8 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No prepayment requests</h3>
                <p className="mt-1 text-sm text-gray-500">Your submitted requests will appear here.</p>
              </div>
            ) : (
              // Requests Table
              <div className="overflow-x-auto mt-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map((request) => (
                      <tr key={request._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(request.requestDate)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.paymentMethod}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">৳{request.requestAmount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.channel}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{request.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </section>
  );
};

export default Prepaymenthistory;