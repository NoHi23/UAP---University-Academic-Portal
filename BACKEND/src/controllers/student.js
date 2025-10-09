const Student = require('../models/student');
const Account = require('../models/account');
const ScheduleOfStudent = require('../models/scheduleOfStudent');
const Schedule = require('../models/schedule');
const Class = require('../models/class');
const Subject = require('../models/subject');
const Grade = require('../models/grade');
const GradeSummary = require('../models/gradeSummary');
const CurriculumDetail = require('../models/curriculumDetail');
const Curriculum = require('../models/curriculum');
const bcrypt = require('bcrypt');

// 1. Update Profile
const updateProfile = async (req, res) => {
    try {
        const student = await Student.findOne({ accountId: req.user.id });
        if (!student) return res.status(404).json({ message: 'Student not found' });
        const { firstName, lastName, phone, gender } = req.body;
        student.firstName = firstName || student.firstName;
        student.lastName = lastName || student.lastName;
        student.phone = phone || student.phone;
        if (typeof gender !== 'undefined') student.gender = gender;
        await student.save();
        return res.json({ message: 'Profile updated successfully', student });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// 2. View Timetable
const getTimetable = async (req, res) => {
    try {
        const student = await Student.findOne({ accountId: req.user.id });
        if (!student) return res.status(404).json({ message: 'Student not found' });
        // Lấy weekId từ query nếu có
        const { weekId } = req.query;
        // Tìm các lịch học của sinh viên
        let scheduleOfStudentQuery = { studentId: student._id };
        if (weekId) {
            // Lấy tất cả ScheduleOfStudent, populate scheduleId để filter theo weekId
            const allSchedules = await ScheduleOfStudent.find(scheduleOfStudentQuery).populate({
                path: 'scheduleId',
                populate: [
                    { path: 'classId', model: 'Class', populate: { path: 'subjectId', model: 'Subject' } },
                    { path: 'roomId', model: 'Room' },
                    { path: 'timeSlotId', model: 'TimeSlot' },
                    { path: 'weekId', model: 'Week' },
                    { path: 'semesterId', model: 'Semester' }
                ]
            });
            // Lọc theo weekId
            const filteredSchedules = allSchedules.filter(s => s.scheduleId && s.scheduleId.weekId && s.scheduleId.weekId._id.toString() === weekId);
            return res.json({ timetable: filteredSchedules });
        } else {
            // Không filter theo tuần
            const schedules = await ScheduleOfStudent.find(scheduleOfStudentQuery).populate({
                path: 'scheduleId',
                populate: [
                    { path: 'classId', model: 'Class', populate: { path: 'subjectId', model: 'Subject' } },
                    { path: 'roomId', model: 'Room' },
                    { path: 'timeSlotId', model: 'TimeSlot' },
                    { path: 'weekId', model: 'Week' },
                    { path: 'semesterId', model: 'Semester' }
                ]
            });
            return res.json({ timetable: schedules });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// 3. View Exam Schedule
const getExamSchedule = async (req, res) => {
    try {
        const student = await Student.findOne({ accountId: req.user.id });
        if (!student) return res.status(404).json({ message: 'Student not found' });
        const schedules = await ScheduleOfStudent.find({ studentId: student._id }).populate({
            path: 'scheduleId',
            populate: [
                { path: 'classId', model: 'Class', populate: { path: 'subjectId', model: 'Subject' } },
                { path: 'roomId', model: 'Room' },
                { path: 'timeSlotId', model: 'TimeSlot' },
                { path: 'weekId', model: 'Week' },
                { path: 'semesterId', model: 'Semester' }
            ]
        });
        return res.json({ examSchedule: schedules });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// 4. View Grades Report
const getGradesReport = async (req, res) => {
    try {
        const student = await Student.findOne({ accountId: req.user.id });
        if (!student) return res.status(404).json({ message: 'Student not found' });
        const { semesterNo } = req.query;
        let grades;
        if (semesterNo) {
            // Tìm các môn học thuộc kỳ này
            const gradeSummaries = await GradeSummary.find({ studentId: student._id, semesterNo });
            const gradeIds = gradeSummaries.map(gs => gs.gradeId);
            grades = await Grade.find({ _id: { $in: gradeIds } }).populate('subjectId').populate('componentId');
        } else {
            grades = await Grade.find({ studentId: student._id }).populate('subjectId').populate('componentId');
        }
        return res.json({ grades });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// 5. View Transcript
const getTranscript = async (req, res) => {
    try {
        const student = await Student.findOne({ accountId: req.user.id });
        if (!student) return res.status(404).json({ message: 'Student not found' });
        const curriculumDetails = await CurriculumDetail.find({ curriculumId: student.curriculumId }).populate('subjectId');
        const gradeSummary = await GradeSummary.find({ studentId: student._id }).populate('majorId').populate('gradeId').populate('componentId');
        return res.json({ curriculum: curriculumDetails, transcript: gradeSummary });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


// 6. View Class List (danh sách lớp trong thời khóa biểu)
const getClassList = async (req, res) => {
    try {
        const student = await Student.findOne({ accountId: req.user.id });
        if (!student) return res.status(404).json({ message: 'Student not found' });
        const schedules = await ScheduleOfStudent.find({ studentId: student._id }).populate({
            path: 'scheduleId',
            populate: {
                path: 'classId',
                model: 'Class',
                populate: { path: 'subjectId', model: 'Subject' }
            }
        });
        // Lấy danh sách lớp không trùng lặp
        const classMap = {};
        const classList = [];
        schedules.forEach(sch => {
            const cls = sch.scheduleId.classId;
            if (cls && !classMap[cls._id]) {
                classMap[cls._id] = true;
                classList.push(cls);
            }
        });
        return res.json({ classList });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    updateProfile,
    getTimetable,
    getExamSchedule,
    getGradesReport,
    getTranscript,
    getClassList
};
