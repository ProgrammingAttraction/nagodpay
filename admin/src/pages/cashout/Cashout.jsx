import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { format } from 'date-fns';
import { FaEye, FaTrashAlt, FaEdit,FaTrash } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';
const Cashout = () => {
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

  return (
    <section className="font-nunito h-screen">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh] h-[90vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'ml-[17%]' : 'ml-0'
          }`}
        >
          <div className="bg-white px-2 py-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Cash Out Transactions</h2>
            
            <div className="overflow-x-auto rounded-lg overflow-hidden border-[1px] border-gray-200">
              <table className="min-w-full bg-white">
                <thead className="bg-blue-600">
                  <tr className='text-white text-[15px] lg:text-[17px] '>
                    <th className="py-3 px-4 text-left  font-semibold">User ID</th>
                    <th className="py-3 px-4 text-left  font-semibold">Amount</th>
                    <th className="py-3 px-4 text-left font-semibold">Method</th>
                    <th className="py-3 px-4 text-left  font-semibold">Recipient</th>
                    <th className="py-3 px-4 text-left font-semibold">Status</th>
                    <th className="py-3 px-4 text-left  font-semibold">Date</th>
                    <th className="py-3 px-4 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction._id} className="border-t border-gray-200 text-[15px] lg:text-[17px] hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-700">{transaction.userId._id}</td>
                      <td className="py-3 px-4 text-gray-700">৳{transaction.amount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-gray-700 capitalize">{transaction.method}</td>
                      <td className="py-3 px-4 text-gray-700">{transaction.recipient}</td>
                      <td className="py-3 px-4">
                        <select
                          value={transaction.status}
                          onChange={(e) => updateStatus(transaction._id, e.target.value)}
                          className={`px-2 py-1 rounded text-sm capitalize ${
                            transaction.status === 'pending' ? 'bg-yellow-100 border-[1px] border-orange-200 text-yellow-800' :
                            transaction.status === 'success' ? 'bg-green-100 text-green-800 border-green-200'  :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="success">Success</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {format(new Date(transaction.createdAt), 'MMM dd, yyyy HH:mm')}
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
                <p className="font-medium">{selectedTransaction.userId._id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium">${selectedTransaction.amount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Method</p>
                <p className="font-medium capitalize">{selectedTransaction.method}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Recipient</p>
                <p className="font-medium">{selectedTransaction.recipient}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium capitalize">{selectedTransaction.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">
                  {format(new Date(selectedTransaction.createdAt), 'MMM dd, yyyy HH:mm')}
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

export default Cashout;