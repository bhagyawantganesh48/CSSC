const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const dotenv   = require('dotenv');
const path     = require('path');

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5003;

// ── Middleware ────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));        // allow all origins (frontend on Vite or file://)
app.use(express.json());

// ── API Routes ────────────────────────────────────────────────────────
app.use('/api/quiz',  require('./routes/quizRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Health-check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

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

  if (!MONGODB_URI || MONGODB_URI.includes('<username>') || MONGODB_URI.includes('localhost')) {
    console.log('⚠️  No valid MONGODB_URI — using in-memory server (dev only).');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    MONGODB_URI = mongoServer.getUri();
    // Connect FIRST, then seed
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 30000 });
    isConnected = true;
    console.log('✅ MongoDB connected');
    const { seedData } = require('./seed');
    await seedData();
    return;
  }

  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 30000 });
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
      console.log(`\n🚀 CSSC Quiz Backend running → http://localhost:${PORT}`);
      console.log(`📊 Admin API             → http://localhost:${PORT}/api/admin/stats`);
      console.log(`📋 Quiz Results API      → http://localhost:${PORT}/api/admin/results`);
      console.log(`👥 Members API           → http://localhost:${PORT}/api/admin/members\n`);
    });
  }).catch(err => {
    console.error('❌ Startup Error:', err.message);
    process.exit(1);
  });
}
