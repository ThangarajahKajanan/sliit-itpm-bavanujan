const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();
const ALLOWED_ROLES = ['student', 'senior student', 'lecturer'];

// GET /api/profile — fetch current user's profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/profile — update current user's profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, itNumber, role } = req.body;

    if (role && !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Invalid role value' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name  !== undefined) user.name  = name  || null;
    if (phone !== undefined) user.phone = phone || null;
    if (itNumber !== undefined) user.itNumber = itNumber || null;
    if (role  !== undefined) user.role  = role  || null;

    await user.save();

    const updated = await User.findById(req.user.id).select('-password');
    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
