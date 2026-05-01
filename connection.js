require("dotenv").config();
const { Pool } = require("pg");

const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initializeDatabase() {
}



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
