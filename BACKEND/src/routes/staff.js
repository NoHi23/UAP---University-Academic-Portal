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

//HIEUNN

const {
    createMaterial,
    getAllMaterials,
    updateMaterial,
    deleteMaterial
} = require('../controllers/material');

const { createSlotNotification } = require('../controllers/notificationController');

const {
    getAllRequests,
    updateRequest
} = require('../controllers/requestController');

const { protect, authorize } = require('../middleware/authorization');
//HIEUNN
//END 

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


//HIEUNN
staffRouter.use(protect, authorize('staff', 'admin'));

staffRouter.route('/materials')
    .post(createMaterial)
    .get(getAllMaterials);

staffRouter.route('/materials/:id')
    .put(updateMaterial)
    .delete(deleteMaterial);

staffRouter.route('/requests')
    .get(getAllRequests);

staffRouter.route('/requests/:id')
    .put(updateRequest);

router.post('/notifications/slots', protect, authorize('lecturer', 'staff', 'admin'), createSlotNotification);

module.exports = staffRouter