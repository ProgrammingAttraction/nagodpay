import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { FaDollarSign, FaCalendarAlt, FaFileAlt, FaThumbsUp, FaExchangeAlt } from 'react-icons/fa';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import { FiUserPlus, FiClock, FiCheckCircle, FiXCircle, FiTrendingUp, FiTrendingDown, FiCreditCard, FiCalendar, FiFilter } from "react-icons/fi";
import axios from 'axios';
import moment from 'moment';

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: moment().subtract(7, 'days').format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD')
  });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [filteredData, setFilteredData] = useState(null);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('authToken');
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    fetchOverview();
  }, [base_url, token, dateRange]);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${base_url}/api/admin/admin-overview`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }
      });
      console.log('Overview response:', response.data);
      setOverviewData(response.data);
      setFilteredData(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch overview data');
      console.error('Error fetching overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyDateFilter = () => {
    setShowDateFilter(false);
    fetchOverview();
  };

  const resetDateFilter = () => {
    setDateRange({
      startDate: moment().subtract(7, 'days').format('YYYY-MM-DD'),
      endDate: moment().format('YYYY-MM-DD')
    });
    setShowDateFilter(false);
  };

  // Format currency values
  const formatCurrency = (value) => {
    if (!value) return '৳0';
    return `৳${value.toLocaleString('en-BD')}`;
  };

  // Format number with commas
  const formatNumber = (value) => {
    if (!value) return '0';
    return value.toLocaleString('en-BD');
  };

  // Calculate percentage
  const calculatePercentage = (value, total) => {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  // Prepare data for charts
  const prepareChartData = () => {
    if (!filteredData) return [];
    
    // Group by date for line charts
    const depositMap = {};
    const withdrawMap = {};
    const payinMap = {};
    const payoutMap = {};
    const nagadFreeMap = {};
    const bankTransferMap = {};
    
    // Process deposit history
    filteredData.depositHistory.forEach(item => {
      const date = item.date;
      depositMap[date] = (depositMap[date] || 0) + item.amount;
    });
    
    // Process withdraw history
    filteredData.withdrawHistory.forEach(item => {
      const date = item.date;
      withdrawMap[date] = (withdrawMap[date] || 0) + item.amount;
    });
    
    // Process payin history
    filteredData.payinHistory.forEach(item => {
      const date = item.date;
      payinMap[date] = (payinMap[date] || 0) + item.amount;
    });
    
    // Process payout history
    filteredData.payoutHistory.forEach(item => {
      const date = item.date;
      payoutMap[date] = (payoutMap[date] || 0) + item.amount;
    });
    
    // Process nagad free history
    filteredData.nagadFreeHistory?.forEach(item => {
      const date = item.date;
      nagadFreeMap[date] = (nagadFreeMap[date] || 0) + item.amount;
    });
    
    // Process bank transfer history
    filteredData.bankTransferHistory?.forEach(item => {
      const date = item.date;
      bankTransferMap[date] = (bankTransferMap[date] || 0) + item.amount;
    });
    
    // Combine all dates
    const allDates = [...new Set([
      ...Object.keys(depositMap),
      ...Object.keys(withdrawMap),
      ...Object.keys(payinMap),
      ...Object.keys(payoutMap),
      ...Object.keys(nagadFreeMap),
      ...Object.keys(bankTransferMap)
    ])].sort();
    
    // Create chart data
    return allDates.map(date => ({
      date,
      deposit: depositMap[date] || 0,
      withdraw: withdrawMap[date] || 0,
      payin: payinMap[date] || 0,
      payout: payoutMap[date] || 0,
      nagadFree: nagadFreeMap[date] || 0,
      bankTransfer: bankTransferMap[date] || 0,
      total: (depositMap[date] || 0) + (payinMap[date] || 0) + (nagadFreeMap[date] || 0) + (bankTransferMap[date] || 0)
    }));
  };

  // Calculate total income and expense
  const totalIncome = filteredData ? 
    (filteredData.totalDeposit || 0) + 
    (filteredData.totalPayin || 0) + 
    (filteredData.totalNagadFree || 0) + 
    (filteredData.totalBankTransfer || 0) : 0;
  
  const totalExpense = filteredData ? 
    (filteredData.totalWithdraw || 0) + 
    (filteredData.totalPayout || 0) : 0;
  
  const todaysIncome = filteredData ? 
    (filteredData.todaysDeposit || 0) + 
    (filteredData.todaysPayin || 0) + 
    (filteredData.todaysNagadFree || 0) + 
    (filteredData.todaysBankTransfer || 0) : 0;
  
  const todaysExpense = filteredData ? 
    (filteredData.todaysWithdraw || 0) + 
    (filteredData.todaysPayout || 0) : 0;

  // Summary cards data
  const summaryCards = [
    {
      title: 'Total Payin',
      value: formatCurrency(filteredData?.totalPayin || 0),
      icon: <FiTrendingUp className="w-6 h-6" />,
      change: filteredData ? `${formatCurrency(filteredData.todaysPayin)} today` : '৳0 today',
      isPositive: true,
      gradient: 'from-purple-500 to-pink-500',
      data: {
        today: formatCurrency(filteredData?.todaysPayin || 0),
        total: formatCurrency(filteredData?.totalPayin || 0)
      }
    },
    {
      title: 'Total Payout',
      value: formatCurrency(filteredData?.totalPayout || 0),
      icon: <FiTrendingDown className="w-6 h-6" />,
      change: filteredData ? `${formatCurrency(filteredData.todaysPayout)} today` : '৳0 today',
      isPositive: true,
      gradient: 'from-red-500 to-rose-500',
      data: {
        today: formatCurrency(filteredData?.todaysPayout || 0),
        total: formatCurrency(filteredData?.totalPayout || 0)
      }
    },
    {
      title: 'Nagad Free',
      value: formatCurrency(filteredData?.totalNagadFree || 0),
      icon: <FaBangladeshiTakaSign className="w-6 h-6" />,
      change: filteredData ? `${formatCurrency(filteredData.todaysNagadFree)} today` : '৳0 today',
      isPositive: true,
      gradient: 'from-green-600 to-emerald-600',
      data: {
        today: formatCurrency(filteredData?.todaysNagadFree || 0),
        total: formatCurrency(filteredData?.totalNagadFree || 0)
      }
    },
    {
      title: 'Bank Transfer',
      value: formatCurrency(filteredData?.totalBankTransfer || 0),
      icon: <FiCreditCard className="w-6 h-6" />,
      change: filteredData ? `${formatCurrency(filteredData.todaysBankTransfer)} today` : '৳0 today',
      isPositive: true,
      gradient: 'from-blue-600 to-cyan-600',
      data: {
        today: formatCurrency(filteredData?.todaysBankTransfer || 0),
        total: formatCurrency(filteredData?.totalBankTransfer || 0)
      }
    },
  ];

  // Status cards data
  const statusCards = [
    {
      title: 'Period Summary',
      icon: <FaCalendarAlt className="text-indigo-500" />,
      data: [
        { label: 'Total Income', value: formatCurrency(totalIncome), icon: <FiTrendingUp className="text-green-500" />, color: 'bg-green-100' },
        { label: 'Total Expense', value: formatCurrency(totalExpense), icon: <FiTrendingDown className="text-red-500" />, color: 'bg-red-100' },
        { label: 'Net Period', value: formatCurrency(totalIncome - totalExpense), icon: <FaExchangeAlt className="text-blue-500" />, color: 'bg-blue-100' }
      ]
    },
    {
      title: 'Rejected Transactions',
      icon: <FiXCircle className="text-red-500" />,
      data: [
        { label: 'Rejected Payin', value: formatCurrency(filteredData?.totalRejectedPayin || 0), icon: <FiTrendingUp className="text-red-500" />, color: 'bg-red-100' },
        { label: 'Rejected Payout', value: formatCurrency(filteredData?.totalRejectedPayout || 0), icon: <FiTrendingDown className="text-red-500" />, color: 'bg-red-100' },
        { label: 'Rejected Nagad Free', value: formatCurrency(filteredData?.totalRejectedNagadFree || 0), icon: <FaBangladeshiTakaSign className="text-red-500" />, color: 'bg-red-100' },
        { label: 'Rejected Bank Transfer', value: formatCurrency(filteredData?.totalRejectedBankTransfer || 0), icon: <FiCreditCard className="text-red-500" />, color: 'bg-red-100' }
      ]
    },
    {
      title: 'Tax Information',
      icon: <FaFileAlt className="text-purple-500" />,
      data: [
        { label: 'Total Withdraw Tax', value: formatCurrency(filteredData?.totalWithdrawTax || 0), icon: <FaDollarSign className="text-purple-500" />, color: 'bg-purple-100' },
        { label: "Period Withdraw Tax", value: formatCurrency(filteredData?.todaysWithdrawTax || 0), icon: <FaCalendarAlt className="text-purple-500" />, color: 'bg-purple-100' },
        { label: 'Tax Rate', value: filteredData && filteredData.totalWithdraw > 0 ? `${calculatePercentage(filteredData.totalWithdrawTax, filteredData.totalWithdraw)}%` : '0%', icon: <FiTrendingUp className="text-purple-500" />, color: 'bg-purple-100' }
      ]
    },
    {
      title: 'Performance Trends',
      icon: <FiTrendingUp className="text-teal-500" />,
      data: [
        { label: 'Deposit Trend', value: filteredData ? `${filteredData.depositPercentageDifference}% ${filteredData.depositTrend}` : '0%', icon: filteredData && filteredData.depositTrend === "up" ? <FiTrendingUp className="text-green-500" /> : <FiTrendingDown className="text-red-500" />, color: filteredData && filteredData.depositTrend === "up" ? 'bg-green-100' : 'bg-red-100' },
        { label: 'Withdraw Trend', value: filteredData ? `${filteredData.withdrawPercentageDifference}% ${filteredData.withdrawTrend}` : '0%', icon: filteredData && filteredData.withdrawTrend === "up" ? <FiTrendingUp className="text-green-500" /> : <FiTrendingDown className="text-red-500" />, color: filteredData && filteredData.withdrawTrend === "up" ? 'bg-green-100' : 'bg-red-100' },
        { label: 'Net Flow', value: filteredData ? formatCurrency(filteredData.depositDifference - filteredData.withdrawDifference) : '৳0', icon: filteredData && (filteredData.depositDifference - filteredData.withdrawDifference) >= 0 ? <FiTrendingUp className="text-green-500" /> : <FiTrendingDown className="text-red-500" />, color: filteredData && (filteredData.depositDifference - filteredData.withdrawDifference) >= 0 ? 'bg-green-100' : 'bg-red-100' }
      ]
    }
  ];

  // Prepare pie chart data for payment breakdown
  const paymentBreakdownData = [
    { 
      name: 'Deposit', 
      value: filteredData?.totalDeposit || 0, 
      color: '#3B82F6' 
    },
    { 
      name: 'Payin', 
      value: filteredData?.totalPayin || 0, 
      color: '#8B5CF6' 
    },
    { 
      name: 'Nagad Free', 
      value: filteredData?.totalNagadFree || 0, 
      color: '#10B981' 
    },
    { 
      name: 'Bank Transfer', 
      value: filteredData?.totalBankTransfer || 0, 
      color: '#06B6D4' 
    },
    { 
      name: 'Withdraw', 
      value: filteredData?.totalWithdraw || 0, 
      color: '#F59E0B' 
    },
    { 
      name: 'Payout', 
      value: filteredData?.totalPayout || 0, 
      color: '#EF4444' 
    }
  ];

  if (loading) {
    return (
      <section className="font-nunito h-screen bg-gray-50">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh] h-[90vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          </main>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="font-nunito h-screen bg-gray-50">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh] h-[90vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm" role="alert">
              <div className="flex items-center">
                <FiXCircle className="mr-2" />
                <strong className="font-bold">Error! </strong>
                <span className="block sm:inline ml-1">{error}</span>
              </div>
            </div>
          </main>
        </div>
      </section>
    );
  }

  return (
    <section className="font-nunito h-screen bg-gray-50">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh] h-[90vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Financial Overview Dashboard</h1>
              <p className="text-sm text-gray-500">
                Comprehensive view of all financial transactions and performance metrics
              </p>
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowDateFilter(!showDateFilter)}
                className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <FiFilter className="text-gray-600" />
                <span>Date Filter</span>
                <FiCalendar className="text-gray-600" />
              </button>
              
              {showDateFilter && (
                <div className="absolute right-0 top-12 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-10 w-80">
                  <h3 className="font-semibold mb-3">Select Date Range</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        name="startDate"
                        value={dateRange.startDate}
                        onChange={handleDateChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        max={dateRange.endDate}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        name="endDate"
                        value={dateRange.endDate}
                        onChange={handleDateChange}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        min={dateRange.startDate}
                        max={moment().format('YYYY-MM-DD')}
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={applyDateFilter}
                        className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
                      >
                        Apply Filter
                      </button>
                      <button
                        onClick={resetDateFilter}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Date Range Display */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiCalendar className="text-indigo-600" />
                <span className="text-indigo-700 font-medium">Selected Date Range:</span>
                <span className="text-indigo-900">
                  {moment(dateRange.startDate).format('MMM D, YYYY')} - {moment(dateRange.endDate).format('MMM D, YYYY')}
                </span>
              </div>
              <button 
                onClick={() => setShowDateFilter(true)}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                Change Dates
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card, index) => (
              <div 
                key={index} 
                className={`bg-gradient-to-r ${card.gradient} rounded-xl shadow-lg p-6 text-white relative overflow-hidden`}
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium opacity-80">{card.title}</p>
                      <p className="mt-1 text-2xl font-semibold">{card.value}</p>
                    </div>
                    <div className="flex items-center text-green-600 justify-center w-12 h-12 rounded-lg bg-white bg-opacity-20">
                      {card.icon}
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-medium opacity-80">{card.change}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {Object.entries(card.data).map(([key, value]) => (
                        <div key={key} className="bg-white bg-opacity-10 rounded p-1 text-center">
                          <p className="text-xs opacity-80 text-gray-800 font-[700] capitalize">{key}</p>
                          <p className="text-sm text-gray-800 font-[700]">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Status Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {statusCards.map((section, sectionIndex) => (
              <div key={sectionIndex} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-700">{section.title}</h3>
                  <div className="p-2 rounded-lg bg-gray-50">
                    {section.icon}
                  </div>
                </div>
                <div className="space-y-4">
                  {section.data.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${item.color}`}>
                          {item.icon}
                        </div>
                        <span className="text-sm font-medium text-gray-600">{item.label}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Transaction Trend Chart */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-md font-semibold text-gray-700">Transaction Trends</h2>
                <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">
                  {formatCurrency(totalIncome)} total income
                </span>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={prepareChartData()} 
                    margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tickFormatter={(val) => `৳${val}`} 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value) => [`৳${value}`, "Amount"]} 
                    />
                    <Legend 
                      wrapperStyle={{
                        paddingTop: '20px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="deposit"
                      stackId="1"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.2}
                      strokeWidth={2}
                      name="Deposit"
                    />
                    <Area
                      type="monotone"
                      dataKey="payin"
                      stackId="1"
                      stroke="#8B5CF6"
                      fill="#8B5CF6"
                      fillOpacity={0.2}
                      strokeWidth={2}
                      name="Payin"
                    />
                    <Area
                      type="monotone"
                      dataKey="nagadFree"
                      stackId="1"
                      stroke="#10B981"
                      fill="#10B981"
                      fillOpacity={0.2}
                      strokeWidth={2}
                      name="Nagad Free"
                    />
                    <Area
                      type="monotone"
                      dataKey="bankTransfer"
                      stackId="1"
                      stroke="#06B6D4"
                      fill="#06B6D4"
                      fillOpacity={0.2}
                      strokeWidth={2}
                      name="Bank Transfer"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-md font-semibold text-gray-700">Payment Breakdown</h2>
                <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-full">
                  {formatCurrency(totalIncome + totalExpense)} total
                </span>
              </div>
              <div className="flex flex-col h-[300px]">
                <div className="flex-grow">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                        labelStyle={{
                          fontSize: '12px',
                          fill: '#4B5563',
                          fontWeight: '500'
                        }}
                      >
                        {paymentBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value) => [`৳${value}`, "Amount"]} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2 flex-wrap">
                  {paymentBreakdownData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
                      <span className="text-xs font-medium text-gray-600">
                        {entry.name}: {formatCurrency(entry.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Income Sources */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-md font-semibold text-gray-700">Income Sources</h2>
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                  {formatCurrency(totalIncome)} total
                </span>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={prepareChartData()} 
                    margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tickFormatter={(val) => `৳${val}`} 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value) => [`৳${value}`, "Amount"]} 
                    />
                    <Legend 
                      wrapperStyle={{
                        paddingTop: '20px'
                      }}
                    />
                    <Bar 
                      dataKey="deposit" 
                      name="Deposit" 
                      fill="#3B82F6" 
                      radius={[4, 4, 0, 0]} 
                      barSize={20}
                    />
                    <Bar 
                      dataKey="payin" 
                      name="Payin" 
                      fill="#8B5CF6" 
                      radius={[4, 4, 0, 0]} 
                      barSize={20}
                    />
                    <Bar 
                      dataKey="nagadFree" 
                      name="Nagad Free" 
                      fill="#10B981" 
                      radius={[4, 4, 0, 0]} 
                      barSize={20}
                    />
                    <Bar 
                      dataKey="bankTransfer" 
                      name="Bank Transfer" 
                      fill="#06B6D4" 
                      radius={[4, 4, 0, 0]} 
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Expense Comparison */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-md font-semibold text-gray-700">Expense Comparison</h2>
                <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full">
                  {formatCurrency(totalExpense)} total
                </span>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={prepareChartData()} 
                    margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      tickFormatter={(val) => `৳${val}`} 
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                      }}
                      formatter={(value) => [`৳${value}`, "Amount"]} 
                    />
                    <Legend 
                      wrapperStyle={{
                        paddingTop: '20px'
                      }}
                    />
                    <Bar 
                      dataKey="withdraw" 
                      name="Withdraw" 
                      fill="#F59E0B" 
                      radius={[4, 4, 0, 0]} 
                      barSize={20}
                    />
                    <Bar 
                      dataKey="payout" 
                      name="Payout" 
                      fill="#EF4444" 
                      radius={[4, 4, 0, 0]} 
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
            <h2 className="text-md font-semibold text-gray-700 mb-4">Period Activity Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-blue-800">Period Income</h3>
                  <FiTrendingUp className="text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-900 mt-2">
                  {formatCurrency(totalIncome)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {calculatePercentage(totalIncome, totalIncome)}% of total income
                </p>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-orange-800">Period Expense</h3>
                  <FiTrendingDown className="text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-orange-900 mt-2">
                  {formatCurrency(totalExpense)}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  {calculatePercentage(totalExpense, totalExpense)}% of total expense
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-green-800">Period Net</h3>
                  <FaExchangeAlt className="text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-900 mt-2">
                  {formatCurrency(totalIncome - totalExpense)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {Math.abs(calculatePercentage(
                    totalIncome - totalExpense,
                    totalIncome
                  ))}% {(totalIncome - totalExpense) >= 0 ? 'profit' : 'loss'}
                </p>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-red-800">Period Rejected</h3>
                  <FiXCircle className="text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-900 mt-2">
                  {formatCurrency(
                    (filteredData?.totalRejectedDeposit || 0) + 
                    (filteredData?.totalRejectedWithdraw || 0) + 
                    (filteredData?.totalRejectedPayin || 0) + 
                    (filteredData?.totalRejectedPayout || 0) +
                    (filteredData?.totalRejectedNagadFree || 0) +
                    (filteredData?.totalRejectedBankTransfer || 0)
                  )}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  Total rejected transactions
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
};

export default Dashboard;