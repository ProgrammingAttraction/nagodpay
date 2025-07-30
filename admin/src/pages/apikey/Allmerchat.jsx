import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import logo from '../../assets/logo.png';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';

const Allmerchat = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [merchants, setMerchants] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    websiteUrl: '',
    withdrawCommission: '',
    depositCommission: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMerchants, setTotalMerchants] = useState(0);
  const itemsPerPage = 10;

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    fetchMerchants();
  }, [currentPage]);

  const fetchMerchants = async () => {
    try {
      const response = await axios.get(`${base_url}/api/admin/merchant-key`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          page: currentPage,
          limit: itemsPerPage
        }
      });
      setMerchants(response.data.merchants || response.data.merchant || []);
      setTotalMerchants(response.data.total || response.data.merchants?.length || 0);
      setTotalPages(Math.ceil((response.data.total || response.data.merchants?.length || 0) / itemsPerPage));
    } catch (error) {
      toast.error('Failed to fetch merchants');
      console.error('Error fetching merchants:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = (merchant) => {
    setFormData({
      name: merchant.name,
      email: merchant.email,
      websiteUrl: merchant.websiteUrl,
      withdrawCommission: merchant.withdrawCommission,
      depositCommission: merchant.depositCommission
    });
    setEditingId(merchant._id);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    try {
      // Validate commission values
      if (formData.withdrawCommission < 0 || formData.withdrawCommission > 100) {
        toast.error('Withdraw commission must be between 0 and 100');
        return;
      }
      if (formData.depositCommission < 0 || formData.depositCommission > 100) {
        toast.error('Deposit commission must be between 0 and 100');
        return;
      }

      const response = await axios.put(
        `${base_url}/api/admin/merchant-key/${editingId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      toast.success('Merchant updated successfully');
      setIsEditModalOpen(false);
      fetchMerchants();
    } catch (error) {
      if (error.response && error.response.data.error === 'Email already exists') {
        toast.error('Email already exists');
      } else {
        toast.error('Failed to update merchant');
      }
      console.error('Error updating merchant:', error);
    }
  };

  const handleDelete = (id) => {
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
          await axios.delete(`${base_url}/api/admin/merchant-key/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          toast.success('Merchant deleted successfully');
          fetchMerchants();
        } catch (error) {
          toast.error('Failed to delete merchant');
          console.error('Error deleting merchant:', error);
        }
      }
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <section className="font-nunito bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '8px',
            background: '#fff',
            color: '#333',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
        }}
      />
      
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main className={`transition-all duration-300 flex-1 p-6 ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
          {/* Merchants Table */}
          <div className="bg-white rounded-lg border-[1x] border-gray-300 p-6">
            <h2 className="text-xl font-semibold mb-4">Merchants</h2>
            <div className="overflow-x-auto border-[1px] border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr className='text-nowrap'>
                    <th className="px-6 py-3 text-left text-sm font-[700]  text-gray-700 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-sm font-[700]  text-gray-700 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-[700]  text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-[700]  text-gray-700 uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-3 text-left text-sm font-[700]  text-gray-700 uppercase tracking-wider">Getway Cost</th>
                    <th className="px-6 py-3 text-left text-sm font-[700]  text-gray-700 uppercase tracking-wider">Website URL</th>
                    <th className="px-6 py-3 text-left text-sm font-[700]  text-gray-700 uppercase tracking-wider">Deposit Commission</th>
                    <th className="px-6 py-3 text-left text-sm font-[700]  text-gray-700 uppercase tracking-wider">Withdraw Commission</th>
                    <th className="px-6 py-3 text-left text-sm font-[700]  text-gray-700 uppercase tracking-wider">API Key</th>
                    <th className="px-6 py-3 text-left text-sm font-[700]  text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {merchants.length > 0 ? (
                    merchants.map((merchant,i) => (
                      <tr key={merchant._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{i+1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{merchant?.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{merchant?.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm  font-[700] text-orange-600">{merchant?.balance} BDT</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm  font-[700] text-green-600">{merchant?.getwaycost} BDT</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <a href={merchant.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {merchant?.websiteUrl}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{merchant?.depositCommission}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{merchant?.withdrawCommission}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{merchant?.apiKey}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleEdit(merchant)}
                            className="mr-2 text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(merchant._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                        No merchants found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalMerchants)}</span> of{' '}
                <span className="font-medium">{totalMerchants}</span> merchants
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 border border-gray-200 cursor-pointer rounded-md ${currentPage === 1 ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 border border-gray-200 rounded-md cursor-pointer ${currentPage === page ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 border border-gray-200 cursor-pointer  rounded-md ${currentPage === totalPages ? 'bg-gray-100 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] bg-opacity-50 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Merchant</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                <input
                  type="url"
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Commission (%)</label>
                <input
                  type="number"
                  name="depositCommission"
                  value={formData.depositCommission}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Withdraw Commission (%)</label>
                <input
                  type="number"
                  name="withdrawCommission"
                  value={formData.withdrawCommission}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Allmerchat;