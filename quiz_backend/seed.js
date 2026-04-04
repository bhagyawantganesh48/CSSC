const mongoose = require('mongoose');
const Quiz = require('./models/Quiz');
const Question = require('./models/Question');
const User = require('./models/User');

const seedData = async () => {
  try {
    console.log('Seeding Database...');

    // Clear existing
    await Quiz.deleteMany();
    await Question.deleteMany();
    await User.deleteMany();

    // 1. Create Users
    await User.create([
      { name: 'Admin User', email: 'admin@cssc.com', password: 'hashed_password_here', role: 'admin' },
      { name: 'Ganesh B.', email: 'ganesh@cssc.com', password: 'pwd', department: 'CSE' },
      { name: 'Priya S.', email: 'priya@cssc.com', password: 'pwd', department: 'IT' }
    ]);
    console.log('Users created.');

    // 2. Create Quizzes
    const q1 = await Quiz.create({
      title: 'Cyber Security Fundamentals',
      category: 'cybersec',
      durationMinutes: 8,
      status: 'active'
    });
    const q2 = await Quiz.create({
      title: 'Network Defense Essentials',
      category: 'network',
      durationMinutes: 6,
      status: 'active'
    });

    // 3. Create Questions for Cyber Security
    const cyberQuestions = [
      { q: 'What does CIA Triad stand for in cybersecurity?', opts: ['Confidentiality, Integrity, Availability', 'Control, Intelligence, Access', 'Cyber, Internet, Architecture', 'Compliance, Inspection, Audit'], ans: 0 },
      { q: 'Which attack type floods a server with requests to make it unavailable?', opts: ['Phishing', 'SQL Injection', 'DDoS', 'Man-in-the-Middle'], ans: 2 },
      { q: 'What is the primary purpose of a firewall?', opts: ['Encrypting data', 'Filtering network traffic', 'Storing passwords', 'Detecting malware'], ans: 1 }
    ];

    for (let q of cyberQuestions) {
      await Question.create({
        quizId: q1._id,
        questionText: q.q,
        options: q.opts,
        correctAnswerIndex: q.ans
      });
    }

    console.log('Database Seeding Completed Successfully! 🌱');

  } catch (err) {
    console.error('Seeding Error:', err);
  }
};

module.exports = { seedData };
