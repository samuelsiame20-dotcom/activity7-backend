// db.js: creates ONE shared PostgreSQL connection pool for the whole app.
// A pool keeps a few connections open and reuses them, instead of
// opening a new connection for every request (slow and wasteful).
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

/**
 * Decide whether to use SSL.
 * - Local database (localhost) and Render's *internal* URL (host has no dots,
 *   e.g. dpg-abc123-a): no SSL needed.
 * - Any public host (Render external URL, Neon, Supabase): SSL required.
 * DATABASE_SSL=true/false overrides the guess.
 */
function sslSetting(url) {
  const override = process.env.DATABASE_SSL;
  if (override === "true") return { rejectUnauthorized: false };
  if (override === "false") return false;
  const host = new URL(url).hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1";
  const isInternal = !host.includes(".");
  return isLocal || isInternal ? false : { rejectUnauthorized: false };
}

const pool = new Pool({
  connectionString,
  ssl: sslSetting(connectionString),
  max: 5, // free database plans allow few connections
  idleTimeoutMillis: 30_000,
});

// An idle connection can drop (e.g. database restart). Log it instead of crashing.
pool.on("error", (error) => {
  console.error("Unexpected database pool error:", error.message);
});

module.exports = pool;
