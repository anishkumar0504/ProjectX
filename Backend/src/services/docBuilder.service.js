const path = require("path");
const original = require("../../DocBuilder/index");

/**
 * Wraps buildPracticalDocx to add:
 *   - sections: toggle which sections render
 *   - imageLayout: "perStep" | "architectureOnly" | "combineAll" | "none"
 */
exports.buildPracticalDocx = async ({ meta, content, screenshots = {}, options = {} }) => {
  const sections = options.sections || {};
  const imageLayout = options.imageLayout || "perStep";

  let finalContent = filterContent(content, sections);
  let finalScreenshots = screenshots;
  const finalOptions = { ...options };

  if (imageLayout === "none") {
    finalContent = stripAllScreenshots(finalContent);
    finalScreenshots = {};
  } else if (imageLayout === "architectureOnly") {
    finalContent = stripStepScreenshots(finalContent);
  } else if (imageLayout === "combineAll") {
    finalContent = stripStepScreenshots(finalContent);
    finalScreenshots = { all: screenshots.all || [] };
    finalOptions.appendUnassigned = true;
  }
  // "perStep" -> default behavior

  return original.buildPracticalDocx({
    meta,
    content: finalContent,
    screenshots: finalScreenshots,
    options: finalOptions,
  });
};

function filterContent(c, sections) {
  if (!c) return c;
  const out = { ...c };

  // ✅ Handle new Array format
  if (Array.isArray(sections)) {
    const enabledTypes = new Set(sections.filter(s => s.enabled !== false).map(s => s.type));
    
    if (!enabledTypes.has('aim')) out.aim = "";
    if (!enabledTypes.has('objectives')) out.objectives = [];
    if (!enabledTypes.has('services')) out.services = [];
    if (!enabledTypes.has('prerequisites')) out.prerequisites = [];
    if (!enabledTypes.has('architecture')) {
      out.architecture = { description: "", caption: "" };
      out.architectureScreenshot = null;
    }
    if (!enabledTypes.has('steps')) out.steps = [];
    if (!enabledTypes.has('verification')) out.verification = [];
    if (!enabledTypes.has('expectedOutput')) out.expectedOutput = "";
    if (!enabledTypes.has('conclusion')) out.conclusion = "";

    // Filter custom sections by ID
    if (out.customSections && Array.isArray(out.customSections)) {
      const enabledCustomIds = new Set(
        sections.filter(s => s.type === 'custom' && s.enabled !== false).map(s => s.id)
      );
      out.customSections = out.customSections.filter(cs => enabledCustomIds.has(cs.id));
    }
  } else {
    // Legacy object format fallback
    if (sections.aim === false) out.aim = "";
    if (sections.objectives === false) out.objectives = [];
    if (sections.services === false) out.services = [];
    if (sections.prerequisites === false) out.prerequisites = [];
    if (sections.architecture === false) {
      out.architecture = { description: "", caption: "" };
      out.architectureScreenshot = null;
    }
    if (sections.steps === false) out.steps = [];
    if (sections.verification === false) out.verification = [];
    if (sections.expectedOutput === false) out.expectedOutput = "";
    if (sections.conclusion === false) out.conclusion = "";
  }
  return out;
}

function stripStepScreenshots(c) {
  return {
    ...c,
    steps: (c.steps || []).map((s) => ({ ...s, shots: [] })),
  };
}

function stripAllScreenshots(c) {
  return {
    ...stripStepScreenshots(c),
    architectureScreenshot: null,
    unassigned: [],
  };
}