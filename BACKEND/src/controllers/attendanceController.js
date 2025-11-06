const Student = require('../models/student');
const Class = require('../models/class');
const Schedule = require('../models/schedule');
const ScheduleOfStudent = require('../models/scheduleOfStudent');
const Grade = require('../models/grade');
const GradeComponent = require('../models/gradeComponent');

// Get attendance status for a student
const getStudentAttendanceStatus = async (req, res) => {
    try {
        // First find the student associated with the logged-in user
        const student = await Student.findOne({ accountId: req.user.id });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin sinh viên'
            });
        }
        const studentId = student._id;
        const classId = req.params.classId;

        // Get total number of scheduled slots for the class
        const totalSlots = await Schedule.countDocuments({ classId });

        if (totalSlots === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    totalSlots: 0,
                    absentSlots: 0,
                    attendanceRate: 100,
                    isFailed: false
                }
            });
        }

        // Get student's attendance record and class details
        // Populate attendance.scheduleId so frontend can display schedule date/slot/subject
        const [attendance, classInfo] = await Promise.all([
            ScheduleOfStudent.findOne({
                studentId,
                classId
            }).populate({
                path: 'attendance.scheduleId',
                model: 'Schedule',
                populate: [
                    { path: 'subjectId', model: 'Subject' },
                    { path: 'roomId' },
                    { path: 'semesterId' }
                ]
            }),
            Class.findById(classId)
        ]);

        if (!attendance || !classInfo) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin điểm danh'
            });
        }

        // Count absent slots
        const absentSlots = attendance.attendance.filter(a => a.status === 'Absent').length;
        const attendanceRate = ((totalSlots - absentSlots) / totalSlots) * 100;
        const isFailed = attendanceRate < 80; // Failed if attendance is less than 80%

        // If attendance is less than 80%, automatically set grade to 0
        if (isFailed) {
            // Find the final grade component for the subject
            const classDetails = await Class.findById(classId).populate('subjectId');
            const finalGradeComponent = await GradeComponent.findOne({
                subjectId: classDetails.subjectId,
                name: 'Final'  // Assuming 'Final' is the name of your final grade component
            });

            if (finalGradeComponent) {
                // Update or create grade record with 0
                await Grade.findOneAndUpdate(
                    {
                        studentId,
                        subjectId: classDetails.subjectId,
                        componentId: finalGradeComponent._id
                    },
                    {
                        score: 0,
                        note: 'Tự động đánh rớt do vắng quá 20% số buổi học'
                    },
                    { upsert: true }
                );
            }
        }

        return res.status(200).json({
            success: true,
            data: {
                totalSlots,
                absentSlots,
                attendanceRate: Math.round(attendanceRate * 100) / 100,
                isFailed,
                attendanceDetails: attendance.attendance,
                className: classInfo.className
            }
        });
    } catch (error) {
        console.error('Error in getStudentAttendanceStatus:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin điểm danh',
            error: error.message
        });
    }
};

// Get attendance status for all students in a class
const getClassAttendanceStatus = async (req, res) => {
    try {
        const classId = req.params.classId;
        const classDetails = await Class.findById(classId).populate('subjectId');

        if (!classDetails) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin lớp học'
            });
        }

        // Get total scheduled slots
        const totalSlots = await Schedule.countDocuments({ classId });

        // Get all students' attendance records
        const attendanceRecords = await ScheduleOfStudent.find({ classId })
            .populate('studentId', 'studentCode firstName lastName');

        const attendanceStats = await Promise.all(attendanceRecords.map(async (record) => {
            const absentSlots = record.attendance.filter(a => a.status === 'Absent').length;
            const attendanceRate = ((totalSlots - absentSlots) / totalSlots) * 100;
            const isFailed = attendanceRate < 80;

            // If attendance is less than 80%, automatically set grade to 0
            if (isFailed) {
                const finalGradeComponent = await GradeComponent.findOne({
                    subjectId: classDetails.subjectId,
                    name: 'Final'
                });

                if (finalGradeComponent) {
                    await Grade.findOneAndUpdate(
                        {
                            studentId: record.studentId._id,
                            subjectId: classDetails.subjectId,
                            componentId: finalGradeComponent._id
                        },
                        {
                            score: 0,
                            note: 'Tự động đánh rớt do vắng quá 20% số buổi học'
                        },
                        { upsert: true }
                    );
                }
            }

            return {
                student: record.studentId,
                totalSlots,
                absentSlots,
                attendanceRate: Math.round(attendanceRate * 100) / 100,
                isFailed,
                lastUpdated: record.updatedAt
            };
        }));

        return res.status(200).json({
            success: true,
            data: {
                class: classDetails,
                totalSlots,
                attendanceStats
            }
        });
    } catch (error) {
        console.error('Error in getClassAttendanceStatus:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin điểm danh của lớp',
            error: error.message
        });
    }
};

module.exports = {
    getStudentAttendanceStatus,
    getClassAttendanceStatus
};