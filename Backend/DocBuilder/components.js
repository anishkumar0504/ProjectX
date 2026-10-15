const { Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, Header, Footer } = require("docx");
const {
  FONT, MONO, TEXT_WIDTH, BLUE, HEAD, ORANGE, SLOT_H, allBorders,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
  LineRuleType, HeightRule
} = require("./constants");
const { fit, imageInfo } = require("./utils");

const run = (text, o = {}) => new TextRun({ text, font: FONT, size: 22, ...o });

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
                  children: [new TextRun({ children: [require("docx").PageNumber.CURRENT], bold: true, color: "FFFFFF", font: FONT, size: 20 })],
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

// ✅ Added hideEmptyPlaceholders parameter
function stepBlock(step, i, figNo, items, placeholders, maxH, hideEmptyPlaceholders = false) {
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

  // ✅ CRITICAL FIX: If hideEmptyPlaceholders is true and no items, return empty array. 
  // This prevents the "Paste screenshot here" box from being generated.
  const slots = items.length ? items : (hideEmptyPlaceholders ? [] : [{ image: null, caption: step.screenshotCaption }]);
  
  slots.forEach((it, k) =>
    out.push(...figureSlot({
      image: it.image, hint: k === 0 ? step.screenshotHint : "", placeholders, maxH,
      captionText: `Fig ${figNo + k}: ${it.caption || step.screenshotCaption}`,
    }))
  );
  return { blocks: out, used: slots.length };
}

module.exports = {
  run, headerLine, infoCell, buildHeader, buildFooter,
  sectionHeading, bodyText, bullet, serviceBullet, caption, figureSlot, stepBlock
};