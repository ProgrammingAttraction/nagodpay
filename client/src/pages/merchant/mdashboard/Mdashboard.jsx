import React, { useState, useEffect } from 'react';
import Merchantheader from '../../../components/common/merchant/Merchantheader';
import Merchantsidebar from '../../../components/common/merchant/Merchantsidebar';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import { FiDollarSign, FiCreditCard, FiUsers, FiTrendingUp, FiCalendar, FiFilter } from 'react-icons/fi';
import { FaBangladeshiTakaSign } from "react-icons/fa6";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const Mdashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previousMonthData, setPreviousMonthData] = useState(null);
  const [gatewayHistory, setGatewayHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState('month');
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    end: new Date()
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('merchantToken');
  const merchantId = JSON.parse(localStorage.getItem('merchantData'));

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [dashboardRes, historyRes] = await Promise.all([
          fetch(`${base_url}/api/merchant/transactions/${merchantId._id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          fetchGatewayHistory('month')
        ]);

        const dashboardJson = await dashboardRes.json();
        setDashboardData(dashboardJson.data);
        
        setPreviousMonthData({
          totalPayin: 1000,
          totalPayout: 700,
          totalPaymentRequests: 250,
          payinStatusCounts: {
            completed: 900,
            rejected: 100
          },
          payoutStatusCounts: {
            success: 650,
            rejected: 50
          }
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const fetchGatewayHistory = async (period) => {
    try {
      setHistoryLoading(true);
      let url = `${base_url}/api/merchants/${merchantId._id}/gateway-history?period=${period}`;
      
      if (period === 'custom') {
        const startStr = customDateRange.start.toISOString().split('T')[0];
        const endStr = customDateRange.end.toISOString().split('T')[0];
        url += `&customStart=${startStr}&customEnd=${endStr}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      setGatewayHistory(data.history || []);
    } catch (error) {
      console.error('Error fetching gateway history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleFilterChange = (newFilter) => {
    setTimeFilter(newFilter);
    fetchGatewayHistory(newFilter);
  };

  const handleDateChange = (dates) => {
    const [start, end] = dates;
    setCustomDateRange({ start, end });
    if (start && end) {
      setTimeFilter('custom');
      fetchGatewayHistory('custom');
      setShowDatePicker(false);
    }
  };

  // Calculate dynamic percentages
  const calculatePercentage = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  // Success rates
  const payinSuccessRate = dashboardData?.counts?.payinStatusCounts?.completed 
    ? ((dashboardData.counts.payinStatusCounts.completed / dashboardData.counts.totalPayin) * 100).toFixed(1)
    : '0';

  const payoutSuccessRate = dashboardData?.counts?.payoutStatusCounts?.success 
    ? ((dashboardData.counts.payoutStatusCounts.success / dashboardData.counts.totalPayout) * 100).toFixed(1)
    : '0';

  const paymentRequestSuccessRate = dashboardData?.counts?.paymentRequestStatusCounts?.completed
    ? ((dashboardData.counts.paymentRequestStatusCounts.completed / dashboardData.counts.totalPaymentRequests) * 100).toFixed(1)
    : '0';

  // Percentage changes from previous month
  const payinChange = previousMonthData 
    ? calculatePercentage(dashboardData?.counts?.totalPayin || 0, previousMonthData.totalPayin)
    : '0';
  
  const payoutChange = previousMonthData 
    ? calculatePercentage(dashboardData?.counts?.totalPayout || 0, previousMonthData.totalPayout)
    : '0';
  
  const paymentRequestChange = previousMonthData 
    ? calculatePercentage(dashboardData?.counts?.totalPaymentRequests || 0, previousMonthData.totalPaymentRequests)
    : '0';
  
  const payinSuccessChange = previousMonthData 
    ? calculatePercentage(
        parseFloat(payinSuccessRate),
        (previousMonthData.payinStatusCounts.completed / previousMonthData.totalPayin) * 100
      )
    : '0';

  // Chart data preparation
  const payinStatusData = dashboardData?.counts ? Object.entries(dashboardData.counts.payinStatusCounts).map(([name, value]) => ({
    name,
    value
  })) : [];

  const payoutStatusData = dashboardData?.counts ? Object.entries(dashboardData.counts.payoutStatusCounts).map(([name, value]) => ({
    name,
    value
  })) : [];

  const monthlyTransactionData = [
    { name: 'Jan', payin: 4000, payout: 2400 },
    { name: 'Feb', payin: 3000, payout: 1398 },
    { name: 'Mar', payin: 2000, payout: 9800 },
    { name: 'Apr', payin: 2780, payout: 3908 },
    { name: 'May', payin: 1890, payout: 4800 },
    { name: 'Jun', payin: 2390, payout: 3800 },
    { name: 'Jul', payin: 3490, payout: 4300 },
  ];

  // Prepare gateway history chart data
  const gatewayHistoryChartData = gatewayHistory.map(entry => ({
    date: new Date(entry.updatedAt).toLocaleDateString(),
    amount: entry.amount,
    type: entry.amount >= 0 ? 'Credit' : 'Debit'
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section className="font-nunito font-anek h-screen bg-gray-50">
      <Merchantheader toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh] h-[90vh]">
        <Merchantsidebar isOpen={isSidebarOpen} />

        <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.3 }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">Total Payin</p>
                      <p className="text-2xl font-bold">৳{dashboardData?.mathed_merchant?.total_payin || 0}</p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-400 bg-opacity-30">
                      <FaBangladeshiTakaSign className="text-2xl" />
                    </div>
                  </div>
                  <div className="mt-4 text-xs font-medium">
                    <span className={`${payinChange >= 0 ? 'text-blue-200' : 'text-red-200'}`}>
                      {payinChange >= 0 ? '↑' : '↓'} {Math.abs(payinChange)}% from last month
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.4 }}
                  className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">Total Payout</p>
                      <p className="text-2xl font-bold">৳{dashboardData?.mathed_merchant?.total_payout || 0}</p>
                    </div>
                    <div className="p-3 rounded-full bg-green-400 bg-opacity-30">
                      <FiCreditCard className="text-2xl" />
                    </div>
                  </div>
                  <div className="mt-4 text-xs font-medium">
                    <span className={`${payoutChange >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                      {payoutChange >= 0 ? '↑' : '↓'} {Math.abs(payoutChange)}% from last month
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.5 }}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">Payment Requests</p>
                      <p className="text-2xl font-bold">{dashboardData?.counts?.totalPaymentRequests || 0}</p>
                    </div>
                    <div className="p-3 rounded-full bg-purple-400 bg-opacity-30">
                      <FiUsers className="text-2xl" />
                    </div>
                  </div>
                  <div className="mt-4 text-xs font-medium">
                    <span className={`${paymentRequestChange >= 0 ? 'text-purple-200' : 'text-red-200'}`}>
                      {paymentRequestChange >= 0 ? '↑' : '↓'} {Math.abs(paymentRequestChange)}% from last month
                    </span>
                  </div>
                </motion.div>

                {/* Gateway Cost Card */}
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ duration: 0.6 }}
                  className="bg-gradient-to-r from-rose-500 to-rose-600 rounded-xl shadow-lg p-6 text-white"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">Gateway Cost</p>
                      <p className="text-2xl font-bold">৳{dashboardData?.mathed_merchant?.getwaycost || 0}</p>
                    </div>
                    <div className="p-3 rounded-full bg-rose-400 bg-opacity-30">
                      <FaBangladeshiTakaSign className="text-2xl" />
                    </div>
                  </div>
                  <div className="mt-4 text-xs font-medium">
                    <span className="text-rose-200">
                      Current balance
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Monthly Transactions Line Chart */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7 }}
                  className="bg-white p-6 rounded-xl shadow-lg"
                >
                  <h3 className="text-lg font-semibold mb-4">Monthly Transactions</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyTransactionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="payin"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="payout"
                          stroke="#10b981"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Payin Status Pie Chart */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7 }}
                  className="bg-white p-6 rounded-xl shadow-lg"
                >
                  <h3 className="text-lg font-semibold mb-4">Payin Status Distribution</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={payinStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => {
                            const total = payinStatusData.reduce((sum, item) => sum + item.value, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${name}: ${percentage}%`;
                          }}
                        >
                          {payinStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => {
                            const total = payinStatusData.reduce((sum, item) => sum + item.value, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return [`${value} (${percentage}%)`, name];
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </div>

              {/* Gateway Cost History Section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="bg-white p-6 rounded-xl shadow-md border-[1px] border-gray-200 mb-8"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Gateway Cost History</h3>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <button 
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        className="flex items-center px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        <FiCalendar className="mr-2" />
                        {timeFilter === 'custom' 
                          ? `${customDateRange.start.toLocaleDateString()} - ${customDateRange.end.toLocaleDateString()}`
                          : timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)}
                      </button>
                      
                      {showDatePicker && (
                        <div className="absolute right-0 mt-2 z-10 bg-white shadow-lg rounded-lg p-2">
                          <DatePicker
                            selectsRange
                            startDate={customDateRange.start}
                            endDate={customDateRange.end}
                            onChange={handleDateChange}
                            inline
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                      {['day', 'week', 'month', 'year'].map((filter) => (
                        <button
                          key={filter}
                          onClick={() => handleFilterChange(filter)}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            timeFilter === filter ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                          }`}
                        >
                          {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {historyLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={gatewayHistoryChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" stroke="#888" />
                          <YAxis stroke="#888" />
                          <Tooltip 
                            formatter={(value) => [`৳${value}`, 'Amount']}
                            labelFormatter={(date) => `Date: ${date}`}
                          />
                          <Legend />
                          <Bar dataKey="amount" name="Amount" radius={[4, 4, 0, 0]}>
                            {gatewayHistoryChartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.amount >= 0 ? '#10B981' : '#EF4444'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border-[1px] border-gray-200">
                      <h4 className="font-medium text-gray-700 mb-3">Recent Transactions</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {gatewayHistory.slice(0, 5).map((entry, index) => (
                              <tr key={index}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                  {new Date(entry.updatedAt).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    entry.amount >= 0 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {entry.amount >= 0 ? 'Credit' : 'Debit'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${
                                  entry.amount >= 0 ? 'text-green-600' : 'text-red-600'
                                }">
                                  ৳{entry.amount >= 0 ? '+' : ''}{entry.amount}
                                </td>
                              </tr>
                            ))}
                            {gatewayHistory.length === 0 && (
                              <tr>
                                <td colSpan="3" className="px-4 py-4 text-center text-sm text-gray-500">
                                  No gateway cost history available
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </main>
      </div>
    </section>
  );
};

export default Mdashboard;