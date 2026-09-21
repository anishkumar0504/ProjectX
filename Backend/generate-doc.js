// One-page DYPIU practical template (header + footer + page border, blank body)
// Usage:  npm install docx   (once)
//         node generate-template.js
// Keep dypiu.png in the same folder as this script.

const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, LineRuleType, PageNumber, PageBorderDisplay,
  PageBorderOffsetFrom, PageBorderZOrder,
} = require("docx");

// ---------- Edit these ----------
const STUDENT_NAME = "ANISH KUMAR";
const PRN = "20240802503";
const PRACTICAL_TITLE = "Access S3 from Private EC2 Instance using VPC Endpoint ";
const FACULTY_NAME = "Ms. Tahreem Shaikh";
const SCHOOL = "School of Computer Science, Engineering and Applications(SCSEA)";
const PROGRAM = "B.Tech TY (CCSA)";
const SUBJECT = "Subject : Cloud Architecture and Services";
const LOGO_FILE = path.join(__dirname, "dypiu.png");
const OUTPUT_FILE = "DYPIU_Practical_Template.docx";
// --------------------------------

const FONT = "Times New Roman";
const TEXT_WIDTH = 9100; // DXA, width of header table / footer table
const BLUE = "4A6FA5";
const ORANGE = "E8823A";

// ---------- Header ----------
const centered = (text, opts = {}) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 0, line: 264, lineRule: LineRuleType.AUTO, ...opts.spacing },
    children: [new TextRun({ text, bold: true, font: FONT, size: 22 })],
  });

const thin = { style: BorderStyle.SINGLE, size: 6, color: "000000" };
const allBorders = { top: thin, bottom: thin, left: thin, right: thin };
const cellMargins = { top: 30, bottom: 30, left: 100, right: 100 };

const cell = (text, width, { bold = false, span = 1 } = {}) =>
  new TableCell({
    width: { size: width, type: WidthType.DXA },
    columnSpan: span,
    borders: allBorders,
    margins: cellMargins,
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        spacing: { before: 0, after: 0 },
        children: [new TextRun({ text, bold, font: FONT, size: 20 })],
      }),
    ],
  });

const COLS = [2213, 3625, 997, 2265]; // sums to 9100
const ROW_H = { value: 360, rule: "atLeast" };

const infoTable = new Table({
  width: { size: TEXT_WIDTH, type: WidthType.DXA },
  columnWidths: COLS,
  rows: [
    new TableRow({
      height: ROW_H,
      children: [
        cell("Name of the Student:", COLS[0], { bold: true }),
        cell(STUDENT_NAME, COLS[1]),
        cell("PRN", COLS[2], { bold: true }),
        cell(PRN, COLS[3]),
      ],
    }),
    new TableRow({
      height: ROW_H,
      children: [
        cell("Title of Practical :", COLS[0], { bold: true }),
        cell(PRACTICAL_TITLE, COLS[1] + COLS[2] + COLS[3], { span: 3 }),
      ],
    }),
    new TableRow({
      height: ROW_H,
      children: [
        cell("Faculty Name:", COLS[0], { bold: true }),
        cell(FACULTY_NAME, COLS[1]),
        cell("Sign:", COLS[2], { bold: true }),
        cell("", COLS[3]),
      ],
    }),
  ],
});

const header = new Header({
  children: [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 100 },
      children: [
        new ImageRun({
          type: "png",
          data: fs.readFileSync(LOGO_FILE),
          transformation: { width: 165, height: 60 },
          altText: { title: "DYPIU logo", description: "D Y Patil International University logo", name: "logo" },
        }),
      ],
    }),
    centered(SCHOOL),
    centered(PROGRAM),
    centered(SUBJECT, { spacing: { after: 140 } }),
    infoTable,
    // blue rule under the table
    new Paragraph({
      spacing: { before: 0, after: 0, line: 440, lineRule: LineRuleType.EXACT },
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: BLUE, space: 1 } },
      children: [],
    }),
  ],
});

// ---------- Footer ----------
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const BOX_W = 1230;

const footer = new Footer({
  children: [
    // thin grey rule with a gap below it
    new Paragraph({
      spacing: { before: 0, after: 0, line: 340, lineRule: LineRuleType.EXACT },
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF", space: 1 } },
      children: [],
    }),
    new Table({
      width: { size: TEXT_WIDTH, type: WidthType.DXA },
      columnWidths: [TEXT_WIDTH - BOX_W, BOX_W],
      rows: [
        new TableRow({
          height: { value: 310, rule: "exact" },
          children: [
            new TableCell({
              width: { size: TEXT_WIDTH - BOX_W, type: WidthType.DXA },
              borders: noBorders,
              margins: { top: 0, bottom: 0, left: 0, right: 0 },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  spacing: { before: 0, after: 0 },
                  children: [new TextRun({ text: `PRN: ${PRN}`, font: FONT, size: 20 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: BOX_W, type: WidthType.DXA },
              borders: noBorders,
              margins: { top: 0, bottom: 0, left: 0, right: 0 },
              shading: { type: ShadingType.CLEAR, fill: ORANGE, color: "auto" },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 0, after: 0 },
                  children: [
                    new TextRun({ children: [PageNumber.CURRENT], bold: true, color: "FFFFFF", font: FONT, size: 20 }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new Paragraph({ spacing: { before: 0, after: 0, line: 20, lineRule: LineRuleType.EXACT }, children: [] }),
  ],
});

// ---------- Document ----------
const border = (space) => ({ style: BorderStyle.SINGLE, size: 6, color: "000000", space });

const doc = new Document({
  styles: { default: { document: { run: { font: FONT, size: 22 } } } },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 4450, bottom: 1240, left: 1514, right: 1292, header: 520, footer: 500 },
          borders: {
            pageBorders: {
              display: PageBorderDisplay.ALL_PAGES,
              offsetFrom: PageBorderOffsetFrom.PAGE,
              zOrder: PageBorderZOrder.FRONT,
            },
            pageBorderTop: border(24),
            pageBorderLeft: border(24),
            pageBorderRight: border(21),
            pageBorderBottom: border(19),
          },
        },
      },
      headers: { default: header },
      footers: { default: footer },
      children: [new Paragraph({ children: [] })], // blank body
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUTPUT_FILE, buf);
  console.log("Created", OUTPUT_FILE);
});