const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/authorization');

const {
  createTuitionConfig,
  getTuitionConfigs,
  updateTuitionConfig,
  deleteTuitionConfig,
  generateFees,
  getGeneratedBatches,
  getTuitionFees,
  sendReminder,
  toggleClassVisibility
} = require('../controllers/tuitionController');

// Bảo vệ tất cả các route bên dưới, chỉ Staff mới được truy cập
router.use(verifyToken, authorize('staff'));

// --- Routes cho Bảng giá (Config) ---
router.route('/config')
  .post(createTuitionConfig)
  .get(getTuitionConfigs);

router.route('/config/:id')
  .put(updateTuitionConfig)
  .delete(deleteTuitionConfig);

// --- Routes cho Đợt thu (Batch & Fees) ---
router.post('/generate-fees', generateFees);
router.get('/generated-batches', getGeneratedBatches);

router.get('/fees', getTuitionFees);
router.post('/remind', sendReminder);
router.post('/toggle-class-visibility', toggleClassVisibility);

module.exports = router;  