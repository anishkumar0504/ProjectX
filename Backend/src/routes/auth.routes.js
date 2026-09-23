const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/auth.controller");
const { authLimiter } = require("../middleware/express-rate-limit"); // adjust path to wherever you define it

// Optional: Uncomment if you are using your validation middleware
// const { validate } = require("../middleware/validate.middleware");
// const { registerSchema, loginSchema } = require("../utils/validators");

// --- Traditional Auth ---
router.post("/register", authLimiter, ctrl.register); // Add validate(registerSchema) if needed
router.post("/login", authLimiter, ctrl.login);        // Add validate(loginSchema) if needed
router.post("/signin", authLimiter, ctrl.login);       // Alias for frontend compatibility

// --- Google OAuth ---
router.post("/google", authLimiter, ctrl.google);

// --- User Session ---
router.get("/me", ctrl.me); // no limiter — normal session polling

// --- Logout ---
router.post("/logout", ctrl.logout);
router.post("/signout", ctrl.logout);  // no limiter needed

module.exports = router;