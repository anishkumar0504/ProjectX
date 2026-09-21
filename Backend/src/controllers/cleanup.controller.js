const fs = require("fs");
const path = require("path");

exports.cleanupTempUploads = async (req, res) => {
  try {
    const uploadDir = path.join(__dirname, "../../uploads");
    
    if (!fs.existsSync(uploadDir)) {
      return res.status(404).json({ message: "Uploads directory not found" });
    }

    const items = fs.readdirSync(uploadDir);
    let deletedCount = 0;
    let errors = [];

    for (const item of items) {
      // ⚠️ SAFEGUARD REMOVED: This will now delete the 'outputs' folder contents too!
      const itemPath = path.join(uploadDir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isFile()) {
        try {
          fs.unlinkSync(itemPath);
          deletedCount++;
        } catch (err) {
          errors.push(`Failed to delete file: ${item}`);
        }
      } else if (stat.isDirectory()) {
        // This now includes the 'outputs' directory, wiping all .docx files inside it
        try {
          const files = fs.readdirSync(itemPath);
          for (const file of files) {
            fs.unlinkSync(path.join(itemPath, file));
            deletedCount++;
          }
        } catch (err) {
          errors.push(`Failed to clean directory: ${item}`);
        }
      }
    }

    res.json({
      success: true,
      message: "ALL uploads and outputs cleaned successfully",
      deletedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error("❌ Cleanup API Error:", err);
    res.status(500).json({ message: "Failed to clean up uploads", error: err.message });
  }
};