const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/authorization');
const { getMyWeeklySchedule, getMyClassmates } = require('../controllers/student')
const { getStudentMaterials } = require('../controllers/material');
const { createPaymentUrl, getTransactionHistory, getTuitionInfo } = require('../controllers/paymentController');
const { submitRequest, getMyRequests } = require('../controllers/requestController');
const { getEvaluableClasses, submitEvaluation } = require('../controllers/evaluationController');
const { getMySlotNotifications, getNotificationsForSlot } = require('../controllers/notificationController');
const { getProfile, updateProfile, getGradesReport, getTranscript } = require('../controllers/student');
const studentController = require('../controllers/student');

router.use(verifyToken, authorize('student'));
router.get('/schedules/my-week', getMyWeeklySchedule);
router.get('/exams', studentController.getExamSchedule);


// Student profile endpoints (protected)
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

router.get('/materials/me', getStudentMaterials);

// Student grades / transcript
router.get('/grades', getGradesReport);
router.get('/transcript', getTranscript);

router.get('/tuition/me', getTuitionInfo);
router.post('/tuition/create-payment-url', createPaymentUrl);
router.get('/transactions/me', getTransactionHistory);

router.post('/requests', submitRequest);
router.get('/requests/me', getMyRequests);

router.get('/evaluations/classes-to-review', getEvaluableClasses);
router.post('/evaluations', submitEvaluation);

router.get('/notifications/slots', getMySlotNotifications);

router.get('/classes/:classId/classmates', getMyClassmates);

router.get('/notifications/slot/:scheduleId', getNotificationsForSlot);

module.exports = router;