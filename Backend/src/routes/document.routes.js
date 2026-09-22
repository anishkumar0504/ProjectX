const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/document.controller");
const { uploadDocumentFiles } = require("../middleware/upload.middleware");
const { validate } = require("../middleware/validate.middleware");
const { generateDocSchema } = require("../utils/validators");

// ✅ 1. UNCOMMENTED: Import the auth middleware
const auth = require("../middleware/auth.middleware"); 

// Generate Document
router.post(
  "/generate",
  auth, // ✅ 2. APPLIED HERE ONLY: Protects credit deduction and ensures req.user is set
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

// ✅ DOWNLOAD ROUTE (Left public as requested)
router.get(
  "/:id/download",
  auth,
  ctrl.download
);

// ✅ LIST & GET ROUTES (Left public as requested)
router.get("/", ctrl.list);
router.get("/:id", ctrl.get);

module.exports = router;