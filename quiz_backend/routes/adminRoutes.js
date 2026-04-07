const express  = require('express');
const router   = express.Router();
const Quiz     = require('../models/Quiz');
const Question = require('../models/Question');
const Result   = require('../models/Result');
const User     = require('../models/User');
const Member   = require('../models/Member');

// ──────────────────────────────────────────────────────────────────────────────
// QUIZ CRUD
// ──────────────────────────────────────────────────────────────────────────────

// GET all quizzes (admin sees all — drafts + active + archived)
router.get('/quizzes', async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET a single quiz by ID
router.get('/quizzes/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json(quiz);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// CREATE Quiz
router.post('/quizzes', async (req, res) => {
  try {
    const quiz = new Quiz(req.body);
    await quiz.save();
    res.json(quiz);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// UPDATE Quiz (full update)
router.put('/quizzes/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json(quiz);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE Quiz (also removes all its questions)
router.delete('/quizzes/:id', async (req, res) => {
  try {
    await Quiz.findByIdAndDelete(req.params.id);
    await Question.deleteMany({ quizId: req.params.id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ──────────────────────────────────────────────────────────────────────────────
// QUESTION CRUD (admin — includes correct answers for editing)
// ──────────────────────────────────────────────────────────────────────────────

// GET all questions for a quiz (admin view — includes correctAnswerIndex)
router.get('/quizzes/:id/questions', async (req, res) => {
  try {
    const questions = await Question.find({ quizId: req.params.id }).sort({ createdAt: 1 });
    res.json(questions);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ADD a single question to a quiz
router.post('/quizzes/:id/questions', async (req, res) => {
  try {
    const q = new Question({ ...req.body, quizId: req.params.id });
    await q.save();
    res.json(q);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// UPDATE a single question
router.put('/quizzes/:id/questions/:qid', async (req, res) => {
  try {
    const q = await Question.findByIdAndUpdate(req.params.qid, req.body, { new: true });
    if (!q) return res.status(404).json({ error: 'Question not found' });
    res.json(q);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE a single question
router.delete('/quizzes/:id/questions/:qid', async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.qid);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// BULK deploy rounds from Excel upload
router.post('/quizzes/bulk', async (req, res) => {
  try {
    const { rounds } = req.body;
    if (!rounds) return res.status(400).json({ error: 'No rounds provided.' });

    for (const [roundName, questions] of Object.entries(rounds)) {
      const sanitizedName = roundName.trim();
      let quiz = await Quiz.findOne({ title: { $regex: new RegExp(`^${sanitizedName}$`, 'i') } });
      if (!quiz) {
        quiz = await Quiz.create({
          title:          sanitizedName,
          category:       sanitizedName.toLowerCase().replace(/[^a-z0-9]/g, ''),
          durationMinutes: 30,
          status:         'active'
        });
      }

      // Wipe existing questions for this round to allow re-deploy
      await Question.deleteMany({ quizId: quiz._id });

      const questionDocs = questions.map(q => {
        let correctAnswerIndex = 0;
        const ansMatch = String(q.answer).trim().toUpperCase();
        if      (ansMatch.startsWith('A)') || ansMatch.startsWith('A.')) correctAnswerIndex = 0;
        else if (ansMatch.startsWith('B)') || ansMatch.startsWith('B.')) correctAnswerIndex = 1;
        else if (ansMatch.startsWith('C)') || ansMatch.startsWith('C.')) correctAnswerIndex = 2;
        else if (ansMatch.startsWith('D)') || ansMatch.startsWith('D.')) correctAnswerIndex = 3;
        else {
          const optIdx = q.options.findIndex(o =>
            String(o).trim().toLowerCase() === String(q.answer).trim().toLowerCase()
          );
          if (optIdx !== -1) correctAnswerIndex = optIdx;
        }
        return {
          quizId:             quiz._id,
          questionText:       q.question,
          options:            q.options,
          correctAnswerIndex,
          difficulty:         'Medium'
        };
      });

      if (questionDocs.length > 0) await Question.insertMany(questionDocs);
    }

    res.json({ success: true, message: 'Rounds deployed successfully!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ──────────────────────────────────────────────────────────────────────────────
// QUIZ RESULTS
// ──────────────────────────────────────────────────────────────────────────────

// GET all results
router.get('/results', async (req, res) => {
  try {
    const results = await Result.find()
      .populate('userId',  'name email department')
      .populate('quizId',  'title category')
      .sort({ createdAt: -1 });
    res.json(results);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST a quiz result
router.post('/results', async (req, res) => {
  try {
    const { quizKey, quizTitle, score, totalQuestions, timeTaken, violations, autoSubmitted, playerName } = req.body;

    let quiz = await Quiz.findOne({ category: quizKey });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

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

// ──────────────────────────────────────────────────────────────────────────────
// MEMBERS
// ──────────────────────────────────────────────────────────────────────────────

router.get('/members', async (req, res) => {
  try {
    const members = await Member.find().sort({ createdAt: -1 });
    res.json(members);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/members', async (req, res) => {
  try {
    const member = new Member(req.body);
    await member.save();
    res.json(member);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/members/:id', async (req, res) => {
  try {
    await Member.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ──────────────────────────────────────────────────────────────────────────────
// DASHBOARD STATS
// ──────────────────────────────────────────────────────────────────────────────

router.get('/stats', async (req, res) => {
  try {
    const [totalMembers, totalResults, violations, quizzes] = await Promise.all([
      Member.countDocuments(),
      Result.countDocuments(),
      Result.countDocuments({ autoSubmitted: true }),
      Quiz.countDocuments({ status: 'active' })
    ]);

    const recentResults = await Result.find()
      .populate('userId', 'name department')
      .populate('quizId', 'title')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentMembers = await Member.find().sort({ createdAt: -1 }).limit(5);

    res.json({ totalMembers, totalResults, violations, activeQuizzes: quizzes, recentResults, recentMembers });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
