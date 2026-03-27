const express = require('express');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();
const AUTHOR_FIELDS = 'username name phone itNumber role';

router.get('/conversations', auth, async (req, res) => {
  try {
    const me = req.user.id;
    const messages = await Message.find({
      $or: [{ sender: me }, { receiver: me }],
    })
      .populate('sender', AUTHOR_FIELDS)
      .populate('receiver', AUTHOR_FIELDS)
      .sort({ createdAt: -1 });

    const seen = new Map();

     for (const msg of messages) {
       const isSentByMe = msg.sender._id.toString() === me;
       const partner = isSentByMe ? msg.receiver : msg.sender;
       const partnerId = partner._id.toString();
 
+      const unreadCount = await Message.countDocuments({
+        sender: partnerId,
+        receiver: me,
+        isRead: false,
+      });
+
       if (!seen.has(partnerId)) {
         seen.set(partnerId, {
           partner,
           lastMessage: msg.text || (msg.fileUrl ? 'Shared a file' : ''),
           lastAt: msg.createdAt,
+          unreadCount,
         });
       }
     }

    res.json(Array.from(seen.values()));
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/thread/:userId', auth, async (req, res) => {
  try {
    const me = req.user.id;
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const partner = await User.findById(userId).select(AUTHOR_FIELDS);
    if (!partner) {
      return res.status(404).json({ message: 'User not found' });
    }

     const messages = await Message.find({
       $or: [
         { sender: me, receiver: userId },
         { sender: userId, receiver: me },
       ],
     })
       .populate('sender', AUTHOR_FIELDS)
       .populate('receiver', AUTHOR_FIELDS)
       .sort({ createdAt: 1 });
 
+    // Mark messages from partner to me as read
+    await Message.updateMany(
+      { sender: userId, receiver: me, isRead: false },
+      { $set: { isRead: true } }
+    );
+
     res.json({ partner, messages });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/message', auth, async (req, res) => {
  try {
    const me = req.user.id;
    const { to, text, fileUrl, fileType } = req.body;

    if (!to || !mongoose.Types.ObjectId.isValid(to)) {
      return res.status(400).json({ message: 'Valid receiver is required' });
    }
    if ((!text || !text.trim()) && !fileUrl) {
      return res.status(400).json({ message: 'Message text or file is required' });
    }
    if (to === me) {
      return res.status(400).json({ message: 'You cannot message yourself' });
    }

    const receiver = await User.findById(to);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    const message = new Message({
      sender: me,
      receiver: to,
      text: text ? text.trim() : '',
      fileUrl,
      fileType,
    });
    await message.save();
    await message.populate('sender', AUTHOR_FIELDS);
    await message.populate('receiver', AUTHOR_FIELDS);

    res.status(201).json(message);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
