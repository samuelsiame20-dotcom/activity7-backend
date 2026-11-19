// routes/records.js: the five record routes, mounted at /api/records.
// Every query uses $1, $2... placeholders: user input travels separately
// from the SQL text, so it can never be run as SQL (no SQL injection).
const router = require("express").Router();
const pool = require("../db");
const { parseId, validateRecord } = require("../validation");

const COLUMNS = "id, title, category, description, status";

/** Send a JSON error in the agreed shape: { "message": "..." } */
function fail(res, status, message) {
  return res.status(status).json({ message });
}

/** Read and check :id. Sends 400 and returns null when it is not a positive whole number. */
function idOrFail(req, res) {
  const id = parseId(req.params.id);
  if (id === null) fail(res, 400, "Id must be a positive whole number.");
  return id;
}

// GET /api/records -> 200 + array ([] when empty)
router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT ${COLUMNS} FROM records ORDER BY id`);
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/records/:id -> 200 + record | 400 bad id | 404 missing
router.get("/:id", async (req, res, next) => {
  const id = idOrFail(req, res);
  if (id === null) return;
  try {
    const result = await pool.query(`SELECT ${COLUMNS} FROM records WHERE id = $1`, [id]);
    if (result.rowCount === 0) return fail(res, 404, `Record ${id} was not found.`);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// POST /api/records -> 201 + saved record with its new id | 400 invalid
router.post("/", async (req, res, next) => {
  const { record, message } = validateRecord(req.body);
  if (!record) return fail(res, 400, message);
  try {
    const result = await pool.query(
      `INSERT INTO records (title, category, description, status)
       VALUES ($1, $2, $3, $4)
       RETURNING ${COLUMNS}`,
      [record.title, record.category, record.description, record.status],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// PUT /api/records/:id -> 200 + updated record | 400 | 404 (never creates)
router.put("/:id", async (req, res, next) => {
  const id = idOrFail(req, res);
  if (id === null) return;
  const { record, message } = validateRecord(req.body);
  if (!record) return fail(res, 400, message);
  try {
    const result = await pool.query(
      `UPDATE records
       SET title = $1, category = $2, description = $3, status = $4
       WHERE id = $5
       RETURNING ${COLUMNS}`,
      [record.title, record.category, record.description, record.status, id],
    );
    if (result.rowCount === 0) return fail(res, 404, `Record ${id} was not found.`);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/records/:id -> 200 + {"message":"Record deleted."} | 400 | 404
router.delete("/:id", async (req, res, next) => {
  const id = idOrFail(req, res);
  if (id === null) return;
  try {
    const result = await pool.query("DELETE FROM records WHERE id = $1 RETURNING id", [id]);
    if (result.rowCount === 0) return fail(res, 404, `Record ${id} was not found.`);
    res.status(200).json({ message: "Record deleted." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
