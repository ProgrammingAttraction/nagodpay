import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { 
  FiLock,
  FiShield,
  FiFileText,
  FiUser,
  FiEye,
  FiEyeOff,
  FiGlobe,
  FiMail,
  FiAlertCircle,
  FiSave,
  FiRefreshCw
} from 'react-icons/fi';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

const System = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const admin_info = JSON.parse(localStorage.getItem("loanadmin"));
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    showEmail: false,
    showPhone: false,
    dataRetention: 365, // days
    allowTracking: false,
    require2FA: true,
    cookieConsent: true
  });

  // Policy content state
  const [policyContent, setPolicyContent] = useState({
    privacyPolicy: '<h2>Privacy Policy</h2><p>Loading privacy policy...</p>',
    termsOfService: '<h2>Terms of Service</h2><p>Loading terms of service...</p>',
    cookiePolicy: '<h2>Cookie Policy</h2><p>Loading cookie policy...</p>'
  });

  // Quill modules configuration
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link'
  ];

  const handlePrivacyChange = (field, value) => {
    setPrivacySettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePolicyChange = (field, value) => {
    setPolicyContent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const fetchSystemSettings = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${base_url}/api/admin/system`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = response.data;
      
      setPrivacySettings({
        showEmail: data.showEmail,
        showPhone: data.showPhone,
        dataRetention: data.dataRetention,
        allowTracking: data.allowTracking,
        require2FA: data.require2FA,
        cookieConsent: data.cookieConsent
      });
      
      setPolicyContent({
        privacyPolicy: data.privacyPolicy || '<h2>Privacy Policy</h2><p>Enter your privacy policy content here...</p>',
        termsOfService: data.termsOfService || '<h2>Terms of Service</h2><p>Enter your terms of service content here...</p>',
        cookiePolicy: data.cookiePolicy || '<h2>Cookie Policy</h2><p>Enter your cookie policy content here...</p>'
      });
      
      toast.success('Settings loaded successfully');
    } catch (error) {
      console.error('Error fetching system settings:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to fetch settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await axios.put(`${base_url}/api/admin/system`, {
        ...privacySettings,
        ...policyContent
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      toast.success('System settings saved successfully!');
    } catch (error) {
      console.error('Error saving system settings:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const systemSections = [
    {
      title: "Privacy Settings",
      icon: <FiLock className="text-2xl text-blue-500" />,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div className="flex items-center">
              <FiUser className="mr-2 text-gray-600" />
              <span>Show Email Address to Users</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={privacySettings.showEmail}
                onChange={(e) => handlePrivacyChange('showEmail', e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div className="flex items-center">
              <FiUser className="mr-2 text-gray-600" />
              <span>Show Phone Number to Users</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={privacySettings.showPhone}
                onChange={(e) => handlePrivacyChange('showPhone', e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div className="flex items-center">
              <FiGlobe className="mr-2 text-gray-600" />
              <span>Require Two-Factor Authentication</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={privacySettings.require2FA}
                onChange={(e) => handlePrivacyChange('require2FA', e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          <div className="p-3 bg-gray-50 rounded">
            <div className="flex items-center mb-2">
              <FiShield className="mr-2 text-gray-600" />
              <span>Data Retention Period (days)</span>
            </div>
            <input
              type="number"
              min="1"
              value={privacySettings.dataRetention}
              onChange={(e) => handlePrivacyChange('dataRetention', parseInt(e.target.value) || 0)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
        </div>
      )
    },
    {
      title: "Policy Management",
      icon: <FiFileText className="text-2xl text-green-500" />,
      content: (
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded">
            <div className="flex items-center mb-2">
              <FiShield className="mr-2 text-gray-600" />
              <span>Privacy Policy</span>
            </div>
            <ReactQuill
              theme="snow"
              value={policyContent.privacyPolicy}
              onChange={(value) => handlePolicyChange('privacyPolicy', value)}
              modules={modules}
              formats={formats}
              className="bg-white rounded"
            />
          </div>

          <div className="p-3 bg-gray-50 rounded">
            <div className="flex items-center mb-2">
              <FiAlertCircle className="mr-2 text-gray-600" />
              <span>Terms of Service</span>
            </div>
            <ReactQuill
              theme="snow"
              value={policyContent.termsOfService}
              onChange={(value) => handlePolicyChange('termsOfService', value)}
              modules={modules}
              formats={formats}
              className="bg-white rounded"
            />
          </div>

          <div className="p-3 bg-gray-50 rounded">
            <div className="flex items-center mb-2">
              <FiMail className="mr-2 text-gray-600" />
              <span>Cookie Policy</span>
            </div>
            <ReactQuill
              theme="snow"
              value={policyContent.cookiePolicy}
              onChange={(value) => handlePolicyChange('cookiePolicy', value)}
              modules={modules}
              formats={formats}
              className="bg-white rounded"
            />
          </div>
        </div>
      )
    },
  ];

  return (
    <section className="font-nunito h-screen bg-gray-100">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-[10vh] h-[90vh]">
        <Sidebar isOpen={isSidebarOpen} />

        <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'ml-[17%]' : 'ml-0'}`}>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>
            <div className="flex space-x-3">
              <button 
                onClick={fetchSystemSettings}
                disabled={isLoading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition flex items-center"
              >
                {isLoading ? (
                  <FiRefreshCw className="animate-spin mr-2" />
                ) : (
                  <FiRefreshCw className="mr-2" />
                )}
                Refresh
              </button>
              <button 
                onClick={saveSettings}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition flex items-center"
              >
                {isSaving ? (
                  <FiRefreshCw className="animate-spin mr-2" />
                ) : (
                  <FiSave className="mr-2" />
                )}
                Save All Changes
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {systemSections.map((section, index) => (
                <div key={index} className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="flex items-center p-4 border-b border-gray-200">
                    <div className="mr-3">
                      {section.icon}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800">{section.title}</h2>
                  </div>
                  <div className="p-4">
                    {section.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </section>
  );
};

export default System;