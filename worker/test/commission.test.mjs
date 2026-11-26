// More designs, the book and "Request a design", against the local Worker (sh test/local.sh). Run: node test/commission.test.mjs
// Uses its own addresses (cf-connecting-ip 10.8.8.x) so the per-address limits stay for the other tests.
const B = 'http://localhost:8787', PW = process.env.LOCAL_ADMIN_PW || 'local-admin-only-1';
let bad = 0; const ok = (n, c, x) => { console.log(c ? 'ok  ' : 'FAIL', n, c ? '' : x ?? ''); if (!c) bad++; };
let jar = '';
const req = (m, p, { body, type = 'application/json', ip = '10.8.8.1', cookie = jar, origin = B } = {}) => fetch(B + p, { method: m, redirect: 'manual',
  headers: { ...(type && !(body instanceof FormData) ? { 'content-type': type } : {}), ...(origin ? { origin } : {}), 'cf-connecting-ip': ip, ...(cookie ? { cookie } : {}) },
  body: body == null ? undefined : body instanceof FormData || body instanceof Uint8Array ? body : JSON.stringify(body) });
const js = async (r) => { try { return await r.json(); } catch { return null; } };
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1]);
const webp = new Uint8Array([...new TextEncoder().encode('RIFF'), 30, 0, 0, 0, ...new TextEncoder().encode('WEBPVP8 '), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const form = (o, file) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) f.append(k, v); if (file) f.append('ref', new Blob([file.bytes], { type: file.type }), file.name); return f; };
const good = { what: 'portrait', size: 'A3 for a wall', body: 'A portrait of my grandmother in her garden, please.', budget: '150-400', deadline: '2027-03-01', name: 'Test Person', email: 'req@example.com', phone: '+45 12 34 56 78', lang: 'en' };

// ---------- the public request ----------
{ ok('a request from another site is refused', (await req('POST', '/api/commission', { body: form(good), origin: 'https://evil.example' })).status === 403);
  const r = await req('POST', '/api/commission', { body: form(good), ip: '10.8.8.2' }); const j = await js(r);
  ok('a request is saved', r.status === 201 && j.ok && j.id > 0, `${r.status} ${JSON.stringify(j)}`);
  const pic = await req('POST', '/api/commission', { body: form({ ...good, email: 'req2@example.com' }, { bytes: png, type: 'image/png', name: 'ref.png' }), ip: '10.8.8.2' });
  ok('with a real picture', pic.status === 201, pic.status);
  const fake = await req('POST', '/api/commission', { body: form({ ...good, email: 'req3@example.com' }, { bytes: new TextEncoder().encode('<svg onload=alert(1)></svg>................'), type: 'image/png', name: 'x.png' }), ip: '10.8.8.3' });
  ok('a fake picture is refused by its bytes', fake.status === 400 && (await js(fake)).error === 'bad_type', fake.status);
  const pdf = await req('POST', '/api/commission', { body: form({ ...good, email: 'req4@example.com' }, { bytes: new TextEncoder().encode('%PDF-1.4 not a picture'), type: 'image/png', name: 'x.png' }), ip: '10.8.8.3' });
  ok('a PDF is not a picture', pdf.status === 400, pdf.status);
  const big = await req('POST', '/api/commission', { body: form({ ...good, email: 'req5@example.com' }, { bytes: new Uint8Array(2.1e6).fill(1).map((x, i) => (i < png.length ? png[i] : x)), type: 'image/png', name: 'big.png' }), ip: '10.8.8.3' });
  ok('a picture over 2 MB is refused', big.status === 413, big.status);
  const bads = [[{ what: 'tattoo' }, 'bad_what'], [{ email: 'nope' }, 'email_invalid'], [{ body: 'hi' }, 'message_short'], [{ name: '' }, 'name_required'], [{ phone: 'call me' }, 'phone_invalid']];
  for (const [o, e] of bads) { const x = await req('POST', '/api/commission', { body: form({ ...good, ...o }), ip: '10.8.8.4' }); ok('refused: ' + e, x.status === 400 && (await js(x)).error === e, x.status); }
  ok('JSON is not taken', (await req('POST', '/api/commission', { body: good, ip: '10.8.8.6' })).status === 400);
  let last = 0; for (let i = 0; i < 6; i++) last = (await req('POST', '/api/commission', { body: form({ ...good, email: `r${i}@example.com` }), ip: '10.8.8.5' })).status;
  ok('six requests an hour from one address: the sixth is refused', last === 429, last);
  ok('a visitor cannot list requests', (await req('GET', '/api/admin/commissions', { cookie: '' })).status === 404); }

// ---------- the admin ----------
{ const l = await req('POST', '/api/login', { body: { email: 'info@massandgrass.com', password: PW }, ip: '10.8.8.7' });
  jar = (l.headers.get('set-cookie') || '').split(';')[0]; ok('admin signs in', l.status === 200, l.status);
  const L = (await js(await req('GET', '/api/admin/commissions'))).requests;
  const mine = L.find((x) => x.email === 'req2@example.com');
  ok('requests are listed, newest first, as new', L.length >= 2 && mine && mine.status === 'new' && mine.what === 'portrait' && mine.budget === '150-400');
  ok('the list carries no picture bytes', mine && !('ref_type' in mine) && /^\/api\/admin\/commissions\/ref\?id=\d+$/.test(mine.ref));
  const g = await req('GET', mine.ref); ok('the picture is served to the admin, private', g.status === 200 && g.headers.get('content-type') === 'image/png' && /private/.test(g.headers.get('cache-control')));
  ok('as the same bytes', (await g.arrayBuffer()).byteLength === png.length);
  ok('marked answered', (await req('PUT', '/api/admin/commissions', { body: { id: mine.id, status: 'answered' } })).status === 200);
  ok('a made-up status is refused', (await req('PUT', '/api/admin/commissions', { body: { id: mine.id, status: 'paid' } })).status === 400);
  const ov = await js(await req('GET', '/api/admin/overview'));
  ok('the overview counts open requests', typeof ov.newRequests === 'number' && ov.requests >= 2 && ov.newRequests === ov.requests - 1, JSON.stringify([ov.requests, ov.newRequests]));
  ok('deleted', (await req('DELETE', '/api/admin/commissions?id=' + mine.id)).status === 200 && !(await js(await req('GET', '/api/admin/commissions'))).requests.some((x) => x.id === mine.id)); }

// ---------- designs and the book in the shop ----------
{ const cat = await js(await req('GET', '/api/catalog'));
  ok('prices for designs and the book', cat.prices.design === 6 && cat.prices.book === 10, JSON.stringify(cat.prices));
  ok('no book manifest yet: the site uses its placeholders', cat.book === null);
  let o = await js(await req('POST', '/api/orders', { body: { email: 'b@example.com', items: [{ k: 'zero-waste', kind: 'book', t: 'cheap', ta: 'x' }] }, cookie: '', ip: '10.8.8.8' }));
  ok('the book is sold at the server’s price, under its own name', o && o.total === 10, JSON.stringify(o));
  o = await req('POST', '/api/orders', { body: { email: 'b@example.com', items: [{ k: 'another-book', kind: 'book' }] }, cookie: '', ip: '10.8.8.8' });
  ok('an unknown book is refused', o.status === 400);
  // a design: the admin adds one (an uploaded picture is its id), then it is on sale at the design price
  const up = await js(await req('POST', '/api/admin/image?key=u-dsgn-test&name=t', { body: webp, type: 'image/webp' }));
  ok('design picture uploaded', up && up.key === 'u-dsgn-test', JSON.stringify(up));
  const add = await req('POST', '/api/admin/products', { body: { id: 'u-dsgn-test', kind: 'design', title_en: 'A test design', title_ar: 'تصميم تجريبي', price: '' } });
  ok('the admin adds a design', add.status === 200, add.status);
  o = await js(await req('POST', '/api/orders', { body: { email: 'd@example.com', items: [{ k: 'u-dsgn-test', kind: 'design' }] }, cookie: '', ip: '10.8.8.8' }));
  ok('a design costs the design price', o && o.total === 6, JSON.stringify(o));
  ok('a design file uploads', (await req('POST', '/api/admin/files?kind=design&pid=u-dsgn-test&name=d.pdf', { body: new TextEncoder().encode('%PDF-1.4 design\n'), type: 'application/pdf' })).status === 200);
  ok('the book file uploads', (await req('POST', '/api/admin/files?kind=book&pid=zero-waste&name=book.pdf', { body: new TextEncoder().encode('%PDF-1.4 the book\n'), type: 'application/pdf' })).status === 200);
  // paid by hand: the buyer's files are the book's
  const ord = await js(await req('POST', '/api/orders', { body: { email: 'b2@example.com', items: [{ k: 'zero-waste', kind: 'book' }, { k: 'u-dsgn-test', kind: 'design' }] }, cookie: '', ip: '10.8.8.8' }));
  ok('book + design: 16', ord && ord.total === 16, JSON.stringify(ord));
  ok('marked paid', (await req('PUT', '/api/admin/orders', { body: { id: ord.id, status: 'paid' } })).status === 200);
  const full = await js(await req('GET', '/api/admin/order?id=' + ord.id));
  const files = full && full.order && full.order.files;
  ok('the paid order delivers the book and the design', Array.isArray(files) && files.some((f) => f.kind === 'book') && files.some((f) => f.kind === 'design'), JSON.stringify(full).slice(0, 300));
  // the book's manifest from the admin's Book panel
  ok('a manifest with outside pictures is refused', (await req('PUT', '/api/admin/book', { body: { imgs: ['https://evil.example/x.webp'], pages: 112 } })).status === 400);
  ok('a manifest with fewer pages than pictures is refused', (await req('PUT', '/api/admin/book', { body: { imgs: ['assets/u-book-pg-01.webp', 'assets/u-book-pg-02.webp'], pages: 1 } })).status === 400);
  const put = await req('PUT', '/api/admin/book', { body: { title_en: 'Zero Waste & Our Palestinian Ancestors', title_ar: 'صفر نفايات', credit_en: 'Text: Najla Abdellatif, drawings: Farah Al-Helou', credit_ar: 'النص: نجلاء', pages: 112, ratio: 0.71, dir: 'ltr', imgs: ['assets/u-book-pg-01.webp?v=1', 'assets/u-book-pg-02.webp?v=1'] } });
  ok('the manifest is saved', put.status === 200, put.status);
  await new Promise((r) => setTimeout(r, 50));
  const html = await (await req('GET', '/shop/more-designs', { cookie: '' })).text();
  ok('pages carry the book from the server', /"book":\{"id":"zero-waste".*"pages":112.*u-book-pg-01/.test(html));
  ok('the designs page is served', /More designs/.test(html));
  ok('the book page is served', (await req('GET', '/shop/more-designs/zero-waste-and-our-palestinian-ancestors', { cookie: '' })).status === 200);
  ok('the request page is served', (await req('GET', '/request-a-design', { cookie: '' })).status === 200);
  // tidy: the shared local database goes back to no manifest, and the test design leaves the shop
  ok('the only design can be deleted (the designs page is fine empty)', (await req('DELETE', '/api/admin/products?id=u-dsgn-test&kind=design')).status === 200);
  ok('the manifest can be taken down (back to the placeholders)', (await req('DELETE', '/api/admin/book')).status === 200 && (await js(await req('GET', '/api/catalog'))).book === null);
}
console.log(bad ? `${bad} failed` : 'all passed');
process.exit(bad ? 1 : 0);
