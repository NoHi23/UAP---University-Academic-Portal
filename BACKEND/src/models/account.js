const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'lecture', 'staff', 'admin'],
    default: 'student'
  },
  status: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Account", accountSchema);