const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/authorization');
const {
    getStudentAttendanceStatus,
    getClassAttendanceStatus
} = require('../controllers/attendanceController');

// Route for students to check their own attendance status
router.get('/student/:classId',
    verifyToken,
    authorize('student'),
    getStudentAttendanceStatus
);

// Route for lecturers to check attendance status of their class
router.get('/class/:classId',
    verifyToken,
    authorize('lecture', 'staff', 'admin'),
    getClassAttendanceStatus
);

module.exports = router;
