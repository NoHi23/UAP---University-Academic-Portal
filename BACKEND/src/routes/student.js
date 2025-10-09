const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/authorization');

const { getStudentMaterials } = require('../controllers/material');
const studentController = require('../controllers/student');
const { createPaymentUrl, getTransactionHistory } = require('../controllers/paymentController');
const { submitRequest, getMyRequests } = require('../controllers/requestController');
const { getEvaluableClasses, submitEvaluation } = require('../controllers/evaluationController');
const { getMySlotNotifications } = require('../controllers/notificationController');

router.use(verifyToken, authorize('student'));

router.get('/materials/me', getStudentMaterials);

// Student-specific endpoints
router.get('/profile', studentController.getProfile);
router.put('/profile', studentController.updateProfile);
router.get('/timetable', studentController.getTimetable);
router.get('/exam-schedule', studentController.getExamSchedule);
router.get('/grades', studentController.getGradesReport); // optional query ?semesterNo=
router.get('/transcript', studentController.getTranscript);
router.get('/classes', studentController.getClassList);

router.post('/tuition/create-payment-url', createPaymentUrl);
router.get('/transactions/me', getTransactionHistory);

router.post('/requests', submitRequest);
router.get('/requests/me', getMyRequests);

router.get('/evaluations/classes-to-review', getEvaluableClasses);
router.post('/evaluations', submitEvaluation);

router.get('/notifications/slots', getMySlotNotifications);



module.exports = router;