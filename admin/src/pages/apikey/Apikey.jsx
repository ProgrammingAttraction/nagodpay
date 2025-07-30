import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import logo from '../../assets/logo.png';
import toast, { Toaster } from 'react-hot-toast';
import Swal from 'sweetalert2';

const Apikey = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [merchants, setMerchants] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    websiteUrl: '',
    withdrawCommission: '',
    depositCommission: ''
  });
  const [editingId, setEditingId] = useState(null);
  
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      const response = await axios.get(`${base_url}/api/admin/merchant-key`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setMerchants(response.data.merchants || response.data.merchant || []);
    } catch (error) {
      toast.error('Failed to fetch merchants');
      console.error('Error fetching merchants:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate password length if creating new merchant
      if (!editingId && formData.password.length < 6) {
        return toast.error('Password must be at least 6 characters');
      }

      // Validate commission values
      if (isNaN(formData.withdrawCommission)) {
        return toast.error('Withdraw commission must be a number');
      }
      if (isNaN(formData.depositCommission)) {
        return toast.error('Deposit commission must be a number');
      }
      // Convert commission values to numbers
      const payload = {
        ...formData,
        withdrawCommission: parseFloat(formData.withdrawCommission),
        depositCommission: parseFloat(formData.depositCommission)
      };

      if (editingId) {
        // Update existing merchant - exclude password unless it's being changed
        if (!payload.password) {
          delete payload.password;
        }
        
        await axios.put(`${base_url}/api/admin/merchant-key/${editingId}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        toast.success('Merchant updated successfully');
      } else {
        // Create new merchant
        await axios.post(`${base_url}/api/admin/merchant-key`, payload, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        toast.success('Merchant created successfully');
      }
      setFormData({ 
        name: '', 
        email: '', 
        password: '', 
        websiteUrl: '', 
        withdrawCommission: '', 
        depositCommission: '' 
      });
      setEditingId(null);
      fetchMerchants();
    } catch (error) {
      if (error.response && error.response.status === 400) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Server error');
      }
      console.error('Error submitting form:', error);
    }
  };

  const handleEdit = (merchant) => {
    setFormData({
      name: merchant.name,
      email: merchant.email,
      password: '', // Don't pre-fill password for security
      websiteUrl: merchant.websiteUrl,
      withdrawCommission: merchant.withdrawCommission?.toString() || '',
      depositCommission: merchant.depositCommission?.toString() || ''
    });
    setEditingId(merchant._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  return (
    <section className="font-nunito w-full bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
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

      <div className="flex pt-[10vh] w-full">
        <Sidebar isOpen={isSidebarOpen} />

        <main className={`transition-all duration-300 flex-1 p-6 ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
          {/* Merchant Form */}
          <div className="bg-white rounded-lg border-[1x] border-gray-300 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Update Merchant' : 'Create New Merchant'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingId ? 'New Password (leave blank to keep current)' : 'Password'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={!editingId}
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                  <input
                    type="url"
                    name="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Withdraw Commission (%)</label>
                  <input
                    type="number"
                    name="withdrawCommission"
                    value={formData.withdrawCommission}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    step="0.01"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Commission (%)</label>
                  <input
                    type="number"
                    name="depositCommission"
                    value={formData.depositCommission}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    step="0.01"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ 
                        name: '', 
                        email: '', 
                        password: '', 
                        websiteUrl: '', 
                        withdrawCommission: '', 
                        depositCommission: '' 
                      });
                      setEditingId(null);
                    }}
                    className="mr-2 px-4 py-2 bg-gray-500 cursor-pointer text-white rounded-md hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 cursor-pointer text-white rounded-md hover:bg-blue-700 transition"
                >
                  {editingId ? 'Update Merchant' : 'Create Merchant'}
                </button>
              </div>
            </form>
          </div>

          <div className='w-full overflow-x-auto'>
            {/* Merchants Table */}
            <div className="bg-white rounded-lg border-[1x] border-gray-300 p-6">
              <h2 className="text-xl font-semibold mb-4">Merchants</h2>
              <div className="overflow-x-auto border-[1px] border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Website URL</th>
                      <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Withdraw Commission</th>
                      <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Deposit Commission</th>
                      <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">API Key</th>
                      <th className="px-6 py-3 text-left text-sm font-[700] text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {merchants.length > 0 ? (
                      merchants.map((merchant) => (
                        <tr key={merchant._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{merchant.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{merchant.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <a href={merchant.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {merchant.websiteUrl}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{merchant.withdrawCommission}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{merchant.depositCommission}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{merchant.apiKey}</td>
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
                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                          No merchants found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
};

export default Apikey;