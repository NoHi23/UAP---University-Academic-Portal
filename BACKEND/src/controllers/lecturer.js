const Class = require('../models/class');
const Lecturer = require('../models/lecturer');
const StudentClass = require('../models/studentClass');
const Schedule = require('../models/schedule');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();


const getClasses = async (req, res) => {
  try {
    const lecturerId = req.user.id;
    const schedules = await Schedule.find({ lecturerId }).populate('classId');
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
};

const getStudentsByClass = async (req, res) => {
  try {
    const classId = req.params.classId;
    const students = await StudentClass.find({ classId }).populate('studentId');
    const listStudents = students.map(sc => sc.studentId);
    res.status(200).json(listStudents);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error });
  }
};



const getMyWeeklySchedule = async (req, res) => {
    // Hàm xác định thứ trong tuần từ ngày bất kỳ
    function getDayOfWeek(dateString) {
  const d = new Date(dateString);
  d.setHours(d.getHours() + 7); // Chuyển sang giờ VN
  const daysVN = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return { num: d.getDay(), name: daysVN[d.getDay()] };
    }
  try {
    console.log('DEBUG getMyWeeklySchedule: req.user =', req.user);
    const lecturer = await Lecturer.findOne({ accountId: req.user.id });
    console.log('DEBUG getMyWeeklySchedule: lecturer =', lecturer);
    if (!lecturer) {
      console.log('DEBUG getMyWeeklySchedule: Không tìm thấy giảng viên với accountId', req.user.id);
      return res.status(404).json({ message: "Không tìm thấy thông tin giảng viên." });
    }

    // Cho phép filter tuần bất kỳ qua body from/to (POST), nếu không có thì lấy tuần hiện tại
  let { from, to } = req.body;
  console.log('DEBUG getMyWeeklySchedule: from =', from, 'to =', to);
 
    let firstDay, lastDay;
    if (from && to) {
      firstDay = new Date(from);
      lastDay = new Date(to);
    } else {
      const now = new Date();
      firstDay = new Date(now.setDate(now.getDate() - now.getDay() + 1)); // Thứ 2
      lastDay = new Date(now.setDate(now.getDate() - now.getDay() + 7)); // Chủ nhật
    }
    firstDay.setHours(0, 0, 0, 0);
    lastDay.setHours(23, 59, 59, 999);
    console.log('DEBUG getMyWeeklySchedule: firstDay =', firstDay, 'lastDay =', lastDay);

    const schedules = await Schedule.find({
      lecturerId: lecturer._id,
      date: { $gte: firstDay, $lte: lastDay }
    })
      .populate('subjectId', 'subjectName subjectCode')
      .populate('classId', 'className')
      .populate('roomId', 'roomName roomCode')
      .sort({ date: 1, slot: 1 });
    console.log('DEBUG getMyWeeklySchedule: schedules.length =', schedules.length);

    // Map lại dữ liệu để trả về lecturer info (vì model Schedule không có)
    const responseData = schedules.map(s => ({
      ...s.toObject(),
      lecturer: { // Thêm thông tin giảng viên để frontend dễ tái sử dụng component
        _id: lecturer._id,
        firstName: lecturer.firstName,
        lastName: lecturer.lastName
      }
    }));
    console.log('API /lecturer/schedules/my-week trả về:', { success: true, data: responseData });
    res.status(200).json({ success: true, data: responseData });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ', error: error.message });
  }
};





module.exports = {
  getMyWeeklySchedule,
  
  getStudentsByClass,
  getClasses,
};

// Add getScheduleById if not already present (safe to add at file end)
const getScheduleById = async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const schedule = await Schedule.findById(scheduleId)
      .populate('subjectId', 'subjectName subjectCode')
      .populate({ path: 'classId', populate: { path: 'subjectId', model: 'Subject' } })
      .populate('roomId', 'roomName roomCode')
      .populate('lecturerId', 'firstName lastName email');

    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });

    res.status(200).json({ success: true, data: schedule });
  } catch (error) {
    console.error('Error getScheduleById:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Attach to exports (extend existing exports object)
module.exports.getScheduleById = getScheduleById;

