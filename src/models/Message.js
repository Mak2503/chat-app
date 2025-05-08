const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// A message must have either a recipient or a group, but not both
messageSchema.pre('validate', function(next) {
  if ((this.recipient && this.group) || (!this.recipient && !this.group)) {
    next(new Error('Message must have either a recipient or a group, but not both'));
  }
  next();
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;