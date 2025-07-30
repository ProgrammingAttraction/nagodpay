import React, { useState, useEffect } from 'react'
import Header from '../../components/common/Header'
import Sidebar from '../../components/common/Sidebar';
import { FiSearch } from 'react-icons/fi';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { FaCalendarAlt } from 'react-icons/fa';

const PayInApproval = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('authToken');
  
  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleFilter = async () => {
    if (!startDate || !endDate) {
      toast.error('Start Date and End Date are required!');
      return;
    }

    try {
      setIsFiltering(true);
      setLoading(true);
      toast.loading('Filtering transactions...');
      
      const res = await axios.post(`${base_url}/api/user/filter-by-date`, {
        startDate,
        endDate,
      },{
        headers: {
          'Authorization': `Bearer ${token}`
        }});

      if (res.data.success) {
        setTransactions(res.data.transactions || []);
        toast.dismiss();
        toast.success(`Found ${res.data.count} transactions`);
      } else {
        toast.dismiss();
        toast.error(res.data.message || 'Error filtering transactions');
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || 'Error filtering transactions');
      console.error('Filter error:', error);
    } finally {
      setLoading(false);
      setIsFiltering(false);
    }
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setTransactions([]);
  };

  return (
    <section className="flex h-screen font-jost overflow-hidden">
      {/* Sidebar */}
      <div className="shrink-0 h-screen overflow-y-auto overflow-x-hidden bg-white border-r">
        <Sidebar isOpen={sidebarOpen} />
      </div>

      {/* Main Content */}
      <section className="flex-1 w-full h-screen overflow-y-auto">
        <Header toggleSidebar={toggleSidebar} />
        {/* Your scrollable content below header */}
        <div className="mx-auto px-4 py-8">
          <Toaster />
          <h1 className="text-2xl font-bold mb-6">Transaction</h1>

          <div className="border border-gray-200 rounded-lg shadow-sm">
            <div className="text-lg font-semibold mb-4 bg-gray-100 px-[20px] py-[5px]">Pay In Approval</div>

            <div className="grid md:grid-cols-2 gap-4 mb-4 px-6 py-4">
              <div>
                <label className="block mb-1 text-sm font-medium">Start Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md pr-10 border-gray-200"
                  />
                  <FaCalendarAlt className="absolute right-3 top-3 text-gray-500" />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium">End Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md pr-10 border-gray-200"
                  />
                  <FaCalendarAlt className="absolute right-3 top-3 text-gray-500" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center p-2">
              <button
                onClick={handleReset}
                className="bg-gray-600 hover:bg-gray-700 text-white px-5 py-2 rounded-md"
              >
                Reset
              </button>
              <button
                onClick={handleFilter}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-md disabled:opacity-70"
              >
                {loading ? 'Filtering...' : 'Filter'}
              </button>
            </div>
          </div>

          <div className="mt-6 bg-white p-6 border rounded shadow-sm border-gray-200">
            {isFiltering ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-center text-gray-500">No transactions found for the selected date range</p>
            ) : (
   <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          #
        </th>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Date
        </th>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Amount
        </th>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Status
        </th>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Payment ID
        </th>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Transaction ID
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {transactions.map((txn, idx) => (
        <tr key={txn.id || idx} className="hover:bg-gray-50 transition-colors duration-150">
          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
            {idx + 1}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            {txn.date}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
            ৳ {txn.amount}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              txn.status === 'pending' 
                ? 'bg-yellow-100 text-yellow-800' 
                : txn.status === 'completed' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
            }`}>
              {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
            {txn.paymentId ? `${txn.paymentId.substring(0, 4)}...${txn.paymentId.slice(-4)}` : 'N/A'}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
            {txn.transactionId ? `${txn.transactionId.substring(0, 4)}...${txn.transactionId.slice(-4)}` : 'N/A'}
          </td>
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
  )
}

export default PayInApproval