const Class =  require('../models/class');
const Lecturer = require('../models/lecturer');
const StudentClass = require('../models/studentClass');
const Schedule = require('../models/schedule');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const lecturerController = {

  // Lấy danh sách lớp học của giảng viên đó dựa vào Schedule
  getClasses: async (req, res) => {
  try {
    const lecturerId = req.user.id;
    // Lấy tất cả schedule có lecturerId là giảng viên hiện tại
    const schedules = await Schedule.find({ lecturerId }).populate('classId');
    // Lấy danh sách class từ schedule (loại bỏ trùng lặp)
    const classMap = {};
    const classes = [];
    schedules.forEach(sch => {
      if (sch.classId && !classMap[sch.classId._id]) {
        classMap[sch.classId._id] = true;
        classes.push(sch.classId);
      }
    });
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error });
  }
},

// Lấy danh sách sinh viên trong lớp học
getStudentsByClass: async (req, res) => {
  try {
    const classId = req.params.classId;
    const students = await StudentClass.find({ classId }).populate('studentId');
    const listStudents = students.map(sc => sc.studentId);
    res.status(200).json(listStudents);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error });
  }
}

,
// GET /api/lecturer/evaluations - danh sách đánh giá cho giảng viên
getEvaluationsForLecturer: async (req, res) => {
  try {
    const lecturerAccountId = req.user.id; // account id from token

    // Try to find lecturer document by accountId
    const lecturer = await Lecturer.findOne({ accountId: lecturerAccountId });
    if (!lecturer) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin giảng viên.' });
    }

    // Do NOT return student-identifying information to lecturers.
    // We project out `studentId` so the lecturer cannot see names or student codes.
    const evaluations = await Evaluation.find({ lecturerId: lecturer._id })
      .select('-studentId') // remove student reference from response
      .populate('classId', 'className subjectId')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: evaluations.length, data: evaluations });
  } catch (error) {
    console.error('Lỗi getEvaluationsForLecturer:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
}
}
module.exports = lecturerController;
