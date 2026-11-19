// tests/api.test.js: runs the Activity 7 test table against a running API.
//   Local:  npm start   (in one terminal), then  npm test
//   Hosted: set BASE_URL first, e.g. (PowerShell)
//           $env:BASE_URL="https://your-backend.onrender.com"; npm test
const { test } = require("node:test");
const assert = require("node:assert/strict");

const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const valid = {
  title: "Test: broken projector",
  category: "Electrical",
  description: "Projector in LT1 shows no picture.",
  status: "Pending",
};

async function call(method, path, body, raw) {
  const res = await fetch(BASE + path, {
    method,
    headers: body !== undefined || raw ? { "Content-Type": "application/json" } : {},
    body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json };
}

test("GET / returns the HTML guide", async () => {
  const res = await fetch(BASE + "/");
  assert.equal(res.status, 200);
  assert.match(await res.text(), /202302655/);
});

test("GET /health -> 200", async () => {
  const r = await call("GET", "/health");
  assert.equal(r.status, 200);
  assert.equal(r.json.database, "connected");
});

test("GET /api/records -> 200 array", async () => {
  const r = await call("GET", "/api/records");
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.json));
});

test("full CRUD cycle", async () => {
  const created = await call("POST", "/api/records", { ...valid, id: 999999 });
  assert.equal(created.status, 201);
  const id = created.json.id;
  assert.ok(Number.isInteger(id) && id > 0);
  assert.notEqual(id, 999999, "client id must be ignored");

  const one = await call("GET", `/api/records/${id}`);
  assert.equal(one.status, 200);
  assert.deepEqual(one.json, { id, ...valid });

  const changes = { ...valid, title: "Test: projector fixed", status: "Completed" };
  const updated = await call("PUT", `/api/records/${id}`, changes);
  assert.equal(updated.status, 200);
  assert.deepEqual(updated.json, { id, ...changes });

  const deleted = await call("DELETE", `/api/records/${id}`);
  assert.equal(deleted.status, 200);
  assert.deepEqual(deleted.json, { message: "Record deleted." });

  assert.equal((await call("GET", `/api/records/${id}`)).status, 404);
});

test("invalid input -> 400 and no row created", async () => {
  const before = (await call("GET", "/api/records")).json.length;
  const cases = [
    { ...valid, title: undefined },
    { ...valid, title: "   " },
    { ...valid, title: "ab" },
    { ...valid, title: 12345 },
    { ...valid, status: "Done" },
    { ...valid, status: "pending" },
    { ...valid, description: "x".repeat(301) },
    [valid],
  ];
  for (const body of cases) {
    const r = await call("POST", "/api/records", body);
    assert.equal(r.status, 400, JSON.stringify(body).slice(0, 60));
    assert.equal(typeof r.json.message, "string");
  }
  assert.equal((await call("GET", "/api/records")).json.length, before);
});

test("trims spaces before saving", async () => {
  const r = await call("POST", "/api/records", { ...valid, title: "   Spaced title   " });
  assert.equal(r.status, 201);
  assert.equal(r.json.title, "Spaced title");
  await call("DELETE", `/api/records/${r.json.id}`);
});

test("invalid id or malformed JSON -> 400", async () => {
  for (const bad of ["abc", "0", "-1", "1.5", "12abc", "99999999999"]) {
    assert.equal((await call("GET", `/api/records/${bad}`)).status, 400, bad);
  }
  const r = await call("POST", "/api/records", undefined, '{"title": "oops",');
  assert.equal(r.status, 400);
  assert.equal(typeof r.json.message, "string");
});

test("missing positive id -> 404 for GET, PUT, DELETE", async () => {
  const id = 2147483000;
  assert.equal((await call("GET", `/api/records/${id}`)).status, 404);
  assert.equal((await call("PUT", `/api/records/${id}`, valid)).status, 404);
  assert.equal((await call("DELETE", `/api/records/${id}`)).status, 404);
});

test("unknown route -> 404 JSON", async () => {
  const r = await call("GET", "/api/nothing-here");
  assert.equal(r.status, 404);
  assert.equal(typeof r.json.message, "string");
});
