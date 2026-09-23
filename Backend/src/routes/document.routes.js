const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/document.controller");
const { uploadDocumentFiles } = require("../middleware/upload.middleware");
const { validate } = require("../middleware/validate.middleware");
const { generateDocSchema } = require("../utils/validators");
const { generationLimiter } = require("../middleware/express-rate-limit"); // adjust path as needed

const auth = require("../middleware/auth.middleware"); 

// Generate Document
router.post(
  "/generate",
  auth,              // must run first so req.user exists
  generationLimiter, // ✅ throttles AI/generation calls per user or IP
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

// DOWNLOAD ROUTE
router.get(
  "/:id/download",
  auth,
  ctrl.download
);

// LIST & GET ROUTES
router.get("/", ctrl.list);
router.get("/:id", ctrl.get);

module.exports = router;