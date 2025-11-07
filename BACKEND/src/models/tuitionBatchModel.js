const mongoose = require('mongoose');
const { Schema } = mongoose;

const tuitionBatchSchema = new Schema({
  semesterId: {
    type: Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  },
  majorId: {
    type: Schema.Types.ObjectId,
    ref: 'Major',
    required: true
  },
  semesterNo: {
    type: Number,
    required: true
  }, // Kỳ học số mấy (1, 2, 3...)

  // Thông tin đợt thu
  payableFrom: {
    type: Date,
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },

  // Người tạo
  generatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'Account'
  },

  // Thống kê nhanh
  studentCount: {
    type: Number,
    default: 0
  },
  totalAmountGenerated: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// --- ĐÂY LÀ LOGIC CỐT LÕI (THEO YÊU CẦU CỦA BẠN) ---
// Cấm tạo 2 bản ghi có cùng (Kỳ + Ngành + Kỳ số)
tuitionBatchSchema.index({ semesterId: 1, majorId: 1, semesterNo: 1 }, { unique: true });

module.exports = mongoose.model("TuitionBatch", tuitionBatchSchema);