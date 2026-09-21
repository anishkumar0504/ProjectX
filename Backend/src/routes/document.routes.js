const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/document.controller");
const { uploadDocumentFiles } = require("../middleware/upload.middleware");
const { validate } = require("../middleware/validate.middleware");
const { generateDocSchema } = require("../utils/validators");
// const auth = require("../middleware/auth.middleware"); // Uncomment when ready

// Generate Document
router.post(
  "/generate",
  // auth, // ✅ Add this when multi-user auth is ready
  uploadDocumentFiles,
  (req, res, next) => {
    for (const k of ["meta", "sections"]) {
      if (typeof req.body[k] === "string") {
        try { req.body[k] = JSON.parse(req.body[k]); } catch {}
      }
    }
    if (typeof req.body.useGemini === "string") {
      req.body.useGemini = req.body.useGemini === "true";
    }
    next();
  },
  validate(generateDocSchema, "body"),
  ctrl.generate
);

// ✅ DOWNLOAD ROUTE
router.get(
  "/:id/download",
  // auth, // ✅ Add this when multi-user auth is ready
  ctrl.download
);

router.get("/", ctrl.list);
router.get("/:id", ctrl.get);

module.exports = router;