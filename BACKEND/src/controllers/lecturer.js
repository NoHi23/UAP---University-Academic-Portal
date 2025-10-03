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
}
module.exports = lecturerController;
