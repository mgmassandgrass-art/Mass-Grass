// The whole payment path against the local Worker and the stand-in PayPal (sh test/local.sh paypal). Run: node test/pay.test.cjs
// bag → checkout → PayPal approves → back on the site → files on the page and downloadable; a buyer back on another browser
// (PayPal's token only); an approved order never brought back, taken by the admin's "ask PayPal" and by the cron.
const { chromium } = require('playwright');
const B = 'http://localhost:8787', PW = process.env.LOCAL_ADMIN_PW || 'local-admin-only-1';
let bad = 0; const ok = (n, c, x) => { console.log(c ? 'ok  ' : 'FAIL', n, c ? '' : x || ''); if (!c) bad++; };
let jar = '';
const api = async (m, p, body, raw) => { const r = await fetch(B + p, { method: m, redirect: 'manual', headers: { origin: B, cookie: jar, ...(raw ? { 'content-type': raw.type } : { 'content-type': 'application/json' }) }, body: raw ? raw.body : body ? JSON.stringify(body) : undefined });
  const sc = r.headers.get('set-cookie'); if (sc) jar = sc.split(';')[0]; return { s: r.status, j: await r.json().catch(() => null), r }; };
(async () => {
  await api('POST', '/api/login', { email: 'info@massandgrass.com', password: PW });
  const up = await api('POST', '/api/admin/files?kind=painting&pid=hero&name=gaza-coast.pdf', null, { type: 'application/pdf', body: Buffer.from('%PDF-1.4 local test file\n') });
  ok('admin uploads the painting file', up.s === 200);
  const b = await chromium.launch();
  // 1 · a buyer pays and comes back
  const c = await b.newContext(); const p = await c.newPage(); const errs = []; p.on('pageerror', (x) => errs.push(x.message));
  await p.goto(B + '/paintings#hero', { waitUntil: 'load' }); await p.waitForSelector('dialog#view[open]'); await p.click('#vadd'); await p.keyboard.press('Escape');
  await p.goto(B + '/checkout', { waitUntil: 'load' }); await p.waitForSelector('#f'); await p.fill('#em', 'buyer@example.com');
  await Promise.all([p.waitForURL('**/checkout.html*'), p.click('#f [type=submit]')]);
  await p.waitForSelector('.co-done', { timeout: 10000 }).catch(() => {});
  ok('back from PayPal, the order is paid', (await p.locator('.co-done').count()) === 1, await p.textContent('#co'));
  const href = await p.getAttribute('.co-done .files a', 'href').catch(() => null);
  ok('the file link is on the page', !!href);
  if (href) { const d = await fetch(B + href); ok('the file downloads', d.status === 200 && (await d.text()).includes('local test file')); }
  ok('the bag is empty after paying', (await p.textContent('[data-bagn]')) === '0');
  ok('no page errors', !errs.length, errs.join('|'));
  // 2 · approved on PayPal, came back in another browser (no order secret, only PayPal's token)
  const o2 = await api('POST', '/api/orders', { email: 'b2@example.com', items: [{ k: 'hero', kind: 'painting' }] });
  const ap = await fetch(o2.j.approve, { redirect: 'manual' }); const back = ap.headers.get('location') || '';
  const q = new URL(back).searchParams;
  const bad1 = await fetch(`${B}/api/orders/${o2.j.id}/capture`, { method: 'POST', headers: { 'content-type': 'application/json', origin: B }, body: JSON.stringify({ token: 'WRONG' }) });
  ok('a wrong token gets nothing', bad1.status === 404);
  const c2 = await fetch(`${B}/api/orders/${o2.j.id}/capture`, { method: 'POST', headers: { 'content-type': 'application/json', origin: B }, body: JSON.stringify({ token: q.get('token') }) });
  ok("PayPal's token alone completes the order", c2.status === 200 && (await c2.json()).order.status === 'paid');
  // 3 · approved but never brought back: the admin asks PayPal
  const o3 = await api('POST', '/api/orders', { email: 'b3@example.com', items: [{ k: 'hero', kind: 'painting' }] });
  let r = await api('POST', '/api/admin/orders/check', { id: o3.j.id }); ok('not approved yet: not paid', r.s === 402);
  await fetch(o3.j.approve + '&stay=1');
  r = await api('POST', '/api/admin/orders/check', { id: o3.j.id }); ok('approved: the admin check takes the payment', r.s === 200 && r.j.order.status === 'paid');
  // 4 · the cron runs without error
  const cr = await fetch(B + '/__scheduled?cron=*/15+*+*+*+*'); ok('the cron handler runs', cr.status === 200);
  // 5 · the server's figures
  r = await api('GET', '/api/admin/overview'); ok('overview counts the three paid orders', r.j.totals.orders === 3 && r.j.totals.revenue === 36, JSON.stringify(r.j.totals));
  r = await api('GET', '/api/admin/audit'); ok('the paid-by-check order is in the audit log', r.j.log.some((l) => l.action === 'POST orders/check'));
  await b.close(); console.log(bad ? `${bad} failed` : 'all passed'); process.exit(bad ? 1 : 0);
})();
