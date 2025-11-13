const express = require('express');
const router = express.Router();
const { generateSchedule, moveScheduleSlot, filterSchedules } = require('../controllers/schedulingController');
const { verifyToken, authorize } = require('../middleware/authorization');

router.post('/generate', verifyToken, authorize('staff', 'admin'), generateSchedule);
router.put('/schedules/:scheduleId/move', moveScheduleSlot);
router.get('/schedules/filter', filterSchedules);
module.exports = router;