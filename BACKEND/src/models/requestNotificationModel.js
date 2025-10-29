const mongoose = require('mongoose');
const { Schema } = mongoose;

const requestNotificationSchema = new Schema({
    requestId: { type: Schema.Types.ObjectId, ref: 'Request', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('RequestNotification', requestNotificationSchema);
