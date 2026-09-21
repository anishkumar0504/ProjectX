const express = require("express");
const router = express.Router();
const cleanupController = require("../controllers/cleanup.controller");

// ⚠️ WARNING: For your trial phase, this is open. 
// When you add multi-user auth later, wrap this in an `adminAuth` middleware!
router.post("/cleanup-temp", cleanupController.cleanupTempUploads);

module.exports = router;