const fs = require("fs");
const path = require("path");
const env = require("../config/env");
const jobStore = require("./jobStore");
const { removeJobFiles } = require("./compressService");

function startCleanup() {
  const tick = async () => {
    try {
      const expired = await jobStore.listExpired(new Date());
      for (const job of expired) {
        const dir = path.resolve(env.uploadDir);
        const leftovers = fs.existsSync(dir)
          ? fs.readdirSync(dir).filter((n) => n.startsWith(job.jobId))
          : [];
        removeJobFiles(
          job.jobId,
          leftovers.map((name) => ({ path: path.join(dir, name), originalname: name }))
        );
        await jobStore.updateJob(job.jobId, { status: "expired", error: "Job expired." });
      }
    } catch (err) {
      console.error("cleanup failed", err.message);
    }
  };

  tick();
  return setInterval(tick, 5 * 60 * 1000);
}

module.exports = { startCleanup };
