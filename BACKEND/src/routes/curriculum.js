const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/authorization');
const ctrl = require('../controllers/curriculum');

// Allow any authenticated user (students) to view curriculums
router.use(verifyToken);

router.get('/', ctrl.getAllCurriculums);
// get curriculum details associated to a subject (must be before ':id' so route matching works)
router.get('/by-subject', ctrl.getCurriculumDetailsBySubject);
router.get('/:id', ctrl.getCurriculumById);
router.get('/:id/details', ctrl.getCurriculumDetails);
// get curriculum details associated to a subject
router.get('/by-subject', ctrl.getCurriculumDetailsBySubject);

module.exports = router;
