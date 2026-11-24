-- Orders, more control (owner, 24 Nov 2026): an internal note per order; and a clean slate before the calendar goes out:
-- every order made before this release (all of them tests) is removed, on the owner's request.
ALTER TABLE orders ADD COLUMN note TEXT NOT NULL DEFAULT '';
DELETE FROM orders WHERE created_at < 1795549900000;
