import React, { useState } from 'react';
import Header from "../../components/Header";
import Sidebar from '../../components/Sidebar';
import { MdDeleteOutline } from "react-icons/md";
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';

const Addpackage = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loanFields, setLoanFields] = useState([
    {
      amount: '',
      duration: '',
      purpose: '',
      interest: '',
    }
  ]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleAddField = () => {
    setLoanFields([
      ...loanFields,
      { amount: '', duration: '', purpose: '', interest: '' }
    ]);
  };

  const handleRemoveField = (index) => {
    if (loanFields.length === 1) return;
    const updatedFields = [...loanFields];
    updatedFields.splice(index, 1);
    setLoanFields(updatedFields);
  };

  // English to Bangla number converter
  const convertToBanglaDigits = (num) => {
    if (num === '') return '';
    return num.toString().replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[d]);
  };

  // Bangla to English number converter
  const convertToEnglishDigits = (str) => {
    if (str === '') return '';
    return str.replace(/[০-৯]/g, d => '০১২৩৪৫৬৭৮৯'.indexOf(d));
  };

  const handleChange = (index, field, value) => {
    const updatedFields = [...loanFields];
    
    if (['amount', 'duration', 'interest'].includes(field)) {
      // For numeric fields:
      // 1. Only allow digits (English or Bangla)
      // 2. Convert to English digits for storage
      // 3. Store as number (except for interest which needs percentage validation)
      
      // First, convert any Bangla digits to English
      const englishValue = convertToEnglishDigits(value);
      
      // Then remove any non-digit characters
      const numericValue = englishValue.replace(/\D/g, '');
      
      // Store the numeric value (as string for easier handling)
      updatedFields[index][field] = numericValue;
    } else {
      // For non-numeric fields, just update normally
      updatedFields[index][field] = value;
    }
    
    setLoanFields(updatedFields);
  };

  const getDisplayValue = (value) => {
    // Convert numeric values to Bangla digits for display
    return value === '' ? '' : convertToBanglaDigits(value);
  };

  const validateFields = () => {
    for (let i = 0; i < loanFields.length; i++) {
      const { amount, duration, purpose, interest } = loanFields[i];
      
      if (!amount) {
        toast.error(`ধাপ ${i + 1}: বৈধ পরিমাণ দিন`);
        return false;
      }
      if (!duration) {
        toast.error(`ধাপ ${i + 1}: মেয়াদ সঠিক নয়`);
        return false;
      }
      if (!purpose.trim()) {
        toast.error(`ধাপ ${i + 1}: কারণ লিখুন`);
        return false;
      }
      
      const interestNum = parseInt(interest, 10);
      if (!interest || isNaN(interestNum) || interestNum > 100) {
        toast.error(`ধাপ ${i + 1}: ইন্টারেস্ট রেট সঠিক নয়`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateFields()) return;

    try {
      // Convert fields to proper numeric values before sending
      const payload = loanFields.map(field => ({
        amount: parseInt(field.amount, 10),
        duration: parseInt(field.duration, 10),
        purpose: field.purpose,
        interest: parseFloat(field.interest),
      }));
      
      await axios.post(`${base_url}/api/admin/package`, payload);
      toast.success('লোন প্যাকেজ সফলভাবে যুক্ত হয়েছে!');
      setLoanFields([{ amount: '', duration: '', purpose: '', interest: '' }]);
    } catch (err) {
      toast.error('সার্ভার সমস্যার কারণে যুক্ত করা যায়নি');
      console.error(err);
    }
  };

  return (
    <section className="h-screen font-nunito">
      <Toaster />
      <Header toggleSidebar={toggleSidebar} />
      <div className="flex pt-[10vh] h-[90vh]">
        <Sidebar isOpen={isSidebarOpen} />
        <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
          <div className="bg-white p-6 rounded border-[1px] border-gray-200 mx-auto">
            <h2 className="text-xl font-semibold mb-4 text-center">লোন যুক্ত করুন</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {loanFields.map((field, index) => (
                <div key={index} className="rounded py-4 space-y-4 relative ">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium">লোনের পরিমাণ (বাংলায়):</label>
                      <input
                        type="text"
                        value={getDisplayValue(field.amount)}
                        onChange={(e) => handleChange(index, 'amount', e.target.value)}
                        className="w-full mt-1 p-2 border border-gray-300 outline-theme_color rounded"
                        placeholder="উদাহরণ: ৫০০০"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">মেয়াদ (মাস, বাংলায়):</label>
                      <input
                        type="text" 
                        value={getDisplayValue(field.duration)}
                        onChange={(e) => handleChange(index, 'duration', e.target.value)}
                        className="w-full mt-1 p-2 border rounded border-gray-300 outline-theme_color"
                        placeholder="উদাহরণ: ৬"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">লোনের কারণ:</label>
                      <input
                        type="text"
                        value={field.purpose}
                        onChange={(e) => handleChange(index, 'purpose', e.target.value)}
                        className="w-full mt-1 p-2 border rounded border-gray-300 outline-theme_color"
                        placeholder="উদাহরণ: ব্যবসা"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">ইন্টারেস্ট রেট (% বাংলায়):</label>
                      <input
                        type="text"
                        value={getDisplayValue(field.interest)}
                        onChange={(e) => handleChange(index, 'interest', e.target.value)}
                        className="w-full mt-1 p-2 border rounded border-gray-300 outline-theme_color"
                        placeholder="উদাহরণ: ১০"
                        required
                      />
                    </div>
                  </div>

                  {loanFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveField(index)}
                      className="absolute top-[-3px] right-2 cursor-pointer bg-red-500 text-white p-[10px] rounded-[5px]"
                    >
                      <MdDeleteOutline />
                    </button>
                  )}
                </div>
              ))}

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleAddField}
                  className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  নতুন যুক্ত করুন
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 text-white rounded cursor-pointer hover:bg-red-700"
                >
                  আবেদন করুন
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </section>
  );
};

export default Addpackage;