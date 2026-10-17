// Files sold with each product: uploaded from the admin, kept in D1 in chunks, downloaded by buyers through order-bound links.
import { json, fail, clean } from './util.js';

const MAX = 45 * 1024 * 1024; // stays inside the free plan's 50 database queries per request
const CHUNK = 1.5 * 1024 * 1024; // D1 keeps up to 2 MB per value
const OK_TYPE = /^(application\/pdf|image\/(png|jpeg|webp)|application\/zip|application\/x-zip-compressed|application\/octet-stream)$/;
const KINDS = ['painting', 'postcard', 'sticker', 'calendar'];
const safeName = (s) => clean(s, 120).replace(/[^\w.\- ()؀-ۿ]/g, '_') || 'file';

// Which product files belong to each line of an order.
function wanted(items) {
  const keys = [];
  for (const it of items) {
    if (it.kind === 'pack') for (const k of it.pack || []) keys.push(['sticker', k]);
    else if (it.kind === 'calendar') keys.push(['calendar', 'current']);
    else if (KINDS.includes(it.kind)) keys.push([it.kind, it.k]);
  }
  return keys;
}

export async function orderFiles(env, o) {
  if (o.status !== 'paid') return [];
  const keys = wanted(typeof o.items === 'string' ? JSON.parse(o.items) : o.items);
  if (!keys.length) return [];
  const where = keys.map(() => '(kind=? AND product_id=?)').join(' OR ');
  const { results } = await env.DB.prepare(`SELECT id, kind, product_id, name, size FROM product_files WHERE ${where} ORDER BY kind, product_id, name`).bind(...keys.flat()).all();
  return results.map((f) => ({ ...f, url: `/api/dl/${f.id}?o=${encodeURIComponent(o.id)}&a=${o.access}` }));
}

// GET /api/dl/<file>?o=<order>&a=<order secret>
export async function download(env, fileId, url) {
  const o = await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(clean(url.searchParams.get('o'), 20)).first();
  if (!o || !o.access || o.access !== url.searchParams.get('a') || o.status !== 'paid') return fail('not_found', 404);
  const f = (await orderFiles(env, o)).find((x) => x.id === fileId);
  if (!f) return fail('not_found', 404);
  const row = await env.DB.prepare('SELECT type, size, chunks FROM product_files WHERE id=?').bind(fileId).first();
  let i = 0;
  const body = new ReadableStream({
    async pull(c) {
      if (i >= row.chunks) return c.close();
      const ch = await env.DB.prepare('SELECT data FROM file_chunks WHERE file_id=? AND idx=?').bind(fileId, i++).first();
      if (!ch) return c.error(new Error('missing chunk'));
      c.enqueue(new Uint8Array(ch.data));
    },
  });
  return new Response(body, { headers: {
    'content-type': row.type, 'content-length': String(row.size), 'cache-control': 'private, no-store',
    'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(f.name)}`,
  } });
}

export async function filesAdmin(env, req, url, p) {
  if (p !== '/api/admin/files') return null;
  const m = req.method;
  if (m === 'GET') {
    const kind = url.searchParams.get('kind'), pid = url.searchParams.get('pid');
    const q = kind ? env.DB.prepare('SELECT id, kind, product_id, name, size, created_at FROM product_files WHERE kind=? AND product_id=? ORDER BY name').bind(kind, pid)
      : env.DB.prepare('SELECT kind, product_id, count(*) n, sum(size) size FROM product_files GROUP BY kind, product_id');
    return json({ files: (await q.all()).results });
  }
  if (m === 'POST') {
    const kind = url.searchParams.get('kind'), pid = clean(url.searchParams.get('pid'), 40), name = safeName(url.searchParams.get('name'));
    const type = (req.headers.get('content-type') || 'application/octet-stream').split(';')[0];
    if (!KINDS.includes(kind) || !/^[a-z0-9-]{2,40}$/.test(pid)) return fail('bad_request');
    if (!OK_TYPE.test(type)) return fail('bad_type');
    if ((+req.headers.get('content-length') || 0) > MAX) return fail('too_big', 413);
    const buf = new Uint8Array(await req.arrayBuffer());
    if (!buf.length) return fail('empty');
    if (buf.length > MAX) return fail('too_big', 413);
    const id = crypto.randomUUID().replace(/-/g, '').slice(0, 20), n = Math.ceil(buf.length / CHUNK);
    for (let i = 0; i < n; i++) await env.DB.prepare('INSERT INTO file_chunks(file_id,idx,data) VALUES(?,?,?)').bind(id, i, buf.subarray(i * CHUNK, (i + 1) * CHUNK)).run();
    await env.DB.prepare('INSERT INTO product_files(id,kind,product_id,name,size,type,chunks,created_at) VALUES(?,?,?,?,?,?,?,?)')
      .bind(id, kind, pid, name, buf.length, type, n, Date.now()).run();
    return json({ ok: true, id });
  }
  if (m === 'DELETE') {
    const id = clean(url.searchParams.get('id'), 30);
    await env.DB.batch([env.DB.prepare('DELETE FROM file_chunks WHERE file_id=?').bind(id), env.DB.prepare('DELETE FROM product_files WHERE id=?').bind(id)]);
    return json({ ok: true });
  }
  return fail('not_found', 404);
}
