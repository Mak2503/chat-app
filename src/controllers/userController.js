const { validationResult } = require('express-validator');
const User = require('../models/User');
const Message = require('../models/Message');
const logger = require('../utils/logger');

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user: user.getBasicProfile() });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ message: 'Error retrieving profile', error: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, firstName, country } = req.body;
    
    // Find and update user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (firstName) user.firstName = firstName;
    if (country) user.country = country;

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: user.getBasicProfile()
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    
    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({ message: 'Error changing password', error: error.message });
  }
};

// Get user's direct messages
exports.getDirectMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipientId, limit = 20, skip = 0 } = req.query;

    let query;
    if (recipientId) {
      // Get messages between the current user and a specific recipient
      query = {
        $or: [
          { sender: userId, recipient: recipientId },
          { sender: recipientId, recipient: userId }
        ]
      };
    } else {
      // Get all direct messages for the current user
      query = {
        $or: [
          { sender: userId, recipient: { $exists: true } },
          { recipient: userId }
        ]
      };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .populate('sender', 'name firstName email')
      .populate('recipient', 'name firstName email');

    res.status(200).json({ messages });
  } catch (error) {
    logger.error('Get direct messages error:', error);
    res.status(500).json({ message: 'Error retrieving messages', error: error.message });
  }
};

// Get all users (for finding chat partners)
exports.getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { search } = req.query;
    
    let query = { _id: { $ne: currentUserId } }; // Exclude current user
    
    // If search parameter is provided, filter by name, firstName, or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .select('name firstName email country')
      .limit(20);
    
    res.status(200).json({ users });
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({ message: 'Error retrieving users', error: error.message });
  }
};