const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { hash, compare } = require("../utils/hash");
const { sign, verify } = require("../utils/jwt");
const { ApiError } = require("../utils/apiError");
const config = require("../config");

exports.register = async ({ email, password }) => {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new ApiError(409, "Email already registered");
  return prisma.user.create({
    data: { email, password: await hash(password) },
  });
};

exports.login = async (email, password) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new ApiError(401, "Invalid credentials");
  const ok = await compare(password, user.password);
  if (!ok) throw new ApiError(401, "Invalid credentials");
  return user;
};

exports.signToken = (user) => sign({ sub: user.id, role: user.role });

exports.getUserFromToken = async (token) => {
  try {
    const payload = verify(token);
    return prisma.user.findUnique({ where: { id: payload.sub } });
  } catch {
    return null;
  }
};

exports.createSession = async (userId, data = {}) => {
  // expire old sessions
  await prisma.session.deleteMany({
    where: { userId, expiresAt: { lt: new Date() } },
  });
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return prisma.session.create({
    data: {
      userId,
      token: `sess_${require("crypto").randomBytes(16).toString("hex")}`,
      data: JSON.stringify(data),
      expiresAt,
    },
  });
};

exports.sanitize = (u) => ({
  id: u.id,
  email: u.email,
  role: u.role,
  credits: u.credits,
});