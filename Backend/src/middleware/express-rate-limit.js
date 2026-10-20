
const rateLimit = require("express-rate-limit");

const isTest = process.env.NODE_ENV === "test";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1000 : 5,
  message: { error: "Too many attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const generationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isTest ? 1000 : 16,
  message: { error: "Too many generation requests, slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: isTest ? 1000 : 15,
  message: { error: "Too many payment requests, please wait a moment." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter, generationLimiter, paymentLimiter };
