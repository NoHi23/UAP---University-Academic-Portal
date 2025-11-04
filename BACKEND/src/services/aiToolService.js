const Student = require('../models/student');
const Lecturer = require('../models/lecturer');
const Schedule = require('../models/schedule');
const ScheduleOfStudent = require('../models/scheduleOfStudent');
const Subject = require('../models/subject');
const TuitionFee = require('../models/tuitionFeeModel');
const dayjs = require('dayjs');

const get_schedule_for_date = async (accountId, date) => {
    try {
        console.log(`[TOOL] get_schedule_for_date | accountId: ${accountId}, date: ${date}`);

        if (!date) {
            console.log('[TOOL] get_schedule_for_date | no date provided, using today');
            date = new Date();
        }

        const student = await Student.findOne({ accountId });
        console.log('[TOOL] get_schedule_for_date | student:', student ? String(student._id) : null);
        if (!student) return { error: "Không tìm thấy sinh viên." };

        const targetDate = dayjs(date);
        const startOfDay = targetDate.startOf('day').toDate();
        const endOfDay = targetDate.endOf('day').toDate();
        console.log('[TOOL] get_schedule_for_date | startOfDay:', startOfDay, 'endOfDay:', endOfDay);

        const enrollments = await ScheduleOfStudent.find({ studentId: student._id });
        console.log('[TOOL] get_schedule_for_date | enrollments count:', enrollments.length);
        if (!enrollments.length) return { schedule: [] };

        const classIds = enrollments.map(e => e.classId);

        // Primary query: find schedules whose date is within the day range
        let schedules = await Schedule.find({
            classId: { $in: classIds },
            date: { $gte: startOfDay, $lte: endOfDay }
        })
            .populate('subjectId', 'subjectName subjectCode')
            .populate('roomId', 'roomName')
            .populate('lecturerId', 'firstName lastName')
            .sort({ slot: 1 })
            .lean();

        console.log('[TOOL] get_schedule_for_date | schedules found (range):', schedules.length);

        // Fallback 1: if DB stored date as string 'YYYY-MM-DD', try matching that
        if (!schedules.length) {
            const dateStr = targetDate.format('YYYY-MM-DD');
            console.log('[TOOL] get_schedule_for_date | trying fallback by YYYY-MM-DD string:', dateStr);

            const schedulesByString = await Schedule.find({
                classId: { $in: classIds },
                date: dateStr
            })
                .populate('subjectId', 'subjectName subjectCode')
                .populate('roomId', 'roomName')
                .populate('lecturerId', 'firstName lastName')
                .sort({ slot: 1 })
                .lean();

            console.log('[TOOL] get_schedule_for_date | schedules found (string):', schedulesByString.length);
            if (schedulesByString.length) return { schedule: schedulesByString };

            // Fallback 2: if date is a Date but with timezone offsets, compare date portion using $dateToString
            console.log('[TOOL] get_schedule_for_date | trying fallback using $dateToString');
            const schedulesByDateToString = await Schedule.find({
                classId: { $in: classIds },
                $expr: {
                    $eq: [
                        { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                        dateStr
                    ]
                }
            })
                .populate('subjectId', 'subjectName subjectCode')
                .populate('roomId', 'roomName')
                .populate('lecturerId', 'firstName lastName')
                .sort({ slot: 1 })
                .lean();

            console.log('[TOOL] get_schedule_for_date | schedules found ($dateToString):', schedulesByDateToString.length);
            schedules = schedulesByDateToString;
        }

        return { schedule: schedules };
    } catch (e) {
        console.error('[TOOL] get_schedule_for_date | error:', e);
        return { error: e.message };
    }
};

const get_schedule_for_week = async (accountId, date) => {
    try {
        console.log(`[TOOL] get_schedule_for_week | accountId: ${accountId}, date: ${date}`);
        const student = await Student.findOne({ accountId });
        if (!student) return { error: "Không tìm thấy sinh viên." };

        const targetDate = dayjs(date);
        const firstDay = targetDate.startOf('week').add(1, 'day').toDate(); // Thứ 2
        const lastDay = targetDate.endOf('week').add(1, 'day').toDate();   // Chủ Nhật

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


const get_tuition_fee = async (accountId) => {
    try {
        console.log(`[TOOL] get_tuition_fee | accountId: ${accountId}`);
        const student = await Student.findOne({ accountId });
        if (!student) return { error: "Không tìm thấy sinh viên." };

        const tuition = await TuitionFee.findOne({ studentId: student._id, status: 'unpaid' });
        if (!tuition) return { message: "Bạn không có công nợ học phí nào." };

        return { tuition };
    } catch (e) {
        return { error: e.message };
    }
};

const get_subject_info = async (subjectCode) => {
    try {
        console.log(`[TOOL] get_subject_info | subjectCode: ${subjectCode}`);
        const subject = await Subject.findOne({ subjectCode: subjectCode.toUpperCase() });
        if (!subject) return { error: "Không tìm thấy môn học." };

        return { subject: { subjectName: subject.subjectName, subjectCode: subject.subjectCode, subjectNoCredit: subject.subjectNoCredit } };
    } catch (e) {
        return { error: e.message };
    }
};

const get_student_profile = async (accountId) => {
    try {
        console.log(`[TOOL] get_student_profile | lookup key: ${accountId}`);

        // 1) Try find by accountId (most common)
        let student = await Student.findOne({ accountId })
            .populate('majorId', 'majorName majorCode')
            .populate('curriculumId', 'curriculumName yearApplied')
            .lean();

        // 2) Fallback: maybe caller passed student _id instead of accountId
        if (!student) {
            console.log('[TOOL] get_student_profile | not found by accountId, trying by student _id');
            try {
                student = await Student.findById(accountId)
                    .populate('majorId', 'majorName majorCode')
                    .populate('curriculumId', 'curriculumName yearApplied')
                    .lean();
            } catch (e) {
                console.log('[TOOL] get_student_profile | findById failed (invalid id format)');
            }
        }

        // 3) Fallback: maybe the caller passed studentCode
        if (!student) {
            console.log('[TOOL] get_student_profile | not found by _id, trying by studentCode');
            student = await Student.findOne({ studentCode: accountId })
                .populate('majorId', 'majorName majorCode')
                .populate('curriculumId', 'curriculumName yearApplied')
                .lean();
        }

        if (!student) {
            console.log('[TOOL] get_student_profile | no student matched with given key');
            return { error: 'Không tìm thấy sinh viên.' };
        }

        console.log('[TOOL] get_student_profile | student found:', student._id);

        const fullName = `${student.firstName} ${student.lastName}`;
        const dob = student.dateOfBirth ? dayjs(student.dateOfBirth).format('YYYY-MM-DD') : null;
        const gender = typeof student.gender === 'boolean' ? (student.gender ? 'Nam' : 'Nữ') : student.gender;

        const profile = {
            studentCode: student.studentCode,
            fullName,
            firstName: student.firstName,
            lastName: student.lastName,
            citizenID: student.citizenID,
            gender,
            phone: student.phone,
            address: student.address,
            dateOfBirth: dob,
            semester: student.semester || null,
            semesterNo: student.semesterNo || null,
            major: student.majorId ? { majorName: student.majorId.majorName, majorCode: student.majorId.majorCode } : null,
            curriculum: student.curriculumId ? { curriculumName: student.curriculumId.curriculumName, yearApplied: student.curriculumId.yearApplied } : null,
            accountId: student.accountId,
            _id: student._id
        };

        const summaryParts = [];
        if (fullName) summaryParts.push(fullName);
        if (student.studentCode) summaryParts.push(`MSV: ${student.studentCode}`);
        if (profile.major && profile.major.majorName) summaryParts.push(`Ngành: ${profile.major.majorName}`);
        if (profile.curriculum && profile.curriculum.curriculumName) summaryParts.push(`CTĐT: ${profile.curriculum.curriculumName}`);
        if (profile.semester) summaryParts.push(`Học kỳ: ${profile.semester}`);
        if (profile.phone) summaryParts.push(`SĐT: ${profile.phone}`);

        const summary = summaryParts.join(' - ');

        return { profile, summary };
    } catch (e) {
        console.error('[TOOL] get_student_profile | error:', e);
        return { error: e.message };
    }
};

const get_classmates_list = async (accountId, className) => {
    try {
        console.log(`[TOOL] get_classmates_list | className: ${className}`);
        const targetClass = await Class.findOne({ className: className });
        if (!targetClass) return { error: "Không tìm thấy lớp học." };

        // Kiểm tra sinh viên có trong lớp này không
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

const get_subjects_for_students = async (accountId) => {
    try {
        console.log(`[TOOL] get_subjects_for_students | lookup key: ${accountId}`);

        // reuse student lookup logic: try accountId, student _id, or studentCode
        let student = await Student.findOne({ accountId }).lean();
        if (!student) {
            try {
                student = await Student.findById(accountId).lean();
            } catch (e) {
                // ignore invalid id format
            }
        }
        if (!student) {
            student = await Student.findOne({ studentCode: accountId }).lean();
        }

        if (!student) return { error: 'Không tìm thấy sinh viên.' };

        if (!student.majorId) return { error: 'Sinh viên chưa có ngành/major.' };

        const subjects = await Subject.find({ majorId: student.majorId, status: true })
            .select('subjectName subjectCode subjectNoCredit description')
            .sort({ subjectCode: 1 })
            .lean();

        const summary = `Ngành có ${subjects.length} môn học.`;

        return { subjects, summary };
    } catch (e) {
        console.error('[TOOL] get_subjects_for_students | error:', e);
        return { error: e.message };
    }
};

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
        // Tự động điều phối tham số chính xác
        if (toolName === 'get_schedule_for_date') {
            return await tool(accountId, args.date);
        }
        if (toolName === 'get_schedule_for_week') {
            return await tool(accountId, args.date);
        }
        if (toolName === 'get_tuition_fee') {
            return await tool(accountId);
        }
        if (toolName === 'get_subject_info') {
            return await tool(args.subjectCode);
        }
        if (toolName === 'get_classmates_list') {
            return await tool(accountId, args.className);
        }
        if (toolName === 'get_student_profile') {
            return await tool(accountId);
        }
        if (toolName === 'get_subjects_for_students') {
            return await tool(accountId);
        }

    } catch (e) {
        console.error(`Lỗi khi thực thi tool ${toolName}:`, e);
        return { error: `Lỗi khi chạy công cụ ${toolName}.` };
    }
};

module.exports = {
    executeTool
};
