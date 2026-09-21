const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const path = require("path");
const fs = require("fs");
const templateService = require("./template.service");
const geminiService = require("./gemini.service");
const docBuilderService = require("./docBuilder.service");
const { ApiError } = require("../utils/apiError");

// ✅ HELPER: Guarantees a valid user exists for testing
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
  // ✅ CRITICAL FIX: Ensure the userId actually exists in the database
  let validUserId = userId;
  if (!validUserId || validUserId === "test-user-id") {
    const testUser = await exports.getOrCreateTestUser();
    validUserId = testUser.id; // Use the real database ID
  }

  const { templateSlug, meta, sections, imageLayout, useGemini, referenceText, customSections } = body;
  const template = await templateService.getBySlug(templateSlug);
  
  // ✅ Safely parse meta if it's a string (from FormData)
  let parsedMeta = meta;
  if (typeof meta === 'string') {
    try { parsedMeta = JSON.parse(meta); } catch {}
  }

  const finalMeta = {
    studentName: parsedMeta?.studentName || "Student",
    prn: parsedMeta?.prn || "0000000000",
    facultyName: parsedMeta?.facultyName || template.defaultMeta?.facultyName || "Faculty",
    title: parsedMeta?.title || "Academic Report",
    subject: parsedMeta?.subject || template.subject || "Cloud Architecture and Services",
    program: parsedMeta?.program || template.defaultMeta?.program || "B.Tech TY (CCSA)",
    school: template.defaultMeta?.school || "School of Computer Science, Engineering and Applications(SCSEA)",
    namePrefix: parsedMeta?.namePrefix || parsedMeta?.prn || "Lab",
    logoPath: path.join(__dirname, "../../dypiu.png"),
  };

  const filesArray = Array.isArray(files) ? files : files ? Object.values(files).flat() : [];
  const refFile = filesArray.find((f) => f.fieldname === "reference");
  const shotFiles = filesArray.filter((f) => f.fieldname === "shots" || f.fieldname === "screenshot");

  // ✅ Parse sections if it's a JSON string from FormData
  let parsedSections = sections;
  if (typeof sections === 'string') {
    try { parsedSections = JSON.parse(sections); } catch {}
  }
  if (!parsedSections) parsedSections = template.defaultSections;

  const doc = await prisma.document.create({
    data: {
      userId: validUserId, // ✅ NOW USING A VALID DATABASE ID
      templateId: template.id,
      meta: JSON.stringify(finalMeta),
      sections: JSON.stringify(parsedSections),
      imageLayout: imageLayout || "perStep",
      status: "GENERATING",
    },
  });

  try {
    let content = template.defaultContent;
    
    // ✅ Check for enabled custom sections to force Gemini
    const hasCustomSections = Array.isArray(parsedSections) && 
      parsedSections.some(s => s.type === 'custom' && s.enabled !== false);
      
    const shouldUseGemini = useGemini === "true" || useGemini === true || 
      shotFiles.length > 0 || !!refFile || !!referenceText || hasCustomSections;

    if (shouldUseGemini) {
      let enabledKeys = [];
      let customSectionsForGemini = [];
      
      if (Array.isArray(parsedSections)) {
        enabledKeys = parsedSections.filter(s => s.enabled !== false).map(s => s.type);
        customSectionsForGemini = parsedSections
          .filter(s => s.type === 'custom' && s.enabled !== false)
          .map(s => ({ id: s.id, title: s.title, prompt: s.prompt || "" }));
      } else {
        enabledKeys = Object.entries(parsedSections || {})
          .filter(([_, enabled]) => enabled)
          .map(([key]) => key);
      }

      content = await geminiService.generatePracticalContent({
        title: finalMeta.title,
        subject: finalMeta.subject,
        namePrefix: finalMeta.namePrefix,
        referenceDocx: refFile ? refFile.path : undefined,
        referenceText: referenceText || undefined,
        images: shotFiles.map((f) => ({ path: f.path, name: f.originalname })),
        enabledSections: enabledKeys,
        customSections: customSectionsForGemini,
      });
      
    }

    const outputFilename = `${doc.id}.docx`;
    const outputPath = path.join(__dirname, "../../uploads/outputs", outputFilename);

    // 1. Build and save the final document to disk
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

    // 🧹 2. CLEANUP INPUTS ONLY: Delete temporary uploaded source files (screenshots & reference)
    // We DO NOT delete the outputPath (.docx) because the user needs to download it!
    for (const f of filesArray) {
      try {
        fs.unlinkSync(f.path);
        console.log(`🗑️ Cleaned up temp input: ${f.originalname}`);
      } catch (cleanupErr) {
        console.warn(`⚠️ Could not delete temp file: ${f.path}`);
      }
    }

    // 3. Update Database with the ACTUAL outputPath so the download route can find it
    const updated = await prisma.document.update({
      where: { id: doc.id },
      data: {
        status: "READY",
        content: JSON.stringify(content),
        screenshots: JSON.stringify(shotFiles.map((f, i) => ({ index: i, name: f.originalname }))),
        outputPath: outputPath, // ✅ SAVED! (Not null)
      },
    });

    return { document: this.serialize(updated) };

  } catch (err) {
    // 🧹 CLEANUP ON FAILURE: Delete temp inputs if generation crashes
    for (const f of filesArray) {
      try { fs.unlinkSync(f.path); } catch {}
    }
    
    await prisma.document.update({
      where: { id: doc.id },
      data: { status: "FAILED", error: err.message },
    }).catch(() => {});
    
    console.error("❌ Document Generation Failed:", err);
    throw err;
  }
};

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
  return docs.map(this.serialize);
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
  return this.serialize(doc);
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