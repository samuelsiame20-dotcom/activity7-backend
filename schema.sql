-- schema.sql: creates the records table (safe to run more than once).
-- The CHECK constraints repeat the API validation rules, so even a bad
-- INSERT typed straight into the database cannot break the data agreement.

CREATE TABLE IF NOT EXISTS records (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title       VARCHAR(80)  NOT NULL CHECK (char_length(title) BETWEEN 3 AND 80),
  category    VARCHAR(40)  NOT NULL CHECK (char_length(category) BETWEEN 2 AND 40),
  description VARCHAR(300) NOT NULL CHECK (char_length(description) BETWEEN 5 AND 300),
  status      VARCHAR(20)  NOT NULL DEFAULT 'Pending'
              CHECK (status IN ('Pending', 'In progress', 'Completed')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Remembers that seed.sql has already run, so the starting records are
-- inserted only once (an emptied records table stays empty).
CREATE TABLE IF NOT EXISTS seed_log (
  seeded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
