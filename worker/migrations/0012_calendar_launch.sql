-- Calendar opening: PDF 10 EUR, printed and shipped 30 EUR with shipping included, shipped to every country (zone ALL, fee 0)
INSERT OR IGNORE INTO settings(k,v) VALUES('prices','{}');
UPDATE settings SET v=json_set(v,'$.calendar',10,'$.calendarPrint',30) WHERE k='prices';
INSERT OR IGNORE INTO settings(k,v) VALUES('shipping','{}');
UPDATE settings SET v=json_set(v,'$.ALL',json('{"on":1,"fee":0,"days":""}')) WHERE k='shipping';
INSERT INTO settings(k,v) VALUES('launch_0012','1');
