const express = require('express')
const { verifyToken, authorize } = require('../middleware/authorization');
const lecturerController = require('../controllers/lecturer');
const lecturerRouter = express.Router();
const {
  getMyWeeklySchedule,
  getScheduleById
} = require('../controllers/lecturer');

lecturerRouter.get('/classes', verifyToken, lecturerController.getClasses);
lecturerRouter.get('/studentsbyclass/:classId', verifyToken, lecturerController.getStudentsByClass);
// API lấy lịch giảng dạy theo khoảng ngày bất kỳ
lecturerRouter.post('/schedules/my-week', verifyToken, getMyWeeklySchedule);
// Get schedule detail by id
lecturerRouter.get('/schedules/:id', verifyToken, getScheduleById);
// Lecturers: get evaluations for themselves


module.exports = lecturerRouter