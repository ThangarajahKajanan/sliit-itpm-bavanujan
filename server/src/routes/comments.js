const express = require('express');
const Comment = require('../models/Comment');
const Question = require('../models/Question');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/comments — add a comment on a question (auth required)
router.post('/', auth, async (req, res) => {
  try {
    const { text, questionId } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }
    if (!questionId) {
      return res.status(400).json({ message: 'Question ID is required' });
    }

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const comment = new Comment({
      text: text.trim(),
      author: req.user.id,
      question: questionId,
    });
    await comment.save();
    await comment.populate('author', 'username name phone itNumber role');
    res.status(201).json(comment);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
