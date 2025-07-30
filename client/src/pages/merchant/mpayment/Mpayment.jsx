import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from "../../../components/common/merchant/Merchantheader";
import Sidebar from '../../../components/common/merchant/Merchantsidebar';
import { format } from 'date-fns';
import { FaEye, FaPlus } from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';

const Mpayment = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    email: '',
    name: '',
    amount: '',
    provider: ''
  });
  
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('merchantToken');
  const merchantId = JSON.parse(localStorage.getItem('merchantData'));

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${base_url}/api/merchant/merchant-payment/${merchantId._id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      console.log(response)
      setRequests(response.data.payment || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payment requests:', error);
      setError('Failed to fetch payment requests');
      setLoading(false);
    }
  };

  const viewDetails = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const createNewRequest = async () => {
    try {
      if (!newRequest.email || !newRequest.name || !newRequest.amount || !newRequest.provider) {
        toast.error('Please fill all required fields');
        return;
      }

      await axios.post(
        `${base_url}/api/merchant/merchant-payment-request`,
        newRequest,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      toast.success('Payment request created successfully');
      fetchRequests();
      setIsCreateModalOpen(false);
      setNewRequest({
        email: '',
        name: '',
        amount: '',
        provider: ''
      });
    } catch (error) {
      console.error('Error creating payment request:', error);
      toast.error(error.response?.data?.message || 'Failed to create payment request');
    }
  };

  const handleNewRequestChange = (e) => {
    const { name, value } = e.target;
    setNewRequest(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const StatusBadge = ({ status }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'completed':
          return 'bg-green-100 text-green-800';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800';
        case 'rejected':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
        {status}
      </span>
    );
  };

  return (
    <section className="font-nunito h-screen font-fira">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh] h-[90vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'ml-[17%]' : 'ml-0'
          }`}
        >
          <div className="bg-white rounded-lg py-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">Payment Requests</h2>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 bg-blue-600 text-[15px] text-white px-4 py-2 rounded-[5px] cursor-pointer hover:bg-blue-700"
              >
                New Request
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <p>Loading...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-lg text-gray-600">No payment requests found</p>
         
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase">Provider</th>
                      <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map((request,i) => (
                      <tr key={request._id} className="hover:bg-gray-50">
                             <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {i+1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {request.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ৳{request.amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {request.provider}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={request.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => viewDetails(request)}
                            className="p-2 cursor-pointer border-blue-500 border-[1px] hover:bg-transparent hover:text-blue-500 transition-all duration-150 bg-blue-500 text-white rounded-md"
                            title="View"
                          >
                            <FaEye />
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

      {/* Request Details Modal */}
      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] bg-opacity-50 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Request Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-sm font-medium">{selectedRequest.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-sm font-medium">{selectedRequest.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="text-sm font-medium">{selectedRequest.amount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Provider</p>
                <p className="text-sm font-medium capitalize">{selectedRequest.provider}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-sm font-medium">{selectedRequest.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created At</p>
                <p className="text-sm font-medium">
                  {format(new Date(selectedRequest.createdAt), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Request Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] bg-opacity-50 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Create New Payment Request</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={newRequest.name}
                  onChange={handleNewRequestChange}
                  className="w-full outline-theme p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={newRequest.email}
                  onChange={handleNewRequestChange}
                  className="w-full p-2 outline-theme border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <input
                  type="number"
                  name="amount"
                  value={newRequest.amount}
                  onChange={handleNewRequestChange}
                  className="w-full p-2 outline-theme border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider *</label>
                <select
                  name="provider"
                  value={newRequest.provider}
                  onChange={handleNewRequestChange}
                  className="w-full p-2 border outline-theme border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Provider</option>
                  <option value="bank transfer">Bank Transfer</option>
                  <option value="bdt">BDT</option>
                  <option value="usdt">USDT</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 border cursor-pointer border-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={createNewRequest}
                className="px-4 py-2 bg-blue-600 cursor-pointer text-white rounded-md"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      <Toaster position="top-right" />
    </section>
  );
};

export default Mpayment;