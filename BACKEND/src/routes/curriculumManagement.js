const router = require("express").Router();
const { verifyToken, authorize } = require("../middleware/authorization");
const curriculumCtrl = require("../controllers/curriculumController");  // Import the curriculum controller

// Curriculum Routes

router.post("/curriculums", verifyToken, authorize("admin"), curriculumCtrl.createCurriculum);
router.put("/curriculums/:id", verifyToken, authorize("admin"), curriculumCtrl.updateCurriculum);
router.delete("/curriculums/:id", verifyToken, authorize("admin"), curriculumCtrl.deleteCurriculum);

// Curriculum Detail Routes

router.post("/curriculums/details", verifyToken, authorize("admin"), curriculumCtrl.createCurriculumDetail);
router.put("/curriculums/details/:id", verifyToken, authorize("admin"), curriculumCtrl.updateCurriculumDetail);
router.delete("/curriculums/details/:id", verifyToken, authorize("admin"), curriculumCtrl.deleteCurriculumDetail);

module.exports = router;
