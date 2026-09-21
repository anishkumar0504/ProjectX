const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ApiError } = require("../utils/apiError");

exports.list = async () => {
  const list = await prisma.template.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });
  return list.map(this.parse);
};

exports.getBySlug = async (slug) => {
  const t = await prisma.template.findUnique({ where: { slug } });
  if (!t || !t.isActive) throw new ApiError(404, "Template not found");
  return this.parse(t);
};

exports.getById = async (id) => {
  const t = await prisma.template.findUnique({ where: { id } });
  if (!t) throw new ApiError(404, "Template not found");
  return this.parse(t);
};

exports.parse = (t) => ({
  id: t.id,
  slug: t.slug,
  name: t.name,
  description: t.description,
  subject: t.subject,
  previewImageUrl: t.previewImageUrl, //  MAKE SURE THIS LINE EXISTS
  defaultContent: safeJson(t.defaultContent, {}),
  defaultMeta: safeJson(t.defaultMeta, {}),
  defaultSections: safeJson(t.defaultSections, allSectionsOn()),
  defaultLayout: safeJson(t.defaultLayout, { mode: "perStep" }),
});

function safeJson(s, fallback) {
  try { return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}

function allSectionsOn() {
  return [
    { id: "aim",            type: "aim",            title: "Aim",                    enabled: true, proof: "optional" },
    { id: "objectives",     type: "objectives",     title: "Objectives",             enabled: true, proof: "optional" },
    { id: "services",       type: "services",       title: "AWS Services Used",      enabled: true, proof: "optional" },
    { id: "prerequisites",  type: "prerequisites",  title: "Prerequisites",          enabled: true, proof: "optional" },
    { id: "architecture",   type: "architecture",   title: "Architecture Diagram",   enabled: true, proof: "optional" },
    { id: "steps",          type: "steps",          title: "Step-by-Step Implementation", enabled: true, proof: "optional" },
    { id: "verification",   type: "verification",   title: "Verification / Testing", enabled: true, proof: "required" },
    { id: "expectedOutput", type: "expectedOutput", title: "Expected Output",        enabled: true, proof: "required" },
    { id: "conclusion",     type: "conclusion",     title: "Result / Conclusion",    enabled: true, proof: "optional" },
  ];
}