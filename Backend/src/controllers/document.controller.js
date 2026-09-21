const documentService = require("../services/document.service"); // ✅ CRITICAL: This was missing
const fs = require("fs");
const path = require("path");

// ✅ GENERATE DOCUMENT
exports.generate = async (req, res, next) => {
  try {
    // In testing mode (auth disabled), fallback to a test user ID
    const userId = req.user?.id || "test-user-id"; 
    
    const result = await documentService.generate({
      userId,
      body: req.body,
      files: req.files,
    });
    
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

// ✅ LIST DOCUMENTS
exports.list = async (req, res, next) => {
  try {
    const userId = req.user?.id || "test-user-id";
    const docs = await documentService.listForUser(userId);
    res.status(200).json({ documents: docs });
  } catch (err) {
    next(err);
  }
};

// ✅ GET SINGLE DOCUMENT
exports.get = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || "test-user-id";
    const doc = await documentService.getById(id, userId);
    res.status(200).json({ document: doc });
  } catch (err) {
    next(err);
  }
};

// ✅ DOWNLOAD DOCUMENT (Secure & Multi-user ready)
exports.download = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || "test-user-id";
    
    // 1. Fetch document AND verify ownership via the service
    const doc = await documentService.getById(id, userId);
    
    if (doc.status !== "READY" || !doc.outputPath) {
      return res.status(400).json({ message: "Document is still generating or failed" });
    }

    // 2. Resolve absolute path and check if file exists
    const filePath = path.resolve(doc.outputPath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server disk" });
    }

    // 3. Generate a clean, safe filename for the download
    let meta = {};
    try { meta = typeof doc.meta === 'string' ? JSON.parse(doc.meta) : doc.meta; } catch {}
    const safeTitle = (meta.title || "Report").replace(/[^a-z0-9]/gi, "_").substring(0, 30);
    const filename = `${safeTitle}_${doc.id}.docx`;

    // 4. Send the file (Express handles headers and streaming automatically)
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error("Download stream error:", err);
        // Note: If headers were already sent, we can't send a JSON error, but it's logged.
      }
    });
  } catch (err) {
    next(err);
  }
};