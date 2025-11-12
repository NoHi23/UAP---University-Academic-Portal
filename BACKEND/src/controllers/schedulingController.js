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
const GradeSummary = require('../models/gradeSummary');
const GradeComponent = require('../models/gradeComponent');
const dayjs = require('dayjs');


const createLogger = (processLogs) => (msg) => {
    const timestamp = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    const formatted = `[${timestamp}] ${msg}`;
    processLogs.push(formatted);
    console.log(formatted);
};

const getStudentSchedule = async (req, res) => {
    try {
        const student = await Student.findOne({ accountId: req.user.id });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin sinh viên'
            });
        }

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
                .filter(att => att.scheduleId)
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

const getClassAttendance = async (req, res) => {
    try {
        const classId = req.params.classId;

        const classInfo = await Class.findById(classId)
            .populate('subjectId', 'subjectCode subjectName')
            .populate('lecturerId', 'firstName lastName');

        if (!classInfo) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin lớp học'
            });
        }

        const studentsAttendance = await ScheduleOfStudent.find({ classId })
            .populate('studentId', 'studentCode firstName lastName')
            .populate('attendance.scheduleId');

        if (!studentsAttendance || studentsAttendance.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin điểm danh'
            });
        }

        const formattedData = {
            className: classInfo.className,
            subjectCode: classInfo.subjectId.subjectCode,
            subjectName: classInfo.subjectId.subjectName,
            lecturer: `${classInfo.lecturerId.firstName} ${classInfo.lecturerId.lastName}`,
            students: studentsAttendance.map(record => ({
                id: record.studentId._id,
                studentCode: record.studentId.studentCode,
                fullName: `${record.studentId.firstName} ${record.studentId.lastName}`,
                attendance: record.attendance
                    .filter(att => att.scheduleId)
                    .map(att => ({
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
        const dateStr = date.toISOString().split('T')[0];
        const lecturerConflictKey = `${lecturer._id}-${dateStr}-${slot}`;
        if (conflictSet.has(lecturerConflictKey)) {
            continue;
        }
        for (const room of rooms) {
            const roomConflictKey = `${room._id}-${dateStr}-${slot}`;
            if (conflictSet.has(roomConflictKey)) {
                continue;
            }
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
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;
        if (isLookingForSecondSlotOfPair) {
            const firstSlotInPair = scheduledSlotsForThisClass[scheduledSlotsForThisClass.length - 1];
            const timeDiff = currentDate.getTime() - new Date(firstSlotInPair.date).getTime();
            if (timeDiff < (2 * 24 * 60 * 60 * 1000)) continue;
            let partnerSlot;
            if (firstSlotInPair.slot % 2 !== 0) partnerSlot = firstSlotInPair.slot + 1;
            else partnerSlot = firstSlotInPair.slot - 1;
            if (partnerSlot < 1 || partnerSlot > 4) continue;
            const result = findAvailableCombination(currentDate, partnerSlot, students, lecturers, rooms, conflictSet);
            if (result) return result;
        } else {
            for (const startSlot of [1, 3]) {
                const result = findAvailableCombination(currentDate, startSlot, students, lecturers, rooms, conflictSet);
                if (result) return result;
            }
        }
    }
    return null;
};

const generateSchedule = async (req, res) => {
    let processLogs = [];

    try {
        const { semesterId, majorId } = req.body;
        if (!semesterId || !majorId) return res.status(400).json({ message: 'Vui lòng cung cấp học kỳ và chuyên ngành.' });

        processLogs.push(`[BẮT ĐẦU] Xếp lịch cho Major ID: ${majorId}, Semester ID: ${semesterId}`);
        console.log(`[BẮT ĐẦU] Xếp lịch cho Major ID: ${majorId}, Semester ID: ${semesterId}`);

        const semester = await Semester.findById(semesterId);
        const curriculum = await Curriculum.findOne({ majorId: majorId, status: 'active' });
        if (!curriculum) return res.status(404).json({ message: 'Không tìm thấy chương trình học đang hoạt động.' });

        processLogs.push(`[DỌN DẸP] Xóa dữ liệu lịch học cũ của học kỳ ${semester.semesterName}...`);
        console.log(`[DỌN DẸP] Xóa dữ liệu lịch học cũ của học kỳ ${semester.semesterName}...`);

        const oldClasses = await Class.find({ className: { $regex: semester.semesterName, $options: "i" } });

        if (oldClasses.length > 0) {
            const oldClassIds = oldClasses.map(c => c._id);
            await Schedule.deleteMany({ classId: { $in: oldClassIds } });
            await ScheduleOfStudent.deleteMany({ classId: { $in: oldClassIds } });
            await ScheduleOfLecture.deleteMany({ classId: { $in: oldClassIds } });
            await Class.deleteMany({ _id: { $in: oldClassIds } });
            processLogs.push(`[DỌN DẸP] Đã xóa ${oldClassIds.length} lớp học cũ.`);
            console.log(`[DỌN DẸP] Đã xóa ${oldClassIds.length} lớp học cũ.`);

        }

        const studentsInMajor = await Student.find({ majorId });
        let eligibleStudents = [];
        for (const student of studentsInMajor) {
            const targetSemester = (student.semesterNo || 1);
            const hasPassed = await checkPrerequisites(student._id, targetSemester, curriculum._id);
            if (hasPassed) eligibleStudents.push({ student, targetSemester });
        }
        if (eligibleStudents.length === 0) {
            processLogs.push(`[LỖI] Không có sinh viên nào đủ điều kiện.`);
            console.log(`[LỖI] Không có sinh viên nào đủ điều kiện.`);
            return res.status(404).json({ message: 'Không có sinh viên nào đủ điều kiện để xếp lịch.', logs: processLogs });
        }
        processLogs.push(`[BƯỚC 1] Tìm thấy ${eligibleStudents.length} sinh viên đủ điều kiện.`);
        console.log(`[BƯỚC 1] Tìm thấy ${eligibleStudents.length} sinh viên đủ điều kiện.`);
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
        console.log(`[BƯỚC 2] Các môn cần xếp cho kỳ ${commonSemester}: ${subjectNames}`);
        let classesToSchedule = [];
        for (const detail of subjectsForSemester) {
            if (!detail.subjectId) {
                processLogs.push(`[CẢNH BÁO] Bỏ qua CurriculumDetail ${detail._id} vì SubjectId không hợp lệ.`);
                console.warn(`[CẢNH BÁO] Bỏ qua CurriculumDetail ${detail._id} vì SubjectId không hợp lệ.`);
                continue;
            }
            const studentsForSubject = eligibleStudents.filter(s => s.targetSemester === commonSemester);
            const CLASS_SIZE = 10;
            const numberOfClasses = Math.ceil(studentsForSubject.length / CLASS_SIZE);
            for (let i = 0; i < numberOfClasses; i++) {
                const classStudents = studentsForSubject.slice(i * CLASS_SIZE, (i + 1) * CLASS_SIZE);
                const randomLecturer = lecturersForMajor[Math.floor(Math.random() * lecturersForMajor.length)];
                const newClass = new Class({
                    className: `${detail.subjectId.subjectCode}-${semester.semesterName}-${i + 1}`,
                    subjectId: detail.subjectId._id,
                    roomId: allRooms[0]._id,
                    lecturerId: randomLecturer._id
                });
                await newClass.save();
                classesToSchedule.push({
                    class: newClass,
                    students: classStudents.map(s => s.student),
                    assignedLecturer: randomLecturer
                });
                processLogs.push(`   -> Đã tạo lớp ${newClass.className} với ${classStudents.length} SV, GV: ${randomLecturer.lastName}`);
                console.log(`   -> Đã tạo lớp ${newClass.className} với ${classStudents.length} SV, GV: ${randomLecturer.lastName}`);
            }
        }

        processLogs.push('[BƯỚC 3] Bắt đầu thuật toán xếp lịch...');
        console.log('[BƯỚC 3] Bắt đầu thuật toán xếp lịch...');
        // --- SỬA LỖI 2: TẢI TRƯỚC TẤT CẢ LỊCH BẬN VÀO CONFLICTSET ---
        const conflictSet = new Set();
        const allExistingSchedules = await Schedule.find({}, 'date slot lecturerId roomId').lean();

        for (const s of allExistingSchedules) {
            const dateStr = s.date.toISOString().split('T')[0];
            conflictSet.add(`${s.lecturerId}-${dateStr}-${s.slot}`);
            conflictSet.add(`${s.roomId}-${dateStr}-${s.slot}`);
            // (Chúng ta sẽ không pre-load lịch sinh viên vì họ có thể học 2 chuyên ngành,
            // nhưng lịch GV và Phòng là đủ để tránh lỗi E11000)
        }
        processLogs.push(`[BƯỚC 3.1] Đã tải ${allExistingSchedules.length} lịch bận (GV/Phòng) vào bộ nhớ đệm.`);
        console.log(`[BƯỚC 3.1] Đã tải ${allExistingSchedules.length} lịch bận (GV/Phòng) vào bộ nhớ đệm.`);
        // -----------------------------------------------------------

        for (const [idx, classToSchedule] of classesToSchedule.entries()) {
            processLogs.push(` -> Đang xếp lịch cho lớp: ${classToSchedule.class.className}`);
            console.log(` -> Đang xếp lịch cho lớp: ${classToSchedule.class.className}`);
            let createdSchedules = [];
            let scheduledSlotsForThisClass = [];
            const classLecturerAsArray = [classToSchedule.assignedLecturer];

            for (let i = 0; i < 20; i++) {
                const startDayOffset = (idx * 2) % 5;
                const validSlot = findValidScheduleSlot(
                    classToSchedule.students,
                    classLecturerAsArray,
                    allRooms,
                    conflictSet,
                    semester.startDate,
                    scheduledSlotsForThisClass,
                    startDayOffset
                );

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
                    const errorMsg = `   - LỖI: Không thể tìm thấy buổi học thứ ${i + 1} cho lớp ${classToSchedule.class.className} (GV: ${classToSchedule.assignedLecturer.lastName}). Dừng xếp lịch.`;
                    console.error(errorMsg); processLogs.push(errorMsg);
                    break;
                }
            }

            if (createdSchedules.length > 0) {
                processLogs.push(`[BƯỚC 4] Đang tạo bản ghi ghi danh cho lớp ${classToSchedule.class.className}`);
                console.log(`[BƯỚC 4] Đang tạo bản ghi ghi danh cho lớp ${classToSchedule.class.className}`);
                for (const student of classToSchedule.students) {
                    const attendanceRecords = createdSchedules.map(schedule => ({ scheduleId: schedule._id }));
                    await ScheduleOfStudent.create({ studentId: student._id, classId: classToSchedule.class._id, attendance: attendanceRecords });
                }
                const lastSchedule = createdSchedules[createdSchedules.length - 1];
                await Class.findByIdAndUpdate(classToSchedule.class._id, {
                    roomId: lastSchedule.roomId
                });
                const lecturerId = classToSchedule.assignedLecturer._id;
                for (const schedule of createdSchedules) {
                    await ScheduleOfLecture.create({ scheduleId: schedule._id, lecturerId: lecturerId });
                }
            }
        }

        processLogs.push('[HOÀN TẤT] Quá trình xếp lịch đã xong.');
        console.log('[HOÀN TẤT] Quá trình xếp lịch đã xong.');
        res.status(200).json({ message: 'Hoàn tất quá trình xếp lịch!', classesScheduledCount: classesToSchedule.length, logs: processLogs });

    } catch (error) {
        console.error("Lỗi khi tạo lịch:", error);
        res.status(500).json({ message: 'Lỗi server khi đang tạo lịch.', error: error.message, logs: processLogs });
    }
};


const scheduleManualClass = async (req, res) => {
    let processLogs = [];
    try {
        const {
            semesterId,
            lecturerId,
            roomId,
            className,
            studentIds,
            numberOfSlots,
            subjectId,
            newSubjectName,
            newSubjectCode,
            newSubjectNoCredit,
            majorId
        } = req.body;

        if (!semesterId || !lecturerId || !roomId || !className || !studentIds || !numberOfSlots || !subjectId || !majorId) {
            return res.status(400).json({ message: 'Thiếu thông tin. Vui lòng cung cấp đủ (kỳ, GV, phòng, tên lớp, sinh viên, số buổi, môn học, chuyên ngành).' });
        }
        if (studentIds.length === 0) {
            return res.status(400).json({ message: 'Bạn phải chọn ít nhất một sinh viên.' });
        }
        const semester = await Semester.findById(semesterId);
        if (!semester) return res.status(404).json({ message: 'Học kỳ không tồn tại.' });

        processLogs.push(`[BƯỚC 1] Bắt đầu tạo lớp thủ công: ${className}`);
        console.log(`[BƯỚC 1] Bắt đầu tạo lớp thủ công: ${className}`);
        let finalSubjectId;
        if (subjectId === 'NEW') {
            if (!newSubjectName || !newSubjectCode || !newSubjectNoCredit) {
                return res.status(400).json({ message: 'Phải nhập Tên môn, Mã môn và Số tín chỉ cho môn học mới.' });
            }
            try {
                const newSubject = await Subject.create({
                    subjectName: newSubjectName,
                    subjectCode: newSubjectCode,
                    subjectNoCredit: Number(newSubjectNoCredit),
                    majorId: majorId,
                });
                finalSubjectId = newSubject._id;
                processLogs.push(`Đã tạo môn học mới: ${newSubjectCode}`);
                console.log(`Đã tạo môn học mới: ${newSubjectCode}`);
            } catch (err) {
                if (err.code === 11000) return res.status(400).json({ message: 'Mã môn học mới đã tồn tại.' });
                throw err;
            }
        } else {
            finalSubjectId = subjectId;
        }

        // --- BƯỚC 3: LẤY CURRICULUM ID TỪ SINH VIÊN ĐẦU TIÊN ---
        // (Giả định tất cả sinh viên được add thủ công chung 1 curriculum)
        const firstStudent = await Student.findById(studentIds[0]).select('curriculumId');
        if (!firstStudent) return res.status(404).json({ message: 'Sinh viên đầu tiên không hợp lệ.' });
        const curriculumId = firstStudent.curriculumId;

        // --- BƯỚC 4: TẠO LỚP (CLASS) ---
        const newClass = new Class({
            className,
            subjectId: finalSubjectId,
            roomId,
            lecturerId,
            curriculumId: curriculumId // Rất quan trọng cho logic "lên kỳ"
        });
        await newClass.save();
        processLogs.push(`Đã tạo lớp ${className} (ID: ${newClass._id}).`);
        console.log(`Đã tạo lớp ${className} (ID: ${newClass._id}).`);
        // --- BƯỚC 5: TẢI LỊCH BẬN (CONFLICT SET) ---
        const conflictSet = new Set();
        const allExistingSchedules = await Schedule.find({}, 'date slot lecturerId roomId').lean();
        for (const s of allExistingSchedules) {
            const dateStr = s.date.toISOString().split('T')[0];
            conflictSet.add(`${s.lecturerId}-${dateStr}-${s.slot}`);
            conflictSet.add(`${s.roomId}-${dateStr}-${s.slot}`);
        }
        // Lấy lịch bận của chính các sinh viên được thêm vào
        const studentSchedules = await Schedule.find({ studentId: { $in: studentIds } });
        for (const s of studentSchedules) {
            const dateStr = s.date.toISOString().split('T')[0];
            conflictSet.add(`${s.studentId}-${dateStr}-${s.slot}`);
        }
        processLogs.push(`[BƯỚC 2] Đã tải ${allExistingSchedules.length} lịch bận (GV/Phòng) và ${studentSchedules.length} lịch bận (SV).`);
        console.log(`[BƯỚC 2] Đã tải ${allExistingSchedules.length} lịch bận (GV/Phòng) và ${studentSchedules.length} lịch bận (SV).`);
        // --- BƯỚC 6: XẾP LỊCH (TẠO 20 BUỔI HỌC) ---
        processLogs.push(`[BƯỚC 3] Bắt đầu tìm ${numberOfSlots} buổi học...`);
        console.log(`[BƯỚC 3] Bắt đầu tìm ${numberOfSlots} buổi học...`);
        const createdSchedules = [];
        let scheduledSlotsForThisClass = [];

        // Lấy đúng GV và Phòng đã chọn
        const assignedLecturer = [await Lecturer.findById(lecturerId)];
        const assignedRoom = [await Room.findById(roomId)];
        const students = await Student.find({ _id: { $in: studentIds } });

        for (let i = 0; i < numberOfSlots; i++) {
            const validSlot = findValidScheduleSlot(
                students,
                assignedLecturer, // Chỉ tìm cho 1 GV
                assignedRoom,     // Chỉ tìm cho 1 Phòng
                conflictSet,
                semester.startDate,
                scheduledSlotsForThisClass,
                0 // Bắt đầu tìm từ đầu
            );

            if (validSlot) {
                const timeInfo = slotTimes.find(t => t.slot === validSlot.slot);
                const newSchedule = new Schedule({
                    ...validSlot,
                    semesterId,
                    subjectId: finalSubjectId,
                    classId: newClass._id,
                    startTime: timeInfo.startTime,
                    endTime: timeInfo.endTime
                });
                await newSchedule.save();
                createdSchedules.push(newSchedule);
                scheduledSlotsForThisClass.push(validSlot);

                // Cập nhật conflict set ngay lập tức
                const dateStr = validSlot.date.toISOString().split('T')[0];
                conflictSet.add(`${validSlot.lecturerId}-${dateStr}-${validSlot.slot}`);
                conflictSet.add(`${validSlot.roomId}-${dateStr}-${validSlot.slot}`);
                students.forEach(student => conflictSet.add(`${student._id}-${dateStr}-${validSlot.slot}`));
            } else {
                const errorMsg = `LỖI: Chỉ tìm được ${i} / ${numberOfSlots} buổi học. Không tìm thấy slot trống.`;
                processLogs.push(errorMsg);
                console.error(errorMsg);
                break; // Dừng lại nếu không tìm được
            }
        }

        if (createdSchedules.length === 0) {
            return res.status(400).json({ message: 'Không thể tìm thấy bất kỳ slot trống nào cho Giảng viên/Phòng học này.', logs: processLogs });
        }

        // --- BƯỚC 7: GHI DANH SINH VIÊN VÀ GIẢNG VIÊN ---
        processLogs.push(`[BƯỚC 4] Đã tạo ${createdSchedules.length} buổi học. Ghi danh ${students.length} sinh viên...`);
        console.log(`[BƯỚC 4] Đã tạo ${createdSchedules.length} buổi học. Ghi danh ${students.length} sinh viên...`);
        const attendanceRecords = createdSchedules.map(schedule => ({ scheduleId: schedule._id }));

        for (const studentId of studentIds) {
            await ScheduleOfStudent.create({
                studentId: studentId,
                classId: newClass._id,
                attendance: attendanceRecords
            });
        }
        for (const schedule of createdSchedules) {
            await ScheduleOfLecture.create({ scheduleId: schedule._id, lecturerId: lecturerId });
        }

        processLogs.push('[HOÀN TẤT] Xếp lớp thủ công thành công.');
        console.log('[HOÀN TẤT] Xếp lớp thủ công thành công.');
        res.status(200).json({
            message: `Xếp lớp thủ công thành công! Đã tạo ${createdSchedules.length} buổi học cho ${students.length} sinh viên.`,
            logs: processLogs
        });

    } catch (error) {
        console.error("Lỗi khi xếp lớp thủ công:", error);
        processLogs.push(`[LỖI SERVER] ${error.message}`);
        res.status(500).json({ message: 'Lỗi server khi đang xếp lịch.', error: error.message, logs: processLogs });
    }
};
const moveScheduleSlot = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const { newDate, newSlot, newRoomId, newLecturerId } = req.body;

        if (!newDate || !newSlot || !newRoomId || !newLecturerId) {
            return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ Ngày, Slot, Phòng, và Giảng viên mới.' });
        }

        const scheduleToMove = await Schedule.findById(scheduleId);
        if (!scheduleToMove) return res.status(404).json({ message: 'Không tìm thấy buổi học.' });

        const enrollments = await ScheduleOfStudent.find({ classId: scheduleToMove.classId }).select('studentId');
        const studentIds = enrollments.map(e => e.studentId);

        const numericSlot = Number(newSlot);
        const newTimeInfo = slotTimes.find(t => t.slot === numericSlot);

        if (!newTimeInfo) {
            return res.status(400).json({ message: `Slot mới (${newSlot}) không hợp lệ.` });
        }

        const startOfDay = dayjs(newDate).startOf('day').toDate();
        const endOfDay = dayjs(newDate).endOf('day').toDate();

        const lecturerConflict = await Schedule.findOne({
            _id: { $ne: scheduleId },
            lecturerId: newLecturerId,
            slot: numericSlot, 
            date: { $gte: startOfDay, $lte: endOfDay }
        });
        if (lecturerConflict) return res.status(400).json({ message: 'Xung đột: Giảng viên mới đã bận tại thời điểm này.' });

        const roomConflict = await Schedule.findOne({
            _id: { $ne: scheduleId },
            roomId: newRoomId,
            slot: numericSlot, 
            date: { $gte: startOfDay, $lte: endOfDay }
        });
        if (roomConflict) return res.status(400).json({ message: 'Xung đột: Phòng học đã được sử dụng tại thời điểm này.' });

        const studentEnrollments = await ScheduleOfStudent.find({ studentId: { $in: studentIds } })
            .populate('attendance.scheduleId', 'date slot'); 

        for (const enrollment of studentEnrollments) {
            for (const att of enrollment.attendance) {
                if (att.scheduleId && att.scheduleId._id.toString() !== scheduleId) {
                    const s = att.scheduleId;
                    if (dayjs(s.date).isSame(dayjs(newDate), 'day') && s.slot === numericSlot) {
                        return res.status(400).json({ message: `Xung đột: Một sinh viên trong lớp đã bận (lịch học khác) tại thời điểm này.` });
                    }
                }
            }
        }

        const updatedSchedule = await Schedule.findByIdAndUpdate(scheduleId, {
            date: newDate,
            slot: numericSlot, 
            roomId: newRoomId,
            lecturerId: newLecturerId,
            startTime: newTimeInfo.startTime, 
            endTime: newTimeInfo.endTime  
        }, { new: true });

        await ScheduleOfLecture.updateOne(
            { scheduleId: scheduleId },
            { $set: { lecturerId: newLecturerId } },
            { upsert: true } 
        );

        res.status(200).json({ success: true, message: 'Di chuyển buổi học thành công.', data: updatedSchedule });

    } catch (error) {
        console.error("Lỗi khi di chuyển slot:", error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const filterSchedules = async (req, res) => {
    try {
        const { semesterId, classId, lecturerId } = req.query;

        let filter = {};
        if (semesterId) filter.semesterId = semesterId;
        if (classId) filter.classId = classId;
        if (lecturerId) filter.lecturerId = lecturerId;

        if (Object.keys(filter).length === 0) {
            return res.status(400).json({ message: 'Vui lòng cung cấp ít nhất một bộ lọc (Kỳ, Lớp, hoặc GV).' });
        }

        const schedules = await Schedule.find(filter)
            .populate('classId', 'className')
            .populate('subjectId', 'subjectCode subjectName')
            .populate('roomId', 'roomName')
            .populate('lecturerId', 'firstName lastName')
            .sort({ date: 1, slot: 1 })
            .limit(200); // Giới hạn 200 kết quả

        res.status(200).json({ success: true, data: schedules });

    } catch (error) {
        console.error("Lỗi khi lọc schedules:", error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

module.exports = {
    getStudentSchedule,
    getClassAttendance,
    generateSchedule,
    scheduleManualClass,
    moveScheduleSlot,
    filterSchedules
};