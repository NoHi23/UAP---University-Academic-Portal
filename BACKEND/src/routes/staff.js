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
//STUDENT
staffRouter.post('/accounts/students', createStudentAccount);
staffRouter.get('/student/:id', getStudentById)
staffRouter.get('/students', listStudents)
staffRouter.put('/student/:id', updateStudent)
staffRouter.delete('/student/:id', deleteStudent)
//LECTURER
staffRouter.post('/accounts/lecturers', createLecturerAccount);
staffRouter.get('/lecturer/:id', getLecturerById)
staffRouter.get('/lecturers', listLecturers)
staffRouter.put('/lecturer/:id', updateLecturer)
staffRouter.delete('/lecturer/:id', deleteLecturer)


module.exports = staffRouter