const Student = require('../models/student');
const Subject = require('../models/subject');
const Class = require('../models/class');
const Curriculum = require('../models/curriculum');
const CurriculumDetail = require('../models/curriculumDetail');
const Lecturer = require('../models/lecturer');
const Room = require('../models/room');
const Schedule = require('../models/schedule');
const ScheduleOfStudent = require('../models/scheduleOfStudent');
const ScheduleOfLecture = require('../models/scheduleOfLecture');
const Grade = require('../models/grade');
const Semester = require('../models/semester');
const GradeSummary = require('../models/gradeSummary')
const GradeComponent = require('../models/gradeComponent')

// Get student schedule
const getStudentSchedule = async (req, res) => {
    try {
        // Find student by accountId
        const student = await Student.findOne({ accountId: req.user.id });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin sinh viên'
            });
        }

        // Get all class schedules of student
        const studentSchedules = await ScheduleOfStudent.find({ studentId: student._id })
            .populate({
                path: 'classId',
                select: 'className',
                populate: {
                    path: 'subjectId',
                    select: 'subjectCode subjectName'
                }
            })
            .populate({
                path: 'attendance.scheduleId',
                populate: [
                    { path: 'roomId', select: 'roomCode' },
                    { path: 'lecturerId', select: 'firstName lastName' }
                ]
            });

        const formattedSchedules = studentSchedules.map(schedule => ({
            classId: schedule.classId._id,
            className: schedule.classId.className,
            subjectCode: schedule.classId.subjectId.subjectCode,
            subjectName: schedule.classId.subjectId.subjectName,
            schedules: schedule.attendance
                .filter(att => att.scheduleId) // Filter out null scheduleIds
                .map(att => ({
                    id: att.scheduleId._id,
                    date: att.scheduleId.date,
                    slot: att.scheduleId.slot,
                    room: att.scheduleId.roomId.roomCode,
                    lecturer: `${att.scheduleId.lecturerId.firstName} ${att.scheduleId.lecturerId.lastName}`,
                    status: att.status,
                    note: att.note || ''
                }))
        }));

        return res.status(200).json({
            success: true,
            data: formattedSchedules
        });
    } catch (error) {
        console.error('Error in getStudentSchedule:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin lịch học',
            error: error.message
        });
    }
};

// Get class attendance for all students
const getClassAttendance = async (req, res) => {
    try {
        const classId = req.params.classId;

        // Get class information
        const classInfo = await Class.findById(classId)
            .populate('subjectId', 'subjectCode subjectName')
            .populate('lecturerId', 'firstName lastName');

        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin lớp học'
            });
        }

        // Get all students' attendance records
        const studentsAttendance = await ScheduleOfStudent.find({ classId })
            .populate('studentId', 'studentCode firstName lastName')
            .populate('attendance.scheduleId');

        if (!studentsAttendance || studentsAttendance.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin điểm danh'
            });
        }

        // Format data
        const formattedData = {
            className: classInfo.className,
            subjectCode: classInfo.subjectId.subjectCode,
            subjectName: classInfo.subjectId.subjectName,
            lecturer: `${classInfo.lecturerId.firstName} ${classInfo.lecturerId.lastName}`,
            students: studentsAttendance.map(record => ({
                id: record.studentId._id,
                studentCode: record.studentId.studentCode,
                fullName: `${record.studentId.firstName} ${record.studentId.lastName}`,
                attendance: record.attendance.map(att => ({
                    scheduleId: att.scheduleId._id,
                    date: att.scheduleId.date,
                    slot: att.scheduleId.slot,
                    status: att.status,
                    note: att.note || ''
                }))
            }))
        };

        return res.status(200).json({
            success: true,
            data: formattedData
        });
    } catch (error) {
        console.error('Error in getClassAttendance:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin điểm danh',
            error: error.message
        });
    }
};
const slotTimes = [
    { slot: 1, startTime: '07:30', endTime: '09:50' }, { slot: 2, startTime: '10:00', endTime: '12:20' },
    { slot: 3, startTime: '12:50', endTime: '15:10' }, { slot: 4, startTime: '15:20', endTime: '17:40' },
    { slot: 5, startTime: '18:00', endTime: '20:20' }, { slot: 6, startTime: '20:30', endTime: '22:50' }
];

const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
};

const checkPrerequisites = async (studentId, targetSemester, curriculumId) => {
    if (targetSemester <= 1) return true;
    const previousSemester = targetSemester - 1;

    const prevSemesterSubjects = await CurriculumDetail.find({
        curriculumId,
        semester: previousSemester
    }).select('subjectId');

    if (prevSemesterSubjects.length === 0) return true;

    const prevSubjectIds = prevSemesterSubjects.map(s => s.subjectId);

    for (const subjectId of prevSubjectIds) {
        const gradesForSubject = await Grade.find({ studentId, subjectId }).populate('componentId');
        const componentsForSubject = await GradeComponent.find({ subjectId });

        if (gradesForSubject.length === 0 || componentsForSubject.length === 0) {
            console.log(`[DEBUG] Sinh viên ${studentId} thiếu điểm hoặc cấu hình cho môn ${subjectId}`);
            return false;
        }

        let totalScore = 0;
        let totalWeight = 0;
        componentsForSubject.forEach(component => {
            const grade = gradesForSubject.find(g => g.componentId && g.componentId._id.equals(component._id));
            if (grade && component.weightPercentage != null) {
                totalScore += grade.score * (component.weightPercentage / 100);
                totalWeight += (component.weightPercentage / 100);
            }
        });

        const finalScore = (totalWeight > 0) ? (totalScore / totalWeight) : 0;
        if (finalScore < 4) {
            console.log(`[DEBUG] Sinh viên ${studentId} trượt môn ${subjectId} (Điểm: ${finalScore.toFixed(2)})`);
            return false;
        }
    }
    return true;
};

const findAvailableCombination = (date, slot, students, lecturers, rooms, conflictSet) => {
    for (const lecturer of lecturers) {
        for (const room of rooms) {
            const dateStr = date.toISOString().split('T')[0];
            const lecturerConflictKey = `${lecturer._id}-${dateStr}-${slot}`;
            const roomConflictKey = `${room._id}-${dateStr}-${slot}`;

            if (conflictSet.has(lecturerConflictKey) || conflictSet.has(roomConflictKey)) continue;

            let studentConflict = false;
            for (const student of students) {
                if (conflictSet.has(`${student._id}-${dateStr}-${slot}`)) {
                    studentConflict = true;
                    break;
                }
            }
            if (!studentConflict) {
                return { date, slot, lecturerId: lecturer._id, roomId: room._id };
            }
        }
    }
    return null;
};

// --- HÀM HELPER: TÌM SLOT HỌC HỢP LỆ (ĐÃ SỬA LỖI LOGIC) ---
const findValidScheduleSlot = (students, lecturers, rooms, conflictSet, semesterStartDate, scheduledSlotsForThisClass, startDayOffset = 0) => {
    const startDate = new Date(semesterStartDate);
    
    for (let i = 0; i < 15 * 7; i++) {
        const dayOffset = (i + startDayOffset) % (15 * 7); 
        
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + dayOffset);

        const currentWeekNumber = getWeekNumber(currentDate);
        const slotsInCurrentWeek = scheduledSlotsForThisClass.filter(slot => getWeekNumber(new Date(slot.date)) === currentWeekNumber);

        const isLookingForSecondSlotOfPair = scheduledSlotsForThisClass.length % 2 !== 0;

        if (slotsInCurrentWeek.length >= 2 && !isLookingForSecondSlotOfPair) {
            continue;
        }
        
        const dayOfWeek = currentDate.getDay();
        // SỬA LỖI 2: Chỉ xếp lịch từ T2-T6 (bỏ T7 và CN)
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        if (isLookingForSecondSlotOfPair) {
            const firstSlotInPair = scheduledSlotsForThisClass[scheduledSlotsForThisClass.length - 1];
            const timeDiff = currentDate.getTime() - new Date(firstSlotInPair.date).getTime();
            if (timeDiff < (2 * 24 * 60 * 60 * 1000)) continue;

            let partnerSlot;
            if (firstSlotInPair.slot % 2 !== 0) partnerSlot = firstSlotInPair.slot + 1;
            else partnerSlot = firstSlotInPair.slot - 1;

            // SỬA LỖI 3: Chỉ cho phép slot 1-4
            if (partnerSlot < 1 || partnerSlot > 4) continue; 

            const result = findAvailableCombination(currentDate, partnerSlot, students, lecturers, rooms, conflictSet);
            if (result) return result;
        } else {
            // SỬA LỖI 3: Chỉ bắt đầu bằng slot 1 và 3 (bỏ slot 5)
            for (const startSlot of [1, 3]) { 
                const result = findAvailableCombination(currentDate, startSlot, students, lecturers, rooms, conflictSet);
                if (result) return result;
            }
        }
    }
    return null;
};

// --- CONTROLLER CHÍNH: XẾP LỊCH TỰ ĐỘNG ---
const generateSchedule = async (req, res) => {
    let processLogs = [];
    try {
        const { semesterId, majorId } = req.body;
        if (!semesterId || !majorId) return res.status(400).json({ message: 'Vui lòng cung cấp học kỳ và chuyên ngành.' });

        processLogs.push(`[BẮT ĐẦU] Xếp lịch cho Major ID: ${majorId}, Semester ID: ${semesterId}`);
        const semester = await Semester.findById(semesterId);
        const curriculum = await Curriculum.findOne({ majorId: majorId, status: 'active' });
        if (!curriculum) return res.status(404).json({ message: 'Không tìm thấy chương trình học đang hoạt động.' });

        processLogs.push(`[DỌN DẸP] Xóa dữ liệu lịch học cũ của học kỳ ${semester.semesterName}...`);
        const oldClasses = await Class.find({ className: { $regex: semester.semesterName } });
        if (oldClasses.length > 0) {
            const oldClassIds = oldClasses.map(c => c._id);
            await Schedule.deleteMany({ classId: { $in: oldClassIds } });
            await ScheduleOfStudent.deleteMany({ classId: { $in: oldClassIds } });
            await ScheduleOfLecture.deleteMany({ classId: { $in: oldClassIds } });
            await Class.deleteMany({ _id: { $in: oldClassIds } });
            processLogs.push(`[DỌN DẸP] Đã xóa ${oldClassIds.length} lớp học cũ.`);
        }

        const studentsInMajor = await Student.find({ majorId });
        let eligibleStudents = [];
        for (const student of studentsInMajor) {
            const targetSemester = (student.semesterNo || 0) + 1;
            const hasPassed = await checkPrerequisites(student._id, targetSemester, curriculum._id);
            if (hasPassed) eligibleStudents.push({ student, targetSemester });
        }
        if (eligibleStudents.length === 0) return res.status(404).json({ message: 'Không có sinh viên nào đủ điều kiện.' });
        processLogs.push(`[BƯỚC 1] Tìm thấy ${eligibleStudents.length} sinh viên đủ điều kiện.`);

        const lecturersForMajor = await Lecturer.find({ majorId });
        const allRooms = await Room.find({ status: true });
        if (lecturersForMajor.length === 0) return res.status(404).json({ message: 'Không có giảng viên.' });
        if (allRooms.length === 0) return res.status(404).json({ message: 'Không có phòng học khả dụng.' });

        const commonSemester = eligibleStudents[0].targetSemester;
        const subjectsForSemester = await CurriculumDetail.find({ 
            curriculumId: curriculum._id, 
            semester: commonSemester 
        }).populate('subjectId');
        
        if (subjectsForSemester.length === 0) return res.status(404).json({ message: `Không có môn học cho kỳ ${commonSemester}.` });
        
        const subjectNames = subjectsForSemester.map(s => s.subjectId ? s.subjectId.subjectCode : 'LỖI_REF').join(', ');
        processLogs.push(`[BƯỚC 2] Các môn cần xếp cho kỳ ${commonSemester}: ${subjectNames}`);

        let classesToSchedule = [];
        for (const detail of subjectsForSemester) {
            if (!detail.subjectId) {
                processLogs.push(`[CẢNH BÁO] Bỏ qua CurriculumDetail ${detail._id} vì SubjectId không hợp lệ.`);
                continue;
            }
            const studentsForSubject = eligibleStudents.filter(s => s.targetSemester === commonSemester);
            
            const CLASS_SIZE = 5; // Giới hạn 5 sinh viên/lớp
            const numberOfClasses = Math.ceil(studentsForSubject.length / CLASS_SIZE);
            
            for (let i = 0; i < numberOfClasses; i++) {
                const classStudents = studentsForSubject.slice(i * CLASS_SIZE, (i + 1) * CLASS_SIZE);
                const newClass = new Class({
                    className: `${detail.subjectId.subjectCode}-${semester.semesterName}-${i + 1}`,
                    subjectId: detail.subjectId._id, roomId: allRooms[0]._id, lecturerId: lecturersForMajor[0]._id
                });
                await newClass.save();
                classesToSchedule.push({ class: newClass, students: classStudents.map(s => s.student) });
                processLogs.push(`   -> Đã tạo lớp ${newClass.className} với ${classStudents.length} sinh viên.`);
            }
        }

        processLogs.push('[BƯỚC 3] Bắt đầu thuật toán xếp lịch...');
        const conflictSet = new Set();
        
        for (const [idx, classToSchedule] of classesToSchedule.entries()) {
            processLogs.push(` -> Đang xếp lịch cho lớp: ${classToSchedule.class.className}`);
            let createdSchedules = [];
            let scheduledSlotsForThisClass = [];
            
            for (let i = 0; i < 20; i++) {
                // SỬA LỖI 1: Thêm `idx` vào hàm để xoay vòng ngày
                const startDayOffset = (idx * 2) % 5; // 0, 2, 4, 1, 3... (T2, T4, T6, T3, T5)
                
                const validSlot = findValidScheduleSlot(classToSchedule.students, lecturersForMajor, allRooms, conflictSet, semester.startDate, scheduledSlotsForThisClass, startDayOffset);
                
                if (validSlot) {
                    const timeInfo = slotTimes.find(t => t.slot === validSlot.slot);
                    if (!timeInfo) {
                        const errorMsg = `Lỗi cấu hình: Không tìm thấy thời gian cho slot ${validSlot.slot}`;
                        console.error(errorMsg); processLogs.push(errorMsg);
                        continue;
                    }
                    const newSchedule = new Schedule({
                        ...validSlot, semesterId, subjectId: classToSchedule.class.subjectId,
                        classId: classToSchedule.class._id, startTime: timeInfo.startTime, endTime: timeInfo.endTime
                    });
                    await newSchedule.save();
                    createdSchedules.push(newSchedule);
                    scheduledSlotsForThisClass.push(validSlot);
                    const dateStr = validSlot.date.toISOString().split('T')[0];
                    conflictSet.add(`${validSlot.lecturerId}-${dateStr}-${validSlot.slot}`);
                    conflictSet.add(`${validSlot.roomId}-${dateStr}-${validSlot.slot}`);
                    classToSchedule.students.forEach(student => conflictSet.add(`${student._id}-${dateStr}-${validSlot.slot}`));
                } else {
                    const errorMsg = `   - LỖI: Không thể tìm thấy buổi học thứ ${i + 1} cho lớp ${classToSchedule.class.className}. Dừng xếp lịch.`;
                    console.error(errorMsg); processLogs.push(errorMsg);
                    break;
                }
            }

            if (createdSchedules.length > 0) {
                processLogs.push(`[BƯỚC 4] Đang tạo bản ghi ghi danh cho lớp ${classToSchedule.class.className}`);
                for (const student of classToSchedule.students) {
                    const attendanceRecords = createdSchedules.map(schedule => ({ scheduleId: schedule._id }));
                    await ScheduleOfStudent.create({ studentId: student._id, classId: classToSchedule.class._id, attendance: attendanceRecords });
                }
                const lastSchedule = createdSchedules[createdSchedules.length - 1];
                await Class.findByIdAndUpdate(classToSchedule.class._id, {
                    lecturerId: lastSchedule.lecturerId,
                    roomId: lastSchedule.roomId
                });
                const distinctLecturerIds = [...new Set(createdSchedules.map(s => s.lecturerId.toString()))];
                for (const lecId of distinctLecturerIds) {
                    const schedulesForLecturer = createdSchedules.filter(s => s.lecturerId.toString() === lecId);
                    for (const schedule of schedulesForLecturer) {
                         await ScheduleOfLecture.create({ scheduleId: schedule._id, lecturerId: lecId });
                    }
                }
            }
        }

        processLogs.push('[HOÀN TẤT] Quá trình xếp lịch đã xong.');
        res.status(200).json({ message: 'Hoàn tất quá trình xếp lịch!', classesScheduledCount: classesToSchedule.length, logs: processLogs });

    } catch (error) {
        console.error("Lỗi khi tạo lịch:", error);
        res.status(500).json({ message: 'Lỗi server khi đang tạo lịch.', error: error.message, logs: processLogs });
    }
};

module.exports = {
    getStudentSchedule,
    getClassAttendance,
    generateSchedule
};