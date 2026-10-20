const documentService = require("../services/document.service");
const authService = require("../services/auth.service");
const fs = require("fs");
const path = require("path");

// Resolve user: req.user -> Bearer token -> test-only fallback
async function resolveUserId(req) {
  if (req.user?.id) return req.user.id;

  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    const user = await authService.getUserFromToken(header.slice(7));
    if (user) return user.id;
  }

  if (process.env.NODE_ENV === "test") return "test-user-id";

  const err = new Error("Unauthorized");
  err.status = 401;
  throw err;
}

// GENERATE
exports.generate = async (req, res, next) => {
  try {
    const userId = await resolveUserId(req);
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

// LIST
exports.list = async (req, res, next) => {
  try {
    const userId = await resolveUserId(req);
    const docs = await documentService.listForUser(userId);
    res.status(200).json({ documents: docs });
  } catch (err) {
    next(err);
  }
};

// GET ONE
exports.get = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = await resolveUserId(req);
    const doc = await documentService.getById(id, userId);
    res.status(200).json({ document: doc });
  } catch (err) {
    next(err);
  }
};

// DOWNLOAD
exports.download = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { format = "docx" } = req.query;
    const userId = await resolveUserId(req);

    const doc = await documentService.getById(id, userId);

    if (doc.status !== "READY" && doc.status !== "GENERATED") {
      return res.status(400).json({ message: "Document is still generating or failed" });
    }
    if (!doc.outputPath) {
      return res.status(404).json({ message: "File path not found" });
    }

    // Whitelist format so ?format=../../x can't escape the outputs dir
    if (!["docx", "pdf"].includes(format)) {
      return res.status(400).json({ message: "Invalid format" });
    }

    const baseFilePath = doc.outputPath.replace(/\.(docx|pdf)$/i, "");
    const targetFilePath = path.resolve(`${baseFilePath}.${format}`);

    if (!fs.existsSync(targetFilePath)) {
      return res.status(404).json({ message: `${format.toUpperCase()} file not found on server` });
    }

    let meta = {};
    try { meta = typeof doc.meta === "string" ? JSON.parse(doc.meta) : doc.meta; } catch {}
    const safeTitle = (meta.title || "Report").replace(/[^a-z0-9]/gi, "_").substring(0, 30);
    const filename = `${safeTitle}_${doc.id}.${format}`;

    res.download(targetFilePath, filename, (err) => {
      if (err) console.error("Download stream error:", err);
    });
  } catch (err) {
    next(err);
  }
};