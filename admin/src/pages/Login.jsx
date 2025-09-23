import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const Login = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const navigate = useNavigate();
  
  // State for login form
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '' 
  });
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // State for OTP verification
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [tempToken, setTempToken] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpAttempts, setOtpAttempts] = useState(0);
  const [maskedEmail, setMaskedEmail] = useState('');
  
  // Refs for OTP input fields
  const otpRefs = useRef([]);

  // Handle input change for login form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate login form
  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      email: '',
      password: ''
    };

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle login form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await axios.post(`${base_url}/auth/admin/login`, {
        email: formData.email,
        password: formData.password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const { success, message, tempToken, requiresOTP, email } = response.data;

      if (success && requiresOTP) {
        setTempToken(tempToken);
        setMaskedEmail(email);
        setShowOTPModal(true);
        toast.success('OTP sent to your email!');
      } else if (success) {
        toast.success('Admin login successful!');
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('userData', JSON.stringify(response.data.user));
        localStorage.setItem('isAdmin', 'true');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        toast.error(message || 'Admin login failed. Please try again.');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      let errorMessage = 'An error occurred during admin login';
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (/^[0-9]$/.test(value) || value === '') {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      setOtpError('');

      // Move to next input if value is entered
      if (value && index < 5) {
        otpRefs.current[index + 1].focus();
      }
    }
  };

  // Handle OTP input key down (for backspace and navigation)
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  // Handle OTP form submission
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setOtpError('Please enter a 6-digit OTP');
      return;
    }

    setOtpLoading(true);
    
    try {
      const response = await axios.post(`${base_url}/auth/admin/verify-otp`, {
        otp: otpCode,
        tempToken
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const { success, message, token, user, attempts } = response.data;

      if (success) {
        toast.success('OTP verified! Logging in...');
        localStorage.setItem('authToken', token);
        localStorage.setItem('userData', JSON.stringify(user));
        localStorage.setItem('isAdmin', 'true');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      } else {
        setOtpAttempts(attempts || otpAttempts + 1);
        setOtpError(message);
        toast.error(message);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      let errorMessage = 'An error occurred during OTP verification';
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
        setOtpAttempts(error.response.data.attempts || otpAttempts + 1);
      }
      setOtpError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle OTP resend
  const handleResendOtp = async () => {
    setOtpLoading(true);
    
    try {
      const response = await axios.post(`${base_url}/auth/admin/resend-otp`, {
        tempToken
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const { success, message, tempToken: newTempToken } = response.data;

      if (success) {
        setTempToken(newTempToken);
        setOtp(['', '', '', '', '', '']);
        setOtpAttempts(0);
        setOtpError('');
        toast.success('New OTP sent to your email!');
      } else {
        toast.error(message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      let errorMessage = 'An error occurred while resending OTP';
      if (error.response) {
        errorMessage = error.response.data.message || errorMessage;
      }
      toast.error(errorMessage);
    } finally {
      setOtpLoading(false);
    }
  };

  // Focus first OTP input when modal opens
  useEffect(() => {
    if (showOTPModal && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [showOTPModal]);

  return (
    <div className="min-h-screen font-nunito bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '8px',
            background: '#fff',
            color: '#333',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
        }}
      />
      
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-10 bg-white/80 flex items-center justify-center rounded-lg">
            <div className="loader"></div>
          </div>
        )}

        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 mb-4 rounded-full bg-white border-2 border-red-500 flex items-center justify-center shadow-sm">
            <img src={logo} alt="Logo" className="w-16" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Portal</h1>
          <p className="text-gray-500 mt-1">Sign in to admin dashboard</p>
        </div>

        {!showOTPModal ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Admin Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter admin email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 ${
                  errors.email ? 'focus:ring-red-500' : 'focus:ring-red-500'
                } transition duration-200`}
                disabled={loading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-red-500 hover:underline focus:outline-none"
                  disabled={loading}
                >
                  {showPassword ? 'Hide' : 'Show'} Password
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 ${
                  errors.password ? 'focus:ring-red-500' : 'focus:ring-red-500'
                } transition duration-200`}
                disabled={loading}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              className={`w-full py-3 px-4 bg-red-500 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-200 ${
                loading ? 'opacity-80 cursor-not-allowed' : ''
              }`}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In as Admin'
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-gray-800 text-center">
              Verify OTP
            </h2>
            <p className="text-gray-600 text-center">
              Enter the 6-digit OTP sent to {maskedEmail}
            </p>
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div className="flex justify-center space-x-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    ref={(el) => (otpRefs.current[index] = el)}
                    className={`w-12 h-12 text-center text-lg font-medium border ${
                      otpError ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-200`}
                    disabled={otpLoading}
                  />
                ))}
              </div>
              {otpError && (
                <p className="text-sm text-red-600 text-center">{otpError}</p>
              )}
              <button
                type="submit"
                className={`w-full py-3 px-4 bg-red-500 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-200 ${
                  otpLoading ? 'opacity-80 cursor-not-allowed' : ''
                }`}
                disabled={otpLoading}
              >
                {otpLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  'Verify OTP'
                )}
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                className="w-full text-sm text-red-500 hover:underline focus:outline-none"
                disabled={otpLoading}
              >
                Resend OTP
              </button>
            </form>
          </div>
        )}

        <style>{`
          .loader {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #ef4444;
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
    </div>
  );
};

export default Login;