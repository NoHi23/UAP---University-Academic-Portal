const router = require("express").Router();
const { verifyToken, authorize } = require("../middleware/authorization");
const ctrl = require("../controllers/admin");

// Chỉ admin được quyền thao tác
router.get("/accounts", verifyToken, authorize("admin"), ctrl.listAccounts);
router.post("/accounts", verifyToken, authorize("admin"), ctrl.createAccount);
router.put("/accounts/:id", verifyToken, authorize("admin"), ctrl.updateAccount);
router.delete("/accounts/:id", verifyToken, authorize("admin"), ctrl.deleteAccount);
router.post("/accounts/:id/reset-password", verifyToken, authorize("admin"), ctrl.resetPassword);
router.put("/accounts/:id/toggle-status", verifyToken, authorize("admin"), ctrl.toggleStatus);

module.exports = router;
