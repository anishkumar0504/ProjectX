const express = require("express");
const router = express.Router();
const { getStats } = require("../controllers/stats.controller");

// GET /api/stats
router.get("/", getStats);

module.exports = router;