const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
    // Lưu ý: Luôn mã hóa (hash) mật khẩu trước khi lưu vào DB!
  },
  address: {
    type: String
  },
  phone: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: 'default_avatar_url.jpg'
  },
  role: {
    type: String,
    enum: ['student','lecture', 'staff', 'admin'],
    default: 'student'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("User", userSchema);