// "Request a design": someone asks Farah for a painting, a portrait or a design of their own.
// POST /api/commission (multipart form: the fields, and an optional reference picture checked by its bytes, under 2 MB),
// saved in the commissions table, e-mailed to the owner, and listed in the admin (Requests) as new or answered.
import { json, fail, clean, sniff, bytes } from './util.js';
import { limitKey, ipOf } from './security.js';
import { commissionEmail } from './mail.js';

export const WHAT = ['painting', 'portrait', 'design', 'other'];
export const BUDGETS = ['under-50', '50-150', '150-400', 'over-400', 'unsure'];
const REF_MAX = 1950000; // D1 keeps up to 2,000,000 bytes in one value; the page shrinks bigger pictures first
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const out = (c) => ({ id: c.id, what: c.what, size: c.size, body: c.body, budget: c.budget, deadline: c.deadline, name: c.name, email: c.email,
  phone: c.phone, lang: c.lang, ref: c.ref_type ? `/api/admin/commissions/ref?id=${c.id}` : null, status: c.status, mailed: !!c.mailed,
  date: new Date(c.created_at).toISOString() });

export async function commissionPost(env, req) {
  if ((+req.headers.get('content-length') || 0) > 3 * 1024 * 1024) return fail('too_big', 413);
  if (!(req.headers.get('content-type') || '').includes('multipart/form-data')) return fail('bad_request');
  if (!(await limitKey(env, 'commission:' + ipOf(req), 5, 3600))) return fail('rate_limited', 429);
  let fd; try { fd = await req.formData(); } catch { return fail('bad_request'); }
  const f = (k, n) => clean(fd.get(k), n);
  const what = f('what', 20), email = f('email', 120).toLowerCase(), name = f('name', 60), body = String(fd.get('body') || '').replace(/[\u0000-\u0008\u000b-\u001f]/g, '').trim().slice(0, 3000);
  if (!WHAT.includes(what)) return fail('bad_what');
  if (!name) return fail('name_required');
  if (!EMAIL.test(email)) return fail('email_invalid');
  if (body.length < 10) return fail('message_short');
  const phone = f('phone', 30);
  if (phone && !/^[+\d][\d\s()-]{5,}$/.test(phone)) return fail('phone_invalid');
  const budget = BUDGETS.includes(f('budget', 20)) ? f('budget', 20) : 'unsure';
  const deadline = /^\d{4}-\d{2}-\d{2}$/.test(f('deadline', 10)) ? f('deadline', 10) : '';
  let refType = null, ref = null;
  const file = fd.get('ref');
  if (file && typeof file === 'object' && file.size) {
    if (file.size > REF_MAX) return fail('too_big', 413);
    const buf = new Uint8Array(await file.arrayBuffer());
    refType = sniff(buf);
    if (!refType || !refType.startsWith('image/')) return fail('bad_type'); // a picture only: PNG, JPEG or WebP, whatever its name says
    ref = buf;
  }
  if (!(await limitKey(env, 'commissionm:' + email, 5, 86400))) return fail('rate_limited', 429);
  const lang = f('lang', 2) === 'ar' ? 'ar' : 'en';
  const ins = await env.DB.prepare('INSERT INTO commissions(what,size,body,budget,deadline,name,email,phone,lang,ref_type,ref,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
    .bind(what, f('size', 120), body, budget, deadline, name, email, phone, lang, refType, ref, Date.now()).run();
  const id = ins.meta.last_row_id;
  let mailed = false;
  try { mailed = await commissionEmail(env, { id, what, size: f('size', 120), body, budget, deadline, name, email, phone, ref: !!ref }); } catch (e) { console.error('mail', e.message); }
  if (mailed) await env.DB.prepare('UPDATE commissions SET mailed=1 WHERE id=?').bind(id).run();
  return json({ ok: true, id }, 201); // saved for the owner whether or not the e-mail went out
}

export async function commissionsAdmin(env, req, url, p) {
  if (!p.startsWith('/api/admin/commissions')) return null;
  const m = req.method;
  if (p === '/api/admin/commissions' && m === 'GET') {
    const { results } = await env.DB.prepare('SELECT id,what,size,body,budget,deadline,name,email,phone,lang,ref_type,status,mailed,created_at FROM commissions ORDER BY created_at DESC LIMIT 500').all();
    return json({ requests: results.map(out) });
  }
  if (p === '/api/admin/commissions/ref' && m === 'GET') {
    const r = await env.DB.prepare('SELECT ref_type, ref FROM commissions WHERE id=?').bind(parseInt(url.searchParams.get('id')) || 0).first();
    if (!r || !r.ref_type) return fail('not_found', 404);
    return new Response(bytes(r.ref), { headers: { 'content-type': r.ref_type, 'cache-control': 'private, no-store', 'content-disposition': 'inline' } });
  }
  if (p === '/api/admin/commissions' && m === 'PUT') {
    let b; try { b = await req.json(); } catch { b = null; }
    if (!b || !['new', 'answered'].includes(b.status)) return fail('bad_status');
    const r = await env.DB.prepare('UPDATE commissions SET status=? WHERE id=?').bind(b.status, parseInt(b.id) || 0).run();
    return r.meta.changes ? json({ ok: true }) : fail('not_found', 404);
  }
  if (p === '/api/admin/commissions' && m === 'DELETE') {
    await env.DB.prepare('DELETE FROM commissions WHERE id=?').bind(parseInt(url.searchParams.get('id')) || 0).run();
    return json({ ok: true });
  }
  return fail('not_found', 404);
}
