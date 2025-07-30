import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import Merchantheader from '../../../components/common/merchant/Merchantheader';
import Merchantsidebar from '../../../components/common/merchant/Merchantsidebar';

const Merchantwithdraw = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [merchantData, setMerchantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState([]);
  const merchant_info = JSON.parse(localStorage.getItem("merchantData"));
  const [formData, setFormData] = useState();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const token = localStorage.getItem('merchantToken');

  // Bangladeshi payment system constants
  const MINIMUM_BALANCE = 50000; // 50,000 Taka minimum balance requirement
  const MINIMUM_WITHDRAWAL = 1000; // Minimum withdrawal amount
  const CURRENCY = '৳'; // Bangladeshi Taka symbol

  // Withdrawal form state for Bangladeshi system
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    paymentMethod: 'bank_transfer',
    bankDetails: {
      bankName: '',
      accountNumber: '',
      accountName: '',
      branchName: '',
      routingNumber: ''
    },
    mobileBanking: {
      provider: 'bKash',
      phoneNumber: ''
    },
    upiId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchMerchantData = async () => {
      try {
        const response = await axios.get(`${base_url}/api/merchant/merchant-info/${merchant_info._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.data.success) {
          setMerchantData(response.data.merchant);
        } else {
          toast.error('Failed to fetch merchant data');
        }
      } catch (err) {
        toast.error('Failed to fetch merchant data');
        console.error('Error fetching merchant data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMerchantData();
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const response = await axios.get(`${base_url}/api/merchant/withdraw`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setWithdrawals(response.data);
    } catch (err) {
      console.error('Error fetching withdrawals:', err);
    }
  };

  const handleWithdrawInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name in withdrawForm.bankDetails) {
      setWithdrawForm(prev => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [name]: value
        }
      }));
    } else {
      setWithdrawForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check if balance is sufficient (including minimum balance requirement)
      const withdrawAmount = parseFloat(withdrawForm.amount);
      const currentBalance = merchantData?.balance || 0;

      if (withdrawAmount > currentBalance) {
        toast.error('Insufficient balance');
        setIsSubmitting(false);
        return;
      }

      if (currentBalance - withdrawAmount < MINIMUM_BALANCE) {
        toast.error(`You must maintain a minimum balance of ${CURRENCY}${MINIMUM_BALANCE.toLocaleString('en-IN')}`);
        setIsSubmitting(false);
        return;
      }

      if (withdrawAmount < MINIMUM_WITHDRAWAL) {
        toast.error(`Minimum withdrawal amount is ${CURRENCY}${MINIMUM_WITHDRAWAL.toLocaleString('en-IN')}`);
        setIsSubmitting(false);
        return;
      }

      // Prepare payment details based on payment method
      let paymentDetails = {};
      if (withdrawForm.paymentMethod === 'bank_transfer') {
        paymentDetails = withdrawForm.bankDetails;
      } else if (withdrawForm.paymentMethod === 'mobile_banking') {
        paymentDetails = withdrawForm.mobileBanking;
      } else if (withdrawForm.paymentMethod === 'upi') {
        paymentDetails = { upiId: withdrawForm.upiId };
      }

      const response = await axios.post(
        `${base_url}/api/merchant/withdraw`,
        {
          merchant: merchant_info._id,
          amount: withdrawAmount,
          paymentMethod: withdrawForm.paymentMethod,
          paymentDetails
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        toast.success('Withdrawal request submitted successfully!');
        // Reset form
        setWithdrawForm({
          amount: '',
          paymentMethod: 'bank_transfer',
          bankDetails: {
            bankName: '',
            accountNumber: '',
            accountName: '',
            branchName: '',
            routingNumber: ''
          },
          mobileBanking: {
            provider: 'bKash',
            phoneNumber: ''
          },
          upiId: ''
        });
        // Refresh merchant data to update balance
        const updatedMerchant = await axios.get(`${base_url}/api/merchant/merchant-info/${merchant_info._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setMerchantData(updatedMerchant.data.merchant);
        // Refresh withdrawals list
        fetchWithdrawals();
      }
    } catch (err) {
      console.error('Withdrawal error:', err);
      toast.error(err.response?.data?.message || 'Failed to process withdrawal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPaymentDetailsForm = () => {
    switch (withdrawForm.paymentMethod) {
      case 'bank_transfer':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                id="bankName"
                name="bankName"
                value={withdrawForm.bankDetails.bankName}
                onChange={handleWithdrawInputChange}
                className="block w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-theme transition duration-200"
                required
              />
            </div>
            <div>
              <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                id="accountNumber"
                name="accountNumber"
                value={withdrawForm.bankDetails.accountNumber}
                onChange={handleWithdrawInputChange}
                className="block w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-theme transition duration-200"
                required
              />
            </div>
            <div>
              <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                id="accountName"
                name="accountName"
                value={withdrawForm.bankDetails.accountName}
                onChange={handleWithdrawInputChange}
                className="block w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-theme transition duration-200"
                required
              />
            </div>
            <div>
              <label htmlFor="branchName" className="block text-sm font-medium text-gray-700 mb-1">
                Branch Name
              </label>
              <input
                type="text"
                id="branchName"
                name="branchName"
                value={withdrawForm.bankDetails.branchName}
                onChange={handleWithdrawInputChange}
                className="block w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-theme transition duration-200"
                required
              />
            </div>
            <div>
              <label htmlFor="routingNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Routing Number
              </label>
              <input
                type="text"
                id="routingNumber"
                name="routingNumber"
                value={withdrawForm.bankDetails.routingNumber}
                onChange={handleWithdrawInputChange}
                className="block w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-theme transition duration-200"
                required
              />
            </div>
          </div>
        );
      case 'mobile_banking':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Banking Provider
              </label>
              <select
                id="provider"
                name="provider"
                value={withdrawForm.mobileBanking.provider}
                onChange={(e) => setWithdrawForm(prev => ({
                  ...prev,
                  mobileBanking: {
                    ...prev.mobileBanking,
                    provider: e.target.value
                  }
                }))}
                className="block w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-theme transition duration-200"
                required
              >
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
                <option value="Rocket">Rocket (DBBL)</option>
                <option value="Upay">Upay</option>
                <option value="mCash">mCash</option>
              </select>
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number
              </label>
              <input
                type="text"
                id="phoneNumber"
                name="phoneNumber"
                value={withdrawForm.mobileBanking.phoneNumber}
                onChange={(e) => setWithdrawForm(prev => ({
                  ...prev,
                  mobileBanking: {
                    ...prev.mobileBanking,
                    phoneNumber: e.target.value
                  }
                }))}
                className="block w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-theme transition duration-200"
                placeholder="01XXXXXXXXX"
                required
              />
            </div>
          </div>
        );
      case 'upi':
        return (
          <div>
            <label htmlFor="upiId" className="block text-sm font-medium text-gray-700 mb-1">
              UPI ID
            </label>
            <input
              type="text"
              id="upiId"
              name="upiId"
              value={withdrawForm.upiId}
              onChange={handleWithdrawInputChange}
              className="block w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-theme transition duration-200"
              placeholder="yourname@upi"
              required
            />
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Pending</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Completed</span>;
      case 'failed':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Failed</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Rejected</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getPaymentDetails = (paymentMethod, paymentDetails) => {
    if (paymentMethod === 'bank_transfer') {
      return `${paymentDetails.bankName} (A/C: ${paymentDetails.accountNumber})`;
    } else if (paymentMethod === 'mobile_banking') {
      return `${paymentDetails.provider} (${paymentDetails.phoneNumber})`;
    } else if (paymentMethod === 'upi') {
      return paymentDetails.upiId;
    }
    return '-';
  };

  return (
    <section className="font-anek bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
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
      
      <Merchantheader toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh]">
        <Merchantsidebar isOpen={isSidebarOpen} />

        <main className={`transition-all duration-300 flex-1 p-6 ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
          {/* Balance Card */}
          <div className="mb-6 bg-white rounded-lg  overflow-hidden">
            <div className="bg-blue-600 py-3 px-6">
              <h1 className="text-[22px] font-[600] text-white">Withdraw Funds</h1>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Available Balance</h3>
                  <p className="text-2xl font-bold text-gray-800">
                    {CURRENCY}{merchantData?.balance?.toLocaleString('en-IN') || '0.00'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Minimum balance: {CURRENCY}{MINIMUM_BALANCE.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Total Deposits</h3>
                  <p className="text-2xl font-bold text-gray-800">
                    {CURRENCY}{merchantData?.total_payin?.toLocaleString('en-IN') || '0.00'}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Total Withdrawals</h3>
                  <p className="text-2xl font-bold text-gray-800">
                    {CURRENCY}{merchantData?.total_payout?.toLocaleString('en-IN') || '0.00'}
                  </p>
                </div>
              </div>

              {/* Withdrawal Form */}
              <form onSubmit={handleWithdrawSubmit} className="space-y-6">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount to Withdraw ({CURRENCY})
                  </label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={withdrawForm.amount}
                    onChange={handleWithdrawInputChange}
                    className="block w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-theme transition duration-200"
                    placeholder={`Minimum ${CURRENCY}${MINIMUM_WITHDRAWAL.toLocaleString('en-IN')}`}
                    min={MINIMUM_WITHDRAWAL}
                    step="1"
                    required
                  />
                  {merchantData?.withdrawCommission && (
                    <p className="mt-1 text-sm text-gray-500">
                      Withdrawal fee: {merchantData.withdrawCommission}% {CURRENCY}
                      {(withdrawForm.amount ? (parseFloat(withdrawForm.amount) * merchantData.withdrawCommission / 100).toFixed(2) : '0.00')}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Available for withdrawal: {CURRENCY}
                    {merchantData?.balance ? Math.max(0, (merchantData.balance - MINIMUM_BALANCE)).toLocaleString('en-IN') : '0.00'}
                  </p>
                </div>

                <div>
                  <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={withdrawForm.paymentMethod}
                    onChange={handleWithdrawInputChange}
                    className="block w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-theme transition duration-200"
                    required
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_banking">Mobile Banking</option>
                  </select>
                </div>

                {renderPaymentDetailsForm()}

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || loading || !merchantData?.balance || (merchantData.balance <= MINIMUM_BALANCE)}
                    className={`w-full px-4 py-3 rounded-lg shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme transition duration-200 ${
                      isSubmitting || !merchantData?.balance || (merchantData.balance <= MINIMUM_BALANCE) ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? 'Processing...' : 'Request Withdrawal'}
                  </button>
                  {merchantData?.balance && merchantData.balance <= MINIMUM_BALANCE && (
                    <p className="mt-2 text-sm text-red-500 text-center">
                      Your balance must be greater than {CURRENCY}{MINIMUM_BALANCE.toLocaleString('en-IN')} to withdraw
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Recent Withdrawals Section */}
          <div className="bg-white rounded-lg border-[1px] border-gray-200 overflow-hidden">
              <h1 className="text-[22px] font-[600]  p-[10px]">Withdrawal History</h1>
            <div className="px-4 py-2">
              {withdrawals.length === 0 ? (
                <p className="text-gray-500">No withdrawal requests found.</p>
              ) : (
                <div className="overflow-x-auto border-[1px] border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {withdrawals.map((withdrawal) => (
                        <tr key={withdrawal._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(withdrawal.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {CURRENCY}{withdrawal.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {withdrawal.paymentMethod.replace('_', ' ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getPaymentDetails(withdrawal.paymentMethod, withdrawal.paymentDetails)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {getStatusBadge(withdrawal.status)}
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

export default Merchantwithdraw;