const router = require("express").Router();
router.use("/auth", require("./auth.routes"));
router.use("/templates", require("./template.routes"));
router.use("/documents", require("./document.routes"));
router.get("/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
router.use("/sections", require("./section.routes"));
module.exports = router;