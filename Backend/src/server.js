require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
const routes = require("./routes");
const { errorHandler } = require("./middleware/error.middleware");
const config = require("./config");
console.log("🔑 DEBUG - GEMINI KEY:", process.env.GEMINI_API_KEY ? `LOADED (Starts with: ${process.env.GEMINI_API_KEY.substring(0, 6)}...)` : "NOT FOUND (undefined)");

const app = express();
app.set('trust proxy', 1); // required on Render so req.ip is the real client IP, not Render's proxy
// ensure upload dirs
for (const d of ["uploads/temp", "uploads/outputs"]) {
  fs.mkdirSync(path.join(__dirname, "..", d), { recursive: true });
}

// 👇 ADD THIS LINE to serve the preview PNGs from the public/previews folder
app.use("/previews", express.static(path.join(__dirname, "..", "public", "previews")));
app.use("/templates", express.static(path.join(__dirname, "..", "public","templates")));
app.use(cors());
app.use(
  "/api/payment/webhook",
  express.raw({ type: "application/json" })
);
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true }));
if (config.nodeEnv !== "test") app.use(morgan("dev"));
const cleanupRoutes = require("./routes/cleanup.routes");
app.use("/api", cleanupRoutes);

// serve generated docx files
app.use("/files", express.static(path.join(__dirname, "..", "uploads/outputs")));

app.use("/api", routes);

app.use(errorHandler);

if (config.nodeEnv !== "test") {
  app.listen(config.port, () => {
    console.log(`🚀 Server running on http://localhost:${config.port}`);
    console.log(`🔐 Auth middleware: ${config.authMiddlewareEnabled ? "ENABLED" : "DISABLED (testing mode)"}`);
  });
}

module.exports = app;

