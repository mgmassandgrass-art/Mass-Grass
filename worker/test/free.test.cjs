// Free downloads against the local Worker (sh test/local.sh). Run: node test/free.test.cjs
const { chromium } = require('playwright');
const B = 'http://localhost:8787', PW = process.env.LOCAL_ADMIN_PW || 'local-admin-only-1';
let bad = 0; const ok = (n, c, x) => { console.log(c ? 'ok  ' : 'FAIL', n, c ? '' : x || ''); if (!c) bad++; };
let jar = '';
const api = async (m, p, body, raw, noCookie) => { const r = await fetch(B + p, { method: m, headers: { origin: B, cookie: noCookie ? '' : jar, 'content-type': raw ? raw.type : 'application/json' }, body: raw ? raw.body : body ? JSON.stringify(body) : undefined });
  const sc = r.headers.get('set-cookie'); if (sc && !noCookie) jar = sc.split(';')[0]; return { s: r.status, j: await r.json().catch(() => null) }; };
(async () => {
  await api('POST', '/api/login', { email: 'info@massandgrass.com', password: PW });
  const hill = (await api('GET', '/api/admin/products')).j.products.find((p) => p.id === 'hill' && p.kind === 'painting');
  let r = await api('PUT', '/api/admin/products', { ...hill, price: 0 }); ok('admin sets a painting free (price 0)', r.s === 200);
  r = await api('POST', '/api/orders', { email: 'f@example.com', items: [{ k: 'hill', kind: 'painting' }] }, null, true); ok('a free piece without its file is refused', r.s === 409 && r.j.error === 'not_ready');
  await api('POST', '/api/admin/files?kind=painting&pid=hill&name=hill-and-boat.pdf', null, { type: 'application/pdf', body: Buffer.from('%PDF-1.4 free file\n') });
  r = await api('POST', '/api/orders', { email: 'f@example.com', items: [{ k: 'hill', kind: 'painting' }] }, null, true);
  ok('free order is ready at once, no payment', r.s === 201 && r.j.free === true && r.j.order.status === 'paid' && r.j.order.files.length === 1);
  if (r.j && r.j.order) { const d = await fetch(B + r.j.order.files[0].url); ok('its file downloads', d.status === 200 && (await d.text()).includes('free file')); }
  r = await api('POST', '/api/orders', { email: 'f2@example.com', items: [{ k: 'hill', kind: 'painting' }, { k: 'hero', kind: 'painting' }] }, null, true);
  ok('free + paid together: only the paid one is charged', r.s === 201 && r.j.total === 12 && !r.j.free);
  // the visitor's side
  const b = await chromium.launch(), c = await b.newContext(), p = await c.newPage(), errs = []; p.on('pageerror', (x) => errs.push(x.message));
  await p.goto(B + '/shop#painting', { waitUntil: 'load' });
  const tile = p.locator('.pr-it', { has: p.locator('h3', { hasText: 'Hill & Boat' }) });
  ok('the shop shows it as free', /Free/.test(await tile.locator('.pr').textContent()));
  ok('its button says free download', /Free download/.test(await tile.locator('.add').textContent()));
  await Promise.all([p.waitForURL('**/checkout.html'), tile.locator('.add').click()]); await p.waitForSelector('#f');
  ok('checkout offers the files, not a payment', /Get the files/.test(await p.textContent('#f [type=submit]')));
  await p.fill('#em', 'visitor@example.com'); await p.click('#f [type=submit]'); await p.waitForSelector('.co-done', { timeout: 8000 }).catch(() => {});
  ok('the files are on the page', (await p.locator('.co-done .files a').count()) === 1);
  ok('the bag is empty after', (await p.textContent('[data-bagn]')) === '0');
  await p.goto(B + '/paintings#hill', { waitUntil: 'load' }); await p.waitForSelector('dialog#view[open]');
  ok('the painting sheet says free download', /Free download/.test(await p.textContent('#vadd')));
  ok('no page errors', !errs.length, errs.join('|')); await b.close();
  // limits and figures
  let lim = 0; for (let i = 0; i < 12; i++) { const x = await api('POST', '/api/orders', { email: 'bulk@example.com', items: [{ k: 'hill', kind: 'painting' }] }, null, true); if (x.s === 429) lim++; }
  ok('one e-mail cannot take free files without limit', lim > 0);
  r = await api('GET', '/api/admin/overview'); ok('overview counts free downloads apart from sales', r.j.freeDownloads >= 2 && r.j.totals.revenue === 0, JSON.stringify({ f: r.j.freeDownloads, t: r.j.totals }));
  console.log(bad ? `${bad} failed` : 'all passed'); process.exit(bad ? 1 : 0);
})();
