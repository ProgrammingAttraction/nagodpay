import React, { useState,useEffect } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { FiEdit } from "react-icons/fi";
import { FaEyeSlash, FaEye } from "react-icons/fa";
import axios from "axios";
import Swal from "sweetalert2"; // Import SweetAlert2 for confirmation
import { NavLink } from "react-router-dom";

const Depositmethods = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
const [withdrawGateways, setWithdrawGateways] = useState([]);

  // Fetch the data from the backend when the component mounts
  useEffect(() => {
    const fetchWithdrawMethods = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/admin/deposit-methods");
        setWithdrawGateways(response.data);  // Set the fetched data to state
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchWithdrawMethods();
  }, []);  // Empty dependency array ensures this runs once when the component mounts

  // Handle enabling/disabling the deposit method
  const handleStatusUpdate = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus; // Toggle the status (enable if disabled, and vice versa)
      const response = await axios.put(
        `${base_url}/api/admin/manual/status/${id}`,
        { enabled: newStatus }
      );

      // Show success message
      Swal.fire({
        title: "Success",
        text: response.data.message,
        icon: "success",
      });

      // Re-fetch data after update
      const updatedGateways = await axios.get(`${base_url}/api/admin/deposit-methods`);
      setWithdrawGateways(updatedGateways.data);

    } catch (error) {
      console.error("Error updating status:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to update status.",
        icon: "error",
      });
    }
  };

  // Handle editing the deposit method (you can implement the modal for editing here)
  const handleEdit = (id) => {
    // Implement the editing logic here, like opening a modal or navigating to another page for editing
    console.log("Edit method:", id);
  };

  // Handle deleting a deposit method
  const handleDelete = async (id) => {
    try {
      const confirm = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
      });

      if (confirm.isConfirmed) {
        const response = await axios.delete(`${base_url}/api/admin/deposit-methods/${id}`);
        Swal.fire("Deleted!", response.data.message, "success");

        // Re-fetch the updated list
        const updatedGateways = await axios.get(`${base_url}/api/admin/deposit-methods`);
        setWithdrawGateways(updatedGateways.data);
      }
    } catch (error) {
      console.error("Error deleting method:", error);
      Swal.fire("Error", "Failed to delete the deposit method.", "error");
    }
  };
  return (
    <section className="font-nunito h-screen">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh] h-[90vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'ml-[17%]' : 'ml-0'
          }`}
        >
      <div className="p-[20px]">
      <div className="flex justify-between items-center">
      <h1 className="text-[25px] font-[500]">All Deposit Method</h1>
      <NavLink to="/dashboard/add-deposit-method">
            <button className="px-[20px] cursor-pointer py-[10px] bg-blue-600 text-white rounded-[5px]">Add New</button>
      </NavLink>
      </div>
        <div className="py-[20px] w-full">
          <div className="w-full mx-auto bg-white rounded-lg overflow-hidden border-[1px] border-neutral-200">
  <table className="w-full text-sm text-left rounded-lg overflow-hidden shadow-sm">
  <thead className="bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[15px]">
    <tr>
      <th className="py-4 px-6 font-semibold border-r-[1px] border-gray-200  text-left pl-8">Payment Gateway</th>
      <th className="py-4 px-6 font-semibold  border-r-[1px] border-gray-200 text-center">Status</th>
      <th className="py-4 px-6 font-semibold text-center pr-8">Actions</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-gray-100">
    {withdrawGateways.map((gateway, index) => (
      <tr 
        key={index} 
        className="hover:bg-gray-50 transition-colors duration-150"
      >
        <td className="py-5 px-6 pl-8  border-r-[1px] border-gray-200">
          <div className="flex items-center gap-4">
            <img 
              className='w-12 h-8 object-contain rounded-md border border-gray-200 p-1 bg-white' 
              src={`${base_url}/images/${gateway.image}`} 
              alt={gateway.gatewayName}
            />
            <h2 className='text-lg font-semibold text-gray-800'>{gateway.gatewayName}</h2>
          </div>
        </td>
        <td className="py-5 px-6 text-center border-r border-gray-200">
  <span
    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300
      ${gateway.enabled
        ? "bg-green-100 text-green-700"
        : "bg-yellow-100 text-yellow-700"
      }`}
  >
    <span
      className={`w-2.5 h-2.5 rounded-full 
        ${gateway.enabled ? "bg-green-500" : "bg-yellow-500"}
      `}
    ></span>
    {gateway.enabled ? "Enabled" : "Disabled"}
  </span>
</td>

        <td className="py-5 px-6 pr-8 text-center space-x-3">
          {gateway.enabled ? (
            <button
              onClick={() => handleStatusUpdate(gateway._id, gateway.enabled)}
              className="inline-flex items-center px-4 py-2 cursor-pointer border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
            >
              <FaEyeSlash className="mr-2" /> Disable
            </button>
          ) : (
            <button
              onClick={() => handleStatusUpdate(gateway._id, gateway.enabled)}
              className="inline-flex items-center px-4 py-2 border cursor-pointer border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
            >
              <FaEye className="mr-2" /> Enable
            </button>
          )}
          <button
            onClick={() => handleDelete(gateway._id)}
            className="inline-flex items-center px-4 py-2 border cursor-pointer border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
          >
            Delete
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
          </div>
        </div>
      </div>
        </main>
      </div>
    </section>
  );
};

export default Depositmethods;
