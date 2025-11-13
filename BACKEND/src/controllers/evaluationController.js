const Evaluation = require('../models/evaluationModel');
const Student = require('../models/student');
const ScheduleOfStudent = require('../models/scheduleOfStudent');
const Class = require('../models/class');
const Schedule = require('../models/schedule'); 
const mongoose = require('mongoose');
const Lecturer = require('../models/lecturer');


const getEvaluableClasses = async (req, res) => {
    try {
        const student = await Student.findOne({ accountId: req.user.id });
        if (!student) return res.status(404).json({ message: 'Không tìm thấy sinh viên.' });

        const enrollments = await ScheduleOfStudent.find({ studentId: student._id })
            .populate({
                path: 'classId',
                select: 'className subjectId lecturerId',
                populate: [
                    { path: 'subjectId', select: 'subjectName subjectCode' },
                    { path: 'lecturerId', select: 'firstName lastName' }
                ]
            });

        if (!enrollments.length) {
            return res.status(200).json({ success: true, data: [] });
        }

        const validClassIds = enrollments
            .map(e => e.classId)
            .filter(Boolean) 
            .map(c => c._id);

        const submittedEvals = await Evaluation.find({
            studentId: student._id,
            classId: { $in: validClassIds }
        }).select('classId').lean();

        const submittedClassIds = new Set(submittedEvals.map(e => e.classId.toString()));

        const toDoList = enrollments
            .filter(e => e.classId && !submittedClassIds.has(e.classId._id.toString()))
            .map(e => e.classId); 

        res.status(200).json({ success: true, data: toDoList });

    } catch (error) {
        console.error("Lỗi khi lấy danh sách cần đánh giá:", error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

const submitEvaluation = async (req, res) => {
    try {
        const { classId, criteria_knowledge, criteria_teaching, criteria_respect, comment } = req.body;

        if (!classId || !criteria_knowledge || !criteria_teaching || !criteria_respect) {
            return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin.' });
        }

        const student = await Student.findOne({ accountId: req.user.id });
        if (!student) return res.status(404).json({ message: 'Không tìm thấy sinh viên.' });

        const schedule = await Schedule.findOne({ classId: classId });
        if (!schedule) {
            return res.status(404).json({ message: 'Lỗi: Không tìm thấy thông tin lịch học của lớp này.' });
        }

        const newEvaluation = {
            studentId: student._id,
            classId: classId,
            lecturerId: schedule.lecturerId,
            semesterId: schedule.semesterId, 
            criteria_knowledge: Number(criteria_knowledge),
            criteria_teaching: Number(criteria_teaching),
            criteria_respect: Number(criteria_respect),
            comment: comment
        };

        await Evaluation.create(newEvaluation);

        res.status(201).json({ success: true, message: 'Gửi đánh giá thành công. Cảm ơn bạn!' });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Bạn đã đánh giá lớp học này rồi.' });
        }
        console.error("Lỗi khi nộp đánh giá:", error);
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
};

const getMySubmittedEvaluations = async (req, res) => {
    try {
        const student = await Student.findOne({ accountId: req.user.id });
        if (!student) return res.status(404).json({ message: 'Không tìm thấy sinh viên.' });

        const evaluations = await Evaluation.find({ studentId: student._id })
            .populate({
                path: 'classId',
                select: 'className',
                populate: { path: 'subjectId', select: 'subjectCode' }
            })
            .populate('lecturerId', 'firstName lastName')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: evaluations });
    } catch (error) {
        console.error("Lỗi khi lấy lịch sử đánh giá:", error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

const getEvaluationsForLecturer = async (req, res) => {
    try {
        const lecturer = await Lecturer.findOne({ accountId: req.user.id });
        if (!lecturer) return res.status(404).json({ message: 'Không tìm thấy thông tin giảng viên.' });

        const evaluations = await Evaluation.find({ lecturerId: lecturer._id })
            .populate({
                path: 'classId',
                select: 'className',
                populate: { path: 'subjectId', select: 'subjectCode subjectName' }
            })
            .populate('semesterId', 'semesterName')
            .select('-studentId -lecturerId') 
            .sort({ createdAt: -1 });

        let totalKnowledge = 0;
        let totalTeaching = 0;
        let totalRespect = 0;
        const totalEvals = evaluations.length;

        if (totalEvals > 0) {
            for (const ev of evaluations) {
                totalKnowledge += ev.criteria_knowledge;
                totalTeaching += ev.criteria_teaching;
                totalRespect += ev.criteria_respect;
            }
        }

        const summary = {
            totalEvaluations: totalEvals,
            averageKnowledge: totalEvals > 0 ? (totalKnowledge / totalEvals).toFixed(2) : 0,
            averageTeaching: totalEvals > 0 ? (totalTeaching / totalEvals).toFixed(2) : 0,
            averageRespect: totalEvals > 0 ? (totalRespect / totalEvals).toFixed(2) : 0,
        };

        const comments = evaluations
            .filter(ev => ev.comment && ev.comment.trim() !== '')
            .map(ev => ({
                comment: ev.comment,
                class: ev.classId?.className || 'N/A',
                subject: ev.classId?.subjectId?.subjectCode || 'N/A',
                date: ev.createdAt
            }));

        res.status(200).json({ 
            success: true, 
            summary: summary, 
            comments: comments 
        });

    } catch (error) {
        console.error("Lỗi khi lấy đánh giá của giảng viên:", error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

module.exports = {
    getEvaluableClasses,
    submitEvaluation,
    getMySubmittedEvaluations,
    getEvaluationsForLecturer
};

