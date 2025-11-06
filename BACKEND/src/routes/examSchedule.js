const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/examScheduleController");
const { verifyToken, authorize } = require("../middleware/authorization");

router.get("/", verifyToken, authorize("staff"), ctrl.getAll);
router.post("/", verifyToken, authorize("staff"), ctrl.createExamSchedule);
router.post("/assign-lecturers", verifyToken, authorize("staff"), ctrl.assignLecturersForUpcomingExams);
router.get("/courses", verifyToken, authorize("staff"), ctrl.getCourseList);
router.get("/rooms", verifyToken, authorize("staff"), ctrl.getRoomList);
router.get("/:id/students", verifyToken, authorize("staff"), ctrl.getStudentsByExamSchedule);  // Lấy sinh viên tham gia kỳ thi

module.exports = router;
