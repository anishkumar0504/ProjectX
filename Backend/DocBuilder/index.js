const { Document, Packer, LevelFormat, AlignmentType, BorderStyle, PageBorderDisplay, PageBorderOffsetFrom, PageBorderZOrder } = require("docx");
const { FONT, TEXT_WIDTH, MAX_IMG_H } = require("./constants");
const { toBuffer, imageInfo } = require("./utils");
const {
  buildHeader, buildFooter, sectionHeading, bodyText, bullet,
  serviceBullet, figureSlot, stepBlock
} = require("./components");

// ✅ HELPERS: Check if section is enabled and get proof status
function isSectionEnabled(userSections, typeOrId) {
  if (Array.isArray(userSections)) {
    const sec = userSections.find(s => s.id === typeOrId || s.type === typeOrId);
    return sec ? sec.enabled !== false : false;
  }
  return userSections[typeOrId] === true;
}

function getSectionProof(userSections, typeOrId) {
  if (Array.isArray(userSections)) {
    const sec = userSections.find(s => s.id === typeOrId || s.type === typeOrId);
    return sec?.proof || "optional";
  }
  return "optional";
}

async function buildPracticalDocx({ meta, content, screenshots = {}, options = {} }) {
  const m = {
    studentName: meta.studentName,
    prn: meta.prn,
    facultyName: meta.facultyName,
    title: meta.title,
    subject: meta.subject || "Cloud Architecture and Services",
    program: meta.program || "B.Tech TY (CCSA)",
    school: meta.school || "School of Computer Science, Engineering and Applications(SCSEA)",
    logo: toBuffer(meta.logoBuffer || meta.logoPath),
  };
  
  for (const k of ["studentName", "prn", "facultyName", "title"]) {
    if (!m[k]) throw new Error(`meta.${k} is required`);
  }
  if (!m.logo) throw new Error("meta.logoPath or meta.logoBuffer is required");

  const placeholders = options.placeholders === "blank" ? "blank" : "box";
  const servicesHeading = options.servicesHeading || "AWS Services Used";
  const maxH = Number(options.maxImageHeight) > 0 ? Number(options.maxImageHeight) : MAX_IMG_H;
  const c = content;
  // Power mode: no empty "Paste screenshot here" boxes anywhere in the document.
  const hidePlaceholders = options.hideEmptyPlaceholders === true;
console.log("hidePlaceholders:", hidePlaceholders);
  const userSections = options.sections || [];
  const allScreenshots = screenshots.all || [];
  const body = [];

  // ✅ RENDER IN FRONTEND ORDER (Array format)
  if (Array.isArray(userSections)) {
    for (const section of userSections) {
      if (section.enabled === false) continue;
      
      switch (section.type) {
        case 'aim':
          if (c.aim) body.push(sectionHeading("Aim"), bodyText(c.aim));
          break;
        case 'objectives':
          if (c.objectives?.length) body.push(sectionHeading("Objectives"), ...c.objectives.map(bullet));
          break;
        case 'services':
          if (c.services?.length) body.push(sectionHeading(servicesHeading), ...c.services.map(serviceBullet));
          break;
        case 'prerequisites':
          if (c.prerequisites?.length) body.push(sectionHeading("Prerequisites"), ...c.prerequisites.map(bullet));
          break;
        case 'architecture':
          if (c.architecture?.description) {
            body.push(sectionHeading("Architecture Diagram"));
            body.push(bodyText(c.architecture.description));
            let archImg = screenshots.architecture ?? (c.architectureScreenshot != null ? allScreenshots[c.architectureScreenshot] : null);
            if (archImg) {
              body.push(...figureSlot({ image: toBuffer(archImg), hint: "architecture diagram", placeholders, maxH, captionText: `Fig 0: ${c.architecture?.caption || "Architecture diagram"}` }));
            }
          }
          break;
        case 'steps':
          if (c.steps?.length) {
            body.push(sectionHeading("Step-by-Step Implementation"));
            let fig = 1;
            c.steps.forEach((s, i) => {
              const shots = (s.shots?.length && allScreenshots.length) 
                ? s.shots.map(x => {
                    const img = allScreenshots[x.image];
                    return img ? { image: toBuffer(img), caption: x.caption } : null;
                  }).filter(Boolean)
                : [];
              
              const showPlaceholder = !hidePlaceholders && section.proof === 'required' && shots.length === 0;
              const items = shots.length ? shots : (showPlaceholder ? [{ image: null, caption: s.screenshotCaption }] : []);

              const { blocks, used } = stepBlock(s, i, fig, items, placeholders, maxH, hidePlaceholders);
              body.push(...blocks);
              fig += used;
            });
          }
          break;
        case 'verification':
          body.push(sectionHeading("Verification / Testing"));
          if (c.verification?.length) body.push(...c.verification.map(bullet));
          if (section.proof === 'required' && !hidePlaceholders) body.push(...figureSlot({ image: null, hint: "verification proof", placeholders, maxH, captionText: "Verification screenshot placeholder" }));
          break;
        case 'expectedOutput':
          body.push(sectionHeading("Expected Output"));
          if (c.expectedOutput) body.push(bodyText(c.expectedOutput));
          if (section.proof === 'required' && !hidePlaceholders) body.push(...figureSlot({ image: null, hint: "expected output proof", placeholders, maxH, captionText: "Expected output screenshot placeholder" }));
          break;
        case 'conclusion':
          body.push(sectionHeading("Result / Conclusion"));
          if (c.conclusion) body.push(bodyText(c.conclusion));
          if (section.proof === 'required' && !hidePlaceholders) body.push(...figureSlot({ image: null, hint: "result proof", placeholders, maxH, captionText: "Result screenshot placeholder" }));
          break;
        case 'custom':
          // ✅ FIX: Match by ID, fallback to title. ALWAYS add placeholder if proof is required.
          const csData = c.customSections?.find(cs => cs.id === section.id || cs.title === section.title);
          body.push(sectionHeading(section.title));
          if (csData?.content) {
            body.push(bodyText(csData.content));
          }
          if (section.proof === 'required' && !hidePlaceholders) {
            body.push(...figureSlot({ image: null, hint: section.title, placeholders, maxH, captionText: `${section.title} screenshot placeholder` }));
          }
          break;
      }
    }
  } else {
    // LEGACY OBJECT FORMAT FALLBACK
    if (isSectionEnabled(userSections, 'aim') && c.aim) body.push(sectionHeading("Aim"), bodyText(c.aim));
    if (isSectionEnabled(userSections, 'objectives') && c.objectives?.length) body.push(sectionHeading("Objectives"), ...c.objectives.map(bullet));
    if (isSectionEnabled(userSections, 'services') && c.services?.length) body.push(sectionHeading(servicesHeading), ...c.services.map(serviceBullet));
    if (isSectionEnabled(userSections, 'prerequisites') && c.prerequisites?.length) body.push(sectionHeading("Prerequisites"), ...c.prerequisites.map(bullet));

    if (isSectionEnabled(userSections, 'architecture') && c.architecture?.description) {
      body.push(sectionHeading("Architecture Diagram"));
      body.push(bodyText(c.architecture.description));
      let archImg = screenshots.architecture ?? (c.architectureScreenshot != null ? allScreenshots[c.architectureScreenshot] : null);
      if (archImg) body.push(...figureSlot({ image: toBuffer(archImg), hint: "architecture diagram", placeholders, maxH, captionText: `Fig 0: ${c.architecture?.caption || "Architecture diagram"}` }));
    }

    if (isSectionEnabled(userSections, 'steps') && c.steps?.length) {
      body.push(sectionHeading("Step-by-Step Implementation"));
      let fig = 1;
      c.steps.forEach((s, i) => {
        const shots = (s.shots?.length && allScreenshots.length) 
          ? s.shots.map(x => {
              const img = allScreenshots[x.image];
              return img ? { image: toBuffer(img), caption: x.caption } : null;
            }).filter(Boolean)
          : [];
        const showPlaceholder = !hidePlaceholders && getSectionProof(userSections, 'steps') === 'required' && shots.length === 0;
        const items = shots.length ? shots : (showPlaceholder ? [{ image: null, caption: s.screenshotCaption }] : []);
        const { blocks, used } = stepBlock(s, i, fig, items, placeholders, maxH, hidePlaceholders);
        body.push(...blocks);
        fig += used;
      });
    }

    if (options.appendUnassigned && c.unassigned?.length && allScreenshots.length) {
      body.push(sectionHeading("Additional Screenshots"));
      let fig = 1;
      for (const idx of c.unassigned) {
        body.push(...figureSlot({ image: toBuffer(allScreenshots[idx]), placeholders, maxH, captionText: `Fig ${fig++}: Additional screenshot` }));
      }
    }

    if (c.customSections?.length) {
      c.customSections.forEach((cs) => {
        if (isSectionEnabled(userSections, cs.id) && cs.title && cs.content) {
          body.push(sectionHeading(cs.title));
          body.push(bodyText(cs.content));
          if (getSectionProof(userSections, cs.id) === 'required' && !hidePlaceholders) {
            body.push(...figureSlot({ image: null, hint: cs.title, placeholders, maxH, captionText: `${cs.title} screenshot placeholder` }));
          }
        }
      });
    }

  if (isSectionEnabled(userSections, 'verification')) {
  body.push(sectionHeading("Verification / Testing"));
  if (c.verification?.length) body.push(...c.verification.map(bullet));
  // ✅ ONLY add placeholder if Power Mode is OFF
  if (getSectionProof(userSections, 'verification') === 'required' && !hidePlaceholders) {
    body.push(...figureSlot({ image: null, hint: "verification proof", placeholders, maxH, captionText: "Verification screenshot placeholder" }));
  }
}

    if (isSectionEnabled(userSections, 'expectedOutput')) {
      body.push(sectionHeading("Expected Output"));
      if (c.expectedOutput) body.push(bodyText(c.expectedOutput));
      if (getSectionProof(userSections, 'expectedOutput') === 'required' && !hidePlaceholders) body.push(...figureSlot({ image: null, hint: "expected output proof", placeholders, maxH, captionText: "Expected output screenshot placeholder" }));
    }

    if (isSectionEnabled(userSections, 'conclusion')) {
      body.push(sectionHeading("Result / Conclusion"));
      if (c.conclusion) body.push(bodyText(c.conclusion));
      if (getSectionProof(userSections, 'conclusion') === 'required' && !hidePlaceholders) body.push(...figureSlot({ image: null, hint: "result proof", placeholders, maxH, captionText: "Result screenshot placeholder" }));
    }
  }

  if (options.imageLayout === 'combineAll') {
    body.push(sectionHeading("All Screenshots"));
    let fig = 1;
    for (const img of allScreenshots) {
      body.push(...figureSlot({ image: toBuffer(img), placeholders, maxH, captionText: `Fig ${fig++}: Screenshot` }));
    }
  }

  if (options.screenshotNote === true && options.imageLayout !== 'combineAll') {
    body.push(sectionHeading("Screenshot Documentation"), bodyText("All screenshots captured during the practical are to be embedded above..."));
  }

  const bdr = (space) => ({ style: BorderStyle.SINGLE, size: 6, color: "000000", space });

  const doc = new Document({
    title: m.title,
    creator: m.studentName,
    styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    numbering: {
      config: [
        { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "●", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 740, hanging: 380 } }, run: { size: 14 } } }] },
        { reference: "steps", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 725, hanging: 240 } }, run: { size: 20 } } }] },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 4450, bottom: 1240, left: 1514, right: 1292, header: 520, footer: 500 },
          borders: {
            pageBorders: { display: PageBorderDisplay.ALL_PAGES, offsetFrom: PageBorderOffsetFrom.PAGE, zOrder: PageBorderZOrder.FRONT },
            pageBorderTop: bdr(24), pageBorderLeft: bdr(24), pageBorderRight: bdr(21), pageBorderBottom: bdr(19),
          },
        },
      },
      headers: { default: buildHeader(m) },
      footers: { default: buildFooter(m.prn) },
      children: body,
    }],
  });

  return Packer.toBuffer(doc);
}

// ✅ EXACT SAME EXPORT AS YOUR ORIGINAL FILE
module.exports = { buildPracticalDocx, imageInfo };