  const documentService = require("../services/document.service"); // ✅ CRITICAL: This was missing
  const fs = require("fs");
  const path = require("path");

  // ✅ GENERATE DOCUMENT
  exports.generate = async (req, res, next) => {
    try {
          console.log("controller body keys:", Object.keys(req.body || {})); // <-- add this

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
  // ✅ DOWNLOAD DOCUMENT (Secure & Multi-format ready)
  exports.download = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { format = 'docx' } = req.query; // Default to docx if not specified
      const userId = req.user?.id || "test-user-id";
      
      // 1. Fetch document AND verify ownership via the service
      const doc = await documentService.getById(id, userId);
      
      if (doc.status !== "READY" && doc.status !== "GENERATED") {
        return res.status(400).json({ message: "Document is still generating or failed" });
      }

      if (!doc.outputPath) {
        return res.status(404).json({ message: "File path not found" });
      }

      // 2. Derive the target file path based on the requested format
      // e.g., "uploads/outputs/123.docx" becomes "uploads/outputs/123.pdf"
      const baseFilePath = doc.outputPath.replace(/\.(docx|pdf)$/i, '');
      const targetFilePath = path.resolve(`${baseFilePath}.${format}`);
      
      // 3. Check if the specific format file actually exists on disk
      if (!fs.existsSync(targetFilePath)) {
        return res.status(404).json({ message: `${format.toUpperCase()} file not found on server` });
      }

      // 4. Generate a clean, safe filename for the download
      let meta = {};
      try { meta = typeof doc.meta === 'string' ? JSON.parse(doc.meta) : doc.meta; } catch {}
      const safeTitle = (meta.title || "Report").replace(/[^a-z0-9]/gi, "_").substring(0, 30);
      const filename = `${safeTitle}_${doc.id}.${format}`;

      // 5. Send the file (Express handles headers and streaming automatically)
      res.download(targetFilePath, filename, (err) => {
        if (err) {
          console.error("Download stream error:", err);
        }
      });
    } catch (err) {
      next(err);
    }
  };