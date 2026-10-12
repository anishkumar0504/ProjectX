const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getStats = async (req, res) => {
  try {
    // 1. Total Registered Users
    const totalUsers = await prisma.user.count();

    // 2. Total Documents Generated
    const totalDocuments = await prisma.document.count();

    // 3. Total Tokens/Credits Used (Sum of credits from PAID orders)
    // Note: If you track "tokens used" differently (e.g., a specific field in User/Document), 
    // you can adjust this query accordingly.
    const creditsAggregate = await prisma.order.aggregate({
      _sum: {
        credits: true,
      },
      where: {
        status: "PAID",
      },
    });
    
    const totalCredits = creditsAggregate._sum.credits || 0;

    // Optional: Format numbers to have a "+" suffix for the frontend (e.g., 150 -> "150+")
    const formatWithPlus = (num) => (num > 0 ? `${num}+` : "0");

    res.status(200).json({
      success: true,
      data: {
        raw: {
          totalUsers,
          totalDocuments,
          totalCredits,
        },
        formatted: {
          totalUsers: formatWithPlus(totalUsers),
          totalDocuments: formatWithPlus(totalDocuments),
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