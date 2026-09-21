const router = require("express").Router();
const ctrl = require("../controllers/auth.controller");
const { validate } = require("../middleware/validate.middleware");
const { registerSchema, loginSchema } = require("../utils/validators");

// ⚠️  NO auth middleware — testing phase
router.post("/register", validate(registerSchema), ctrl.register);
router.post("/login", validate(loginSchema), ctrl.login);
router.get("/me", ctrl.me);           // still unprotected for testing
router.post("/logout", ctrl.logout);

module.exports = router;