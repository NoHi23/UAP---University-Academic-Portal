const mongoose = require('mongoose');
const { Schema } = mongoose;

const lecturerSchema = new Schema({
  lecturerCode: {
    type: String,
    required: true,
    unique: true
  },
  lecturerAvatar: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
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

module.exports = mongoose.model("Lecturer", lecturerSchema);