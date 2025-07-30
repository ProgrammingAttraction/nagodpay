import React, { useState, useEffect } from 'react';
import Header from "../../components/Header";
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaEye, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaSave, FaTimes, FaPlus, FaUser, FaWallet, FaMoneyBillWave, FaPercentage, FaSearch } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';

const Viewuser = () => {
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
  const [searchPayin, setSearchPayin] = useState('');
  const [searchPayout, setSearchPayout] = useState('');
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
// ------------------offline-or-online-status------------------------

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

  return (
    <section className="font-nunito  bg-gray-50">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh] ">
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
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-700">Financial Details</h3>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600 flex items-center">
                          <FaWallet className="mr-2 text-blue-500" />
                          <span className="font-medium">Balance:</span> {formatCurrency(agentData.balance, agentData.currency)}
                        </p>
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
            {/* Payin Transactions Table */}
            <div className="bg-white rounded-lg border-[1px] border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Deposit Transactions</h3>
                <div className="flex items-center">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mr-4">
                    Total: {payinTransactions.length}
                  </span>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search deposits..."
                      className="pl-8 pr-4 py-1 border border-gray-200 outline-blue-500 rounded-md text-sm"
                      value={searchPayin}
                      onChange={(e) => setSearchPayin(e.target.value)}
                    />
                    <FaSearch className="absolute left-3 top-2 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payer Account</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayin.length > 0 ? (
                      filteredPayin.map((transaction) => (
                        <tr key={transaction._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {transaction.paymentId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.payerAccount || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(transaction.receivedAmount || transaction.expectedAmount, transaction.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={transaction.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.transactionId || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(transaction.transactionDate || transaction.createdAt)}
                          </td>
                     
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                          No deposit transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payout Transactions Table */}
            <div className="bg-white rounded-lg border-[1px] border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Withdrawal Transactions</h3>
                <div className="flex items-center">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mr-4">
                    Total: {payoutTransactions.length}
                  </span>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search withdrawals..."
                      className="pl-8 pr-4 py-1 border  outline-blue-500  border-gray-200 rounded-md text-sm"
                      value={searchPayout}
                      onChange={(e) => setSearchPayout(e.target.value)}
                    />
                    <FaSearch className="absolute left-3 top-2 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payee Account</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayout.length > 0 ? (
                      filteredPayout.map((transaction) => (
                        <tr key={transaction._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {transaction.paymentId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.payeeAccount || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(transaction.sentAmount || transaction.requestAmount, transaction.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={transaction.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction.transactionId || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(transaction.transactionDate || transaction.createdAt)}
                          </td>
                          
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                          No withdrawal transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Edit Bank Account Modal */}
          {isEditModalOpen && (
            <EditBankAccountModal
              account={editingAccount}
              onClose={() => setIsEditModalOpen(false)}
              onSave={handleSaveAccount}
              isNew={!editingAccount?._id}
              paymentMethod={editingAccount?.provider}
            />
          )}
        </main>
      </div>
    </section>
  );
};

const EditBankAccountModal = ({ account, onClose, onSave, isNew, paymentMethod }) => {
  const [formData, setFormData] = useState({
    provider: account?.provider || '',
    accountNumber: account?.accountNumber || '',
    shopName: account?.shopName || '',
    username: account?.username || '',
    password: account?.password || '',
    appKey: account?.appKey || '',
    appSecretKey: account?.appSecretKey || '',
    publicKey: account?.publicKey || '',
    privateKey: account?.privateKey || '',
    walletType: account?.walletType || 'personal',
    status: account?.status || 'active',
    user_id: account?.user_id || ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (account) {
      setFormData({
        provider: account.provider || '',
        accountNumber: account.accountNumber || '',
        shopName: account.shopName || '',
        username: account.username || '',
        password: account.password || '',
        appKey: account.appKey || '',
        appSecretKey: account.appSecretKey || '',
        publicKey: account.publicKey || '',
        privateKey: account.privateKey || '',
        walletType: account.walletType || 'personal',
        status: account.status || 'active',
        user_id: account.user_id || ''
      });
    }
  }, [account]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.provider) {
      newErrors.provider = 'Provider is required';
    }
    
    if (!formData.accountNumber) {
      newErrors.accountNumber = 'Account number is required';
    } else if (!/^01\d{9}$/.test(formData.accountNumber)) {
      newErrors.accountNumber = 'Invalid account number format. Must be 11 digits starting with 01';
    }
    
    if (!formData.shopName) {
      newErrors.shopName = 'Shop name is required';
    }
    
    if (formData.provider === 'Bkash P2C') {
      if (!formData.username) newErrors.username = 'Username is required';
      if (!formData.password) newErrors.password = 'Password is required';
      if (!formData.appKey) newErrors.appKey = 'App key is required';
      if (!formData.appSecretKey) newErrors.appSecretKey = 'App secret key is required';
    }
    
    if (formData.provider === 'Nagad P2C') {
      if (!formData.publicKey) newErrors.publicKey = 'Public key is required';
      if (!formData.privateKey) newErrors.privateKey = 'Private key is required';
    }
    
    if ((formData.provider === 'Bkash P2P' || formData.provider === 'Nagad P2P') && !formData.walletType) {
      newErrors.walletType = 'Wallet type is required for P2P methods';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    onSave(formData)
      .finally(() => setIsSubmitting(false));
  };

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] bg-opacity-50 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center border-b pb-4 border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800">
              {isNew ? 'Add New Bank Account' : 'Edit Bank Account'}
            </h3>
            <button onClick={onClose} className="text-gray-500 cursor-pointer hover:text-gray-700">
              <FaTimes className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-700">Provider - Payment Method</label>
              <input
                type="text"
                className="border rounded px-3 py-2 text-sm border-gray-200 bg-gray-100"
                value={paymentMethod}
                readOnly
              />
              <input type="hidden" name="provider" value={paymentMethod} />
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-700">Account Number</label>
              <input
                type="text"
                className={`border rounded px-3 py-2 text-sm border-gray-200 outline-theme ${errors.accountNumber ? 'border-red-500' : ''}`}
                placeholder="01XXXXXXXXX (11 digits)"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                maxLength="11"
              />
              {errors.accountNumber && <span className="text-red-500 text-xs mt-1">{errors.accountNumber}</span>}
            </div>

            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-700">Shop Name</label>
              <input
                type="text"
                className={`border rounded px-3 py-2 text-sm border-gray-200 ${errors.shopName ? 'border-red-500' : ''}`}
                placeholder="My Shop"
                name="shopName"
                value={formData.shopName}
                onChange={handleChange}
              />
              {errors.shopName && <span className="text-red-500 text-xs mt-1">{errors.shopName}</span>}
            </div>

            {/* Fields for Bkash P2C */}
            {paymentMethod === 'Bkash P2C' && (
              <>
                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    className={`border rounded px-3 py-2 text-sm border-gray-200 ${errors.username ? 'border-red-500' : ''}`}
                    placeholder="Username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                  />
                  {errors.username && <span className="text-red-500 text-xs mt-1">{errors.username}</span>}
                </div>

                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    className={`border rounded px-3 py-2 text-sm border-gray-200 ${errors.password ? 'border-red-500' : ''}`}
                    placeholder="Password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  {errors.password && <span className="text-red-500 text-xs mt-1">{errors.password}</span>}
                </div>

                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">App Key</label>
                  <input
                    type="text"
                    className={`border rounded px-3 py-2 text-sm border-gray-200 ${errors.appKey ? 'border-red-500' : ''}`}
                    placeholder="App Key"
                    name="appKey"
                    value={formData.appKey}
                    onChange={handleChange}
                  />
                  {errors.appKey && <span className="text-red-500 text-xs mt-1">{errors.appKey}</span>}
                </div>

                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">App Secret Key</label>
                  <input
                    type="text"
                    className={`border rounded px-3 py-2 text-sm border-gray-200 ${errors.appSecretKey ? 'border-red-500' : ''}`}
                    placeholder="App Secret Key"
                    name="appSecretKey"
                    value={formData.appSecretKey}
                    onChange={handleChange}
                  />
                  {errors.appSecretKey && <span className="text-red-500 text-xs mt-1">{errors.appSecretKey}</span>}
                </div>
              </>
            )}

            {/* Fields for Nagad P2C */}
            {paymentMethod === 'Nagad P2C' && (
              <>
                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">Public Key</label>
                  <input
                    type="text"
                    className={`border rounded px-3 py-2 text-sm border-gray-200 ${errors.publicKey ? 'border-red-500' : ''}`}
                    placeholder="Public Key"
                    name="publicKey"
                    value={formData.publicKey}
                    onChange={handleChange}
                  />
                  {errors.publicKey && <span className="text-red-500 text-xs mt-1">{errors.publicKey}</span>}
                </div>

                <div className="flex flex-col">
                  <label className="mb-1 text-sm font-medium text-gray-700">Private Key</label>
                  <input
                    type="text"
                    className={`border rounded px-3 py-2 text-sm border-gray-200 ${errors.privateKey ? 'border-red-500' : ''}`}
                    placeholder="Private Key"
                    name="privateKey"
                    value={formData.privateKey}
                    onChange={handleChange}
                  />
                  {errors.privateKey && <span className="text-red-500 text-xs mt-1">{errors.privateKey}</span>}
                </div>
              </>
            )}

            {/* Wallet Type for P2P methods */}
            {(paymentMethod === 'Bkash P2P' || paymentMethod === 'Nagad P2P') && (
              <div className="flex flex-col">
                <label className="mb-1 text-sm font-medium text-gray-700">Wallet Type</label>
                <select 
                  className={`border rounded px-3 py-2 text-sm border-gray-200 outline-theme ${errors.walletType ? 'border-red-500' : ''}`}
                  name="walletType"
                  value={formData.walletType}
                  onChange={handleChange}
                >
                  <option value="personal">Personal</option>
                  <option value="M Plush">M Plush</option>
                  <option value="Daily 300K">Daily 300K</option>
                  <option value="Daily 30K">Daily 30K</option>
                </select>
                {errors.walletType && <span className="text-red-500 text-xs mt-1">{errors.walletType}</span>}
              </div>
            )}

            <div className="flex flex-col">
              <label className="mb-1 text-sm font-medium text-gray-700">Status</label>
              <select 
                className="border rounded px-3 py-2 text-sm border-gray-200 outline-theme"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="col-span-1 md:col-span-2 flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 cursor-pointer hover:bg-gray-300 rounded-md text-gray-700 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600  cursor-pointer hover:bg-blue-700 rounded-md text-white transition-colors flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    {isNew ? 'Add Account' : 'Save Changes'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Viewuser;