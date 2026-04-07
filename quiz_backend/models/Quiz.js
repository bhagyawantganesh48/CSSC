const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  title:          { type: String, required: true },
  description:    { type: String, default: '' },
  category:       { type: String, required: true },
  difficultyTier: { type: String, default: 'Beginner (Recruit)' },
  durationMinutes:  { type: Number, required: true, default: 10 },
  status:           { type: String, enum: ['draft', 'active', 'archived'], default: 'draft' },

  // ── Schedule / Access Control ────────────────────────────────────
  scheduleStart:  { type: Date, default: null },
  scheduleEnd:    { type: Date, default: null },
  maxAttempts:    { type: Number, default: 1 },
  accessCode:     { type: String, default: '' },

  // ── Behaviour Settings ───────────────────────────────────────────
  settings: {
    shuffleQuestions:    { type: Boolean, default: true  },
    shuffleOptions:      { type: Boolean, default: true  },
    oneQuestionAtATime:  { type: Boolean, default: true  },
    allowBackNav:        { type: Boolean, default: false },
    maxQuestionsDisplay: { type: Number,  default: 0 },     // 0 = show all

    // Timer
    perQuestionTimerSec: { type: Number,  default: 0 },     // 0 = disabled
    strictTimeSubmit:    { type: Boolean, default: true  },

    // Anti-Cheat
    enforceFullscreen:   { type: Boolean, default: true  },
    detectTabSwitch:     { type: Boolean, default: true  },
    disableRightClick:   { type: Boolean, default: true  },
    disableCopyPaste:    { type: Boolean, default: true  },
    maxViolations:       { type: Number,  default: 3 },

    // Certificates
    autoGenerateCert:    { type: Boolean, default: true  },
    passingScorePercent: { type: Number,  default: 80    },
    showDetailedAnalytics: { type: Boolean, default: true },

    // UI Experience
    uiTheme:             { type: String,  default: 'Dark Mode (CSSC)' },
    showProgressBar:     { type: Boolean, default: true  },
    showQuestionNumbers: { type: Boolean, default: true  }
  }
}, { timestamps: true });

module.exports = mongoose.model('Quiz', QuizSchema);
