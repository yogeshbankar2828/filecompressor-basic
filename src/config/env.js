require("dotenv").config();

module.exports = {
  port: Number(process.env.PORT) || 3000,
  mongoUri: (process.env.MONGODB_URI || "").trim().replace(/^["']|["']$/g, ""),
  siteUrl: (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  customDomain: (process.env.CUSTOM_DOMAIN || "").trim().toLowerCase(),
  jobTtlMinutes: Number(process.env.JOB_TTL_MINUTES) || 60,
  maxFiles: Number(process.env.MAX_FILES) || 20,
  maxBytes: Number(process.env.MAX_BYTES) || 50 * 1024 * 1024,
  uploadDir: "uploads",
  outputDir: "output",
};
