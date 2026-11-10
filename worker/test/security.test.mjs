// Security and admin tests against the local Worker (sh test/local.sh). Run: node test/security.test.mjs
import { totpNow } from '../src/security.js';
const B = process.env.API || 'http://localhost:8787', O = 'http://localhost:8787', PW = process.env.LOCAL_ADMIN_PW || 'local-admin-only-1', ADMIN = 'info@massandgrass.com';
function client() {
  let jar = '';
  return async (method, path, body, extra = {}) => {
    const r = await fetch(B + path, { method, redirect: 'manual', headers: { 'content-type': 'application/json', origin: O, cookie: jar, ...extra }, body: body ? JSON.stringify(body) : undefined });
    const sc = r.headers.get('set-cookie'); if (sc) jar = sc.split(';')[0].endsWith('=') ? '' : sc.split(';')[0];
    return { s: r.status, j: await r.json().catch(() => null), h: r.headers };
  };
}
let bad = 0; const ok = (n, c) => { console.log(c ? 'ok  ' : 'FAIL', n); if (!c) bad++; };
const anon = client(), admin = client(), user = client();
let r;

// headers and the page itself
r = await fetch(B + '/'); const csp = r.headers.get('content-security-policy') || '', html = await r.text();
ok('CSP has no unsafe-inline for scripts', /script-src 'self'[^;]*;/.test(csp) && !/script-src[^;]*unsafe-inline/.test(csp));
ok('HSTS, nosniff, frame deny', /max-age=\d{8}/.test(r.headers.get('strict-transport-security')) && r.headers.get('x-content-type-options') === 'nosniff' && r.headers.get('x-frame-options') === 'DENY');
ok('page has no inline script', !/<script(?![^>]*\bsrc=)(?![^>]*type="application\/json")[^>]*>/.test(html));
ok('catalog travels as JSON data', /<script type="application\/json" id="mg-cat">/.test(html));
for (const p of ['/shop', '/paintings', '/postcards', '/stickers', '/calendar', '/story', '/account', '/checkout', '/profile', '/help', '/terms']) { r = await fetch(B + p); ok('page ' + p, r.status === 200); }
r = await fetch(B + '/nope'); ok('unknown page is a 404', r.status === 404);

// the admin area is closed to everyone else
r = await fetch(B + '/admin/', { redirect: 'manual' }); ok('admin page redirects visitors to sign-in', r.status === 302);
r = await fetch(B + '/admin/admin.js', { redirect: 'manual' }); ok('admin script hidden from visitors', r.status === 404);
r = await anon('GET', '/api/admin/overview'); ok('admin API hidden from visitors', r.s === 404);
const em = `u${Date.now()}@example.com`;
r = await user('POST', '/api/signup', { name: 'Customer', email: em, password: 'correct horse battery' }); ok('customer signs up', r.s === 201);
r = await user('GET', '/api/admin/overview'); ok('admin API hidden from customers', r.s === 404);
r = await anon('POST', '/api/signup', { name: 'X', email: ADMIN, password: 'correct horse battery' }); ok('nobody can register the admin e-mail', r.s === 409);
r = await anon('POST', '/api/login', { email: ADMIN, password: 'x' }, { origin: 'https://evil.example' }); ok('cross-site POST refused', r.s === 403);

// admin sign-in, overview, audit
r = await admin('POST', '/api/login', { email: ADMIN, password: PW }); ok('admin signs in', r.s === 200 && r.j.user.role === 'admin');
r = await admin('GET', '/api/admin/overview'); ok('overview answers', r.s === 200 && Array.isArray(r.j.byDay) && r.j.byDay.length === 30 && r.j.products > 50);
ok('overview lists pieces without a file', Array.isArray(r.j.noFile) && r.j.noFile.length > 0);
r = await admin('GET', '/api/admin/products'); const prods = r.j.products; ok('products list', prods.length > 50 && prods.some((p) => p.id === 's-kaak'));
ok('no watermarked pieces on sale', !prods.some((p) => ['s-dove', 's-gaza', 's-heart', 'ppoppies', 'ptree'].includes(p.id)));
ok('no sample sales figures', prods.every((p) => p.sold === 0 || p.id === 'hill')); // free.test.cjs runs first and gives hill away for real
r = await admin('PUT', '/api/admin/settings', { prices: { painting: 12, postcard: 2, sticker: 1, pack: 3, calendar: 8 } }); ok('settings save', r.s === 200);
r = await admin('GET', '/api/admin/audit'); ok('audit log records sign-in and the change', r.j.log.some((l) => l.action === 'login' && l.actor === ADMIN) && r.j.log.some((l) => l.action === 'PUT settings'));
ok('failed admin sign-in is an alert', (await anon('POST', '/api/login', { email: ADMIN, password: 'wrong-password-1' })).s === 401 && (await admin('GET', '/api/admin/audit?level=alert')).j.log.some((l) => l.action === 'login_failed'));

// messages from the help page reach the admin
r = await anon('POST', '/api/contact', { email: 'someone@example.com', name: 'Someone', topic: 'A question', message: 'Hello from the test.' }); ok('contact accepted', r.s === 200);
r = await admin('GET', '/api/admin/messages'); const msg = r.j.messages.find((m) => m.email === 'someone@example.com'); ok('message is in the inbox', !!msg && msg.read === 0);
r = await admin('PUT', '/api/admin/messages', { id: msg.id, read: true }); r = await admin('GET', '/api/admin/overview'); ok('marking read lowers unread', r.j.unread === 0);

// an order is priced on the server, whatever the browser says
r = await anon('POST', '/api/orders', { email: 'buyer@example.com', items: [{ k: 'hero', kind: 'painting', p: 0.01 }, { k: 'calendar-2027', kind: 'calendar', p: 0 }] });
ok('order priced by the server', r.s === 201 && r.j.total === 20 && r.j.payments === 'off'); const oid = r.j.id, acc = r.j.access;
r = await anon('POST', '/api/orders', { email: 'buyer@example.com', items: [{ k: 's-dove', kind: 'sticker' }] }); ok('a removed piece cannot be ordered', r.s === 400);
r = await anon('POST', `/api/orders/${oid}/capture`, { access: 'wrong' }); ok('order needs its secret', r.s === 404);
r = await anon('POST', `/api/orders/${oid}/capture`, { access: acc }); ok('unpaid order gives no files', r.s === 402);
r = await admin('GET', '/api/admin/order?id=' + oid); ok('admin sees the order', r.j.order.total === 20 && r.j.order.status === 'pending');

// page texts: a script's text is edited from the admin and served changed
r = await admin('GET', '/api/admin/page?path=shop.html'); let tx = r.j.texts.find((t) => t.en === 'Your bag'); ok('script texts are listed', !!tx && tx.file === 'assets/js/core.js');
r = await admin('PUT', '/api/admin/page', { path: 'shop.html', changes: [{ id: tx.id, old_en: tx.en, old_ar: tx.ar, en: 'Your basket', ar: tx.ar }] }); ok('text saved', r.s === 200 && r.j.changed === 1);
r = await fetch(B + '/assets/js/core.js'); ok('edited script is served', (await r.text()).includes("'Your basket'"));
r = await admin('PUT', '/api/admin/page', { path: 'shop.html', changes: [{ id: tx.id, old_en: 'Your basket', old_ar: tx.ar, en: '</script><script>alert(1)', ar: tx.ar }] }); ok('markup in a text is refused', r.s === 400);
r = await admin('PUT', '/api/admin/page', { path: 'shop.html', changes: [{ id: tx.id, old_en: 'Your basket', old_ar: tx.ar, en: 'Your bag', ar: tx.ar }] }); ok('text put back', r.s === 200);
r = await admin('GET', '/api/admin/page?path=shop.html'); tx = r.j.texts.find((t) => t.en === 'The shop');
r = await admin('PUT', '/api/admin/page', { path: 'shop.html', changes: [{ id: tx.id, old_en: tx.en, old_ar: tx.ar, en: 'Our shop', ar: tx.ar }] }); r = await fetch(B + '/shop'); ok('page text edited', (await r.text()).includes('>Our shop<'));
r = await admin('POST', '/api/admin/page/restore', { path: 'shop.html' }); r = await fetch(B + '/shop'); ok('restore brings the original page back', (await r.text()).includes('>The shop<'));

// sessions
r = await admin('GET', '/api/me/sessions'); ok('sessions listed with the current one marked', r.j.sessions.length >= 1 && r.j.sessions.some((s) => s.current));
const admin2 = client(); await admin2('POST', '/api/login', { email: ADMIN, password: PW });
r = await admin('DELETE', '/api/me/sessions'); r = await admin2('GET', '/api/admin/overview'); ok('ending other sessions signs them out', r.s === 404);

// two-step sign-in
r = await admin('POST', '/api/me/2fa/setup'); const secret = r.j.secret; ok('2FA setup gives a secret', /^[A-Z2-7]{32}$/.test(secret) && r.j.uri.startsWith('otpauth://totp/'));
r = await admin('POST', '/api/me/2fa/enable', { code: '000000' }); ok('wrong code does not enable', r.s === 400);
r = await admin('POST', '/api/me/2fa/enable', { code: await totpNow(secret) }); const rec = r.j.recovery; ok('right code enables, recovery codes shown once', r.s === 200 && rec.length === 10);
const a3 = client();
r = await a3('POST', '/api/login', { email: ADMIN, password: PW }); ok('password alone is no longer enough', r.s === 401 && r.j.error === 'totp_required');
r = await a3('POST', '/api/login', { email: ADMIN, password: PW, code: '123456' }); ok('wrong code refused', r.s === 401 && r.j.error === 'totp_invalid');
r = await a3('POST', '/api/login', { email: ADMIN, password: PW, code: rec[0] }); ok('a recovery code signs in', r.s === 200);
r = await client()('POST', '/api/login', { email: ADMIN, password: PW, code: rec[0] }); ok('a recovery code works once', r.s === 401);
r = await admin('POST', '/api/me/2fa/disable', { password: PW, code: rec[1] }); ok('2FA off with password and a code', r.s === 200);
r = await client()('POST', '/api/login', { email: ADMIN, password: PW }); ok('sign-in is back to one step', r.s === 200);

// lockout: one account can only be tried a few times
const victim = `v${Date.now()}@example.com`; await client()('POST', '/api/signup', { name: 'V', email: victim, password: 'correct horse battery' });
let locked = false; for (let i = 0; i < 9; i++) { r = await client()('POST', '/api/login', { email: victim, password: 'wrong-guess-' + i }); if (r.s === 429) locked = true; }
ok('account locks after repeated wrong passwords', locked);
r = await client()('POST', '/api/login', { email: victim, password: 'correct horse battery' }); ok('even the right password waits while locked', r.s === 429);
console.log(bad ? `${bad} failed` : 'all passed'); process.exit(bad ? 1 : 0);
