const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    mimeType: { type: String, default: "application/octet-stream" },
    size: { type: Number, required: true },
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true, index: true },
  mode: { type: String, enum: ["zip", "gzip", "images"], required: true },
  status: {
    type: String,
    enum: ["queued", "processing", "done", "failed", "expired"],
    default: "queued",
  },
  files: [fileSchema],
  originalBytes: { type: Number, default: 0 },
  outputBytes: { type: Number, default: 0 },
  outputName: { type: String, default: "" },
  error: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

jobSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Job", jobSchema);
