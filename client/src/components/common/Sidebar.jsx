import React from "react";
import {
  FaDownload,
  FaUpload,
  FaBalanceScale,
  FaChartBar,
  FaPlusSquare,
  FaCreditCard,
  FaUserFriends,
  FaLock,
  FaQuestionCircle,
  FaUserCheck,
  FaTachometerAlt,
} from "react-icons/fa";
import { FiArrowRightCircle, FiArrowLeftCircle } from "react-icons/fi";
import { MdOutlineApproval } from "react-icons/md";
import { MdOutlineMessage } from "react-icons/md";
import { Link } from "react-router-dom";
import { IoBatteryHalfOutline } from "react-icons/io5";
import logo from "../../assets/pi2.png"
const Sidebar = ({ isOpen }) => {
  const navItems = [
    {
      title: "Transactions",
      items: [
        { icon: <FaDownload />, label: "Pay In", path: "/pay-in" },
        // { icon: <MdOutlineApproval />, label: "Pay In Approval", path: "/pay-in-approval" },
        { icon: <FaUpload />, label: "Pay Out", path: "/pay-out" },
        // { icon: <MdOutlineApproval />, label: "Pay Out Approval", path: "/pay-out-approval" },
      ],
    },
    {
      title: "Prepayment",
      items: [
        { icon: <FiArrowRightCircle />, label: "Prepayment Requests", path: "/prepayment-requests" },
        { icon: <FiArrowLeftCircle />, label: "Prepayment History", path: "/prepayment-history" },
      ],
    },
        {
      title: "Payout Request",
      items: [
        { icon: <IoBatteryHalfOutline />, label: "Payout Requests", path: "/payout-request" },
        { icon: <IoBatteryHalfOutline />, label: "Payout Report", path: "/payout-reports" },
        { icon: <IoBatteryHalfOutline />, label: "Nagad Free", path: "/deposit/nagad-free" },
        { icon: <IoBatteryHalfOutline />, label: "Bank Transfer", path: "/deposit/bank-transfer" },
      ],
    },
    {
      title: "Balances",
      items: [
        { icon: <FaBalanceScale />, label: "Balances", path: "/new-balance" },
        { icon: <FaChartBar />, label: "Sales Report", path: "/sales-report" },
      ],
    },
    
    {
      title: "Settings",
      items: [
        { icon: <FaPlusSquare />, label: "Add Bank Account", path: "/add-bank-account" },
        { icon: <FaCreditCard />, label: "Bank Accounts", path: "/bank-accounts" },
        // { icon: <MdOutlineMessage />, label: "Forward SMS", path: "/send-sms" },
        // { icon: <FaUserFriends />, label: "Sub User", path: "/sub-user" },
        // { icon: <FaLock />, label: "2FA", path: "/two-factor-auth" },
      ],
    },
    {
      title: "Info",
      items: [
        { icon: <FaUserCheck />, label: "Applied Commission", path: "/applied-commission" },
        // { icon: <FaQuestionCircle />, label: "FAQ", path: "/faq" },
      ],
    },
  ];

  return (
    <div
      className={`bg-[#1f2937] text-white w-[290px] no-scrollbar font-fira h-screen  overflow-y-auto  duration-300 ${
        isOpen ? "block" : "hidden"
      } md:block`}
    >
      {/* Logo or Top */}
      <div className="mb-6 w-full  px-4 py-2 pt-3">
        <Link to="/dashboard" className="flex items-center gap-3 font-bold text-xl">
          <h1 className="text-[20px] font-[700] text-blue-600">NagodPay</h1>
        </Link>
      </div>

      {/* Navigation Sections */}
      {navItems.map((section, idx) => (
        <div key={idx} className="mb-6 py-2 px-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-widest">
            {section.title}
          </h2>
          <ul className="space-y-2">
            {section.items.map((item, subIdx) => (
              <li key={subIdx}>
                <Link
                  to={item.path}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-600 hover:text-white transition duration-200 cursor-pointer"
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default Sidebar;