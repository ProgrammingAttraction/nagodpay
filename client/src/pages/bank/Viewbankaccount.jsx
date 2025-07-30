import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { FaEye, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { useUser } from '../../context/UserContext';
import { useParams, useNavigate } from 'react-router-dom';

const Viewbankaccount = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bankAccount, setBankAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editForm, setEditForm] = useState({
    provider: '',
    accountNumber: '',
    shopName: '',
    username: '',
    password: '',
    appKey: '',
    appSecretKey: '',
    publicKey: '',
    privateKey: '',
    walletType: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData } = useUser();
  const token = localStorage.getItem('authToken');

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  useEffect(() => {
    const fetchBankAccount = async () => {
      try {
        const response = await axios.get(`${base_url}/api/user/bank-account/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          setBankAccount(response.data.data);
          setEditForm({
            provider: response.data.data.provider,
            accountNumber: response.data.data.accountNumber,
            shopName: response.data.data.shopName,
            username: response.data.data.username || '',
            password: response.data.data.password || '',
            appKey: response.data.data.appKey || '',
            appSecretKey: response.data.data.appSecretKey || '',
            publicKey: response.data.data.publicKey || '',
            privateKey: response.data.data.privateKey || '',
            walletType: response.data.data.walletType || ''
          });
        } else {
          setError(response.data.message || 'Failed to fetch bank account');
        }
      } catch (error) {
        setError(error.response?.data?.message || 'An error occurred while fetching the bank account');
        console.error('Error fetching bank account:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBankAccount();
  }, [id, base_url, token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `${base_url}/api/user/update-bank-account/${id}`,
        editForm,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setBankAccount(response.data.data);
        setSuccessMessage('Bank account updated successfully!');
        setIsEditing(false);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.data.message || 'Failed to update bank account');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred while updating the bank account');
      console.error('Error updating bank account:', error);
    }
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <section className="flex h-screen font-fira overflow-hidden bg-gray-100">
        <div className="shrink-0 h-screen overflow-y-auto overflow-x-hidden bg-white border-r">
          <Sidebar isOpen={sidebarOpen} />
        </div>
        <section className="flex-1 w-full h-screen overflow-y-auto">
          <Header toggleSidebar={toggleSidebar} />
          <div className="p-5">
            <h2 className="text-2xl font-semibold mb-5">Banking Information</h2>
            <p>Loading...</p>
          </div>
        </section>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex h-screen font-fira overflow-hidden bg-gray-100">
        <div className="shrink-0 h-screen overflow-y-auto overflow-x-hidden bg-white border-r">
          <Sidebar isOpen={sidebarOpen} />
        </div>
        <section className="flex-1 w-full h-screen overflow-y-auto">
          <Header toggleSidebar={toggleSidebar} />
          <div className="p-5">
            <h2 className="text-2xl font-semibold mb-5">Banking Information</h2>
            <p className="text-red-500">{error}</p>
          </div>
        </section>
      </section>
    );
  }

  if (!bankAccount) {
    return (
      <section className="flex h-screen font-fira overflow-hidden bg-gray-100">
        <div className="shrink-0 h-screen overflow-y-auto overflow-x-hidden bg-white border-r">
          <Sidebar isOpen={sidebarOpen} />
        </div>
        <section className="flex-1 w-full h-screen overflow-y-auto">
          <Header toggleSidebar={toggleSidebar} />
          <div className="p-5">
            <h2 className="text-2xl font-semibold mb-5">Banking Information</h2>
            <p>No bank account found</p>
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
          <h2 className="text-2xl font-semibold mb-5">Banking Information</h2>

          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Account Details</h3>
              <button
                onClick={toggleEdit}
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 flex items-center"
              >
                {isEditing ? <FaTimes className="mr-1" /> : <FaEdit className="mr-1" />}
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {!isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Provider</label>
                  <p className="text-gray-900">{bankAccount.provider}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Account Number</label>
                  <p className="text-gray-900">{bankAccount.accountNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Shop Name</label>
                  <p className="text-gray-900">{bankAccount.shopName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Username</label>
                  <p className="text-gray-900">{bankAccount.username || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Password</label>
                  <p className="text-gray-900">{bankAccount.password ? '••••••••' : 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">App Key</label>
                  <p className="text-gray-900">{bankAccount.appKey || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">App Secret Key</label>
                  <p className="text-gray-900">{bankAccount.appSecretKey || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Public Key</label>
                  <p className="text-gray-900">{bankAccount.publicKey || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Private Key</label>
                  <p className="text-gray-900">{bankAccount.privateKey || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Wallet Type</label>
                  <p className="text-gray-900">{bankAccount.walletType || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                  <p className={`text-gray-900 ${bankAccount.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                    {bankAccount.status}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Created At</label>
                  <p className="text-gray-900">{formatDate(bankAccount.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Updated At</label>
                  <p className="text-gray-900">{formatDate(bankAccount.updatedAt)}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provider
                    </label>
                    <input
                      type="text"
                      name="provider"
                      value={editForm.provider}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded border-gray-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number
                    </label>
                    <input
                      type="text"
                      name="accountNumber"
                      value={editForm.accountNumber}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded border-gray-200"
                      required
                      pattern="01\d{9}"
                      title="Must be 11 digits starting with 01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shop Name
                    </label>
                    <input
                      type="text"
                      name="shopName"
                      value={editForm.shopName}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded border-gray-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={editForm.username}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded border-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={editForm.password}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded border-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      App Key
                    </label>
                    <input
                      type="text"
                      name="appKey"
                      value={editForm.appKey}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded border-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      App Secret Key
                    </label>
                    <input
                      type="text"
                      name="appSecretKey"
                      value={editForm.appSecretKey}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded border-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Public Key
                    </label>
                    <input
                      type="text"
                      name="publicKey"
                      value={editForm.publicKey}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded border-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Private Key
                    </label>
                    <input
                      type="text"
                      name="privateKey"
                      value={editForm.privateKey}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded border-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wallet Type
                    </label>
                    <input
                      type="text"
                      name="walletType"
                      value={editForm.walletType}
                      onChange={handleInputChange}
                      className="w-full p-2 border rounded border-gray-200"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
                >
                  <FaSave className="mr-1" /> Save Changes
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </section>
  );
};

export default Viewbankaccount;