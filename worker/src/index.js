// Mass & Grass API: accounts and sign-in (step 1). Orders, PayPal and files come next.
import { json, fail, readJson, clean } from './util.js';
import { filesAdmin, download } from './files.js';
import { sendMail, layout, contactEmail } from './mail.js';
import { siteAdmin, publishedPaths, current, pageRules, hideCss, imageOverrides, serveImageFile, PAGES, TYPES } from './site.js';
import { catalog, createOrder, captureOrder, myOrders, serveImage, admin, sweepPending } from './shop.js';
import { migrate } from './migrate.js';
import { audit, limitKey, clearKey, ipOf, newSecret, totpStep, otpauth, newRecovery, useRecovery } from './security.js';

const enc = new TextEncoder();
const PBKDF2_ITER = 100000; // Workers' maximum for PBKDF2
const SESSION_DAYS = 30, ADMIN_SESSION_DAYS = 7; // the admin signs in again every week
const COOKIE = '__Host-mg';

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const rand = (n = 32) => crypto.getRandomValues(new Uint8Array(n));
const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
const sha256 = async (s) => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
const token = () => hex(rand(32));

async function hashPw(pw, salt, iter = PBKDF2_ITER) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  return b64(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256));
}
function same(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function cookies(req) {
  const out = {};
  for (const p of (req.headers.get('cookie') || '').split(';')) {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = p.slice(i + 1).trim();
  }
  return out;
}
const setCookie = (value, maxAge) => `${COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, photo: u.photo || null, via: u.google_sub ? 'google' : 'email', role: u.role, twofa: !!u.totp_on, joined: new Date(u.created_at).toISOString() });

async function limit(env, req, action, max, windowSec) {
  const ip = req.headers.get('cf-connecting-ip') || 'local';
  const k = `${action}:${ip}`;
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

async function startSession(env, req, user) {
  const t = token(), now = Date.now(), days = user.role === 'admin' ? ADMIN_SESSION_DAYS : SESSION_DAYS;
  await env.DB.batch([
    env.DB.prepare('INSERT INTO sessions(token_hash,user_id,created_at,expires_at,ip,ua,seen_at) VALUES(?,?,?,?,?,?,?)')
      .bind(await sha256(t), user.id, now, now + days * 864e5, ipOf(req), clean(req.headers.get('user-agent'), 200), now),
    env.DB.prepare('UPDATE users SET last_login=? WHERE id=?').bind(now, user.id),
    env.DB.prepare('DELETE FROM sessions WHERE expires_at<?').bind(now), // old sessions go as new ones come
  ]);
  return setCookie(t, days * 86400);
}
async function currentUser(env, req) {
  const t = cookies(req)[COOKIE];
  if (!t) return null;
  const th = await sha256(t), now = Date.now();
  const u = await env.DB.prepare(
    'SELECT u.*, s.seen_at AS _seen FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?'
  ).bind(th, now).first();
  if (u && now - u._seen > 6e5) await env.DB.prepare('UPDATE sessions SET seen_at=?, ip=? WHERE token_hash=?').bind(now, ipOf(req), th).run();
  return u;
}


const safeNext = (n) => (typeof n === 'string' && /^([a-z0-9_-]+\.html(\?[\w=&.%-]*)?|admin\/)$/i.test(n) ? n : 'profile.html');

// ---------- handlers ----------
async function signup(env, req) {
  if (!(await limit(env, req, 'signup', 10, 3600))) return fail('rate_limited', 429);
  const b = await readJson(req);
  if (!b) return fail('bad_request');
  const email = clean(b.email, 120).toLowerCase(), name = clean(b.name, 60), pw = String(b.password ?? '');
  if (!EMAIL.test(email)) return fail('email_invalid');
  if (!name) return fail('name_required');
  if (pw.length < 10 || pw.length > 200) return fail('password_short');
  if (email === (env.ADMIN_EMAIL || '').toLowerCase()) return fail('email_taken', 409);
  if (await env.DB.prepare('SELECT 1 FROM users WHERE email=?').bind(email).first()) return fail('email_taken', 409);
  const id = crypto.randomUUID(), salt = rand(16);
  await env.DB.prepare('INSERT INTO users(id,email,name,pw_hash,pw_salt,pw_iter,created_at) VALUES(?,?,?,?,?,?,?)')
    .bind(id, email, name, await hashPw(pw, salt), b64(salt), PBKDF2_ITER, Date.now()).run();
  const u = await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(id).first();
  await audit(env, req, email, 'signup');
  return json({ user: publicUser(u) }, 201, { 'set-cookie': await startSession(env, req, u) });
}

async function login(env, req) {
  if (!(await limit(env, req, 'login', 20, 900))) return fail('rate_limited', 429); // per address; each account has its own tighter lock below
  const b = await readJson(req);
  if (!b) return fail('bad_request');
  const email = clean(b.email, 120).toLowerCase(), pw = String(b.password ?? '');
  // One account can be tried 8 times in 15 minutes, whatever addresses the attempts come from.
  const lock = 'acct:' + email;
  if (EMAIL.test(email) && !(await limitKey(env, lock, 8, 900))) { await audit(env, req, email, 'login_locked', '', 'alert'); return fail('rate_limited', 429); }
  const u = await env.DB.prepare('SELECT * FROM users WHERE email=?').bind(email).first();
  // Always do one derivation so timing doesn't reveal whether the account exists.
  const salt = u?.pw_salt ? unb64(u.pw_salt) : rand(16);
  const got = await hashPw(pw.slice(0, 200), salt, u?.pw_iter || PBKDF2_ITER);
  if (!u || !u.pw_hash || !same(got, u.pw_hash)) { await audit(env, req, email, 'login_failed', '', u && u.role === 'admin' ? 'alert' : 'warn'); return fail('bad_credentials', 401); }
  if (u.totp_on) {
    const code = String(b.code ?? '').trim();
    if (!code) return fail('totp_required', 401);
    const step = await totpStep(u.totp_secret, code, u.totp_last);
    if (step) await env.DB.prepare('UPDATE users SET totp_last=? WHERE id=?').bind(step, u.id).run();
    else {
      const left = await useRecovery(u.recovery, code);
      if (!left) { await audit(env, req, email, 'login_2fa_failed', '', 'alert'); return fail('totp_invalid', 401); }
      await env.DB.prepare('UPDATE users SET recovery=? WHERE id=?').bind(JSON.stringify(left), u.id).run();
      await audit(env, req, email, 'recovery_code_used', `${left.length} left`, 'warn');
    }
  }
  await clearKey(env, lock);
  await audit(env, req, email, 'login');
  return json({ user: publicUser(u) }, 200, { 'set-cookie': await startSession(env, req, u) });
}

async function logout(env, req) {
  const t = cookies(req)[COOKIE];
  if (t) await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sha256(t)).run();
  return json({ ok: true }, 200, { 'set-cookie': setCookie('', 0) });
}

async function me(env, req) {
  const u = await currentUser(env, req);
  return json({ user: u ? publicUser(u) : null });
}

async function updateMe(env, req, u) {
  const b = await readJson(req);
  if (!b) return fail('bad_request');
  const name = b.name === undefined ? u.name : clean(b.name, 60);
  if (!name) return fail('name_required');
  await env.DB.prepare('UPDATE users SET name=? WHERE id=?').bind(name, u.id).run();
  return json({ user: publicUser({ ...u, name }) });
}

async function deleteMe(env, req, u) {
  await env.DB.prepare('DELETE FROM users WHERE id=?').bind(u.id).run(); // sessions + reset tokens cascade
  await audit(env, req, u.email, 'account_deleted');
  return json({ ok: true }, 200, { 'set-cookie': setCookie('', 0) });
}

async function exportMe(env, req, u) {
  return json({ user: publicUser(u), exported_at: new Date().toISOString() });
}

async function forgot(env, req) {
  if (!(await limit(env, req, 'forgot', 5, 3600))) return fail('rate_limited', 429);
  const b = await readJson(req);
  const email = clean(b?.email, 120).toLowerCase();
  if (!EMAIL.test(email)) return fail('email_invalid');
  const u = await env.DB.prepare('SELECT id FROM users WHERE email=?').bind(email).first();
  if (u) {
    const t = token();
    await env.DB.prepare('INSERT INTO reset_tokens(token_hash,user_id,expires_at) VALUES(?,?,?)').bind(await sha256(t), u.id, Date.now() + 3600e3).run();
    const link = `${env.SITE_ORIGIN}/account.html?reset=${t}`;
    await sendMail(env, email, 'Reset your Mass & Grass password · تغيير كلمة السر', layout(
      `<p>Open this link to choose a new password (valid for one hour):</p><p><a href="${link}" style="display:inline-block;background:#2E241B;color:#FAF5E9;padding:10px 16px;text-decoration:none;font:600 13px monospace">Choose a new password</a></p><p dir="rtl" style="text-align:right">افتح الرابط لتختار كلمة سر جديدة (صالح لمدة ساعة).</p><p style="color:#6f604d;font-size:13px">If you didn't ask for this, ignore this email.</p>`));
  }
  return json({ ok: true }); // same answer whether or not the account exists
}

async function reset(env, req) {
  if (!(await limit(env, req, 'reset', 10, 3600))) return fail('rate_limited', 429);
  const b = await readJson(req);
  const pw = String(b?.password ?? ''), t = String(b?.token ?? '');
  if (pw.length < 10 || pw.length > 200) return fail('password_short');
  const th = await sha256(t);
  const row = await env.DB.prepare('SELECT user_id FROM reset_tokens WHERE token_hash=? AND expires_at>?').bind(th, Date.now()).first();
  if (!row) return fail('token_invalid', 400);
  const salt = rand(16);
  await env.DB.batch([
    env.DB.prepare('UPDATE users SET pw_hash=?, pw_salt=?, pw_iter=? WHERE id=?').bind(await hashPw(pw, salt), b64(salt), PBKDF2_ITER, row.user_id),
    env.DB.prepare('DELETE FROM reset_tokens WHERE user_id=?').bind(row.user_id),
    env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(row.user_id), // sign out everywhere
  ]);
  await audit(env, req, row.user_id, 'password_reset', '', 'warn');
  return json({ ok: true });
}

async function changePassword(env, req, u) {
  if (!(await limit(env, req, 'pw', 10, 3600))) return fail('rate_limited', 429);
  const b = await readJson(req);
  const old = String(b?.old ?? ''), pw = String(b?.password ?? '');
  if (pw.length < 10 || pw.length > 200) return fail('password_short');
  if (u.pw_hash && !same(await hashPw(old.slice(0, 200), unb64(u.pw_salt), u.pw_iter), u.pw_hash)) return fail('bad_credentials', 401);
  const salt = rand(16), t = cookies(req)[COOKIE];
  await env.DB.batch([
    env.DB.prepare('UPDATE users SET pw_hash=?, pw_salt=?, pw_iter=? WHERE id=?').bind(await hashPw(pw, salt), b64(salt), PBKDF2_ITER, u.id),
    env.DB.prepare('DELETE FROM sessions WHERE user_id=? AND token_hash<>?').bind(u.id, await sha256(t || '')),
  ]);
  await audit(env, req, u.email, 'password_changed', '', u.role === 'admin' ? 'alert' : 'info');
  return json({ ok: true });
}

// ---------- sessions and two-step sign-in ----------
async function mySessions(env, req, u) {
  const cur = await sha256(cookies(req)[COOKIE] || '');
  const { results } = await env.DB.prepare('SELECT token_hash, created_at, seen_at, expires_at, ip, ua FROM sessions WHERE user_id=? AND expires_at>? ORDER BY seen_at DESC LIMIT 50').bind(u.id, Date.now()).all();
  return json({ sessions: results.map((r) => ({ id: r.token_hash.slice(0, 12), current: r.token_hash === cur, ip: r.ip, ua: r.ua, created: r.created_at, seen: r.seen_at || r.created_at })) });
}
async function endSessions(env, req, u, url) {
  const cur = await sha256(cookies(req)[COOKIE] || ''), id = clean(url.searchParams.get('id'), 12);
  if (id) await env.DB.prepare("DELETE FROM sessions WHERE user_id=? AND token_hash<>? AND substr(token_hash,1,12)=?").bind(u.id, cur, id).run();
  else await env.DB.prepare('DELETE FROM sessions WHERE user_id=? AND token_hash<>?').bind(u.id, cur).run();
  await audit(env, req, u.email, 'sessions_ended', id || 'all others');
  return json({ ok: true });
}
// Step 1: a new secret (not active yet). Step 2: a code from the authenticator app switches it on and returns the recovery codes once.
async function twofa(env, req, u, step) {
  if (!(await limit(env, req, '2fa', 20, 900))) return fail('rate_limited', 429);
  const b = (await readJson(req)) || {};
  if (step === 'setup') {
    if (u.totp_on) return fail('already_on', 409);
    if (!u.pw_hash) return fail('password_needed'); // Google-only accounts sign in through Google
    const secret = newSecret();
    await env.DB.prepare('UPDATE users SET totp_secret=?, totp_last=0 WHERE id=?').bind(secret, u.id).run();
    return json({ secret, uri: otpauth(u.email, secret) });
  }
  if (step === 'enable') {
    if (u.totp_on || !u.totp_secret) return fail('bad_request');
    const st = await totpStep(u.totp_secret, b.code, 0);
    if (!st) return fail('totp_invalid', 400);
    const rc = await newRecovery();
    await env.DB.prepare('UPDATE users SET totp_on=1, totp_last=?, recovery=? WHERE id=?').bind(st, JSON.stringify(rc.hashes), u.id).run();
    await audit(env, req, u.email, '2fa_enabled', '', 'alert');
    return json({ ok: true, recovery: rc.codes });
  }
  if (step === 'disable') {
    if (!u.totp_on) return fail('bad_request');
    const pwOk = u.pw_hash && same(await hashPw(String(b.password ?? '').slice(0, 200), unb64(u.pw_salt), u.pw_iter), u.pw_hash);
    const st = await totpStep(u.totp_secret, b.code, u.totp_last);
    if (!pwOk || !(st || (await useRecovery(u.recovery, b.code)))) { await audit(env, req, u.email, '2fa_disable_failed', '', 'alert'); return fail('bad_credentials', 401); }
    await env.DB.prepare('UPDATE users SET totp_on=0, totp_secret=NULL, recovery=NULL, totp_last=0 WHERE id=?').bind(u.id).run();
    await audit(env, req, u.email, '2fa_disabled', '', 'alert');
    return json({ ok: true });
  }
  return fail('not_found', 404);
}

// ---------- Google OAuth (authorization code flow) ----------
async function googleStart(env, req, url) {
  if (!env.GOOGLE_CLIENT_ID) return new Response(null, { status: 302, headers: { location: `${env.SITE_ORIGIN}/account.html?error=google_not_configured` } });
  const state = token(), next = safeNext(url.searchParams.get('next'));
  const q = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID, redirect_uri: `${env.SITE_ORIGIN}/api/auth/google/callback`,
    response_type: 'code', scope: 'openid email profile', state, prompt: 'select_account',
  });
  return new Response(null, { status: 302, headers: {
    location: `https://accounts.google.com/o/oauth2/v2/auth?${q}`,
    'set-cookie': `__Host-mgo=${state}.${encodeURIComponent(next)}; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
  } });
}

async function googleCallback(env, req, url) {
  const back = (e) => new Response(null, { status: 302, headers: { location: `${env.SITE_ORIGIN}/account.html?error=${e}` } });
  const raw = cookies(req)['__Host-mgo'] || '', dot = raw.indexOf('.');
  const state = dot > 0 ? raw.slice(0, dot) : raw, next = dot > 0 ? raw.slice(dot + 1) : '';
  if (!state || state !== url.searchParams.get('state')) return back('state');
  const code = url.searchParams.get('code');
  if (!code) return back('cancelled');
  const tr = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${env.SITE_ORIGIN}/api/auth/google/callback`, grant_type: 'authorization_code' }),
  });
  if (!tr.ok) return back('google');
  // The ID token comes straight from Google over TLS in exchange for our secret, so its claims can be trusted.
  const idt = JSON.parse(atob((await tr.json()).id_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  if (idt.aud !== env.GOOGLE_CLIENT_ID || !idt.email || !idt.email_verified) return back('google');
  const email = idt.email.toLowerCase();
  let u = await env.DB.prepare('SELECT * FROM users WHERE google_sub=? OR email=?').bind(idt.sub, email).first();
  if (!u) {
    const id = crypto.randomUUID();
    await env.DB.prepare('INSERT INTO users(id,email,name,photo,google_sub,created_at) VALUES(?,?,?,?,?,?)')
      .bind(id, email, clean(idt.name || email.split('@')[0], 60), idt.picture || null, idt.sub, Date.now()).run();
    u = { id };
  } else if (!u.google_sub) {
    // Google proved this email belongs to them. A password set at signup was never verified, so drop it and end its
    // sessions: whoever registered the email first cannot keep a way in. (The admin account is created by us, so it keeps its password.)
    if (u.role === 'admin') await env.DB.prepare('UPDATE users SET google_sub=? WHERE id=?').bind(idt.sub, u.id).run();
    else await env.DB.batch([
      env.DB.prepare('UPDATE users SET google_sub=?, pw_hash=NULL, pw_salt=NULL WHERE id=?').bind(idt.sub, u.id),
      env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(u.id),
    ]);
  }
  if (u.totp_on) return back('use_password');
  const cookie = await startSession(env, req, await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(u.id).first());
  await audit(env, req, email, 'login_google');
  const h = new Headers({ location: `${env.SITE_ORIGIN}/${safeNext(decodeURIComponent(next || ''))}` });
  h.append('set-cookie', cookie);
  h.append('set-cookie', '__Host-mgo=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax');
  return new Response(null, { status: 302, headers: h });
}

// ---------- router ----------
const isAdmin = (env, u) => !!u && u.role === 'admin' && u.email === (env.ADMIN_EMAIL || '').toLowerCase();

// Put the live catalog into every page so the page scripts read it synchronously.
async function withCatalog(env, res, path) {
  if (!(res.headers.get('content-type') || '').includes('text/html')) return res;
  const cat = await catalog(env);
  // The catalog travels as data (a JSON block the page's own script reads), so pages need no inline script at all.
  const data = JSON.stringify({ products: cat.products, prices: cat.prices, links: cat.links }).replace(/</g, '\\u003c');
  const js = data;
  const css = hideCss(cat.pages || {}, path || '');
  const out = new HTMLRewriter().on('head', { element(e) { e.append(`<script type="application/json" id="mg-cat">${js}</script>${css}`, { html: true }); } }).transform(res);
  const h = new Headers(out.headers); h.set('cache-control', 'no-cache'); h.delete('etag'); h.delete('last-modified');
  return new Response(out.body, { status: out.status, headers: h });
}

async function api(req, env, url, p) {
  // CSRF: state-changing requests must come from our own origin.
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const o = req.headers.get('origin');
    if (!o || (o !== env.SITE_ORIGIN && !/^https?:\/\/localhost(:\d+)?$/.test(o))) return fail('forbidden', 403);
  }
  if (p === '/api/signup' && req.method === 'POST') return signup(env, req);
  if (p === '/api/login' && req.method === 'POST') return login(env, req);
  if (p === '/api/logout' && req.method === 'POST') return logout(env, req);
  if (p === '/api/forgot' && req.method === 'POST') return forgot(env, req);
  if (p === '/api/reset' && req.method === 'POST') return reset(env, req);
  if (p === '/api/auth/google' && req.method === 'GET') return googleStart(env, req, url);
  if (p === '/api/auth/google/callback' && req.method === 'GET') return googleCallback(env, req, url);
  if (p === '/api/me' && req.method === 'GET') return me(env, req);
  if (p === '/api/catalog' && req.method === 'GET') return json(await catalog(env));
  if (p === '/api/contact' && req.method === 'POST') {
    if (!(await limit(env, req, 'contact', 5, 3600))) return fail('rate_limited', 429);
    const b = await readJson(req), email = clean(b?.email, 120).toLowerCase(), message = String(b?.message || '').slice(0, 3000).trim();
    if (!EMAIL.test(email)) return fail('email_invalid');
    if (message.length < 5) return fail('message_short');
    const name = clean(b.name, 60), topic = clean(b.topic, 80);
    const ins = await env.DB.prepare('INSERT INTO messages(email,name,topic,body,created_at) VALUES(?,?,?,?,?)').bind(email, name, topic, message, Date.now()).run();
    const mailed = await contactEmail(env, { email, name, topic, message });
    if (mailed) await env.DB.prepare('UPDATE messages SET mailed=1 WHERE id=?').bind(ins.meta.last_row_id).run();
    return json({ ok: true }); // the message is in the admin's inbox whether or not the e-mail went out
  }
  if (p === '/api/subscribe' && req.method === 'POST') {
    if (!(await limit(env, req, 'sub', 10, 3600))) return fail('rate_limited', 429);
    const b = await readJson(req), email = clean(b?.email, 120).toLowerCase();
    if (!EMAIL.test(email)) return fail('email_invalid');
    await env.DB.prepare('INSERT OR IGNORE INTO subscribers(email,source,created_at) VALUES(?,?,?)').bind(email, b?.source === 'soon' ? 'soon' : 'footer', Date.now()).run();
    return json({ ok: true });
  }
  const u = await currentUser(env, req);
  if (p === '/api/orders' && req.method === 'POST') {
    if (!(await limit(env, req, 'order', 30, 3600))) return fail('rate_limited', 429);
    return createOrder(env, req, u);
  }
  const cap = p.match(/^\/api\/orders\/(MG-[A-F0-9]{8})\/capture$/);
  if (cap && req.method === 'POST') {
    if (!(await limit(env, req, 'capture', 30, 900))) return fail('rate_limited', 429);
    const b = await readJson(req); return captureOrder(env, cap[1], String(b?.access || ''), String(b?.token || '').slice(0, 40));
  }
  const dl = p.match(/^\/api\/dl\/([a-f0-9]{20})$/);
  if (dl && req.method === 'GET') return download(env, dl[1], url);
  if (p.startsWith('/api/admin/')) {
    if (!isAdmin(env, u)) { if (u) await audit(env, req, u.email, 'admin_denied', p, 'alert'); return fail('not_found', 404); }
    // Every change the admin makes is written to the audit log (what, on which record), never file contents.
    let detail = url.search.slice(0, 160);
    if (req.method !== 'GET' && (req.headers.get('content-type') || '').includes('application/json')) {
      try { const j = await req.clone().json(); detail = [j.id, j.kind, j.path, j.status, j.section, j.email].filter((x) => typeof x === 'string' || typeof x === 'number').join(' ') || detail; } catch {}
    }
    const res = (await siteAdmin(env, req, url, p)) || (await filesAdmin(env, req, url, p)) || (await admin(env, req, url, p));
    if (req.method !== 'GET' && res.status < 400) await audit(env, req, u.email, `${req.method} ${p.replace('/api/admin/', '')}`, detail);
    return res;
  }
  if (!u) return fail('unauthorized', 401);
  if (p === '/api/me/export' && req.method === 'GET') return exportMe(env, req, u);
  if (p === '/api/me/orders' && req.method === 'GET') return myOrders(env, u);
  if (p === '/api/me/password' && req.method === 'POST') return changePassword(env, req, u);
  if (p === '/api/me/sessions' && req.method === 'GET') return mySessions(env, req, u);
  if (p === '/api/me/sessions' && req.method === 'DELETE') return endSessions(env, req, u, url);
  const tf = p.match(/^\/api\/me\/2fa\/(setup|enable|disable)$/);
  if (tf && req.method === 'POST') return twofa(env, req, u, tf[1]);
  if (p === '/api/me' && req.method === 'PATCH') return updateMe(env, req, u);
  if (p === '/api/me' && req.method === 'DELETE') return u.role === 'admin' ? fail('cannot_delete_admin') : deleteMe(env, req, u);
  return fail('not_found', 404);
}

// Security headers on every answer (the same as prototype/_headers, which does not cover responses the Worker builds).
const SEC = {
  'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY', 'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(self), usb=(), interest-cohort=()',
  'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
  'cross-origin-opener-policy': 'same-origin', 'cross-origin-resource-policy': 'same-origin',
  // No inline scripts anywhere: every script is a file of ours. Styles allow inline because pieces are positioned with style attributes.
  'content-security-policy': "default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://cloudflareinsights.com; media-src 'self' data: blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests",
};
function secure(res) {
  if (res.status === 101) return res;
  const h = new Headers(res.headers);
  for (const [k, v] of Object.entries(SEC)) if (!h.has(k)) h.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}

export default {
  async fetch(req, env0) {
    try { await migrate(env0); } catch (e) { console.error('migrate', e); return secure(new Response('The shop is being updated. Please try again in a minute.', { status: 503, headers: { 'retry-after': '60', 'content-type': 'text/plain; charset=utf-8' } })); }
    return secure(await handle(req, env0));
  },
  // cron (wrangler.toml [triggers]): payments that were approved but never brought back to the site
  async scheduled(ev, env, ctx) {
    ctx.waitUntil(migrate(env).then(() => sweepPending({ ...env, SITE_ORIGIN: env.SITE_ORIGIN || 'https://www.massandgrass.com' }).then((n) => n && console.log('sweep paid', n))));
  },
};

async function handle(req, env0) {
    const url = new URL(req.url);
    // massandgrass.com (no www) sends everyone to the one real address.
    if (url.hostname === 'massandgrass.com') return Response.redirect(`https://www.massandgrass.com${url.pathname}${url.search}`, 301);
    const env = { ...env0, SITE_ORIGIN: url.origin }; // same origin as the page: production host or the staging workers.dev host
    let path = url.pathname;
    try { path = decodeURIComponent(path); } catch {} // '/%61dmin/' must meet the same checks as '/admin/' (the asset server decodes it)
    path = path.replace(/\/{2,}/g, '/'); // '//admin/' must not slip past the admin gate either
    const p = path.replace(/\/+$/, '') || '/';
    try {
      if (p.startsWith('/api/')) return await api(req, env, url, p);
      if (p === '/admin' || p.startsWith('/admin/')) {
        const u = await currentUser(env, req);
        if (!isAdmin(env, u)) {
          if (p === '/admin' || p === '/admin/index.html') return Response.redirect(`${url.origin}/account.html?next=admin/`, 302);
          return env.ASSETS.fetch(new Request(`${url.origin}/404.html`)).then((r) => new Response(r.body, { status: 404, headers: r.headers }));
        }
        const r = await env.ASSETS.fetch(req);
        const h = new Headers(r.headers); h.set('cache-control', 'no-store'); h.set('x-robots-tag', 'noindex');
        return new Response(r.body, { status: r.status, headers: h });
      }
      // Before launch (SOON=1) everyone sees the coming-soon page; the signed-in admin still sees the whole site.
      if (env.SOON === '1' && !/^\/(soon-assets|fonts|assets)\//.test(p) && p !== '/account.html' && p !== '/account' && !/\.(webp|jpg|png|svg|ico|woff2|txt|xml)$/.test(p)
          && !isAdmin(env, await currentUser(env, req))) {
        const r = await env.ASSETS.fetch(new Request(`${url.origin}/soon`));
        const h = new Headers(r.headers); h.set('cache-control', 'no-store'); h.delete('etag');
        return new Response(r.body, { status: 200, headers: h });
      }
      const notFound = async () => {
        const nf = await env.ASSETS.fetch(new Request(`${url.origin}/404.html`));
        return withCatalog(env, new Response(nf.body, { status: 404, headers: nf.headers }), '404.html');
      };
      // Which site file this is: '/', '/shop', '/shop.html' → index.html, shop.html; scripts by their path.
      const fp = p === '/' ? 'index.html' : /\.(js|css)$/.test(p) ? p.slice(1) : p.slice(1).replace(/\.html$/, '') + '.html';
      if (PAGES.includes(fp) && (((await catalog(env)).pages || {}).hidden || []).includes(fp)) return notFound();
      if ((await publishedPaths(env)).has(fp)) {
        const row = await env.DB.prepare('SELECT published FROM site_files WHERE path=?').bind(fp).first();
        if (row && row.published != null) {
          const ext = fp.split('.').pop(), res = new Response(row.published, { headers: { 'content-type': TYPES[ext], 'cache-control': 'no-cache' } });
          return ext === 'html' ? withCatalog(env, res, fp) : res;
        }
      }
      const img = p.match(/^\/assets\/(u-[a-z0-9-]{2,37})\.webp$/);
      if (img) return (await serveImage(env, img[1])) || new Response('Not found', { status: 404 });
      const af = p.match(/^\/assets\/([\w.-]+\.(?:webp|jpg|png))$/);
      if (af && (await imageOverrides(env)).has(af[1])) return (await serveImageFile(env, af[1])) || env.ASSETS.fetch(req);
      // Pages carry live data, so never answer them with "not modified" from the static file's ETag.
      const isFile = /\.(webp|jpg|png|svg|ico|woff2|js|css|json|txt|xml)$/.test(p);
      const h0 = new Headers(req.headers); if (!isFile) { h0.delete('if-none-match'); h0.delete('if-modified-since'); }
      const r = await env.ASSETS.fetch(isFile ? req : new Request(req.url, { method: req.method, headers: h0 }));
      if (r.status === 404) return notFound();
      return await withCatalog(env, r, fp);
    } catch (e) {
      console.error(e);
      return p.startsWith('/api/') ? fail('server_error', 500) : new Response('Server error', { status: 500 });
    }
}
