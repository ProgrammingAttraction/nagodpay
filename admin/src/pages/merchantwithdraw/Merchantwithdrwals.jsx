import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, subDays } from 'date-fns';
import { FaEye, FaTrashAlt, FaEdit, FaSearch, FaSync } from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';

const MerchantWithdrawals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10
  });

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('authToken');

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, pagination.currentPage, pagination.limit]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
      };

      if (statusFilter !== 'All') {
        params.status = statusFilter;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await axios.get(`${base_url}/api/admin/withdraw-requests`, {
        params,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setRequests(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          totalPages: response.data.pagination.totalPages
        }));
      } else {
        setError(response.data.message || 'Failed to fetch requests');
        toast.error(response.data.message || 'Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching withdrawal requests:', error);
      setError(error.response?.data?.message || 'Failed to fetch withdrawal requests');
      toast.error(error.response?.data?.message || 'Failed to fetch withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const openEditModal = (request) => {
    setSelectedRequest(request);
    setIsEditModalOpen(true);
  };

  const updateStatus = async (newStatus) => {
    try {
      setIsEditModalOpen(false);
      setLoading(true);
      
      await axios.patch(
        `${base_url}/api/admin/withdraw-requests/${selectedRequest._id}/status`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      toast.success('Status updated successfully');
      fetchRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const deleteRequest = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Request',
      text: 'Are you sure you want to delete this withdrawal request?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${base_url}/api/admin/withdraw-requests/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        toast.success('Request deleted successfully');
        fetchRequests();
      } catch (error) {
        console.error('Error deleting request:', error);
        toast.error(error.response?.data?.message || 'Failed to delete request');
      }
    }
  };

  const StatusBadge = ({ status }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'approved':
          return 'bg-green-100 text-green-800';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800';
        case 'rejected':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    const getStatusText = () => {
      switch (status) {
        case 'approved': return 'Approved';
        case 'pending': return 'Pending';
        case 'rejected': return 'Rejected';
        default: return status;
      }
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>
    );
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      currentPage: newPage
    }));
  };

  const handleLimitChange = (e) => {
    setPagination(prev => ({
      ...prev,
      limit: Number(e.target.value),
      currentPage: 1
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchRequests();
  };

  return (
    <section className="font-nunito h-screen bg-gray-100">
      <Header toggleSidebar={toggleSidebar} />
      <Toaster />

      <div className="flex pt-[10vh] h-[90vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Merchant Withdrawal Requests</h2>
              <button 
                onClick={fetchRequests}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                <FaSync /> Refresh
              </button>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="All">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Items per page</label>
                  <select
                    value={pagination.limit}
                    onChange={handleLimitChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {[5, 10, 20, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        Show {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <form onSubmit={handleSearch} className="flex justify-between items-center">
                <div className="w-full md:w-1/3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search requests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                    />
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  </div>
                </div>
                <button
                  type="submit"
                  className="md:ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Requests Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
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
              ) : requests.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">No requests found</p>
                </div>
              ) : (
                <>
                  <table className="min-w-full divide-y divide-gray-200 border-[1px] border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Merchant</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {requests.map((request) => (
                        <tr key={request._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {request.merchant?.name || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.merchant?.email || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${request.amount?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {request.paymentMethod}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={request.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(request.createdAt), 'MMM dd, yyyy HH:mm')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => viewDetails(request)}
                                className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                title="View"
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => openEditModal(request)}
                                className="p-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => deleteRequest(request._id)}
                                className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600"
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

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{' '}
                        {Math.min(pagination.currentPage * pagination.limit, pagination.total)} of{' '}
                        {pagination.total} entries
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className="px-3 py-1 border rounded-md disabled:opacity-50"
                      >
                        <FiChevronLeft />
                      </button>
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="px-3 py-1 border rounded-md disabled:opacity-50"
                      >
                        <FiChevronRight />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Request Details Modal */}
          {isModalOpen && selectedRequest && (
            <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[1000]">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Withdrawal Request Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Request ID</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedRequest._id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Merchant</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedRequest.merchant?.name || 'N/A'} ({selectedRequest.merchant?.email || 'N/A'})
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Amount</label>
                      <p className="mt-1 text-sm text-gray-900">${selectedRequest.amount?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Payment Method</label>
                      <p className="mt-1 text-sm text-gray-900 capitalize">{selectedRequest.paymentMethod}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Status</label>
                      <p className="mt-1 text-sm text-gray-900 capitalize">
                        <StatusBadge status={selectedRequest.status} />
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Created At</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {format(new Date(selectedRequest.createdAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-500">Payment Details</label>
                      <pre className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded-md overflow-x-auto">
                        {JSON.stringify(selectedRequest.paymentDetails, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 flex justify-end">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Status Modal */}
          {isEditModalOpen && selectedRequest && (
            <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000]">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Update Withdrawal Status</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Current Status</label>
                      <p className="mt-1">
                        <StatusBadge status={selectedRequest.status} />
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">New Status</label>
                      <select
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                        defaultValue={selectedRequest.status}
                        onChange={(e) => updateStatus(e.target.value)}
                        disabled={loading}
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 flex justify-between">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    disabled={loading}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  {loading && (
                    <div className="flex items-center text-gray-500">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </section>
  );
};

export default MerchantWithdrawals;