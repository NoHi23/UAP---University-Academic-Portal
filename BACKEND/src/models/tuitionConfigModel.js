const mongoose = require('mongoose');
const { Schema } = mongoose;

const tuitionConfigSchema = new Schema({
  majorId: {
    type: Schema.Types.ObjectId,
    ref: 'Major',
    required: true
  },
  semesterNo: {
    type: Number,
    required: true
  }, // Kỳ học số mấy (1, 2, 3...)
  baseAmount: {
    type: Number,
    required: true
  }  // Mức phí (ví dụ: 15000000)
}, { timestamps: true });

// Đảm bảo không có 2 mức phí cho cùng 1 chuyên ngành/kỳ
tuitionConfigSchema.index({ majorId: 1, semesterNo: 1 }, { unique: true });

module.exports = mongoose.model("TuitionConfig", tuitionConfigSchema);