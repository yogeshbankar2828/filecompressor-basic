const path = require("path");
const fs = require("fs");
const zlib = require("zlib");
const { pipeline } = require("stream/promises");
const { createReadStream, createWriteStream } = require("fs");
const archiver = require("archiver");
const sharp = require("sharp");
const env = require("../config/env");

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function ensureDirs() {
  for (const dir of [env.uploadDir, env.outputDir]) {
    fs.mkdirSync(path.resolve(dir), { recursive: true });
  }
}

function safeName(name) {
  return path.basename(name).replace(/[^\w.\- ()[\]]+/g, "_").slice(0, 180) || "file";
}

function compressImages(files) {
  return Promise.all(
    files.map(async (file) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (!IMAGE_EXT.has(ext)) {
        return { path: file.path, name: safeName(file.originalname) };
      }

      const outPath = `${file.path}.opt${ext}`;
      let pipelineSharp = sharp(file.path).rotate();

      if (ext === ".png") {
        pipelineSharp = pipelineSharp.png({ compressionLevel: 9, palette: true });
      } else if (ext === ".webp") {
        pipelineSharp = pipelineSharp.webp({ quality: 78 });
      } else {
        pipelineSharp = pipelineSharp.jpeg({ quality: 78, mozjpeg: true });
      }

      await pipelineSharp.toFile(outPath);
      return { path: outPath, name: safeName(file.originalname) };
    })
  );
}

function zipFiles(entries, destPath) {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(destPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve(archive.pointer()));
    archive.on("error", reject);
    archive.pipe(output);

    for (const entry of entries) {
      archive.file(entry.path, { name: entry.name });
    }

    archive.finalize();
  });
}

async function gzipFile(file, destPath) {
  await pipeline(createReadStream(file.path), zlib.createGzip({ level: 9 }), createWriteStream(destPath));
  const stat = fs.statSync(destPath);
  return stat.size;
}

async function runCompression({ jobId, mode, files }) {
  ensureDirs();
  const outDir = path.resolve(env.outputDir, jobId);
  fs.mkdirSync(outDir, { recursive: true });

  if (mode === "gzip") {
    if (files.length !== 1) {
      throw new Error("Gzip mode accepts exactly one file.");
    }
    const outputName = `${safeName(files[0].originalname)}.gz`;
    const destPath = path.join(outDir, outputName);
    const outputBytes = await gzipFile(files[0], destPath);
    return { outputName, outputPath: destPath, outputBytes };
  }

  const entries =
    mode === "images" ? await compressImages(files) : files.map((f) => ({ path: f.path, name: safeName(f.originalname) }));

  const outputName = `packzip-${jobId.slice(0, 8)}.zip`;
  const destPath = path.join(outDir, outputName);
  const outputBytes = await zipFiles(entries, destPath);
  return { outputName, outputPath: destPath, outputBytes };
}

function removeUploads(uploads = []) {
  for (const file of uploads) {
    try {
      if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      const ext = path.extname(file.originalname || file.path || "");
      const opt = `${file.path}.opt${ext}`;
      if (file.path && fs.existsSync(opt)) fs.unlinkSync(opt);
    } catch (_err) {
      // ignore leftover files
    }
  }
}

function removeOutput(jobId) {
  const outDir = path.resolve(env.outputDir, jobId);
  fs.rmSync(outDir, { recursive: true, force: true });
}

function removeJobFiles(jobId, uploads = []) {
  removeUploads(uploads);
  removeOutput(jobId);
}

function outputPath(jobId, outputName) {
  return path.resolve(env.outputDir, jobId, outputName);
}

module.exports = {
  ensureDirs,
  runCompression,
  removeUploads,
  removeOutput,
  removeJobFiles,
  outputPath,
  safeName,
};
