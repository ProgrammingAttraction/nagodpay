import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { format } from 'date-fns';
import { FaSync, FaTrashAlt } from 'react-icons/fa';
import Swal from 'sweetalert2';

const Forwardsms = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('authToken');

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      let url = `${base_url}/api/admin/forward-sms`;
    
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setMessages(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching forwarded SMS:', error);
      setError('Failed to fetch forwarded SMS');
      setLoading(false);
    }
  };

  const deleteMessage = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Message',
      text: 'Are you sure you want to delete this forwarded SMS?',
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
          html: 'Please wait while we delete the message',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await axios.delete(
          `${base_url}/api/admin/forward-sms/${id}`, 
          { 
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        await Swal.fire({
          title: 'Deleted!',
          text: 'The forwarded SMS has been deleted.',
          icon: 'success',
          confirmButtonColor: '#3085d6',
          timer: 2000,
          timerProgressBar: true
        });

        fetchMessages();
      } catch (error) {
        console.error('Error deleting message:', error);
        
        Swal.fire({
          title: 'Error!',
          text: error.response?.data?.message || 'Failed to delete message',
          icon: 'error',
          confirmButtonColor: '#3085d6'
        });
      }
    }
  };

  const StatusBadge = ({ status }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'used':
          return 'bg-green-100 text-green-800';
        case 'arrived':
          return 'bg-blue-100 text-blue-800';
        case 'expired':
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
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'ml-[17%]' : 'ml-0'
          }`}
        >
          <div className="bg-white rounded-lg shadow-sm py-4 px-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Forwarded SMS</h2>
              <button 
                onClick={fetchMessages}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                <FaSync /> Refresh
              </button>
            </div>

            {/* Messages Table */}
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
              ) : messages.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">No forwarded messages found</p>
                </div>
              ) : (
                <div className="shadow border-b border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Provider</th>
                        <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Agent Account</th>
                        <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Customer Account</th>
                        <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Transaction ID</th>
                        <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {messages.map((message) => (
                        <tr key={message._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                            {message.provider}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {message.agentAccount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {message.customerAccount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {message.transactionType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {message.transactionAmount} {message.currency}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {message.transactionId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={message.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(message.transactionDate), 'MMM dd, yyyy HH:mm')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => deleteMessage(message._id)}
                              className="p-2 bg-red-500 text-white rounded-md transition-colors"
                              title="Delete"
                            >
                              <FaTrashAlt />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </section>
  );
};

export default Forwardsms;