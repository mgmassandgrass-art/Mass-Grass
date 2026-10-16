CREATE TABLE products (
  id TEXT NOT NULL,            -- image key, e.g. 'hero' (assets/hero.webp) or 'u-xxxx' (uploaded)
  kind TEXT NOT NULL,             -- painting | postcard | sticker
  title_en TEXT NOT NULL, title_ar TEXT NOT NULL DEFAULT '',
  place_en TEXT NOT NULL DEFAULT 'Gaza', place_ar TEXT NOT NULL DEFAULT 'غزة',
  story_en TEXT NOT NULL DEFAULT '', story_ar TEXT NOT NULL DEFAULT '',
  price_cents INTEGER,            -- NULL = the kind's default price
  sale INTEGER NOT NULL DEFAULT 0,
  is_new INTEGER NOT NULL DEFAULT 0,
  hidden INTEGER NOT NULL DEFAULT 0,
  sort INTEGER NOT NULL DEFAULT 0,
  sold INTEGER NOT NULL DEFAULT 0,
  big INTEGER NOT NULL DEFAULT 0,
  extra TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, kind)
);
CREATE TABLE images (key TEXT PRIMARY KEY, type TEXT NOT NULL, data BLOB NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE settings (k TEXT PRIMARY KEY, v TEXT NOT NULL);
CREATE TABLE orders (
  id TEXT PRIMARY KEY, user_id TEXT, email TEXT NOT NULL, name TEXT NOT NULL DEFAULT '',
  items TEXT NOT NULL, total_cents INTEGER NOT NULL, currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | paid | cancelled | refunded
  paypal_id TEXT, news INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, paid_at INTEGER
);
CREATE INDEX orders_user ON orders(user_id);
CREATE INDEX orders_email ON orders(email);
INSERT INTO settings(k,v) VALUES ('prices','{"painting":12,"postcard":2,"sticker":1,"pack":3,"calendar":8,"subscription":5}');
INSERT INTO settings(k,v) VALUES ('rates','{"USD":1.08,"GBP":0.85,"ILS":4}');
INSERT INTO settings(k,v) VALUES ('links','{"email":"info@massandgrass.com","instagram":"https://instagram.com/farahh.gaza","whatsapp":""}');
