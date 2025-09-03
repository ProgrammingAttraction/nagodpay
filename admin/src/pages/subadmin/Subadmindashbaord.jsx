import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiLogOut, FiUsers, FiDollarSign, FiTrendingUp, FiActivity, 
  FiCreditCard, FiDatabase, FiBarChart2, FiLoader, FiCalendar,
  FiArrowUp, FiArrowDown, FiPieChart, FiLayers, FiShoppingBag,
  FiRefreshCw, FiSettings
} from 'react-icons/fi';
import { 
  FaMoneyBillWave, FaExchangeAlt, FaUserTie, FaPercentage,
  FaRegCheckCircle, FaRegTimesCircle, FaChevronDown
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Subadmindashbaord = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const navigate=useNavigate();
  // Fetch data from the transaction-totals API route
  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      let url = `${base_url}/api/admin/transaction-totals`;
      
      if (timeRange !== 'all') {
        const now = new Date();
        let startDate;
        
        switch(timeRange) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case 'year':
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
          default:
            startDate = null;
        }
        
        if (startDate) {
          url += `?startDate=${startDate.toISOString()}&endDate=${new Date().toISOString()}`;
        }
      }
      
      const response = await axios.get(url);
      setDashboardData(response.data.data);
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleLogout = () => {
      navigate("/dashboard");
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend, percentage }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-1 font-medium">{title}</p>
          {loading ? (
            <div className="h-8 w-20 bg-gray-200 rounded mt-2 animate-pulse"></div>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-800">
                {typeof value === 'number' 
                  ? value.toLocaleString('en-US', { maximumFractionDigits: 2 }) 
                  : value}
                {percentage && '%'}
              </p>
              {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
              {trend && (
                <p className="text-xs mt-2 flex items-center">
                  {trend.direction === 'up' ? 
                    <FiArrowUp className="mr-1 text-green-500" /> : 
                    <FiArrowDown className="mr-1 text-red-500" />
                  }
                  <span className={trend.direction === 'up' ? 'text-green-500' : 'text-red-500'}>
                    {trend.value}
                  </span>
                </p>
              )}
            </>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color} text-white`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );

  const ProgressBar = ({ percentage, color, label }) => (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-800">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );

  const ProviderCard = ({ provider, data, type }) => {
    const successRate = data.count > 0 ? Math.round((data.successfulCount / data.count) * 100) : 0;
    
    return (
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-gray-800 capitalize">{provider}</h4>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
            {data.count} transactions
          </span>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Amount:</span>
            <span className="font-medium text-gray-800">৳{data.amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Success Rate:</span>
            <span className={`font-medium ${successRate > 80 ? 'text-green-500' : successRate > 60 ? 'text-yellow-500' : 'text-red-500'}`}>
              {successRate}%
            </span>
          </div>
          <ProgressBar 
            percentage={successRate} 
            color={type === 'payin' ? 'bg-green-500' : 'bg-blue-500'}
          />
        </div>
      </div>
    );
  };

  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
          <p className="text-gray-600 mt-4">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 text-red-700 p-6 rounded-xl">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <FiActivity className="text-xl" />
              </div>
            </div>
            <p className="mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { totals, counts, successRates, breakdown } = dashboardData;

  // Calculate total deposits and withdrawals
  const totalDeposits = totals.successfulTransactions.payin + 
                       totals.successfulTransactions.nagadDeposit + 
                       totals.successfulTransactions.bankDeposit;
  
  const totalWithdrawals = totals.successfulTransactions.payout;
  const totalVolume = totalDeposits + totalWithdrawals;
  
  // Calculate percentages for the chart
  const depositPercentage = totalVolume > 0 ? Math.round((totalDeposits / totalVolume) * 100) : 0;
  const withdrawalPercentage = totalVolume > 0 ? Math.round((totalWithdrawals / totalVolume) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 font-nunito">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-blue-500 text-white p-2 rounded-lg mr-3">
                <FiActivity size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Payment Dashboard</h1>
                <p className="text-sm text-gray-600">Comprehensive overview of all transactions</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition duration-200"
                title="Refresh data"
              >
                <FiRefreshCw className={`${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={handleLogout}
                className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg flex items-center transition duration-200"
              >
                Dashbaord
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Filters and Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
            <p className="text-gray-600">Monitor all transaction activities</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* Time Range Filter */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 flex items-center">
              <FiCalendar className="text-gray-500 mr-2" />
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-gray-700"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
              </select>
            </div>
          </div>
        </div>
    {/* Transaction Counts */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Transaction Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-5 bg-green-50 rounded-xl border border-green-100">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-full mb-3">
                <FiShoppingBag className="text-xl" />
              </div>
              <h4 className="font-semibold text-green-800">Payin</h4>
              <p className="text-2xl font-bold text-gray-800">{counts.successfulTransactions.payin}/{counts.allTransactions.payin}</p>
              <p className="text-sm text-green-600">Successful/Total</p>
            </div>
            
            <div className="text-center p-5 bg-blue-50 rounded-xl border border-blue-100">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mb-3">
                <FaExchangeAlt className="text-xl" />
              </div>
              <h4 className="font-semibold text-blue-800">Payout</h4>
              <p className="text-2xl font-bold text-gray-800">{counts.successfulTransactions.payout}/{counts.allTransactions.payout}</p>
              <p className="text-sm text-blue-600">Successful/Total</p>
            </div>
            
            <div className="text-center p-5 bg-purple-50 rounded-xl border border-purple-100">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-full mb-3">
                <FiDatabase className="text-xl" />
              </div>
              <h4 className="font-semibold text-purple-800">Nagad Deposit</h4>
              <p className="text-2xl font-bold text-gray-800">{counts.successfulTransactions.nagadDeposit}/{counts.allTransactions.nagadDeposit}</p>
              <p className="text-sm text-purple-600">Successful/Total</p>
            </div>
            
            <div className="text-center p-5 bg-orange-50 rounded-xl border border-orange-100">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 text-orange-600 rounded-full mb-3">
                <FiCreditCard className="text-xl" />
              </div>
              <h4 className="font-semibold text-orange-800">Bank Deposit</h4>
              <p className="text-2xl font-bold text-gray-800">{counts.successfulTransactions.bankDeposit}/{counts.allTransactions.bankDeposit}</p>
              <p className="text-sm text-orange-600">Successful/Total</p>
            </div>
          </div>
        </div>
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Transactions"
            value={counts.allTransactions.total}
            icon={FiLayers}
            color="bg-blue-100 text-blue-600"
            subtitle={`${counts.successfulTransactions.total} successful`}
          />
          <StatCard
            title="Total Volume"
            value={`৳${totals.allTransactions.total.toLocaleString()}`}
            icon={FiDollarSign}
            color="bg-green-100 text-green-600"
          />
          <StatCard
            title="Net Amount"
            value={`৳${totals.successfulTransactions.net.toLocaleString()}`}
            icon={FaMoneyBillWave}
            color="bg-purple-100 text-purple-600"
            subtitle="Deposits - Withdrawals"
          />
          <StatCard
            title="Success Rate"
            value={successRates.overall}
            icon={FaPercentage}
            color="bg-orange-100 text-orange-600"
            percentage={true}
          />
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Deposits vs Withdrawals */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaExchangeAlt className="mr-2 text-blue-500" />
              Deposits vs Withdrawals
            </h3>
            <div className="space-y-4">
              <ProgressBar 
                percentage={depositPercentage} 
                color="bg-green-500" 
                label="Total Deposits" 
              />
              <ProgressBar 
                percentage={withdrawalPercentage} 
                color="bg-blue-500" 
                label="Total Withdrawals" 
              />
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Deposits</p>
                <p className="text-lg font-semibold text-gray-800">
                  ৳{totalDeposits.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Withdrawals</p>
                <p className="text-lg font-semibold text-gray-800">
                  ৳{totalWithdrawals.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Success Rates */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiPieChart className="mr-2 text-purple-500" />
              Success Rates by Type
            </h3>
            <div className="space-y-4">
              {Object.entries(successRates).map(([key, value]) => (
                key !== 'overall' && (
                  <ProgressBar 
                    key={key}
                    percentage={value} 
                    color={value > 80 ? 'bg-green-500' : value > 60 ? 'bg-yellow-500' : 'bg-red-500'}
                    label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  />
                )
              ))}
            </div>
          </div>
        </div>

        {/* Provider Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
          {/* Payin Providers */}
          {/* <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiShoppingBag className="mr-2 text-green-500" />
              Deposit Providers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(breakdown.payinByProvider).map(([provider, data]) => (
                <ProviderCard key={provider} provider={provider} data={data} type="payin" />
              ))}
            </div>
          </div> */}

          {/* Payout Providers */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaExchangeAlt className="mr-2 text-blue-500" />
              Withdrawal Providers
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(breakdown.payoutByProvider).map(([provider, data]) => (
                <ProviderCard key={provider} provider={provider} data={data} type="payout" />
              ))}
            </div>
          </div>
        </div>

    
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Payment Gateway System. All rights reserved.
            </p>
            <p className="text-xs text-gray-400 mt-2 md:mt-0">
              Data filtered for: {dashboardData.filters.startDate} to {dashboardData.filters.endDate}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Subadmindashbaord;