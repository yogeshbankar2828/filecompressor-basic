function errorHandler(err, _req, res, _next) {
  const status = err.status || (err.name === "MulterError" ? 400 : 500);
  const message = err.message || "Request failed.";
  res.status(status).json({ error: message });
}

module.exports = { errorHandler };
