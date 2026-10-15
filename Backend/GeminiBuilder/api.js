const { API_BASE, DEFAULT_MODELS } = require("./constants");
const { buildSystemInstruction, buildUserPrompt } = require("./prompts");
const { normalizeContent, parseJson, ContentError, clean } = require("./normalizer");
const { readReference, prepareImages } = require("./inputs");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callGemini({ model, apiKey, systemInstruction, parts, temperature, timeoutMs }) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts }],
        generationConfig: { temperature, responseMimeType: "application/json", maxOutputTokens: 8192 },
      }),
      signal: ctrl.signal,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const err = new Error(`Gemini ${res.status} (${model}): ${body.slice(0, 300)}`);
      err.status = res.status;
      throw err;
    }

    const data = await res.json();
    const cand = data.candidates?.[0];
    const text = (cand?.content?.parts || []).filter((p) => !p.thought).map((p) => p.text || "").join("");
    if (!text) {
      const why = data.promptFeedback?.blockReason || cand?.finishReason || "empty response";
      throw new ContentError(`No content returned (${why})`);
    }
    if (cand?.finishReason === "MAX_TOKENS") throw new ContentError("Response was cut off (MAX_TOKENS)");
    return text;
  } catch (e) {
    if (e.name === "AbortError") {
      const err = new Error(`Gemini timed out after ${timeoutMs} ms (${model})`);
      err.status = 504;
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function generatePracticalContent(o) {
  const title = clean(o?.title);
  if (title.length < 5) throw new Error("A practical title is required");
  const apiKey = o.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing Gemini API key (set GEMINI_API_KEY)");

  const cloud = clean(o.cloud) || "AWS";
  const subject = clean(o.subject) || "Cloud Architecture and Services";
  const namePrefix = clean(o.namePrefix).replace(/[^A-Za-z0-9-]/g, "") || "Lab";
  const stepCount = Math.min(14, Math.max(6, Number(o.stepCount) || 10));
  const ordered = o.ordered !== false;
  const models = o.models?.length ? o.models : DEFAULT_MODELS;
  const enabledSections = o.enabledSections || null;
  const powerMode = !!o.powerMode;

  const referenceText = await readReference(o);
  const images = o.sendImages === false || !o.images?.length ? [] : await prepareImages(o.images);

  const systemInstruction = buildSystemInstruction(cloud, powerMode);
  const basePrompt = buildUserPrompt({
    title,
    subject,
    cloud,
    namePrefix,
    stepCount,
    referenceText,
    imageCount: images.length,
    ordered,
    enabledSections,
    customSections: o.customSections,
    powerMode,
  });

  const buildParts = (hint) => {
    const parts = [{ text: basePrompt + hint }];
    images.forEach((im, i) => {
      parts.push({ text: `Screenshot ${i}:` });
      parts.push({ inlineData: { mimeType: im.mime, data: im.b64 } });
    });
    return parts;
  };

  let lastErr;
  for (const model of models) {
    let hint = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const text = await callGemini({
          model, apiKey, systemInstruction,
          parts: buildParts(hint),
          temperature: attempt === 0 ? 0.4 : 0.2,
          timeoutMs: 120_000,
        });
        return normalizeContent(parseJson(text), { imageCount: images.length, ordered, enabledSections, powerMode });
      } catch (e) {
        lastErr = e;
        const s = e.status;
        if (s === 400 || s === 401 || s === 403) throw e;
        if (s === 404) break;
        if (s === 429 && attempt >= 1) break;
        if (e instanceof ContentError || e instanceof SyntaxError) {
          hint = `\n\nYour previous reply was rejected: ${e.message}. Return ONLY the corrected, complete JSON object.`;
        } else {
          await sleep(1500 * 2 ** attempt + Math.random() * 500);
        }
      }
    }
  }
  throw new Error(`Gemini failed on all models (${models.join(", ")}). Last error: ${lastErr?.message}`);
}

module.exports = { sleep, callGemini, generatePracticalContent };