const path = require("path");
const fs = require("fs");
const { v4: uuid } = require("uuid");
const env = require("../config/env");
const { isMongoReady } = require("../config/db");
const jobStore = require("../services/jobStore");
const {
  runCompression,
  removeUploads,
  outputPath,
} = require("../services/compressService");

const MODES = new Set(["zip", "gzip", "images"]);

function totalBytes(files) {
  return files.reduce((sum, f) => sum + (f.size || 0), 0);
}

async function createJob(req, res, next) {
  const files = req.files || [];
  const mode = String(req.body.mode || "zip").toLowerCase();

  if (!files.length) {
    res.status(400).json({ error: "Choose at least one file." });
    return;
  }
  if (!MODES.has(mode)) {
    removeUploads(files);
    res.status(400).json({ error: "Mode must be zip, gzip, or images." });
    return;
  }
  if (mode === "gzip" && files.length !== 1) {
    removeUploads(files);
    res.status(400).json({ error: "Gzip mode accepts exactly one file." });
    return;
  }

  const originalBytes = totalBytes(files);
  if (originalBytes > env.maxBytes) {
    removeUploads(files);
    res.status(400).json({ error: `Total size exceeds ${env.maxBytes} bytes.` });
    return;
  }

  const jobId = uuid();
  const expiresAt = new Date(Date.now() + env.jobTtlMinutes * 60 * 1000);

  try {
    await jobStore.createJob({
      jobId,
      mode,
      status: "processing",
      files: files.map((f) => ({
        originalName: f.originalname,
        storedName: path.basename(f.path),
        mimeType: f.mimetype,
        size: f.size,
      })),
      originalBytes,
      outputBytes: 0,
      outputName: "",
      error: "",
      createdAt: new Date(),
      expiresAt,
    });

    const result = await runCompression({ jobId, mode, files });
    const job = await jobStore.updateJob(jobId, {
      status: "done",
      outputName: result.outputName,
      outputBytes: result.outputBytes,
    });

    removeUploads(files);

    res.status(201).json({
      job,
      downloadUrl: `/api/v1/jobs/${jobId}/download`,
      storage: isMongoReady() ? "mongo" : "memory",
    });
  } catch (err) {
    await jobStore.updateJob(jobId, { status: "failed", error: err.message });
    removeUploads(files);
    next(err);
  }
}

async function getJob(req, res) {
  const job = await jobStore.getJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: "Job not found." });
    return;
  }
  if (new Date(job.expiresAt) < new Date()) {
    res.status(410).json({ error: "Job expired." });
    return;
  }
  res.json({ job, downloadUrl: `/api/v1/jobs/${job.jobId}/download` });
}

async function downloadJob(req, res) {
  const job = await jobStore.getJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: "Job not found." });
    return;
  }
  if (job.status !== "done") {
    res.status(409).json({ error: job.error || "Job is not ready." });
    return;
  }
  if (new Date(job.expiresAt) < new Date()) {
    res.status(410).json({ error: "Job expired." });
    return;
  }

  const filePath = outputPath(job.jobId, job.outputName);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "Output file missing." });
    return;
  }

  res.download(filePath, job.outputName);
}

function health(_req, res) {
  res.json({
    ok: true,
    db: isMongoReady() ? "mongo" : env.mongoUri ? "connecting" : "memory",
    limits: {
      maxFiles: env.maxFiles,
      maxBytes: env.maxBytes,
      jobTtlMinutes: env.jobTtlMinutes,
    },
  });
}

function siteConfig(_req, res) {
  res.json({
    siteUrl: env.siteUrl,
    customDomain: env.customDomain || null,
    limits: {
      maxFiles: env.maxFiles,
      maxBytes: env.maxBytes,
      jobTtlMinutes: env.jobTtlMinutes,
    },
  });
}

module.exports = { createJob, getJob, downloadJob, health, siteConfig };
