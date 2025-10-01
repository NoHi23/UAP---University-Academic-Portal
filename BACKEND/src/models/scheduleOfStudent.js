const mongoose =require('mongoose');
const { Schema } = mongoose;

const scheduleOfStudentSchema = new Schema({
  attendance: {
    type: Boolean,
    default: false 
  },
  scheduleId: {
    type: Schema.Types.ObjectId,
    ref: 'Schedule', 
    required: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student', 
    required: true
  }
}, {
  timestamps: true
});

scheduleOfStudentSchema.index({ scheduleId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("ScheduleOfStudent", scheduleOfStudentSchema);