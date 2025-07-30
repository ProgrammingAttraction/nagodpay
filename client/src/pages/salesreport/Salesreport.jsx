import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { FaCalendarAlt } from 'react-icons/fa';
import { MdArrowDropDown } from 'react-icons/md';
import { useUser } from '../../context/UserContext';

const Salesreport = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userData } = useUser();
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    paymentMethod: '',
    bankAccount: '',
    accountNumber: ''
  });

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('authToken');
  const userdata2 = JSON.parse(localStorage.getItem("userData"));

  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${base_url}/api/user/bank-accunts/${userdata2._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch bank accounts');
        }
        
        const data = await response.json();
        if (data.success) {
          setBankAccounts(data.data);
          setFilteredAccounts(data.data); // Initialize filtered accounts with all data
        } else {
          setError(data.message || 'No bank accounts found');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBankAccounts();
  }, [base_url, token, userdata2._id]);

  // Apply filters whenever filter state changes
  useEffect(() => {
    applyFilters();
  }, [filters, bankAccounts]);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getDateRange = (range) => {
    const today = new Date();
    let startDate, endDate;

    // Reset time to beginning of day for proper comparison
    today.setHours(0, 0, 0, 0);

    switch (range) {
      case 'today':
        startDate = new Date(today);
        endDate = new Date(today);
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = yesterday;
        endDate = yesterday;
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today);
        break;
      default:
        break;
    }

    setFilters(prev => ({
      ...prev,
      startDate: startDate ? startDate.toISOString().split('T')[0] : '',
      endDate: endDate ? endDate.toISOString().split('T')[0] : ''
    }));
  };

  const applyFilters = () => {
    try {
      setLoading(true);
      
      // Filter bank accounts based on all active filters
      const results = bankAccounts.filter(account => {
        // Filter by bank account ID if specified
        if (filters.bankAccount && account._id !== filters.bankAccount) {
          return false;
        }
        
        // Filter by account number if specified (case insensitive)
        if (filters.accountNumber && 
            !account.accountNumber.toLowerCase().includes(filters.accountNumber.toLowerCase())) {
          return false;
        }
        
        // Filter by payment method if specified
        if (filters.paymentMethod && account.paymentMethod !== filters.paymentMethod) {
          return false;
        }
        
        // Date filtering - assuming account has a date field (adjust as needed)
        if (filters.startDate || filters.endDate) {
          const accountDate = new Date(account.date || account.createdAt);
          accountDate.setHours(0, 0, 0, 0);
          
          if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            if (accountDate < startDate) return false;
          }
          
          if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            if (accountDate > endDate) return false;
          }
        }
        
        return true;
      });
      
      setFilteredAccounts(results);
    } catch (error) {
      setError('Error applying filters');
      console.error('Filter error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex h-screen font-fira overflow-hidden">
      {/* Sidebar */}
      <div className="shrink-0 h-screen overflow-y-auto overflow-x-hidden bg-white border-r">
        <Sidebar isOpen={sidebarOpen} />
      </div>

      {/* Main Content */}
      <section className="flex-1 w-full h-screen overflow-y-auto bg-gray-50">
        <Header toggleSidebar={toggleSidebar} />
        <div className="p-6">
          <h1 className="text-xl font-semibold mb-4">Sales Report</h1>

          <div className="bg-white p-4 rounded shadow border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Start Date */}
              <div>
                <label className="block text-sm mb-1">Start Date</label>
                <div className="relative">
                  <input
                    type="date"
                    name="startDate"
                    className="w-full border rounded px-3 py-2 pr-10 border-gray-200"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                  />
                  <FaCalendarAlt className="absolute right-3 top-3 text-gray-400" />
                </div>
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm mb-1">End Date</label>
                <div className="relative">
                  <input
                    type="date"
                    name="endDate"
                    className="w-full border rounded px-3 py-2 pr-10 border-gray-200"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                  />
                  <FaCalendarAlt className="absolute right-3 top-3 text-gray-400" />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm mb-1">Payment Method</label>
                <div className="relative">
                  <select 
                    name="paymentMethod"
                    className="w-full border rounded px-3 py-2 appearance-none border-gray-200"
                    value={filters.paymentMethod}
                    onChange={handleFilterChange}
                  >
                    <option value="">Select Payment Method</option>
                    <option value="Bkash P2P">Bkash P2P</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                  </select>
                  <MdArrowDropDown className="absolute right-3 top-3 text-gray-400 text-xl" />
                </div>
              </div>

              {/* Bank Account */}
              <div>
                <label className="block text-sm mb-1">Bank Account</label>
                <div className="relative">
                  <select 
                    name="bankAccount"
                    className="w-full border rounded px-3 py-2 appearance-none border-gray-200"
                    value={filters.bankAccount}
                    onChange={handleFilterChange}
                  >
                    <option value="">Select Account</option>
                    {bankAccounts.map(account => (
                      <option key={account._id} value={account._id}>
                        {account.provider} - {account.accountNumber}
                      </option>
                    ))}
                  </select>
                  <MdArrowDropDown className="absolute right-3 top-3 text-gray-400 text-xl" />
                </div>
              </div>

              {/* Account Number */}
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Account Number</label>
                <input
                  type="text"
                  name="accountNumber"
                  placeholder="Enter Account Number"
                  className="w-full border rounded px-3 py-2 border-gray-200"
                  value={filters.accountNumber}
                  onChange={handleFilterChange}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-3 mt-2">
              <button 
                className="bg-purple-600 text-white px-4 py-1 rounded hover:bg-purple-700"
                onClick={() => getDateRange('month')}
              >
                This Month
              </button>
              <button 
                className="bg-gray-600 text-white px-4 py-1 rounded hover:bg-gray-700"
                onClick={() => getDateRange('yesterday')}
              >
                Yesterday
              </button>
              <button 
                className="bg-sky-500 text-white px-4 py-1 rounded hover:bg-sky-600"
                onClick={() => getDateRange('today')}
              >
                Today
              </button>
              <button 
                className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                onClick={applyFilters}
              >
                Filter
              </button>
            </div>

            {/* Loading state */}
            {loading && (
              <div className="mt-6 flex justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
              </div>
            )}

            {/* Error state */}
            {error && !loading && (
              <p className="text-sm text-red-500 mt-4 text-center">{error}</p>
            )}

            {/* Empty state */}
            {!loading && !error && filteredAccounts.length === 0 && (
              <p className="text-sm text-gray-500 mt-4 text-center">No records found matching your criteria</p>
            )}

            {/* Results */}
            {!loading && !error && filteredAccounts.length > 0 && (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Order</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Recieved</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAccounts.map((account) => (
                      <tr key={account._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <p> {userData?.username}</p>
                            <p>{account.provider}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <p>{account.shopName}</p>
                            <p>{account.accountNumber}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {account.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{account.total_order}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">৳{account.total_recieved}</td>
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

export default Salesreport;