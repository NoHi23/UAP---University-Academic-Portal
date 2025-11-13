const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AbsenceRequestSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  semesterId: { type: mongoose.Schema.Types.ObjectId, ref: "Semester" },
  reason: String,
  attachments: [String], 
  status: { type: String, default: "pending" },
}, { timestamps: true });


module.exports = mongoose.model("AbsenceRequest", AbsenceRequestSchema);
