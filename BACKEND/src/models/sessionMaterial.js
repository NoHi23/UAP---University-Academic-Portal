const mongoose = require('mongoose');
const { Schema } = mongoose;

const sessionMaterialSchema = new Schema({
  topic: {
    type: String,
    required: true,
    trim: true
  },
  learningTeachingType: {
    type: String 
  },
  itu: {
    type: Number
  },
  studentMaterial: {
    type: Boolean,
    default: true
  },
  downloadable: {
    type: Boolean,
    default: false
  },
  studentTask: {
    type: String
  },
  urls: {
    type: [String] 
  },
  cloId: {
    type: Schema.Types.ObjectId,
    ref: 'CLO', 
    required: true
  },
  subjectId: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("SessionMaterial", sessionMaterialSchema);