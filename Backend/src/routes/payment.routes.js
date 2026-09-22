const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/payment.controller");
const auth = require("../middleware/auth.middleware");

// Public — frontend replaces hardcoded SUBSCRIPTION_CONFIG with this
router.get("/plans", ctrl.getPlans);

router.post("/create-order", auth, ctrl.createOrder);
router.post("/verify", auth, ctrl.verifyPayment);

// IMPORTANT: needs the raw request body (for signature verification), so it must
// bypass your global express.json() parser. Either:
//  (a) mount this route in app.js BEFORE app.use(express.json()), or
//  (b) apply express.raw() only to this path, as done below.
router.post("/webhook", express.raw({ type: "application/json" }), ctrl.webhook);

module.exports = router;