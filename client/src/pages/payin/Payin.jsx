import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { FiSearch } from 'react-icons/fi';
import { FaFilter, FaRedo } from 'react-icons/fa';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import moment from 'moment';

const Payin = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(moment().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(moment().endOf('month').format('YYYY-MM-DD'));
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('authToken');
  const user_info = JSON.parse(localStorage.getItem('userData'));

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  // Fetch payin transactions on component mount and page change
  useEffect(() => {
    fetchPayins();
  }, [pagination.page, startDate, endDate]);

  const fetchPayins = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${base_url}/api/user/user-payins/${user_info._id}`,
        {
          params: {
            page: pagination.page,
            limit: pagination.limit,
            search: searchTerm,
            startDate: moment(startDate).format('YYYY-MM-DD'),
            endDate: moment(endDate).format('YYYY-MM-DD')
          },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
       console.log(response)
      const { data, total, page, limit, totalPages } = response.data;
      setTransactions(response.data.payins || []);
      setPagination({
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      });
      setHasSearched(true);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error fetching transactions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = async () => {
    try {
      setIsLoading(true);
      setHasSearched(true);
      setPagination(prev => ({ ...prev, page: 1 }));
      await fetchPayins();
      toast.success('Filter applied successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || "Error applying filters");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSearchTerm('');
    setStartDate(moment().startOf('month').format('YYYY-MM-DD'));
    setEndDate(moment().endOf('month').format('YYYY-MM-DD'));
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchPayins();
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  // Format amount with currency
  const formatAmount = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'BDT'
    }).format(amount);
  };

  // Security: Mask sensitive information
  const maskAccountNumber = (account) => {
    if (!account) return 'N/A';
    return `****${account.slice(-4)}`;
  };

  return (
    <section className="flex h-screen font-jost overflow-hidden">
      <div className="shrink-0 h-screen overflow-y-auto bg-white border-r">
        <Sidebar isOpen={sidebarOpen} />
      </div>

      <section className="flex-1 w-full h-screen overflow-y-auto bg-gray-50">
        <Header toggleSidebar={toggleSidebar} />
        <div className="px-6 py-8">
          <Toaster />
          <h1 className="text-2xl font-bold mb-6">Payin Transactions</h1>
  
          {/* Filter Section */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by Payment ID or Trx ID"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border rounded border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <FiSearch className="absolute right-3 top-3 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none border-gray-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none border-gray-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end space-x-2">
                <button
                  onClick={handleFilter}
                  disabled={isLoading}
                  className="flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
                >
                  <FaFilter className="mr-2" /> Filter
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                >
                  <FaRedo className="mr-2" /> Reset
                </button>
              </div>
            </div>
          </div>
  
          {/* Transactions Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-600">
                  {hasSearched ? 'No transactions found matching your criteria' : 'No transactions available'}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {transaction.paymentId || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {moment(transaction.createdAt).format('DD MMM YYYY, h:mm A')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatAmount(transaction.expectedAmount, transaction.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {maskAccountNumber(transaction.payerAccount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'}`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.transactionId || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Controls */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of <span className="font-medium">{pagination.total}</span> results
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 border rounded-md bg-white text-sm font-medium cursor-pointer border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-1 border rounded-md bg-white cursor-pointer border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </section>
  );
};

export default Payin;