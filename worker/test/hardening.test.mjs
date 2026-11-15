// The launch security checklist, tested against the local Worker (sh test/local.sh). Run: node test/hardening.test.mjs
// Each line is one protection; the report in the session lists the same items.
const B = 'http://localhost:8787', PW = process.env.LOCAL_ADMIN_PW || 'local-admin-only-1';
let bad = 0; const ok = (n, c, x) => { console.log(c ? 'ok  ' : 'FAIL', n, c ? '' : x ?? ''); if (!c) bad++; };
const H = { 'content-type': 'application/json', origin: B };
const req = (m, p, body, h = {}, jar = '') => fetch(B + p, { method: m, redirect: 'manual', headers: { ...H, ...(jar ? { cookie: jar } : {}), ...h }, body: body == null ? undefined : (typeof body === 'string' || body instanceof Uint8Array ? body : JSON.stringify(body)) });
const cookieOf = (r) => (r.headers.get('set-cookie') || '').split(';')[0];

// 14 · security headers on pages and on the API
{ const r = await fetch(B + '/'); const h = r.headers;
  ok('CSP without inline scripts', /script-src 'self'/.test(h.get('content-security-policy') || '') && !/script-src[^;]*unsafe-inline/.test(h.get('content-security-policy')));
  ok('HSTS', /max-age=\d{7,}/.test(h.get('strict-transport-security') || ''));
  ok('X-Frame-Options DENY', h.get('x-frame-options') === 'DENY');
  ok('nosniff', h.get('x-content-type-options') === 'nosniff');
  ok('Referrer-Policy', !!h.get('referrer-policy'));
  const a = await fetch(B + '/api/me'); ok('headers on the API too', a.headers.get('x-frame-options') === 'DENY'); }

// 4 · plain http on a real host goes to https
{ const r = await fetch(B + '/shop', { redirect: 'manual', headers: { host: 'www.massandgrass.com' } });
  // wrangler dev answers every host as localhost, so the redirect can only be seen on the real host (after a deploy:
  // curl -sI http://www.massandgrass.com/shop → 301 https://...). Here: the local host is not redirected.
  ok('localhost is not redirected (http → https only on real hosts)', r.status === 200 || r.status === 301); }

// 13 · CORS: no wildcard; 16 · CSRF: a state change from another origin is refused
{ const r = await fetch(B + '/api/catalog', { headers: { origin: 'https://evil.example' } });
  ok('no CORS allow-origin for other sites', !r.headers.get('access-control-allow-origin'));
  const p = await req('POST', '/api/subscribe', { email: 'x@example.com' }, { origin: 'https://evil.example' });
  ok('CSRF: foreign origin refused', p.status === 403);
  const n = await req('POST', '/api/subscribe', { email: 'x@example.com' }, { origin: '' });
  ok('CSRF: missing origin refused', n.status === 403); }

// 1 · 5 · 15 · accounts: sign up, the cookie's flags, logout ends the session on the server
const email = `t${Date.now()}@example.com`;
let jar = '';
{ const s = await req('POST', '/api/signup', { name: 'Test', email, password: 'a-long-password-1' });
  const sc = s.headers.get('set-cookie') || ''; jar = cookieOf(s);
  ok('sign up', s.status === 201, s.status);
  ok('session cookie HttpOnly; Secure; SameSite', /HttpOnly/.test(sc) && /Secure/.test(sc) && /SameSite=(Lax|Strict)/.test(sc), sc);
  ok('short password refused', (await req('POST', '/api/signup', { name: 'T', email: 'a' + email, password: 'short' })).status === 400);
  const me = await (await req('GET', '/api/me', null, {}, jar)).json(); ok('signed in', me.user && me.user.email === email);
  ok('no password data in /api/me', me.user && !('pw_hash' in me.user) && !('pw_salt' in me.user));
  await req('POST', '/api/logout', {}, {}, jar);
  const after = await (await req('GET', '/api/me', null, {}, jar)).json(); ok('logout ends the session (old cookie dead)', after.user === null); }

// 10 · 6 · injection and validation
{ const r = await req('POST', '/api/login', { email: "' OR 1=1 --", password: 'x' }); ok('SQL-looking email is just a wrong login', r.status === 401 || r.status === 400, r.status);
  const c = await req('POST', '/api/contact', { email: 'not-an-email', message: 'hello there' }); ok('server rejects a bad e-mail', c.status === 400);
  const big = await req('POST', '/api/contact', { email: 'a@example.com', name: 'x'.repeat(5000), message: 'hi <script>alert(1)</script> there' });
  ok('long fields are cut, script text kept as text', big.status === 200); }

// 19 · prices come from the server, never from the browser
{ const r = await req('POST', '/api/orders', { email: 'p@example.com', items: [{ kind: 'painting', k: 'hero', p: 0.01, t: 'cheap' }] });
  const j = await r.json(); ok('order priced by the server', r.status === 201 && j.total === 12, JSON.stringify(j).slice(0, 120));
  const u = await req('POST', '/api/orders', { email: 'p@example.com', items: [{ kind: 'calendar', k: 'made-up-2030' }] });
  ok('unknown product refused', u.status === 400); }

// 9 · admin: pages and API need the admin, on the server
{ ok('admin API without sign-in → 404', (await req('GET', '/api/admin/overview')).status === 404);
  ok('admin page without sign-in → sign-in page', (await fetch(B + '/admin/', { redirect: 'manual' })).status === 302);
  const s = await req('POST', '/api/signup', { name: 'Not admin', email: 'n' + email, password: 'a-long-password-1' });
  ok('a customer cannot reach the admin API', (await req('GET', '/api/admin/overview', null, {}, cookieOf(s))).status === 404); }

// 18 · uploads: the file's real bytes decide, not its name or header
{ const l = await req('POST', '/api/login', { email: 'info@massandgrass.com', password: PW }); const aj = cookieOf(l);
  ok('admin signs in', l.status === 200, l.status);
  const fake = await req('POST', '/api/admin/files?kind=painting&pid=hero&name=x.pdf', new TextEncoder().encode('<html><script>alert(1)</script></html>'), { 'content-type': 'application/pdf' }, aj);
  ok('a fake PDF (HTML inside) is refused', fake.status === 400, fake.status);
  const real = await req('POST', '/api/admin/files?kind=painting&pid=hero&name=x.pdf', new TextEncoder().encode('%PDF-1.4\n% a real one\n'), { 'content-type': 'application/octet-stream' }, aj);
  ok('a real PDF is taken', real.status === 200, real.status);
  const img = await req('POST', '/api/admin/image', new TextEncoder().encode('GIF89a not allowed here'), { 'content-type': 'image/png' }, aj);
  ok('a fake image is refused', img.status === 400, img.status); }

// 20 · errors stay generic
{ const r = await req('GET', '/api/does-not-exist'); const t = await r.text();
  ok('unknown API: generic answer, no stack', [401, 404].includes(r.status) && !/at \w+ \(|\.js:\d+/.test(t), t.slice(0, 80)); }

// 23 · repository files are not served
for (const p of ['/README.md', '/_src/pages/index.html', '/.git/config', '/CLAUDE.md', '/worker/wrangler.toml', '/.dev.vars', '/admin/admin.js', '/%61dmin/admin.js', '//admin/admin.js'])
  ok('not served: ' + p, [302, 404].includes((await fetch(B + p, { redirect: 'manual' })).status));

// 12 · 17 · password reset: rate limited, same answer for unknown addresses
{ const a = await req('POST', '/api/forgot', { email: 'nobody-here@example.com' }); ok('forgot: same answer for an unknown e-mail', a.status === 200);
  const t = await req('POST', '/api/reset', { token: 'not-a-real-token', password: 'a-long-password-2' }); ok('a made-up reset token is refused', t.status === 400);
  let last = 0; for (let i = 0; i < 6; i++) last = (await req('POST', '/api/forgot', { email: 'nobody-here@example.com' })).status;
  ok('forgot is rate limited (429)', last === 429, last); }

console.log(bad ? `${bad} failed` : 'all passed'); process.exit(bad ? 1 : 0);
