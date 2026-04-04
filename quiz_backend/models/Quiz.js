const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  durationMinutes: { type: Number, required: true },
  settings: {
    shuffleQuestions: { type: Boolean, default: true },
    shuffleOptions: { type: Boolean, default: true },
    maxViolations: { type: Number, default: 3 },
    oneQuestionAtATime: { type: Boolean, default: true },
    enforceFullscreen: { type: Boolean, default: true }
  },
  status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft' }
}, { timestamps: true });

module.exports = mongoose.model('Quiz', QuizSchema);
