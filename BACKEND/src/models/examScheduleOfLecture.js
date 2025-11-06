const mongoose = require("mongoose");

const examScheduleOfLectureSchema = new mongoose.Schema(
  {
    examSchedule: { type: mongoose.Schema.Types.ObjectId, ref: "ExamSchedule", required: true },
    lecturer: { type: mongoose.Schema.Types.ObjectId, ref: "Lecturer", required: true },
    duty: { type: String, enum: ["supervisor", "assistant"], default: "supervisor" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExamScheduleOfLecture", examScheduleOfLectureSchema);
