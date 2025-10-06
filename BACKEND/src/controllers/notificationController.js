const SlotNotification = require('../models/slotNotificationModel');
const ScheduleOfStudent = require('../models/scheduleOfStudent');
const Student = require('../models/student');
const Schedule = require('../models/schedule');

const getMySlotNotifications = async (req, res) => {
    try {
        const student = await Student.findOne({ accountId: req.user.id });
        if (!student) {
            return res.status(404).json({ message: 'Không tìm thấy sinh viên.' });
        }

        const studentSchedules = await ScheduleOfStudent.find({ studentId: student._id });
        const scheduleIds = studentSchedules.map(s => s.scheduleId);

        const notifications = await SlotNotification.find({ scheduleId: { $in: scheduleIds } })
            .populate({
                path: 'scheduleId',
                select: 'classId subjectId timeSlotId weekId',
                populate: [ 
                    { path: 'classId', select: 'className' },
                    { path: 'subjectId', select: 'subjectName subjectCode' },
                    { path: 'timeSlotId', select: 'slot startDate endDate' },
                    { path: 'weekId', select: 'startDate endDate' }
                ]
            })
            .populate('senderId', 'email role') 
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: notifications.length, data: notifications });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi máy chủ', error: error.message });
    }
};


const createSlotNotification = async (req, res) => {
    try {
        const { scheduleId, title, content } = req.body;
        const senderId = req.user.id; 

        const schedule = await Schedule.findById(scheduleId);
        if (!schedule) {
            return res.status(404).json({ message: 'Lịch học này không tồn tại.' });
        }

        const notification = await SlotNotification.create({
            scheduleId,
            title,
            content,
            senderId
        });
        
        res.status(201).json({ success: true, message: "Tạo thông báo thành công.", data: notification });

    } catch (error) {
        res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', error: error.message });
    }
};

module.exports = {
    getMySlotNotifications,
    createSlotNotification
};