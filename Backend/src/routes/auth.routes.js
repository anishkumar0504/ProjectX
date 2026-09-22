const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/auth.controller");

// Optional: Uncomment if you are using your validation middleware
// const { validate } = require("../middleware/validate.middleware");
// const { registerSchema, loginSchema } = require("../utils/validators");

// --- Traditional Auth ---
router.post("/register", ctrl.register); // Add validate(registerSchema) if needed
router.post("/login", ctrl.login);       // Add validate(loginSchema) if needed
router.post("/signin", ctrl.login);      // Alias for frontend compatibility

// --- Google OAuth ---
router.post("/google", ctrl.google);

// --- User Session ---
router.get("/me", ctrl.me);

// --- Logout ---
router.post("/logout", ctrl.logout);
router.post("/signout", ctrl.logout);    // Alias for frontend compatibility

module.exports = router;