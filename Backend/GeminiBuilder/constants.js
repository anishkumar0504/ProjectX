const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const DEFAULT_MODELS = (
  process.env.GEMINI_MODEL || "gemini-3.5-flash-lite"
)
  .split(",")
  .map(m => m.trim())
  .filter(Boolean);

const MAX_IMAGES = 20;
const MAX_REQUEST_BYTES = 18 * 1024 * 1024; // Gemini inline limit is 20 MB per request
const MAX_REFERENCE_CHARS = 14000;

module.exports = { API_BASE, DEFAULT_MODELS, MAX_IMAGES, MAX_REQUEST_BYTES, MAX_REFERENCE_CHARS };