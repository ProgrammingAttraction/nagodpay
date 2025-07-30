import React, { useState } from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { FaCalendarAlt } from 'react-icons/fa';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const Payoutapproval = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleFilter = async () => {
    if (!startDate || !endDate) {
      toast.error('Start Date and End Date are required!');
      return;
    }

    try {
      toast.loading('Filtering...');
      setLoading(true);
      const res = await axios.post('/api/filter-by-date', {
        startDate,
        endDate,
      });
      setTransactions(res.data.transactions || []);
      toast.dismiss();
      toast.success('Filtered successfully');
    } catch (error) {
      toast.dismiss();
      toast.error('Error filtering transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setTransactions([]);
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
          <h1 className="text-2xl font-bold mb-6">Transaction</h1>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="text-lg font-semibold bg-gray-100 px-6 py-3 border-b border-gray-200">Pay Out Approval</div>

            <div className="md:flex items-end gap-4 px-6 py-4">
                        <div  className="flex-1">
            <label className="block mb-1 text-sm font-medium">TrxID</label>
            <input
              type="text"
              placeholder="Enter TrxID"
              className="w-full px-4 py-2 border rounded-md focus:ring border-gray-200 focus:ring-green-300"
            />
          </div>
              <div className="flex-1">
                <label className="block mb-1 text-sm font-medium">Start Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md pr-10 border-gray-300"
                  />
                  <FaCalendarAlt className="absolute right-3 top-3 text-gray-500" />
                </div>
              </div>

              <div className="flex-1">
                <label className="block mb-1 text-sm font-medium">End Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md pr-10 border-gray-300"
                  />
                  <FaCalendarAlt className="absolute right-3 top-3 text-gray-500" />
                </div>
              </div>

              <div className="flex gap-2 mt-4 md:mt-0">
                <button
                  onClick={handleReset}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                >
                  Reset
                </button>
                <button
                  onClick={handleFilter}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
                >
                  {loading ? 'Filtering...' : 'Filter'}
                </button>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="mt-6 bg-white p-6 border rounded shadow-sm border-gray-200">
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                {/* <img src={noDataImage} alt="No Data" className="w-40 h-40 mb-4" /> */}
                <p>No Payout Approval Transactions</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full table-auto text-left border-t">
                  <thead className="bg-gray-100 text-sm text-gray-700">
                    <tr>
                      <th className="py-2 px-4 border-b">#</th>
                      <th className="py-2 px-4 border-b">Date</th>
                      <th className="py-2 px-4 border-b">Amount</th>
                      <th className="py-2 px-4 border-b">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b">{idx + 1}</td>
                        <td className="py-2 px-4 border-b">{txn.date}</td>
                        <td className="py-2 px-4 border-b">${txn.amount}</td>
                        <td className="py-2 px-4 border-b">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              txn.status === 'Pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : txn.status === 'Approved'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {txn.status}
                          </span>
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
  );
};

export default Payoutapproval;
