const mongoose = require('mongoose');
const { Schema } = mongoose;

const staffSchema = new Schema({
  staffCode: {
    type: String,
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: true
  },
  gender: {
    type: Boolean,
    default: true // true = Nam, false = Nữ
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: false
  },
  staffAvatar: {
    type: String,
    required: false,
    validate: {
      validator(v) {
        if (!v) return true;
        return /^data:image\/(png|jpe?g|gif|webp);base64,/.test(v) || /^https?:\/\//.test(v);
      },
      message: 'Avatar phải là base64 hoặc URL hợp lệ.'
    }
  },
  accountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
    unique: true
  },
  status: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Staff", staffSchema);
