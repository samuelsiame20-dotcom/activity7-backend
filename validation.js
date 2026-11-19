// validation.js: the data agreement rules from Activities 6-8.
// The backend must never trust the client: Postman (or anyone) can send
// any JSON, so every rule is checked here before touching the database.

const STATUSES = Object.freeze(["Pending", "In progress", "Completed"]);

const FIELD_RULES = Object.freeze({
  title: { label: "Title", min: 3, max: 80 },
  category: { label: "Category", min: 2, max: 40 },
  description: { label: "Description", min: 5, max: 300 },
});

const MAX_ID = 2_147_483_647; // largest PostgreSQL INTEGER

/**
 * Parse a route id like "12".
 * Rejects "0", "-3", "1.5", "abc", "12abc" and values too big for INTEGER.
 * @returns {number|null} the id, or null when invalid
 */
function parseId(raw) {
  if (!/^[1-9]\d*$/.test(String(raw))) return null;
  const id = Number(raw);
  return id <= MAX_ID ? id : null;
}

/**
 * Validate a POST/PUT body.
 * Any client-supplied id is ignored on purpose: ids come from the database.
 * @returns {{ record?: {title:string, category:string, description:string, status:string}, message?: string }}
 */
function validateRecord(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { message: "Request body must be a JSON object with title, category, description and status." };
  }

  const record = {};
  for (const [field, rule] of Object.entries(FIELD_RULES)) {
    const value = body[field];
    if (value === undefined || value === null) {
      return { message: `${rule.label} is required.` };
    }
    // Check the TYPE before trimming: 123.trim() would crash the server.
    if (typeof value !== "string") {
      return { message: `${rule.label} must be text.` };
    }
    const trimmed = value.trim();
    if (trimmed.length < rule.min || trimmed.length > rule.max) {
      return { message: `${rule.label} must have ${rule.min} to ${rule.max} characters.` };
    }
    record[field] = trimmed;
  }

  if (body.status === undefined || body.status === null) {
    return { message: "Status is required." };
  }
  if (typeof body.status !== "string") {
    return { message: "Status must be text." };
  }
  const status = body.status.trim();
  if (!STATUSES.includes(status)) {
    return { message: `Status must be one of: ${STATUSES.join(", ")}.` };
  }
  record.status = status;

  return { record };
}

module.exports = { STATUSES, FIELD_RULES, parseId, validateRecord };
