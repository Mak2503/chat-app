const { validationResult } = require('express-validator');
const Group = require('../models/Group');
const Message = require('../models/Message');
const User = require('../models/User');
const logger = require('../utils/logger');

// Create a new group
exports.createGroup = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;
    const userId = req.user.id;

    // Create new group
    const group = new Group({
      name,
      description,
      creator: userId,
      members: [userId] // Creator is automatically a member
    });

    await group.save();

    res.status(201).json({
      message: 'Group created successfully',
      group
    });
  } catch (error) {
    logger.error('Create group error:', error);
    res.status(500).json({ message: 'Error creating group', error: error.message });
  }
};

// Get all groups
exports.getAllGroups = async (req, res) => {
  try {
    const { search, limit = 10, skip = 0 } = req.query;

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const groups = await Group.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .populate('creator', 'name firstName email')
      .populate('members', 'name firstName email');

    const totalGroups = await Group.countDocuments(query);

    res.status(200).json({
      groups,
      totalGroups,
      hasMore: totalGroups > Number(skip) + Number(limit)
    });
  } catch (error) {
    logger.error('Get all groups error:', error);
    res.status(500).json({ message: 'Error retrieving groups', error: error.message });
  }
};

// Get user's groups
exports.getUserGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    const groups = await Group.find({ members: userId })
      .sort({ createdAt: -1 })
      .populate('creator', 'name firstName email')
      .populate('members', 'name firstName email');

    res.status(200).json({ groups });
  } catch (error) {
    logger.error('Get user groups error:', error);
    res.status(500).json({ message: 'Error retrieving user groups', error: error.message });
  }
};

// Get group by ID
exports.getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId)
      .populate('creator', 'name firstName email')
      .populate('members', 'name firstName email');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    res.status(200).json({ group });
  } catch (error) {
    logger.error('Get group by ID error:', error);
    res.status(500).json({ message: 'Error retrieving group', error: error.message });
  }
};

// Join a group
exports.joinGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is already a member
    if (group.isMember(userId)) {
      return res.status(400).json({ message: 'You are already a member of this group' });
    }

    await group.addMember(userId);

    res.status(200).json({ message: 'Successfully joined the group', group });
  } catch (error) {
    logger.error('Join group error:', error);
    res.status(500).json({ message: 'Error joining group', error: error.message });
  }
};

// Leave a group
exports.leaveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member
    if (!group.isMember(userId)) {
      return res.status(400).json({ message: 'You are not a member of this group' });
    }

    // If user is the creator, don't allow them to leave unless they're the only member
    if (group.creator.equals(userId) && group.members.length > 1) {
      return res.status(400).json({ message: 'Group creator cannot leave. Transfer ownership or delete the group.' });
    }

    await group.removeMember(userId);

    // If no members left, delete the group
    if (group.members.length === 0) {
      await Group.findByIdAndDelete(groupId);
      return res.status(200).json({ message: 'You left the group and it was deleted as no members remain' });
    }

    res.status(200).json({ message: 'Successfully left the group' });
  } catch (error) {
    logger.error('Leave group error:', error);
    res.status(500).json({ message: 'Error leaving group', error: error.message });
  }
};

// Update group
exports.updateGroup = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { groupId } = req.params;
    const { name, description } = req.body;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only creator can update group
    if (!group.creator.equals(userId)) {
      return res.status(403).json({ message: 'Only the group creator can update the group' });
    }

    // Update fields
    if (name) group.name = name;
    if (description !== undefined) group.description = description;

    await group.save();

    res.status(200).json({
      message: 'Group updated successfully',
      group
    });
  } catch (error) {
    logger.error('Update group error:', error);
    res.status(500).json({ message: 'Error updating group', error: error.message });
  }
};

// Delete group
exports.deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only creator can delete group
    if (!group.creator.equals(userId)) {
      return res.status(403).json({ message: 'Only the group creator can delete the group' });
    }

    // Delete associated messages
    await Message.deleteMany({ group: groupId });

    // Delete group
    await Group.findByIdAndDelete(groupId);

    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (error) {
    logger.error('Delete group error:', error);
    res.status(500).json({ message: 'Error deleting group', error: error.message });
  }
};