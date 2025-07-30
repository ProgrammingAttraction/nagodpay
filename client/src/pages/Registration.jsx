import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const Registration = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({ 
    username: '',
    name: '',
    email: '',
    password: '',
    identity: null
  });
  
  const [previewImage, setPreviewImage] = useState("https://images.ctfassets.net/9gcg9b05der6/7kOeWePrupDV9Ep3qd5tQr/c307b1774328451534d6bb4116c5961d/4_ways_to_fight_ID_fraud-over-head-form-image");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState({
    loading: false,
    available: null,
    message: ''
  });

  // Check username availability on change (with debounce)
  useEffect(() => {
    const checkUsernameAvailability = async () => {
      if (formData.username.length < 4) {
        setUsernameStatus({
          loading: false,
          available: null,
          message: 'Username must be at least 4 characters'
        });
        return;
      }

      setUsernameStatus(prev => ({ ...prev, loading: true }));
      
      try {
        const response = await axios.get(`${base_url}/auth/check-username/${formData.username}`);
        setUsernameStatus({
          loading: false,
          available: response.data.available,
          message: response.data.message
        });
      } catch (err) {
        setUsernameStatus({
          loading: false,
          available: null,
          message: 'Error checking username'
        });
        console.error('Username check error:', err);
      }
    };

    const timerId = setTimeout(() => {
      if (formData.username) {
        checkUsernameAvailability();
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timerId);
  }, [formData.username, base_url]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      if (!file.type.match('image.*')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error('Image size should be less than 2MB');
        return;
      }
      
      // Update form data
      setFormData(prev => ({ ...prev, identity: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 4) {
      newErrors.username = 'Username must be at least 4 characters';
    } else if (usernameStatus.available === false) {
      newErrors.username = 'Username is already taken';
    }
    
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.identity) newErrors.identity = 'Identity verification is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validate()) return;

  setLoading(true);
  
  try {
    // Create FormData for file upload
    const formDataToSend = new FormData();
    formDataToSend.append('username', formData.username);
    formDataToSend.append('name', formData.name);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('password', formData.password);
    formDataToSend.append('identity', formData.identity);

    const res = await axios.post(`${base_url}/auth/signup`, formDataToSend, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    const { success, message } = res.data;

    if (success) {
      toast.success('Registration successful! Please login.');
      setTimeout(() => {
        navigate("/login"); // Redirect to login page
      }, 1500);
    } else {
      toast.error(message || 'Registration failed');
    }
  } catch (err) {
    console.error(err);
    const errorMessage = err.response?.data?.message || 'Something went wrong. Please try again.';
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen font-nunito font-fira flex items-center justify-center bg-gradient-to-br  from-blue-50 to-indigo-100 p-[10px]">
      <Toaster position="top-right" />
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative overflow-hidden">
        {/* Custom Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/80 flex items-center justify-center rounded-sm">
            <div className="loader"></div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identity Verification */}
          <div className="flex flex-col items-center">
            <div 
              className="w-[120px] h-[120px] rounded-full border-2 border-dashed border-gray-300 mb-2 overflow-hidden cursor-pointer"
              onClick={triggerFileInput}
            >
              <img 
                src={previewImage} 
                alt="Identity Preview" 
                className="w-full h-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={triggerFileInput}
              className="text-sm text-theme cursor-pointer hover:underline"
              disabled={loading}
            >
              Upload Identity Proof
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
              disabled={loading}
            />
            {errors.identity && (
              <p className="text-sm text-red-500 mt-1">{errors.identity}</p>
            )}
          </div>

          {/* Username with availability check */}
          <div>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${
                errors.username ? 'border-red-500' : 
                usernameStatus.available === true ? 'border-green-500' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 ${
                errors.username ? 'focus:ring-red-500' : 
                usernameStatus.available === true ? 'focus:ring-green-500' : 'focus:ring-theme'
              }`}
              disabled={loading}
            />
            {usernameStatus.loading && (
                <p className="text-xs  mt-2 text-gray-500">Checking username...</p>
              )}
              {!usernameStatus.loading && usernameStatus.message && (
                <p className={`text-xs  mt-2 ${
                  usernameStatus.available === true ? 'text-green-500' : 
                  usernameStatus.available === false ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {usernameStatus.message}
                </p>
              )}
              {errors.username && (
                <p className="text-xs mt-2 text-red-500">{errors.username}</p>
              )}
          </div>

          {/* Full Name */}
          <div>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 ${
                errors.name ? 'focus:ring-red-500' : 'focus:ring-theme'
              }`}
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 ${
                errors.email ? 'focus:ring-red-500' : 'focus:ring-theme'
              }`}
              disabled={loading}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-2 border ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 ${
                errors.password ? 'focus:ring-red-500' : 'focus:ring-theme'
              }`}
              disabled={loading}
            />
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-theme text-white cursor-pointer font-semibold py-2 rounded-md hover:bg-green-500 transition disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={loading || usernameStatus.loading}
          >
            {loading ? 'Registering...' : 'REGISTER'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <span 
              className="text-theme cursor-pointer hover:underline"
              onClick={() => navigate('/login')}
            >
              Login here
            </span>
          </p>
        </div>
      </div>

      {/* Spinner Styles */}
      <style>{`
        .loader {
          border: 4px solid #e5e7eb;
          border-top: 4px solid #1946c4;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Registration;