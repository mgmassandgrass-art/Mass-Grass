-- The dashboard's map and visits (owner, 25 Nov 2026). Only counts are kept: no address, no cookie id, nothing that names a person.
-- orders.country: the country the buyer was in when ordering (from Cloudflare), for digital orders that have no address.
ALTER TABLE orders ADD COLUMN country TEXT NOT NULL DEFAULT '';
-- page views and visits (a visit = the first page of a browser session) per day, country and page
CREATE TABLE IF NOT EXISTS visits(day TEXT NOT NULL, country TEXT NOT NULL DEFAULT '', path TEXT NOT NULL DEFAULT '', views INTEGER NOT NULL DEFAULT 0, visits INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(day, country, path));
-- per visit: where it came from (k='src') and on what (k='dev')
CREATE TABLE IF NOT EXISTS visit_stats(day TEXT NOT NULL, k TEXT NOT NULL, v TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(day, k, v));
