// Catalog, orders, PayPal and the admin API.
import { json, fail, readJson, clean } from './util.js';

const KINDS = ['painting', 'postcard', 'sticker'];
const ORDER_KINDS = [...KINDS, 'calendar', 'pack'];

export async function getSetting(env, k, d) {
  const r = await env.DB.prepare('SELECT v FROM settings WHERE k=?').bind(k).first();
  try { return r ? JSON.parse(r.v) : d; } catch { return d; }
}

const pub = (p) => ({
  id: p.id, kind: p.kind, title_en: p.title_en, title_ar: p.title_ar, place_en: p.place_en, place_ar: p.place_ar,
  story_en: p.story_en, story_ar: p.story_ar, price: p.price_cents == null ? null : p.price_cents / 100,
  sale: p.sale, is_new: !!p.is_new, sold: p.sold, big: !!p.big, extra: JSON.parse(p.extra || '{}'),
});

// Small per-isolate cache so every page view does not hit D1.
let cache = null, cacheAt = 0;
export function dropCache() { cache = null; }
export async function catalog(env) {
  if (cache && Date.now() - cacheAt < 30e3) return cache;
  const { results } = await env.DB.prepare('SELECT * FROM products WHERE hidden=0 ORDER BY kind, sort, title_en').all();
  cache = { products: results.map(pub), prices: await getSetting(env, 'prices', {}), rates: await getSetting(env, 'rates', {}), links: await getSetting(env, 'links', {}) };
  cacheAt = Date.now();
  return cache;
}

// Price of one bag line in euro cents, computed only from server data.
function linePrice(cat, it) {
  const kind = it.pack ? 'pack' : it.kind;
  if (!ORDER_KINDS.includes(kind)) return null;
  const base = cat.prices[kind];
  if (kind === 'pack' || kind === 'calendar') return base > 0 ? Math.round(base * 100) : null;
  const p = cat.products.find((x) => x.id === it.k && x.kind === kind);
  if (!p) return null;
  const eur = p.price ?? base;
  if (!(eur > 0)) return null;
  return Math.round(eur * 100 * (100 - (p.sale || 0)) / 100);
}

// ---------- PayPal (Orders v2, redirect flow: no PayPal script on our pages) ----------
const ppBase = (env) => (env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com');
async function ppToken(env) {
  const r = await fetch(`${ppBase(env)}/v1/oauth2/token`, {
    method: 'POST', body: 'grant_type=client_credentials',
    headers: { authorization: 'Basic ' + btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_SECRET}`), 'content-type': 'application/x-www-form-urlencoded' },
  });
  if (!r.ok) throw new Error('paypal auth ' + r.status);
  return (await r.json()).access_token;
}
async function pp(env, path, body) {
  const r = await fetch(`${ppBase(env)}${path}`, {
    method: 'POST', body: body ? JSON.stringify(body) : undefined,
    headers: { authorization: `Bearer ${await ppToken(env)}`, 'content-type': 'application/json' },
  });
  return { ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) };
}

export async function createOrder(env, req, user) {
  const b = await readJson(req);
  if (!b || !Array.isArray(b.items) || !b.items.length || b.items.length > 50) return fail('bad_request');
  const email = clean(b.email, 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail('email_invalid');
  const cat = await catalog(env);
  const items = [];
  let total = 0;
  for (const it of b.items) {
    const c = linePrice(cat, it || {});
    if (c == null) return fail('item_unavailable', 400, { k: it && it.k });
    total += c;
    items.push({ k: clean(it.k, 40), kind: it.pack ? 'pack' : clean(it.kind, 20), t: clean(it.t, 80), ta: clean(it.ta, 80), pack: Array.isArray(it.pack) ? it.pack.slice(0, 6).map((x) => clean(x, 40)) : undefined,
      gift: it.gift ? { to: clean(it.gift.to, 60), em: clean(it.gift.em, 120), m: clean(it.gift.m, 500) } : undefined, cents: c });
  }
  const id = 'MG-' + crypto.randomUUID().slice(0, 8).toUpperCase();
  await env.DB.prepare('INSERT INTO orders(id,user_id,email,name,items,total_cents,news,created_at) VALUES(?,?,?,?,?,?,?,?)')
    .bind(id, user ? user.id : null, email, clean(b.name, 60), JSON.stringify(items), total, b.news ? 1 : 0, Date.now()).run();
  if (b.news) await env.DB.prepare('INSERT OR IGNORE INTO subscribers(email,source,created_at) VALUES(?,?,?)').bind(email, 'checkout', Date.now()).run();
  if (!env.PAYPAL_CLIENT_ID) return json({ id, total: total / 100, payments: 'off' }, 201);
  const r = await pp(env, '/v2/checkout/orders', {
    intent: 'CAPTURE',
    purchase_units: [{ reference_id: id, custom_id: id, description: 'Mass & Grass digital files', amount: { currency_code: 'EUR', value: (total / 100).toFixed(2) } }],
    payment_source: { paypal: { experience_context: { brand_name: 'Mass & Grass', shipping_preference: 'NO_SHIPPING', user_action: 'PAY_NOW',
      return_url: `${env.SITE_ORIGIN}/checkout.html?order=${id}`, cancel_url: `${env.SITE_ORIGIN}/checkout.html?cancelled=${id}` } } },
  });
  if (!r.ok) { console.error('paypal create', r.status, JSON.stringify(r.data)); return fail('payment_error', 502); }
  await env.DB.prepare('UPDATE orders SET paypal_id=? WHERE id=?').bind(r.data.id, id).run();
  const approve = (r.data.links || []).find((l) => l.rel === 'payer-action' || l.rel === 'approve');
  return json({ id, total: total / 100, approve: approve && approve.href }, 201);
}

const orderOut = (o) => ({ id: o.id, email: o.email, name: o.name, items: JSON.parse(o.items), total: o.total_cents / 100, currency: o.currency, status: o.status, date: new Date(o.created_at).toISOString() });

export async function captureOrder(env, id) {
  const o = await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(id).first();
  if (!o) return fail('not_found', 404);
  if (o.status === 'paid') return json({ order: orderOut(o) });
  if (!o.paypal_id || !env.PAYPAL_CLIENT_ID) return fail('not_paid', 402);
  const r = await pp(env, `/v2/checkout/orders/${o.paypal_id}/capture`);
  const done = r.ok && r.data.status === 'COMPLETED' || r.data?.details?.[0]?.issue === 'ORDER_ALREADY_CAPTURED';
  if (!done) return fail('not_paid', 402);
  const amt = r.data?.purchase_units?.[0]?.payments?.captures?.[0]?.amount;
  if (amt && Math.round(parseFloat(amt.value) * 100) !== o.total_cents) { console.error('amount mismatch', id); return fail('amount_mismatch', 409); }
  await markPaid(env, o);
  return json({ order: orderOut({ ...o, status: 'paid' }) });
}

async function markPaid(env, o) {
  const items = JSON.parse(o.items);
  await env.DB.batch([
    env.DB.prepare("UPDATE orders SET status='paid', paid_at=? WHERE id=? AND status<>'paid'").bind(Date.now(), o.id),
    ...items.filter((x) => KINDS.includes(x.kind)).map((x) => env.DB.prepare('UPDATE products SET sold=sold+1 WHERE id=? AND kind=?').bind(x.k, x.kind)),
  ]);
  dropCache();
}

export async function myOrders(env, u) {
  const { results } = await env.DB.prepare("SELECT * FROM orders WHERE (user_id=? OR email=?) AND status='paid' ORDER BY created_at DESC LIMIT 200").bind(u.id, u.email).all();
  return json({ orders: results.map(orderOut) });
}

// ---------- images (uploaded from the admin, kept in D1, served at /assets/<key>.webp) ----------
export async function serveImage(env, key) {
  const r = await env.DB.prepare('SELECT type, data FROM images WHERE key=?').bind(key).first();
  if (!r) return null;
  return new Response(r.data, { headers: { 'content-type': r.type, 'cache-control': 'public, max-age=31536000, immutable' } });
}

// ---------- admin ----------
const P_FIELDS = ['title_en', 'title_ar', 'place_en', 'place_ar', 'story_en', 'story_ar'];
export async function admin(env, req, url, p) {
  const m = req.method;
  if (p === '/api/admin/stats') {
    const one = (s) => env.DB.prepare(s).first();
    const [u, o, rev, pr] = await Promise.all([one('SELECT count(*) n FROM users'), one("SELECT count(*) n FROM orders WHERE status='paid'"),
      one("SELECT coalesce(sum(total_cents),0) n FROM orders WHERE status='paid'"), one('SELECT count(*) n FROM products')]);
    return json({ users: u.n, orders: o.n, revenue: rev.n / 100, products: pr.n });
  }
  if (p === '/api/admin/products' && m === 'GET') {
    const { results } = await env.DB.prepare('SELECT * FROM products ORDER BY kind, sort, title_en').all();
    return json({ products: results.map((r) => ({ ...pub(r), hidden: !!r.hidden, sort: r.sort })) });
  }
  if (p === '/api/admin/products' && (m === 'POST' || m === 'PUT')) {
    const b = await readJson(req);
    if (!b || !KINDS.includes(b.kind)) return fail('bad_kind');
    const id = m === 'POST' ? (clean(b.id, 40) || 'u-' + crypto.randomUUID().slice(0, 8)) : clean(b.id, 40);
    if (!/^[a-z0-9-]{2,40}$/.test(id)) return fail('bad_id');
    const v = Object.fromEntries(P_FIELDS.map((f) => [f, clean(b[f], f.startsWith('story') ? 2000 : 80)]));
    if (!v.title_en) return fail('title_required');
    const price = b.price === '' || b.price == null ? null : Math.round(Number(b.price) * 100);
    if (price != null && !(price >= 0 && price < 1e6)) return fail('bad_price');
    const sale = Math.max(0, Math.min(90, parseInt(b.sale) || 0));
    const extra = JSON.stringify(typeof b.extra === 'object' && b.extra ? b.extra : {});
    if (m === 'POST') {
      if (await env.DB.prepare('SELECT 1 FROM products WHERE id=? AND kind=?').bind(id, b.kind).first()) return fail('exists', 409);
      const s = await env.DB.prepare('SELECT coalesce(min(sort),0)-1 s FROM products WHERE kind=?').bind(b.kind).first();
      await env.DB.prepare(`INSERT INTO products(id,kind,${P_FIELDS},price_cents,sale,is_new,hidden,sort,big,extra,updated_at) VALUES(?,?,${P_FIELDS.map(() => '?')},?,?,?,?,?,?,?,?)`)
        .bind(id, b.kind, ...P_FIELDS.map((f) => v[f]), price, sale, b.is_new ? 1 : 0, b.hidden ? 1 : 0, s.s, b.big ? 1 : 0, extra, Date.now()).run();
    } else {
      const r = await env.DB.prepare(`UPDATE products SET ${P_FIELDS.map((f) => f + '=?')},price_cents=?,sale=?,is_new=?,hidden=?,sort=?,extra=?,updated_at=? WHERE id=? AND kind=?`)
        .bind(...P_FIELDS.map((f) => v[f]), price, sale, b.is_new ? 1 : 0, b.hidden ? 1 : 0, parseInt(b.sort) || 0, extra, Date.now(), id, b.kind).run();
      if (!r.meta.changes) return fail('not_found', 404);
    }
    dropCache();
    return json({ ok: true, id });
  }
  if (p === '/api/admin/products' && m === 'DELETE') {
    const id = url.searchParams.get('id'), kind = url.searchParams.get('kind');
    await env.DB.prepare('DELETE FROM products WHERE id=? AND kind=?').bind(id, kind).run();
    const left = await env.DB.prepare('SELECT 1 FROM products WHERE id=?').bind(id).first();
    if (!left && id.startsWith('u-')) await env.DB.prepare('DELETE FROM images WHERE key=?').bind(id).run();
    dropCache();
    return json({ ok: true });
  }
  if (p === '/api/admin/image' && m === 'POST') {
    const type = req.headers.get('content-type') || '';
    if (!/^image\/(webp|jpeg|png)$/.test(type)) return fail('bad_type');
    const data = await req.arrayBuffer();
    if (data.byteLength > 1.8e6) return fail('too_big', 413);
    const key = clean(url.searchParams.get('key'), 40) || 'u-' + crypto.randomUUID().slice(0, 8);
    if (!/^u-[a-z0-9-]{2,37}$/.test(key)) return fail('bad_id');
    await env.DB.prepare('INSERT INTO images(key,type,data,created_at,name) VALUES(?,?,?,?,?) ON CONFLICT(key) DO UPDATE SET type=excluded.type, data=excluded.data')
      .bind(key, type, data, Date.now(), clean(url.searchParams.get('name'), 120)).run();
    return json({ key });
  }
  if (p === '/api/admin/images' && m === 'GET') {
    const { results } = await env.DB.prepare('SELECT key, name, note, created_at, length(data) size FROM images ORDER BY created_at DESC LIMIT 1000').all();
    const { results: used } = await env.DB.prepare("SELECT id, kind, title_ar FROM products WHERE id LIKE 'u-%'").all();
    return json({ images: results.map((r) => ({ ...r, url: `/assets/${r.key}.webp`, used: used.filter((x) => x.id === r.key).map((x) => x.title_ar || x.kind) })) });
  }
  if (p === '/api/admin/image' && m === 'DELETE') {
    const key = clean(url.searchParams.get('key'), 40);
    if (await env.DB.prepare('SELECT 1 FROM products WHERE id=?').bind(key).first()) return fail('in_use', 409);
    await env.DB.prepare('DELETE FROM images WHERE key=?').bind(key).run();
    return json({ ok: true });
  }
  if (p === '/api/admin/settings' && m === 'GET') {
    return json({ prices: await getSetting(env, 'prices', {}), rates: await getSetting(env, 'rates', {}), links: await getSetting(env, 'links', {}) });
  }
  if (p === '/api/admin/settings' && m === 'PUT') {
    const b = await readJson(req);
    if (!b) return fail('bad_request');
    const num = (o) => Object.fromEntries(Object.entries(o || {}).filter(([k, v]) => /^[a-zA-Z]{2,15}$/.test(k) && Number(v) >= 0).map(([k, v]) => [k, Number(v)]));
    const str = (o) => Object.fromEntries(Object.entries(o || {}).filter(([k]) => /^[a-z]{2,15}$/.test(k)).map(([k, v]) => [k, clean(v, 200)]));
    const ups = [];
    if (b.prices) ups.push(['prices', num(b.prices)]);
    if (b.rates) ups.push(['rates', num(b.rates)]);
    if (b.links) ups.push(['links', str(b.links)]);
    await env.DB.batch(ups.map(([k, v]) => env.DB.prepare('INSERT OR REPLACE INTO settings(k,v) VALUES(?,?)').bind(k, JSON.stringify(v))));
    dropCache();
    return json({ ok: true });
  }
  if (p === '/api/admin/customers' && m === 'GET') {
    const { results } = await env.DB.prepare(
      "SELECT u.id,u.email,u.name,u.role,u.created_at,u.google_sub IS NOT NULL g,(SELECT count(*) FROM orders o WHERE (o.user_id=u.id OR o.email=u.email) AND o.status='paid') orders,(SELECT coalesce(sum(total_cents),0) FROM orders o WHERE (o.user_id=u.id OR o.email=u.email) AND o.status='paid') spent FROM users u ORDER BY u.created_at DESC LIMIT 1000").all();
    return json({ customers: results.map((c) => ({ ...c, spent: c.spent / 100, via: c.g ? 'google' : 'email', joined: new Date(c.created_at).toISOString() })) });
  }
  if (p === '/api/admin/customers' && m === 'DELETE') {
    const id = url.searchParams.get('id');
    const u = await env.DB.prepare('SELECT role FROM users WHERE id=?').bind(id).first();
    if (!u) return fail('not_found', 404);
    if (u.role === 'admin') return fail('cannot_delete_admin', 400);
    await env.DB.prepare('DELETE FROM users WHERE id=?').bind(id).run();
    return json({ ok: true });
  }
  if (p === '/api/admin/subscribers' && m === 'GET') {
    const { results } = await env.DB.prepare('SELECT email, source, created_at FROM subscribers ORDER BY created_at DESC LIMIT 5000').all();
    return json({ subscribers: results.map((r) => ({ ...r, date: new Date(r.created_at).toISOString() })) });
  }
  if (p === '/api/admin/subscribers' && m === 'DELETE') {
    await env.DB.prepare('DELETE FROM subscribers WHERE email=?').bind(clean(url.searchParams.get('email'), 120)).run();
    return json({ ok: true });
  }
  if (p === '/api/admin/orders' && m === 'GET') {
    const { results } = await env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 1000').all();
    return json({ orders: results.map(orderOut) });
  }
  if (p === '/api/admin/orders' && m === 'PUT') {
    const b = await readJson(req);
    if (!b || !['paid', 'cancelled', 'refunded', 'pending'].includes(b.status)) return fail('bad_status');
    const o = await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(clean(b.id, 20)).first();
    if (!o) return fail('not_found', 404);
    if (b.status === 'paid') await markPaid(env, o);
    else await env.DB.prepare('UPDATE orders SET status=? WHERE id=?').bind(b.status, o.id).run();
    return json({ ok: true });
  }
  return fail('not_found', 404);
}
