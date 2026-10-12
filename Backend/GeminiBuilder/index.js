const { generatePracticalContent } = require("./api");
const { normalizeContent, ContentError } = require("./normalizer");
const { readReference, prepareImages } = require("./inputs");
const { buildSystemInstruction, buildUserPrompt } = require("./prompts");

module.exports = {
  generatePracticalContent,
  normalizeContent,
  readReference,
  prepareImages,
  buildSystemInstruction,
  buildUserPrompt,
  ContentError,
};