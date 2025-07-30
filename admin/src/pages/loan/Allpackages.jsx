import React, { useState, useEffect } from 'react';
import Header from "../../components/Header"
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaEye, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaSave, FaTimes, FaPlus, FaMinus } from 'react-icons/fa';
import { useParams, useNavigate } from 'react-router-dom';
const Allpackages = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const {id}=useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const token=localStorage.getItem('authToken');

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <section className="font-nunito h-screen bg-gray-50">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh] h-[90vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto ${
            isSidebarOpen ? 'ml-[17%]' : 'ml-0'
          }`}
        >
          <div className=" px-2 py-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Agent Information</h2>
            
          </div>
        </main>
      </div>
    </section>
  );
};

export default Allpackages;