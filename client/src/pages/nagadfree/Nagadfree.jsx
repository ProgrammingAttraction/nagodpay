import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { FaCalendarAlt, FaEye, FaCheck, FaSync, FaSearch, FaTimes,FaCopy  } from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import moment from 'moment';
import { RiShareForwardLine } from "react-icons/ri";
import Swal from 'sweetalert2';
import { MdOutlineContentCopy } from "react-icons/md";
const Nagadfree = () => {
  const merchantkey = "28915f245e5b2f4b7637";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [forwardLoading, setForwardLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [nagadFreeDeposits, setNagadFreeDeposits] = useState([]);
  const [filteredDeposits, setFilteredDeposits] = useState([]);
  const token = localStorage.getItem('authToken');
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const currentUser = JSON.parse(localStorage.getItem("userData"));
  const [order_id, setOrder_id] = useState("");

  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [currentDeposit, setCurrentDeposit] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [status, setStatus] = useState('pending');
  const [metadata, setMetadata] = useState('');

  // Add copy to clipboard function
  const copyToClipboard = (text) => {
    if (!text || text === 'N/A') return;
    
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success('Transaction ID copied to clipboard!');
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
        toast.error('Failed to copy to clipboard');
      });
  };

  const statusOptions = ['pending', 'completed'];

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const fetchNagadFreeDeposits = async () => {
    try {
      const response = await axios.get(`${base_url}/api/user/single-user/${currentUser._id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setUserData(response.data.user);
        const deposits = response.data.user.nagadFreeDeposits || [];
        console.log("deposits",deposits)
        // Sort deposits by date, newest first
        deposits.sort((a, b) => new Date(b.createdAt || b.statusDate) - new Date(a.createdAt || a.statusDate));
        setNagadFreeDeposits(deposits);
        setFilteredDeposits(deposits);
        setTotalPages(Math.ceil(deposits.length / limit));
      } else {
        toast.error(response.data.message || "Failed to fetch user data");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Error fetching user data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNagadFreeDeposits();
  }, [base_url, token, currentUser._id]);

  useEffect(() => {
    // Apply filters whenever filter states change
    let results = nagadFreeDeposits;
    
    if (statusFilter) {
      results = results.filter(deposit => deposit.status === statusFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(deposit => 
        deposit.orderId?.toLowerCase().includes(query) || 
        deposit.playerId?.toLowerCase().includes(query) ||
        (deposit.accountNumber && deposit.accountNumber.toLowerCase().includes(query)) ||
        deposit.amount?.toString().includes(query)
      );
    }
    
    setFilteredDeposits(results);
    setTotalPages(Math.ceil(results.length / limit));
    setCurrentPage(1); // Reset to first page when filters change
  }, [statusFilter, searchQuery, nagadFreeDeposits, limit]);

  const handleView = (deposit) => {
    Swal.fire({
      title: 'Deposit Details',
      html: `
        <div class="text-left">
          <p><strong>Order ID:</strong> ${deposit.orderId || 'N/A'}</p>
          <p><strong>Player ID:</strong> ${deposit.playerId}</p>
          <p><strong>Amount:</strong> ${deposit.amount} ${deposit.currency}</p>
          ${deposit.accountNumber ? `<p><strong>Account:</strong> ${deposit.accountNumber}</p>` : ''}
          <p><strong>Status:</strong> ${deposit.status}</p>
          <p><strong>Cash Desk Processed:</strong> ${deposit.cashdeskProcessed ? 'Yes' : 'No'}</p>
          <p><strong>Created:</strong> ${moment(deposit.createdAt || deposit.statusDate).format('DD MMM YYYY, h:mm A')}</p>
          ${deposit.transactionId ? `<p><strong>Transaction ID:</strong> ${deposit.transactionId}</p>` : ''}
          ${deposit.referenceNumber ? `<p><strong>Reference Number:</strong> ${deposit.referenceNumber}</p>` : ''}
          ${deposit.metadata ? `<p><strong>Metadata:</strong> ${deposit.metadata}</p>` : ''}
          ${deposit.cashdeskError ? `<p><strong>CashDesk Error:</strong> ${JSON.stringify(deposit.cashdeskError)}</p>` : ''}
        </div>
      `,
      icon: 'info'
    });
  };

  const openUpdateModal = (deposit) => {
    setCurrentDeposit(deposit);
    setTransactionId(deposit.transactionId || '');
    setReferenceNumber(deposit.referenceNumber || '');
    setStatus(deposit.status);
    setMetadata(deposit.metadata || '');
    setIsModalOpen(true);
    setOrder_id(deposit.orderId);
  };

  const openForwardModal = (deposit) => {
    setCurrentDeposit(deposit);
    setIsForwardModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsForwardModalOpen(false);
    setCurrentDeposit(null);
    setTransactionId('');
    setReferenceNumber('');
    setStatus('pending');
    setMetadata('');
  };

  const handleStatusUpdate = async () => {
    if (!currentDeposit) return;

    if (!status) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Status is required!',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.patch(
        `${base_url}/api/payment/nagad-free-deposits/${currentDeposit.orderId}/status`,
        {
          status: status,
          referenceNumber: referenceNumber,
          metadata: metadata,
          userid:userData._id
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'x-api-key': merchantkey,
          }
        }
      );

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Update Success',
          text: `${response.data.message}`,
        });
        fetchNagadFreeDeposits(); // Refresh data
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: `${response.data.message}`,
        });
      }
    } catch (error) {
      console.error("Error updating deposit:", error);
      
      // Handle CashDeskBot failure specifically
      if (error.response?.data?.success === false && error.response.data.error) {
        Swal.fire({
          icon: 'error',
          title: 'CashDesk Deposit Failed',
          html: `
            <p>${error.response.data.message}</p>
            <p class="mt-2 text-sm"><strong>Error:</strong> ${error.response.data.error}</p>
          `,
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: error.response?.data?.message || 'Error updating deposit status',
        });
      }
    } finally {
      setLoading(false);
      closeModal();
    }
  };

  const handleForwardDeposit = async () => {
    if (!currentDeposit) return;

    try {
      setForwardLoading(true);
      const response = await axios.post(
        `${base_url}/api/payment/forward-nagad-free-deposit`,
        {
          orderId: currentDeposit.orderId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Forward Success',
          html: `
            <p>${response.data.message}</p>
            <p><strong>New Agent:</strong> ${response.data.newAgent.username} (${response.data.newAgent.name})</p>
          `,
        });
        fetchNagadFreeDeposits(); // Refresh data
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Forward Failed',
          text: `${response.data.message}`,
        });
      }
    } catch (error) {
      console.error("Error forwarding deposit:", error);
      Swal.fire({
        icon: 'error',
        title: 'Forward Failed',
        text: error.response?.data?.message || 'Error forwarding deposit',
      });
    } finally {
      setForwardLoading(false);
      closeModal();
    }
  };

  const resetFilters = () => {
    setStatusFilter('');
    setSearchQuery('');
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const refreshData = () => {
    setLoading(true);
    fetchNagadFreeDeposits();
  };

  // Get current deposits based on pagination
  const indexOfLastDeposit = currentPage * limit;
  const indexOfFirstDeposit = indexOfLastDeposit - limit;
  const currentDeposits = filteredDeposits.slice(indexOfFirstDeposit, indexOfLastDeposit);

  // Check if action buttons should be shown
  const shouldShowActions = (deposit) => {
    return deposit.status !== 'completed' && deposit.status !== 'failed' && deposit.status !== 'cancelled';
  };

  return (
    <section className="flex h-screen font-fira overflow-hidden">
      <div className="shrink-0 h-screen overflow-y-auto bg-white border-r">
        <Sidebar isOpen={sidebarOpen} />
      </div>

      <section className="flex-1 w-full h-screen overflow-y-auto bg-gray-50">
        <Header toggleSidebar={toggleSidebar} />
        <div className="px-6 py-8">
          <Toaster />
          
          {/* Status Update Modal */}
          {isModalOpen && currentDeposit && (
            <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] bg-opacity-50 flex items-center justify-center z-[10000]">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center border-b p-4 border-gray-200">
                  <h3 className="text-lg font-semibold">Update Nagad Free Deposit</h3>
                  <button onClick={closeModal} className="text-gray-500 cursor-pointer hover:text-gray-700">
                    <FaTimes />
                  </button>
                </div>
                
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
                    <input
                      type="text"
                      value={currentDeposit.orderId || 'N/A'}
                      disabled
                      className="w-full p-2 border border-gray-300 bg-gray-100 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full p-2 border border-gray-300 outline-theme rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {statusOptions.map(option => (
                        <option key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Metadata</label>
                    <textarea
                      value={metadata}
                      onChange={(e) => setMetadata(e.target.value)}
                      className="w-full p-2 border border-gray-300 outline-theme rounded-md focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                      placeholder="Any metadata about this transaction..."
                    />
                  </div>
                  
                  {status === 'completed' && (
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                      <p className="text-yellow-800 text-sm">
                        <strong>Note:</strong> Setting status to "completed" will trigger CashDeskBot deposit processing. 
                        If CashDeskBot fails, the status will automatically be set to "failed".
                      </p>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 bg-gray-200 text-gray-700 cursor-pointer rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleStatusUpdate}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white cursor-pointer rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Updating...' : 'Update Status'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Forward Deposit Modal */}
          {isForwardModalOpen && currentDeposit && (
            <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] bg-opacity-50 flex items-center justify-center z-[10000]">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center border-b p-4 border-gray-200">
                  <h3 className="text-lg font-semibold">Forward Nagad Free Deposit</h3>
                  <button onClick={closeModal} className="text-gray-500 cursor-pointer hover:text-gray-700">
                    <FaTimes />
                  </button>
                </div>
                
                <div className="p-4 space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
                    <p className="text-yellow-800 text-sm">
                      Are you sure you want to forward this deposit to another agent? This action cannot be undone.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
                      <div className="p-2 bg-gray-100 rounded-md">{currentDeposit.orderId || 'N/A'}</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                      <div className="p-2 bg-gray-100 rounded-md">{currentDeposit.amount} {currentDeposit.currency}</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Player ID</label>
                      <div className="p-2 bg-gray-100 rounded-md">{currentDeposit.playerId}</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                      <div className="p-2 bg-gray-100 rounded-md">{currentDeposit.status}</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 bg-gray-200 text-gray-700 cursor-pointer rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleForwardDeposit}
                      disabled={forwardLoading}
                      className="px-4 py-2 bg-blue-600 text-white cursor-pointer rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {forwardLoading ? 'Forwarding...' : 'Confirm Forward'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-white rounded-lg border-[1px] border-gray-200 shadow-sm py-4 px-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Nagad Free Deposits</h2>
              <button 
                onClick={refreshData}
                disabled={loading}
                className="flex items-center gap-2 bg-green-600 cursor-pointer text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <FaSync /> Refresh
              </button>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-[14px] lg:text-[17px] font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md outline-theme"
                  >
                    <option value="">All Status</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[14px] lg:text-[17px] font-medium text-gray-700 mb-1">Items per page</label>
                  <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-md outline-theme"
                  >
                    {[5, 10, 20, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        Show {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="relative w-full md:w-1/3">
                  <input
                    type="text"
                    placeholder="Search by Order ID, Player ID, Account or Amount..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md outline-theme"
                  />
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                </div>
                
                <button
                  onClick={resetFilters}
                  className="ml-4 px-4 py-2 cursor-pointer bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            {/* Deposits Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : currentDeposits.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">No Nagad Free deposits found</p>
                </div>
              ) : (
                <>
                  <div className="border-[1px] border-gray-200 ">
                    <table className="min-w-full divide-y divide-gray-200 ">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-[14px] md:text-[15px] font-[600] text-gray-700 uppercase tracking-wider">Order ID</th>
                          <th scope="col" className="px-6 py-3 text-left text-[14px] md:text-[15px] font-[600] text-gray-700 uppercase tracking-wider">Player ID</th>
                          <th scope="col" className="px-6 py-3 text-left text-[14px] md:text-[15px] font-[600] text-gray-700 uppercase tracking-wider">Amount</th>
                          <th scope="col" className="px-6 py-3 text-left text-[14px] md:text-[15px] font-[600] text-gray-700 uppercase tracking-wider">TRX ID</th>
                          <th scope="col" className="px-6 py-3 text-left text-[14px] md:text-[15px] font-[600] text-gray-700 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-6 py-3 text-left text-[14px] md:text-[15px] font-[600] text-gray-700 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-6 py-3 text-left text-[14px] md:text-[15px] font-[600] text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentDeposits.map((deposit) => (
                          <tr key={deposit._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {deposit.orderId || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {deposit.playerId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {deposit.amount} {deposit.currency}
                            </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              {deposit.transactionId || "N/A"}
                              {deposit.transactionId && deposit.transactionId !== "N/A" && (
                                <button
                                  onClick={() => copyToClipboard(deposit.transactionId)}
                                  className="ml-2 p-1 text-gray-500 cursor-pointer hover:text-blue-500 transition-colors"
                                  title="Copy Transaction ID"
                                >
                                  <MdOutlineContentCopy size={18} />
                                </button>
                              )}
                            </div>
                          </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {moment(deposit.createdAt || deposit.statusDate).format('DD MMM YYYY, h:mm A')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${deposit.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                  deposit.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                  deposit.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                  deposit.status === 'failed' ? 'bg-red-100 text-red-800' :
                                  deposit.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                                  'bg-red-100 text-red-800'}`}>
                                {deposit.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleView(deposit)}
                                  className="p-2 bg-blue-500 cursor-pointer text-white rounded-md hover:bg-blue-600 transition-colors"
                                  title="View Details"
                                >
                                  <FaEye />
                                </button>
                                {shouldShowActions(deposit) && (
                                  <>
                                    <button
                                      onClick={() => openUpdateModal(deposit)}
                                      className="p-2 bg-green-500 cursor-pointer text-white rounded-md hover:bg-green-600 transition-colors"
                                      title="Update Status"
                                    >
                                      <FaCheck />
                                    </button>
                                    {deposit.status === 'pending' && (
                                      <button
                                        onClick={() => openForwardModal(deposit)}
                                        className="p-2 bg-purple-500 cursor-pointer text-white rounded-md hover:bg-purple-600 transition-colors"
                                        title="Forward Deposit"
                                      >
                                        <RiShareForwardLine />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4 py-3 bg-white border-gray-200 ">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to{' '}
                          <span className="font-medium">
                            {Math.min(currentPage * limit, filteredDeposits.length)}
                          </span>{' '}
                          of <span className="font-medium">{filteredDeposits.length}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 cursor-pointer py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                className={`relative inline-flex items-center cursor-pointer px-4 py-2 border text-sm font-medium ${
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
        </div>
      </section>
    </section>
  );
};

export default Nagadfree;