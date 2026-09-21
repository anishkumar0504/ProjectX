exports.errorHandler = (err, _req, res, _next) => {
  const status = err.status || 500;
  const message = err.message || "Internal server error";
  if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
    console.error(err);
  }
  res.status(status).json({ error: message });
};