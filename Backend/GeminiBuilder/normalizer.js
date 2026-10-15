class ContentError extends Error {}

function clean(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/```[a-z]*\n?|```/gi, "")
    .replace(/\*\*|__/g, "")
    .replace(/`/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanCommand(value) {
  return String(value ?? "")
    .replace(/```[a-z]*\n?|```/gi, "")
    .replace(/\r?\n/g, " ")
    .trim();
}

const list = (v, fn = clean) => (Array.isArray(v) ? v.map(fn).filter(Boolean) : []);
const stripLead = (s) => s.replace(/^\s*(step\s*\d+\s*[:.\-–]\s*|\d+[.)]\s+|[-•●]\s+)/i, "");
const stripFig = (s) => s.replace(/^fig(ure)?\s*\d+\s*[:.\-–]\s*/i, "");
const toIndex = (v) => (typeof v === "number" && Number.isInteger(v) ? v : typeof v === "string" && /^\d+$/.test(v.trim()) ? Number(v) : -1);

function enforceOrder(steps) {
  const pairs = [];
  steps.forEach((s, si) => s.shots.forEach((sh) => pairs.push({ sh, si, final: si })));
  pairs.sort((a, b) => a.sh.image - b.sh.image);
  const n = pairs.length;
  if (n < 2) return [];

  const len = Array(n).fill(1);
  const prev = Array(n).fill(-1);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < i; j++)
      if (pairs[j].si <= pairs[i].si && len[j] + 1 > len[i]) { len[i] = len[j] + 1; prev[i] = j; }
  let best = 0;
  for (let i = 1; i < n; i++) if (len[i] > len[best]) best = i;
  const keep = new Set();
  for (let k = best; k !== -1; k = prev[k]) keep.add(k);

  const firstKept = Math.min(...keep);
  let last = pairs[firstKept].si;
  const moved = [];
  pairs.forEach((p, i) => {
    if (keep.has(i)) last = p.si;
    else {
      p.final = i < firstKept ? pairs[firstKept].si : last;
      if (p.final !== p.si) moved.push(p.sh.image);
    }
  });

  steps.forEach((s) => (s.shots = []));
  pairs.forEach((p) => steps[p.final].shots.push(p.sh));
  return moved;
}

function normalizeContent(raw, ctx = {}) {
  const imageCount = ctx.imageCount || 0;
  const ordered = ctx.ordered !== false;
  const enabledSections = ctx.enabledSections || null;
  const powerMode = !!ctx.powerMode;

  if (!raw || typeof raw !== "object") throw new ContentError("Response is not a JSON object");

  const used = new Set();
  const steps = (Array.isArray(raw.steps) ? raw.steps : [])
    .map((s) => {
      const shots = [];
      for (const x of Array.isArray(s?.shots) ? s.shots : []) {
        const image = toIndex(x?.image);
        if (image < 0 || image >= imageCount || used.has(image)) continue;
        used.add(image);
        shots.push({ image, caption: stripFig(clean(x?.caption)) });
      }
      return {
        title: stripLead(clean(s?.title)),
        instructions: list(s?.instructions).map(stripLead),
        commands: list(s?.commands, cleanCommand),
        screenshotCaption: stripFig(clean(s?.screenshotCaption)),
        screenshotHint: clean(s?.screenshotHint),
        shots,
      };
    })
    .filter((s) => s.title && s.instructions.length);

  const isStepsEnabled = enabledSections === null || enabledSections.includes("steps");
  if (isStepsEnabled && steps.length < 3) throw new ContentError(`Only ${steps.length} usable steps returned (need at least 3)`);

  for (const s of steps) {
    if (powerMode) {
      // Power mode: no placeholder text, ever. Only real screenshots carry captions.
      s.screenshotCaption = "";
      s.screenshotHint = "";
      for (const sh of s.shots) if (!sh.caption) sh.caption = s.title;
    } else if (!s.screenshotCaption) {
      s.screenshotCaption = s.title;
    }
  }

  let architectureScreenshot = toIndex(raw.architectureScreenshot);
  if (architectureScreenshot < 0 || architectureScreenshot >= imageCount || used.has(architectureScreenshot)) architectureScreenshot = null;
  else used.add(architectureScreenshot);

  // Power mode maps screenshots by content, so upload order must not reshuffle them.
  const reassigned = ordered && !powerMode ? enforceOrder(steps) : [];
  for (const s of steps) s.shots.sort((a, b) => a.image - b.image);

  const services = (Array.isArray(raw.services) ? raw.services : [])
    .map((x) =>
      typeof x === "string"
        ? { name: clean(x), purpose: "" }
        : { name: clean(x?.name), purpose: clean(x?.purpose).replace(/^[-–—]\s*/, "") }
    )
    .filter((x) => x.name);

  const out = {
    aim: clean(raw.aim),
    objectives: list(raw.objectives),
    services,
    prerequisites: list(raw.prerequisites),
    architecture: {
      description: clean(raw.architecture?.description),
      caption: stripFig(clean(raw.architecture?.caption)),
    },
    architectureScreenshot,
    steps,
    verification: list(raw.verification),
    expectedOutput: clean(raw.expectedOutput),
    conclusion: clean(raw.conclusion),
    customSections: Array.isArray(raw.customSections)
      ? raw.customSections
          .map((cs) => ({
            id: cs?.id,
            title: clean(cs?.title),
            content: clean(cs?.content),
          }))
          .filter((cs) => cs.title && cs.content)
      : [],
    unassigned: Array.from({ length: imageCount }, (_, i) => i).filter((i) => !used.has(i)),
    reassigned,
    powerMode,
  };

  const isEnabled = (key) => enabledSections === null || enabledSections.includes(key);

  if (isEnabled("aim") && !out.aim) throw new ContentError("Missing aim");
  if (isEnabled("objectives") && !out.objectives.length) throw new ContentError("Missing objectives");
  if (isEnabled("verification") && !out.verification.length) throw new ContentError("Missing verification");
  if (isEnabled("conclusion") && !out.conclusion) throw new ContentError("Missing conclusion");

  return out;
}

function parseJson(text) {
  const t = String(text).trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(t);
  } catch {
    const a = t.indexOf("{");
    const b = t.lastIndexOf("}");
    if (a !== -1 && b > a) return JSON.parse(t.slice(a, b + 1));
    throw new ContentError("Response was not valid JSON");
  }
}

module.exports = { ContentError, clean, cleanCommand, list, stripLead, stripFig, toIndex, enforceOrder, normalizeContent, parseJson };