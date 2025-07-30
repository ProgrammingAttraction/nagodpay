import React, { useState,useEffect } from 'react';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { NavLink, useNavigate } from 'react-router-dom';
import { AiOutlinePlus, AiOutlineRollback, AiOutlineCamera } from "react-icons/ai";
import Swal from "sweetalert2";
import axios from "axios";
import "react-quill/dist/quill.snow.css"; // Import Quill styles
import ReactQuill from "react-quill";
import toast,{Toaster} from 'react-hot-toast';
const Adddepositmethod = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
 const navigate=useNavigate();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [accountNumber, set_accountNumber] = useState("");
  const [accountType, set_accountType] = useState("Agent");
  
        useEffect(()=>{
     window.addEventListener("scroll",()=>{
      if(window.scrollY > 100){
             setactivetopbar(true)
      }else{
             setactivetopbar(false)
      }
     })
   },[]);
   const [uploadedImage, setUploadedImage] = useState(null);
   const [currencyName, setCurrencyName] = useState("");
   const [userData, setUserData] = useState([]);
   const [formData, setFormData] = useState({
     type: "",
     isRequired: "",
     label: "",
     width: "",
     instruction: "",
   });
   const [showPopup, setShowPopup] = useState(false);
   const [file,set_file]=useState(null)
   const handleImageUpload = (event) => {
     const file = event.target.files[0];
     console.log(file)
     if (file) {
        set_file(file);
       const reader = new FileReader();
       reader.onload = () => setUploadedImage(reader.result);
       reader.readAsDataURL(file);
     }
   };
   const handlePopupSubmit = () => {
    setUserData([...userData, formData]);
    setFormData({
      type: "",
      isRequired: "",
      label: "",
      width: "",
      instruction: "",
    });
    setShowPopup(false);
    toast.success("New field added successfully.");
  };
   const handleInputChange = (value) => {
    set_depositInstruction(value);
  };

   const handleDeleteField = (index) => {
     Swal.fire({
       title: "Are you sure?",
       text: "This field will be permanently deleted.",
       icon: "warning",
       showCancelButton: true,
       confirmButtonText: "Yes, delete it!",
       cancelButtonText: "Cancel",
     }).then((result) => {
       if (result.isConfirmed) {
         setUserData(userData.filter((_, i) => i !== index));
         Swal.fire("Deleted!", "Field has been removed.", "success");
       }
     });
   };
   console.log(file)
     const [minAmount,set_minAmount]=useState();
     const [maxAmount,set_maxAmount]=useState();
     const [fixedCharge,set_fixedCharge]=useState();
     const [percentCharge,set_percentCharge]=useState();
     const [depositInstruction,set_depositInstruction]=useState("");
     const [getwayname,set_getwayname]=useState("");
     const [rate,set_rate]=useState();
       // Modules for ReactQuill
  const modules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ color: [] }, { background: [] }],
      ["link"],
      ["clean"],
      ["image"], // Add image button to toolbar
      [{ font: [] }], // Add font size control
      [{ size: ["small", "medium", "large", "huge"] }], // Define available text sizes
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "list",
    "bullet",
    "color",
    "background",
    "link",
    "image",
    "font",
    "size",
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    const form_data = new FormData();
  
    form_data.append("image", file); // field name must match upload.single("image")
    form_data.append("gatewayName", getwayname);
    form_data.append("minAmount", minAmount);
    form_data.append("maxAmount", maxAmount);
    form_data.append("accountNumber", accountNumber);
    form_data.append("accountType", accountType);
    form_data.append("depositInstruction", depositInstruction);
    form_data.append("userData", JSON.stringify(userData)); // must stringify arrays/objects
  
    try {
      const res = await axios.post(
        "http://localhost:8080/api/admin/manual-payment",
        form_data,
        {
          headers: {
            "Content-Type": "multipart/form-data", // important for FormData
          },
        }
      );
   if(res.data.success){
     toast.success(res.data.message);
   }else{
     toast.error(res.data.message)
   }
    } catch (err) {
      console.error("Error submitting:", err);
      Swal.fire({
        title: "Error",
        text: "Failed to add manual deposit method.",
        icon: "error",
      });
    }
  };
  
  return (
    <section className="font-nunito h-screen">
      <Header toggleSidebar={toggleSidebar} />
     <Toaster/>
      <div className="flex pt-[10vh] h-[90vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${
            isSidebarOpen ? 'ml-[17%]' : 'ml-0'
          }`}
        >


             <div className="px-[20px] py-[35px] ">
      <form onSubmit={handleSubmit} className="bg-white shadow-md border border-gray-200 rounded-lg p-6">
  <div className="flex justify-between items-center mb-8">
    <h1 className="text-3xl font-bold text-gray-800">Add Manual Gateway</h1>
  </div>

  {/* Image Upload */}
  <div className="mb-8 w-1/4">
    <label className="font-semibold text-gray-700 mb-2 block">Upload Image</label>
    <div className="relative border border-dashed border-blue-400 rounded-lg px-4 py-6 bg-gray-50 h-[200px] flex items-center justify-center hover:border-blue-500 transition">
      {uploadedImage ? (
        <img
          src={uploadedImage}
          alt="Uploaded"
          className="w-32 h-32 object-cover rounded-md shadow"
        />
      ) : (
        <AiOutlineCamera className="text-gray-400 text-5xl" />
      )}
      <input
        type="file"
        accept="image/*"
        className="absolute inset-0 opacity-0 cursor-pointer"
        onChange={handleImageUpload}
      />
    </div>
  </div>

  {/* Gateway Name */}
  <div className="mb-6">
    <label className="font-semibold text-gray-700 mb-2 block">Gateway Name *</label>
    <input
      type="text"
      value={getwayname}
      placeholder="Enter Gateway Name"
      onChange={(e) => set_getwayname(e.target.value)}
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50"
    />
  </div>

  {/* Amount Fields */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    <div>
      <label className="font-semibold text-gray-700 mb-2 block">Minimum Amount *</label>
      <div className="flex items-center border border-gray-300 rounded-lg bg-gray-50">
        <input
          type="text"
          value={minAmount}
          onChange={(e) => set_minAmount(e.target.value)}
          placeholder="Enter Minimum Amount"
          className="w-full px-4 py-3 bg-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="px-4 text-gray-600 bg-gray-100">BDT</span>
      </div>
    </div>
    <div>
      <label className="font-semibold text-gray-700 mb-2 block">Maximum Amount *</label>
      <div className="flex items-center border border-gray-300 rounded-lg bg-gray-50">
        <input
          type="text"
          value={maxAmount}
          onChange={(e) => set_maxAmount(e.target.value)}
          placeholder="Enter Maximum Amount"
          className="w-full px-4 py-3 bg-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="px-4 text-gray-600 bg-gray-100">BDT</span>
      </div>
    </div>
  </div>

  {/* Account Info */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    <div>
      <label className="font-semibold text-gray-700 mb-2 block">Account Number *</label>
      <input
        type="text"
        value={accountNumber}
        onChange={(e) => set_accountNumber(e.target.value)}
        placeholder="Enter account number"
        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
    <div>
      <label className="font-semibold text-gray-700 mb-2 block">Account Type *</label>
      <select
        value={accountType}
        onChange={(e) => set_accountType(e.target.value)}
        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="Agent">Agent</option>
        <option value="Personal">Personal</option>
      </select>
    </div>
  </div>

  {/* ReactQuill Instruction */}
  <div className="mb-10">
    <label className="font-semibold text-gray-700 mb-2 block">Deposit Instruction</label>
    <ReactQuill
      modules={modules}
      formats={formats}
      value={depositInstruction}
      onChange={handleInputChange}
      style={{ height: "200px" }}
      className="bg-white"
    />
  </div>

  {/* User Data Table */}
  <div className="mb-8 pt-[20px]">
    <div className="flex justify-between items-center bg-blue-700 px-4 py-2 rounded-t-md">
      <h2 className="text-white text-lg font-semibold">User Data</h2>
      <button
        type="button"
        onClick={() => setShowPopup(true)}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
      >
        Add New
      </button>
    </div>
    <table className="table-auto w-full border border-gray-200 text-sm">
      <thead className="bg-gray-100 text-gray-700">
        <tr>
          <th className="border border-gray-300 px-4 py-2">Type</th>
          <th className="border border-gray-300 px-4 py-2">Is Required</th>
          <th className="border border-gray-300 px-4 py-2">Label</th>
          <th className="border border-gray-300 px-4 py-2">Width</th>
          <th className="border border-gray-300 px-4 py-2">Instruction</th>
          <th className="border border-gray-300 px-4 py-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {userData.map((field, index) => (
          <tr key={index} className="text-center bg-white">
            <td className="border border-gray-200 px-4 py-2">{field.type}</td>
            <td className="border border-gray-200 px-4 py-2">{field.isRequired}</td>
            <td className="border border-gray-200 px-4 py-2">{field.label}</td>
            <td className="border border-gray-200 px-4 py-2">{field.width}</td>
            <td className="border border-gray-200 px-4 py-2">{field.instruction || "N/A"}</td>
            <td className="border border-gray-200 px-4 py-2">
              <span
                className="text-red-600 hover:underline cursor-pointer"
                onClick={() => handleDeleteField(index)}
              >
                Delete
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  {/* Submit Button */}
  <button
    type="submit"
    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition duration-300"
  >
    Submit
  </button>
</form>

    
          {showPopup && (
            <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 flex items-center z-[1000] justify-center">
              <div className="bg-white rounded-lg p-6 w-[30%]">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Generate Form</h3>
                <div className="mb-4">
                  <label className="font-medium text-gray-700">Type *</label>
                  <select
                    className="border rounded-md px-4 py-2 w-full focus:outline-none border-neutral-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="">Select One</option>
                    <option value="file">File</option>
                    <option value="text">Text</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="font-medium text-gray-700">Is Required *</label>
                  <select
                    className="border rounded-md px-4 py-2 w-full focus:outline-none focus:ring-2 border-neutral-300 focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.isRequired}
                    onChange={(e) => setFormData({ ...formData, isRequired: e.target.value })}
                  >
                    <option value="">Select One</option>
                    <option value="required">Required</option>
                    <option value="optional">Optional</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="font-medium text-gray-700">Label *</label>
                  <input
                    type="text"
                    className="border rounded-md px-4 py-2 w-full focus:outline-none border-neutral-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  />
                </div>
                <div className="mb-4">
                  <label className="font-medium text-gray-700">Width *</label>
                  <select
                    className="border rounded-md px-4 py-2 w-full focus:outline-none border-neutral-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                  >
                    <option value="">Select One</option>
                    <option value="full">Full</option>
                    <option value="half">Half</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="font-medium text-gray-700">Instruction (if any)</label>
                  <input
                    type="text"
                    className="border rounded-md px-4 py-2 w-full focus:outline-none border-neutral-300  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.instruction}
                    onChange={(e) => setFormData({ ...formData, instruction: e.target.value })}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowPopup(false)}
                    className="text-gray-500 hover:text-gray-600 bg-gray-200 px-[20px] rounded-[5px] cursor-pointer focus:outline-none mr-4"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePopupSubmit}
                    className="bg-blue-500 text-white py-2 px-[20px] cursor-pointer rounded-[5px]  hover:bg-blue-600 focus:outline-none"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        </main>
      </div>
    </section>
  );
};

export default Adddepositmethod;
