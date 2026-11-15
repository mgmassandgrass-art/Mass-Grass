// Shared helpers.
export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers } });
export const fail = (code, status = 400, extra = {}) => json({ error: code, ...extra }, status);

export async function readJson(req) {
  if (!(req.headers.get('content-type') || '').includes('application/json')) return null;
  try { return await req.json(); } catch { return null; }
}

export const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n);

// The calendars on sale: bag line key -> [English name, Arabic name, file key]. The 2027 calendar keeps its old file key.
export const CALS = {
  'calendar-2027': ['Things kept in bottles, 2027', 'أشياء نحفظها في قوارير، 2027', 'current'],
  'palestine-2027': ['Palestine, a journey through time and space, 2027', 'فلسطين، رحلة عبر الزمان والمكان، 2027', 'palestine-2027'],
};
export const calFile = (k) => (CALS[k] || CALS['calendar-2027'])[2];
