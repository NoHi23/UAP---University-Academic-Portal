// routes/stats.js
const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/stats');
const { verifyToken, authorize } = require('../middleware/authorization');

// Bảo vệ route (chỉ staff/lecturer/admin được xem dashboard)
router.get('/dashboard', verifyToken, authorize('staff'), getDashboardStats);

module.exports = router;
