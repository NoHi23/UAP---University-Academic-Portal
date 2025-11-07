const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/authorization');

// Import từ studentController
const {
  getMyWeeklySchedule,
  getMyClassmates,
  getProfile,
  updateProfile,
  getGradesReport,
  getTranscript,
  getExamSchedule,
  getAttendanceSummary
} = require('../controllers/student'); // Giả sử tên file là studentController.js

// Import từ các controller khác
const { getStudentMaterials } = require('../controllers/material');
const { submitRequest, getMyRequests } = require('../controllers/requestController');
const { getEvaluableClasses, submitEvaluation } = require('../controllers/evaluationController');
const { getMySlotNotifications, getNotificationsForSlot, getMyRequestNotifications, getAllNotifications } = require('../controllers/notificationController');

// Import từ paymentController (Logic mới)
const {
  getMyTuitionFees,
  getMyTransactionHistory,
  createPaymentUrl
} = require('../controllers/paymentController');

// Bảo vệ tất cả các route
router.use(verifyToken, authorize('student'));

// === TUITION & PAYMENT (LOGIC MỚI) ===
router.get('/tuition/my-fees', getMyTuitionFees);
router.get('/tuition/transactions', getMyTransactionHistory);
router.post('/tuition/create-payment-url', createPaymentUrl); // Sử dụng tên hàm chuẩn

// === SCHEDULE & EXAMS ===
router.get('/schedules/my-week', getMyWeeklySchedule);
router.get('/exams', getExamSchedule);

// === PROFILE & GRADES ===
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/grades', getGradesReport);
router.get('/transcript', getTranscript);

// === OTHER ===
router.get('/materials/me', getStudentMaterials);
router.post('/requests', submitRequest);
router.get('/requests/me', getMyRequests);
router.get('/evaluations/classes-to-review', getEvaluableClasses);
router.post('/evaluations', submitEvaluation);
router.get('/notifications/slots', getMySlotNotifications);
router.get('/notifications/requests', getMyRequestNotifications);
router.get('/notifications', getAllNotifications);
router.get('/classes/:classId/classmates', getMyClassmates);
router.get('/notifications/slot/:scheduleId', getNotificationsForSlot);
// Attendance summary grouped by semester
router.get('/attendance/summary', getAttendanceSummary);

module.exports = router;