const { verify } = require("../utils/jwt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ApiError } = require("../utils/apiError");
const config = require("../config");

module.exports = async (req, _res, next) => {
  // If disabled (testing phase), just continue
  if (!config.authMiddlewareEnabled) return next();

  try {
    const h = req.headers.authorization || "";
    if (!h.startsWith("Bearer ")) throw new ApiError(401, "Missing token");
    const payload = verify(h.slice(7));
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new ApiError(401, "User not found");
    req.user = user;
    next();
  } catch (e) { next(e); }
};