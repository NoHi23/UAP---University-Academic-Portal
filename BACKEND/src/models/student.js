const mongoose = require('mongoose');
const { Schema } = mongoose;

const studentSchema = new Schema({
  studentCode: {
    type: String,
    required: true,
    unique: true
  },
  studentAvatar: {
    type: String,
    required: true,
    validate: {
      validator(v) {
        // chấp nhận data URI ảnh base64
        return /^data:image\/(png|jpe?g|gif|webp);base64,/.test(v);
      },
      message: 'studentAvatar phải là data URI base64 của ảnh'
    }
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  citizenID: {
    type: Number,
    required: true
  },
  gender: {
    type: Boolean,
    default: true
  },
  phone: {
    type: String,
    required: true
  },
  semester: {
    type: String
  },
  semesterNo: {
    type: Number
  },
  curriculumId: {
    type: Schema.Types.ObjectId,
    ref: 'Curriculum',
    required: true
  },
  accountId: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
    unique: true
  },
  majorId: {
    type: Schema.Types.ObjectId,
    ref: 'Major',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Student", studentSchema);