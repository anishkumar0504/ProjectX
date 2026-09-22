const { verify } = require("../utils/jwt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ApiError } = require("../utils/apiError");
const config = require("../config");
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = verify(token);
    req.user = { id: decoded.userId || decoded.id };
    next();
  } catch (err) {
    console.error("[auth.middleware] verify failed:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};