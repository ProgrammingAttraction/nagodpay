const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require("../Models/User");
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Create Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "nagadpay38@gmail.com",
        pass: "algn cvhz nrjl jtxl",
    },
});

// OTP Service functions
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const getExpirationTime = () => {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
};

const sendOTPEmail = async (email, otpCode, username) => {
  try {
    const mailOptions = {
      from:"nagadpay38@gmail.com",
      to: email,
      subject: 'Admin Login OTP Verification',
      html: generateEmailTemplate(otpCode, username),
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

const generateEmailTemplate = (otpCode, username) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        .container { max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; }
        .header { background: #f8f9fa; padding: 20px; text-align: center; }
        .otp-code { font-size: 32px; font-weight: bold; color: #007bff; text-align: center; margin: 30px 0; }
        .footer { margin-top: 30px; padding: 20px; background: #f8f9fa; text-align: center; font-size: 12px; color: #6c757d; }
        .warning { color: #dc3545; font-size: 14px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Admin Login OTP Verification</h2>
        </div>
        
        <p>Hello ${username},</p>
        
        <p>You are attempting to login to the admin panel. Use the following OTP code to complete your login:</p>
        
        <div class="otp-code">${otpCode}</div>
        
        <p>This OTP is valid for 10 minutes. Do not share this code with anyone.</p>
        
        <div class="warning">
          <strong>Security Notice:</strong> If you did not request this OTP, please ignore this email and contact your system administrator immediately.
        </div>
        
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} NagodPay. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const validateOTP = (user, enteredOTP) => {
  if (!user.otp || !user.otp.code) {
    return { isValid: false, message: 'OTP not found. Please request a new OTP.' };
  }

  // Check if OTP has expired
  if (new Date() > user.otp.expiresAt) {
    return { isValid: false, message: 'OTP has expired. Please request a new OTP.' };
  }

  // Check if maximum attempts exceeded
  if (user.otp.attempts >= 3) {
    return { isValid: false, message: 'Maximum OTP attempts exceeded. Please request a new OTP.' };
  }

  // Check if OTP matches
  if (user.otp.code !== enteredOTP) {
    // Increment attempts
    user.otp.attempts += 1;
    return { 
      isValid: false, 
      message: `Invalid OTP. ${3 - user.otp.attempts} attempts remaining.` 
    };
  }

  // OTP is valid
  return { isValid: true, message: 'OTP verified successfully.' };
};

const signup = async (req, res) => {
  try {
    const { username, name, email, password } = req.body;
    
    // Check if user exists by email or username
    const existingUser = await UserModel.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        message: existingUser.email === email 
          ? 'Email already in use' 
          : 'Username already taken',
        success: false 
      });
    }

    // Handle file upload for identity verification
    let identityPath = '';
    if (req.file) {
      identityPath = req.file.filename;
    } else {
      return res.status(400).json({
        message: 'Identity verification document is required',
        success: false
      });
    }

    // Create new user
    const user = new UserModel({ 
      username,
      name, 
      email, 
      password,
      identity: identityPath
    });

    // Save user
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Omit sensitive data from response
    const userData = user.toObject();
    delete userData.password;
    delete userData.__v;

    res.status(201).json({
      message: "Registration successful",
      success: true,
      token,
      user: userData
    });

  } catch (err) {
    console.error('Registration error:', err);
    
    // Handle validation errors specifically
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        message: messages.join(', '),
        success: false
      });
    }

    res.status(500).json({
      message: "Internal server error",
      success: false
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email or username
    const user = await UserModel.findOne({ 
      $or: [{ email }, { username: email }] 
    }).select('+password');
      
    if(user.status == "inactive"){
      return res.status(401).json({ 
        message: 'Your account on review, please wait for admin approval', 
        success: false 
      });
    }
    
    const errorMsg = 'Email or password is incorrect';
    
    if (!user) {
      return res.status(401).json({ 
        message: errorMsg, 
        success: false 
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        message: errorMsg, 
        success: false 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Omit sensitive data from response
    const userData = user.toObject();
    delete userData.password;
    delete userData.__v;

    res.status(200).json({
      message: "Login successful",
      success: true,
      token,
      user: userData
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      message: "Internal server error",
      success: false
    });
  }
};

const checkUsername = async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username || username.length < 4) {
      return res.status(400).json({
        message: 'Username must be at least 4 characters',
        success: false
      });
    }

    const existingUser = await UserModel.findOne({ username });
    
    res.status(200).json({
      available: !existingUser,
      success: true,
      message: existingUser 
        ? 'Username is already taken' 
        : 'Username is available'
    });

  } catch (err) {
    console.error('Username check error:', err);
    res.status(500).json({
      message: "Internal server error",
      success: false
    });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email or username
    const user = await UserModel.findOne({ 
      $or: [{ email }, { username: email }] 
    }).select('+password +role');
    
    // Common error message to prevent user enumeration
    const errorMsg = 'Invalid credentials or not authorized';
    
    if (!user) {
      return res.status(401).json({ 
        message: errorMsg, 
        success: false 
      });
    }

    // Check if account is inactive
    if (user.status === "inactive") {
      return res.status(401).json({ 
        message: 'Your account is under review', 
        success: false 
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        message: errorMsg, 
        success: false 
      });
    }

    // Check if user has admin privileges
    if (!user.is_admin) {
      return res.status(403).json({
        message: 'Access denied. Admin privileges required',
        success: false
      });
    }

    // Generate and send OTP
    const otpCode = generateOTP();
    const otpExpires = getExpirationTime();

    // Save OTP to user document
    user.otp = {
      code: otpCode,
      expiresAt: otpExpires,
      attempts: 0
    };
    user.otpRequestedAt = new Date();
    user.isOtpVerified = false;

    await user.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(user.email, otpCode, user.username);

    if (!emailResult.success) {
      console.error('Failed to send OTP email:', emailResult.error);
      return res.status(500).json({
        message: 'Failed to send OTP. Please try again.',
        success: false
      });
    }

    // Generate temporary token for OTP verification (short expiry)
    const tempToken = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role,
        purpose: 'otp_verification'
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // Short expiry for OTP verification
    );

    res.status(200).json({
      message: "OTP sent to your email. Please verify to complete login.",
      success: true,
      tempToken,
      requiresOTP: true,
      email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Mask email for security
    });

  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({
      message: "Internal server error",
      success: false
    });
  }
};

const verifyAdminOTP = async (req, res) => {
  try {
    const { otp, tempToken } = req.body;

    if (!otp || !tempToken) {
      return res.status(400).json({
        message: 'OTP and temporary token are required',
        success: false
      });
    }

    // Verify temporary token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        message: 'Invalid or expired temporary token',
        success: false
      });
    }

    // Check if token is for OTP verification
    if (decoded.purpose !== 'otp_verification') {
      return res.status(401).json({
        message: 'Invalid token purpose',
        success: false
      });
    }

    // Find user
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        success: false
      });
    }

    // Validate OTP
    const otpValidation = validateOTP(user, otp);

    if (!otpValidation.isValid) {
      // Save updated attempts if OTP is invalid
      if (otpValidation.message.includes('attempts')) {
        await user.save();
      }
      
      return res.status(400).json({
        message: otpValidation.message,
        success: false,
        attempts: user.otp.attempts
      });
    }

    // OTP is valid - clear OTP data and mark as verified
    user.otp = {
      code: null,
      expiresAt: null,
      attempts: 0
    };
    user.isOtpVerified = true;
    user.lastLogin = new Date();
    await user.save();

    // Generate final admin JWT token
    const finalToken = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role,
        isOtpVerified: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Omit sensitive data from response
    const userData = user.toObject();
    delete userData.password;
    delete userData.__v;
    delete userData.otp;

    res.status(200).json({
      message: "Admin login successful",
      success: true,
      token: finalToken,
      user: userData
    });

  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({
      message: "Internal server error",
      success: false
    });
  }
};

const resendAdminOTP = async (req, res) => {
  try {
    const { tempToken } = req.body;

    if (!tempToken) {
      return res.status(400).json({
        message: 'Temporary token is required',
        success: false
      });
    }

    // Verify temporary token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        message: 'Invalid or expired temporary token',
        success: false
      });
    }

    // Find user
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
        success: false
      });
    }

    // Check if OTP was requested recently (prevent spam)
    const lastRequest = user.otpRequestedAt;
    const now = new Date();
    if (lastRequest && (now - lastRequest) < 30000) { // 30 seconds cooldown
      return res.status(429).json({
        message: 'Please wait 30 seconds before requesting a new OTP',
        success: false
      });
    }

    // Generate new OTP
    const otpCode = generateOTP();
    const otpExpires = getExpirationTime();

    // Update OTP data
    user.otp = {
      code: otpCode,
      expiresAt: otpExpires,
      attempts: 0
    };
    user.otpRequestedAt = new Date();
    user.isOtpVerified = false;

    await user.save();

    // Send new OTP email
    const emailResult = await sendOTPEmail(user.email, otpCode, user.username);

    if (!emailResult.success) {
      console.error('Failed to send OTP email:', emailResult.error);
      return res.status(500).json({
        message: 'Failed to send OTP. Please try again.',
        success: false
      });
    }

    res.status(200).json({
      message: "New OTP sent to your email",
      success: true,
      tempToken // Return same token (it should still be valid)
    });

  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({
      message: "Internal server error",
      success: false
    });
  }
};

// Middleware to verify OTP for protected admin routes
const verifyAdminOTPMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        message: 'Access token required',
        success: false
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if OTP was verified during login
    if (!decoded.isOtpVerified) {
      return res.status(401).json({
        message: 'OTP verification required',
        success: false
      });
    }

    // Verify user still exists and is admin
    const user = await UserModel.findById(decoded.userId);
    if (!user || !user.is_admin) {
      return res.status(401).json({
        message: 'Admin privileges required',
        success: false
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin OTP verification error:', error);
    res.status(401).json({
      message: 'Invalid or expired token',
      success: false
    });
  }
};

module.exports = {
  signup,
  login,
  checkUsername,
  adminLogin,
  verifyAdminOTP,
  resendAdminOTP,
  verifyAdminOTPMiddleware
};