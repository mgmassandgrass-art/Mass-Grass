// Printed pieces shipped to the UAE and Denmark, against the local Worker with the stand-in PayPal
// (sh test/local.sh paypal). Run: node test/ship.test.cjs
const { chromium } = require('playwright');
const B = 'http://localhost:8787', PW = process.env.LOCAL_ADMIN_PW || 'local-admin-only-1';
let bad = 0; const ok = (n, c, x) => { console.log(c ? 'ok  ' : 'FAIL', n, c ? '' : x || ''); if (!c) bad++; };
let jar = '';
const api = async (m, p, body, noCookie) => { const r = await fetch(B + p, { method: m, redirect: 'manual', headers: { origin: B, cookie: noCookie ? '' : jar, 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const sc = r.headers.get('set-cookie'); if (sc && !noCookie) jar = sc.split(';')[0]; return { s: r.status, j: await r.json().catch(() => null) }; };
const AE = { country: 'AE', name: 'Test Buyer', phone: '+971 50 123 4567', line1: 'Street 1, Villa 2', city: 'Dubai' };
(async () => {
  await api('POST', '/api/login', { email: 'info@massandgrass.com', password: PW });
  // before the admin turns anything on, nothing is printed
  let r = await api('POST', '/api/orders', { email: 's@example.com', items: [{ k: 'waves', kind: 'painting', fmt: 'print' }], ship: AE }, true);
  ok('a piece not offered printed is refused', r.s >= 400, JSON.stringify(r.j));
  const waves = (await api('GET', '/api/admin/products')).j.products.find((p) => p.id === 'waves' && p.kind === 'painting');
  r = await api('PUT', '/api/admin/products', { ...waves, extra: { ...waves.extra, print: { on: true, price: 35, size: '30 × 40 cm', size_ar: '30 × 40 سم' } } });
  ok('admin offers a painting printed', r.s === 200);
  r = await api('POST', '/api/orders', { email: 's@example.com', items: [{ k: 'waves', kind: 'painting', fmt: 'print' }], ship: AE }, true);
  ok('no shipping fee set yet: the country is closed', r.s === 400 && r.j.error === 'ship_country', JSON.stringify(r.j));
  r = await api('PUT', '/api/admin/settings', { shipping: { AE: { on: true, fee: 15, days: '7 to 10 days' }, DK: { on: true, fee: 12, days: '' } } });
  ok('admin sets the shipping fees', r.s === 200);
  const cat = await (await fetch(B + '/api/catalog')).json().catch(() => ({}));
  ok('the catalog lists both countries', cat.shipping && cat.shipping.AE && cat.shipping.AE.fee === 15 && cat.shipping.DK.fee === 12, JSON.stringify(cat.shipping));
  // the server's checks
  r = await api('POST', '/api/orders', { email: 's@example.com', items: [{ k: 'waves', kind: 'painting', fmt: 'print' }], ship: { ...AE, country: 'US' } }, true);
  ok('a country not shipped to is refused', r.s === 400 && r.j.error === 'ship_country');
  r = await api('POST', '/api/orders', { email: 's@example.com', items: [{ k: 'waves', kind: 'painting', fmt: 'print' }], ship: { ...AE, line1: '' } }, true);
  ok('an address without a street is refused', r.s === 400 && r.j.error === 'ship_address');
  r = await api('POST', '/api/orders', { email: 's@example.com', items: [{ k: 'waves', kind: 'painting', fmt: 'print' }], ship: { ...AE, country: 'DK', postal: '12' } }, true);
  ok('Denmark needs a 4-digit postcode', r.s === 400 && r.j.error === 'ship_address');
  r = await api('POST', '/api/orders', { email: 's@example.com', items: [{ k: 'waves', kind: 'painting', fmt: 'print' }] }, true);
  ok('a printed piece without an address is refused', r.s === 400);
  r = await api('POST', '/api/orders', { email: 's@example.com', items: [{ k: 'waves', kind: 'painting', fmt: 'print', q: 2, p: 0.01 }, { k: 'hero', kind: 'painting' }], ship: AE }, true);
  ok('2 prints + a file + shipping: the server sets the total', r.s === 201 && r.j.total === 35 * 2 + 12 + 15, JSON.stringify(r.j));
  const id = r.j && r.j.id;
  let o = (await api('GET', '/api/admin/order?id=' + id)).j.order;
  ok('the order keeps the address and the fee', o.ship && o.ship.city === 'Dubai' && o.shipping === 15 && o.ship_status === 'to_print');
  const pp = await (await fetch('http://localhost:8899/v2/checkout/orders/' + o.paypal_id, { headers: { authorization: 'Bearer mock-token' } })).json();
  const pu = pp.purchase_units[0];
  ok('PayPal is asked for items + shipping, with the address', pu.amount.value === '97.00' && pu.amount.breakdown.shipping.value === '15.00' && pu.shipping.address.country_code === 'AE', JSON.stringify(pu));
  await fetch(r.j.approve + '&stay=1');
  r = await api('POST', '/api/admin/orders/check', { id }); ok('paid', r.s === 200 && r.j.order.status === 'paid');
  ok('only the digital line has files', r.j.order && r.j.order.files.every((f) => !/waves/i.test(f.name)), JSON.stringify(r.j.order && r.j.order.files));
  r = await api('GET', '/api/admin/overview'); ok('the overview counts the parcel to send', r.j.toShip >= 1);
  r = await api('PUT', '/api/admin/orders/ship', { id, status: 'sent', tracking: 'AE123456789' }); ok('admin marks it sent with tracking', r.s === 200);
  o = (await api('GET', '/api/admin/order?id=' + id)).j.order; ok('the parcel state is saved', o.ship_status === 'sent' && o.tracking === 'AE123456789');
  r = await api('PUT', '/api/admin/orders/ship', { id, status: 'lost' }); ok('an unknown parcel state is refused', r.s === 400);
  // the visitor's side
  const b = await chromium.launch(), c = await b.newContext(), p = await c.newPage(), errs = []; p.on('pageerror', (x) => errs.push(x.message));
  await p.goto(B + '/paintings#waves', { waitUntil: 'load' }); await p.waitForSelector('dialog#view[open]');
  ok('the painting sheet offers the printed copy', (await p.locator('#vprint .pbtn').count()) === 1 && /30 × 40/.test(await p.textContent('#vprint')));
  await p.click('#vprint .pbtn'); await p.keyboard.press('Escape');
  await p.goto(B + '/checkout', { waitUntil: 'load' }); await p.waitForSelector('#f');
  ok('checkout asks for the shipping address', (await p.locator('#sc').count()) === 1);
  await p.click('[data-q="0"][data-d="1"]');
  ok('quantity goes up', (await p.textContent('.qty b')) === '2');
  await p.selectOption('#sc', 'DK');
  ok('the fee follows the country', /12/.test(await p.textContent('#shipFee')) && /82/.test(await p.textContent('#coTotal')), await p.textContent('#coTotal'));
  await p.fill('#em', 'dk@example.com'); await p.fill('#sn', 'Dansk Køber'); await p.fill('#sp', '+45 12 34 56 78'); await p.fill('#s1', 'Nørrebrogade 1'); await p.fill('#sci', 'København');
  await p.click('#f [type=submit]');
  ok('Denmark without a postcode is stopped on the page', /postcode/i.test(await p.textContent('#f')));
  await p.fill('#spc', '2200');
  await Promise.all([p.waitForURL('**/checkout.html*'), p.click('#f [type=submit]')]);
  await p.waitForSelector('.co-done', { timeout: 10000 }).catch(() => {});
  ok('back from PayPal, the prints are on their way', /København/.test(await p.textContent('#co')), (await p.textContent('#co')).slice(0, 300));
  const ord = (await api('GET', '/api/admin/orders')).j.orders.find((x) => x.email === 'dk@example.com');
  ok('the Danish order is paid with 2 prints and €12 shipping', ord && ord.status === 'paid' && ord.total === 82 && ord.ship.postal === '2200', JSON.stringify(ord));
  // the admin's side
  const a = await c.newPage(); a.on('pageerror', (x) => errs.push(x.message));
  const [cn, ...cv] = jar.split('=');
  await c.addCookies([{ name: cn, value: cv.join('='), domain: 'localhost', path: '/', secure: cn.startsWith('__'), httpOnly: true, sameSite: 'Lax' }]);
  await a.goto(B + '/admin/#orders', { waitUntil: 'load' }); await a.waitForSelector('#ordSeg');
  await a.click('#ordSeg [data-f="ship"]');
  ok('the "to ship" filter lists the Danish order', /dk@example.com/.test(await a.textContent('#ordL')));
  await a.goto(B + '/admin/#settings', { waitUntil: 'load' }); await a.waitForSelector('#shF');
  ok('settings show the shipping fees', (await a.inputValue('#shF [name=AE_fee]')) === '15');
  ok('no page errors', !errs.length, errs.join('|')); await b.close();
  console.log(bad ? `${bad} failed` : 'all passed'); process.exit(bad ? 1 : 0);
})();
