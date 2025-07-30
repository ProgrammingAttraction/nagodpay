import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { FaMoneyCheckAlt } from 'react-icons/fa';

const Commissions = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  // Replace this with the actual user ID you want to fetch
  const user_info = JSON.parse(localStorage.getItem('userData'));

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('authToken'); // Get token from localStorage
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await axios.get(`${base_url}/api/user/single-user/${user_info._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          setUserData(response.data.user);
        } else {
          setError(response.data.message || 'Failed to fetch user data');
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message || 'Server error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  // if (loading) {
  //   return (
  //     <section className="flex h-screen overflow-hidden">
  //       {/* Sidebar and header code remains the same */}
  //       <div className="p-6">
  //         <div className="flex justify-center items-center h-64">
  //           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  //         </div>
  //       </div>
  //     </section>
  //   );
  // }

  // if (error) {
  //   return (
  //     <section className="flex h-screen overflow-hidden">
  //       {/* Sidebar and header code remains the same */}
  //       <div className="p-6">
  //         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
  //           Error: {error}
  //         </div>
  //       </div>
  //     </section>
  //   );
  // }

  return (
    <section className="flex h-screen overflow-hidden font-fira">
      {/* Sidebar */}
      <div className="shrink-0 h-screen overflow-y-auto overflow-x-hidden bg-white border-r">
        <Sidebar isOpen={sidebarOpen} />
      </div>

      {/* Main Content */}
      <section className="flex-1 w-full h-screen overflow-y-auto bg-gray-50">
        <Header toggleSidebar={toggleSidebar} />

        {/* Page Content */}
        <div className="p-6">
          {/* Title */}
          <div className="bg-gray-100 rounded-t-md px-4 py-3 border border-b-0 border-gray-200 text-gray-700 font-semibold text-lg">
            Applied Commissions
          </div>

          {/* Table */}
          <div className="overflow-x-auto bg-white border rounded-b-md shadow-sm border-gray-200">
            <table className="min-w-full text-sm text-left text-gray-700">
              <thead className="border-b border-gray-200">
                <tr className="bg-white">
                  <th className="px-6 py-4 font-medium">Payment Method</th>
                  <th className="px-6 py-4 font-medium">Commission %</th>
                  <th className="px-6 py-4 font-medium">Payout Commission %</th>
                  <th className="px-6 py-4 font-medium">Currency</th>
                  <th className="px-6 py-4 font-medium">Payment Brand</th>
                </tr>
              </thead>
              <tbody>
                {userData && (
                  <tr className="border-t border-gray-200">
                    <td className="px-6 py-4">{userData.paymentMethod || 'N/A'}</td>
                    <td className="px-6 py-4">{userData.depositcommission || '0'}%</td>
                    <td className="px-6 py-4">{userData.withdracommission || '0'}%</td>
                    <td className="px-6 py-4">Bangladeshi Taka (BDT)</td>
                    <td className="px-6 py-4">{userData.paymentbrand || 'N/A'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </section>
  );
};

export default Commissions;