const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Result = require('../models/Result');
const User = require('../models/User');

// --- AUTHENTICATION MOCK (In real life use JWT) ---
// We assume admin is validated by frontend for now as requested
// Or simple auth check could go here.

// CREATE Quiz
router.post('/quizzes', async (req, res) => {
  try {
    const quiz = new Quiz(req.body);
    await quiz.save();
    res.json(quiz);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET all quizzes (even drafts)
router.get('/quizzes', async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    res.json(quizzes);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// UPDATE Quiz
router.put('/quizzes/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(quiz);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE Quiz
router.delete('/quizzes/:id', async (req, res) => {
  try {
    await Quiz.findByIdAndDelete(req.params.id);
    await Question.deleteMany({ quizId: req.params.id }); // Clean up questions
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ADD Question to Quiz
router.post('/quizzes/:id/questions', async (req, res) => {
  try {
    const q = new Question({ ...req.body, quizId: req.params.id });
    await q.save();
    res.json(q);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET Results
router.get('/results', async (req, res) => {
  try {
    const results = await Result.find()
      .populate('userId', 'name email department')
      .populate('quizId', 'title category')
      .sort({ createdAt: -1 });
    res.json(results);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET Members (Users)
router.get('/members', async (req, res) => {
  try {
    const users = await User.find({ role: 'student' });
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
