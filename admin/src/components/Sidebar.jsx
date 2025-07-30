import React, { useState, useEffect } from 'react';
import { FaHome, FaCog } from 'react-icons/fa'; // Added FaCog for settings icon
import { FiChevronRight } from 'react-icons/fi';
import { HiOutlineCalendar } from 'react-icons/hi';
import { PiStudent } from 'react-icons/pi';
import { MdOutlinePausePresentation } from "react-icons/md";
import { LiaChalkboardTeacherSolid } from 'react-icons/lia';
import { NavLink, useLocation } from 'react-router-dom';
import { LuClipboardList } from "react-icons/lu";
import { IoHomeOutline } from "react-icons/io5";
import { MdOutlineVideoChat } from "react-icons/md";
import { TfiLayoutSliderAlt } from "react-icons/tfi";
import { LuKeySquare } from "react-icons/lu";
import { MdOutlinePayment } from "react-icons/md";
import { MdOutlineSupervisorAccount } from "react-icons/md";


const Sidebar = ({ isOpen }) => {
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => {
    if (!openMenu) {
      if (location.pathname.startsWith('/dashboard')) {
        setOpenMenu('teachers');
      } else if (location.pathname.startsWith('/students')) {
        setOpenMenu('students');
      } else if (location.pathname.startsWith('/exam')) {
        setOpenMenu('exam');
      } else if (location.pathname.startsWith('/routine')) {
        setOpenMenu('routine');
      } else if (location.pathname.startsWith('/lesson')) {
        setOpenMenu('lessons');
      } else if (location.pathname.startsWith('/class-section')) {
        setOpenMenu('class');
      }
    }
  }, []); // Empty dependency = run only once

  const handleToggle = (menu) => {
    setOpenMenu(prev => (prev === menu ? null : menu));
  };

  return (
    <aside
      className={`transition-all duration-300 fixed w-[70%] md:w-[30%] lg:w-[20%] xl:w-[17%] h-full z-[999] border-r border-indigo-900 text-sm shadow-lg pt-[12vh] p-4 ${
        isOpen ? 'left-0 top-0' : 'left-[-120%] top-0'
      } bg-gradient-to-b from-indigo-950 to-indigo-900 text-white`}
    >
      {/* Dashboard */}
      <div className="mb-3">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center justify-between w-full px-3 py-2 text-[15px] lg:text-[16px] cursor-pointer rounded-[5px] transition duration-200 `
          }
        >
          <span className="flex items-center gap-2">
            <IoHomeOutline className="text-[18px]" />
            Dashboard
          </span>
        </NavLink>
      </div>
     <div className="mb-3">
        <NavLink
          to="/dashboard/agents"
          className={({ isActive }) =>
            `flex items-center justify-between w-full px-3 py-2 text-[15px] lg:text-[16px] cursor-pointer rounded-[5px] transition duration-200`
          }
        >
          <span className="flex items-center gap-2 text-gray-100">
            <LuClipboardList className="text-[18px]" />
            Agent
          </span>
        </NavLink>
      </div>
       <div className="mb-3">
        <NavLink
          to="/dashboard/prepayment-requests"
          className={({ isActive }) =>
            `flex items-center justify-between w-full px-3 py-2 text-[15px] lg:text-[16px] cursor-pointer rounded-[5px] transition duration-200`
          }
        >
          <span className="flex items-center gap-2 text-gray-100">
            <LuClipboardList className="text-[18px]" />
            Payment
          </span>
        </NavLink>
      </div>
         <div className="mb-3">
        <NavLink
          to="/dashboard/merchant-payment"
          className={({ isActive }) =>
            `flex items-center justify-between w-full px-3 py-2 text-[15px] lg:text-[16px] cursor-pointer rounded-[5px] transition duration-200`
          }
        >
          <span className="flex items-center gap-2 text-gray-100">
            <MdOutlinePayment className="text-[18px]" />
           Merchant Payment
          </span>
        </NavLink>
      </div>
               <div className="mb-3">
        <NavLink
          to="/dashboard/all-merchants"
          className={({ isActive }) =>
            `flex items-center justify-between w-full px-3 py-2 text-[15px] lg:text-[16px] cursor-pointer rounded-[5px] transition duration-200`
          }
        >
          <span className="flex items-center gap-2 text-gray-100">
            <MdOutlineSupervisorAccount className="text-[18px]" />
           All Merchant
          </span>
        </NavLink>
      </div>
        <div className="mb-3">
        <NavLink
          to="/dashboard/all-payin"
          className={({ isActive }) =>
            `flex items-center justify-between w-full px-3 py-2 text-[15px] lg:text-[16px] cursor-pointer rounded-[5px] transition duration-200`
          }
        >
          <span className="flex items-center gap-2 text-gray-100">
            <LiaChalkboardTeacherSolid className="text-[18px]" />
            Pay In
          </span>
        </NavLink>
      </div>
             <div className="mb-3">
        <NavLink
          to="/dashboard/all-payout"
          className={({ isActive }) =>
            `flex items-center justify-between w-full px-3 py-2 text-[15px] lg:text-[16px] cursor-pointer rounded-[5px] transition duration-200`
          }
        >
          <span className="flex items-center gap-2 text-gray-100">
            <LiaChalkboardTeacherSolid className="text-[18px]" />
            Pay Out
          </span>
        </NavLink>
      </div>
            <div className="mb-3">
        <NavLink
          to="/dashboard/merchant-withdrawal"
          className={({ isActive }) =>
            `flex items-center justify-between w-full px-3 py-2 text-[15px] lg:text-[16px] cursor-pointer rounded-[5px] transition duration-200`
          }
        >
          <span className="flex items-center gap-2 text-gray-100">
            <LiaChalkboardTeacherSolid className="text-[18px]" />
            Merchant Withdraw
          </span>
        </NavLink>
      </div>
             <div className="mb-3">
        <NavLink
          to="/dashboard/generate-key"
          className={({ isActive }) =>
            `flex items-center justify-between w-full px-3 py-2 text-[15px] lg:text-[16px] cursor-pointer rounded-[5px] transition duration-200`
          }
        >
          <span className="flex items-center gap-2 text-gray-100">
            <LuKeySquare className="text-[18px]" />
            Api Key
          </span>
        </NavLink>
      </div>
       <NavLink
         to="/dashboard/forward-sms"
          className={ ` flex items-center justify-between w-full px-3 py-2 text-[15px] lg:text-[16px] cursor-pointer rounded-[5px] transition duration-200`}
        >
          <span className="flex items-center gap-2 text-gray-100">
            <LiaChalkboardTeacherSolid className="text-[18px]" />
            Forward SMS
          </span>
        </NavLink>

      {/* Sidebar Menus */}
      {[
       
        // {
        //   label: 'Loan',
        //   icon: <LiaChalkboardTeacherSolid className="text-[18px]" />,
        //   key: 'loan',
        //   links: [
        //     { to: '/dashboard/pending-loans', text: 'Pending Loan' },
        //     { to: '/dashboard/approved-loans', text: 'Approved Loan' },
        //     { to: '/dashboard/rejected-loans', text: 'Rejected Loan' },
        //   ],
        // },
        // {
        //   label: 'Packages',
        //   icon: <LiaChalkboardTeacherSolid className="text-[18px]" />,
        //   key: 'packages',
        //   links: [
        //     { to: '/dashboard/add-package', text: 'Add Package' },
        //     { to: '/dashboard/all-package', text: 'Package List' },
        //   ],
        // },
        // {
        //   label: 'Pay In',
        //   icon: <LiaChalkboardTeacherSolid className="text-[18px]" />,
        //   key: 'cashin',
        //   links: [
        //     { to: '/dashboard/all-payin', text: 'All Payin' },
        //     { to: '/dashboard/pending-cashin', text: 'Pending Cash In' },
        //     { to: '/dashboard/rejected-cashin', text: 'Rejected Cash In' },
        //     { to: '/dashboard/approved-cashin', text: 'Approved Cash In' },
        //   ],
        // },
        // {
        //   label: 'Pay Out',
        //   icon: <PiStudent className="text-[18px]" />,
        //   key: 'cashiut',
        //   links: [
        //     { to: '/dashboard/pending-cashout', text: 'Pending Cash Out' },
        //     { to: '/dashboard/rejected-cashout', text: 'Rejected Cash Out' },
        //     { to: '/dashboard/cashout-list', text: 'Cash Out List' },
        //   ],
        // },
        // {
        //   label: 'Review',
        //   icon: <MdOutlineVideoChat className="text-[18px]" />,
        //   key: 'review',
        //   links: [
        //     { to: '/dashboard/add-review', text: 'Add Review' },
        //     { to: '/dashboard/review-list', text: 'Review List' },
        //   ],
        // },
        // {
        //   label: 'Slider',
        //   icon: <TfiLayoutSliderAlt className="text-[18px]" />,
        //   key: 'slider',
        //   links: [
        //     { to: '/dashboard/add-slider', text: 'Add Slider' },
        //     { to: '/dashboard/slider-list', text: 'Slider List' },
        //   ],
        // },
        // {
        //   label: 'Agents',
        //   icon: <LuClipboardList className="text-[18px]" />,
        //   key: 'users',
        //   links: [
        //     { to: '/dashboard/user-list', text: 'Agent List' },
        //     { to: '/dashboard/user-list', text: 'Pending Agent List' },
        //     { to: '/dashboard/user-list', text: 'Approved Agent List' },
        //     { to: '/dashboard/user-list', text: 'Rejected Agent List' },
        //   ],
        // }
      ].map(({ label, icon, key, links }) => (
        <div key={key} className="mb-3">
          <div
            onClick={() => handleToggle(key)}
            className={`flex items-center justify-between w-full px-3 py-2 text-[15px] lg:text-[16px] cursor-pointer rounded-[5px] transition duration-200 ${
              openMenu === key
                ? 'bg-indigo-700 text-white font-semibold shadow'
                : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              {icon}
              {label}
            </span>
            <FiChevronRight
              className={`transition-transform duration-300 ${
                openMenu === key ? 'rotate-90' : ''
              }`}
            />
          </div>
          <div
            className={`ml-4 overflow-hidden transition-all duration-300 ${
              openMenu === key ? 'max-h-60' : 'max-h-0'
            }`}
          >
            {links.map(({ to, text }) => (
              <NavLink
                key={text}
                to={to}
                className="flex items-center px-3 py-2 text-sm text-indigo-100 hover:text-white rounded-md mt-1"
              >
                {text}
              </NavLink>
            ))}
          </div>
        </div>
      ))}

      {/* Settings Menu - Added at the bottom */}
      <div className="mb-3 mt-8 border-t border-indigo-800 pt-4">
        <div
          onClick={() => handleToggle('settings')}
          className={`flex items-center justify-between w-full px-3 py-2 text-[15px] lg:text-[16px] cursor-pointer rounded-[5px] transition duration-200 ${
            openMenu === 'settings'
              ? 'bg-indigo-700 text-white font-semibold shadow'
              : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
          }`}
        >
          <NavLink to="/dashboard/settings/profile">
      <span className="flex items-center gap-2">
            <FaCog className="text-[18px]" />
            Settings
          </span>

          </NavLink>
       
        </div>
 
      </div>
    </aside>
  );
};

export default Sidebar;