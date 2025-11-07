const express = require('express');
const router = express.Router();

const accountRouter = require('./account');
const announcementRouter = require('./announcement');
const studentRouter = require('./student');
const lecturerRouter = require('./lecturer');
const staffRouter = require('./staff');
const userManagementRouter = require('./userManagement');
const paymentRouter = require('./payment');
const supportRouter = require('./support')
const majorRouter = require('./major')
const curriculumRouter = require('./curriculum');
const schedulingRouter = require('./scheduling');
const absenceRouter = require('./absenceRequest');
const attendanceRouter = require('./attendance');
const notificationRouter = require('./notification');
const aiRouter = require('./ai');
const adminRouter = require("./adminManagement");
const examScheduleRouter = require('./examSchedule');
const curriculumManagementRouter = require('./curriculumManagement');  

router.use("/api/manage/curriculums", curriculumManagementRouter); 
router.use('/api/exam-schedule', examScheduleRouter);
router.use("/api/manage/admin", adminRouter);
router.use("/api/absence", absenceRouter);
router.use("/api/attendance", attendanceRouter);
router.use('/api/absence', absenceRouter);
router.use('/api/account', accountRouter);
router.use('/api/curriculums', curriculumRouter);
router.use('/api/announcements', announcementRouter);
router.use('/api/student', studentRouter);
router.use('/api/lecturer', lecturerRouter);
router.use('/api/staff', staffRouter);
router.use('/api/manage/users', userManagementRouter);
router.use('/api/support', supportRouter);
router.use('/api/major', majorRouter);
router.use('/api/curriculums', curriculumRouter);
router.use('/api/scheduling', schedulingRouter);
router.use('/api/notifications', notificationRouter);
router.use('/api/ai', aiRouter);
router.use('/api/payment', paymentRouter);

module.exports = router;