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
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('month'); // 'today', 'month', 'year', 'all'
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('authToken');
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const [getwaycost,setgetwaycost]=useState();
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${base_url}/api/admin/analytics`, {
          params: { period },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setAnalyticsData(response.data.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch analytics');
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };
  const fetchgetwaycost= async () => {
      try {
        const response = await axios.get(`${base_url}/api/admin/total-getwaycost`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setgetwaycost(response.data.totalGetwaycost)
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch analytics');
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchgetwaycost();
    fetchAnalytics();
  }, [period, base_url, token]);

  // Format currency values
  const formatCurrency = (value) => `৳${(value / 100).toLocaleString()}`;

  // Calculate percentage
  const calculatePercentage = (value, total) => {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  // Summary cards data
  const summaryCards = [
    {     
      title: 'Total Payin',
      value: `৳${analyticsData?.totals.payin.total}`,
      icon: <FaBangladeshiTakaSign className="w-6 h-6" />,
      change: analyticsData ? `${calculatePercentage(analyticsData.totals.payin.completed, analyticsData.totals.payin.total)}% completed` : '0%',
      isPositive: true,
      gradient: 'from-indigo-500 to-blue-500',
      data: {
        completed: analyticsData?.totals.payin.completed || 0,
        pending: analyticsData?.totals.payin.pending || 0,
        rejected: analyticsData?.totals.payin.rejected || 0
      }
    },
    {
      title: 'Total Payout',
      value:`৳${analyticsData?.totals.payout.total }`,
      icon: <FiCreditCard className="w-6 h-6" />,
      change: analyticsData ? `${calculatePercentage(analyticsData.totals.payout.success, analyticsData.totals.payout.total)}% success` : '0%',
      isPositive: true,
      gradient: 'from-green-500 to-teal-500',
      data: {
        success: analyticsData?.totals.payout.success || 0,
        pending: analyticsData?.totals.payout.pending || 0,
        rejected: analyticsData?.totals.payout.rejected || 0
      }
    },
    {
      title: 'Net Balance',
      value: analyticsData?.totals.net,
      icon: <FiTrendingUp className="w-6 h-6" />,
      change: analyticsData ? 
        `${Math.abs(calculatePercentage(analyticsData.totals.net, analyticsData.totals.payin.total))}% ${analyticsData.totals.net >= 0 ? 'profit' : 'loss'}` 
        : '0%',
      isPositive: analyticsData ? analyticsData.totals.net >= 0 : true,
      gradient: analyticsData?.totals.net >= 0 ? 'from-purple-500 to-pink-500' : 'from-red-500 to-orange-500',
      data: {
        payin: analyticsData?.totals.payin.total || 0,
        payout: analyticsData?.totals.payout.total || 0
      }
    },
    {
      title: 'Total Transactions',
      value: (analyticsData ? 
        (analyticsData.statusCounts.payin.completed + analyticsData.statusCounts.payin.pending + analyticsData.statusCounts.payin.rejected +
         analyticsData.statusCounts.payout.success + analyticsData.statusCounts.payout.pending + analyticsData.statusCounts.payout.rejected) 
        : 0).toLocaleString(),
      icon: <FiCheckCircle className="w-6 h-6" />,
      change: analyticsData ? 
        `${calculatePercentage(
          analyticsData.statusCounts.payin.completed + analyticsData.statusCounts.payout.success,
          analyticsData.statusCounts.payin.completed + analyticsData.statusCounts.payin.pending + analyticsData.statusCounts.payin.rejected +
          analyticsData.statusCounts.payout.success + analyticsData.statusCounts.payout.pending + analyticsData.statusCounts.payout.rejected
        )}% successful` 
        : '0%',
      isPositive: true,
      gradient: 'from-amber-500 to-orange-500',
      data: {
        successful: analyticsData ? 
          (analyticsData.statusCounts.payin.completed + analyticsData.statusCounts.payout.success) : 0,
        pending: analyticsData ? 
          (analyticsData.statusCounts.payin.pending + analyticsData.statusCounts.payout.pending) : 0,
        rejected: analyticsData ? 
          (analyticsData.statusCounts.payin.rejected + analyticsData.statusCounts.payout.rejected) : 0
      }
    },
        {
      title: 'Total Revenue',
      value:`৳${getwaycost}`,
      icon: <FiCheckCircle className="w-6 h-6" />,
      isPositive: true,
      gradient: 'from-amber-500 to-orange-500',
      data: {
      }
    }
  ];

  // Status cards data
  const statusCards = [
    {
      title: 'Payin Status',
      icon: <FaBangladeshiTakaSign className="text-indigo-500" />,
      data: [
        { label: 'Completed', value: analyticsData?.statusCounts.payin.completed || 0, amount: analyticsData?.totals.payin.completed || 0, icon: <FiCheckCircle className="text-green-500" />, color: 'bg-green-100' },
        { label: 'Pending', value: analyticsData?.statusCounts.payin.pending || 0, amount: analyticsData?.totals.payin.pending || 0, icon: <FiClock className="text-orange-500" />, color: 'bg-orange-100' },
        { label: 'Rejected', value: analyticsData?.statusCounts.payin.rejected || 0, amount: analyticsData?.totals.payin.rejected || 0, icon: <FiXCircle className="text-red-500" />, color: 'bg-red-100' }
      ]
    },
    {
      title: 'Payout Status',
      icon: <FaExchangeAlt className="text-blue-500" />,
      data: [
        { label: 'Success', value: analyticsData?.statusCounts.payout.success || 0, amount: analyticsData?.totals.payout.success || 0, icon: <FiCheckCircle className="text-green-500" />, color: 'bg-green-100' },
        { label: 'Pending', value: analyticsData?.statusCounts.payout.pending || 0, amount: analyticsData?.totals.payout.pending || 0, icon: <FiClock className="text-orange-500" />, color: 'bg-orange-100' },
        { label: 'Rejected', value: analyticsData?.statusCounts.payout.rejected || 0, amount: analyticsData?.totals.payout.rejected || 0, icon: <FiXCircle className="text-red-500" />, color: 'bg-red-100' }
      ]
    },
    {
      title: 'Payin Summary',
      icon: <FiTrendingUp className="text-purple-500" />,
      data: [
        { label: 'Total Amount', value: analyticsData?.totals.payin.total || 0, icon: <FaBangladeshiTakaSign className="text-indigo-500" />, color: 'bg-indigo-100' },
        { label: 'Avg. Transaction', value: analyticsData?.payin.byProvider[0]?.avgAmount || 0, icon: <FaDollarSign className="text-blue-500" />, color: 'bg-blue-100' },
        { label: 'Total Transactions', value: (analyticsData?.statusCounts.payin.completed + analyticsData?.statusCounts.payin.pending + analyticsData?.statusCounts.payin.rejected || 0).toLocaleString(), icon: <FaFileAlt className="text-teal-500" />, color: 'bg-teal-100' }
      ]
    },
    {
      title: 'Payout Summary',
      icon: <FiTrendingDown className="text-teal-500" />,
      data: [
        { label: 'Total Amount', value: analyticsData?.totals.payout.total || 0, icon: <FaBangladeshiTakaSign className="text-green-500" />, color: 'bg-green-100' },
        { label: 'Avg. Transaction', value: analyticsData?.payout.byProvider[0]?.avgAmount || 0, icon: <FaDollarSign className="text-amber-500" />, color: 'bg-amber-100' },
        { label: 'Total Transactions', value: (analyticsData?.statusCounts.payout.success + analyticsData?.statusCounts.payout.pending + analyticsData?.statusCounts.payout.rejected || 0).toLocaleString(), icon: <FaFileAlt className="text-pink-500" />, color: 'bg-pink-100' }
      ]
    }
  ];

  // Format trend data for charts
  const formatTrendData = (trendData) => {
    if (!trendData || !trendData.length) return [];
    
    if (period === 'today') {
      return trendData.map(item => ({
        time: `${item._id}:00`,
        value: item.amount / 100
      }));
    } else if (period === 'month') {
      return trendData.map(item => ({
        time: `Day ${item._id}`,
        value: item.amount / 100
      }));
    } else {
      return trendData.map(item => ({
        time: moment().month(item._id - 1).format('MMM'),
        value: item.amount / 100
      }));
    }
  };

  // Prepare pie chart data for payment breakdown
  const paymentBreakdownData = [
    { 
      name: 'Payin', 
      value: analyticsData ? analyticsData.totals.payin.total / 100 : 0, 
      color: '#3B82F6' 
    },
    { 
      name: 'Payout', 
      value: analyticsData ? analyticsData.totals.payout.total / 100 : 0, 
      color: '#F59E0B' 
    }
  ];

  // Prepare provider distribution data
  const providerData = [
    ...(analyticsData?.payin.byProvider.map(provider => ({
      name: provider._id,
      payin: provider.totalAmount / 100,
      payout: analyticsData?.payout.byProvider.find(p => p._id === provider._id)?.totalAmount / 100 || 0
    })) || [])
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
          {/* Header and Period Selector */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Payment Analytics Dashboard</h1>
              <p className="text-sm text-gray-500">
                {analyticsData?.period ? 
                  `Showing data from ${moment(analyticsData.period.start).format('MMM D, YYYY')} to ${moment(analyticsData.period.end).format('MMM D, YYYY')}` 
                  : 'Loading period data...'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 bg-white p-1 rounded-lg shadow-sm">
              <button 
                onClick={() => setPeriod('today')} 
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${period === 'today' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Today
              </button>
              <button 
                onClick={() => setPeriod('month')} 
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${period === 'month' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                This Month
              </button>
              <button 
                onClick={() => setPeriod('year')} 
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${period === 'year' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                This Year
              </button>
              <button 
                onClick={() => setPeriod('all')} 
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${period === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                All Time
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
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {Object.entries(card.data).map(([key, value]) => (
                        <div key={key} className="bg-white bg-opacity-10 rounded p-1 text-center">
                          <p className="text-xs opacity-80 text-gray-800 font-[700] capitalize">{key}</p>
                          <p className="text-sm text-gray-800 font-[700]">
                            {typeof value === 'number' ? value : value}
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
                        {item.amount !== undefined && (
                          <p className="text-xs text-gray-500">{item.amount}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Payin Trend Chart */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-md font-semibold text-gray-700">Payin Trend</h2>
                <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">
                  {analyticsData?.totals.payin.total ? analyticsData.totals.payin.total : '৳0'}
                </span>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={formatTrendData(analyticsData?.payin.trend)} 
                    margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="time" 
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
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, stroke: '#3B82F6', fill: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 2, stroke: '#3B82F6', fill: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payout Trend Chart */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-md font-semibold text-gray-700">Payout Trend</h2>
                <span className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded-full">
                  {analyticsData?.totals.payout.total ? analyticsData.totals.payout.total : '৳0'}
                </span>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={formatTrendData(analyticsData?.payout.trend)} 
                    margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="time" 
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
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#F59E0B"
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2, stroke: '#F59E0B', fill: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 2, stroke: '#F59E0B', fill: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Provider Distribution and Payment Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Provider Distribution */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-md font-semibold text-gray-700">Provider Distribution</h2>
                <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full">
                  {analyticsData?.payin.byProvider.length || 0} providers
                </span>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={providerData} 
                    margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
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
                      dataKey="payin" 
                      name="Payin" 
                      fill="#3B82F6" 
                      radius={[4, 4, 0, 0]} 
                      barSize={24}
                    />
                    <Bar 
                      dataKey="payout" 
                      name="Payout" 
                      fill="#F59E0B" 
                      radius={[4, 4, 0, 0]} 
                      barSize={24}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-md font-semibold text-gray-700">Payment Breakdown</h2>
                <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-full">
                  {analyticsData ? 
                    `${analyticsData.totals.payin.total + analyticsData.totals.payout.total} total` 
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
                <div className="flex justify-center gap-4 mt-2">
                  {paymentBreakdownData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
                      <span className="text-xs font-medium text-gray-600">
                        {entry.name}: {entry.value * 100}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top Accounts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Payin Accounts */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h2 className="text-md font-semibold text-gray-700 mb-4">Top Payin Accounts</h2>
              <div className="space-y-4">
                {analyticsData?.payin.topAccounts.length > 0 ? (
                  analyticsData.payin.topAccounts.map((account, index) => (
                    <div key={index} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                          <FiUserPlus className="text-indigo-600" />
                        </div>
                        <span className="font-medium text-sm text-gray-700">
                          {account._id || 'Unknown Account'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold block text-gray-800">
                          ৳{account.totalAmount}
                        </span>
                        <span className="text-xs text-gray-500">
                          {account.count} transaction{account.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FiCheckCircle className="mx-auto text-gray-300 text-3xl mb-2" />
                    <p className="text-gray-500">No payin accounts data</p>
                  </div>
                )}
              </div>
            </div>

            {/* Top Payout Accounts */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h2 className="text-md font-semibold text-gray-700 mb-4">Top Payout Accounts</h2>
              <div className="space-y-4">
                {analyticsData?.payout.topAccounts.length > 0 ? (
                  analyticsData.payout.topAccounts.map((account, index) => (
                    <div key={index} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="bg-amber-100 p-2 rounded-lg">
                          <FiUserPlus className="text-amber-600" />
                        </div>
                        <span className="font-medium text-sm text-gray-700">
                          {account._id || 'Unknown Account'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold block text-gray-800">
                          ৳{account.totalAmount}
                        </span>
                        <span className="text-xs text-gray-500">
                          {account.count} transaction{account.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FiCreditCard className="mx-auto text-gray-300 text-3xl mb-2" />
                    <p className="text-gray-500">No payout accounts data</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
};

export default Dashboard;