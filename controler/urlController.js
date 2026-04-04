const { UrlModel } = require("../models/urlModel");
const { nanoid } = require("nanoid");
const dns = require("dns").promises;
require("dotenv").config();

if (!process.env.BASE_URL) {
  console.error("ERROR: BASE_URL is not set in your .env file!");
  process.exit(1);
}
const BASE_URL = process.env.BASE_URL;

async function isValidUrl(inputUrl) {
  try {
    if (!inputUrl.startsWith("http://") && !inputUrl.startsWith("https://")) {
      inputUrl = "http://" + inputUrl;
    }
    const parsedUrl = new URL(inputUrl);
    const hostname = parsedUrl.hostname;
    await dns.lookup(hostname);
    const response = await fetch(inputUrl, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    return response.status < 500;
  } catch {
    return false;
  }
}

function stripProtocol(url) {
  if (url.startsWith("https://")) return url.slice(8);
  if (url.startsWith("http://")) return url.slice(7);
  return url;
}

async function generateUniqueShortCode() {
  let isUnique = false;
  let shortCode = "";
  while (!isUnique) {
    shortCode = nanoid(6);
    const existing = await UrlModel.findByShortUrl(shortCode);
    isUnique = !existing;
  }
  return shortCode;
}

async function createShortUrl(req, res) {
  try {
    const { redirecturl: redirectUrl, shorturl: customShortUrl } = req.body;

    if (!redirectUrl) {
      return res.json({ status: 0, m: "Original URL is required" });
    }

    let shortCode = customShortUrl;

    if (!shortCode) {
      shortCode = await generateUniqueShortCode();
    } else {
      const existing = await UrlModel.findByShortUrl(shortCode);
      if (existing) {
        return res.json({ status: 0, m: "Short URL already exists" });
      }
    }

    const cleanRedirectUrl = stripProtocol(redirectUrl);

    const isValid = await isValidUrl(cleanRedirectUrl);
    if (!isValid) {
      return res.json({ status: 0, m: "Invalid or unreachable URL" });
    }

    await UrlModel.create({ shortUrl: shortCode, redirectUrl: cleanRedirectUrl });

    return res.json({
      status: 1,
      m: "Short URL created successfully",
      shorturl: shortCode,
      redirecturl: cleanRedirectUrl,
    });
  } catch (err) {
    console.error("DB error creating short URL:", err);
    return res.json({ status: 0, m: "Database error, could not create short URL" });
  }
}

async function redirectToUrl(req, res) {
  try {
    const { shorturl: shortCode } = req.params;
    const urlRecord = await UrlModel.updateVisitStats(shortCode);
    if (!urlRecord) {
      return res.status(404).send("Page not found");
    }
    return res.redirect("http://" + urlRecord.redirect_url);
  } catch (err) {
    console.error("Error redirecting:", err);
    return res.status(500).send("Server error");
  }
}

async function getAllUrlsInfo(req, res) {
  try {
    const allUrls = await UrlModel.findAllUrls();

    const tableHeading = `
      <table border="1" style="border-collapse: collapse; width: 100%; font-family: sans-serif; text-align: left;">
        <tr>
          <th>Short URL</th>
          <th>Redirect URL</th>
          <th>Last Visit</th>
          <th>Visit Count</th>
          <th>Action</th>
        </tr>`;

    const tableRows = allUrls.map((record) => `
      <tr>
        <td>${record.short_url}</td>
        <td>
          <a target="_blank" href="http://${record.redirect_url}">http://${record.redirect_url}</a><br>
          <a target="_blank" href="${BASE_URL}/${record.short_url}">${BASE_URL}/${record.short_url}</a>
        </td>
        <td>${record.last_visit}</td>
        <td>${record.visit_count}</td>
        <td><a href="${BASE_URL}/delete/${record.short_url}">Delete</a></td>
      </tr>`).join("");

    return res.send(tableHeading + tableRows + "</table>");
  } catch (err) {
    console.error("Error fetching all URLs:", err);
    return res.status(500).send("Database error");
  }
}

async function checkShortUrlAvailability(req, res) {
  try {
    const { shorturl: shortCode } = req.body;
    if (!shortCode) {
      return res.json({ status: 0 });
    }
    const existing = await UrlModel.findByShortUrl(shortCode);
    return res.json({ status: existing ? 0 : 1 });
  } catch (err) {
    console.error("Error checking availability:", err);
    return res.json({ status: 0 });
  }
}

// Route name kept as "crateshorturl" to match the frontend fetch call
async function generateShortCode(req, res) {
  try {
    const shortCode = await generateUniqueShortCode();
    return res.json({ status: 1, shorturl: shortCode });
  } catch (err) {
    console.error("Error generating short code:", err);
    return res.json({ status: 0 });
  }
}

async function deleteShortUrl(req, res) {
  try {
    const { shorturl: shortCode } = req.params;
    await UrlModel.deleteByShortUrl(shortCode);
    return res.redirect(`${BASE_URL}/getinfo`);
  } catch (err) {
    console.error("Error deleting:", err);
    return res.status(500).send("Could not delete");
  }
}

module.exports = {
  createShortUrl,
  redirectToUrl,
  getAllUrlsInfo,
  checkShortUrlAvailability,
  generateShortCode,
  deleteShortUrl,
};
