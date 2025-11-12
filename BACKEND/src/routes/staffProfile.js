const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/authorization');
const { getProfile, updateProfile } = require('../controllers/staffProfile');

router.use(verifyToken, authorize('staff'));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

module.exports = router;
