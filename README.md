# Campus Maintenance Requests API (ICT251 Activity 7)

Node.js + Express REST API with PostgreSQL for the Campus Maintenance Requests
system (frontend: Activity 6, <https://campus-maintenance-siame.netlify.app>).

**Student:** Samuel Siame · 202302655
**Live API:** _add your Render URL here_

## Structure

```
activity7-backend/
├── server.js           Express app: CORS, JSON, guide (GET /), /health, 404 + error handlers
├── routes/records.js   The 5 record routes (GET all/one, POST, PUT, DELETE)
├── validation.js       Data agreement rules (lengths, status, id)
├── db.js               Shared PostgreSQL connection pool
├── schema.sql          records table (+ CHECK constraints) and seed_log
├── seed.sql            10 made-up records, inserted once
├── scripts/init-db.js  Runs schema.sql + seed.sql (also runs on start-up)
├── tests/api.test.js   Automated version of the Activity 7 test table
├── .env.example        Template for your local .env (never commit .env)
└── .gitignore
```

## How a request flows

```
Postman / browser ──HTTP──► server.js ──► routes/records.js ──► validation.js
                                                   │                 (400 if invalid)
                                                   ▼
                                    db.js pool ──SQL $1,$2──► PostgreSQL
                                                   │
                         JSON response ◄───────────┘   (200/201, 404, 500)
```

## Run locally (Windows)

You don't need PostgreSQL installed: use the Render database's **External** URL.

```powershell
npm install                 # use npm.cmd if PowerShell blocks npm.ps1
copy .env.example .env      # then paste your DATABASE_URL into .env
npm start                   # creates the table + 10 records on first run
```

Open <http://localhost:3000>. In a second terminal: `npm test` (9 checks).

## Deploy (Render)

1. **Database:** Render → New → **Postgres** → Free, region **Frankfurt**.
   Free Postgres expires 30 days after creation (+14-day grace), so create it close to the deadline.
2. **GitHub:** push this folder to a new repo `activity7-backend`
   (`.env` and `node_modules` are excluded by `.gitignore`).
3. **Web Service:** Render → New → **Web Service** → pick the repo, same region.
   Runtime **Node**, Build `npm install`, Start `npm start`, Instance **Free**.
   Environment variables:
   - `DATABASE_URL` = the database's **Internal** Database URL
   - `CLIENT_ORIGINS` = `https://campus-maintenance-siame.netlify.app`
4. Open the `https://…onrender.com` URL → check `/health` → run the tests online:
   ```powershell
   $env:BASE_URL="https://YOUR-SERVICE.onrender.com"; npm test
   ```
5. Submit the base URL (no trailing `/api/records`).

## Tests covered (`npm test`)

GET guide · /health 200 · GET all · POST 201 (client id ignored) → GET one →
PUT 200 (same id) → DELETE 200 → GET 404 · 8 invalid bodies → 400 with no row
created · trimming · bad ids (`abc`, `0`, `-1`, `1.5`) → 400 · malformed JSON → 400 ·
missing id → 404 for GET/PUT/DELETE · unknown route → 404 JSON.

Also verified manually: records survive a restart; an emptied table stays empty
after restart; `/health` returns 503 when the database is down; CORS allows only
the Netlify frontend.
