require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const commentRoutes = require('./routes/comments');
const profileRoutes = require('./routes/profile');
const inboxRoutes = require('./routes/inbox');
const groupRoutes = require('./routes/groups');

const GroupMessage = require('./models/GroupMessage');
const Message = require('./models/Message');
const GroupRead = require('./models/GroupRead');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// File Upload Route
app.post('/api/upload', upload.single('file'), (req, res) => {
  console.log('Upload request received');
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ fileUrl, fileType: req.file.mimetype });
});

app.use('/api', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api', profileRoutes);
app.use('/api/inbox', inboxRoutes);
app.use('/api/groups', groupRoutes);

// Socket.io Logic
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join_group', (groupId) => {
    socket.join(groupId);
    console.log(`User joined group: ${groupId}`);
  });

  socket.on('join_private', (userId) => {
    socket.join(userId);
    console.log(`User joined private room: ${userId}`);
  });

  socket.on('send_message', async (data) => {
    const { group, sender, content, fileUrl, fileType, replyTo } = data;
    try {
      const newMessage = new GroupMessage({
        group,
        sender,
        content,
        fileUrl,
        fileType,
        replyTo
      });
      await newMessage.save();
      
      const populatedMessage = await GroupMessage.findById(newMessage._id)
        .populate('sender', 'username')
        .populate({
          path: 'replyTo',
          populate: { path: 'sender', select: 'username' }
        });

      io.to(group).emit('receive_message', populatedMessage);
      // Notify group members about new message for unread counts
      io.to(group).emit('group_notification', { group, message: populatedMessage });
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('private_message', async (data) => {
    const { sender, receiver, text, fileUrl, fileType } = data;
    try {
      const newMessage = new Message({
        sender,
        receiver,
        text,
        fileUrl,
        fileType,
        isRead: false
      });
      await newMessage.save();
      
      const populatedMessage = await Message.findById(newMessage._id)
        .populate('sender', 'username name')
        .populate('receiver', 'username name');

      // Send to both sender and receiver rooms
      io.to(receiver).emit('receive_private_message', populatedMessage);
      io.to(sender).emit('receive_private_message', populatedMessage);
    } catch (err) {
      console.error('Error saving private message:', err);
    }
  });

  socket.on('mark_read', async (data) => {
    const { userId, partnerId } = data;
    try {
      await Message.updateMany(
        { sender: partnerId, receiver: userId, isRead: false },
        { $set: { isRead: true } }
      );
      io.to(userId).emit('messages_read', { partnerId });
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  });

  socket.on('mark_group_read', async (data) => {
    const { userId, groupId } = data;
    try {
      await GroupRead.findOneAndUpdate(
        { user: userId, group: groupId },
        { lastReadAt: new Date() },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.error('Error marking group as read:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));
