// Prints SQL that creates (or resets) the admin account. Usage: node tools/make-admin.mjs [password]
import { webcrypto as c } from 'crypto';
const email = 'info@massandgrass.com';
const pw = process.argv[2] || [...c.getRandomValues(new Uint8Array(12))].map((x) => 'abcdefghjkmnpqrstuvwxyzACDEFGHJKLMNPQRSTUVWXYZ23456789'[x % 54]).join('');
const salt = c.getRandomValues(new Uint8Array(16));
const key = await c.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
const hash = Buffer.from(await c.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, key, 256)).toString('base64');
const s = Buffer.from(salt).toString('base64');
console.error('password:', pw);
console.log(`INSERT INTO users(id,email,name,pw_hash,pw_salt,pw_iter,role,created_at) VALUES('${c.randomUUID()}','${email}','Mass & Grass','${hash}','${s}',100000,'admin',${Date.now()})
ON CONFLICT(email) DO UPDATE SET pw_hash=excluded.pw_hash, pw_salt=excluded.pw_salt, pw_iter=100000, role='admin';
DELETE FROM sessions WHERE user_id=(SELECT id FROM users WHERE email='${email}');`);
