-- Shipping by Emirates Post zones: UAE, GCC, MENA, Europe, Americas, Asia, every other country (fees start from those in use)
INSERT OR IGNORE INTO settings(k,v) VALUES('shipping','{}');
UPDATE settings SET v=json_set(v,'$.AE',json('{"on":1,"fee":10,"days":""}'),'$.MENA',json('{"on":1,"fee":20,"days":""}'),'$.EUR',json('{"on":1,"fee":20,"days":""}'),'$.AME',json('{"on":1,"fee":20,"days":""}'),'$.ASIA',json('{"on":1,"fee":20,"days":""}')) WHERE k='shipping';
INSERT INTO settings(k,v) VALUES('launch_0014','1');
