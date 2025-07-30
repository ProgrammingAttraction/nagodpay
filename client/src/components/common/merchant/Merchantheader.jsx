import React, { useState, useRef, useEffect } from 'react';
import { HiOutlineMenuAlt2 } from 'react-icons/hi';
import { FiSettings } from 'react-icons/fi';
import { FiUser, FiLogOut } from 'react-icons/fi';
import { NavLink } from 'react-router-dom';
import logo from "../../../assets/logo.png"
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast"
import axios from "axios"
const Merchantheader = ({ toggleSidebar }) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const dropdownRef = useRef(null);
    const [loading, setLoading] = useState(true);
  // Mock user data - you should replace this with actual data from your state/context/API
  const [userData, setUserData] = useState({
    name: "John Doe",
    email: "john@example.com",
    balance: "$5,000.00"
  });
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('merchantToken');
  const merchant_info = JSON.parse(localStorage.getItem("merchantData"));
  const [merchantData, setMerchantData] = useState(null);

  useEffect(() => {
    const fetchMerchantData = async () => {
      try {
        const response = await axios.get(`${base_url}/api/merchant/merchant-info/${merchant_info._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
       console.log(response)
        if (response.data.success) {
          setMerchantData(response.data.merchant);
          setFormData({
            name: response.data.merchant.name,
            email: response.data.merchant.email,
            websiteUrl: response.data.merchant.websiteUrl,
            password: '' // Don't pre-fill password for security
          });
        } else {
          console.log('Failed to fetch merchant data');
        }
      } catch (err) {
        console.log('Failed to fetch merchant data');
        console.error('Error fetching merchant data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMerchantData();
  }, []);
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigate = useNavigate();

  // -------------------logout-funtion---------------------
  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, logout",
    }).then((result) => {
      if (result.isConfirmed) {
        // Remove localStorage data
        localStorage.removeItem('merchantData');
        localStorage.removeItem('merchantToken');

        // Optional: show a success message
        toast.success("You have been logged out.");

        // Redirect to /admin-login after a short delay
        setTimeout(() => {
          navigate("/merchant-login");
        }, 1000);
      }
    });
  };

  return (
    <header className='w-full h-[9vh] bg-orange-400 font-anek fixed top-0 left-0 z-[1000] px-[20px] font-nunito py-[10px] flex justify-between items-center shadow-sm shadow-lg border-gray-200'>
      {/* Left Side Logo + Menu */}
      <div className="logo flex justify-start items-center gap-[20px] w-full ">
        <NavLink to="/dashboard" className='md:flex justify-start items-center  gap-[12px] hidden md:w-[25%] lg:w-[20%] xl:w-[14%]'>
          <img className=' h-[40px]' src={logo} alt="logo" />
          <h1 className='font-[600] text-[20px] md:text-[22px] text-blue-700'>NagodPay</h1>
        </NavLink>
        <div className="menu text-[25px] cursor-pointer text-white" onClick={toggleSidebar}>
          <HiOutlineMenuAlt2 />
        </div>
      </div>

      {/* Right Side - Settings & Admin */}
      <div className="relative flex items-center gap-4" ref={dropdownRef}>
        <button className="text-[22px] text-white hover:text-[#0A92FA] transition duration-200">
          <FiSettings />
        </button>

        {/* Profile Pic */}
        <div 
          onClick={() => setDropdownVisible(!dropdownVisible)}
          className="cursor-pointer"
        >
          <img
            className="w-[40px] h-[40px] rounded-full"
            src="https://www.radiustheme.com/demo/html/psdboss/akkhor/akkhor/img/figure/admin.jpg"
            alt="admin"
          />
        </div>

        {/* Dropdown */}
        {dropdownVisible && (
          <div className="absolute top-[55px] right-0 bg-white shadow-lg border border-gray-200 rounded-lg w-[220px] z-50">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="font-medium text-gray-900">{merchantData?.name}</div>
              <div className="text-sm text-gray-500 truncate">{merchantData?.email}</div>
              <div className="text-sm font-semibold text-green-600 mt-1">Balance: {merchantData?.balance}</div>
            </div>
            <ul className="flex flex-col py-2 text-[15px] text-gray-700">
              <NavLink 
                to="/dashboard/settings/profile" 
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 transition cursor-pointer"
                onClick={() => setDropdownVisible(false)}
              >
                <FiUser className="text-[18px]" />
                <span>Profile</span>
              </NavLink>
              
              <li 
                onClick={handleLogout} 
                className="flex items-center gap-2 px-4 py-2 hover:bg-red-50 transition cursor-pointer text-red-600"
              >
                <FiLogOut className="text-[18px]" />
                <span>Logout</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
};

export default Merchantheader;