  require("dotenv").config();
  module.exports = {
    port: process.env.PORT || 4000,
    nodeEnv: process.env.NODE_ENV || "development",
    dbUrl: process.env.DATABASE_URL || "file:./dev.db",
    jwt: {
      secret: process.env.JWT_SECRET || "dev-secret",
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      models: (process.env.GEMINI_MODEL || "gemini-2.5-flash-lite").split(",").map(s => s.trim()),
    },
    uploadDir: process.env.UPLOAD_DIR || "./uploads",
    authMiddlewareEnabled: process.env.AUTH_MIDDLEWARE_ENABLED === "true",
  };