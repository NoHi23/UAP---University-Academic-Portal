const router = require("express").Router();
const { verifyToken, authorize } = require("../middleware/authorization");
const ctrl = require("../controllers/absenceRequestController");

router.use(verifyToken);

router.get("/semesters", authorize("student", "staff"), ctrl.getAllSemesters);


router.post("/", authorize("student"), ctrl.submitAbsenceRequest);
router.get("/me", authorize("student"), ctrl.getMyAbsenceRequests);
router.get("/", authorize("staff", "admin"), ctrl.getAllAbsences);
router.put("/:id/review", authorize("staff", "admin"), ctrl.reviewAbsenceRequest);
router.get("/:id", authorize("staff", "admin"), ctrl.getAbsenceById);


module.exports = router;
