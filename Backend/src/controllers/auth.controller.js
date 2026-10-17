const authService = require("../services/auth.service");
const { PrismaClient } = require("@prisma/client");
const { OAuth2Client } = require("google-auth-library");
const { z } = require("zod");

const prisma = new PrismaClient();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email(),
  password: z.string().min(8),
});

// 1. REGISTER
exports.register = async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid registration details" });
    }

    const user = await authService.register(parsed.data);
    const token = authService.signToken(user);
    const session = await authService.createSession(user.id);

    res.status(201).json({
      user: authService.sanitize(user),
      token,
      session: { id: session.id, expiresAt: session.expiresAt },
    });
  } catch (e) {
    next(e);
  }
};

// 2. LOGIN
exports.login = async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Valid email and password are required" });
    }
    const { email, password } = parsed.data;

    const user = await authService.login(email, password);
    const token = authService.signToken(user);
    const session = await authService.createSession(user.id);

    res.json({
      user: authService.sanitize(user),
      token,
      session: { id: session.id, expiresAt: session.expiresAt },
    });
  } catch (err) {
    if (err.message === "Invalid credentials" || err.message === "Please sign in with Google") {
      return res.status(401).json({ error: err.message });
    }
    next(err);
  }
};

// 3. GOOGLE OAUTH
exports.google = async (req, res) => {
  try {
    const { credential, access_token } = req.body;

    if (!credential && !access_token) {
      return res.status(400).json({ error: "Missing Google credential or access_token" });
    }

    let googleProfile;

    if (credential) {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload.email_verified) throw new Error("Google email not verified");
      googleProfile = {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      };
    } else {
      // make sure this token was issued to OUR app
      const infoRes = await fetch(
        "https://oauth2.googleapis.com/tokeninfo?access_token=" + encodeURIComponent(access_token)
      );
      if (!infoRes.ok) throw new Error("Invalid Google token");
      const info = await infoRes.json();
      if (info.aud !== GOOGLE_CLIENT_ID) throw new Error("Token not issued for this app");

      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (!userInfoRes.ok) throw new Error("Failed to fetch Google profile");
      const userInfo = await userInfoRes.json();
      if (!userInfo.verified_email) throw new Error("Google email not verified");

      googleProfile = {
        sub: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      };
    }

    const result = await authService.googleSignIn(googleProfile);
    res.json(result);
  } catch (err) {
    console.error("Google auth error:", err.message || err);
    res.status(401).json({ error: "Google authentication failed" });
  }
};

// 4. GET ME
exports.me = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.json({ user: null });
    }
    const token = authHeader.slice(7);
    const user = await authService.getUserFromToken(token);

    res.json({ user: user ? authService.sanitize(user) : null });
  } catch (e) {
    next(e);
  }
};

// 5. LOGOUT
exports.logout = async (req, res, next) => {
  try {
    const sessionToken = req.headers["x-session-token"];
    if (sessionToken) {
      await authService.signOut(sessionToken);
      return res.json({ message: "Signed out" });
    }

    const { sessionId } = req.body || {};
    if (sessionId) {
      await prisma.session.deleteMany({ where: { id: sessionId } });
    }

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};