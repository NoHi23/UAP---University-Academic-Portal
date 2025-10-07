const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/authorization');
const {
  // STUDENT
  createStudentAccount, getStudentById, listStudents, updateStudent, deleteStudent,
  // LECTURER
  createLecturerAccount, getLecturerById, listLecturers, updateLecturer, deleteLecturer
} = require('../controllers/staff');

router.use(verifyToken, authorize('staff', 'admin'));

router.route('/students')
  .post(createStudentAccount)
  .get(listStudents);
router.route('/students/:id')
  .get(getStudentById)
  .put(updateStudent)
  .delete(deleteStudent);

router.route('/lecturers')
  .post(createLecturerAccount)
  .get(listLecturers);
router.route('/lecturers/:id')
  .get(getLecturerById)
  .put(updateLecturer)
  .delete(deleteLecturer);

module.exports = router;