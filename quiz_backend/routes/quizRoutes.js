const express = require('express');
const router = express.Router();
const Quiz = require('../models/Quiz');
const Question = require('../models/Question');
const Result = require('../models/Result');
const User = require('../models/User');

// Get all active quizzes (for lobby) — includes schedule for frontend enforcement
router.get('/quizzes', async (req, res) => {
  try {
    const quizzes = await Quiz.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .select('title description category durationMinutes settings scheduleStart scheduleEnd maxAttempts accessCode');
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get questions for a specific quiz (student initiating quiz)
router.get('/:quizId/questions', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });

    // ── Schedule enforcement (backend gate) ─────────────────────────
    const now = new Date();
    if (quiz.scheduleStart && now < new Date(quiz.scheduleStart)) {
      return res.status(403).json({
        error: 'SCHEDULE_NOT_STARTED',
        message: 'This quiz has not started yet.',
        opensAt: quiz.scheduleStart
      });
    }
    if (quiz.scheduleEnd && now > new Date(quiz.scheduleEnd)) {
      return res.status(403).json({
        error: 'SCHEDULE_CLOSED',
        message: 'The quiz window for this assessment has closed.',
        closedAt: quiz.scheduleEnd
      });
    }
    // ────────────────────────────────────────────────────────────────

    // SECURITY: -correctAnswerIndex ensures answers are NEVER sent to the browser
    const questions = await Question.find({ quizId: req.params.quizId }).select('-correctAnswerIndex -createdAt -updatedAt');
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit a quiz attempt
router.post('/submit', async (req, res) => {
  try {
    const { userId, quizId, answers, timeTaken, violations, autoSubmitted } = req.body;
    
    // answers should be [{ questionId, selectedOptionIndex }]
    let score = 0;
    const details = [];

    // Fetch actual questions to calculate score securely on backend
    const questions = await Question.find({ quizId });
    const questionMap = {};
    questions.forEach(q => questionMap[q._id.toString()] = q);

    for (const ans of answers) {
      const actualQ = questionMap[ans.questionId];
      if (actualQ) {
        const isCorrect = (actualQ.correctAnswerIndex === ans.selectedOptionIndex);
        if (isCorrect) score++;
        details.push({
          questionId: actualQ._id,
          selectedOptionIndex: ans.selectedOptionIndex,
          isCorrect
        });
      }
    }

    const result = new Result({
      userId,
      quizId,
      score,
      totalQuestions: questions.length,
      timeTaken,
      violations,
      autoSubmitted,
      details
    });

    await result.save();
    
    // Return final grade to UI
    res.json({ success: true, score, total: questions.length, resultId: result._id });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Student Registration (Direct in Quiz Engine)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, department } = req.body;
    
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'This email is already registered.' });
    }

    // Create new student
    user = new User({
      name,
      email,
      password, // Note: In this prototype, we're storing the provided password directly.
      department,
      role: 'student'
    });
    
    await user.save();
    console.log(`✅ New student registered: ${email}`);
    res.json({ success: true, message: 'Registration successful! You can now log in.', user: { id: user._id, name: user.name, email: user.email } });

  } catch (err) {
    console.error('❌ Registration error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Authenticate student
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please contact the administrator.' });
    }
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, department: user.department } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
