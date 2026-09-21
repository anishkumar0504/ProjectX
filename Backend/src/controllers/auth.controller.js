const authService = require("../services/auth.service");
const { ApiError } = require("../utils/apiError");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    const token = authService.signToken(user);
    // create a session
    const session = await authService.createSession(user.id);
    res.status(201).json({
      user: authService.sanitize(user),
      token,
      session: { id: session.id, expiresAt: session.expiresAt },
    });
  } catch (e) { next(e); }
};

exports.login = async (req, res, next) => {
  try {
    const user = await authService.login(req.body.email, req.body.password);
    const token = authService.signToken(user);
    const session = await authService.createSession(user.id);
    res.json({
      user: authService.sanitize(user),
      token,
      session: { id: session.id, expiresAt: session.expiresAt },
    });
  } catch (e) { next(e); }
};

exports.me = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.json({ user: null });
    }
    const token = authHeader.slice(7);
    const user = await authService.getUserFromToken(token);
    res.json({ user: user ? authService.sanitize(user) : null });
  } catch (e) { next(e); }
};

exports.logout = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    if (sessionId) {
      await prisma.session.deleteMany({ where: { id: sessionId } });
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
};