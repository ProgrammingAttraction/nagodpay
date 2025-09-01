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
import { FiUserPlus, FiClock, FiCheckCircle, FiXCircle, FiTrendingUp, FiTrendingDown, FiCreditCard } from "react-icons/fi";
import axios from 'axios';
import moment from 'moment';

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('authToken');
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${base_url}/api/admin/admin-overview`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('Overview response:', response.data);
        setOverviewData(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch overview data');
        console.error('Error fetching overview:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [base_url, token]);

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
    if (!overviewData) return [];
    
    // Group by date for line charts
    const depositMap = {};
    const withdrawMap = {};
    const payinMap = {};
    const payoutMap = {};
    const nagadFreeMap = {};
    const bankTransferMap = {};
    
    // Process deposit history
    overviewData.depositHistory.forEach(item => {
      const date = item.date;
      depositMap[date] = (depositMap[date] || 0) + item.amount;
    });
    
    // Process withdraw history
    overviewData.withdrawHistory.forEach(item => {
      const date = item.date;
      withdrawMap[date] = (withdrawMap[date] || 0) + item.amount;
    });
    
    // Process payin history
    overviewData.payinHistory.forEach(item => {
      const date = item.date;
      payinMap[date] = (payinMap[date] || 0) + item.amount;
    });
    
    // Process payout history
    overviewData.payoutHistory.forEach(item => {
      const date = item.date;
      payoutMap[date] = (payoutMap[date] || 0) + item.amount;
    });
    
    // Process nagad free history
    overviewData.nagadFreeHistory?.forEach(item => {
      const date = item.date;
      nagadFreeMap[date] = (nagadFreeMap[date] || 0) + item.amount;
    });
    
    // Process bank transfer history
    overviewData.bankTransferHistory?.forEach(item => {
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

  // Summary cards data
  const summaryCards = [
    {
      title: 'Total Deposit',
      value: formatCurrency(overviewData?.totalDeposit || 0),
      icon: <FaBangladeshiTakaSign className="w-6 h-6" />,
      change: overviewData ? `${formatCurrency(overviewData.todaysDeposit)} today` : '৳0 today',
      isPositive: true,
      gradient: 'from-blue-500 to-indigo-500',
      data: {
        today: formatCurrency(overviewData?.todaysDeposit || 0),
        total: formatCurrency(overviewData?.totalDeposit || 0)
      }
    },
    {
      title: 'Total Withdraw',
      value: formatCurrency(overviewData?.totalWithdraw || 0),
      icon: <FiCreditCard className="w-6 h-6" />,
      change: overviewData ? `${formatCurrency(overviewData.todaysWithdraw)} today` : '৳0 today',
      isPositive: true,
      gradient: 'from-green-500 to-teal-500',
      data: {
        today: formatCurrency(overviewData?.todaysWithdraw || 0),
        total: formatCurrency(overviewData?.totalWithdraw || 0)
      }
    },
    {
      title: 'Total Payin',
      value: formatCurrency(overviewData?.totalPayin || 0),
      icon: <FiTrendingUp className="w-6 h-6" />,
      change: overviewData ? `${formatCurrency(overviewData.todaysPayin)} today` : '৳0 today',
      isPositive: true,
      gradient: 'from-purple-500 to-pink-500',
      data: {
        today: formatCurrency(overviewData?.todaysPayin || 0),
        total: formatCurrency(overviewData?.totalPayin || 0)
      }
    },
    {
      title: 'Total Payout',
      value: formatCurrency(overviewData?.totalPayout || 0),
      icon: <FiTrendingDown className="w-6 h-6" />,
      change: overviewData ? `${formatCurrency(overviewData.todaysPayout)} today` : '৳0 today',
      isPositive: true,
      gradient: 'from-amber-500 to-orange-500',
      data: {
        today: formatCurrency(overviewData?.todaysPayout || 0),
        total: formatCurrency(overviewData?.totalPayout || 0)
      }
    },
    {
      title: 'Nagad Free',
      value: formatCurrency(overviewData?.totalNagadFree || 0),
      icon: <FaBangladeshiTakaSign className="w-6 h-6" />,
      change: overviewData ? `${formatCurrency(overviewData.todaysNagadFree)} today` : '৳0 today',
      isPositive: true,
      gradient: 'from-green-600 to-emerald-600',
      data: {
        today: formatCurrency(overviewData?.todaysNagadFree || 0),
        total: formatCurrency(overviewData?.totalNagadFree || 0)
      }
    },
    {
      title: 'Bank Transfer',
      value: formatCurrency(overviewData?.totalBankTransfer || 0),
      icon: <FiCreditCard className="w-6 h-6" />,
      change: overviewData ? `${formatCurrency(overviewData.todaysBankTransfer)} today` : '৳0 today',
      isPositive: true,
      gradient: 'from-blue-600 to-cyan-600',
      data: {
        today: formatCurrency(overviewData?.todaysBankTransfer || 0),
        total: formatCurrency(overviewData?.totalBankTransfer || 0)
      }
    },
    {
      title: 'Net Balance',
      value: formatCurrency(overviewData?.netBalance || 0),
      icon: <FaExchangeAlt className="w-6 h-6" />,
      change: overviewData ? 
        `${Math.abs(calculatePercentage(
          overviewData.netBalance,
          overviewData.totalIncome
        ))}% ${overviewData.netBalance >= 0 ? 'profit' : 'loss'}` 
        : '0%',
      isPositive: overviewData ? overviewData.netBalance >= 0 : true,
      gradient: overviewData && overviewData.netBalance >= 0 
        ? 'from-green-700 to-emerald-700' 
        : 'from-red-700 to-orange-700',
      data: {
        income: formatCurrency(overviewData?.totalIncome || 0),
        expense: formatCurrency(overviewData?.totalExpense || 0)
      }
    }
  ];

  // Status cards data
  const statusCards = [
    {
      title: 'Today\'s Summary',
      icon: <FaCalendarAlt className="text-indigo-500" />,
      data: [
        { label: 'Total Income', value: formatCurrency(overviewData?.todaysIncome || 0), icon: <FiTrendingUp className="text-green-500" />, color: 'bg-green-100' },
        { label: 'Total Expense', value: formatCurrency(overviewData?.todaysExpense || 0), icon: <FiTrendingDown className="text-red-500" />, color: 'bg-red-100' },
        { label: 'Net Today', value: formatCurrency((overviewData?.todaysIncome || 0) - (overviewData?.todaysExpense || 0)), icon: <FaExchangeAlt className="text-blue-500" />, color: 'bg-blue-100' }
      ]
    },
    {
      title: 'Rejected Transactions',
      icon: <FiXCircle className="text-red-500" />,
      data: [
        { label: 'Rejected Deposit', value: formatCurrency(overviewData?.totalRejectedDeposit || 0), icon: <FaBangladeshiTakaSign className="text-red-500" />, color: 'bg-red-100' },
        { label: 'Rejected Withdraw', value: formatCurrency(overviewData?.totalRejectedWithdraw || 0), icon: <FiCreditCard className="text-red-500" />, color: 'bg-red-100' },
        { label: 'Rejected Payin', value: formatCurrency(overviewData?.totalRejectedPayin || 0), icon: <FiTrendingUp className="text-red-500" />, color: 'bg-red-100' },
        { label: 'Rejected Payout', value: formatCurrency(overviewData?.totalRejectedPayout || 0), icon: <FiTrendingDown className="text-red-500" />, color: 'bg-red-100' },
        { label: 'Rejected Nagad Free', value: formatCurrency(overviewData?.totalRejectedNagadFree || 0), icon: <FaBangladeshiTakaSign className="text-red-500" />, color: 'bg-red-100' },
        { label: 'Rejected Bank Transfer', value: formatCurrency(overviewData?.totalRejectedBankTransfer || 0), icon: <FiCreditCard className="text-red-500" />, color: 'bg-red-100' }
      ]
    },
    {
      title: 'Tax Information',
      icon: <FaFileAlt className="text-purple-500" />,
      data: [
        { label: 'Total Withdraw Tax', value: formatCurrency(overviewData?.totalWithdrawTax || 0), icon: <FaDollarSign className="text-purple-500" />, color: 'bg-purple-100' },
        { label: "Today's Withdraw Tax", value: formatCurrency(overviewData?.todaysWithdrawTax || 0), icon: <FaCalendarAlt className="text-purple-500" />, color: 'bg-purple-100' },
        { label: 'Tax Rate', value: overviewData && overviewData.totalWithdraw > 0 ? `${calculatePercentage(overviewData.totalWithdrawTax, overviewData.totalWithdraw)}%` : '0%', icon: <FiTrendingUp className="text-purple-500" />, color: 'bg-purple-100' }
      ]
    },
    {
      title: 'Performance Trends',
      icon: <FiTrendingUp className="text-teal-500" />,
      data: [
        { label: 'Income Trend', value: overviewData ? `${overviewData.incomePercentageDifference}% ${overviewData.incomeTrend}` : '0%', icon: overviewData && overviewData.incomeTrend === 'up' ? <FiTrendingUp className="text-green-500" /> : <FiTrendingDown className="text-red-500" />, color: overviewData && overviewData.incomeTrend === 'up' ? 'bg-green-100' : 'bg-red-100' },
        { label: 'Expense Trend', value: overviewData ? `${overviewData.expensePercentageDifference}% ${overviewData.expenseTrend}` : '0%', icon: overviewData && overviewData.expenseTrend === 'up' ? <FiTrendingUp className="text-green-500" /> : <FiTrendingDown className="text-red-500" />, color: overviewData && overviewData.expenseTrend === 'up' ? 'bg-green-100' : 'bg-red-100' },
        { label: 'Net Flow', value: overviewData ? formatCurrency(overviewData.incomeDifference - overviewData.expenseDifference) : '৳0', icon: overviewData && (overviewData.incomeDifference - overviewData.expenseDifference) >= 0 ? <FiTrendingUp className="text-green-500" /> : <FiTrendingDown className="text-red-500" />, color: overviewData && (overviewData.incomeDifference - overviewData.expenseDifference) >= 0 ? 'bg-green-100' : 'bg-red-100' }
      ]
    }
  ];

  // Prepare pie chart data for payment breakdown
  const paymentBreakdownData = [
    { 
      name: 'Deposit', 
      value: overviewData?.totalDeposit || 0, 
      color: '#3B82F6' 
    },
    { 
      name: 'Payin', 
      value: overviewData?.totalPayin || 0, 
      color: '#8B5CF6' 
    },
    { 
      name: 'Nagad Free', 
      value: overviewData?.totalNagadFree || 0, 
      color: '#10B981' 
    },
    { 
      name: 'Bank Transfer', 
      value: overviewData?.totalBankTransfer || 0, 
      color: '#06B6D4' 
    },
    { 
      name: 'Withdraw', 
      value: overviewData?.totalWithdraw || 0, 
      color: '#F59E0B' 
    },
    { 
      name: 'Payout', 
      value: overviewData?.totalPayout || 0, 
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
                  {overviewData ? formatCurrency(overviewData.totalIncome) : '৳0'} total income
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
                  {overviewData ? 
                    formatCurrency(
                      (overviewData.totalDeposit || 0) + 
                      (overviewData.totalPayin || 0) + 
                      (overviewData.totalNagadFree || 0) + 
                      (overviewData.totalBankTransfer || 0) + 
                      (overviewData.totalWithdraw || 0) + 
                      (overviewData.totalPayout || 0)
                    ) + ' total'
                    : '৳0 total'}
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
                  {overviewData ? formatCurrency(overviewData.totalIncome) : '৳0'} total
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
                  {overviewData ? formatCurrency(overviewData.totalExpense) : '৳0'} total
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
            <h2 className="text-md font-semibold text-gray-700 mb-4">Recent Activity Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-blue-800">Today's Income</h3>
                  <FiTrendingUp className="text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-900 mt-2">
                  {formatCurrency(overviewData?.todaysIncome || 0)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {overviewData ? 
                    `${calculatePercentage(
                      overviewData.todaysIncome,
                      overviewData.totalIncome
                    )}% of total income` 
                    : '0% of total income'}
                </p>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-orange-800">Today's Expense</h3>
                  <FiTrendingDown className="text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-orange-900 mt-2">
                  {formatCurrency(overviewData?.todaysExpense || 0)}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  {overviewData ? 
                    `${calculatePercentage(
                      overviewData.todaysExpense,
                      overviewData.totalExpense
                    )}% of total expense` 
                    : '0% of total expense'}
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-green-800">Today's Net</h3>
                  <FaExchangeAlt className="text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-900 mt-2">
                  {formatCurrency(
                    (overviewData?.todaysIncome || 0) - (overviewData?.todaysExpense || 0)
                  )}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {overviewData ? 
                    `${Math.abs(calculatePercentage(
                      (overviewData.todaysIncome - overviewData.todaysExpense),
                      overviewData.todaysIncome
                    ))}% ${(overviewData.todaysIncome - overviewData.todaysExpense) >= 0 ? 'profit' : 'loss'}` 
                    : '0%'}
                </p>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-red-800">Today's Rejected</h3>
                  <FiXCircle className="text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-900 mt-2">
                  {formatCurrency(
                    (overviewData?.totalRejectedDeposit || 0) + 
                    (overviewData?.totalRejectedWithdraw || 0) + 
                    (overviewData?.totalRejectedPayin || 0) + 
                    (overviewData?.totalRejectedPayout || 0) +
                    (overviewData?.totalRejectedNagadFree || 0) +
                    (overviewData?.totalRejectedBankTransfer || 0)
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