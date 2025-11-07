const mongoose = require('mongoose');
const { Schema } = mongoose;

const tuitionFeeSchema = new Schema({
    studentId: {
        type: Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
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
    // ID của đợt thu (để nhóm các khoản thu)
    batchId: {
        type: Schema.Types.ObjectId,
        ref: 'TuitionBatch',
        required: true
    },

    amount: {
        type: Number,
        required: true
    },
    amountPaid: {
        type: Number,
        default: 0
    },

    status: {
        type: String,
        enum: ['unpaid', 'paid', 'overdue'], // 'overdue' (quá hạn)
        default: 'unpaid'
    },

    // Yêu cầu về thời gian của bạn
    payableFrom: {
        type: Date,
        required: true
    }, // Được thanh toán từ ngày
    deadline: {
        type: Date,
        required: true
    },    // Hạn chót

    // Yêu cầu "ẩn lớp" của bạn
    isClassHidden: {
        type: Boolean,
        default: false
    },

    // Yêu cầu "gửi nhắc nhở" của bạn
    reminderHistory: [{
        message: String,
        sentAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

tuitionFeeSchema.index({ studentId: 1, semesterId: 1 });
tuitionFeeSchema.index({ batchId: 1 });

module.exports = mongoose.model("TuitionFee", tuitionFeeSchema);