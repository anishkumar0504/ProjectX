const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function update() {
  try {
    await prisma.template.update({
      where: { slug: 'vpc-endpoint-s3' },
      data: { previewImageUrl: '/previews/vpc-endpoint-s3.png' }
    });
    console.log('✅ Successfully updated previewImageUrl to /previews/vpc-endpoint-s3.png');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

update();