const express = require("express");
const { upload } = require("../middleware/upload");
const controller = require("../controllers/compressController");

const router = express.Router();

function wrap(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

router.get("/health", wrap(controller.health));
router.get("/config", wrap(controller.siteConfig));
router.post("/jobs", (req, res, next) => {
  upload.array("files")(req, res, (err) => {
    if (err) {
      err.status = 400;
      next(err);
      return;
    }
    wrap(controller.createJob)(req, res, next);
  });
});
router.get("/jobs/:id", wrap(controller.getJob));
router.get("/jobs/:id/download", wrap(controller.downloadJob));

module.exports = router;
