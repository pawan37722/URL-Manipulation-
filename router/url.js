const express = require("express");
const router = express.Router();
const {
  createShortUrl,
  redirectToUrl,
  getAllUrlsInfo,
  checkShortUrlAvailability,
  generateShortCode,
  deleteShortUrl,
} = require("../controler/urlController");

router.post("/create", createShortUrl);
router.post("/checkurl", checkShortUrlAvailability);
router.post("/crateshorturl", generateShortCode);  // kept old typo — frontend calls this exact name
router.get("/getinfo", getAllUrlsInfo);
router.get("/delete/:shorturl", deleteShortUrl);
router.get("/:shorturl", redirectToUrl);

module.exports = router;
