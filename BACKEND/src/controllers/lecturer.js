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
  try {
    const lecturer = await Lecturer.findOne({ accountId: req.user.id });
    if (!lecturer) {
      return res.status(404).json({ message: "Không tìm thấy thông tin giảng viên." });
    }

    // Xác định ngày bắt đầu và kết thúc của tuần hiện tại
    const now = new Date();
    const firstDay = new Date(now.setDate(now.getDate() - now.getDay() + 1)); // Lấy ngày thứ Hai
    const lastDay = new Date(now.setDate(now.getDate() - now.getDay() + 7)); // Lấy ngày Chủ Nhật
    firstDay.setHours(0, 0, 0, 0);
    lastDay.setHours(23, 59, 59, 999);

    const schedules = await Schedule.find({
      lecturerId: lecturer._id,
      date: { $gte: firstDay, $lte: lastDay }
    })
      .populate('subjectId', 'subjectName subjectCode')
      .populate('classId', 'className')
      .populate('roomId', 'roomName')
      .sort({ date: 1, slot: 1 });

    // Map lại dữ liệu để trả về lecturer info (vì model Schedule không có)
    const responseData = schedules.map(s => ({
      ...s.toObject(),
      lecturer: { // Thêm thông tin giảng viên để frontend dễ tái sử dụng component
        _id: lecturer._id,
        firstName: lecturer.firstName,
        lastName: lecturer.lastName
      }
    }));

    res.status(200).json({ success: true, data: responseData });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ', error: error.message });
  }
};

const getAttendanceForSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const schedule = await Schedule.findById(scheduleId)
      .populate('subjectId', 'subjectName')
      .populate('classId', 'className');

    if (!schedule) {
      return res.status(404).json({ message: 'Không tìm thấy buổi học.' });
    }

    const studentEnrollments = await ScheduleOfStudent.find({ classId: schedule.classId })
      .populate('studentId', 'firstName lastName studentCode');

    const studentsWithStatus = studentEnrollments.map(enrollment => {
      const attendanceRecord = enrollment.attendance.find(att => att.scheduleId.equals(scheduleId));
      return {
        _id: enrollment.studentId._id,
        firstName: enrollment.studentId.firstName,
        lastName: enrollment.studentId.lastName,
        studentCode: enrollment.studentId.studentCode,
        status: attendanceRecord ? attendanceRecord.status : 'Not Yet'
      };
    });

    res.status(200).json({
      success: true,
      scheduleInfo: schedule,
      students: studentsWithStatus
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ', error: error.message });
  }
};


const updateAttendance = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { attendance } = req.body; // attendance is an array: [{ studentId, status }, ...]

    if (!attendance || !Array.isArray(attendance)) {
      return res.status(400).json({ message: 'Dữ liệu điểm danh không hợp lệ.' });
    }

    const bulkOperations = attendance.map(item => ({
      updateOne: {
        filter: {
          studentId: item.studentId,
          'attendance.scheduleId': scheduleId
        },
        update: {
          $set: { 'attendance.$.status': item.status }
        }
      }
    }));

    // Thực hiện nhiều cập nhật cùng lúc
    await ScheduleOfStudent.bulkWrite(bulkOperations);

    // Tự động điểm danh cho giảng viên
    const lecturer = await Lecturer.findOne({ accountId: req.user.id });
    await ScheduleOfLecture.updateOne(
      { lecturerId: lecturer._id, scheduleId: scheduleId },
      { $set: { attendance: true } }
    );

    res.status(200).json({ success: true, message: 'Cập nhật điểm danh thành công.' });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ', error: error.message });
  }
};

module.exports = {
  getMyWeeklySchedule,
  getAttendanceForSchedule,
  updateAttendance,
  getStudentsByClass,
  getClasses
};

