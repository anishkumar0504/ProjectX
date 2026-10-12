const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getStats = async (req, res) => {
  try {
    // 1. Total Registered Users
    const totalUsers = await prisma.user.count();

    // 2. Total Documents Generated
    const totalDocuments = await prisma.document.count();

    // 3. Total Active Templates Available
    const totalActiveTemplates = await prisma.template.count({
      where: { isActive: true },
    });

    // 4. Total Successful (Paid) Orders
    const totalPaidOrders = await prisma.order.count({
      where: { status: "PAID" },
    });

    // 5. Total Credits/Tokens (Sum of credits from PAID orders)
    const creditsAggregate = await prisma.order.aggregate({
      _sum: {
        credits: true,
      },
      where: {
        status: "PAID",
      },
    });
    
    const totalCredits = creditsAggregate._sum.credits || 0;

    // 🌟 Professional Marketing Formatter
    // Rounds down to nearest 10, 100, 1000 for a clean "SaaS" look
    const formatWithPlus = (num) => {
      if (num === 0) return "0";
      if (num < 10) return `${num}+`; // Keep exact for single digits
      
      const magnitude = Math.pow(10, Math.floor(Math.log10(num)));
      const rounded = Math.floor(num / magnitude) * magnitude;
      
      return `${rounded}+`;
    };

    res.status(200).json({
      success: true,
      data: {
        raw: {
          totalUsers,
          totalDocuments,
          totalActiveTemplates,
          totalPaidOrders,
          totalCredits,
        },
        formatted: {
          totalUsers: formatWithPlus(totalUsers),
          totalDocuments: formatWithPlus(totalDocuments),
          totalActiveTemplates: formatWithPlus(totalActiveTemplates),
          totalPaidOrders: formatWithPlus(totalPaidOrders),
          totalCredits: formatWithPlus(totalCredits),
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
};

module.exports = {
  getStats,
};