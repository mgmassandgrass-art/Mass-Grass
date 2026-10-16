// Shared helpers.
export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers } });
export const fail = (code, status = 400, extra = {}) => json({ error: code, ...extra }, status);

export async function readJson(req) {
  if (!(req.headers.get('content-type') || '').includes('application/json')) return null;
  try { return await req.json(); } catch { return null; }
}

export const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n);
