const express = require('express');
const router = express.Router();
const { handleVnpayCallback, handleVnpayIPN } = require('../controllers/paymentController');

router.get('/vnpay_return', handleVnpayCallback);
router.get('/vnpay_ipn', handleVnpayIPN);


module.exports = router;