const Job = require("../models/Job");
const { isMongoReady } = require("../config/db");

const memory = new Map();

function toPublic(doc) {
  return {
    jobId: doc.jobId,
    mode: doc.mode,
    status: doc.status,
    files: (doc.files || []).map((f) => ({
      originalName: f.originalName,
      mimeType: f.mimeType,
      size: f.size,
    })),
    originalBytes: doc.originalBytes,
    outputBytes: doc.outputBytes,
    outputName: doc.outputName,
    error: doc.error || "",
    createdAt: doc.createdAt,
    expiresAt: doc.expiresAt,
  };
}

async function createJob(data) {
  if (isMongoReady()) {
    const doc = await Job.create(data);
    return toPublic(doc);
  }
  const record = { ...data };
  memory.set(record.jobId, record);
  return toPublic(record);
}

async function updateJob(jobId, patch) {
  if (isMongoReady()) {
    const doc = await Job.findOneAndUpdate({ jobId }, patch, { new: true });
    return doc ? toPublic(doc) : null;
  }
  const record = memory.get(jobId);
  if (!record) return null;
  Object.assign(record, patch);
  memory.set(jobId, record);
  return toPublic(record);
}

async function getJob(jobId) {
  if (isMongoReady()) {
    const doc = await Job.findOne({ jobId });
    return doc ? toPublic(doc) : null;
  }
  const record = memory.get(jobId);
  return record ? toPublic(record) : null;
}

async function listExpired(now) {
  if (isMongoReady()) {
    return Job.find({ expiresAt: { $lte: now }, status: { $ne: "expired" } }).lean();
  }
  return [...memory.values()].filter(
    (j) => j.expiresAt <= now && j.status !== "expired"
  );
}

function getRaw(jobId) {
  return memory.get(jobId);
}

module.exports = {
  createJob,
  updateJob,
  getJob,
  listExpired,
  getRaw,
  toPublic,
};
