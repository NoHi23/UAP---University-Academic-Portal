const express = require('express')
const {
    //STUDENT
    createStudentAccount,
    getStudentById,
    listStudents,
    updateStudent,
    deleteStudent,
    //LECTURER
    createLecturerAccount,
    getLecturerById,
    listLecturers,
    updateLecturer,
    deleteLecturer } = require('../controllers/staff');
const staffRouter = express.Router();
const { verifyToken, authorize } = require('../middleware/authorization');
//STUDENT
staffRouter.post('/accounts/students', createStudentAccount);
staffRouter.get('/student/:id', verifyToken, authorize('staff', 'admin'), getStudentById)
staffRouter.get('/students', listStudents)
staffRouter.put('/student/:id', verifyToken, authorize('staff', 'admin'), updateStudent)
staffRouter.delete('/student/:id', verifyToken, authorize('staff', 'admin'), deleteStudent)
//LECTURER
staffRouter.post('/accounts/lecturers', createLecturerAccount);
staffRouter.get('/lecturer/:id', verifyToken, authorize('staff', 'admin'), getLecturerById)
staffRouter.get('/lecturers', listLecturers)
staffRouter.put('/lecturer/:id', verifyToken, authorize('staff', 'admin'), updateLecturer)
staffRouter.delete('/lecturer/:id', verifyToken, authorize('staff', 'admin'), deleteLecturer)


module.exports = staffRouter