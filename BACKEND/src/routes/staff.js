const express = require('express');
const router = express.Router();
const { verifyToken, authorize } = require('../middleware/authorization');

const { createMaterial, getAllMaterials, updateMaterial, deleteMaterial } = require('../controllers/material');
const { getAllRequests, updateRequest } = require('../controllers/requestController');
const { createSlotNotification } = require('../controllers/notificationController');

const { getAllSemesters } = require('../controllers/semesterController');
const { getAllMajors } = require('../controllers/majorController');


router.use(verifyToken, authorize('staff', 'admin', 'lecturer'));

router.route('/materials')
    .post(authorize('staff', 'admin'), createMaterial)
    .get(getAllMaterials);
router.route('/materials/:id')
    .put(authorize('staff', 'admin'), updateMaterial)
    .delete(authorize('staff', 'admin'), deleteMaterial);

router.route('/requests')
    .get(authorize('staff', 'admin'), getAllRequests);
router.route('/requests/:id')
    .put(authorize('staff', 'admin'), updateRequest);


router.post('/notifications/slots', createSlotNotification);

router.get('/semesters', getAllSemesters);
router.get('/majors', getAllMajors);

module.exports = router;