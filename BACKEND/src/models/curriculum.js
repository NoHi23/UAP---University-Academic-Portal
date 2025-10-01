const mongoose = require('mongoose');
const { Schema } = mongoose;

const curriculumSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true 
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'], 
    default: 'active'
  },
  majorId: {
    type: Schema.Types.ObjectId,
    ref: 'Major',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Curriculum", curriculumSchema);