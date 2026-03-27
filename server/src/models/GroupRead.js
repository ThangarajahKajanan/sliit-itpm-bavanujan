const mongoose = require('mongoose');

const groupReadSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  lastReadAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('GroupRead', groupReadSchema);
