require("dotenv").config();
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set in your .env file!");
  process.exit(1);
}

const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

dbPool.on("error", (err) => {
  console.error("Unexpected database pool error:", err);
});

async function initializeDatabase() {
  const client = await dbPool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS short_urls (
        id SERIAL PRIMARY KEY,
        short_url VARCHAR(50) UNIQUE NOT NULL,
        redirect_url TEXT NOT NULL,
        last_visit TIMESTAMP DEFAULT NOW(),
        visit_count INTEGER DEFAULT 1
      );
    `);
    console.log("Database table ready");
  } catch (err) {
    console.error("Failed to create table:", err.message);
    throw err;
  } finally {
    client.release();
  }
}

// Test connection and create table on startup
dbPool.connect()
  .then((client) => {
    console.log("NeonDB connected successfully");
    client.release();
    return initializeDatabase();
  })
  .catch((err) => {
    console.error("Database startup error:", err.message);
  });

module.exports = { dbPool };
