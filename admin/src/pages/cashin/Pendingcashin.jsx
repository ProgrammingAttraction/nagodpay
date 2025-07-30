import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { format } from 'date-fns';
import { FaEye, FaTrash } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';

const PendingCashIn = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Fetch cash-in transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get(`${base_url}/api/admin/cash-in`);
        setTransactions(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        toast.error(`Failed to fetch transactions: ${err.message}`, {
          position: "top-right",
          duration: 4000,
        });
      }
    };

    fetchTransactions();
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      const response = await axios.put(`${base_url}/api/admin/cash-in-status/${id}`, { status: newStatus });
      setTransactions(transactions.map(tx => 
        tx._id === id ? response.data : tx
      ));
      toast.success(`Status updated to ${newStatus}`, {
        position: "top-right",
        duration: 3000,
      });
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error(`Failed to update status: ${err.message}`, {
        position: "top-right",
        duration: 4000,
      });
    }
  };

  const deleteTransaction = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await axios.delete(`${base_url}/admin/cash-in/${id}`);
        setTransactions(transactions.filter(tx => tx._id !== id));
        toast.success('Transaction deleted successfully', {
          position: "top-right",
          duration: 3000,
        });
      } catch (err) {
        console.error('Error deleting transaction:', err);
        toast.error(`Failed to delete transaction: ${err.message}`, {
          position: "top-right",
          duration: 4000,
        });
      }
    }
  };

  const viewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <section className="font-nunito h-screen">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh] h-[90vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </main>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="font-nunito h-screen">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh] h-[90vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
            <div className="bg-white py-4 px-2">
              <div className="text-red-500 p-4 rounded bg-red-50">{error}</div>
            </div>
          </main>
        </div>
      </section>
    );
  }

  return (
    <section className="font-nunito h-screen">
      <Header toggleSidebar={toggleSidebar} />
      <Toaster />

      <div className="flex pt-[10vh] h-[90vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'ml-[17%]' : 'ml-0'
          }`}
        >
          <div className="bg-white py-4 px-2">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Cash In Requests</h2>
            
            <div className="overflow-x-auto rounded-lg overflow-hidden border-[1px] border-gray-200">
              <table className="min-w-full bg-white">
                <thead className="bg-blue-600">
                  <tr className='text-white text-[15px] lg:text-[17px]'>
                    <th className="py-3 px-4 text-left font-semibold">User ID</th>
                    <th className="py-3 px-4 text-left font-semibold">Amount</th>
                    <th className="py-3 px-4 text-left font-semibold">Method</th>
                    <th className="py-3 px-4 text-left font-semibold">Sender</th>
                    <th className="py-3 px-4 text-left font-semibold">Transaction ID</th>
                    <th className="py-3 px-4 text-left font-semibold">Status</th>
                    <th className="py-3 px-4 text-left font-semibold">Date</th>
                    <th className="py-3 px-4 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction._id} className="border-t border-gray-200 text-[15px] lg:text-[17px] hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-700">{transaction.user?.toString() || 'N/A'}</td>
                      <td className="py-3 px-4 text-gray-700">৳{transaction.amount?.toFixed(2) || '0.00'}</td>
                      <td className="py-3 px-4 text-gray-700 capitalize">{transaction.method || 'N/A'}</td>
                      <td className="py-3 px-4 text-gray-700">{transaction.sender || 'N/A'}</td>
                      <td className="py-3 px-4 text-gray-700">{transaction.transaction_id || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <select
                          value={transaction.status}
                          onChange={(e) => updateStatus(transaction._id, e.target.value)}
                          className={`px-2 py-1 rounded text-sm capitalize ${
                            transaction.status === 'pending' ? 'bg-yellow-100 border-[1px] border-orange-200 text-yellow-800' :
                            transaction.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {transaction.createdAt ? format(new Date(transaction.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => viewDetails(transaction)}
                            className="p-2 bg-green-100 cursor-pointer text-green-600 border-[1px] border-green-500 hover:bg-green-200 hover:text-green-800 rounded transition duration-200"
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => deleteTransaction(transaction._id)}
                            className="p-2 bg-red-100 text-red-600 cursor-pointer border-[1px] border-red-500 hover:bg-red-200 hover:text-red-800 rounded transition duration-200"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Transaction Details Modal */}
      {isModalOpen && selectedTransaction && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[10000]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Transaction Details</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 cursor-pointer text-[22px] hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Transaction ID</p>
                <p className="font-medium">{selectedTransaction._id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">User ID</p>
                <p className="font-medium">{selectedTransaction.user?.toString() || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium">৳{selectedTransaction.amount?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Method</p>
                <p className="font-medium capitalize">{selectedTransaction.method || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sender</p>
                <p className="font-medium">{selectedTransaction.sender || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Transaction ID</p>
                <p className="font-medium">{selectedTransaction.transaction_id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium capitalize">{selectedTransaction.status || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">
                  {selectedTransaction.createdAt ? format(new Date(selectedTransaction.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 cursor-pointer bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default PendingCashIn;