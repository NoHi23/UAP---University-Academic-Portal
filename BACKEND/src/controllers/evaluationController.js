const Evaluation = require('../models/evaluationModel');
const Student = require('../models/student');
const Class = require('../models/class');
const Grade = require('../models/grade');

const getEvaluableClasses = async (req, res) => {
    try {
        const student = await Student.findOne({ accountId: req.user.id });
        if (!student) {
            return res.status(404).json({ message: 'Không tìm thấy sinh viên.' });
        }

        const subjectsWithGrades = await Grade.distinct('subjectId', { studentId: student._id });

        const potentialClasses = await Class.find({ subjectId: { $in: subjectsWithGrades } });
        const potentialClassIds = potentialClasses.map(c => c._id);

        const evaluatedClasses = await Evaluation.distinct('classId', { studentId: student._id });

        const classesToReviewIds = potentialClassIds.filter(classId => !evaluatedClasses.some(evaluatedId => evaluatedId.equals(classId)));

        const classesToReview = await Class.find({ _id: { $in: classesToReviewIds } })
            .populate('subjectId', 'subjectName subjectCode')
            .populate('lecturerId', 'firstName lastName');

        res.status(200).json({ success: true, count: classesToReview.length, data: classesToReview });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi máy chủ', error: error.message });
    }
};

const submitEvaluation = async (req, res) => {
    try {
        const student = await Student.findOne({ accountId: req.user.id });
        if (!student) {
            return res.status(404).json({ message: 'Không tìm thấy sinh viên.' });
        }

        const { classId, criteria, comment } = req.body;

        const classInfo = await Class.findById(classId);
        if (!classInfo) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học này.' });
        }

        const newEvaluation = await Evaluation.create({
            studentId: student._id,
            lecturerId: classInfo.lecturerId, 
            classId: classId,
            criteria,
            comment
        });

        res.status(201).json({ success: true, message: 'Cảm ơn bạn đã gửi đánh giá!', data: newEvaluation });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Bạn đã đánh giá lớp học này rồi.' });
        }
        res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', error: error.message });
    }
};

module.exports = {
    getEvaluableClasses,
    submitEvaluation
};

// Lecturers: view evaluations submitted about them (anonymized)
const getEvaluationsForLecturer = async (req, res) => {
    try {
        // Resolve lecturer document from account id (req.user.id)
        const Lecturer = require('../models/lecturer');
        const lecturer = await Lecturer.findOne({ accountId: req.user.id });
        if (!lecturer) return res.status(403).json({ success: false, message: 'Lecturer profile not found or unauthorized' });

        // Find evaluations for this lecturer
        const evaluations = await Evaluation.find({ lecturerId: lecturer._id })
            .sort({ createdAt: -1 })
            .populate({ path: 'classId', select: 'className subjectId' })
            .lean();

        // Map to anonymized shape: do NOT include studentId or any identifiable student info
        const anonymized = evaluations.map(ev => ({
            _id: ev._id,
            classId: ev.classId ? { _id: ev.classId._id, className: ev.classId.className, subjectId: ev.classId.subjectId } : null,
            criteria: ev.criteria || [],
            comment: ev.comment || '',
            createdAt: ev.createdAt
        }));

        return res.status(200).json({ success: true, count: anonymized.length, data: anonymized });
    } catch (err) {
        console.error('getEvaluationsForLecturer error', err);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ', error: err.message });
    }
};

module.exports = Object.assign(module.exports, { getEvaluationsForLecturer });