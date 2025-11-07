const Semester = require('../models/semester');
const Subject = require('../models/subject');
const Room = require('../models/room');
const Curriculum = require('../models/curriculum');
const Major = require('../models/major');
const CurriculumDetail = require('../models/curriculumDetail');

const getAllSemesters = async (req, res) => {
    try {
        const semesters = await Semester.find().sort({ startDate: -1 });
        res.status(200).json({ success: true, data: semesters });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

const getAllSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find().sort({ subjectCode: 1 });
        res.status(200).json({ success: true, data: subjects });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};


const getAllRooms = async (req, res) => {
    try {
        const rooms = await Room.find({ status: true }).sort({ roomCode: 1 });
        res.status(200).json({ success: true, data: rooms });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

const getSubjectsBySemester = async (req, res) => {
    try {
        const { majorId, semesterNo } = req.query;
        if (!majorId || !semesterNo) {
            return res.status(400).json({ message: 'Cần có majorId và semesterNo.' });
        }
        const curriculum = await Curriculum.findOne({ majorId, status: 'active' });
        if (!curriculum) {
            return res.status(200).json({ success: true, data: [] });
        }
        const details = await CurriculumDetail.find({
            curriculumId: curriculum._id,
            semester: Number(semesterNo)
        }).populate('subjectId');

        const subjects = details.map(d => d.subjectId).filter(Boolean);
        res.status(200).json({ success: true, data: subjects });
    } catch (error) {
        console.error("Lỗi khi lọc môn học:", error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

const getAllMajors3 = async (req, res) => {
    try {
        const majors = await Major.find().select('majorName majorCode');
        res.status(200).json({ success: true, data: majors });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};


module.exports = {
    getAllSemesters,
    getAllSubjects,
    getAllRooms,
    getSubjectsBySemester,
    getAllMajors3
};