const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const path = require("path");
const fs = require("fs");
const templateService = require("./template.service");
const geminiService = require("./gemini.service");
const docBuilderService = require("./docBuilder.service");
const { ApiError } = require("../utils/apiError");

// ✅ Matches the "10 credits = 1 file" rule from your pricing page
const CREDIT_COST_PER_DOCUMENT = 10;

exports.getOrCreateTestUser = async () => {
  let user = await prisma.user.findUnique({ where: { email: "test@local.dev" } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "test@local.dev",
        password: "testpassword123",
        role: "USER",
        credits: 9999,
      },
    });
  }
  return user;
};

exports.generate = async ({ userId, body, files }) => {
  let validUserId = userId;
  if (!validUserId || validUserId === "test-user-id") {
    const testUser = await exports.getOrCreateTestUser();
    validUserId = testUser.id;
  }

  // 1. Destructure body (useGemini removed as it's no longer needed/used)
  const { templateSlug, meta, sections, imageLayout, referenceText } = body;

  // 2. Parse meta (Declared ONLY ONCE to prevent SyntaxError)
  let parsedMeta = meta;
  if (typeof meta === "string") { 
    try { parsedMeta = JSON.parse(meta); } catch {} 
  }

  // 3. Validate required fields
  const SAMPLES = ["name of your faculty", "name of faculty", "enter the name of faculty"];
  for (const k of ["studentName", "prn", "facultyName", "title"]) {
    const v = String(parsedMeta?.[k] || "").trim();
    if (!v || SAMPLES.includes(v.toLowerCase())) {
      throw new ApiError(400, `Please provide a valid ${k}`);
    }
  }

  const template = await templateService.getBySlug(templateSlug);

  // 4. Atomic Credit Deduction (Declared ONLY ONCE)
  const deduction = await prisma.user.updateMany({
    where: { id: validUserId, credits: { gte: CREDIT_COST_PER_DOCUMENT } },
    data: { credits: { decrement: CREDIT_COST_PER_DOCUMENT } },
  });
  
  if (deduction.count === 0) {
    throw new ApiError(402, `Insufficient credits. This action requires ${CREDIT_COST_PER_DOCUMENT} credits.`);
  }
  console.log(`💳 Deducted ${CREDIT_COST_PER_DOCUMENT} credits from user ${validUserId}`);

  // 5. Build finalMeta (Validation above guarantees these are safe to trim)
  const finalMeta = {
    studentName: parsedMeta.studentName.trim(),
    prn: parsedMeta.prn.trim(),
    facultyName: parsedMeta.facultyName.trim(),
    title: parsedMeta.title.trim(),
    subject: parsedMeta?.subject || template.subject || "Cloud Architecture and Services",
    program: parsedMeta?.program || template.defaultMeta?.program || "B.Tech TY (CCSA)",
    school: template.defaultMeta?.school || "School of Computer Science, Engineering and Applications(SCSEA)",
    namePrefix: parsedMeta?.namePrefix || parsedMeta?.prn || "Lab",
    logoPath: path.join(__dirname, "../../dypiu.png"),
  };

  // 6. Process Files
  const filesArray = Array.isArray(files) ? files : files ? Object.values(files).flat() : [];
  const refFile = filesArray.find((f) => f.fieldname === "reference");
  const shotFiles = filesArray.filter((f) => f.fieldname === "shots" || f.fieldname === "screenshot");

  // 7. Parse Sections
  let parsedSections = sections;
  if (typeof sections === "string") {
    try { parsedSections = JSON.parse(sections); } catch {}
  }
  if (!parsedSections) parsedSections = template.defaultSections;

  // 8. Create Document Record
  const doc = await prisma.document.create({
    data: {
      userId: validUserId,
      templateId: template.id,
      meta: JSON.stringify(finalMeta),
      sections: JSON.stringify(parsedSections),
      imageLayout: imageLayout || "perStep",
      status: "GENERATING",
    },
  });

  try {
    // 9. Prepare Gemini Payload
    let enabledKeys = [];
    let customSectionsForGemini = [];
    
    if (Array.isArray(parsedSections)) {
      enabledKeys = parsedSections.filter(s => s.enabled !== false).map(s => s.type);
      customSectionsForGemini = parsedSections
        .filter(s => s.type === "custom" && s.enabled !== false)
        .map(s => ({ id: s.id, title: s.title, prompt: s.prompt || "" }));
    } else {
      enabledKeys = Object.entries(parsedSections || {}).filter(([_, e]) => e).map(([k]) => k);
    }

    // 10. Call Gemini (No more broken "useGemini" ReferenceError)
    const content = await geminiService.generatePracticalContent({
      title: finalMeta.title,
      subject: finalMeta.subject,
      namePrefix: finalMeta.namePrefix,
      referenceDocx: refFile ? refFile.path : undefined,
      referenceText: referenceText || undefined,
      images: shotFiles.map((f) => ({ path: f.path, name: f.originalname })),
      enabledSections: enabledKeys,
      customSections: customSectionsForGemini,
    });

    // 11. Build and Save DOCX
    const outputFilename = `${doc.id}.docx`;
    const outputPath = path.join(__dirname, "../../uploads/outputs", outputFilename);

    const buf = await docBuilderService.buildPracticalDocx({
      meta: finalMeta,
      content: content,
      screenshots: { all: shotFiles.map((f) => f.path) },
      options: {
        sections: parsedSections,
        imageLayout: imageLayout || "perStep",
        placeholders: "box",
        appendUnassigned: true,
        screenshotNote: false,
      },
    });

    fs.writeFileSync(outputPath, buf);
    console.log(`✅ Final document saved to disk: ${outputFilename}`);

    // 12. Cleanup Temp Files
    for (const f of filesArray) {
      try {
        fs.unlinkSync(f.path);
        console.log(`🗑️ Cleaned up temp input: ${f.originalname}`);
      } catch (cleanupErr) {
        console.warn(`⚠️ Could not delete temp file: ${f.path}`);
      }
    }

    // 13. Update Document Status to READY
    const updated = await prisma.document.update({
      where: { id: doc.id },
      data: {
        status: "READY",
        content: JSON.stringify(content),
        screenshots: JSON.stringify(shotFiles.map((f, i) => ({ index: i, name: f.originalname }))),
        outputPath: outputPath,
      },
    });

    return { document: exports.serialize(updated) };

  } catch (err) {
    // 14. Error Handling & Refund Logic
    for (const f of filesArray) {
      try { fs.unlinkSync(f.path); } catch {}
    }

    await prisma.document.update({
      where: { id: doc.id },
      data: { status: "FAILED", error: err.message },
    }).catch(() => {});

    // ✅ REFUND — generation failed, give the credits back
    await prisma.user.update({
      where: { id: validUserId },
      data: { credits: { increment: CREDIT_COST_PER_DOCUMENT } },
    }).catch((refundErr) => {
      console.error("⚠️ CRITICAL: Failed to refund credits after generation failure:", refundErr);
    });
    console.log(`↩️ Refunded ${CREDIT_COST_PER_DOCUMENT} credits to user ${validUserId} after failure`);

    console.error("❌ Document Generation Failed:", err);
    throw err;
  }
};

// 15. Helper Functions
exports.listForUser = async (userId) => {
  let validUserId = userId;
  if (!validUserId || validUserId === "test-user-id") {
    const testUser = await exports.getOrCreateTestUser();
    validUserId = testUser.id;
  }

  const docs = await prisma.document.findMany({
    where: { userId: validUserId },
    orderBy: { createdAt: "desc" },
    include: { template: { select: { slug: true, name: true } } },
  });
  return docs.map(exports.serialize);
};

exports.getById = async (id, userId) => {
  let validUserId = userId;
  if (!validUserId || validUserId === "test-user-id") {
    const testUser = await exports.getOrCreateTestUser();
    validUserId = testUser.id;
  }

  const doc = await prisma.document.findFirst({
    where: { id, userId: validUserId },
    include: { template: true },
  });
  if (!doc) throw new ApiError(404, "Document not found");
  return exports.serialize(doc);
};

exports.serialize = (d) => ({
  id: d.id,
  template: d.template ? { slug: d.template.slug, name: d.template.name } : null,
  meta: safeJson(d.meta, {}),
  sections: safeJson(d.sections, {}),
  imageLayout: d.imageLayout,
  status: d.status,
  error: d.error,
  createdAt: d.createdAt,
  hasOutput: !!d.outputPath,
  content: d.content ? safeJson(d.content, null) : null,
  outputPath: d.outputPath,
});

function safeJson(s, fb) {
  try { return s ? JSON.parse(s) : fb; }
  catch { return fb; }
}