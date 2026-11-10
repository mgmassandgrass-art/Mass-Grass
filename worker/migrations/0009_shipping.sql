-- Printed pieces shipped by hand: the address, the shipping fee and the state of the parcel on each order.
ALTER TABLE orders ADD COLUMN ship TEXT;                         -- JSON {name, phone, country, city, line1, line2, postal}
ALTER TABLE orders ADD COLUMN ship_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN ship_status TEXT;                  -- NULL (nothing to ship) | to_print | sent | delivered
ALTER TABLE orders ADD COLUMN tracking TEXT NOT NULL DEFAULT '';
CREATE INDEX orders_ship ON orders(ship_status, created_at);
-- The two countries shipped to for now; a country is open once the admin sets its fee.
INSERT OR IGNORE INTO settings(k,v) VALUES('shipping','{"AE":{"on":1,"fee":null,"days":""},"DK":{"on":1,"fee":null,"days":""}}');
