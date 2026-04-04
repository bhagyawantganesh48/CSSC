const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003;

// Middleware
app.use(cors());
app.use(express.json());

app.use('/api/quiz', require('./routes/quizRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// 404 Catch-all (Returns JSON, not HTML)
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.url}` });
});

// Error handling middleware (Returns JSON, not HTML)
app.use((err, req, res, next) => {
  console.error('💥 Global Error:', err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// Connect to MongoDB
let MONGODB_URI = process.env.MONGODB_URI;

const startServer = async () => {
  try {
    // If there is no URI, or it's the placeholder from .env, use memory server
    if (!MONGODB_URI || MONGODB_URI.includes('<username>')) {
      console.log('⚠️ No valid MONGODB_URI detected. Spinning up Local In-Memory Database for testing...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      MONGODB_URI = mongoServer.getUri();
      console.log('✅ Local In-Memory MongoDB running.');
    }

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB at:', MONGODB_URI);

    // Call seed if using memory server
    if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('<username>')) {
      const { seedData } = require('./seed');
      await seedData();
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

startServer();
