const { validationResult } = require('express-validator');
const Message = require('../models/Message');
const User = require('../models/User');
const Group = require('../models/Group');
const logger = require('../utils/logger');

// Send direct message
exports.sendDirectMessage = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recipientId, content } = req.body;
    const senderId = req.user.id;

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    // Create new message
    const message = new Message({
      sender: senderId,
      recipient: recipientId,
      content
    });

    await message.save();

    // Populate sender and recipient
    await message.populate('sender', 'name firstName email');
    await message.populate('recipient', 'name firstName email');

    // This would normally trigger a WebSocket event, which is handled in socketService.js

    res.status(201).json({
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    logger.error('Send direct message error:', error);
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

// Send group message
exports.sendGroupMessage = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { groupId, content } = req.body;
    const senderId = req.user.id;

    // Check if group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member of the group
    if (!group.isMember(senderId)) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    // Create new message
    const message = new Message({
      sender: senderId,
      group: groupId,
      content
    });

    await message.save();

    // Populate sender and group
    await message.populate('sender', 'name firstName email');
    await message.populate('group', 'name description');

    // This would normally trigger a WebSocket event, which is handled in socketService.js

    res.status(201).json({
      message: 'Group message sent successfully',
      data: message
    });
  } catch (error) {
    logger.error('Send group message error:', error);
    res.status(500).json({ message: 'Error sending group message', error: error.message });
  }
};

// Get messages for a specific group
exports.getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    const { limit = 20, skip = 0 } = req.query;

    // Check if group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member of the group
    if (!group.isMember(userId)) {
      return res.status(403).json({ message: 'You are not a member of this group' });
    }

    // Get messages for the group
    const messages = await Message.find({ group: groupId })
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .populate('sender', 'name firstName email')
      .populate('group', 'name description');

    res.status(200).json({ messages });
  } catch (error) {
    logger.error('Get group messages error:', error);
    res.status(500).json({ message: 'Error retrieving group messages', error: error.message });
  }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only the recipient can mark a direct message as read
    if (message.recipient && !message.recipient.equals(userId)) {
      return res.status(403).json({ message: 'You are not authorized to mark this message as read' });
    }

    // For group messages, check if user is a member of the group
    if (message.group) {
      const group = await Group.findById(message.group);
      if (!group || !group.isMember(userId)) {
        return res.status(403).json({ message: 'You are not a member of this group' });
      }
    }

    message.read = true;
    await message.save();

    res.status(200).json({ message: 'Message marked as read' });
  } catch (error) {
    logger.error('Mark message as read error:', error);
    res.status(500).json({ message: 'Error marking message as read', error: error.message });
  }
};

// Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only the sender can delete a message
    if (!message.sender.equals(userId)) {
      return res.status(403).json({ message: 'You are not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(messageId);

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    logger.error('Delete message error:', error);
    res.status(500).json({ message: 'Error deleting message', error: error.message });
  }
};