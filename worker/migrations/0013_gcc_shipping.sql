-- Printed calendar 30 EUR without shipping; shipping 10 EUR to the Gulf (GCC zone), 20 EUR to every other country (zone ALL)
INSERT OR IGNORE INTO settings(k,v) VALUES('prices','{}');
UPDATE settings SET v=json_set(v,'$.calendarPrint',30) WHERE k='prices';
INSERT OR IGNORE INTO settings(k,v) VALUES('shipping','{}');
UPDATE settings SET v=json_set(v,'$.GCC',json('{"on":1,"fee":10,"days":""}'),'$.ALL',json('{"on":1,"fee":20,"days":""}')) WHERE k='shipping';
INSERT INTO settings(k,v) VALUES('launch_0013','1');
