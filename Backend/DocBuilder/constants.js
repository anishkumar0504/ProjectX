const {
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
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

const thin = { style: BorderStyle.SINGLE, size: 6, color: "000000" };
const allBorders = { top: thin, bottom: thin, left: thin, right: thin };

module.exports = {
  FONT, MONO, TEXT_WIDTH, BLUE, HEAD, ORANGE, MAX_IMG_W, MAX_IMG_H, SLOT_H, thin, allBorders,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
  LineRuleType, HeightRule, LevelFormat, PageNumber, PageBorderDisplay,
  PageBorderOffsetFrom, PageBorderZOrder,
};