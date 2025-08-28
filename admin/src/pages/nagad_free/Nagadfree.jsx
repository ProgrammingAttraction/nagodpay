import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { format, parseISO, isAfter, isBefore, isEqual } from 'date-fns';
import { FaEye, FaTrashAlt, FaFilter, FaSearch, FaSync, FaMoneyBillWave, FaPhoneAlt } from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import toast, { Toaster } from 'react-hot-toast';

const Nagadfree = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('authToken');
  
  // Status badge component
  const StatusBadge = ({ status }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'completed':
          return 'bg-green-100 text-green-800';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800';
        case 'processing':
          return 'bg-blue-100 text-blue-800';
        case 'failed':
          return 'bg-red-100 text-red-800';
        case 'cancelled':
          return 'bg-gray-100 text-gray-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Modal component
  const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    if (!isOpen) return null;

    const sizeClasses = {
      sm: 'sm:max-w-sm',
      md: 'sm:max-w-lg',
      lg: 'sm:max-w-2xl',
      xl: 'sm:max-w-4xl'
    };

    return (
      <div className="fixed inset-0 z-[1000] bg-[rgba(0,0,0,0.5)] overflow-y-auto">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          
          <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${sizeClasses[size]} w-full`}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">{title}</h3>
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // State for deposits and UI
  const [allDeposits, setAllDeposits] = useState([]);
  const [filteredDeposits, setFilteredDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [limit, setLimit] = useState(10);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [playerIdFilter, setPlayerIdFilter] = useState('');
  const [accountNumberFilter, setAccountNumberFilter] = useState('');
  const [orderIdFilter, setOrderIdFilter] = useState('');
  const [amountMinFilter, setAmountMinFilter] = useState('');
  const [amountMaxFilter, setAmountMaxFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentDeposit, setCurrentDeposit] = useState(null);
  
  // Status update form state
  const [statusUpdate, setStatusUpdate] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');

  // Create deposit form state
  const [newDeposit, setNewDeposit] = useState({
    playerId: '',
    amount: '',
    accountNumber: '',
    orderId: '',
    currency: 'BDT'
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Fetch all deposits
  const fetchDeposits = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(`${base_url}/api/payment/nagad-free-deposits`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setAllDeposits(response.data.data);
      setFilteredDeposits(response.data.data);
      setTotalPages(Math.ceil(response.data.data.length / limit));
      setTotalDeposits(response.data.data.length);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      toast.error('Failed to fetch deposits');
    } finally {
      setLoading(false);
    }
  };

  // Fetch single deposit
  const fetchDeposit = async (id) => {
    try {
      const response = await axios.get(`${base_url}/api/payment/nagad-free-deposits/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data.data;
    } catch (err) {
      toast.error('Failed to fetch deposit details');
      throw err;
    }
  };

  // Update deposit status
  const updateDepositStatus = async (id, data) => {
    try {
      const response = await axios.patch(`${base_url}/api/payment/nagad-free-deposits/${id}/status`, data, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success('Deposit status updated successfully');
      fetchDeposits();
      return response.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update deposit status');
      throw err;
    }
  };

  // Create new deposit
  const createDeposit = async (data) => {
    try {
      const response = await axios.post(`${base_url}/api/payment/nagad-free-deposit`, data, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success('Nagad Free deposit created successfully');
      fetchDeposits();
      return response.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create deposit');
      throw err;
    }
  };

  // Delete deposit
  const deleteDeposit = async (id) => {
    try {
      await axios.delete(`${base_url}/api/payment/nagad-free-deposits/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success('Deposit deleted successfully');
      fetchDeposits();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete deposit');
      throw err;
    }
  };

  // Handle view deposit
  const handleView = async (id) => {
    try {
      const deposit = await fetchDeposit(id);
      setCurrentDeposit(deposit);
      setShowViewModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle status change
  const handleStatusChange = (deposit) => {
    setCurrentDeposit(deposit);
    setStatusUpdate(deposit.status);
    setTransactionId(deposit.transactionId || '');
    setReferenceNumber(deposit.referenceNumber || '');
    setShowStatusModal(true);
  };

  // Handle delete confirmation
  const handleDelete = (deposit) => {
    setCurrentDeposit(deposit);
    setShowDeleteModal(true);
  };

  // Handle status update submission
  const handleStatusUpdate = async () => {
    try {
      const updateData = {
        status: statusUpdate
      };
      
      if (transactionId) updateData.transactionId = transactionId;
      if (referenceNumber) updateData.referenceNumber = referenceNumber;
      
      await updateDepositStatus(currentDeposit._id, updateData);
      setShowStatusModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle create deposit submission
  const handleCreateDeposit = async () => {
    try {
      await createDeposit(newDeposit);
      setShowCreateModal(false);
      setNewDeposit({
        playerId: '',
        amount: '',
        accountNumber: '',
        orderId: '',
        currency: 'BDT'
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setStatusFilter('');
    setPlayerIdFilter('');
    setAccountNumberFilter('');
    setOrderIdFilter('');
    setAmountMinFilter('');
    setAmountMaxFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setSearchQuery('');
    setCurrentPage(1);
    setFilteredDeposits(allDeposits);
  };

  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1);
    
    let filtered = [...allDeposits];
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(deposit => deposit.status === statusFilter);
    }
    
    // Apply player ID filter
    if (playerIdFilter) {
      filtered = filtered.filter(deposit => 
        deposit.playerId.toLowerCase().includes(playerIdFilter.toLowerCase())
      );
    }
    
    // Apply account number filter
    if (accountNumberFilter) {
      filtered = filtered.filter(deposit => 
        deposit.accountNumber.toLowerCase().includes(accountNumberFilter.toLowerCase())
      );
    }
    
    // Apply order ID filter
    if (orderIdFilter) {
      filtered = filtered.filter(deposit => 
        deposit.orderId.toLowerCase().includes(orderIdFilter.toLowerCase())
      );
    }
    
    // Apply amount range filter
    if (amountMinFilter) {
      filtered = filtered.filter(deposit => deposit.amount >= parseFloat(amountMinFilter));
    }
    
    if (amountMaxFilter) {
      filtered = filtered.filter(deposit => deposit.amount <= parseFloat(amountMaxFilter));
    }
    
    // Apply date range filter
    if (dateFromFilter) {
      const fromDate = new Date(dateFromFilter);
      filtered = filtered.filter(deposit => 
        isAfter(parseISO(deposit.createdAt), fromDate) || isEqual(parseISO(deposit.createdAt), fromDate)
      );
    }
    
    if (dateToFilter) {
      const toDate = new Date(dateToFilter);
      toDate.setHours(23, 59, 59, 999); // Set to end of day
      filtered = filtered.filter(deposit => 
        isBefore(parseISO(deposit.createdAt), toDate) || isEqual(parseISO(deposit.createdAt), toDate)
      );
    }
    
    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(deposit => 
        deposit.orderId.toLowerCase().includes(searchQuery.toLowerCase()) || 
        deposit.accountNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deposit.playerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deposit.amount.toString().includes(searchQuery) ||
        (deposit.transactionId && deposit.transactionId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (deposit.referenceNumber && deposit.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    setFilteredDeposits(filtered);
    setTotalPages(Math.ceil(filtered.length / limit));
    setTotalDeposits(filtered.length);
  };

  // Fetch deposits on component mount
  useEffect(() => {
    fetchDeposits();
  }, []);

  // Apply filters when any filter changes
  useEffect(() => {
    applyFilters();
  }, [
    statusFilter, 
    playerIdFilter, 
    accountNumberFilter, 
    orderIdFilter, 
    amountMinFilter, 
    amountMaxFilter, 
    dateFromFilter, 
    dateToFilter, 
    searchQuery,
    allDeposits
  ]);

  // Status options for dropdown
  const statusOptions = ['pending', 'processing', 'completed', 'failed', 'cancelled'];

  // Get paginated deposits
  const getPaginatedDeposits = () => {
    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredDeposits.slice(startIndex, endIndex);
  };

  return (
    <section className="font-nunito h-screen">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh] h-[90vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all w-full duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'ml-[17%]' : 'ml-0'
          }`}
        >
          <div className=" rounded-lg  py-4 px-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                Nagad Free Deposits
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={fetchDeposits}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <FaSync /> Refresh
                </button>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm">Total Deposits</p>
                    <p className="text-2xl font-bold">{allDeposits.length}</p>
                  </div>
                  <FaMoneyBillWave className="text-2xl opacity-75" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm">Pending</p>
                    <p className="text-2xl font-bold">
                      {allDeposits.filter(d => d.status === 'pending').length}
                    </p>
                  </div>
                  <FaSync className="text-2xl opacity-75" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm">Completed</p>
                    <p className="text-2xl font-bold">
                      {allDeposits.filter(d => d.status === 'completed').length}
                    </p>
                  </div>
                  <FaMoneyBillWave className="text-2xl opacity-75" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm">Failed</p>
                    <p className="text-2xl font-bold">
                      {allDeposits.filter(d => d.status === 'failed').length}
                    </p>
                  </div>
                  <FaMoneyBillWave className="text-2xl opacity-75" />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Player ID</label>
                  <input
                    type="text"
                    value={playerIdFilter}
                    onChange={(e) => setPlayerIdFilter(e.target.value)}
                    placeholder="Filter by Player ID"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={accountNumberFilter}
                    onChange={(e) => setAccountNumberFilter(e.target.value)}
                    placeholder="Filter by Account Number"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
                  <input
                    type="text"
                    value={orderIdFilter}
                    onChange={(e) => setOrderIdFilter(e.target.value)}
                    placeholder="Filter by Order ID"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
                  <input
                    type="number"
                    value={amountMinFilter}
                    onChange={(e) => setAmountMinFilter(e.target.value)}
                    placeholder="Min amount"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
                  <input
                    type="number"
                    value={amountMaxFilter}
                    onChange={(e) => setAmountMaxFilter(e.target.value)}
                    placeholder="Max amount"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={resetFilters}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search deposits by Order ID, Account Number, Player ID, Amount..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Items per page</label>
                  <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[5, 10, 20, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        Show {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Deposits Table */}
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
              ) : filteredDeposits.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">No Nagad Free deposits found</p>
                </div>
              ) : (
                <>
                  <div className="shadow border-b border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player ID</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nagad Account</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getPaginatedDeposits().map((deposit) => (
                          <tr key={deposit._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {deposit.orderId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {deposit.playerId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {deposit.amount} {deposit.currency}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                              <FaPhoneAlt className="mr-1 text-blue-500" />
                              {deposit.accountNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge status={deposit.status} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {format(parseISO(deposit.createdAt), 'MMM dd, yyyy HH:mm')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleView(deposit._id)}
                                  className="p-2 bg-blue-500 cursor-pointer text-white rounded-md hover:bg-blue-600 transition-colors"
                                  title="View"
                                >
                                  <FaEye />
                                </button>
                                <button
                                  onClick={() => handleStatusChange(deposit)}
                                  className="p-2 bg-purple-500 cursor-pointer text-white rounded-md hover:bg-purple-600 transition-colors"
                                  title="Change Status"
                                >
                                  <FaFilter />
                                </button>
                                <button
                                  onClick={() => handleDelete(deposit)}
                                  disabled={deposit.status === 'completed'}
                                  className={`p-2 cursor-pointer text-white rounded-md transition-colors ${
                                    deposit.status === 'completed' 
                                      ? 'bg-gray-400 cursor-not-allowed' 
                                      : 'bg-red-500 hover:bg-red-600'
                                  }`}
                                  title={deposit.status === 'completed' ? 'Cannot delete completed deposits' : 'Delete'}
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
                  <div className="flex items-center justify-between mt-4 px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
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
        </main>
      </div>

      {/* View Modal */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Nagad Free Deposit Details">
        {currentDeposit && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Order ID</label>
                <p className="mt-1 text-sm text-gray-900">{currentDeposit.orderId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Player ID</label>
                <p className="mt-1 text-sm text-gray-900">{currentDeposit.playerId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Amount</label>
                <p className="mt-1 text-sm text-gray-900">
                  {currentDeposit.amount} {currentDeposit.currency}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Nagad Account</label>
                <p className="mt-1 text-sm text-gray-900 flex items-center">
                  <FaPhoneAlt className="mr-1 text-blue-500" />
                  {currentDeposit.accountNumber}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Provider</label>
                <p className="mt-1 text-sm text-gray-900 capitalize">{currentDeposit.provider}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <p className="mt-1 text-sm">
                  <StatusBadge status={currentDeposit.status} />
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Transaction ID</label>
                <p className="mt-1 text-sm text-gray-900">{currentDeposit.transactionId || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Reference Number</label>
                <p className="mt-1 text-sm text-gray-900">{currentDeposit.referenceNumber || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Created At</label>
                <p className="mt-1 text-sm text-gray-900">
                  {format(parseISO(currentDeposit.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                <p className="mt-1 text-sm text-gray-900">
                  {format(parseISO(currentDeposit.updatedAt), 'MMM dd, yyyy HH:mm:ss')}
                </p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Status Update Modal */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Update Deposit Status">
        {currentDeposit && (
          <div className="space-y-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
              <StatusBadge status={currentDeposit.status} />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
              <select
                value={statusUpdate}
                onChange={(e) => setStatusUpdate(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
              <input
                type="text"
                value={transactionId}
onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter transaction ID"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Enter reference number"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStatusUpdate}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
              >
                Update Status
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Deposit Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Nagad Free Deposit">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Player ID *</label>
              <input
                type="text"
                value={newDeposit.playerId}
                onChange={(e) => setNewDeposit({...newDeposit, playerId: e.target.value})}
                placeholder="Enter Player ID"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (BDT) *</label>
              <input
                type="number"
                value={newDeposit.amount}
                onChange={(e) => setNewDeposit({...newDeposit, amount: e.target.value})}
                placeholder="Enter amount"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nagad Account Number *</label>
              <input
                type="text"
                value={newDeposit.accountNumber}
                onChange={(e) => setNewDeposit({...newDeposit, accountNumber: e.target.value})}
                placeholder="e.g., 01688494101"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order ID *</label>
              <input
                type="text"
                value={newDeposit.orderId}
                onChange={(e) => setNewDeposit({...newDeposit, orderId: e.target.value})}
                placeholder="Enter unique Order ID"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div className="mt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateDeposit}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
            >
              Create Deposit
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirm Deletion">
        {currentDeposit && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Are you sure you want to delete this deposit? This action cannot be undone.
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Deleting deposit <span className="font-medium">{currentDeposit.orderId}</span> will permanently remove it from the system.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteDeposit(currentDeposit._id);
                  setShowDeleteModal(false);
                }}
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Toaster position="top-right" />
    </section>
  );
};

export default Nagadfree;