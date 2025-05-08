const { validationResult } = require('express-validator');
const User = require('../models/User');
const logger = require('../utils/logger');

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { country: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationExpires')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const totalUsers = await User.countDocuments(query);

    res.status(200).json({
      users,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      totalUsers
    });
  } catch (error) {
    logger.error('Admin get all users error:', error);
    res.status(500).json({ message: 'Error retrieving users', error: error.message });
  }
};

// Get user by ID (admin only)
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationExpires');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    logger.error('Admin get user by ID error:', error);
    res.status(500).json({ message: 'Error retrieving user', error: error.message });
  }
};

// Create a new admin user (admin only)
exports.createAdmin = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, firstName, email, country, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new admin user
    const adminUser = new User({
      name,
      firstName,
      email,
      country,
      password,
      role: 'admin',
      isVerified: true // Admin users are automatically verified
    });

    await adminUser.save();

    res.status(201).json({
      message: 'Admin user created successfully',
      user: adminUser.getBasicProfile()
    });
  } catch (error) {
    logger.error('Create admin error:', error);
    res.status(500).json({ message: 'Error creating admin user', error: error.message });
  }
};

// Update user (admin only)
exports.updateUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.params;
    const { name, firstName, country, role, isVerified } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (firstName) user.firstName = firstName;
    if (country) user.country = country;
    if (role && ['user', 'admin'].includes(role)) user.role = role;
    if (isVerified !== undefined) user.isVerified = isVerified;

    await user.save();

    res.status(200).json({
      message: 'User updated successfully',
      user: user.getBasicProfile()
    });
  } catch (error) {
    logger.error('Admin update user error:', error);
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Admin delete user error:', error);
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

// Get admin dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalVerifiedUsers = await User.countDocuments({ isVerified: true });
    const totalUnverifiedUsers = await User.countDocuments({ isVerified: false });
    
    // Get new users registered in the last 7 days
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsers = await User.countDocuments({ createdAt: { $gte: oneWeekAgo } });

    res.status(200).json({
      stats: {
        totalUsers,
        totalAdmins,
        totalVerifiedUsers,
        totalUnverifiedUsers,
        newUsers
      }
    });
  } catch (error) {
    logger.error('Admin dashboard stats error:', error);
    res.status(500).json({ message: 'Error retrieving dashboard stats', error: error.message });
  }
};