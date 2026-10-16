// Mass & Grass API: accounts and sign-in (step 1). Orders, PayPal and files come next.
const enc = new TextEncoder();
const PBKDF2_ITER = 100000; // Workers' maximum for PBKDF2
const SESSION_DAYS = 30;
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

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers } });
const fail = (code, status = 400, extra = {}) => json({ error: code, ...extra }, status);

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
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, photo: u.photo || null, via: u.google_sub ? 'google' : 'email', role: u.role, joined: new Date(u.created_at).toISOString() });

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

async function startSession(env, userId) {
  const t = token();
  const now = Date.now();
  await env.DB.prepare('INSERT INTO sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)')
    .bind(await sha256(t), userId, now, now + SESSION_DAYS * 864e5).run();
  return setCookie(t, SESSION_DAYS * 86400);
}
async function currentUser(env, req) {
  const t = cookies(req)[COOKIE];
  if (!t) return null;
  return env.DB.prepare(
    'SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?'
  ).bind(await sha256(t), Date.now()).first();
}

async function sendMail(env, to, subject, html) {
  if (!env.RESEND_API_KEY) { console.log('[mail not configured]', to, subject, html); return false; }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: env.MAIL_FROM, to, subject, html }),
  });
  return r.ok;
}

async function readJson(req) {
  if (!(req.headers.get('content-type') || '').includes('application/json')) return null;
  try { return await req.json(); } catch { return null; }
}

const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n);
const safeNext = (n) => (typeof n === 'string' && /^[a-z0-9_-]+\.html(\?[\w=&.%-]*)?$/i.test(n) ? n : 'profile.html');

// ---------- handlers ----------
async function signup(env, req) {
  if (!(await limit(env, req, 'signup', 10, 3600))) return fail('rate_limited', 429);
  const b = await readJson(req);
  if (!b) return fail('bad_request');
  const email = clean(b.email, 120).toLowerCase(), name = clean(b.name, 60), pw = String(b.password ?? '');
  if (!EMAIL.test(email)) return fail('email_invalid');
  if (!name) return fail('name_required');
  if (pw.length < 8 || pw.length > 200) return fail('password_short');
  if (await env.DB.prepare('SELECT 1 FROM users WHERE email=?').bind(email).first()) return fail('email_taken', 409);
  const id = crypto.randomUUID(), salt = rand(16);
  await env.DB.prepare('INSERT INTO users(id,email,name,pw_hash,pw_salt,pw_iter,created_at) VALUES(?,?,?,?,?,?,?)')
    .bind(id, email, name, await hashPw(pw, salt), b64(salt), PBKDF2_ITER, Date.now()).run();
  const cookie = await startSession(env, id);
  const u = await env.DB.prepare('SELECT * FROM users WHERE id=?').bind(id).first();
  return json({ user: publicUser(u) }, 201, { 'set-cookie': cookie });
}

async function login(env, req) {
  if (!(await limit(env, req, 'login', 10, 900))) return fail('rate_limited', 429);
  const b = await readJson(req);
  if (!b) return fail('bad_request');
  const email = clean(b.email, 120).toLowerCase(), pw = String(b.password ?? '');
  const u = await env.DB.prepare('SELECT * FROM users WHERE email=?').bind(email).first();
  // Always do one derivation so timing doesn't reveal whether the account exists.
  const salt = u?.pw_salt ? unb64(u.pw_salt) : rand(16);
  const got = await hashPw(pw.slice(0, 200), salt, u?.pw_iter || PBKDF2_ITER);
  if (!u || !u.pw_hash || !same(got, u.pw_hash)) return fail('bad_credentials', 401);
  return json({ user: publicUser(u) }, 200, { 'set-cookie': await startSession(env, u.id) });
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
    await sendMail(env, email, 'Reset your Mass & Grass password · تغيير كلمة السر',
      `<p>Open this link to choose a new password (valid for one hour):</p><p><a href="${link}">${link}</a></p><p dir="rtl">افتحوا الرابط لاختيار كلمة سر جديدة (صالح لمدة ساعة).</p><p>If you didn't ask for this, ignore this email.</p>`);
  }
  return json({ ok: true }); // same answer whether or not the account exists
}

async function reset(env, req) {
  if (!(await limit(env, req, 'reset', 10, 3600))) return fail('rate_limited', 429);
  const b = await readJson(req);
  const pw = String(b?.password ?? ''), t = String(b?.token ?? '');
  if (pw.length < 8 || pw.length > 200) return fail('password_short');
  const th = await sha256(t);
  const row = await env.DB.prepare('SELECT user_id FROM reset_tokens WHERE token_hash=? AND expires_at>?').bind(th, Date.now()).first();
  if (!row) return fail('token_invalid', 400);
  const salt = rand(16);
  await env.DB.batch([
    env.DB.prepare('UPDATE users SET pw_hash=?, pw_salt=?, pw_iter=? WHERE id=?').bind(await hashPw(pw, salt), b64(salt), PBKDF2_ITER, row.user_id),
    env.DB.prepare('DELETE FROM reset_tokens WHERE user_id=?').bind(row.user_id),
    env.DB.prepare('DELETE FROM sessions WHERE user_id=?').bind(row.user_id), // sign out everywhere
  ]);
  return json({ ok: true });
}

// ---------- Google OAuth (authorization code flow) ----------
async function googleStart(env, req, url) {
  if (!env.GOOGLE_CLIENT_ID) return fail('google_not_configured', 503);
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
  const [state, next] = (cookies(req)['__Host-mgo'] || '').split('.');
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
    await env.DB.prepare('UPDATE users SET google_sub=? WHERE id=?').bind(idt.sub, u.id).run(); // verified email matches
  }
  const cookie = await startSession(env, u.id);
  const h = new Headers({ location: `${env.SITE_ORIGIN}/${safeNext(decodeURIComponent(next || ''))}` });
  h.append('set-cookie', cookie);
  h.append('set-cookie', '__Host-mgo=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax');
  return new Response(null, { status: 302, headers: h });
}

// ---------- router ----------
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const p = url.pathname.replace(/\/+$/, '');
    try {
      // CSRF: state-changing requests must come from our own origin.
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        const o = req.headers.get('origin');
        if (!o || (o !== env.SITE_ORIGIN && !/^https?:\/\/localhost(:\d+)?$/.test(o))) return fail('forbidden', 403);
      }
      if (p === '/api/signup' && req.method === 'POST') return await signup(env, req);
      if (p === '/api/login' && req.method === 'POST') return await login(env, req);
      if (p === '/api/logout' && req.method === 'POST') return await logout(env, req);
      if (p === '/api/forgot' && req.method === 'POST') return await forgot(env, req);
      if (p === '/api/reset' && req.method === 'POST') return await reset(env, req);
      if (p === '/api/auth/google' && req.method === 'GET') return await googleStart(env, req, url);
      if (p === '/api/auth/google/callback' && req.method === 'GET') return await googleCallback(env, req, url);
      if (p === '/api/me' && req.method === 'GET') return await me(env, req);
      if (p === '/api/me' || p === '/api/me/export') {
        const u = await currentUser(env, req);
        if (!u) return fail('unauthorized', 401);
        if (p === '/api/me/export' && req.method === 'GET') return await exportMe(env, req, u);
        if (req.method === 'PATCH') return await updateMe(env, req, u);
        if (req.method === 'DELETE') return await deleteMe(env, req, u);
      }
      return fail('not_found', 404);
    } catch (e) {
      console.error(e);
      return fail('server_error', 500);
    }
  },
};
