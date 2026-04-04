const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const dotenv   = require('dotenv');

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5003;

// Middleware
app.use(cors());
app.use(express.json());

app.use('/api/quiz',  require('./routes/quizRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.url}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('💥 Global Error:', err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// ─── MongoDB connection (reused across serverless invocations) ───
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  let MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI || MONGODB_URI.includes('<username>')) {
    console.log('⚠️  No valid MONGODB_URI — using in-memory server (dev only).');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    MONGODB_URI = mongoServer.getUri();
    const { seedData } = require('./seed');
    await seedData();
  }

  await mongoose.connect(MONGODB_URI);
  isConnected = true;
  console.log('✅ MongoDB connected');
};

// ─── Entry point ────────────────────────────────────────────────
// Running locally: start a real HTTP server
// Running on Vercel: export the Express app as a serverless handler
if (process.env.VERCEL) {
  // Vercel serverless — connect DB on first invocation, then handle request
  const handler = async (req, res) => {
    await connectDB();
    return app(req, res);
  };
  module.exports = handler;
} else {
  // Local development — spin up the server normally
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  }).catch(err => {
    console.error('❌ Startup Error:', err.message);
    process.exit(1);
  });
}
