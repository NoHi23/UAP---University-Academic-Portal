const mongoose = require("mongoose");

const examScheduleSchema = new mongoose.Schema(
  {
    courseName: { type: String, required: true },
    examDate: { type: Date, required: true },
    time: { type: String, required: true }, // giờ thi, ví dụ: "08:30"
    room: { type: String, required: true },
    note: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExamSchedule", examScheduleSchema);
