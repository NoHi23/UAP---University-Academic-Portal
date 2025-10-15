const express = require('express')
const { verifyToken, authorize } = require('../middleware/authorization');
const lecturerController = require('../controllers/lecturer');
const lecturerRouter = express.Router();
const {
  getMyWeeklySchedule,
  getAttendanceForSchedule,
  updateAttendance
} = require('../controllers/lecturer');

lecturerRouter.get('/classes', verifyToken, lecturerController.getClasses);
lecturerRouter.get('/studentsbyclass/:classId', verifyToken, lecturerController.getStudentsByClass);
lecturerRouter.get('/schedules/my-week', getMyWeeklySchedule);


lecturerRouter.get('/schedules/:scheduleId/attendance', getAttendanceForSchedule);
lecturerRouter.post('/schedules/:scheduleId/attendance', updateAttendance);

module.exports = lecturerRouter