import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { format } from 'date-fns';
import { FaEye, FaTrashAlt, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';

const Approvedloan = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loans, setLoans] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const response = await axios.get(`${base_url}/api/admin/approved-loan-applications`);
        setLoans(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching loans:', error);
        toast.error('Failed to load loan applications');
        setLoading(false);
      }
    };

    fetchLoans();
  }, [base_url]);

  const viewDetails = (loan) => {
    setSelectedLoan(loan);
    setIsModalOpen(true);
  };

  const deleteTransaction = async (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${base_url}/api/loan/loan-applications/${id}`);
          setLoans(loans.filter(loan => loan._id !== id));
          Swal.fire(
            'Deleted!',
            'Loan application has been deleted.',
            'success'
          );
        } catch (error) {
          console.error('Error deleting loan:', error);
          Swal.fire(
            'Error!',
            'Failed to delete loan application.',
            'error'
          );
        }
      }
    });
  };

  const updateStatus = async (id, status) => {
    try {
      const { value: selectedStatus } = await Swal.fire({
        title: 'Update Loan Status',
        input: 'select',
        inputOptions: {
          'pending': 'Pending',
          'approved': 'Approved',
          'rejected': 'Rejected'
        },
        inputValue: status,
        inputPlaceholder: 'Select a status',
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value) {
            return 'You need to select a status!';
          }
        }
      });

      if (selectedStatus) {
        const response = await axios.put(`${base_url}/api/admin/loan-applications/${id}/status`, { 
          status: selectedStatus 
        });

        setLoans(loans.map(loan => 
          loan._id === id ? { ...loan, status: selectedStatus } : loan
        ));

        Swal.fire({
          title: 'Success!',
          text: 'Loan status updated successfully',
          icon: 'success',
          timer: 2000
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to update status',
        icon: 'error'
      });
    }
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(`${base_url}/${imageUrl}`);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  return (
    <section className="font-nunito h-screen">
      <Header toggleSidebar={toggleSidebar} />
      <Toaster position="top-right" />

      <div className="flex pt-[10vh] h-[90vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'ml-[17%]' : 'ml-0'
          }`}
        >
          <div className="bg-white px-2 py-4 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Approved Loan Applications</h2>
            
            <div className="overflow-x-auto rounded-lg overflow-hidden">
              <table className="min-w-full bg-white divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-600 to-blue-500">
                  <tr className='text-white'>
                    <th className="py-3 px-4 text-left font-semibold uppercase text-sm">User ID</th>
                    <th className="py-3 px-4 text-left font-semibold uppercase text-sm">Amount</th>
                    <th className="py-3 px-4 text-left font-semibold uppercase text-sm">Purpose</th>
                    <th className="py-3 px-4 text-left font-semibold uppercase text-sm">Duration</th>
                    <th className="py-3 px-4 text-left font-semibold uppercase text-sm">Status</th>
                    <th className="py-3 px-4 text-left font-semibold uppercase text-sm">Date</th>
                    <th className="py-3 px-4 text-left font-semibold uppercase text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loans.map((loan) => (
                    <tr key={loan._id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-700 text-sm">{loan?.user || 'N/A'}</td>
                      <td className="py-3 px-4 text-gray-700 text-sm">৳{loan.amount?.toFixed(2) || '0.00'}</td>
                      <td className="py-3 px-4 text-gray-700 text-sm capitalize">{loan.purpose || 'N/A'}</td>
                      <td className="py-3 px-4 text-gray-700 text-sm">{loan.duration || 'N/A'} months</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => updateStatus(loan._id, loan.status)}
                          className={`px-3 py-1 rounded text-xs capitalize focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                            loan.status === 'pending' ? 'bg-yellow-100 border border-yellow-300 text-yellow-800' :
                            loan.status === 'approved' ? 'bg-green-100 border border-green-300 text-green-800' :
                            'bg-red-100 border border-red-300 text-red-800'
                          }`}
                        >
                          {loan.status}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-gray-700 text-sm">
                        {format(new Date(loan.createdAt), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => viewDetails(loan)}
                            className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-full transition duration-200 shadow-sm"
                            title="View Details"
                          >
                            <FaEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteTransaction(loan._id)}
                            className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-full transition duration-200 shadow-sm"
                            title="Delete"
                          >
                            <FaTrash className="w-4 h-4" />
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

      {/* Loan Details Modal */}
      {isModalOpen && selectedLoan && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-800">Loan Application Details</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg text-gray-700 mb-3">Basic Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Loan ID</p>
                      <p className="font-medium text-gray-800">{selectedLoan._id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">User ID</p>
                      <p className="font-medium text-gray-800">{selectedLoan.user?._id || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="font-medium text-gray-800">৳{selectedLoan.amount?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Purpose</p>
                      <p className="font-medium text-gray-800 capitalize">{selectedLoan.purpose || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-medium text-gray-800">{selectedLoan.duration} months</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg text-gray-700 mb-3">Financial Details</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Total Payable</p>
                      <p className="font-medium text-gray-800">৳{selectedLoan.totalPayable?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Interest Rate</p>
                      <p className="font-medium text-gray-800">{selectedLoan.interestRate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className={`font-medium capitalize ${
                        selectedLoan.status === 'approved' ? 'text-green-600' :
                        selectedLoan.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {selectedLoan.status}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg text-gray-700 mb-3">Deposit Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Deposit Method</p>
                      <p className="font-medium text-gray-800">{selectedLoan.depositMethod || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Deposit Amount</p>
                      <p className="font-medium text-gray-800">৳{selectedLoan.depositAmount || '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Transaction ID</p>
                      <p className="font-medium text-gray-800">{selectedLoan.depositTransactionId || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Verified</p>
                      <p className={`font-medium ${
                        selectedLoan.depositVerified ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selectedLoan.depositVerified ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg text-gray-700 mb-3">NID Documents</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedLoan.nidFront && (
                      <div className="cursor-pointer" onClick={() => openImageModal(selectedLoan.nidFront)}>
                        <p className="text-sm text-gray-500 mb-1">Front Side</p>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <img 
                            src={`${base_url}/images/${selectedLoan.nidFront}`} 
                            alt="NID Front" 
                            className="w-full h-32 object-contain bg-gray-100"
                          />
                        </div>
                      </div>
                    )}
                    {selectedLoan.nidBack && (
                      <div className="cursor-pointer" onClick={() => openImageModal(selectedLoan.nidBack)}>
                        <p className="text-sm text-gray-500 mb-1">Back Side</p>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <img 
                            src={`${base_url}/images/${selectedLoan.nidBack}`} 
                            alt="NID Back" 
                            className="w-full h-32 object-contain bg-gray-100"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg text-gray-700 mb-3">Application Date</h4>
                  <p className="font-medium text-gray-800">
                    {format(new Date(selectedLoan.createdAt), 'MMMM dd, yyyy hh:mm a')}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl w-full">
            <button
              onClick={closeImageModal}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <FaTimes className="w-6 h-6" />
            </button>
            <img 
              src={selectedImage} 
              alt="Document Preview" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-xl"
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default Approvedloan;