import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { FaEye, FaTrashAlt, FaEdit, FaSearch, FaFilter, FaSync, FaCalendarAlt } from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';

const Merchantpayment = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [displayedRequests, setDisplayedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({
    amount: '',
    note: '',
    status: ''
  });
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRequests, setTotalRequests] = useState(0);
  const [limit, setLimit] = useState(10);
  const [isSaving, setIsSaving] = useState(false);
  
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('authToken');

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, currentPage, limit]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      let url = `${base_url}/api/admin/merchant-payment?page=${currentPage}&limit=${limit}`;
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setRequests(response.data.data);
      setFilteredRequests(response.data.data);
      setTotalRequests(response.data.count);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching merchant payment requests:', error);
      setError('Failed to fetch payment requests');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Apply client-side filtering and pagination
    const filtered = filterRequests();
    setFilteredRequests(filtered);
    
    // Calculate pagination for client-side filtered results
    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    setDisplayedRequests(filtered.slice(startIndex, endIndex));
    
    // Update total pages based on filtered results
    setTotalPages(Math.ceil(filtered.length / limit));
  }, [requests, searchTerm, dateRange, currentPage, limit]);

  const filterRequests = () => {
    let filtered = [...requests];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(request => 
        (request.name?.toLowerCase().includes(term) || 
        (request.email?.toLowerCase().includes(term)) ||
        (request._id?.toLowerCase().includes(term)) ||
        (request.provider?.toLowerCase().includes(term))
      ));
    }
    
    if (statusFilter !== 'All') {
      filtered = filtered.filter(request => request.status === statusFilter.toLowerCase());
    }
    
    if (dateRange.start && dateRange.end) {
      const start = startOfDay(new Date(dateRange.start));
      const end = endOfDay(new Date(dateRange.end));
      
      filtered = filtered.filter(request => {
        const requestDate = new Date(request.createdAt);
        return requestDate >= start && requestDate <= end;
      });
    }
    
    return filtered;
  };

  const handleStatusChange = (request) => {
    setSelectedRequest(request);
    setEditData({
      amount: request.amount,
      note: request.note || '',
      status: request.status
    });
    setIsEditModalOpen(true);
  };

  const viewDetails = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const openEditModal = (request) => {
    setSelectedRequest(request);
    setEditData({
      amount: request.amount,
      note: request.note || '',
      status: request.status
    });
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const submitEdit = async () => {
    try {
      setIsSaving(true);
      
      if ((editData.status === 'completed' || editData.status === 'cancelled') && 
          selectedRequest.status !== editData.status) {
        const result = await Swal.fire({
          title: 'Confirm Status Change',
          text: `Are you sure you want to change the status to ${editData.status}?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Yes, update it!',
          cancelButtonText: 'Cancel',
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          reverseButtons: true,
          customClass: {
            popup: 'rounded-lg shadow-xl'
          }
        });

        if (!result.isConfirmed) {
          setIsSaving(false);
          return;
        }
      }

      const payload = {
        amount: editData.amount,
        note: editData.note,
        status: editData.status
      };

      await axios.patch(
        `${base_url}/api/admin/merchant-payment/${selectedRequest._id}/status`, 
        payload, 
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      toast.success('Request updated successfully');
      fetchRequests();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error(error.response?.data?.error || 'Failed to update request');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRequest = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Request',
      text: 'Are you sure you want to delete this payment request?',
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
          html: 'Please wait while we delete the request',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await axios.delete(
          `${base_url}/api/admin/merchant-payment/${id}`, 
          { 
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        await Swal.fire({
          title: 'Deleted!',
          text: 'The payment request has been deleted.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          timer: 2000,
          timerProgressBar: true
        });

        fetchRequests();
      } catch (error) {
        console.error('Error deleting request:', error);
        
        Swal.fire({
          title: 'Error!',
          text: error.response?.data?.error || 'Failed to delete request',
          icon: 'error',
          confirmButtonColor: '#3085d6'
        });
      }
    }
  };

  const handleDateChange = (e, type) => {
    setDateRange(prev => ({
      ...prev,
      [type]: new Date(e.target.value)
    }));
  };

  const resetDateFilter = () => {
    setDateRange({
      start: subDays(new Date(), 30),
      end: new Date()
    });
  };

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const StatusBadge = ({ status }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'completed':
          return 'bg-green-100 text-green-800';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800';
        case 'failed':
        case 'cancelled':
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
    <section className="font-nunito h-screen">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh] h-[90vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 p-2 md:p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'ml-[17%]' : 'ml-0'
          }`}
        >
          <div className="bg-white rounded-lg shadow-sm py-4 px-2 md:px-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[19px] md:text-2xl font-bold text-gray-800">Merchant Payment Requests</h2>
              <button 
                onClick={fetchRequests}
                className="flex items-center cursor-pointer gap-2 md:text-[15px] text-[13px] bg-blue-600 text-white px-3 md:px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
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
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md text-[14px] md:text-[15px] focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="All">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[14px] md:text-[15px] bg-white border border-gray-300 rounded-md text-left"
                    >
                      <FaCalendarAlt className="text-gray-400" />
                      <span>
                        {format(dateRange.start, 'MMM dd')} - {format(dateRange.end, 'MMM dd')}
                      </span>
                    </button>
                    
                    {showDatePicker && (
                      <div className="absolute z-10 mt-1 bg-white border text-[14px] md:text-[15px] border-gray-300 rounded-md shadow-lg p-4 w-full">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                            <input
                              type="date"
                              value={dateRange.start ? format(dateRange.start, 'yyyy-MM-dd') : ''}
                              onChange={(e) => handleDateChange(e, 'start')}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                            <input
                              type="date"
                              value={dateRange.end ? format(dateRange.end, 'yyyy-MM-dd') : ''}
                              onChange={(e) => handleDateChange(e, 'end')}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div className="flex justify-between">
                            <button
                              onClick={resetDateFilter}
                              className="px-3 py-1 text-sm cursor-pointer text-blue-600 hover:text-blue-800"
                            >
                              Reset
                            </button>
                            <button
                              onClick={() => setShowDatePicker(false)}
                              className="px-3 py-1 text-sm bg-blue-600 cursor-pointer text-white rounded-md hover:bg-blue-700"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className='w-full text-[14px] md:text-[15px]'>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Items per page</label>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="p-2 border w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[5, 10, 20, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        Show {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-between gap-[10px] items-center md:flex-row flex-col w-full">
                <div className="md:col-span-2 w-full md:w-1/3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search requests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  </div>
                </div>
                <button
                  onClick={() => {
                    setStatusFilter('All');
                    setSearchTerm('');
                    setDateRange({
                      start: subDays(new Date(), 30),
                      end: new Date()
                    });
                    setCurrentPage(1);
                  }}
                  className="md:ml-4 px-4 py-2 w-full md:w-auto cursor-pointer bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            {/* Requests Table */}
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
              ) : displayedRequests.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">No requests found</p>
                </div>
              ) : (
                <>
                  <div className="border-[1px] border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-[12px] md:text-sm md:font-[700] text-gray-700 uppercase tracking-wider">Merchant</th>
                          <th className="px-6 py-3 text-left text-[12px] md:text-sm md:font-[700] text-gray-700 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-[12px] md:text-sm md:font-[700] text-gray-700 uppercase tracking-wider">Provider</th>
                          <th className="px-6 py-3 text-left text-[12px] md:text-sm md:font-[700] text-gray-700 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-[12px] md:text-sm md:font-[700] text-gray-700 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-[12px] md:text-sm md:font-[700] text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {displayedRequests.map((request) => (
                          <tr key={request._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {request.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {request.amount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                              {request.provider}
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
                                  className="p-2 bg-blue-500 cursor-pointer text-white rounded-md transition-colors"
                                  title="View"
                                >
                                  <FaEye />
                                </button>
                                {request.status !== 'completed' && request.status !== 'cancelled' && (
                                  <button
                                    onClick={() => openEditModal(request)}
                                    className="p-2 bg-yellow-500 text-white rounded-md cursor-pointer transition-colors"
                                    title="Edit"
                                  >
                                    <FaEdit />
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteRequest(request._id)}
                                  className="p-2 bg-red-500 text-white rounded-md cursor-pointer transition-colors"
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

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4 py-3 bg-white border-t border-gray-200">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to{' '}
                          <span className="font-medium">
                            {Math.min(currentPage * limit, filteredRequests.length)}
                          </span>{' '}
                          of <span className="font-medium">{filteredRequests.length}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center cursor-pointer px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Previous</span>
                            <FiChevronLeft className="h-5 w-5" />
                          </button>
                          
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`relative inline-flex cursor-pointer items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === pageNum
                                    ? 'z-10 bg-blue-500 border-blue-500 text-white'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center cursor-pointer px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Next</span>
                            <FiChevronRight className="h-5 w-5" />
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Request Details Modal */}
      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-[10000] bg-[rgba(0,0,0,0.5)]">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Request Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Request ID</label>
                        <p className="mt-1 text-sm text-gray-900 break-all">{selectedRequest._id}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Merchant Name</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRequest.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Email</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRequest.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Amount</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRequest.amount}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Payment Provider</label>
                        <p className="mt-1 text-sm text-gray-900 capitalize">{selectedRequest.provider}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Status</label>
                        <p className="mt-1 text-sm text-gray-900 capitalize">{selectedRequest.status}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Created At</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {format(new Date(selectedRequest.createdAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {format(new Date(selectedRequest.updatedAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full inline-flex justify-center cursor-pointer rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Request Modal */}
      {isEditModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-[100]">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Update Request</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Amount</label>
                        <input
                          type="number"
                          name="amount"
                          value={editData.amount}
                          onChange={handleEditChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                          name="status"
                          value={editData.status}
                          onChange={handleEditChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="failed">Failed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Note</label>
                        <textarea
                          name="note"
                          value={editData.note}
                          onChange={handleEditChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          rows="3"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={submitEdit}
                  disabled={isSaving}
                  className={`w-full inline-flex justify-center rounded-md border cursor-pointer border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm ${
                    isSaving ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSaving}
                  className={`mt-3 w-full inline-flex justify-center rounded-md border cursor-pointer border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm ${
                    isSaving ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Merchantpayment;