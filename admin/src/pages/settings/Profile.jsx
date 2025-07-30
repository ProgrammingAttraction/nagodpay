import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import logo from '../../assets/logo.png';
import toast, { Toaster } from 'react-hot-toast';

const Profile = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const admin_info = JSON.parse(localStorage.getItem("userData"));
  const [formData, setFormData] = useState({ 
    username: '', 
    name: '',
    email: '', 
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${base_url}/api/admin/single-user/${admin_info._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success) {
          setUserData(response.data.user);
          setFormData({
            username: response.data.user.username,
            name: response.data.user.name,
            email: response.data.user.email,
            password: '' // Don't pre-fill password for security
          });
        } else {
          toast.error(response.data.message || 'Failed to fetch user data');
        }
      } catch (err) {
        toast.error('Failed to fetch user data');
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    let response;
    
    // Check if we're updating password
    if (formData.newPassword) {
      // Password update request
      if (formData.newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      
      response = await axios.put(
        `${base_url}/api/admin/users/${admin_info._id}/password`,
        { newPassword: formData.newPassword },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
    } else {
      // Regular profile update - prepare the data according to your route
      const profileData = {
        username: formData.username,
        name: formData.name,
        email: formData.email,
        identity: formData.identity,
        role: formData.role,
        status: formData.status,
        is_admin: formData.is_admin,
        withdracommission: formData.withdracommission,
        depositcommission: formData.depositcommission,
        paymentMethod: formData.paymentMethod,
        paymentbrand: formData.paymentbrand,
        currency: formData.currency
      };

      response = await axios.put(
        `${base_url}/api/admin/users/${admin_info._id}`,
        profileData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
    }
    
    if (response.data.success) {
      // Update user data in state and local storage
      if (response.data.data) { // For profile updates that return user data
        setUserData(response.data.data);
        localStorage.setItem('userData', JSON.stringify(response.data.data));
      }
      setEditMode(false);
      toast.success(response.data.message || 'Update successful!');
    }
  } catch (err) {
    // Handle duplicate key error specifically
    if (err.response?.data?.message === 'Username or email already exists') {
      toast.error('Username or email already in use');
    } else {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
    console.error('Update error:', err);
  }
};

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="loader"></div>
      </div>
    );
  }

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
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-theme py-4 px-6">
              <h1 className="text-2xl font-bold text-white">User Profile</h1>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 mb-4 rounded-full bg-white border-2 border-theme flex items-center justify-center shadow-sm">
                  <img src={logo} alt="Logo" className="w-16" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">{userData?.name || 'User'}</h2>
                <p className="text-gray-500">{userData?.email}</p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={editMode ? formData.username : userData?.username || ''}
                      onChange={handleInputChange}
                      readOnly={!editMode}
                      className={`block w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition duration-200 ${
                        editMode ? 'border-gray-300 bg-white focus:ring-theme' : 'border-gray-300 bg-gray-100'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={editMode ? formData.name : userData?.name || ''}
                      onChange={handleInputChange}
                      readOnly={!editMode}
                      className={`block w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition duration-200 ${
                        editMode ? 'border-gray-300 bg-white focus:ring-theme' : 'border-gray-300 bg-gray-100'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={editMode ? formData.email : userData?.email || ''}
                      onChange={handleInputChange}
                      readOnly={!editMode}
                      className={`block w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition duration-200 ${
                        editMode ? 'border-gray-300 bg-white focus:ring-theme' : 'border-gray-300 bg-gray-100'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      {editMode && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-xs text-theme hover:underline focus:outline-none"
                        >
                          {showPassword ? 'Hide' : 'Show'} Password
                        </button>
                      )}
                    </div>
                    <input
                      type={editMode && showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder={editMode ? "Enter new password" : "••••••••"}
                      readOnly={!editMode}
                      className={`block w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition duration-200 ${
                        editMode ? 'border-gray-300 bg-white focus:ring-theme' : 'border-gray-300 bg-gray-100'
                      }`}
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      {editMode ? "Leave blank to keep current password" : "For security reasons, password is hidden"}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  {editMode ? (
                    <>
                      <button
                        type="button"
                        onClick={toggleEditMode}
                        className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm cursor-pointer font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme transition duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-lg  bg-green-500 shadow-sm text-sm font-medium cursor-pointer text-white bg-theme hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme transition duration-200"
                      >
                        Save Changes
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={toggleEditMode}
                      className="px-4 py-2 border border-transparent rounded-lg shadow-sm  text-sm cursor-pointer font-medium cursor-pointer text-white bg-theme bg-green-500 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme transition duration-200"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        .loader {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #1946c4;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
};

export default Profile;