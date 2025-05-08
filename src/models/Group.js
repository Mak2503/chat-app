const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to check if a user is a member of the group
groupSchema.methods.isMember = function(userId) {
  return this.members.some(member => member.equals(userId));
};

// Method to add a user to the group
groupSchema.methods.addMember = function(userId) {
  if (!this.isMember(userId)) {
    this.members.push(userId);
  }
  return this.save();
};

// Method to remove a user from the group
groupSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => !member.equals(userId));
  return this.save();
};

const Group = mongoose.model('Group', groupSchema);

module.exports = Group;