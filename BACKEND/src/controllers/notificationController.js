const SlotNotification = require('../models/slotNotificationModel');
const Student = require('../models/student');
const Schedule = require('../models/schedule');
<<<<<<< HEAD
const ScheduleOfStudent = require('../models/scheduleOfStudent');
const RequestNotification = require('../models/requestNotificationModel');
const Request = require('../models/requestModel');
const Lecturer = require('../models/lecturer');
=======
const Account = require('../models/account');
>>>>>>> origin/hieunn-dev

    
const getMySlotNotifications = async (req, res) => {
    try {
        const student = await Student.findOne({ accountId: req.user.id });
        if (!student) {
            return res.status(404).json({ message: 'Không tìm thấy sinh viên.' });
        }
<<<<<<< HEAD
        // ScheduleOfStudent stores schedule references inside attendance[].scheduleId
        const sosDocs = await ScheduleOfStudent.find({ studentId: student._id });
        const scheduleIds = [];
        sosDocs.forEach(doc => {
            if (Array.isArray(doc.attendance)) {
                doc.attendance.forEach(a => {
                    if (a && a.scheduleId) scheduleIds.push(a.scheduleId);
                });
            }
        });
=======

        const enrollments = await ScheduleOfStudent.find({ studentId: student._id }).select('classId');
        if (!enrollments || enrollments.length === 0) {
            return res.status(200).json({ success: true, count: 0, data: [] }); 
        }
        const enrolledClassIds = enrollments.map(e => e.classId);

        const schedules = await Schedule.find({ classId: { $in: enrolledClassIds } }).select('_id');
        const scheduleIds = schedules.map(s => s._id);
>>>>>>> origin/hieunn-dev

        const notifications = await SlotNotification.find({ scheduleId: { $in: scheduleIds } })
            .populate({
                path: 'scheduleId',
                select: 'classId subjectId date slot',
                populate: [
                    { path: 'classId', select: 'className' },
                    { path: 'subjectId', select: 'subjectName subjectCode' },
                ]
            })
            .populate('senderId', 'email role')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: notifications.length, data: notifications });

    } catch (error) {
        console.error("Lỗi khi lấy thông báo slot:", error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ', error: error.message });
    }
};

// Lecturer: get slot notifications for schedules the lecturer teaches
const getMySlotNotificationsForLecturer = async (req, res) => {
    try {
<<<<<<< HEAD
        const lecturer = await Lecturer.findOne({ accountId: req.user.id });
        if (!lecturer) return res.status(404).json({ message: 'Không tìm thấy giảng viên.' });

        const schedules = await Schedule.find({ lecturerId: lecturer._id }).select('_id');
        const scheduleIds = schedules.map(s => s._id);

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
=======
        const { scheduleId } = req.params;
        const accountId = req.user.id; 

        const schedule = await Schedule.findById(scheduleId).select('classId').lean();
        if (!schedule) {
            return res.status(404).json({ message: 'Không tìm thấy buổi học.' });
        }
        

        const notifications = await SlotNotification.find({ scheduleId: scheduleId })
            .populate('senderId', 'email')
>>>>>>> origin/hieunn-dev
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, count: notifications.length, data: notifications });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ', error: error.message });
    }
};

<<<<<<< HEAD
// export lecturer helper


=======
>>>>>>> origin/hieunn-dev
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

// Get notifications for a specific schedule (used by student route)
const getNotificationsForSlot = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        if (!scheduleId) return res.status(400).json({ message: 'scheduleId is required' });

        const schedule = await Schedule.findById(scheduleId);
        if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

        const notifications = await SlotNotification.find({ scheduleId })
            .populate('senderId', 'email role')
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, count: notifications.length, data: notifications });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Get request/response-style notifications for the logged-in student
const getMyRequestNotifications = async (req, res) => {
    try {
        const student = await Student.findOne({ accountId: req.user.id });
        if (!student) return res.status(404).json({ message: 'Không tìm thấy sinh viên.' });

        const notifications = await RequestNotification.find({ studentId: student._id })
            .populate({ path: 'requestId', select: 'title requestType status response' })
            .populate('senderId', 'email role')
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, count: notifications.length, data: notifications });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ', error: error.message });
    }
};

// Get all notifications relevant to the logged-in student (slot notifications + request notifications)
const getAllNotifications = async (req, res) => {
    try {
        const student = await Student.findOne({ accountId: req.user.id });
        if (!student) return res.status(404).json({ message: 'Không tìm thấy sinh viên.' });

        // Slot notifications
        const sosDocs = await ScheduleOfStudent.find({ studentId: student._id });
        const scheduleIds = [];
        sosDocs.forEach(doc => {
            if (Array.isArray(doc.attendance)) {
                doc.attendance.forEach(a => {
                    if (a && a.scheduleId) scheduleIds.push(a.scheduleId);
                });
            }
        });

        // Populate slot notifications the same way lecturer endpoint does so the shape is consistent
        const slotNotifs = await SlotNotification.find({ scheduleId: { $in: scheduleIds } })
            .populate('senderId', 'email role')
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
            .sort({ createdAt: -1 })
            .lean();

        // Request notifications
        const requestNotifs = await RequestNotification.find({ studentId: student._id })
            .populate('senderId', 'email role')
            .populate({ path: 'requestId', select: 'title requestType status response' })
            .sort({ createdAt: -1 })
            .lean();

        // Normalize and merge
        const normalizedSlot = slotNotifs.map(n => ({
            _id: n._id,
            type: 'slot',
            title: n.title,
            content: n.content,
            sender: n.senderId,
            schedule: n.scheduleId,
            createdAt: n.createdAt
        }));

        const normalizedRequest = requestNotifs.map(n => ({
            _id: n._id,
            type: 'request',
            title: n.title,
            content: n.content,
            sender: n.senderId,
            request: n.requestId,
            createdAt: n.createdAt
        }));

        const merged = [...normalizedSlot, ...normalizedRequest].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return res.status(200).json({ success: true, count: merged.length, data: merged });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ', error: error.message });
    }
};

// export all handlers
module.exports = {
    getMySlotNotifications,
    getNotificationsForSlot,
    createSlotNotification,
    getMyRequestNotifications,
    getAllNotifications,
    getMySlotNotificationsForLecturer
};