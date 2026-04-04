// Vercel serverless entry point — proxies all /api/* requests to quiz_backend
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');

// Load quiz_backend routes relative to this file's location
const quizRoutes  = require('../quiz_backend/routes/quizRoutes');
const adminRoutes = require('../quiz_backend/routes/adminRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/quiz',  quizRoutes);
app.use('/api/admin', adminRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Not found: ${req.method} ${req.url}` });
});

// Error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ success: false, message: err.message });
});

// ─── Reuse MongoDB connection across serverless invocations ───────
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  let uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<username>')) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mem = await MongoMemoryServer.create();
    uri = mem.getUri();
    const { seedData } = require('../quiz_backend/seed');
    await seedData();
  }
  await mongoose.connect(uri);
  isConnected = true;
};

// Vercel serverless handler
module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
