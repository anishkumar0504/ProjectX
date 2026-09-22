const authService = require("../services/auth.service");
const { PrismaClient } = require("@prisma/client");
const { OAuth2Client } = require("google-auth-library");

const prisma = new PrismaClient();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// 1. REGISTER (Traditional)
exports.register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
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

// 2. LOGIN / SIGNIN (Traditional)
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
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
// 3. GOOGLE OAUTH
exports.google = async (req, res, next) => {
  try {
    const { credential, access_token } = req.body; 
    
    if (!credential && !access_token) {
      return res.status(400).json({ error: "Missing Google credential or access_token" });
    }

    let googleProfile;

    if (credential) {
      // Option A: Verify ID Token (JWT) - if frontend sends 'credential'
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      googleProfile = {
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      };
    } else {
      // Option B: Verify Access Token - if frontend sends 'access_token' (from useGoogleLogin)
      const userInfoRes = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`);
      
      if (!userInfoRes.ok) {
        throw new Error("Failed to verify Google access token");
      }
      
      const userInfo = await userInfoRes.json();
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
    // 🔴 THIS WILL NOW PRINT THE EXACT ERROR TO YOUR TERMINAL
    console.error("🔴 Google Auth Error Details:", err.message || err);
    
    res.status(401).json({ 
      error: err.message || "Google authentication failed" 
    });
  }
};

// 4. GET ME (Session Check)
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

// 5. LOGOUT / SIGNOUT (Merged Logic)
exports.logout = async (req, res, next) => {
  try {
    // Logic A: Header-based signout
    const sessionToken = req.headers["x-session-token"];
    if (sessionToken) {
      await authService.signOut(sessionToken);
      return res.json({ message: "Signed out" });
    }

    // Logic B: Body-based logout
    const { sessionId } = req.body;
    if (sessionId) {
      await prisma.session.deleteMany({ where: { id: sessionId } });
    }
    
    res.json({ ok: true });
  } catch (e) { 
    next(e); 
  }
};