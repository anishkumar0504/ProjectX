const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  message: { error: "Too many attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const generationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 16,
  message: { error: "Too many generation requests, slow down." },
});

const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  message: { error: "Too many payment requests, please wait a moment." },
});

module.exports = { authLimiter, generationLimiter, paymentLimiter };