const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Helper to safely return user data (no passwords)
const sanitizeUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  credits: user.credits,
  provider: user.provider,
});

// Helper to generate session and JWT (used by all auth methods)
const createAuthPayload = async (user) => {
  const sessionToken = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await prisma.session.create({
    data: {
      userId: user.id,
      token: sessionToken,
      expiresAt,
      data: JSON.stringify({ ip: "unknown", userAgent: "unknown" }),
    },
  });

  const jwtToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    user: sanitizeUser(user),
    token: jwtToken,
    session: { id: sessionToken, expiresAt },
  };
};

class AuthService {
  // 1. Traditional Register
  async register({ email, password, name }) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new Error("Email already registered");

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        provider: "LOCAL", // Matches Prisma schema
        credits: 0,
      },
    });

    return user;
  }

  // 2. Traditional Login
  async login(email, password) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Invalid credentials");
    
    // Prevent logging in with password if the account was created via Google
    if (!user.password || user.provider === "GOOGLE") {
      throw new Error("Please sign in with Google");
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Invalid credentials");

    return user;
  }

  // 3. Google OAuth Handler
  async googleSignIn(googleProfile) {
    let user = await prisma.user.findUnique({ where: { email: googleProfile.email } });

    if (!user) {
      // Auto-register new Google users
      user = await prisma.user.create({
        data: {
          email: googleProfile.email,
          name: googleProfile.name,
          provider: "GOOGLE",      // Matches Prisma schema (uppercase)
          providerId: googleProfile.sub, // Save Google's unique ID
          credits: 20,             // Welcome bonus
        },
      });
    } else if (user.provider !== "GOOGLE") {
      // Security: Prevent hijacking existing LOCAL accounts via OAuth
      throw new Error("An account with this email already exists. Please sign in with your password.");
    }

    // Return the exact same payload structure as login/register
    return createAuthPayload(user);
  }

  // 4. Utility: Sign Token (for traditional flow)
  signToken(user) {
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
  }

  // 5. Utility: Create Session (for traditional flow)
  async createSession(userId) {
    const token = crypto.randomBytes(48).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_DURATION);

    await prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
        data: JSON.stringify({ ip: "unknown", userAgent: "unknown" }),
      },
    });

    return { id: token, expiresAt };
  }

  // 6. Utility: Get User From Token
  async getUserFromToken(token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      return prisma.user.findUnique({ where: { id: payload.userId } });
    } catch {
      return null;
    }
  }

  // 7. Utility: Sanitize User
  sanitize(user) {
    return sanitizeUser(user);
  }

  // 8. Sign Out
  async signOut(sessionToken) {
    await prisma.session.deleteMany({ where: { token: sessionToken } });
    return { message: "Signed out successfully" };
  }
}

module.exports = new AuthService();