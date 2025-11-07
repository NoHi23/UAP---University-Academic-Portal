const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/authorization');
const tuitionRouter = require('./tuition'); 
const { createMaterial, getAllMaterials, updateMaterial, deleteMaterial, exportMaterialsExcel } = require('../controllers/material');
const { bulkCreateGradeComponents, exportGradeComponentsExcel, getGradeComponents } = require('../controllers/gradeComponent');
const { getAllRequests, updateRequest } = require('../controllers/requestController');
const { createSlotNotification } = require('../controllers/notificationController');

const { getAllSemesters } = require('../controllers/semesterController');
const { getAllMajors } = require('../controllers/majorController');
const { createSubject, getSubjects, getSubjectById, bulkCreateMaterials, bulkCreateCLOs, bulkCreateSessionMaterials, getCLOs, getSessionMaterials, updateSubject, exportCLOsExcel, exportSessionMaterialsExcel } = require('../controllers/MaterialManagerController');
const { getFilteredStudents, getAllMajors2, getAllLecturers } = require('../controllers/staff');
const { scheduleManualClass } = require('../controllers/schedulingController');

// Export/import grade components
router.get('/grade-components/export-excel', exportGradeComponentsExcel);
router.post('/grade-components/bulk', bulkCreateGradeComponents);
// List grade components (protected)
router.get('/:subjectId/grade-components', authorize('staff', 'admin', 'student'), getGradeComponents);
// Export Excel routes
router.get('/clos/export-excel', exportCLOsExcel);
router.get('/materials/export-excel', exportMaterialsExcel);
router.get('/session-materials/export-excel', exportSessionMaterialsExcel);

const { getEligibleStudentsForManualEnroll, createManualClass, enrollStudentsManually, getAllSemesters2, promoteStudentsBySemester } = require('../controllers/staff')
const {
    getAllSubjects,
    getAllRooms, getSubjectsBySemester, getAllMajors3
} = require('../controllers/semesterController');


const {
    getAllTools,
    createTool,
    updateTool,
    deleteTool
} = require('../controllers/aiToolController');

router.use(verifyToken);


router.get('/manage/users/lecturers', getAllLecturers);
router.route('/materials')
    .post(authorize('staff', 'admin'), createMaterial)
    .get(getAllMaterials);
router.post('/materials/bulk', authorize('staff', 'admin'), bulkCreateMaterials);
router.post('/clos/bulk', authorize('staff', 'admin'), bulkCreateCLOs);
router.post('/session-materials/bulk', authorize('staff', 'admin'), bulkCreateSessionMaterials);
router.get('/clos', getCLOs);
router.get('/session-materials', getSessionMaterials);
router.route('/materials/:id')
    .put(authorize('staff', 'admin'), updateMaterial)
    .delete(authorize('staff', 'admin'), deleteMaterial);

router.route('/requests')
    .get(authorize('staff', 'admin'), getAllRequests);
router.route('/requests/:id')
    .put(authorize('staff', 'admin'), updateRequest);


router.post('/notifications/slots', createSlotNotification);

router.get('/semesters', getAllSemesters);
router.get('/majors', getAllMajors);
// Create subject (used by Material Manager UI) - staff only
router.get('/subjects', authorize('staff', 'admin', 'student'), getSubjects);
router.post('/subjects', authorize('staff', 'admin'), createSubject);
router.put('/subjects/:id', authorize('staff', 'admin','student'), updateSubject);

router.get('/subjects/filter-by-semester', getSubjectsBySemester);

router.get('/subjects/:id', authorize('staff', 'admin', 'student'), getSubjectById);

router.get('/eligible-students', getEligibleStudentsForManualEnroll);
router.post('/classes/manual', createManualClass);
router.post('/classes/:classId/enroll-manual', enrollStudentsManually);
router.get('/subjects2', getAllSubjects);

router.get('/rooms', getAllRooms);

router.route('/ai-tools')
    .get(getAllTools)
    .post(createTool);

router.route('/ai-tools/:id')
    .put(updateTool)
    .delete(deleteTool);

router.get('/semesters2', getAllSemesters2);
router.post('/semesters/promote', promoteStudentsBySemester);
router.get('/students/filter', getFilteredStudents);
router.get('/majors2', getAllMajors2);
router.get('/majors3', getAllMajors3);
router.post('/schedule-manual-class', scheduleManualClass);

router.use('/tuition', tuitionRouter);

module.exports = router;