const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { buildPracticalDocx } = require("../Docbuilder");

const prisma = new PrismaClient();

async function generatePreviews() {
  console.log("📸 Generating template previews...\n");

  const templates = await prisma.template.findMany();
  console.log(`Found ${templates.length} template(s)\n`);

  // Create previews directory
  const previewsDir = path.join(__dirname, "../public/previews");
  if (!fs.existsSync(previewsDir)) {
    fs.mkdirSync(previewsDir, { recursive: true });
    console.log("✅ Created previews directory\n");
  }

  for (const template of templates) {
    try {
      console.log(` Processing: ${template.name}`);

      const content = JSON.parse(template.defaultContent);
      const meta = JSON.parse(template.defaultMeta);

      // Generate a minimal preview document (first page only)
      const buf = await buildPracticalDocx({
        meta: {
          studentName: "Sample Student",
          prn: "20240000000",
          facultyName: meta.facultyName || "Faculty Name",
          title: template.name,
          subject: template.subject,
          program: meta.program || "B.Tech",
          school: meta.school || "DYPIU",
          logoPath: path.join(__dirname, "../dypiu.png"),
        },
        content: {
          aim: content.aim || "Sample aim text for preview purposes",
          objectives: (content.objectives || []).slice(0, 3),
          services: [],
          prerequisites: [],
          architecture: content.architecture || { description: "Architecture diagram", caption: "Architecture" },
          steps: (content.steps || []).slice(0, 2), // First 2 steps
          verification: [],
          expectedOutput: "",
          conclusion: "",
        },
        screenshots: {},
        options: { 
          placeholders: "blank",
          screenshotNote: false,
        },
      });

      // Save as DOCX
      const docxPath = path.join(previewsDir, `${template.slug}.docx`);
      fs.writeFileSync(docxPath, buf);
      console.log(`   ✅ Saved: ${template.slug}.docx`);

      // Update database with preview path
      await prisma.template.update({
        where: { id: template.id },
        data: { previewImageUrl: `/previews/${template.slug}.docx` },
      });
      console.log(`   📝 Updated database\n`);

    } catch (error) {
      console.error(`   ❌ Error processing ${template.slug}:`, error.message);
    }
  }

  console.log("\n✨ Preview generation complete!");
  console.log("\n📌 Next steps:");
  console.log("1. Open each .docx file in Microsoft Word or LibreOffice");
  console.log("2. Export/Save As PNG (first page only)");
  console.log("3. Name them: vpc-endpoint-s3.png, etc.");
  console.log("4. Update the database previewImageUrl to point to .png files");
}

generatePreviews()
  .catch(console.error)
  .finally(() => prisma.$disconnect());