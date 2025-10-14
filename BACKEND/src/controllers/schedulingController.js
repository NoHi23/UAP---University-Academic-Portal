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
const slotTimes = [
  { slot: 1, startTime: '07:30', endTime: '09:50' },
  { slot: 2, startTime: '10:00', endTime: '12:20' },
  { slot: 3, startTime: '12:50', endTime: '15:10' },
  { slot: 4, startTime: '15:20', endTime: '17:40' },
  { slot: 5, startTime: '18:00', endTime: '20:20' },
  { slot: 6, startTime: '20:30', endTime: '22:50' }
];

// --- HÀM HELPER MỚI: LẤY SỐ THỨ TỰ CỦA TUẦN ---
const getWeekNumber = (d) => {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNo;
};

// --- HÀM HELPER: KIỂM TRA MÔN TIÊN QUYẾT ---
const checkPrerequisites = async (studentId, targetSemester, curriculumId) => {
  if (targetSemester <= 1) return true;
  const previousSemester = targetSemester - 1;
  const prevSemesterSubjects = await CurriculumDetail.find({ curriculumId, cdSemester: previousSemester.toString() }).select('subjectId');
  if (prevSemesterSubjects.length === 0) return true;
  const prevSubjectIds = prevSemesterSubjects.map(s => s.subjectId);
  const grades = await Grade.find({ studentId, subjectId: { $in: prevSubjectIds } });
  if (grades.length < prevSubjectIds.length) return false;
  for (const grade of grades) {
    if (grade.score < 4) return false;
  }
  return true;
};
const findValidScheduleSlot = (students, lecturers, rooms, conflictSet, semesterStartDate, scheduledSlotsForThisClass) => {
  const startDate = new Date(semesterStartDate);
  for (let dayOffset = 0; dayOffset < 15 * 7; dayOffset++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + dayOffset);

    const currentWeekNumber = getWeekNumber(currentDate);
    const slotsInCurrentWeek = scheduledSlotsForThisClass.filter(slot => getWeekNumber(new Date(slot.date)) === currentWeekNumber);

    if (slotsInCurrentWeek.length >= 2) continue;

    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0) continue;

    const lastSlotInfo = slotsInCurrentWeek.length > 0 ? slotsInCurrentWeek[0] : null;

    // Lặp qua các slot 1, 2, 3, 4
    for (const slot of [1, 2, 3, 4]) {
      let targetSlot = slot;

      // === LOGIC MỚI: ÁP DỤNG QUY TẮC "CÙNG SLOT" ===
      if (slotsInCurrentWeek.length === 1) { // Nếu đang tìm buổi thứ 2 trong tuần
        targetSlot = lastSlotInfo.slot + 1; // Buổi thứ 2 phải có slot GIỐNG HỆT buổi đầu

        // Buổi thứ 2 phải cách buổi 1 ít nhất 2 ngày
        const timeDiff = currentDate.getTime() - new Date(lastSlotInfo.date).getTime();
        if (timeDiff < (2 * 24 * 60 * 60 * 1000)) {
          continue; // Bỏ qua nếu là ngày kế tiếp
        }
      }
      // =================================================

      for (const lecturer of lecturers) {
        for (const room of rooms) {
          const dateStr = currentDate.toISOString().split('T')[0];
          const lecturerConflictKey = `${lecturer._id}-${dateStr}-${targetSlot}`;
          const roomConflictKey = `${room._id}-${dateStr}-${targetSlot}`;

          if (conflictSet.has(lecturerConflictKey) || conflictSet.has(roomConflictKey)) continue;

          let studentConflict = false;
          for (const student of students) {
            if (conflictSet.has(`${student._id}-${dateStr}-${targetSlot}`)) {
              studentConflict = true;
              break;
            }
          }

          if (!studentConflict) {
            return { date: currentDate, slot: targetSlot, lecturerId: lecturer._id, roomId: room._id };
          }
        }
      }

      // Nếu đang tìm buổi thứ 2, không cần thử các slot khác nữa
      if (slotsInCurrentWeek.length === 1) break;
    }
  }
  return null;
};
// --- CONTROLLER CHÍNH: XẾP LỊCH TỰ ĐỘNG ---
const generateSchedule = async (req, res) => {
  try {
    const { semesterId, majorId } = req.body;
    if (!semesterId || !majorId) return res.status(400).json({ message: 'Vui lòng cung cấp học kỳ và chuyên ngành.' });

    const semester = await Semester.findById(semesterId);
    const curriculum = await Curriculum.findOne({ majorId: majorId, status: 'active' });
    if (!curriculum) return res.status(404).json({ message: 'Không tìm thấy chương trình học đang hoạt động.' });

    // DỌN DẸP DỮ LIỆU CŨ
    const oldClasses = await Class.find({ className: { $regex: semester.semesterName } });
    if (oldClasses.length > 0) {
      const oldClassIds = oldClasses.map(c => c._id);
      await Schedule.deleteMany({ classId: { $in: oldClassIds } });
      await ScheduleOfStudent.deleteMany({ classId: { $in: oldClassIds } });
      await ScheduleOfLecture.deleteMany({ classId: { $in: oldClassIds } });
      await Class.deleteMany({ _id: { $in: oldClassIds } });
      console.log(`[DỌN DẸP] Đã xóa ${oldClassIds.length} lớp học cũ.`);
    }

    // LỌC SINH VIÊN
    const studentsInMajor = await Student.find({ majorId });
    let eligibleStudents = [];
    for (const student of studentsInMajor) {
      const targetSemester = (student.semesterNo || 0) + 1;
      const hasPassed = await checkPrerequisites(student._id, targetSemester, curriculum._id);
      if (hasPassed) eligibleStudents.push({ student, targetSemester });
    }
    if (eligibleStudents.length === 0) return res.status(404).json({ message: 'Không có sinh viên nào đủ điều kiện.' });

    // LẤY TÀI NGUYÊN
    const lecturersForMajor = await Lecturer.find({ majorId });
    const allRooms = await Room.find({ status: true });
    if (lecturersForMajor.length === 0) return res.status(404).json({ message: 'Không có giảng viên cho chuyên ngành này.' });
    if (allRooms.length === 0) return res.status(404).json({ message: 'Không có phòng học khả dụng.' });

    // PHÂN LỚP
    const commonSemester = eligibleStudents[0].targetSemester;
    const subjectsForSemester = await CurriculumDetail.find({ curriculumId: curriculum._id, cdSemester: commonSemester.toString() }).populate('subjectId');
    if (subjectsForSemester.length === 0) return res.status(404).json({ message: `Không có môn học cho kỳ ${commonSemester}.` });

    let classesToSchedule = [];
    for (const detail of subjectsForSemester) {
      const studentsForSubject = eligibleStudents.filter(s => s.targetSemester === commonSemester);
      const numberOfClasses = Math.ceil(studentsForSubject.length / 30);
      for (let i = 0; i < numberOfClasses; i++) {
        const classStudents = studentsForSubject.slice(i * 30, (i + 1) * 30);
        const newClass = new Class({
          className: `${detail.subjectId.subjectCode}-${semester.semesterName}-${i + 1}`,
          subjectId: detail.subjectId._id, roomId: allRooms[0]._id, lecturerId: lecturersForMajor[0]._id
        });
        await newClass.save();
        classesToSchedule.push({ class: newClass, students: classStudents.map(s => s.student) });
      }
    }

    // XẾP LỊCH
    const conflictSet = new Set();
    for (const classToSchedule of classesToSchedule) {
      let createdSchedules = [];
      let scheduledSlotsForThisClass = [];
      for (let i = 0; i < 20; i++) {
        const validSlot = findValidScheduleSlot(classToSchedule.students, lecturersForMajor, allRooms, conflictSet, semester.startDate, scheduledSlotsForThisClass);
        if (validSlot) {
          const timeInfo = slotTimes.find(t => t.slot === validSlot.slot);
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
          console.error(`LỖI: Không tìm được buổi học thứ ${i + 1} cho lớp ${classToSchedule.class.className}.`);
          break;
        }
      }

      // TẠO GHI DANH
      if (createdSchedules.length > 0) {
        const lecturerId = createdSchedules[0].lecturerId;
        for (const schedule of createdSchedules) {
          await ScheduleOfLecture.create({ scheduleId: schedule._id, lecturerId });
        }
        for (const student of classToSchedule.students) {
          const attendanceRecords = createdSchedules.map(schedule => ({ scheduleId: schedule._id }));
          await ScheduleOfStudent.create({ studentId: student._id, classId: classToSchedule.class._id, attendance: attendanceRecords });
        }
      }
    }

    res.status(200).json({ message: 'Hoàn tất quá trình xếp lịch!', classesScheduledCount: classesToSchedule.length });

  } catch (error) {
    console.error("Lỗi khi tạo lịch:", error);
    res.status(500).json({ message: 'Lỗi server khi đang tạo lịch.', error: error.message });
  }
};

module.exports = {
  generateSchedule
};