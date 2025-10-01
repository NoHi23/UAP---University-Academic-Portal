const mongoose = require('mongoose');
const { Schema } = mongoose;

const scheduleSchema = new Schema({
  semesterId: {
    type: Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  },
  subjectId: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  classId: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  timeSlotId: {
    type: Schema.Types.ObjectId,
    ref: 'TimeSlot', 
    required: true
  },
  weekId: {
    type: Schema.Types.ObjectId,
    ref: 'Week',
    required: true
  },
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  lecturerId: { 
    type: Schema.Types.ObjectId,
    ref: 'Lecturer',
    required: true
  }
}, {
  timestamps: true
});

// Đảm bảo một phòng học không thể có 2 lớp khác nhau trong cùng một kíp giờ, cùng 1 tuần
scheduleSchema.index({ timeSlotId: 1, weekId: 1, roomId: 1 }, { unique: true });

// Đảm bảo một giảng viên không thể dạy 2 lớp khác nhau trong cùng một kíp giờ, cùng 1 tuần
scheduleSchema.index({ timeSlotId: 1, weekId: 1, lecturerId: 1 }, { unique: true });

// Đảm bảo một lớp học không thể học 2 môn khác nhau trong cùng một kíp giờ, cùng 1 tuần
scheduleSchema.index({ timeSlotId: 1, weekId: 1, classId: 1 }, { unique: true });


module.exports = mongoose.model("Schedule", scheduleSchema);