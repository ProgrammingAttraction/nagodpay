import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { FaCalendarAlt, FaEye, FaCheck, FaSync, FaSearch, FaTimes } from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import moment from 'moment';
import { RiShareForwardLine } from "react-icons/ri";
import Swal from 'sweetalert2';

const Payoutrequest = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const token = localStorage.getItem('authToken');
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const currentUser = JSON.parse(localStorage.getItem("userData"));

  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [status, setStatus] = useState('pending');
  const [notes, setNotes] = useState('');
  const [agentnumber,setagentnumber] = useState('');
  const statusOptions = ['pending', 'approved', 'rejected', 'success'];
  const methodOptions = ['bank', 'paypal', 'crypto', 'other'];
 console.log(agentnumber)
  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const fetchWithdrawalRequests = async () => {
    try {
      const response = await axios.get(`${base_url}/api/user/single-user/${currentUser._id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setUserData(response.data.user);
        const requests = response.data.user.withdrawalRequests || [];
        setWithdrawalRequests(requests);
        setFilteredRequests(requests);
        setTotalPages(Math.ceil(requests.length / limit));
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
    fetchWithdrawalRequests();
  }, [base_url, token, currentUser._id]);

  useEffect(() => {
    // Apply filters whenever filter states change
    let results = withdrawalRequests;
    
    if (statusFilter) {
      results = results.filter(request => request.status === statusFilter);
    }
    
    if (methodFilter) {
      results = results.filter(request => request.method.toLowerCase() === methodFilter.toLowerCase());
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(request => 
        request.transactionId?.toLowerCase().includes(query) || 
        request.payeeAccount?.toLowerCase().includes(query) ||
        request.amount?.toString().includes(query)
      );
    }
    
    setFilteredRequests(results);
    setTotalPages(Math.ceil(results.length / limit));
    setCurrentPage(1); // Reset to first page when filters change
  }, [statusFilter, methodFilter, searchQuery, withdrawalRequests, limit]);

  const handleView = (request) => {
    // Implement view functionality
    toast.success(`Viewing request: ${request.transactionId}`);
    console.log("View request:", request);
  };

  const openApproveModal = (request) => {
    setCurrentRequest(request);
    setTransactionId(request.transactionId || '');
    setStatus(request.status);
    setNotes(request.adminNotes || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentRequest(null);
    setTransactionId('');
    setStatus('pending');
    setNotes('');
  };

  // Resend callback function
  const handleResendCallback = (id) => {
    setLoading(true);
    axios
      .post(`${base_url}/api/payment/resendCallbackPayout`, {
        authEmail: currentUser.email,
        payment_id: id,
      })
      .then((res) => {
        if (res.data.message) {
          Swal.fire({
            icon: "info",
            title: "Info!",
            text: res.data.message,
            showConfirmButton: true,
          });
        }
        fetchWithdrawalRequests();
      })
      .catch((err) => {
        console.log(err);
        toast.error("Failed to resend callback");
      })
      .finally(() => setLoading(false));
  };

  const handleStatusUpdate = async () => {
    console.log(currentRequest)
    if (!currentRequest) return;

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
      const response = await axios.post(`${base_url}/api/payment/changePayoutStatus`, {
        status: status,
        payment_id: currentRequest.paymentid,
        transactionId: transactionId,
        admin_name: currentUser._id,
        adminNotes: notes,
        agentnumber
      });
      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Update Success',
          text: `${response.data.message}`,
        });
          handleResendCallback(currentRequest.paymentid);
        
        // Only resend callback if status is changed to success
        if (status === "success") {
          handleResendCallback(currentRequest.paymentid);
        } else {
          fetchWithdrawalRequests();
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: `${response.data.message}`,
        });
      }
    } catch (error) {
      console.error("Error updating request:", error);
      toast.error("Error updating request");
    } finally {
      setLoading(false);
      closeModal();
    }
  };

  const resetFilters = () => {
    setStatusFilter('');
    setMethodFilter('');
    setSearchQuery('');
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const refreshData = () => {
    setLoading(true);
    fetchWithdrawalRequests();
  };
const handleForwardRequest = async (request) => {
  try {
    const result = await Swal.fire({
      title: 'Forward Request?',
      text: "Are you sure you want to forward this withdrawal request to another agent?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, forward it!'
    });

    if (result.isConfirmed) {
      setLoading(true);
      const response = await axios.post(`${base_url}/api/payment/forward-payout`, {
        paymentId: request.paymentid
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        Swal.fire(
          'Forwarded!',
          'The request has been forwarded to another agent.',
          'success'
        );
        // Refresh the data to show updated status
        fetchWithdrawalRequests();
      } else {
        throw new Error(response.data.message || 'Failed to forward request');
      }
    }
  } catch (error) {
    console.error("Error forwarding request:", error);
    Swal.fire(
      'Error!',
      error.message || 'Failed to forward request',
      'error'
    );
  } finally {
    setLoading(false);
  }
};

  // Get current requests based on pagination
  const indexOfLastRequest = currentPage * limit;
  const indexOfFirstRequest = indexOfLastRequest - limit;
  const currentRequests = filteredRequests.slice(indexOfFirstRequest, indexOfLastRequest);

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
          {isModalOpen && currentRequest && (
            <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] bg-opacity-50 flex items-center justify-center z-[10000]">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center border-b p-4 border-gray-200">
                  <h3 className="text-lg font-semibold">Update Withdrawal Request</h3>
                  <button onClick={closeModal} className="text-gray-500 cursor-pointer hover:text-gray-700">
                    <FaTimes />
                  </button>
                </div>
                
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="w-full p-2 border border-gray-300 outline-theme rounded-md  focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter transaction ID"
                    />
                  </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agent Account</label>
                    <input
                      type="text"
                      value={agentnumber}
                      onChange={(e) => setagentnumber(e.target.value)}
                      className="w-full p-2 border border-gray-300 outline-theme rounded-md  focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter transaction ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full p-2 border border-gray-300 outline-theme rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="success">Success</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-2 border border-gray-300 outline-theme rounded-md focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                      placeholder="Any notes about this transaction..."
                    />
                  </div>
                  
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
          
          <div className="bg-white rounded-lg border-[1px] border-gray-200 shadow-sm py-4 px-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Withdrawal Requests</h2>
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
                  <label className="block text-[14px] lg:text-[17px] font-medium text-gray-700 mb-1">Method</label>
                  <select
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md outline-theme"
                  >
                    <option value="">All Methods</option>
                    {methodOptions.map((method) => (
                      <option key={method} value={method}>
                        {method.charAt(0).toUpperCase() + method.slice(1)}
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
                    placeholder="Search by ID, account or amount..."
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

            {/* Requests Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : currentRequests.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500">No withdrawal requests found</p>
                </div>
              ) : (
                <>
                  <div className="border-[1px] border-gray-200 ">
                    <table className="min-w-full divide-y divide-gray-200 ">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-[14px] md:text-[15px] font-[600] text-gray-700 uppercase tracking-wider">Transaction ID</th>
                          <th scope="col" className="px-6 py-3 text-left text-[14px] md:text-[15px] font-[600] text-gray-700  uppercase tracking-wider">Amount</th>
                          <th scope="col" className="px-6 py-3 text-left text-[14px] md:text-[15px] font-[600] text-gray-700  uppercase tracking-wider">Method</th>
                          <th scope="col" className="px-6 py-3 text-left text-[14px] md:text-[15px] font-[600] text-gray-700  uppercase tracking-wider">Account</th>
                          <th scope="col" className="px-6 py-3 text-left text-[14px] md:text-[15px] font-[600] text-gray-700  uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-6 py-3 text-left text-[14px] md:text-[15px] font-[600] text-gray-700  uppercase tracking-wider">Status</th>
                          <th scope="col" className="px-6 py-3 text-left text-[14px] md:text-[15px] font-[600] text-gray-700  uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentRequests.map((request) => (
                          <tr key={request._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {request.transactionId || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {request.amount} {request.currency}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                              {request.method}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {request.payeeAccount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {moment(request.date).format('DD MMM YYYY, h:mm A')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                  request.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                  request.status === 'success' ? 'bg-green-100 text-green-800' : 
                                  'bg-red-100 text-red-800'}`}>
                                {request.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                            
                                {request.status === 'pending' ?
                                 <>
                                     <button
                                  onClick={() => handleView(request)}
                                  className="p-2 bg-blue-500 cursor-pointer text-white rounded-md hover:bg-blue-600 transition-colors"
                                  title="View"
                                >
                                  <FaEye />
                                </button>
                                  <button
                                    onClick={() => openApproveModal(request)}
                                    className="p-2 bg-green-500 cursor-pointer text-white rounded-md hover:bg-green-600 transition-colors"
                                    title="Update Status"
                                  >
                                    <FaCheck />
                                  </button>
                          <button
  onClick={() => handleForwardRequest(request)}
  className="p-2 bg-orange-500 cursor-pointer text-white rounded-md hover:bg-orange-600 transition-colors"
  title="Forward to another agent"
  disabled={loading}
>
  <RiShareForwardLine />
</button>
                                 </>
                                :<span className='text-gray-500'>------------------</span>}
                              
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4 py-3 bg-white  border-gray-200 ">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to{' '}
                          <span className="font-medium">
                            {Math.min(currentPage * limit, filteredRequests.length)}
                          </span>{' '}
                          of <span className="font-medium">{filteredRequests.length}</span> results
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

export default Payoutrequest;