const UserModel = require("../Models/User");

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find({})
      .select('-password -__v')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Get active users
exports.getActiveUsers = async (req, res) => {
  try {
    const users = await UserModel.find({ status: 'active' })
      .select('-password -__v')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Get inactive users
exports.getInactiveUsers = async (req, res) => {
  try {
    const users = await UserModel.find({ status: 'inactive' })
      .select('-password -__v')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Update user status
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    // // Prevent self-deactivation
    // if (req.user._id.equals(req.params.id) && status === 'inactive') {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'You cannot deactivate your own account'
    //   });
    // }

    const user = await UserModel.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};