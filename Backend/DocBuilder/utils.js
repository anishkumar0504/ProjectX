const fs = require("fs");
const { MAX_IMG_W, MAX_IMG_H } = require("./constants");

function toBuffer(x) {
  if (!x) return null;
  if (Buffer.isBuffer(x)) return x;
  if (x instanceof Uint8Array) return Buffer.from(x);
  if (typeof x === "string") return fs.readFileSync(x);
  throw new Error("Image must be a Buffer or a file path");
}

function imageInfo(buf) {
  if (buf.length > 24 && buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG") {
    return { type: "png", w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let o = 2;
    while (o + 9 < buf.length) {
      if (buf[o] !== 0xff) { o++; continue; }
      const m = buf[o + 1];
      if (m === 0xff) { o++; continue; }
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
        return { type: "jpg", h: buf.readUInt16BE(o + 5), w: buf.readUInt16BE(o + 7) };
      }
      o += 2 + buf.readUInt16BE(o + 2);
    }
  }
  throw new Error("Unsupported image. Use PNG or JPG.");
}

function fit(w, h, maxH = MAX_IMG_H) {
  const k = Math.min(MAX_IMG_W / w, maxH / h, 1);
  return { width: Math.round(w * k), height: Math.round(h * k) };
}

module.exports = { toBuffer, imageInfo, fit };