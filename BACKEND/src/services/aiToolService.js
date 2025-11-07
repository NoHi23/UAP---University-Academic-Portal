const Student = require('../models/student');
const Lecturer = require('../models/lecturer');
const Schedule = require('../models/schedule');
const ScheduleOfStudent = require('../models/scheduleOfStudent');
const Subject = require('../models/subject');
const TuitionFee = require('../models/tuitionFeeModel');
const Class = require('../models/class');
const dayjs = require('dayjs');

const get_schedule_for_date = async (accountId, date) => {
    try {
        console.log(`[TOOL] get_schedule_for_date | accountId: ${accountId}, date: ${date}`);
        const student = await Student.findOne({ accountId });
        if (!student) return { error: "Không tìm thấy sinh viên." };

        // AI sẽ luôn gửi date ở định dạng YYYY-MM-DD
        const targetDate = dayjs(date);
        const startOfDay = targetDate.startOf('day').toDate();
        const endOfDay = targetDate.endOf('day').toDate();

        const enrollments = await ScheduleOfStudent.find({ studentId: student._id });
        if (!enrollments.length) return { schedule: [] };
        const classIds = enrollments.map(e => e.classId);

        // Chỉ dùng 1 truy vấn duy nhất (chuẩn)
        const schedules = await Schedule.find({
            classId: { $in: classIds },
            date: { $gte: startOfDay, $lte: endOfDay }
        })
            .populate('subjectId', 'subjectName subjectCode')
            .populate('roomId', 'roomName')
            .populate('lecturerId', 'firstName lastName')
            .sort({ slot: 1 })
            .lean();

        console.log('[TOOL] get_schedule_for_date | schedules found:', schedules.length);
        return { schedule: schedules };
    } catch (e) {
        console.error('[TOOL] get_schedule_for_date | error:', e);
        return { error: e.message };
    }
};

// --- HÀM 2: LẤY LỊCH THEO TUẦN (ĐÃ CHUẨN HÓA) ---
const get_schedule_for_week = async (accountId, date) => {
    try {
        const student = await Student.findOne({ accountId });
        if (!student) return { error: "Không tìm thấy sinh viên." };

        const targetDate = dayjs(date); // AI gửi 1 ngày trong tuần (ví dụ T2)
        const firstDay = targetDate.startOf('week').add(1, 'day').toDate(); // Thứ 2
        const lastDay = targetDate.endOf('week').add(1, 'day').toDate();   // Chủ Nhật

        const enrollments = await ScheduleOfStudent.find({ studentId: student._id });
        if (!enrollments.length) return { schedule: [] };

        const classIds = enrollments.map(e => e.classId);
        const schedules = await Schedule.find({
            classId: { $in: classIds },
            date: { $gte: firstDay, $lte: lastDay }
        })
            .populate('subjectId', 'subjectName subjectCode')
            .populate('roomId', 'roomName')
            .populate('lecturerId', 'firstName lastName')
            .sort({ date: 1, slot: 1 })
            .lean();

        return { schedule: schedules };
    } catch (e) {
        return { error: e.message };
    }
};

// --- HÀM 3: LẤY HỌC PHÍ ---
const get_tuition_fee = async (accountId) => {
    try {
        const student = await Student.findOne({ accountId });
        if (!student) return { error: "Không tìm thấy sinh viên." };

        const tuition = await TuitionFee.findOne({ studentId: student._id, status: 'unpaid' });
        if (!tuition) return { message: "Bạn không có công nợ học phí nào." };

        return { tuition };
    } catch (e) {
        return { error: e.message };
    }
};

// --- HÀM 4: LẤY THÔNG TIN MÔN HỌC ---
const get_subject_info = async (subjectCode) => {
    try {
        const subject = await Subject.findOne({ subjectCode: subjectCode.toUpperCase() });
        if (!subject) return { error: "Không tìm thấy môn học." };
        return { subject: { subjectName: subject.subjectName, subjectCode: subject.subjectCode, subjectNoCredit: subject.subjectNoCredit } };
    } catch (e) {
        return { error: e.message };
    }
};

// --- HÀM 5: LẤY HỒ SƠ SINH VIÊN (SỬA LỖI) ---
const get_student_profile = async (accountId) => {
    try {
        // Chỉ tìm theo accountId (vì AI sẽ luôn có accountId từ token)
        const student = await Student.findOne({ accountId })
            .populate('majorId', 'majorName majorCode')
            .populate('curriculumId', 'curriculumName yearApplied')
            .lean();

        if (!student) {
            return { error: 'Không tìm thấy sinh viên.' };
        }

        const fullName = `${student.lastName} ${student.firstName}`; // Đảo Họ và Tên
        const dob = student.dateOfBirth ? dayjs(student.dateOfBirth).format('DD/MM/YYYY') : null;
        const gender = typeof student.gender === 'boolean' ? (student.gender ? 'Nam' : 'Nữ') : student.gender;

        const profile = {
            studentCode: student.studentCode,
            fullName,
            gender,
            phone: student.phone,
            address: student.address,
            dateOfBirth: dob,
            semesterNo: student.semesterNo || null,
            major: student.majorId ? student.majorId.majorName : null
        };

        // Tạo 1 tóm tắt ngắn gọn
        const summary = `Hồ sơ: ${fullName} - ${student.studentCode}, Ngành: ${profile.major || 'N/A'}, Kỳ: ${profile.semesterNo || 'N/A'}.`;
        return { profile, summary };
    } catch (e) {
        console.error('[TOOL] get_student_profile | error:', e);
        return { error: e.message };
    }
};

// --- HÀM 6: LẤY BẠN CÙNG LỚP ---
const get_classmates_list = async (accountId, className) => {
    try {
        const targetClass = await Class.findOne({ className: className });
        if (!targetClass) return { error: "Không tìm thấy lớp học." };

        const student = await Student.findOne({ accountId });
        const isEnrolled = await ScheduleOfStudent.exists({ studentId: student._id, classId: targetClass._id });
        if (!isEnrolled) return { error: "Bạn không ở trong lớp này." };

        const enrollments = await ScheduleOfStudent.find({ classId: targetClass._id }).populate('studentId', 'firstName lastName studentCode');
        const students = enrollments.map(e => e.studentId);
        return { className: targetClass.className, classmates: students };
    } catch (e) {
        return { error: e.message };
    }
};

// --- HÀM 7: LẤY CÁC MÔN HỌC (CỦA SINH VIÊN) ---
const get_subjects_for_students = async (accountId) => {
    try {
        const student = await Student.findOne({ accountId }).lean();
        if (!student) return { error: 'Không tìm thấy sinh viên.' };
        if (!student.majorId) return { error: 'Sinh viên chưa có ngành/major.' };

        const subjects = await Subject.find({ majorId: student.majorId, status: true })
            .select('subjectName subjectCode subjectNoCredit description')
            .sort({ subjectCode: 1 })
            .lean();
        const summary = `Ngành của bạn có ${subjects.length} môn học.`;
        return { subjects, summary };
    } catch (e) {
        return { error: e.message };
    }
};

// --- BỘ ĐIỀU PHỐI (Giữ nguyên) ---
const toolFunctions = {
    'get_schedule_for_date': get_schedule_for_date,
    'get_schedule_for_week': get_schedule_for_week,
    'get_tuition_fee': get_tuition_fee,
    'get_subject_info': get_subject_info,
    'get_classmates_list': get_classmates_list,
    'get_student_profile': get_student_profile,
    'get_subjects_for_students': get_subjects_for_students,
};

const executeTool = async (toolName, args, accountId) => {
    const tool = toolFunctions[toolName];
    if (!tool) {
        return { error: `Tool "${toolName}" không tồn tại.` };
    }
    try {
        if (toolName === 'get_schedule_for_date') return await tool(accountId, args.date);
        if (toolName === 'get_schedule_for_week') return await tool(accountId, args.date);
        if (toolName === 'get_tuition_fee') return await tool(accountId);
        if (toolName === 'get_subject_info') return await tool(args.subjectCode);
        if (toolName === 'get_classmates_list') return await tool(accountId, args.className);
        if (toolName === 'get_student_profile') return await tool(accountId);
        if (toolName === 'get_subjects_for_students') return await tool(accountId);
    } catch (e) {
        console.error(`Lỗi khi thực thi tool ${toolName}:`, e);
        return { error: `Lỗi khi chạy công cụ ${toolName}.` };
    }
};

module.exports = {
    executeTool
};