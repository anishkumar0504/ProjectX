const fs = require("fs");
const { MAX_REFERENCE_CHARS, MAX_IMAGES, MAX_REQUEST_BYTES } = require("./constants");
const { clean } = require("./normalizer");

async function readReference({ referenceText, referenceDocx }) {
  let text = "";
  if (referenceText) text = String(referenceText);
  else if (referenceDocx) {
    let mammoth;
    try {
      mammoth = require("mammoth");
    } catch {
      throw new Error("Reading .docx references needs the 'mammoth' package: npm install mammoth");
    }
    const buffer = Buffer.isBuffer(referenceDocx) ? referenceDocx : fs.readFileSync(referenceDocx);
    text = (await mammoth.extractRawText({ buffer })).value;
  }
  text = text.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return text.slice(0, MAX_REFERENCE_CHARS);
}

function sniffMime(buf) {
  if (buf.length > 4 && buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG") return "image/png";
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  throw new Error("Screenshots must be PNG, JPG or WEBP");
}

async function prepareImages(images) {
  if (images.length > MAX_IMAGES) throw new Error(`Too many screenshots (max ${MAX_IMAGES})`);
  let sharp = null;
  try {
    sharp = require("sharp");
  } catch {}

  const out = [];
  let total = 0;
  for (let i = 0; i < images.length; i++) {
    const it = images[i];
    const raw = Buffer.isBuffer(it) ? it : typeof it === "string" ? fs.readFileSync(it) : Buffer.isBuffer(it?.data) ? it.data : fs.readFileSync(it.path);
    const name = (typeof it === "object" && !Buffer.isBuffer(it) && it?.name) || `image-${i}`;
    let buf = raw;
    let mime = sniffMime(raw);
    if (sharp) {
      try {
        buf = await sharp(raw).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
        mime = "image/jpeg";
      } catch {
        buf = raw;
      }
    }
    total += buf.length;
    out.push({ mime, b64: buf.toString("base64"), name: clean(name) });
  }
  if (total * 1.34 > MAX_REQUEST_BYTES) {
    throw new Error("Screenshots are too large for one request. Install 'sharp' (npm i sharp) or send fewer/smaller images.");
  }
  return out;
}

module.exports = { readReference, sniffMime, prepareImages };