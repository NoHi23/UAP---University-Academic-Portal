const express = require('express');
const { createPaymentUrl } = require('../controllers/paymentController');

router.post('/tuition/create-payment-url', protect, authorize('student'), createPaymentUrl);

const { vnpayIpnHandler, vnpayReturnHandler, getTransactionHistory } = require('../controllers/paymentController');
const { submitRequest, getMyRequests } = require('../controllers/requestController');
const { getEvaluableClasses, submitEvaluation } = require('../controllers/evaluationController');
const { getMySlotNotifications } = require('../controllers/notificationController');

router.get('/vnpay_ipn', vnpayIpnHandler);
router.get('/vnpay_return', vnpayReturnHandler);

const router = express.Router();
const { getStudentMaterials } = require('../controllers/material');
const { protect, authorize } = require('../middleware/authorization');

router.get('/materials/me', protect, authorize('student'), getStudentMaterials);
router.get('/transactions/me', protect, authorize('student'), getTransactionHistory);

router.route('/requests').post(protect, authorize('student'), submitRequest);

router.route('/requests/me').get(protect, authorize('student'), getMyRequests);


router.get('/evaluations/classes-to-review', protect, authorize('student'), getEvaluableClasses);
router.post('/evaluations', protect, authorize('student'), submitEvaluation);

router.get('/notifications/slots', protect, authorize('student'), getMySlotNotifications);


module.exports = router;