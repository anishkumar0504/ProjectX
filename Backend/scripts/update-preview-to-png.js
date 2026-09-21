const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function update() {
  await prisma.template.update({
    where: { slug: "vpc-endpoint-s3" },
    data: { previewImageUrl: "/previews/vpc-endpoint-s3.png" },
  });
  console.log("✅ Updated previewImageUrl to PNG");
  await prisma.$disconnect();
}

update().catch(console.error);