const express = require('express');
const router  = express.Router();
const Quiz    = require('../models/Quiz');
const Question = require('../models/Question');
const Result  = require('../models/Result');
const User    = require('../models/User');
const Member  = require('../models/Member');

// ─── QUIZ CRUD ────────────────────────────────────────────────────────
// CREATE Quiz
router.post('/quizzes', async (req, res) => {
  try {
    const quiz = new Quiz(req.body);
    await quiz.save();
    res.json(quiz);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET all quizzes (admin sees all, including drafts)
router.get('/quizzes', async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
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
    await Question.deleteMany({ quizId: req.params.id });
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

// POST bulk add rounds (from Excel upload)
router.post('/quizzes/bulk', async (req, res) => {
  try {
    const { rounds } = req.body;
    if (!rounds) return res.status(400).json({ error: 'No rounds provided.' });

    for (const [roundName, questions] of Object.entries(rounds)) {
      // Find or create quiz for this round
      const sanitizedName = roundName.trim();
      let quiz = await Quiz.findOne({ title: { $regex: new RegExp(`^${sanitizedName}$`, 'i') } });
      if (!quiz) {
        quiz = await Quiz.create({
          title: sanitizedName,
          category: sanitizedName.toLowerCase().replace(/[^a-z0-9]/g, ''),
          durationMinutes: 30, // Default duration per round
          status: 'active'
        });
      }

      // Clear existing questions for this specific round (if it existed) to allow fresh deployments
      await Question.deleteMany({ quizId: quiz._id });

      // Build question docs
      const questionDocs = questions.map(q => {
        let correctAnswerIndex = 0;
        const ansMatch = String(q.answer).trim().toUpperCase();
        if (ansMatch.startsWith('A)') || ansMatch.startsWith('A.')) correctAnswerIndex = 0;
        else if (ansMatch.startsWith('B)') || ansMatch.startsWith('B.')) correctAnswerIndex = 1;
        else if (ansMatch.startsWith('C)') || ansMatch.startsWith('C.')) correctAnswerIndex = 2;
        else if (ansMatch.startsWith('D)') || ansMatch.startsWith('D.')) correctAnswerIndex = 3;
        else {
          const optIdx = q.options.findIndex(o => String(o).trim().toLowerCase() === String(q.answer).trim().toLowerCase());
          if (optIdx !== -1) correctAnswerIndex = optIdx;
        }

        return {
          quizId: quiz._id,
          questionText: q.question,
          options: q.options,
          correctAnswerIndex: correctAnswerIndex,
          difficulty: 'Medium'
        };
      });

      // Bulk insert
      if (questionDocs.length > 0) {
        await Question.insertMany(questionDocs);
      }
    }

    res.json({ success: true, message: 'Rounds deployed successfully!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── QUIZ RESULTS ─────────────────────────────────────────────────────
// GET all results (for admin Quiz Results & Overview)
router.get('/results', async (req, res) => {
  try {
    const results = await Result.find()
      .populate('userId', 'name email department')
      .populate('quizId', 'title category')
      .sort({ createdAt: -1 });
    res.json(results);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST a quiz result (from quiz.html via anonymous/guest submission)
router.post('/results', async (req, res) => {
  try {
    const { quizKey, quizTitle, score, totalQuestions, timeTaken, violations, autoSubmitted, playerName } = req.body;

    // Find quiz by category key, or create a guest user on the fly
    let quiz = await Quiz.findOne({ category: quizKey });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    // Find or create a "Guest" user for anonymous submissions
    let user = await User.findOne({ email: `${playerName || 'guest'}@guest.cssc` });
    if (!user) {
      user = await User.create({
        name:       playerName || 'Guest Player',
        email:      `${(playerName || 'guest').toLowerCase().replace(/\s+/g,'')}@guest.cssc`,
        password:   'guest',
        department: 'Guest',
        role:       'student'
      });
    }

    const result = new Result({ userId: user._id, quizId: quiz._id, score, totalQuestions, timeTaken, violations, autoSubmitted });
    await result.save();

    const populated = await Result.findById(result._id)
      .populate('userId', 'name email department')
      .populate('quizId', 'title category');

    res.json({ success: true, result: populated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── MEMBERS ──────────────────────────────────────────────────────────
// GET all club members
router.get('/members', async (req, res) => {
  try {
    const members = await Member.find().sort({ createdAt: -1 });
    res.json(members);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST add new member
router.post('/members', async (req, res) => {
  try {
    const member = new Member(req.body);
    await member.save();
    res.json(member);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE member
router.delete('/members/:id', async (req, res) => {
  try {
    await Member.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── DASHBOARD STATS ──────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [totalMembers, totalResults, violations, quizzes] = await Promise.all([
      Member.countDocuments(),
      Result.countDocuments(),
      Result.countDocuments({ autoSubmitted: true }),
      Quiz.countDocuments({ status: 'active' })
    ]);

    // Recent activity: last 10 results
    const recentResults = await Result.find()
      .populate('userId', 'name department')
      .populate('quizId', 'title')
      .sort({ createdAt: -1 })
      .limit(10);

    // Recent members: last 5
    const recentMembers = await Member.find().sort({ createdAt: -1 }).limit(5);

    res.json({
      totalMembers,
      totalResults,
      violations,
      activeQuizzes: quizzes,
      recentResults,
      recentMembers
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
