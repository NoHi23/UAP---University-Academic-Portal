const express = require('express');
const router = express.Router();

const accountRouter = require('./account');
const announcementRouter = require('./announcement');
const studentRouter = require('./student');
const lecturerRouter = require('./lecturer');
const staffRouter = require('./staff');
const userManagementRouter = require('./userManagement');
const paymentRouter = require('./payment');

router.use('/api/account', accountRouter);
router.use('/api/announcements', announcementRouter);
router.use('/api/student', studentRouter);
router.use('/api/lecturer', lecturerRouter);
router.use('/api/staff', staffRouter);
router.use('/api/manage/users', userManagementRouter);
router.use('/api/payments', paymentRouter);

module.exports = router;