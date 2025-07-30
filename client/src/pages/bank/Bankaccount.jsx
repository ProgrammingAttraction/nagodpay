import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { FaEye } from 'react-icons/fa';
import { useUser } from '../../context/UserContext';
import { NavLink } from 'react-router-dom';

const Bankaccount = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  const { userData } = useUser();
  const user_info = JSON.parse(localStorage.getItem('userData'));
  const token = localStorage.getItem('authToken'); // Get token from localStorage
  
  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        const response = await axios.get(`${base_url}/api/user/user-bank-account/${user_info?._id}`,{
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const data = response.data;
        if (data.success) {
          setBankAccounts(Array.isArray(data.data) ? data.data : [data.data]);
          setFilteredAccounts(Array.isArray(data.data) ? data.data : [data.data]);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBankAccounts();
  }, []);

  useEffect(() => {
    let results = bankAccounts;
    
    // Apply search filter
    if (searchTerm) {
      results = results.filter(account => 
        account.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (account.shopName && account.shopName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      results = results.filter(account => account.status === statusFilter);
    }
    
    setFilteredAccounts(results);
  }, [searchTerm, statusFilter, bankAccounts]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleFilter = (e) => {
    e.preventDefault();
    // The filtering is already handled by the useEffect above
  };

  if (loading) {
    return (
      <section className="flex h-screen overflow-hidden bg-gray-100">
        <div className="shrink-0 h-screen overflow-y-auto overflow-x-hidden bg-white border-r">
          <Sidebar isOpen={sidebarOpen} />
        </div>
        <section className="flex-1 w-full h-screen overflow-y-auto">
          <Header toggleSidebar={toggleSidebar} />
          <div className="p-5">
            <p>Loading bank accounts...</p>
          </div>
        </section>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex h-screen overflow-hidden bg-gray-100">
        <div className="shrink-0 h-screen overflow-y-auto overflow-x-hidden bg-white border-r">
          <Sidebar isOpen={sidebarOpen} />
        </div>
        <section className="flex-1 w-full h-screen overflow-y-auto">
          <Header toggleSidebar={toggleSidebar} />
          <div className="p-5">
            <p className="text-red-500">Error: {error}</p>
          </div>
        </section>
      </section>
    );
  }

  return (
    <section className="flex h-screen font-fira overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <div className="shrink-0 h-screen overflow-y-auto overflow-x-hidden bg-white border-r">
        <Sidebar isOpen={sidebarOpen} />
      </div>

      {/* Main Content */}
      <section className="flex-1 w-full h-screen overflow-y-auto">
        <Header toggleSidebar={toggleSidebar} />

        {/* Page Content */}
        <div className="p-5">
          <h2 className="text-2xl font-semibold mb-5">Banking Channels</h2>

          {/* Filter */}
          <div className="bg-white p-4 rounded shadow mb-6 ">
            <form onSubmit={handleFilter} className="flex flex-col md:flex-row items-center gap-4">
              <input
                type="text"
                placeholder="Enter Account Number or Shop Name"
                className="w-full md:w-1/3 border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <select
                className="w-full md:w-1/3 border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={statusFilter}
                onChange={handleStatusChange}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button 
                type="submit"
                className="bg-purple-600 text-white px-5 py-2 rounded hover:bg-purple-700 transition"
              >
                Filter
              </button>
            </form>
          </div>

          {/* Table */}
          <div className="bg-white rounded shadow overflow-x-auto border-[1px] border-gray-200" >
            {filteredAccounts.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No bank accounts found matching your criteria.
              </div>
            ) : (
              <table className="w-full table-auto text-sm">
                <thead className="bg-gray-100 text-left">
                  <tr className="text-gray-600">
                    <th className="py-3 px-4">Provider Payment Method</th>
                    <th className="py-3 px-4">Account Number</th>
                    <th className="py-3 px-4">Shop Name</th>
                    <th className="py-3 px-4">Orders Today</th>
                    <th className="py-3 px-4">Total Payout</th>
                    <th className="py-3 px-4">Received Today</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map((account, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50 border-gray-200">
                      <td className="py-3 px-4">{account.provider}</td>
                      <td className="py-3 px-4">{account.accountNumber}</td>
                      <td className="py-3 px-4">{account.shopName || '-'}</td>
                      <td className="py-3 px-4">{account?.total_order}</td>
                      <td className="py-3 px-4">{account?.total_cashout}</td>
                      <td className="py-3 px-4">{account?.total_recieved}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          account.status === 'active' ? 'bg-green-100 text-green-800' :
                          account.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {account.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <NavLink to={`/bank-account/${account._id}`}>
                          <button  className="bg-sky-500 hover:bg-sky-600 p-2 text-white rounded"><FaEye /></button>
                        </NavLink>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </section>
  );
};

export default Bankaccount;