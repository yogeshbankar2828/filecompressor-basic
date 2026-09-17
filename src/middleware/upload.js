const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { v4: uuid } = require("uuid");
const env = require("../config/env");

const ALLOWED = new Set([
  ".txt",
  ".csv",
  ".json",
  ".xml",
  ".html",
  ".css",
  ".js",
  ".md",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",
  ".zip",
  ".gz",
  ".mp3",
  ".wav",
  ".mp4",
  ".webm",
  ".log",
  ".yml",
  ".yaml",
  ".ini",
  ".cfg",
]);

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    const dir = path.resolve(env.uploadDir);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuid()}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED.has(ext)) {
    cb(new Error(`File type not allowed: ${ext || "unknown"}`));
    return;
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    files: env.maxFiles,
    fileSize: env.maxBytes,
  },
});

module.exports = { upload, ALLOWED };
