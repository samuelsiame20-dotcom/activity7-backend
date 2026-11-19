// scripts/init-db.js: runs schema.sql then seed.sql.
// Both files are safe to run many times, so the server also calls this on
// start-up: a brand-new hosted database gets its table and records with no
// manual SQL step. You can also run it yourself with: npm run db:init
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");

/** @param {import("pg").Pool} pool */
async function initDatabase(pool) {
  const schema = fs.readFileSync(path.join(ROOT, "schema.sql"), "utf8");
  const seed = fs.readFileSync(path.join(ROOT, "seed.sql"), "utf8");
  await pool.query(schema);
  await pool.query(seed);
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM records");
  console.log(`Database ready: ${rows[0].count} record(s) in table "records".`);
}

module.exports = { initDatabase };

// Run directly: node scripts/init-db.js
if (require.main === module) {
  require("dotenv").config({ path: path.join(ROOT, ".env") });
  const pool = require("../db");
  initDatabase(pool)
    .catch((error) => {
      console.error("Database setup failed:", error.message);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
