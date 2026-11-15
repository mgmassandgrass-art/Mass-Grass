-- More designs (a new product kind 'design'), the book (kind 'book', sold as one PDF) and requests for a design of one's own.
-- Prices for the new kinds, kept if the admin already set them.
UPDATE settings SET v=json_set(v,'$.design',6) WHERE k='prices' AND json_extract(v,'$.design') IS NULL;
UPDATE settings SET v=json_set(v,'$.book',10) WHERE k='prices' AND json_extract(v,'$.book') IS NULL;
-- A request for a painting, a portrait or a design made for someone ("Request a design"). The reference picture is optional,
-- checked by its bytes and kept under 2 MB; status: new or answered.
CREATE TABLE commissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  what TEXT NOT NULL,
  size TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  budget TEXT NOT NULL DEFAULT '',
  deadline TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  lang TEXT NOT NULL DEFAULT 'en',
  ref_type TEXT,
  ref BLOB,
  status TEXT NOT NULL DEFAULT 'new',
  mailed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX commissions_at ON commissions(status, created_at);
