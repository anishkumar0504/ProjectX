"use strict";
const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
  LineRuleType, HeightRule, LevelFormat, PageNumber, PageBorderDisplay,
  PageBorderOffsetFrom, PageBorderZOrder,
} = require("docx");

const FONT = "Times New Roman";
const MONO = "Courier New";
const TEXT_WIDTH = 9100; 
const BLUE = "4A6FA5"; 
const HEAD = "2E4A7D"; 
const ORANGE = "E8823A";
const MAX_IMG_W = 600; 
const MAX_IMG_H = 270; 
const SLOT_H = 3100; 

const run = (text, o = {}) => new TextRun({ text, font: FONT, size: 22, ...o });

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

const thin = { style: BorderStyle.SINGLE, size: 6, color: "000000" };
const allBorders = { top: thin, bottom: thin, left: thin, right: thin };

function headerLine(text, after = 0) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after, line: 264, lineRule: LineRuleType.AUTO },
    children: [run(text, { bold: true })],
  });
}

function infoCell(text, width, { bold = false, span = 1 } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    columnSpan: span,
    borders: allBorders,
    margins: { top: 30, bottom: 30, left: 100, right: 100 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: [run(text, { bold, size: 20 })] })],
  });
}

function buildHeader(m) {
  const C = [2213, 3625, 997, 2265];
  const H = { value: 360, rule: HeightRule.AT_LEAST };
  const table = new Table({
    width: { size: TEXT_WIDTH, type: WidthType.DXA },
    columnWidths: C,
    rows: [
      new TableRow({ height: H, children: [
        infoCell("Name of the Student:", C[0], { bold: true }), infoCell(m.studentName, C[1]),
        infoCell("PRN", C[2], { bold: true }), infoCell(m.prn, C[3]),
      ] }),
      new TableRow({ height: H, children: [
        infoCell("Title of Practical :", C[0], { bold: true }),
        infoCell(m.title, C[1] + C[2] + C[3], { span: 3 }),
      ] }),
      new TableRow({ height: H, children: [
        infoCell("Faculty Name:", C[0], { bold: true }), infoCell(m.facultyName, C[1]),
        infoCell("Sign:", C[2], { bold: true }), infoCell("", C[3]),
      ] }),
    ],
  });

  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 100 },
        children: [
          new ImageRun({
            type: "png",
            data: m.logo,
            transformation: { width: 165, height: 60 },
            altText: { title: "DYPIU logo", description: "D Y Patil International University logo", name: "logo" },
          }),
        ],
      }),
      headerLine(m.school),
      headerLine(m.program),
      headerLine(`Subject : ${m.subject}`, 140),
      table,
      new Paragraph({
        spacing: { before: 0, after: 0, line: 440, lineRule: LineRuleType.EXACT },
        border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: BLUE, space: 1 } },
        children: [],
      }),
    ],
  });
}

function buildFooter(prn) {
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const noBorders = { top: none, bottom: none, left: none, right: none };
  const BOX = 1230;
  const zero = { top: 0, bottom: 0, left: 0, right: 0 };

  return new Footer({
    children: [
      new Paragraph({
        spacing: { before: 0, after: 0, line: 340, lineRule: LineRuleType.EXACT },
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF", space: 1 } },
        children: [],
      }),
      new Table({
        width: { size: TEXT_WIDTH, type: WidthType.DXA },
        columnWidths: [TEXT_WIDTH - BOX, BOX],
        rows: [
          new TableRow({
            height: { value: 310, rule: HeightRule.EXACT },
            children: [
              new TableCell({
                width: { size: TEXT_WIDTH - BOX, type: WidthType.DXA },
                borders: noBorders, margins: zero, verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                  alignment: AlignmentType.RIGHT, spacing: { before: 0, after: 0 },
                  children: [run(`PRN: ${prn}`, { size: 20 })],
                })],
              }),
              new TableCell({
                width: { size: BOX, type: WidthType.DXA },
                borders: noBorders, margins: zero, verticalAlign: VerticalAlign.CENTER,
                shading: { type: ShadingType.CLEAR, fill: ORANGE, color: "auto" },
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 },
                  children: [new TextRun({ children: [PageNumber.CURRENT], bold: true, color: "FFFFFF", font: FONT, size: 20 })],
                })],
              }),
            ],
          }),
        ],
      }),
      new Paragraph({ spacing: { before: 0, after: 0, line: 20, lineRule: LineRuleType.EXACT }, children: [] }),
    ],
  });
}

const sectionHeading = (text) =>
  new Paragraph({
    keepNext: true,
    spacing: { before: 220, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 1 } },
    children: [run(text, { bold: true, size: 20, color: HEAD })],
  });

const bodyText = (text, keepNext = false) =>
  new Paragraph({
    keepNext,
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 0, after: 80, line: 276, lineRule: LineRuleType.AUTO },
    children: [run(text)],
  });

const bullet = (text) =>
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 0, after: 60, line: 264, lineRule: LineRuleType.AUTO },
    children: [run(text)],
  });

const serviceBullet = ({ name, purpose }) =>
  new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 0, after: 60, line: 264, lineRule: LineRuleType.AUTO },
    children: [run(name), ...(purpose ? [run(` – ${purpose}`)] : [])],
  });

const caption = (text) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 200 },
    children: [run(text, { italics: true, size: 18, color: "595959" })],
  });

function figureSlot({ image, hint, captionText, placeholders, maxH }) {
  let block;
  if (image) {
    const info = imageInfo(image);
    block = new Paragraph({
      alignment: AlignmentType.CENTER,
      keepNext: true,
      spacing: { before: 140, after: 0 },
      children: [new ImageRun({ type: info.type, data: image, transformation: fit(info.w, info.h, maxH) })],
    });
  } else if (placeholders === "blank") {
    block = new Paragraph({
      keepNext: true,
      spacing: { before: 0, after: 0, line: SLOT_H, lineRule: LineRuleType.EXACT },
      children: [],
    });
  } else {
    const dash = { style: BorderStyle.DASHED, size: 6, color: "A6A6A6" };
    block = new Table({
      width: { size: TEXT_WIDTH, type: WidthType.DXA },
      columnWidths: [TEXT_WIDTH],
      alignment: AlignmentType.CENTER,
      rows: [
        new TableRow({
          cantSplit: true,
          height: { value: SLOT_H, rule: HeightRule.AT_LEAST },
          children: [
            new TableCell({
              width: { size: TEXT_WIDTH, type: WidthType.DXA },
              borders: { top: dash, bottom: dash, left: dash, right: dash },
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 80, bottom: 80, left: 240, right: 240 },
              children: [new Paragraph({
                alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 0, after: 0 },
                children: [run(hint ? `Paste screenshot here: ${hint}` : "Paste screenshot here", { italics: true, size: 18, color: "A6A6A6" })],
              })],
            }),
          ],
        }),
      ],
    });
  }
  const gap = !image && placeholders !== "blank"
    ? [new Paragraph({ keepNext: true, spacing: { before: 0, after: 0, line: 140, lineRule: LineRuleType.EXACT }, children: [] })]
    : [];
  return [...gap, block, caption(captionText)];
}

function stepBlock(step, i, figNo, items, placeholders, maxH) {
  const n = step.instructions.length;
  const out = [
    new Paragraph({
      keepNext: true, keepLines: true,
      spacing: { before: 240, after: 80 },
      children: [run(`Step ${i + 1}: ${step.title}`, { bold: true, size: 24, color: HEAD })],
    }),
    ...step.instructions.map((t, k) =>
      new Paragraph({
        keepNext: k === 0 || (k === n - 1 && true),
        keepLines: true,
        numbering: { reference: "steps", level: 0, instance: i },
        spacing: { before: 0, after: 20, line: 252, lineRule: LineRuleType.AUTO },
        children: [run(t, { size: 20 })],
      })
    ),
    ...(step.commands || []).map((c) =>
      new Paragraph({
        keepNext: true, keepLines: true,
        indent: { left: 725 },
        spacing: { before: 40, after: 40 },
        shading: { type: ShadingType.CLEAR, fill: "F2F2F2", color: "auto" },
        children: [new TextRun({ text: c, font: MONO, size: 18 })],
      })
    ),
  ];
  const slots = items.length ? items : [{ image: null, caption: step.screenshotCaption }];
  slots.forEach((it, k) =>
    out.push(...figureSlot({
      image: it.image, hint: k === 0 ? step.screenshotHint : "", placeholders, maxH,
      captionText: `Fig ${figNo + k}: ${it.caption || step.screenshotCaption}`,
    }))
  );
  return { blocks: out, used: slots.length };
}

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
              
              const showPlaceholder = section.proof === 'required' && shots.length === 0;
              const items = shots.length ? shots : (showPlaceholder ? [{ image: null, caption: s.screenshotCaption }] : []);
              
              const { blocks, used } = stepBlock(s, i, fig, items, placeholders, maxH);
              body.push(...blocks);
              fig += used;
            });
          }
          break;
        case 'verification':
          body.push(sectionHeading("Verification / Testing"));
          if (c.verification?.length) body.push(...c.verification.map(bullet));
          if (section.proof === 'required') body.push(...figureSlot({ image: null, hint: "verification proof", placeholders, maxH, captionText: "Verification screenshot placeholder" }));
          break;
        case 'expectedOutput':
          body.push(sectionHeading("Expected Output"));
          if (c.expectedOutput) body.push(bodyText(c.expectedOutput));
          if (section.proof === 'required') body.push(...figureSlot({ image: null, hint: "expected output proof", placeholders, maxH, captionText: "Expected output screenshot placeholder" }));
          break;
        case 'conclusion':
          body.push(sectionHeading("Result / Conclusion"));
          if (c.conclusion) body.push(bodyText(c.conclusion));
          if (section.proof === 'required') body.push(...figureSlot({ image: null, hint: "result proof", placeholders, maxH, captionText: "Result screenshot placeholder" }));
          break;
        case 'custom':
          // ✅ FIX: Match by ID, fallback to title. ALWAYS add placeholder if proof is required.
          const csData = c.customSections?.find(cs => cs.id === section.id || cs.title === section.title);
          body.push(sectionHeading(section.title));
          if (csData?.content) {
            body.push(bodyText(csData.content));
          }
          if (section.proof === 'required') {
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
        const showPlaceholder = getSectionProof(userSections, 'steps') === 'required' && shots.length === 0;
        const items = shots.length ? shots : (showPlaceholder ? [{ image: null, caption: s.screenshotCaption }] : []);
        const { blocks, used } = stepBlock(s, i, fig, items, placeholders, maxH);
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
          if (getSectionProof(userSections, cs.id) === 'required') {
            body.push(...figureSlot({ image: null, hint: cs.title, placeholders, maxH, captionText: `${cs.title} screenshot placeholder` }));
          }
        }
      });
    }

    if (isSectionEnabled(userSections, 'verification')) {
      body.push(sectionHeading("Verification / Testing"));
      if (c.verification?.length) body.push(...c.verification.map(bullet));
      if (getSectionProof(userSections, 'verification') === 'required') body.push(...figureSlot({ image: null, hint: "verification proof", placeholders, maxH, captionText: "Verification screenshot placeholder" }));
    }

    if (isSectionEnabled(userSections, 'expectedOutput')) {
      body.push(sectionHeading("Expected Output"));
      if (c.expectedOutput) body.push(bodyText(c.expectedOutput));
      if (getSectionProof(userSections, 'expectedOutput') === 'required') body.push(...figureSlot({ image: null, hint: "expected output proof", placeholders, maxH, captionText: "Expected output screenshot placeholder" }));
    }

    if (isSectionEnabled(userSections, 'conclusion')) {
      body.push(sectionHeading("Result / Conclusion"));
      if (c.conclusion) body.push(bodyText(c.conclusion));
      if (getSectionProof(userSections, 'conclusion') === 'required') body.push(...figureSlot({ image: null, hint: "result proof", placeholders, maxH, captionText: "Result screenshot placeholder" }));
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

module.exports = { buildPracticalDocx, imageInfo };