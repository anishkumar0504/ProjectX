const multer = require("multer");
const path = require("path");
const fs = require("fs");

const TEMP = path.join(__dirname, "../../uploads/temp");
fs.mkdirSync(TEMP, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TEMP),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.fieldname === "shots" && /\.(png|jpe?g|webp)$/i.test(file.originalname)) {
    cb(null, true);
  } else if (file.fieldname === "reference" && /\.docx$/i.test(file.originalname)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

exports.uploadDocumentFiles = multer({ storage, fileFilter }).fields([
  { name: "shots", maxCount: 25 },
  { name: "reference", maxCount: 1 },
]);