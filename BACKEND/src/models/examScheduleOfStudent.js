const mongoose = require("mongoose");

const examScheduleOfStudentSchema = new mongoose.Schema(
  {
    examSchedule: { type: mongoose.Schema.Types.ObjectId, ref: "ExamSchedule", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    attendStatus: { type: String, enum: ["pending", "attended", "absent"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExamScheduleOfStudent", examScheduleOfStudentSchema);
