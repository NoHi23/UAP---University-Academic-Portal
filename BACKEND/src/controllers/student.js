const Student = require('../models/student');
const Account = require('../models/account');
const Schedule = require('../models/schedule');
const ScheduleOfStudent = require('../models/scheduleOfStudent');
const Class = require('../models/class');
const Subject = require('../models/subject');
const Grade = require('../models/grade');
const GradeSummary = require('../models/gradeSummary');
const CurriculumDetail = require('../models/curriculumDetail');
const Curriculum = require('../models/curriculum');
const Major = require('../models/major');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// 1. Get Profile
const getProfile = async (req, res) => {
    try {
        // populate major so frontend can display majorName/majorCode
        const student = await Student.findOne({ accountId: req.user.id }).populate('majorId', 'majorName majorCode');

        if (!student) {
            return res.status(404).json({
                message: 'Student not found. Vui lòng liên hệ admin để tạo tài khoản sinh viên.'
            });
        }

        return res.json(student);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// 2. Update Profile
const updateProfile = async (req, res) => {
    try {
        // Use findOneAndUpdate so we only validate fields the client sends.
        const student = await Student.findOne({ accountId: req.user.id });
        if (!student) {
            return res.status(404).json({ message: 'Student not found. Vui lòng liên hệ admin để tạo tài khoản sinh viên.' });
        }

        const {
            firstName,
            lastName,
            phone,
            gender,
            citizenID,
            studentAvatar,
            semester,
            semesterNo,
            address,
            dateOfBirth
        } = req.body;

        const updates = {};
        if (firstName) updates.firstName = firstName;
        if (lastName) updates.lastName = lastName;
        if (phone) updates.phone = phone;
        if (typeof gender !== 'undefined') updates.gender = gender;
        if (citizenID) updates.citizenID = citizenID;
        if (address) updates.address = address;
        if (semester) updates.semester = semester;
        if (semesterNo) updates.semesterNo = semesterNo;

        if (dateOfBirth) {
            const parsed = new Date(dateOfBirth);
            if (isNaN(parsed.getTime())) return res.status(400).json({ message: 'dateOfBirth is not a valid date' });
            updates.dateOfBirth = parsed;
        }

        if (studentAvatar) {
            // validate data URI base64 OR http(s) url
            const isDataUri = /^data:image\/(png|jpe?g|gif|webp);base64,/.test(studentAvatar);
            const isUrl = /^https?:\/\//.test(studentAvatar);
            if (!isDataUri && !isUrl) {
                return res.status(400).json({ message: 'studentAvatar phải là data URI base64 (ảnh) hoặc URL hợp lệ' });
            }
            updates.studentAvatar = studentAvatar;
        }

        // Only set fields provided by the client. This avoids triggering schema-level
        // required validations for fields that already exist on the DB but are not
        // being updated by the client.
        const updatedStudent = await Student.findOneAndUpdate(
            { accountId: req.user.id },
            { $set: updates },
            { new: true, runValidators: true }
        );

        return res.json({ message: 'Profile updated successfully', student: updatedStudent });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// 2. View Timetable
const getTimetable = async (req, res) => {
    try {
        const student = await Student.findOne({ accountId: req.user.id });
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // Mock data giống format của lecturer schedule để hiển thị table
        const mockTimetable = [
            {
                id: 1,
                subjectCode: 'PRJ301',
                subjectName: 'Lập trình Java',
                className: 'SE1801',
                room: 'DE-C205',
                time: '2025-10-14T07:30:00',
                endTime: '2025-10-14T09:50:00',
                slot: 1,
                timeRange: '7:30-9:50',
                attendance: false,
                status: 'upcoming'
            },
            {
                id: 2,
                subjectCode: 'DBI202',
                subjectName: 'Cơ sở dữ liệu',
                className: 'SE1801',
                room: 'DE-C301',
                time: '2025-10-15T10:00:00',
                endTime: '2025-10-15T12:20:00',
                slot: 2,
                timeRange: '10:00-12:20',
                attendance: false,
                status: 'upcoming'
            },
            {
                id: 3,
                subjectCode: 'MAD101',
                subjectName: 'Toán rời rạc',
                className: 'SE1801',
                room: 'DE-C401',
                time: '2025-10-16T07:30:00',
                endTime: '2025-10-16T09:50:00',
                slot: 1,
                timeRange: '7:30-9:50',
                attendance: true,
                status: 'completed'
            },
            {
                id: 4,
                subjectCode: 'ENG101',
                subjectName: 'Tiếng Anh chuyên ngành',
                className: 'SE1801',
                room: 'DE-C501',
                time: '2025-10-17T15:20:00',
                endTime: '2025-10-17T17:40:00',
                slot: 4,
                timeRange: '15:20-17:40',
                attendance: false,
                status: 'absent'
            },
            {
                id: 5,
                subjectCode: 'WEB501',
                subjectName: 'Phát triển Web',
                className: 'SE1801',
                room: 'AL-R303',
                time: '2025-10-18T10:50:00',
                endTime: '2025-10-18T12:20:00',
                slot: 3,
                timeRange: '10:50-12:20',
                attendance: false,
                status: 'upcoming'
            },
            {
                id: 6,
                subjectCode: 'PRO192',
                subjectName: 'Lập trình hướng đối tượng',
                className: 'SE1801',
                room: 'DE-C222',
                time: '2025-10-16T15:20:00',
                endTime: '2025-10-16T17:40:00',
                slot: 4,
                timeRange: '15:20-17:40',
                attendance: false,
                status: 'upcoming'
            }
        ];

        return res.json({
            timetable: mockTimetable,
            message: "Thời khóa biểu sinh viên"
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// 3. View Exam Schedule
const getExamSchedule = async (req, res) => {
    try {
        const student = await Student.findOne({ accountId: req.user.id });
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // ScheduleOfStudent stores schedule references inside attendance[].scheduleId
        // Collect all scheduleIds across the student's enrolled classes
        const sosDocs = await ScheduleOfStudent.find({ studentId: student._id });
        const scheduleIds = [];
        sosDocs.forEach(doc => {
            if (Array.isArray(doc.attendance)) {
                doc.attendance.forEach(a => {
                    if (a && a.scheduleId) scheduleIds.push(a.scheduleId);
                });
            }
        });

        if (scheduleIds.length === 0) {
            return res.json({ examSchedule: [] });
        }

        // Query Schedule documents directly and populate related refs
        const schedules = await Schedule.find({ _id: { $in: scheduleIds } })
            .populate({ path: 'classId', populate: { path: 'subjectId', model: 'Subject' } })
            .populate('roomId')
            .populate('timeSlotId')
            .populate('weekId')
            .populate('semesterId')
            .sort({ date: 1, slot: 1 });

        // Return populated schedules directly (frontend accepts either a populated Schedule
        // document or an object with scheduleId populated). Returning the populated
        // Schedule documents keeps the response flexible for the UI.
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
const getMyWeeklySchedule = async (req, res) => {
    try {
        const student = await Student.findOne({ accountId: req.user.id });
        if (!student) {
            return res.status(404).json({ message: "Không tìm thấy thông tin sinh viên." });
        }

        const targetDate = req.query.date ? new Date(req.query.date) : new Date();

        const dayOfWeek = targetDate.getDay();
        const firstDay = new Date(targetDate);
        firstDay.setDate(targetDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
        const lastDay = new Date(firstDay);
        lastDay.setDate(firstDay.getDate() + 6);

        firstDay.setHours(0, 0, 0, 0);
        lastDay.setHours(23, 59, 59, 999);

        const studentEnrollments = await ScheduleOfStudent.find({ studentId: student._id });
        if (!studentEnrollments || studentEnrollments.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        const enrolledClassIds = studentEnrollments.map(e => e.classId);

        const schedules = await Schedule.find({
            classId: { $in: enrolledClassIds },
            date: { $gte: firstDay, $lte: lastDay }
        })
            .populate('subjectId', 'subjectName subjectCode')
            .populate('lecturerId', 'firstName lastName email lecturerCode')
            .populate('roomId', 'roomName')
            .populate('classId', 'className')
            .sort({ date: 1, slot: 1 })
            .lean();

        const schedulesWithAttendance = schedules.map(schedule => {
            const enrollmentForThisClass = studentEnrollments.find(e => e.classId.equals(schedule.classId._id));

            let attendanceStatus = 'Not Yet';
            if (enrollmentForThisClass) {
                const attendanceRecord = enrollmentForThisClass.attendance.find(att =>
                    att.scheduleId && att.scheduleId.equals(schedule._id)
                );
                if (attendanceRecord) {
                    attendanceStatus = attendanceRecord.status;
                }
            }

            return {
                ...schedule,
                attendanceStatus: attendanceStatus
            };
        });
        res.status(200).json({ success: true, data: schedulesWithAttendance });

    } catch (error) {
        console.error("Lỗi khi lấy lịch học của sinh viên:", error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

const getMyClassmates = async (req, res) => {
    try {
        const { classId } = req.params;
        const student = await Student.findOne({ accountId: req.user.id });
        if (!student) return res.status(404).json({ message: "Không tìm thấy sinh viên." });

        const targetClass = await Class.findById(classId).select('className');
        if (!targetClass) {
            return res.status(404).json({ message: "Không tìm thấy lớp học này." });
        }

        const isEnrolled = await ScheduleOfStudent.exists({ studentId: student._id, classId: classId });
        if (!isEnrolled) {
            return res.status(403).json({ message: "Bạn không thuộc lớp học này." });
        }

        const enrollments = await ScheduleOfStudent.find({ classId: classId })
            .populate({
                path: 'studentId',
                select: 'studentCode firstName lastName studentAvatar'
            });

        const students = enrollments.map(e => e.studentId);

        res.status(200).json({
            success: true,
            count: students.length,
            data: students,
            className: targetClass.className
        });

    } catch (error) {
        console.error("Lỗi khi lấy danh sách bạn học:", error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

// 7. Attendance summary grouped by semester
const getAttendanceSummary = async (req, res) => {
    try {
        const student = await Student.findOne({ accountId: req.user.id });
        if (!student) return res.status(404).json({ message: 'Student not found' });

        // Find all ScheduleOfStudent records for this student
        const enrollments = await ScheduleOfStudent.find({ studentId: student._id }).lean();

        // Collect all scheduleIds referenced in attendance arrays
        const scheduleIds = [];
        enrollments.forEach(en => {
            if (Array.isArray(en.attendance)) {
                en.attendance.forEach(a => {
                    if (a && a.scheduleId) scheduleIds.push(a.scheduleId);
                });
            }
        });

        if (scheduleIds.length === 0) {
            return res.json({ success: true, data: [] });
        }

        // Load schedules with semester and subject population
        const schedules = await Schedule.find({ _id: { $in: scheduleIds } })
            .populate('semesterId', 'semesterName startDate endDate')
            .populate('subjectId', 'subjectName subjectCode')
            .populate('classId', 'className')
            .lean();

        const scheduleMap = {};
        schedules.forEach(s => { scheduleMap[String(s._id)] = s; });

        // Aggregate by semester -> subject
        const semesters = {}; // semesterId -> { semesterInfo, subjects: { subjectId -> stats } }

        enrollments.forEach(en => {
            const classId = en.classId;
            if (!Array.isArray(en.attendance)) return;
            en.attendance.forEach(a => {
                if (!a || !a.scheduleId) return;
                const sch = scheduleMap[String(a.scheduleId)];
                if (!sch) return; // schedule may have been removed

                const sem = sch.semesterId ? sch.semesterId._id : 'unknown';
                const semLabel = sch.semesterId || null;
                const subj = sch.subjectId ? sch.subjectId._id : 'unknown';

                if (!semesters[sem]) semesters[sem] = { semester: semLabel, subjects: {} };
                if (!semesters[sem].subjects[subj]) {
                    semesters[sem].subjects[subj] = {
                        subjectId: sch.subjectId || null,
                        subjectName: sch.subjectId ? (sch.subjectId.subjectName || '') : '',
                        subjectCode: sch.subjectId ? (sch.subjectId.subjectCode || '') : '',
                        classId: sch.classId ? sch.classId._id : classId || null,
                        className: sch.classId ? sch.classId.className : '',
                        totalSlots: 0,
                        absentSlots: 0
                    };
                }

                const stat = semesters[sem].subjects[subj];
                stat.totalSlots += 1;
                if (a.status === 'Absent') stat.absentSlots += 1;
            });
        });

        // Build response array
        const result = Object.keys(semesters).map(semKey => {
            const semObj = semesters[semKey];
            const subjects = Object.keys(semObj.subjects).map(subKey => {
                const s = semObj.subjects[subKey];
                const attendanceRate = s.totalSlots > 0 ? ((s.totalSlots - s.absentSlots) / s.totalSlots) * 100 : 100;
                return {
                    subjectId: s.subjectId,
                    subjectName: s.subjectName,
                    subjectCode: s.subjectCode,
                    classId: s.classId,
                    className: s.className,
                    totalSlots: s.totalSlots,
                    absentSlots: s.absentSlots,
                    attendanceRate: Math.round(attendanceRate * 100) / 100,
                    isFailed: attendanceRate < 80
                };
            });

            return {
                semester: semObj.semester,
                subjects
            };
        });

        // Sort semesters by startDate if available
        result.sort((a, b) => {
            const aa = a.semester && a.semester.startDate ? new Date(a.semester.startDate) : new Date(0);
            const bb = b.semester && b.semester.startDate ? new Date(b.semester.startDate) : new Date(0);
            return aa - bb;
        });

        return res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error in getAttendanceSummary:', error);
        return res.status(500).json({ success: false, message: 'Lỗi khi lấy tổng hợp điểm danh', error: error.message });
    }
};
module.exports = {
    getProfile,
    updateProfile,
    getTimetable,
    getExamSchedule,
    getGradesReport,
    getTranscript,
    getClassList,
    getMyWeeklySchedule,
    getMyClassmates,
    getAttendanceSummary
};
