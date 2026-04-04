const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  timeTaken: { type: Number, required: true }, // in seconds
  violations: { type: Number, default: 0 },
  autoSubmitted: { type: Boolean, default: false },
  details: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    selectedOptionIndex: { type: Number },
    isCorrect: { type: Boolean }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Result', ResultSchema);
