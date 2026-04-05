const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  department: { type: String, default: 'General' },
  year:       { type: String, default: '1st Year' },
  interest:   { type: String, default: 'General Security' },
  status:     { type: String, enum: ['Active', 'Pending', 'Inactive'], default: 'Active' },
  email:      { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Member', MemberSchema);
