const { dbPool } = require("../connection");

const UrlModel = {
  async create({ shortUrl, redirectUrl }) {
    const result = await dbPool.query(
      `INSERT INTO short_urls (short_url, redirect_url, last_visit, visit_count)
       VALUES ($1, $2, NOW(), 1) RETURNING *`,
      [shortUrl, redirectUrl]
    );
    return result.rows[0];
  },

  async findByShortUrl(shortUrl) {
    const result = await dbPool.query(
      `SELECT * FROM short_urls WHERE short_url = $1`,
      [shortUrl]
    );
    return result.rows[0] || null;
  },

  async findAllUrls() {
    const result = await dbPool.query(
      `SELECT * FROM short_urls ORDER BY last_visit DESC`
    );
    return result.rows;
  },

  async updateVisitStats(shortUrl) {
    const result = await dbPool.query(
      `UPDATE short_urls
       SET last_visit = NOW(), visit_count = visit_count + 1
       WHERE short_url = $1 RETURNING *`,
      [shortUrl]
    );
    return result.rows[0] || null;
  },

  async deleteByShortUrl(shortUrl) {
    const result = await dbPool.query(
      `DELETE FROM short_urls WHERE short_url = $1 RETURNING *`,
      [shortUrl]
    );
    return result.rows[0] || null;
  },
};

module.exports = { UrlModel };
