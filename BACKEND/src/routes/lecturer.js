const express = require('express')
const { verifyToken, authorize } = require('../middleware/authorization');
const lecturerController = require('../controllers/lecturer');
const lecturerRouter = express.Router();


lecturerRouter.get('/classes', verifyToken, lecturerController.getClasses);
lecturerRouter.get('/studentsbyclass/:classId', verifyToken, lecturerController.getStudentsByClass);
// Lecturers: get evaluations for themselves
lecturerRouter.get('/evaluations', verifyToken, authorize('lecture'), lecturerController.getEvaluationsForLecturer);


module.exports = lecturerRouter