-- seed.sql: inserts 10 made-up records ONCE (runs inside one transaction).
-- The WHERE NOT EXISTS guard means running it again does nothing,
-- and an emptied table (after deleting everything) is NOT refilled
-- unless you run this file yourself on purpose.
-- seed_log remembers the seed already ran.
-- Same records as the Activity 6 frontend, so both show the same data.

BEGIN;

INSERT INTO records (title, category, description, status)
SELECT title, category, description, status
FROM (VALUES
  ('Broken classroom light', 'Electrical', 'The light in Room B12 does not switch on.', 'Pending'),
  ('Leaking tap in hostel washroom', 'Plumbing', 'The second tap in Block C washroom drips all night and wastes water.', 'In progress'),
  ('Broken chair in lecture theatre', 'Furniture', 'Seat 14 in row F of LT2 has a cracked backrest and is unsafe.', 'Pending'),
  ('Faulty socket in library', 'Electrical', 'The wall socket near the second-floor study tables sparks when used.', 'In progress'),
  ('Blocked drain near cafeteria', 'Plumbing', 'Water collects outside the cafeteria back door after it rains.', 'Completed'),
  ('Door hinge loose in Lab 3', 'Carpentry', 'The main door in Computer Lab 3 drags on the floor and will not close.', 'Pending'),
  ('Overgrown path to hostels', 'Grounds', 'Grass covers the footpath between the main gate and Block A hostels.', 'Completed'),
  ('Ceiling fan noise', 'Electrical', 'The ceiling fan in Room A4 makes a loud grinding noise at high speed.', 'Pending'),
  ('Broken window latch', 'Carpentry', 'A window in the staff room on the first floor cannot be locked.', 'In progress'),
  ('Overflowing bins at sports ground', 'Cleaning', 'Both bins beside the football pitch are full and rubbish is spreading.', 'Completed')
) AS seed(title, category, description, status)
WHERE NOT EXISTS (SELECT 1 FROM seed_log);

INSERT INTO seed_log (seeded_at)
SELECT now() WHERE NOT EXISTS (SELECT 1 FROM seed_log);

COMMIT;
