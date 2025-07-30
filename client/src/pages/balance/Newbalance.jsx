import React, { useState } from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { FaEdit } from 'react-icons/fa';
import { useUser } from '../../context/UserContext';

const Newbalance = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {userData}=useUser();
  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };
 const providernet=userData?.totalpayment-userData?.providercost;

  return (
    <section className="flex h-screen font-fira overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <div className="shrink-0 h-screen overflow-y-auto overflow-x-hidden bg-white border-r">
        <Sidebar isOpen={sidebarOpen} />
      </div>

      {/* Main Content */}
      <section className="flex-1 w-full h-screen overflow-y-auto">
        <Header toggleSidebar={toggleSidebar} />

        {/* Page Title */}
        <div className="px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Balances</h2>

          {/* Table Card */}
          <div className="bg-white shadow rounded-md overflow-hidden border border-gray-200">
            {/* Table Header */}
            <div className="bg-gray-100 px-4 py-3 font-semibold text-gray-700 border-b border-gray-200">BDT</div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-gray-800">
                <thead className="bg-white border-b">
                  <tr>
                    <th className="px-6 py-3">Payment Method</th>
                    <th className="px-6 py-3">Payment Amount</th>
                    <th className="px-6 py-3">Provider Cost</th>
                    {/* <th className="px-6 py-3">Provider Net</th> */}
                    <th className="px-6 py-3">Payout Amount</th>
                    <th className="px-6 py-3">Prepayment Amount</th>
                    <th className="px-6 py-3">Balance</th>
                    {/* <th className="px-6 py-3">Action</th> */}
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white border-t border-gray-200">
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 text-white bg-green-600 text-xs font-semibold rounded">
                        {userData?.paymentMethod}
                      </span>
                    </td>
<td className="px-6 py-4">৳{userData?.totalpayment?.toLocaleString()}</td>
<td className="px-6 py-4">৳{userData?.providercost?.toLocaleString()}</td>
{/* <td className="px-6 py-4">৳{providernet?.toLocaleString()}</td> */}
<td className="px-6 py-4">৳{userData?.totalpayout?.toLocaleString()}</td>
<td className="px-6 py-4">৳{userData?.totalprepayment?.toLocaleString()}</td>
<td className="px-6 py-4">৳{userData?.balance}</td>
                    {/* <td className="px-6 py-4">
                      <button className="text-blue-600 hover:text-blue-800">
                        <FaEdit className="text-lg" />
                      </button>
                    </td> */}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
};

export default Newbalance;
