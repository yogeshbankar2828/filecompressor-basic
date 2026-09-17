const express = require("express");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");
const env = require("./config/env");
const api = require("./routes/api");
const { errorHandler } = require("./middleware/errorHandler");

function createApp() {
  const app = express();
  const publicDir = path.resolve("public");

  app.set("trust proxy", true);
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "script-src": ["'self'"],
          "img-src": ["'self'", "data:"],
          "style-src": ["'self'"],
        },
      },
    })
  );
  app.use(cors({ origin: env.customDomain ? [env.siteUrl, `https://${env.customDomain}`] : true }));
  app.use(express.json({ limit: "100kb" }));
  app.use("/api/v1", api);

  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send(`User-agent: *\nAllow: /\nSitemap: ${env.siteUrl}/sitemap.xml\n`);
  });

  app.get("/sitemap.xml", (_req, res) => {
    const base = env.siteUrl;
    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${base}/</loc></url>
  <url><loc>${base}/terms</loc></url>
  <url><loc>${base}/privacy</loc></url>
  <url><loc>${base}/domain</loc></url>
</urlset>`);
  });

  app.use(express.static(publicDir, { extensions: ["html"] }));

  app.get("/terms", (_req, res) => res.sendFile(path.join(publicDir, "terms.html")));
  app.get("/privacy", (_req, res) => res.sendFile(path.join(publicDir, "privacy.html")));
  app.get("/domain", (_req, res) => res.sendFile(path.join(publicDir, "domain.html")));


  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
