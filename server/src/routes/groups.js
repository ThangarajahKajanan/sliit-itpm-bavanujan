const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const GroupMessage = require('../models/GroupMessage');
const GroupRead = require('../models/GroupRead');
const auth = require('../middleware/auth');

// Get all public groups
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find().populate('owner', 'username');
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get groups joined by user
router.get('/joined', auth, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id }).populate('owner', 'username');
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new group
router.post('/', auth, async (req, res) => {
  const { name, description } = req.body;
  try {
    const newGroup = new Group({
      name,
      description,
      owner: req.user.id,
      members: [req.user.id]
    });
    await newGroup.save();
    res.status(201).json(newGroup);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Join a group
router.post('/:id/join', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    if (group.members.includes(req.user.id)) return res.status(400).json({ message: 'Already a member' });
    
    group.members.push(req.user.id);
    await group.save();
    res.json(group);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave a group
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found' });
    
    group.members = group.members.filter(m => m.toString() !== req.user.id);
    await group.save();
    res.json({ message: 'Left group successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get group messages
router.get('/:id/messages', auth, async (req, res) => {
  try {
    const messages = await GroupMessage.find({ group: req.params.id })
      .populate('sender', 'username')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'username' }
      })
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
