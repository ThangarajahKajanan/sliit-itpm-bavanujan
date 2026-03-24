const express = require('express');
const Question = require('../models/Question');
const Comment = require('../models/Comment');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/questions — fetch all questions (newest first)
router.get('/', async (req, res) => {
  try {
    const questions = await Question.find()
      .populate('author', 'username name phone itNumber role')
      .sort({ createdAt: -1 });
    res.json(questions);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/questions/:id — fetch one question with its comments
router.get('/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).populate(
      'author',
      'username name phone itNumber role'
    );
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    const comments = await Comment.find({ question: req.params.id })
      .populate('author', 'username name phone itNumber role')
      .sort({ createdAt: 1 });
    res.json({ question, comments });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/questions — create a new question (auth required)
router.post('/', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Question text is required' });
    }
    const question = new Question({ text: text.trim(), author: req.user.id });
    await question.save();
    await question.populate('author', 'username name phone itNumber role');
    res.status(201).json(question);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/questions/:id — edit question (auth required, author only)
router.put('/:id', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Question text is required' });
    }
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    if (question.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    question.text = text.trim();
    await question.save();
    await question.populate('author', 'username name phone itNumber role');
    res.json(question);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/questions/:id — delete question (auth required, author only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    if (question.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await question.deleteOne();
    await Comment.deleteMany({ question: req.params.id });
    res.json({ message: 'Question deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
