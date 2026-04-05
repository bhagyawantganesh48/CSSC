const mongoose = require('mongoose');
const Quiz     = require('./models/Quiz');
const Question = require('./models/Question');
const User     = require('./models/User');
const Member   = require('./models/Member');
const Result   = require('./models/Result');

const seedData = async () => {
  try {
    console.log('🌱 Seeding Virtual Database...');

    // Clear existing
    await Promise.all([
      Quiz.deleteMany(),
      Question.deleteMany(),
      User.deleteMany(),
      Member.deleteMany(),
      Result.deleteMany()
    ]);

    // ── 1. Admin & student users ───────────────────────────────────────
    const [adminUser, student1, student2, student3] = await User.create([
      { name: 'CSSC Admin',  email: 'admin@cssc.com',  password: 'hashed_admin_pw',  role: 'admin',   department: 'Admin' },
      { name: 'Ganesh B.',   email: 'ganesh@cssc.com', password: 'hashed_pw',        role: 'student', department: 'CSE'   },
      { name: 'Priya S.',    email: 'priya@cssc.com',  password: 'hashed_pw',        role: 'student', department: 'IT'    },
      { name: 'Arjun K.',    email: 'arjun@cssc.com',  password: 'hashed_pw',        role: 'student', department: 'ECE'   }
    ]);
    console.log('✅ Users created.');

    // ── 2. Club Members ────────────────────────────────────────────────
    await Member.create([
      { name: 'Ganesh B.',    department: 'CSE', year: '3rd Year', interest: 'Ethical Hacking',     status: 'Active'  },
      { name: 'Priya S.',     department: 'IT',  year: '2nd Year', interest: 'Network Security',    status: 'Active'  },
      { name: 'Arjun K.',     department: 'ECE', year: '2nd Year', interest: 'Malware Analysis',    status: 'Active'  },
      { name: 'Sneha R.',     department: 'CSE', year: '1st Year', interest: 'Cryptography',        status: 'Pending' },
      { name: 'Mohamed A.',   department: 'IT',  year: '3rd Year', interest: 'Penetration Testing', status: 'Active'  },
      { name: 'Kavitha M.',   department: 'CSE', year: '4th Year', interest: 'Digital Forensics',   status: 'Active'  },
      { name: 'Rajan P.',     department: 'MCA', year: '1st Year', interest: 'Web Security',        status: 'Pending' },
      { name: 'Divya N.',     department: 'IT',  year: '2nd Year', interest: 'Cloud Security',      status: 'Active'  }
    ]);
    console.log('✅ Members created.');

    // ── 3. Quizzes ─────────────────────────────────────────────────────
    const [q1, q2, q3] = await Quiz.create([
      { title: 'Cyber Security Fundamentals', category: 'cybersec', durationMinutes: 8,  status: 'active', description: 'Core cybersecurity concepts and principles.' },
      { title: 'Network Defense Essentials',  category: 'network',  durationMinutes: 6,  status: 'active', description: 'Network security fundamentals and defense strategies.' },
      { title: 'Ethical Hacking Basics',      category: 'ethical',  durationMinutes: 10, status: 'active', description: 'Introduction to ethical hacking and penetration testing.' }
    ]);
    console.log('✅ Quizzes created.');

    // ── 4. Questions ───────────────────────────────────────────────────
    const cyberQs = [
      { questionText: 'What does CIA Triad stand for in cybersecurity?',                options: ['Confidentiality, Integrity, Availability', 'Control, Intelligence, Access', 'Cyber, Internet, Architecture', 'Compliance, Inspection, Audit'],    correctAnswerIndex: 0 },
      { questionText: 'Which attack type floods a server with requests?',               options: ['Phishing', 'SQL Injection', 'DDoS', 'Man-in-the-Middle'],                                                                                           correctAnswerIndex: 2 },
      { questionText: 'What is the primary purpose of a firewall?',                     options: ['Encrypting data', 'Filtering network traffic', 'Storing passwords', 'Detecting malware'],                                                           correctAnswerIndex: 1 },
      { questionText: 'Which is an example of two-factor authentication (2FA)?',        options: ['Password only', 'Password + security question', 'Password + OTP', 'Biometric only'],                                                                correctAnswerIndex: 2 },
      { questionText: 'What does SSL/TLS protect in a web connection?',                 options: ['Server uptime', 'User identity', 'Data in transit', 'Database queries'],                                                                             correctAnswerIndex: 2 },
      { questionText: 'Which type of malware disguises itself as legitimate software?', options: ['Virus', 'Ransomware', 'Worm', 'Trojan'],                                                                                                             correctAnswerIndex: 3 },
      { questionText: 'What is a "zero-day" vulnerability?',                            options: ['A flaw already fixed by vendor', 'A flaw with no existing exploit', 'A flaw unknown to the software vendor', 'A flaw discovered on day zero'],       correctAnswerIndex: 2 },
      { questionText: 'Which protocol is known for secure remote server access?',       options: ['FTP', 'Telnet', 'SSH', 'HTTP'],                                                                                                                       correctAnswerIndex: 2 },
      { questionText: 'What is the goal of phishing attacks?',                          options: ['Crash systems', 'Steal sensitive information', 'Flood networks', 'Encrypt files for ransom'],                                                        correctAnswerIndex: 1 },
      { questionText: 'Which is a strong password practice?',                           options: ['Using your birthdate', 'Using dictionary words', 'Using a mix of letters, numbers, and symbols', 'Reusing the same password'],                       correctAnswerIndex: 2 }
    ];

    const networkQs = [
      { questionText: 'What does a VPN primarily do?',                                  options: ['Speed up internet connections', 'Create a secure, encrypted tunnel', 'Block malware', 'Detect intrusions'],                                          correctAnswerIndex: 1 },
      { questionText: 'What port does HTTPS use by default?',                           options: ['80', '21', '443', '8080'],                                                                                                                            correctAnswerIndex: 2 },
      { questionText: 'What is a DMZ in network security?',                             options: ['A disabled zone', 'A demilitarized network zone', 'A deep monitoring zone', 'A distributed malware zone'],                                           correctAnswerIndex: 1 },
      { questionText: 'Which tool is used for network packet analysis?',                options: ['Metasploit', 'Wireshark', 'Burp Suite', 'Nessus'],                                                                                                    correctAnswerIndex: 1 },
      { questionText: 'What type of attack manipulates ARP tables?',                    options: ['SQL Injection', 'ARP Spoofing', 'XSS', 'CSRF'],                                                                                                      correctAnswerIndex: 1 },
      { questionText: 'What does IDS stand for?',                                       options: ['Internet Defense System', 'Intrusion Detection System', 'Internal Data Security', 'Integrated Defense Shell'],                                       correctAnswerIndex: 1 },
      { questionText: 'Which OSI layer do firewalls commonly operate at?',              options: ['Layer 1', 'Layer 3 (Network)', 'Layer 7 (Application)', 'Both Layer 3 and 7'],                                                                       correctAnswerIndex: 3 },
      { questionText: 'What is the purpose of network segmentation?',                  options: ['Speed improvement', 'Limiting breach spread', 'Reducing IP addresses', 'Encrypting traffic'],                                                         correctAnswerIndex: 1 }
    ];

    const ethicalQs = [
      { questionText: 'What is the first phase of ethical hacking?',                   options: ['Exploitation', 'Scanning', 'Reconnaissance', 'Reporting'],                                                                                            correctAnswerIndex: 2 },
      { questionText: 'What does "penetration testing" aim to do?',                    options: ['Breach a system without permission', 'Find and document vulnerabilities with authorization', 'Install monitoring software', 'Train employees on phishing'], correctAnswerIndex: 1 },
      { questionText: 'Which is a popular penetration testing OS?',                    options: ['Ubuntu', 'Windows Server', 'Kali Linux', 'macOS'],                                                                                                    correctAnswerIndex: 2 },
      { questionText: 'What is Nmap used for?',                                        options: ['Password cracking', 'Network scanning and discovery', 'Malware analysis', 'Log management'],                                                           correctAnswerIndex: 1 },
      { questionText: 'In hacking, what is "footprinting"?',                           options: ['Physically marking a server', 'Gathering public information about a target', 'Logging into a system', 'Scanning for open ports'],                      correctAnswerIndex: 1 },
      { questionText: 'Which attack inserts malicious JavaScript into web pages?',     options: ['SQL Injection', 'CSRF', 'XSS (Cross-Site Scripting)', 'Buffer Overflow'],                                                                              correctAnswerIndex: 2 },
      { questionText: 'What is a "white-hat" hacker?',                                 options: ['Hacker who uses black market tools', 'Malicious hacker for financial gain', 'Authorized hacker who improves security', 'Hacker who works for governments'], correctAnswerIndex: 2 },
      { questionText: 'What does CVE stand for?',                                      options: ['Common Vulnerability Exposure', 'Certified Vulnerability Expert', 'Common Vulnerabilities and Exposures', 'Cyber Vulnerability Engine'],               correctAnswerIndex: 2 },
      { questionText: 'What is a "honeypot" in cybersecurity?',                        options: ['A trap for catching threats', 'A decoy system to attract attackers', 'An encrypted data store', 'A honeybee-inspired algorithm'],                      correctAnswerIndex: 1 },
      { questionText: 'Which phase comes AFTER exploitation in ethical hacking?',      options: ['Scanning', 'Reconnaissance', 'Post-Exploitation / Covering Tracks', 'Initial Access'],                                                                 correctAnswerIndex: 2 }
    ];

    for (const q of cyberQs)   await Question.create({ ...q, quizId: q1._id });
    for (const q of networkQs) await Question.create({ ...q, quizId: q2._id });
    for (const q of ethicalQs) await Question.create({ ...q, quizId: q3._id });
    console.log('✅ Questions created.');

    // ── 5. Sample Results (pre-seeded so admin sees real data) ─────────
    const now = new Date();
    const day1 = new Date(now); day1.setDate(day1.getDate() - 1);
    const day2 = new Date(now); day2.setDate(day2.getDate() - 2);

    await Result.create([
      { userId: student1._id, quizId: q1._id, score: 9,  totalQuestions: 10, timeTaken: 360, violations: 0, autoSubmitted: false, createdAt: now  },
      { userId: student2._id, quizId: q2._id, score: 6,  totalQuestions: 8,  timeTaken: 300, violations: 3, autoSubmitted: true,  createdAt: now  },
      { userId: student3._id, quizId: q3._id, score: 8,  totalQuestions: 10, timeTaken: 480, violations: 1, autoSubmitted: false, createdAt: day1 },
      { userId: student1._id, quizId: q2._id, score: 7,  totalQuestions: 8,  timeTaken: 240, violations: 0, autoSubmitted: false, createdAt: day1 },
      { userId: student2._id, quizId: q3._id, score: 5,  totalQuestions: 10, timeTaken: 520, violations: 2, autoSubmitted: false, createdAt: day2 },
      { userId: student3._id, quizId: q1._id, score: 10, totalQuestions: 10, timeTaken: 400, violations: 0, autoSubmitted: false, createdAt: day2 }
    ]);
    console.log('✅ Sample results created.');

    console.log('🎉 Virtual Database seeding complete!');
  } catch (err) {
    console.error('❌ Seeding Error:', err.message);
    throw err;
  }
};

module.exports = { seedData };
