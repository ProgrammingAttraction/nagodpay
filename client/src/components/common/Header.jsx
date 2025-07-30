import React, { useState } from "react";
import { FaBars, FaBell, FaCog } from "react-icons/fa";
import { BsDot } from "react-icons/bs";
import { IoSearchSharp, IoLogOutOutline } from "react-icons/io5";
import { RiUser3Line, RiSettings3Line } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";

const Header = ({ toggleSidebar }) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const { userData, loading, error, refreshUserData } = useUser();
  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('isAdmin');
    
    // Redirect to login
    navigate('/login');
  };

  return (
    <>
      {/* Custom Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] bg-opacity-50 flex items-center justify-center z-[2000]">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex flex-col items-center mb-4">
              <div className="bg-red-100 p-3 rounded-full mb-3">
                <IoLogOutOutline className="text-red-500 text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Confirm Logout</h3>
              <p className="text-gray-600 text-sm mt-1">Are you sure you want to sign out?</p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center font-jost justify-between p-4 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-[1000]">
        {/* Left: Sidebar toggle & search */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="md:hidden text-gray-500 hover:text-gray-700 text-xl transition"
          >
            <FaBars />
          </button>
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 w-64 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">
              <IoSearchSharp />
            </span>
          </div>
        </div>

        {/* Right: Icons & Profile */}
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <button className="p-2 rounded-[5px] text-gray-500 bg-gray-100 hover:text-gray-700 transition">
              <FaBell className="text-lg" />
              <BsDot className="text-yellow-500 text-xl absolute -top-1 -right-1" />
            </button>
          </div>

          <div className="relative group">
            <button className="p-2 rounded-[5px] text-gray-500 bg-gray-100 hover:text-gray-700 transition">
              <FaCog className="text-lg" />
            </button>
          </div>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownVisible(!dropdownVisible)}
              className="flex items-center space-x-2 focus:outline-none border-[2px] border-theme rounded-full"
            >
              <img
                src={`${base_url}/images/${userData?.identity}`}
                alt="Profile"
                className="w-8 h-8 cursor-pointer border-white shadow-sm rounded-full"
              />
            </button>

            {dropdownVisible && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-[17px] font-medium text-gray-800">{userData?.name}</p>
                  <p className="text-[17px] text-gray-500">{userData?.email}</p>
                  <p className="text-[17px] font-[500] text-gray-500">Balance : {userData?.balance}৳</p>
                </div>
                {/* <a
                  href="#"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <RiUser3Line className="mr-3 text-gray-500" />
                  My Profile
                </a> */}
                {/* <a
                  href="#"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <RiSettings3Line className="mr-3 text-gray-500" />
                  Settings
                </a> */}
                <button
                  onClick={() => {
                    setDropdownVisible(false);
                    setShowLogoutModal(true);
                  }}
                  className="w-full text-left flex cursor-pointer items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                >
                  <IoLogOutOutline className="mr-3 text-red-500" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;