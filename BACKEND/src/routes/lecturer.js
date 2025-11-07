const express = require('express');
const { verifyToken, authorize } = require('../middleware/authorization');

// ✅ Import toàn bộ controller 1 lần
const lecturerController = require('../controllers/lecturer');
// allow lecturers to query subjects (read-only) via MaterialManagerController
const { getSubjects, getSubjectById } = require('../controllers/MaterialManagerController');
const { getMySlotNotificationsForLecturer } = require('../controllers/notificationController');

const lecturerRouter = express.Router();

// ================== CLASSES & STUDENTS ==================
lecturerRouter.get('/classes', verifyToken, lecturerController.getClasses);
// GET /lecturer/subjects - allow logged-in lecturers to list subjects (read-only)
lecturerRouter.get('/subjects', verifyToken, getSubjects);
// GET /lecturer/subjects/:id - allow logged-in lecturers to view subject details (read-only)
lecturerRouter.get('/subjects/:id', verifyToken, getSubjectById);

lecturerRouter.get('/studentsbyclass/:classId', verifyToken, lecturerController.getStudentsByClass);
lecturerRouter.get('/studentsbyclass/:classId', verifyToken, lecturerController.getStudentsByClass);

// ================== SCHEDULE ==================
lecturerRouter.post('/schedules/my-week', verifyToken, lecturerController.getMyWeeklySchedule);
lecturerRouter.get('/schedules/:id', verifyToken, lecturerController.getScheduleById);
lecturerRouter.get('/semesters', verifyToken, lecturerController.getSemesters);
lecturerRouter.get('/semester-options', verifyToken, lecturerController.getSemesterOptions);
lecturerRouter.get('/classes-by-semester', verifyToken, lecturerController.getClassesBySemester);

// ================== PROFILE ==================
lecturerRouter.get('/profile', verifyToken, lecturerController.getMyProfile);
lecturerRouter.put('/profile', verifyToken, lecturerController.updateMyProfile);

// ================== ATTENDANCE ==================
lecturerRouter.post('/attendance/mark', verifyToken, lecturerController.markAttendance);
lecturerRouter.get('/attendance/summary', verifyToken, lecturerController.getAttendanceSummary);

// ================== NOTIFICATIONS ==================
lecturerRouter.get('/notifications/slots', verifyToken, lecturerController.getNotificationsBySchedule);
lecturerRouter.post('/notifications/slots', verifyToken, lecturerController.createNotificationForSchedule);

// ================== SUPPORT ==================
lecturerRouter.post('/supports', verifyToken, lecturerController.createLecturerSupport);
lecturerRouter.get('/supports', verifyToken, lecturerController.getMySupports);

// ================== EXTRA ==================
lecturerRouter.get(
  '/notifications/my-slots',
  verifyToken,
  authorize('lecturer', 'staff', 'admin'),
  getMySlotNotificationsForLecturer
);

module.exports = lecturerRouter;
