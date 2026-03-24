require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const commentRoutes = require('./routes/comments');
const profileRoutes = require('./routes/profile');
const inboxRoutes = require('./routes/inbox');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api', profileRoutes);
app.use('/api/inbox', inboxRoutes);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error('MongoDB connection error:', err));
