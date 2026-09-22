const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Single source of truth — frontend now fetches this from GET /api/payment/plans
// instead of hardcoding SUBSCRIPTION_CONFIG.
const plans = [
  {
    id: "starter",
    name: "Starter Pack",
    originalPrice: 69,
    price: 49,
    credits: 50, // 5 files
    features: [
      "50 Processing Credits",
      "Valid for 30 days",
      "Standard AI Speed",
      "Basic Support",
    ],
    popular: false,
  },
  {
    id: "pro",
    name: "PRO MODE",
    originalPrice: 249,
    price: 149,
    credits: 200, // 20 files
    features: [
      "200 Processing Credits",
      "Valid for 60 days",
      "Priority GPT-4 + Claude",
      "Batch Screenshot Uploads",
      "Advanced Formatting",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Semester Pass",
    originalPrice: 799,
    price: 499,
    credits: 1000, // 100 files
    features: [
      "1000 Processing Credits",
      "Valid for 90 days",
      "Highest Priority Processing",
      "Custom College Templates",
      "Unlimited Batch Uploads",
      "Dedicated Support",
    ],
    popular: false,
  },
];

async function main() {
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    });
    console.log(`Seeded plan: ${plan.id}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });

// Run with: node prisma/seed.js
// Or wire it as the official Prisma seed by adding to package.json:
//   "prisma": { "seed": "node prisma/seed.js" }
// then run: npx prisma db seed