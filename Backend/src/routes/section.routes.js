const express = require("express");
const router = express.Router();
const sectionController = require("../controllers/section.controller");
const auth = require("../middleware/auth.middleware");

router.get("/available", sectionController.getAvailableSections);
router.get("/template/:templateId", sectionController.getTemplateSections);
router.post("/document/:documentId/configure", sectionController.updateDocumentSections);
router.post("/document/:documentId/custom-section", sectionController.addCustomSection);

module.exports = router;