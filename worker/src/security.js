// Security helpers: the audit log, two-step sign-in (TOTP, RFC 6238) with one-time recovery codes, and rate limits by key.
const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
export const sha256 = async (s) => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
export const ipOf = (req) => req.headers.get('cf-connecting-ip') || 'local';

// ---------- audit log ----------
// level: info (routine), warn (a failed or unusual attempt), alert (something the owner should look at).
export async function audit(env, req, actor, action, detail = '', level = 'info') {
  try {
    await env.DB.prepare('INSERT INTO audit_log(at,actor,action,detail,ip,level) VALUES(?,?,?,?,?,?)')
      .bind(Date.now(), String(actor || 'visitor').slice(0, 120), String(action).slice(0, 80), String(detail).slice(0, 400), req ? ipOf(req) : '', level).run();
  } catch (e) { console.error('audit', e.message); }
}

// ---------- rate limit by any key (an IP, an e-mail, an order) ----------
export async function limitKey(env, k, max, windowSec) {
  const now = Date.now();
  const row = await env.DB.prepare('SELECT n, reset_at FROM rate_limits WHERE k=?').bind(k).first();
  if (!row || row.reset_at < now) {
    await env.DB.prepare('INSERT OR REPLACE INTO rate_limits(k,n,reset_at) VALUES(?,1,?)').bind(k, now + windowSec * 1000).run();
    return true;
  }
  if (row.n >= max) return false;
  await env.DB.prepare('UPDATE rate_limits SET n=n+1 WHERE k=?').bind(k).run();
  return true;
}
export const clearKey = (env, k) => env.DB.prepare('DELETE FROM rate_limits WHERE k=?').bind(k).run();

// ---------- TOTP ----------
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function newSecret() {
  const b = crypto.getRandomValues(new Uint8Array(20)); let bits = '', out = '';
  for (const x of b) bits += x.toString(2).padStart(8, '0');
  for (let i = 0; i < bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
  return out;
}
function unb32(s) {
  let bits = '';
  for (const c of s.replace(/=+$/, '').toUpperCase()) { const v = B32.indexOf(c); if (v < 0) continue; bits += v.toString(2).padStart(5, '0'); }
  const out = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < out.length; i++) out[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  return out;
}
async function hotp(secret, counter) {
  const key = await crypto.subtle.importKey('raw', unb32(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const msg = new ArrayBuffer(8); new DataView(msg).setUint32(4, counter);
  const h = new Uint8Array(await crypto.subtle.sign('HMAC', key, msg)), o = h[19] & 15;
  return String((((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1e6).padStart(6, '0');
}
const same = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; };
// Returns the accepted time step (so a code cannot be used twice), or 0.
export async function totpStep(secret, code, lastStep = 0) {
  code = String(code || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(code) || !secret) return 0;
  const now = Math.floor(Date.now() / 30000);
  for (const s of [now, now - 1, now + 1]) if (s > lastStep && same(await hotp(secret, s), code)) return s;
  return 0;
}
export const totpNow = (secret) => hotp(secret, Math.floor(Date.now() / 30000)); // for tests
export const otpauth = (email, secret) => `otpauth://totp/${encodeURIComponent('Mass & Grass')}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent('Mass & Grass')}&digits=6&period=30`;

// ---------- recovery codes: ten one-time codes, only their hashes are kept ----------
export async function newRecovery() {
  const codes = [...Array(10)].map(() => { const b = crypto.getRandomValues(new Uint8Array(5)); const h = hex(b); return h.slice(0, 5) + '-' + h.slice(5); });
  return { codes, hashes: await Promise.all(codes.map((c) => sha256(c))) };
}
// If the code is one of the stored recovery codes, returns the list without it; otherwise null.
export async function useRecovery(stored, code) {
  let list; try { list = JSON.parse(stored || '[]'); } catch { return null; }
  const h = await sha256(String(code || '').trim().toLowerCase()), i = list.indexOf(h);
  if (i < 0) return null;
  list.splice(i, 1); return list;
}
