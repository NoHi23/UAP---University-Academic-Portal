// src/routes/major.js
const express = require("express");
const router = express.Router();
const { verifyToken, authorize } = require("../middleware/authorization");
const ctrl = require("../controllers/majorAdminController"); 

// Admin quản lý major
router.get("/", verifyToken, authorize("admin"), ctrl.listMajors);
router.post("/", verifyToken, authorize("admin"), ctrl.createMajor);
router.put("/:id", verifyToken, authorize("admin"), ctrl.updateMajor);
router.delete("/:id", verifyToken, authorize("admin"), ctrl.deleteMajor);
router.patch("/:id/toggle", verifyToken, authorize("admin"), ctrl.toggleMajorStatus);

module.exports = router;
