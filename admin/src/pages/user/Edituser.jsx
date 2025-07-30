import React, { useState, useEffect } from 'react';
import Header from "../../components/Header";
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaEye, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaSave, FaTimes, FaPlus, FaUser, FaWallet, FaMoneyBillWave, FaPercentage, FaSearch, FaKey } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';

const Edituser = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const { id } = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [agentData, setAgentData] = useState(null);
  const [bankaccount, setBankaccount] = useState([]);
  const [payinTransactions, setPayinTransactions] = useState([]);
  const [payoutTransactions, setPayoutTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAccount, setEditingAccount] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [searchPayin, setSearchPayin] = useState('');
  const [searchPayout, setSearchPayout] = useState('');
  const [newBalance, setNewBalance] = useState(0);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userInfo, setUserInfo] = useState({
    name: '',
    email: '',
    withdracommission: 0,
    depositcommission: 0,
    paymentMethod: '',
    paymentbrand: ''
  });
  const token = localStorage.getItem('authToken');
  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const fetchAgentData = async () => {
    try {
      const [userResponse, payinResponse, payoutResponse] = await Promise.all([
        axios.get(`${base_url}/api/admin/single-user/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${base_url}/api/admin/single-user-payin/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${base_url}/api/admin/single-user-payin/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      if (userResponse.data.success) {
        setAgentData(userResponse.data.user);
        setBankaccount(userResponse.data.bankaccount);
        setUserInfo({
          name: userResponse.data.user.name,
          email: userResponse.data.user.email,
          withdracommission: userResponse.data.user.withdracommission,
          depositcommission: userResponse.data.user.depositcommission,
          paymentMethod: userResponse.data.user.paymentMethod,
          paymentbrand: userResponse.data.user.paymentbrand
        });
        setNewBalance(userResponse.data.user.balance);
      } else {
        Swal.fire('Error', userResponse.data.message, 'error');
        navigate(-1);
      }

      if (payinResponse.data) {
        setPayinTransactions(payinResponse.data.payin);
      }

      if (payoutResponse.data) {
        setPayoutTransactions(payoutResponse.data.payout);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire('Error', 'Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentData();
  }, [id, base_url, token, navigate]);

  const handleStatusChange = async (accountId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const response = await axios.put(
        `${base_url}/api/admin/bank-account-status/${accountId}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        Swal.fire('Success', 'Account status updated successfully', 'success');
        fetchAgentData();
      } else {
        Swal.fire('Error', response.data.message, 'error');
      }
    } catch (error) {
      console.error('Error updating account status:', error);
      Swal.fire('Error', 'Failed to update account status', 'error');
    }
  };

  const handleDeleteAccount = async (accountId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.delete(
          `${base_url}/api/admin/delete-bank-account/${accountId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          Swal.fire('Deleted!', 'Account has been deleted.', 'success');
          fetchAgentData();
        } else {
          Swal.fire('Error', response.data.message, 'error');
        }
      } catch (error) {
        console.error('Error deleting account:', error);
        Swal.fire('Error', 'Failed to delete account', 'error');
      }
    }
  };

  const handleEditAccount = (account) => {
    setEditingAccount(account);
    setIsEditModalOpen(true);
  };

  const handleSaveAccount = async (updatedData) => {
    try {
      let response;
      if (editingAccount._id) {
        response = await axios.put(
          `${base_url}/api/admin/update-bank-account/${editingAccount._id}`,
          updatedData,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      } else {
        response = await axios.post(
          `${base_url}/api/admin/add-bank-account`,
          updatedData,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      }

      if (response.data.success) {
        Swal.fire('Success', editingAccount._id ? 'Account updated successfully' : 'Account added successfully', 'success');
        setIsEditModalOpen(false);
        fetchAgentData();
      } else {
        Swal.fire('Error', response.data.message, 'error');
      }
    } catch (error) {
      console.error('Error saving account:', error);
      Swal.fire('Error', error.response?.data?.message || 'Failed to save account', 'error');
    }
  };

  const handleUpdateBalance = async () => {
    try {
      const response = await axios.put(
        `${base_url}/api/admin/users/${id}/balance`,
        { balance: parseFloat(newBalance) },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        Swal.fire('Success', 'Balance updated successfully', 'success');
        setIsBalanceModalOpen(false);
        fetchAgentData();
      } else {
        Swal.fire('Error', response.data.message, 'error');
      }
    } catch (error) {
      console.error('Error updating balance:', error);
      Swal.fire('Error', 'Failed to update balance', 'error');
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      Swal.fire('Error', 'Passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 6) {
      Swal.fire('Error', 'Password must be at least 6 characters', 'error');
      return;
    }

    try {
      const response = await axios.put(
        `${base_url}/api/admin/users/${id}/password`,
        { newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        Swal.fire('Success', 'Password updated successfully', 'success');
        setIsPasswordModalOpen(false);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Swal.fire('Error', response.data.message, 'error');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      Swal.fire('Error', 'Failed to update password', 'error');
    }
  };

  const handleUpdateInfo = async () => {
    try {
      const response = await axios.put(
        `${base_url}/api/admin/users/${id}`,
        userInfo,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        Swal.fire('Success', 'User information updated successfully', 'success');
        setIsInfoModalOpen(false);
        fetchAgentData();
      } else {
        Swal.fire('Error', response.data.message, 'error');
      }
    } catch (error) {
      console.error('Error updating user info:', error);
      Swal.fire('Error', 'Failed to update user information', 'error');
    }
  };

  const handleOnlineStatusChange = async () => {
    const newStatus = agentData.currentstatus === 'online' ? 'offline' : 'online';
    
    try {
      const response = await axios.put(
        `${base_url}/api/admin/user-currentstatus/${id}`,
        { currentstatus: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        Swal.fire('Success', 'Online status updated successfully', 'success');
        setAgentData(prev => ({
          ...prev,
          currentstatus: newStatus
        }));
      } else {
        Swal.fire('Error', response.data.message, 'error');
      }
    } catch (error) {
      console.error('Error updating online status:', error);
      Swal.fire('Error', 'Failed to update online status', 'error');
    }
  };

  const filteredPayin = payinTransactions.filter(transaction => 
    transaction.paymentId?.toLowerCase().includes(searchPayin.toLowerCase()) ||
    transaction.payerAccount?.toLowerCase().includes(searchPayin.toLowerCase()) ||
    transaction.status?.toLowerCase().includes(searchPayin.toLowerCase()) ||
    transaction.transactionId?.toLowerCase().includes(searchPayin.toLowerCase())
  );

  const filteredPayout = payoutTransactions.filter(transaction => 
    transaction.paymentId?.toLowerCase().includes(searchPayout.toLowerCase()) ||
    transaction.payeeAccount?.toLowerCase().includes(searchPayout.toLowerCase()) ||
    transaction.status?.toLowerCase().includes(searchPayout.toLowerCase()) ||
    transaction.transactionId?.toLowerCase().includes(searchPayout.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatCurrency = (amount, currency = 'BDT') => {
    return `${amount?.toFixed(2) || '0.00'} ${currency}`;
  };

  const StatusBadge = ({ status }) => {
    let bgColor = 'bg-gray-100';
    let textColor = 'text-gray-800';

    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        break;
      case 'pending':
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        break;
      case 'failed':
      case 'rejected':
        bgColor = 'bg-red-100';
        textColor = 'text-red-800';
        break;
      case 'processing':
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-800';
        break;
      default:
        break;
    }
// ---------------disabled-bank-account--------------------------
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor} capitalize`}>
        {status || 'N/A'}
      </span>
    );
  };

  if (loading) {
    return (
      <section className="font-nunito h-screen bg-gray-50">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh] h-[90vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </main>
        </div>
      </section>
    );
  }

  if (!agentData) {
    return (
      <section className="font-nunito h-screen bg-gray-50">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh] h-[90vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
            <div className="text-center py-10">
              <h3 className="text-lg font-medium text-gray-700">No agent data found</h3>
            </div>
          </main>
        </div>
      </section>
    );
  }

  return (
    <section className="font-nunito bg-gray-50">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
          <div className="px-2 py-4 space-y-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Agent Profile</h2>
              <div className="flex items-center">
                <span className="mr-2 text-sm font-medium text-gray-700">
                  {agentData?.currentstatus === 'online' ? 'Online' : 'Offline'}
                </span>
                <button
                  onClick={handleOnlineStatusChange}
                  className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    agentData?.currentstatus === 'online' ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`${
                      agentData?.currentstatus === 'online' ? 'translate-x-6' : 'translate-x-1'
                    } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                  />
                </button>
              </div>
            </div>

            {/* Agent Profile Card */}
            <div className="bg-white rounded-lg border-[1px] border-gray-200 p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                    <FaUser className="text-blue-500 text-3xl" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">Basic Information</h3>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600"><span className="font-medium">Name:</span> {agentData.name}</p>
                        <p className="text-sm text-gray-600"><span className="font-medium">Username:</span> {agentData.username}</p>
                        <p className="text-sm text-gray-600"><span className="font-medium">Email:</span> {agentData.email}</p>
                        <p className="text-sm text-gray-600"><span className="font-medium">Status:</span> 
                          <span className={`ml-1 px-2 py-1 rounded-full text-xs ${agentData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {agentData.status}
                          </span>
                        </p>
                        <button
                          onClick={() => setIsInfoModalOpen(true)}
                          className="mt-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm flex items-center"
                        >
                          <FaEdit className="mr-1" /> Edit Info
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">Financial Details</h3>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600 flex items-center">
                          <FaWallet className="mr-2 text-blue-500" />
                          <span className="font-medium">Balance:</span> {formatCurrency(agentData.balance, agentData.currency)}
                        </p>
                        <button
                          onClick={() => setIsBalanceModalOpen(true)}
                          className="mt-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm flex items-center"
                        >
                          <FaEdit className="mr-1" /> Update Balance
                        </button>
                         <p className="text-sm text-gray-600 flex items-center">
                                       <div className='flex flex-col gap-1'>
                                              <span className=" flex justify-start gap-1 font-[700]"> <FaMoneyBillWave className="mr-2 text-blue-500" /> Payment Method:</span>
                                          {agentData.paymentMethod?.map((data)=>{
                                            return(
                                              <span className="font-medium pl-[30px]">{data}</span>
                                            )
                                          })}
                                       </div>
                                        </p>
                        <p className="text-sm text-gray-600 flex items-center">
                          <FaPercentage className="mr-2 text-blue-500" />
                          <span className="font-medium">Deposit Commission:</span> {agentData.depositcommission}%
                        </p>
                        <p className="text-sm text-gray-600 flex items-center">
                          <FaPercentage className="mr-2 text-blue-500" />
                          <span className="font-medium">Withdraw Commission:</span> {agentData.withdracommission}%
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">Activity</h3>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Registered:</span> {formatDate(agentData.createdAt)}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Last Updated:</span> {formatDate(agentData.updatedAt)}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Under Deposit:</span> {formatCurrency(agentData.uderdeposit, agentData.currency)}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Under Withdraw:</span> {formatCurrency(agentData.underwithdraw, agentData.currency)}
                        </p>
                        <button
                          onClick={() => setIsPasswordModalOpen(true)}
                          className="mt-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm flex items-center"
                        >
                          <FaKey className="mr-1" /> Reset Password
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Accounts Table */}
            <div className="bg-white rounded-lg border-[1px] border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Agent Accounts</h3>
                <div className="flex items-center">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mr-4">
                    Total: {bankaccount.length}
                  </span>
                  {/* <button 
                    onClick={() => {
                      setEditingAccount({
                        provider: agentData.paymentMethod,
                        accountNumber: '',
                        shopName: '',
                        username: '',
                        password: '',
                        appKey: '',
                        appSecretKey: '',
                        publicKey: '',
                        privateKey: '',
                        walletType: 'personal',
                        status: 'active',
                        user_id: id
                      });
                      setIsEditModalOpen(true);
                    }}
                    className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm flex items-center"
                  >
                    <FaPlus className="mr-1" /> Add Account
                  </button> */}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Provider
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Account Number
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shop Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Wallet Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bankaccount.map((account) => (
                      <tr key={account._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {account.provider}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {account.accountNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {account.shopName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {account.walletType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleStatusChange(account._id, account.status)}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                              account.status === 'active' ? 'bg-green-500' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`${
                                account.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                              } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                            />
                          </button>
                          <span className="ml-2 text-sm text-gray-600 capitalize">
                            {account.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(account.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-3">
                            <button 
                              onClick={() => handleEditAccount(account)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50"
                              title="Edit"
                            >
                              <FaEdit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteAccount(account._id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50"
                              title="Delete"
                            >
                              <FaTrash className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {bankaccount.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No bank accounts found</p>
                </div>
              )}
            </div>

        
          </div>
        </main>
          {/* Balance Update Modal */}
          {isBalanceModalOpen && (
            <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] bg-opacity-50 flex items-center justify-center z-[10000]">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Update Balance</h3>
                  <button onClick={() => setIsBalanceModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                    <FaTimes />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Balance</label>
                    <input
                      type="text"
                      value={formatCurrency(agentData.balance, agentData.currency)}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Balance</label>
                    <input
                      type="number"
                      value={newBalance}
                      onChange={(e) => setNewBalance(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setIsBalanceModalOpen(false)}
                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateBalance}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Password Update Modal */}
          {isPasswordModalOpen && (
            <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] bg-opacity-50 flex items-center justify-center z-[1000]">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Reset Password</h3>
                  <button onClick={() => setIsPasswordModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                    <FaTimes />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Confirm new password"
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setIsPasswordModalOpen(false)}
                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-md"
                    >
                      Cancel
                    </button>
      <button
                    onClick={handleUpdatePassword}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Info Update Modal */}
        {isInfoModalOpen && (
          <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] bg-opacity-50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Update User Information</h3>
                <button onClick={() => setIsInfoModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <FaTimes />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={userInfo.name}
                    onChange={(e) => setUserInfo({...userInfo, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo({...userInfo, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Commission (%)</label>
                  <input
                    type="number"
                    value={userInfo.depositcommission}
                    onChange={(e) => setUserInfo({...userInfo, depositcommission: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Withdraw Commission (%)</label>
                  <input
                    type="number"
                    value={userInfo.withdracommission}
                    onChange={(e) => setUserInfo({...userInfo, withdracommission: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <input
                    type="text"
                    value={userInfo.paymentMethod}
                    onChange={(e) => setUserInfo({...userInfo, paymentMethod: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Brand</label>
                  <input
                    type="text"
                    value={userInfo.paymentbrand}
                    onChange={(e) => setUserInfo({...userInfo, paymentbrand: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsInfoModalOpen(false)}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateInfo}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bank Account Edit/Add Modal */}
 {isEditModalOpen && (
  <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] bg-opacity-50 flex items-center justify-center z-[1000]">
    <div className="bg-white rounded-lg p-6 w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {editingAccount._id ? 'Edit Account' : 'Add New Account'}
        </h3>
        <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-700">
          <FaTimes />
        </button>
      </div>
      <div className="space-y-4">
        {/* Provider - Payment Method Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Provider - Payment Method</label>
          <select
            value={editingAccount.provider}
            onChange={(e) => setEditingAccount({...editingAccount, provider: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select Provider Payment Method</option>
            {agentData?.paymentMethod?.map((method) => (
              <option key={method} value={method}>
                {agentData?.username} ({method})
              </option>
            ))}
          </select>
        </div>

        {/* Account Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
          <input
            type="text"
            value={editingAccount.accountNumber}
            onChange={(e) => setEditingAccount({...editingAccount, accountNumber: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="01XXXXXXXXX (11 digits)"
            maxLength="11"
            readOnly={!!editingAccount._id}
          />
        </div>

        {/* Shop Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
          <input
            type="text"
            value={editingAccount.shopName}
            onChange={(e) => setEditingAccount({...editingAccount, shopName: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="My Shop"
          />
        </div>

        {/* Fields for Bkash P2C */}
        {editingAccount.provider === 'Bkash P2C' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={editingAccount.username}
                onChange={(e) => setEditingAccount({...editingAccount, username: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="text"
                value={editingAccount.password}
                onChange={(e) => setEditingAccount({...editingAccount, password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App Key</label>
              <input
                type="text"
                value={editingAccount.appKey}
                onChange={(e) => setEditingAccount({...editingAccount, appKey: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="App Key"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App Secret Key</label>
              <input
                type="text"
                value={editingAccount.appSecretKey}
                onChange={(e) => setEditingAccount({...editingAccount, appSecretKey: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="App Secret Key"
              />
            </div>
          </>
        )}

        {/* Fields for Nagad P2C */}
        {editingAccount.provider === 'Nagad P2C' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Public Key</label>
              <input
                type="text"
                value={editingAccount.publicKey}
                onChange={(e) => setEditingAccount({...editingAccount, publicKey: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Public Key"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Private Key</label>
              <input
                type="text"
                value={editingAccount.privateKey}
                onChange={(e) => setEditingAccount({...editingAccount, privateKey: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Private Key"
              />
            </div>
          </>
        )}

        {/* Wallet Type for all methods */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Type</label>
          <select
            value={editingAccount.walletType}
            onChange={(e) => setEditingAccount({...editingAccount, walletType: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="personal">Personal</option>
            <option value="business">Business</option>
            {/* Additional wallet types if needed */}
            <option value="M Plush">M Plush</option>
            <option value="Daily 300K">Daily 300K</option>
            <option value="Daily 30K">Daily 30K</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={editingAccount.status}
            onChange={(e) => setEditingAccount({...editingAccount, status: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setIsEditModalOpen(false)}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSaveAccount(editingAccount)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
)}
        </div>
              </section>
    
    );
};

export default Edituser;