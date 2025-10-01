const mongoose = require('mongoose');
const { Schema } = mongoose;

const curriculumDetailSchema = new Schema({
  cdSemester: {
    type: String,
    required: true,
    trim: true
  },
  subjectId: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  curriculumId: {
    type: Schema.Types.ObjectId,
    ref: 'Curriculum', 
    required: true
  }
}, {
  timestamps: true
});

curriculumDetailSchema.index({ curriculumId: 1, subjectId: 1 }, { unique: true });


module.exports = mongoose.model("CurriculumDetail", curriculumDetailSchema);