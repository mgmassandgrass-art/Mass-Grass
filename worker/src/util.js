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
// The book: one piece, one PDF, priced by prices.book; its id is also its file key. The admin's Book panel stores its
// manifest (titles, credit, pages, preview pictures) in settings 'book'; web/assets/book/book.json is the static fallback.
export const BOOK_ID = 'zero-waste';
export const BOOKS = {
  [BOOK_ID]: ['Zero Waste & Our Palestinian Ancestors', 'صفر نفايات وأجدادنا الفلسطينيون'],
};
// Every kind a product file can belong to, and the file key of one bag line ([kind, product id] pairs).
export const FILE_KINDS = ['painting', 'postcard', 'sticker', 'design', 'calendar', 'book'];
export const fileKeys = (it) => (it.kind === 'pack' ? (it.pack || []).map((k) => ['sticker', k]) : it.kind === 'calendar' ? [['calendar', calFile(it.k)]] : [[it.kind, it.k]]);

// What a file really is, read from its first bytes (the browser's content-type is only a claim): pdf, png, jpeg, webp or zip.
export function sniff(buf) {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf), s = (i, n) => String.fromCharCode(...b.subarray(i, i + n));
  if (b.length < 12) return null;
  if (s(0, 5) === '%PDF-') return 'application/pdf';
  if (b[0] === 0x89 && s(1, 3) === 'PNG') return 'image/png';
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (s(0, 4) === 'RIFF' && s(8, 4) === 'WEBP') return 'image/webp';
  if (b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04) return 'application/zip';
  return null;
}

// D1 gives a BLOB back as a plain array of numbers; a Response needs bytes, or it sends the numbers as text.
export const bytes = (d) => (d instanceof ArrayBuffer || ArrayBuffer.isView(d) ? d : new Uint8Array(d));
