require("dotenv").config();

const env = require("./src/config/env");
const { connectDb } = require("./src/config/db");
const { createApp } = require("./src/app");
const { ensureDirs } = require("./src/services/compressService");
const { startCleanup } = require("./src/services/cleanupService");

async function main() {
  ensureDirs();
  const db = await connectDb();
  const app = createApp();
  startCleanup();

  app.listen(env.port, () => {
    console.log(`PackZip listening on ${env.siteUrl}`);
    console.log(`Storage: ${db.mode}`);
    if (env.customDomain) {
      console.log(`Custom domain: ${env.customDomain}`);
    }
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
