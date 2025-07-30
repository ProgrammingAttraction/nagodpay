const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require("../Models/User");
const fs = require('fs');
const path = require('path');

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

        // // Hash password
        // user.password = await bcrypt.hash(password, 10);
        
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
          
        if(user.status=="inactive"){
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

// Add this new method to your existing auth controller
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

        // Generate JWT token with admin role
        const token = jwt.sign(
            { 
                userId: user._id,
                email: user.email,
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' } // Shorter expiration for admin tokens
        );

        // Omit sensitive data from response
        const userData = user.toObject();
        delete userData.password;
        delete userData.__v;

        res.status(200).json({
            message: "Admin login successful",
            success: true,
            token,
            user: userData
        });

    } catch (err) {
        console.error('Admin login error:', err);
        res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
};

// Update your exports to include the new adminLogin
module.exports = {
    signup,
    login,
    checkUsername,
    adminLogin
};