const User = require('../models/User');
const Message = require('../models/Message');
const Group = require('../models/Group');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

module.exports = (io) => {
  // Store user socket connections
  const userSockets = new Map();

  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key');
      
      // Get user from database
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    
    logger.info(`User connected: ${userId}`);
    
    // Add user to online users
    userSockets.set(userId, socket.id);
    
    // Join user's personal room for direct messages
    socket.join(`user:${userId}`);
    
    // Join rooms for user's groups
    joinUserGroups(socket);
    
    // Notify others that user is online
    io.emit('user_status', { userId, status: 'online' });

    // Handle direct message
    socket.on('direct_message', async (data) => {
      try {
        const { recipientId, content } = data;
        
        // Validate data
        if (!recipientId || !content) {
          socket.emit('error', { message: 'Recipient ID and content are required' });
          return;
        }

        // Create message
        const message = new Message({
          sender: userId,
          recipient: recipientId,
          content
        });

        await message.save();
        
        // Populate sender info
        await message.populate('sender', 'name firstName email');
        await message.populate('recipient', 'name firstName email');

        // Send to recipient if online
        if (userSockets.has(recipientId)) {
          io.to(`user:${recipientId}`).emit('direct_message', message);
        }
        
        // Send confirmation to sender
        socket.emit('message_sent', { messageId: message._id });
        
      } catch (error) {
        logger.error('Direct message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle group message
    socket.on('group_message', async (data) => {
      try {
        const { groupId, content } = data;
        
        // Validate data
        if (!groupId || !content) {
          socket.emit('error', { message: 'Group ID and content are required' });
          return;
        }

        // Check if user is in the group
        const group = await Group.findById(groupId);
        if (!group) {
          socket.emit('error', { message: 'Group not found' });
          return;
        }

        if (!group.isMember(userId)) {
          socket.emit('error', { message: 'You are not a member of this group' });
          return;
        }

        // Create message
        const message = new Message({
          sender: userId,
          group: groupId,
          content
        });

        await message.save();
        
        // Populate sender and group info
        await message.populate('sender', 'name firstName email');
        
        // Send to all members in the group
        io.to(`group:${groupId}`).emit('group_message', message);
        
        // Send confirmation to sender
        socket.emit('message_sent', { messageId: message._id });
        
      } catch (error) {
        logger.error('Group message error:', error);
        socket.emit('error', { message: 'Failed to send group message' });
      }
    });

    // Handle joining a group
    socket.on('join_group', async (data) => {
      try {
        const { groupId } = data;
        
        // Validate data
        if (!groupId) {
          socket.emit('error', { message: 'Group ID is required' });
          return;
        }

        // Check if group exists
        const group = await Group.findById(groupId);
        if (!group) {
          socket.emit('error', { message: 'Group not found' });
          return;
        }

        // Add user to group if not already a member
        if (!group.isMember(userId)) {
          await group.addMember(userId);
          
          // Join socket room for this group
          socket.join(`group:${groupId}`);
          
          // Notify all group members about new member
          io.to(`group:${groupId}`).emit('group_update', {
            type: 'member_joined',
            groupId,
            userId,
            user: {
              _id: socket.user._id,
              name: socket.user.name,
              firstName: socket.user.firstName,
              email: socket.user.email
            }
          });
          
          socket.emit('group_joined', { groupId, name: group.name });
        } else {
          socket.emit('error', { message: 'You are already a member of this group' });
        }
        
      } catch (error) {
        logger.error('Join group error:', error);
        socket.emit('error', { message: 'Failed to join group' });
      }
    });

    // Handle leaving a group
    socket.on('leave_group', async (data) => {
      try {
        const { groupId } = data;
        
        // Validate data
        if (!groupId) {
          socket.emit('error', { message: 'Group ID is required' });
          return;
        }

        // Check if group exists
        const group = await Group.findById(groupId);
        if (!group) {
          socket.emit('error', { message: 'Group not found' });
          return;
        }

        // Check if user is a member
        if (!group.isMember(userId)) {
          socket.emit('error', { message: 'You are not a member of this group' });
          return;
        }

        // If user is the creator and not the only member, don't allow leaving
        if (group.creator.equals(userId) && group.members.length > 1) {
          socket.emit('error', { message: 'Group creator cannot leave. Transfer ownership or delete the group.' });
          return;
        }

        // Remove user from group
        await group.removeMember(userId);
        
        // Leave socket room for this group
        socket.leave(`group:${groupId}`);
        
        // If no members left, delete the group
        if (group.members.length === 0) {
          await Group.findByIdAndDelete(groupId);
          io.emit('group_deleted', { groupId });
        } else {
          // Notify all group members about member leaving
          io.to(`group:${groupId}`).emit('group_update', {
            type: 'member_left',
            groupId,
            userId
          });
        }
        
        socket.emit('group_left', { groupId, name: group.name });
        
      } catch (error) {
        logger.error('Leave group error:', error);
        socket.emit('error', { message: 'Failed to leave group' });
      }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { recipientId, isTyping } = data;
      
      if (recipientId) {
        io.to(`user:${recipientId}`).emit('typing', {
          userId,
          isTyping
        });
      }
    });

    // Handle group typing indicator
    socket.on('group_typing', (data) => {
      const { groupId, isTyping } = data;
      
      if (groupId) {
        socket.to(`group:${groupId}`).emit('group_typing', {
          userId,
          groupId,
          userName: socket.user.firstName,
          isTyping
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${userId}`);
      
      // Remove user from online users
      userSockets.delete(userId);
      
      // Notify others that user is offline
      io.emit('user_status', { userId, status: 'offline' });
    });
  });

  // Helper function to join user to all their group rooms
  async function joinUserGroups(socket) {
    try {
      const userId = socket.user._id;
      
      // Find all groups user is a member of
      const groups = await Group.find({ members: userId });
      
      // Join socket rooms for each group
      for (const group of groups) {
        socket.join(`group:${group._id}`);
      }
      
    } catch (error) {
      logger.error('Error joining user groups:', error);
    }
  }
};