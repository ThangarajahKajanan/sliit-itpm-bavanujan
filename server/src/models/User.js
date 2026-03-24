const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    name:  { type: String, trim: true, default: null },
    phone: { type: String, trim: true, default: null },
    itNumber: { type: String, trim: true, default: null },
    role:  { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
