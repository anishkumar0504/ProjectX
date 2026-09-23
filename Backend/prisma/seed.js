const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const prisma = new PrismaClient();

const TEMPLATE_FILE = path.join(__dirname, "../templates/vpc-endpoint.json");

const TEMPLATES = [
  {
    slug: "cloud-computing-ec2-deployment",
    name: "Deploying a Web Application on AWS EC2",
    description: "Gateway VPC Endpoint for private S3 access from a private EC2 instance.",
    subject: "Cloud Architecture and Services",
    defaultContent: JSON.stringify(JSON.parse(fs.readFileSync(TEMPLATE_FILE, "utf8"))),
    defaultMeta: JSON.stringify({
      program: "B.Tech TY (CCSA)",
      school: "School of Computer Science, Engineering and Applications(SCSEA)",
      facultyName: "Name of your Faculty",
    }),
    // ✅ MUST BE AN ARRAY: This matches the ReportSection interface
    defaultSections: JSON.stringify([
      { id: "aim", type: "aim", title: "Aim", description: "", enabled: true, proof: "optional" },
      { id: "objectives", type: "objectives", title: "Objectives", description: "", enabled: true, proof: "optional" },
      { id: "services", type: "services", title: "AWS Services Used", description: "", enabled: true, proof: "optional" },
      { id: "prerequisites", type: "prerequisites", title: "Prerequisites", description: "", enabled: true, proof: "optional" },
      { id: "architecture", type: "architecture", title: "Architecture Diagram", description: "", enabled: true, proof: "optional" },
      { id: "steps", type: "steps", title: "Step-by-Step Implementation", description: "", enabled: true, proof: "optional" },
      { id: "verification", type: "verification", title: "Verification / Testing", description: "", enabled: true, proof: "required" },
      { id: "expectedOutput", type: "expectedOutput", title: "Expected Output", description: "", enabled: true, proof: "required" },
      { id: "conclusion", type: "conclusion", title: "Result / Conclusion", description: "", enabled: true, proof: "optional" },
    ]),
    defaultLayout: JSON.stringify({ mode: "perStep" }),
     screenshots: JSON.stringify([
      "/templates/cloud-computing-ec2-deployment/1.png",
      "/templates/cloud-computing-ec2-deployment/2.png",
    ]),
  },
];


async function main() {
   console.log("🧹 Clearing existing templates from database...");
  await prisma.template.deleteMany();
  console.log("✅ Old templates cleared.");

  for (const t of TEMPLATES) {
    await prisma.template.upsert({
      where: { slug: t.slug },
      update: t,
      create: t,
    });
  }
  console.log(`✅ Seeded ${TEMPLATES.length} template(s)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());