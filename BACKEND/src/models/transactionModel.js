const mongoose = require('mongoose');
const { Schema } = mongoose;

const transactionSchema = new Schema({
    studentId: {
        type: Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    feeId: { // Khoản phí mà giao dịch này đang thanh toán
        type: Schema.Types.ObjectId,
        ref: 'TuitionFee',
        required: true
    },
    // Mã đơn hàng (orderId) chúng ta tự tạo, duy nhất
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Success', 'Failed'],
        default: 'Pending'
    },
    paymentMethod: {
        type: String,
        default: 'VNPAY'
    },
    transactionCode: {
        type: String
    },
    paymentResponse: {
        type: Schema.Types.Mixed
    }
}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);