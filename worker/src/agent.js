// The admin agent: Claude with tools over the site's data (live) and files (drafts → publish).
import KNOW from './agent-knowledge.md';
import MANIFEST from './manifest.json';
import { json, fail, readJson, clean } from './util.js';
import { admin } from './shop.js';

const MAX_RESULT = 12000;
const cut = (s, n = MAX_RESULT) => (s.length > n ? s.slice(0, n) + `\n…[cut, ${s.length - n} more chars]` : s);

// ---------- site files: original assets, overridden by published / draft copies in D1 ----------
export const FILE_RE = /^([a-z0-9][a-z0-9-]*\.html|assets\/[a-z0-9][a-z0-9-]*\.(js|css))$/;
export const TYPES = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8' };
const normPath = (p) => String(p || '').trim().replace(/^\/+/, '').toLowerCase();

let pubCache = null, pubAt = 0;
export function dropFileCache() { pubCache = null; }
export async function publishedPaths(env) {
  if (pubCache && Date.now() - pubAt < 20e3) return pubCache;
  const { results } = await env.DB.prepare('SELECT path FROM site_files WHERE published IS NOT NULL').all();
  pubCache = new Set(results.map((r) => r.path)); pubAt = Date.now();
  return pubCache;
}

async function original(env, origin, path) {
  let r = await env.ASSETS.fetch(new Request(`${origin}/${path}`));
  for (let i = 0; i < 3 && r.status >= 300 && r.status < 400 && r.headers.get('location'); i++) r = await env.ASSETS.fetch(new Request(new URL(r.headers.get('location'), origin)));
  return r.ok ? r.text() : null;
}

// What a path holds right now; draft=true is the owner's preview.
export async function readSiteFile(env, origin, path, draft) {
  const row = await env.DB.prepare('SELECT draft, published FROM site_files WHERE path=?').bind(path).first();
  if (draft && row && row.draft != null) return row.draft;
  if (row && row.published != null) return row.published;
  return original(env, origin, path);
}

async function allPaths(env) {
  const { results } = await env.DB.prepare('SELECT path FROM site_files').all();
  return [...new Set([...MANIFEST.files.map((f) => f.path), ...results.map((r) => r.path)])].sort();
}

async function writeDraft(env, path, content) {
  await env.DB.prepare('INSERT INTO site_files(path,draft,updated_at) VALUES(?,?,?) ON CONFLICT(path) DO UPDATE SET draft=excluded.draft, updated_at=excluded.updated_at')
    .bind(path, content, Date.now()).run();
}

export async function drafts(env) {
  const { results } = await env.DB.prepare('SELECT path, updated_at FROM site_files WHERE draft IS NOT NULL ORDER BY path').all();
  return results;
}

export async function publishDrafts(env, note) {
  const { results } = await env.DB.prepare('SELECT path, draft, published FROM site_files WHERE draft IS NOT NULL').all();
  if (!results.length) return [];
  const now = Date.now();
  await env.DB.batch(results.flatMap((r) => [
    env.DB.prepare('INSERT INTO site_file_versions(path,content,note,created_at) VALUES(?,?,?,?)').bind(r.path, r.draft, clean(note, 200), now),
    env.DB.prepare('UPDATE site_files SET published=draft, draft=NULL, updated_at=? WHERE path=?').bind(now, r.path),
  ]));
  dropFileCache();
  return results.map((r) => r.path);
}

export async function discardDrafts(env, path) {
  if (path) await env.DB.prepare('UPDATE site_files SET draft=NULL WHERE path=?').bind(path).run();
  else await env.DB.prepare('UPDATE site_files SET draft=NULL').run();
  await env.DB.prepare('DELETE FROM site_files WHERE draft IS NULL AND published IS NULL').run();
}

// ---------- tools ----------
const S = (props, req = []) => ({ type: 'object', properties: props, required: req });
const str = (d) => ({ type: 'string', description: d });
const TOOLS = [
  { name: 'list_files', description: 'List the site files you can read and edit (pages and shared scripts), with size and whether they have an unpublished draft.', input_schema: S({}) },
  { name: 'search_files', description: 'Find text in the site files (case-insensitive). Returns path:line and a snippet. Use before read_file/edit_file.', input_schema: S({ query: str('text to find'), path: str('optional: only this file') }, ['query']) },
  { name: 'read_file', description: 'Read lines of a file (draft view). Long lines are shortened.', input_schema: S({ path: str('e.g. shop.html or assets/mg.js'), from_line: { type: 'integer' }, to_line: { type: 'integer' } }, ['path']) },
  { name: 'edit_file', description: 'Replace an exact piece of text in a file. The change goes into the draft (visitors do not see it until publish). old must occur exactly once unless replace_all.', input_schema: S({ path: str(''), old: str('exact text to replace'), new: str('replacement'), replace_all: { type: 'boolean' } }, ['path', 'old', 'new']) },
  { name: 'write_file', description: 'Create a new page/script or replace a whole file, as a draft. New paths: name.html, assets/name.js, assets/name.css.', input_schema: S({ path: str(''), content: str('full file content') }, ['path', 'content']) },
  { name: 'discard_draft', description: 'Throw away the unpublished draft of one file (or all files when path is empty).', input_schema: S({ path: str('file, or empty for all') }) },
  { name: 'restore_original', description: 'Put the original (as first built) content of a file into its draft, undoing every published edit once the owner publishes.', input_schema: S({ path: str('') }, ['path']) },
  { name: 'file_history', description: 'Published versions of a file (newest first).', input_schema: S({ path: str('') }, ['path']) },
  { name: 'restore_version', description: 'Put an older published version back into the draft of its file.', input_schema: S({ id: { type: 'integer' } }, ['id']) },
  { name: 'list_products', description: 'Products in the database (all, or one kind).', input_schema: S({ kind: { type: 'string', enum: ['painting', 'postcard', 'sticker'] } }) },
  { name: 'save_product', description: 'Create or update a product (live at once). For a new product give an uploaded image key (u-…) as id. Fields you leave out keep their value. price: euros, empty string = default price.', input_schema: S({
    id: str('image key / product id'), kind: { type: 'string', enum: ['painting', 'postcard', 'sticker'] }, title_en: str(''), title_ar: str(''), place_en: str(''), place_ar: str(''),
    story_en: str(''), story_ar: str(''), price: str('euros or empty'), sale: { type: 'integer', description: 'percent off 0-90' }, is_new: { type: 'boolean' }, hidden: { type: 'boolean' }, sort: { type: 'integer' },
    extra: { type: 'object', description: 'painting: {map, ratio, home}; sticker: {shape}' } }, ['id', 'kind']) },
  { name: 'delete_product', description: 'Delete a product (live at once). Only when the owner clearly asked.', input_schema: S({ id: str(''), kind: { type: 'string', enum: ['painting', 'postcard', 'sticker'] } }, ['id', 'kind']) },
  { name: 'get_settings', description: 'Default prices (euros), currency rates and contact links.', input_schema: S({}) },
  { name: 'update_settings', description: 'Change default prices, currency rates or contact links (live at once). Only send the groups you change; inside a group send the full set.', input_schema: S({ prices: { type: 'object' }, rates: { type: 'object' }, links: { type: 'object' } }) },
  { name: 'list_orders', description: 'Recent orders.', input_schema: S({ status: { type: 'string', enum: ['paid', 'pending', 'cancelled', 'refunded'] } }) },
  { name: 'set_order_status', description: 'Change an order status.', input_schema: S({ id: str('MG-…'), status: { type: 'string', enum: ['paid', 'pending', 'cancelled', 'refunded'] } }, ['id', 'status']) },
  { name: 'list_customers', description: 'Registered customers with order counts.', input_schema: S({}) },
  { name: 'list_subscribers', description: 'Newsletter subscribers.', input_schema: S({}) },
  { name: 'list_images', description: 'The image library: uploaded images (key u-…, name, note) and the site’s built-in images.', input_schema: S({}) },
  { name: 'note_image', description: 'Give a library image a name / note so it is easy to find later.', input_schema: S({ key: str('u-…'), name: str(''), note: str('') }, ['key']) },
];
TOOLS[TOOLS.length - 1].cache_control = { type: 'ephemeral' };

async function call(env, origin, method, path, body) {
  const u = new URL(origin + path);
  const r = await admin(env, new Request(u, { method, headers: { 'content-type': 'application/json', origin }, body: body ? JSON.stringify(body) : undefined }), u, u.pathname);
  return r.json();
}

async function run(env, origin, name, a) {
  const P = (x) => { const p = normPath(x); if (!FILE_RE.test(p)) throw new Error(`not an editable path: ${x}`); return p; };
  switch (name) {
    case 'list_files': {
      const d = new Set((await drafts(env)).map((r) => r.path));
      const known = Object.fromEntries(MANIFEST.files.map((f) => [f.path, f]));
      return (await allPaths(env)).map((p) => `${p}${known[p] ? ` (${known[p].bytes} bytes, ${known[p].lines} lines)` : ' (new)'}${d.has(p) ? ' [draft]' : ''}`).join('\n');
    }
    case 'search_files': {
      const q = String(a.query || '').toLowerCase();
      if (q.length < 2) throw new Error('query too short');
      const paths = a.path ? [P(a.path)] : await allPaths(env);
      const hits = [];
      for (const p of paths) {
        const s = await readSiteFile(env, origin, p, true);
        if (!s) continue;
        s.split('\n').forEach((line, i) => {
          const k = line.toLowerCase().indexOf(q);
          if (k >= 0 && hits.length < 40) hits.push(`${p}:${i + 1}: ${k > 120 ? '…' : ''}${line.slice(Math.max(0, k - 120), k + 200)}${line.length > k + 200 ? '…' : ''}`);
        });
      }
      return hits.length ? hits.join('\n') : 'no matches';
    }
    case 'read_file': {
      const p = P(a.path), s = await readSiteFile(env, origin, p, true);
      if (s == null) throw new Error('file not found');
      const L = s.split('\n'), from = Math.max(1, a.from_line || 1), to = Math.min(L.length, a.to_line || from + 120);
      return `${p} lines ${from}-${to} of ${L.length}\n` + L.slice(from - 1, to).map((l, i) => `${from + i}: ${l.length > 700 ? l.slice(0, 700) + ` …[+${l.length - 700} chars]` : l}`).join('\n');
    }
    case 'edit_file': {
      const p = P(a.path), s = await readSiteFile(env, origin, p, true);
      if (s == null) throw new Error('file not found');
      if (!a.old) throw new Error('old is empty');
      const n = s.split(a.old).length - 1;
      if (!n) throw new Error('old text not found; search_files/read_file and copy it exactly');
      if (n > 1 && !a.replace_all) throw new Error(`old text found ${n} times; add context or set replace_all`);
      await writeDraft(env, p, a.replace_all ? s.split(a.old).join(a.new) : s.replace(a.old, () => a.new));
      return `draft updated: ${p} (${n} replacement${n > 1 ? 's' : ''})`;
    }
    case 'write_file': {
      const p = P(a.path);
      if (typeof a.content !== 'string' || a.content.length > 400000) throw new Error('content missing or too big');
      if (p.endsWith('.html') && !/<html[\s>]/i.test(a.content)) throw new Error('a page must be a full HTML document');
      await writeDraft(env, p, a.content);
      return `draft written: ${p} (${a.content.length} chars)`;
    }
    case 'discard_draft': await discardDrafts(env, a.path ? P(a.path) : null); return 'draft discarded';
    case 'restore_original': {
      const p = P(a.path), s = await original(env, origin, p);
      if (s == null) throw new Error('this file has no original (it was created in the panel); discard_draft or edit it instead');
      await writeDraft(env, p, s);
      return `the original of ${p} is now its draft`;
    }
    case 'file_history': {
      const { results } = await env.DB.prepare('SELECT id, note, created_at, length(content) n FROM site_file_versions WHERE path=? ORDER BY id DESC LIMIT 20').bind(P(a.path)).all();
      return results.length ? results.map((r) => `#${r.id} ${new Date(r.created_at).toISOString()} ${r.n} chars — ${r.note}`).join('\n') : 'no published versions (the file is the original)';
    }
    case 'restore_version': {
      const v = await env.DB.prepare('SELECT path, content FROM site_file_versions WHERE id=?').bind(a.id).first();
      if (!v) throw new Error('version not found');
      await writeDraft(env, v.path, v.content);
      return `version #${a.id} is now the draft of ${v.path}`;
    }
    case 'list_products': {
      const d = await call(env, origin, 'GET', '/api/admin/products');
      return JSON.stringify(d.products.filter((p) => !a.kind || p.kind === a.kind).map((p) => ({ id: p.id, kind: p.kind, title_en: p.title_en, title_ar: p.title_ar, place_en: p.place_en, place_ar: p.place_ar, price: p.price, sale: p.sale, is_new: p.is_new, hidden: p.hidden, sort: p.sort, sold: p.sold, extra: p.extra })));
    }
    case 'save_product': {
      const d = await call(env, origin, 'GET', '/api/admin/products');
      const old = d.products.find((p) => p.id === a.id && p.kind === a.kind);
      const b = { ...(old || { title_en: '', title_ar: '', place_en: 'Gaza', place_ar: 'غزة', story_en: '', story_ar: '', price: null, sale: 0, is_new: true, hidden: false, extra: {} }), ...a };
      if (old && a.extra) b.extra = { ...old.extra, ...a.extra };
      if (b.price === null || b.price === undefined) b.price = '';
      return JSON.stringify(await call(env, origin, old ? 'PUT' : 'POST', '/api/admin/products', b));
    }
    case 'delete_product': return JSON.stringify(await call(env, origin, 'DELETE', `/api/admin/products?id=${encodeURIComponent(a.id)}&kind=${a.kind}`));
    case 'get_settings': return JSON.stringify(await call(env, origin, 'GET', '/api/admin/settings'));
    case 'update_settings': return JSON.stringify(await call(env, origin, 'PUT', '/api/admin/settings', a));
    case 'list_orders': { const d = await call(env, origin, 'GET', '/api/admin/orders'); return JSON.stringify(d.orders.filter((o) => !a.status || o.status === a.status).slice(0, 60)); }
    case 'set_order_status': return JSON.stringify(await call(env, origin, 'PUT', '/api/admin/orders', a));
    case 'list_customers': return JSON.stringify((await call(env, origin, 'GET', '/api/admin/customers')).customers.slice(0, 200));
    case 'list_subscribers': return JSON.stringify((await call(env, origin, 'GET', '/api/admin/subscribers')).subscribers.slice(0, 300));
    case 'list_images': {
      const { results } = await env.DB.prepare('SELECT key, name, note, created_at, length(data) n FROM images ORDER BY created_at DESC LIMIT 300').all();
      return 'Uploaded (use /assets/<key>.webp):\n' + (results.map((r) => `${r.key} ${r.name || ''} ${r.note ? '— ' + r.note : ''} (${Math.round(r.n / 1024)} KB)`).join('\n') || 'none') + '\n\nBuilt-in (assets/<file>): ' + MANIFEST.images.join(', ');
    }
    case 'note_image': {
      await env.DB.prepare('UPDATE images SET name=coalesce(?,name), note=coalesce(?,note) WHERE key=?').bind(a.name ?? null, a.note ?? null, a.key).run();
      return 'saved';
    }
  }
  throw new Error('unknown tool ' + name);
}

// ---------- the conversation loop (one model call per request; the panel calls again while tools run) ----------
const SYSTEM = KNOW + '\n\n## Files you can edit\n' + MANIFEST.files.map((f) => `- ${f.path} (${f.lines} lines)`).join('\n');

function trimHistory(m) {
  // Keep the conversation bounded: drop the oldest turns, always starting at a plain user message.
  let msgs = m.slice(-40);
  while (msgs.length && !(msgs[0].role === 'user' && msgs[0].content.every((c) => c.type !== 'tool_result'))) msgs = msgs.slice(1);
  return msgs;
}

export async function agentStep(env, req, origin) {
  if (!env.ANTHROPIC_API_KEY) return fail('agent_not_configured', 503);
  const b = await readJson(req);
  if (!b) return fail('bad_request');
  let th = b.thread ? await env.DB.prepare('SELECT * FROM agent_threads WHERE id=?').bind(clean(b.thread, 40)).first() : null;
  const now = Date.now();
  if (!th) {
    th = { id: crypto.randomUUID(), title: clean(b.text, 60) || 'محادثة', messages: '[]' };
    await env.DB.prepare('INSERT INTO agent_threads(id,title,messages,created_at,updated_at) VALUES(?,?,?,?,?)').bind(th.id, th.title, '[]', now, now).run();
  }
  let messages = JSON.parse(th.messages);
  if (b.text || (b.images && b.images.length)) {
    const content = [];
    for (const k of (b.images || []).slice(0, 8)) if (/^u-[a-z0-9-]{2,37}$/.test(k)) {
      content.push({ type: 'image', source: { type: 'url', url: `${origin}/assets/${k}.webp` } });
      content.push({ type: 'text', text: `[attached image saved in the library as ${k} → /assets/${k}.webp]` });
    }
    content.push({ type: 'text', text: String(b.text || '').slice(0, 8000).trim() || '(see the images)' });
    messages.push({ role: 'user', content });
  }
  const last = messages[messages.length - 1];
  if (!last || last.role !== 'user') return json({ thread: th.id, done: true, events: [] });

  const r = await fetch(env.ANTHROPIC_URL || 'https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: env.AGENT_MODEL || 'claude-sonnet-5-5', max_tokens: 8000,
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }, { type: 'text', text: `Today: ${new Date().toISOString().slice(0, 10)}. Unpublished drafts: ${(await drafts(env)).map((d) => d.path).join(', ') || 'none'}.` }],
      tools: TOOLS, messages: trimHistory(messages) }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { console.error('anthropic', r.status, JSON.stringify(d).slice(0, 500)); return fail('model_error', 502, { detail: d.error && d.error.message }); }
  messages.push({ role: 'assistant', content: d.content });
  const events = [];
  for (const c of d.content) if (c.type === 'text' && c.text.trim()) events.push({ type: 'text', text: c.text });
  const uses = d.content.filter((c) => c.type === 'tool_use');
  if (uses.length) {
    const results = [];
    for (const u of uses) {
      let out, ok = true;
      try { out = await run(env, origin, u.name, u.input || {}); } catch (e) { out = 'ERROR: ' + e.message; ok = false; }
      out = cut(String(out));
      results.push({ type: 'tool_result', tool_use_id: u.id, content: out, is_error: !ok });
      events.push({ type: 'tool', name: u.name, input: u.input, ok, result: out.slice(0, 300) });
      await env.DB.prepare('INSERT INTO agent_log(thread_id,tool,input,result,created_at) VALUES(?,?,?,?,?)').bind(th.id, u.name, JSON.stringify(u.input).slice(0, 4000), out.slice(0, 2000), Date.now()).run();
    }
    messages.push({ role: 'user', content: results });
  }
  await env.DB.prepare('UPDATE agent_threads SET messages=?, updated_at=? WHERE id=?').bind(JSON.stringify(messages), Date.now(), th.id).run();
  return json({ thread: th.id, done: !uses.length, events, usage: d.usage });
}

export async function agentThreads(env) {
  const { results } = await env.DB.prepare('SELECT id, title, updated_at FROM agent_threads ORDER BY updated_at DESC LIMIT 50').all();
  return json({ threads: results });
}

export async function agentThread(env, id) {
  const t = await env.DB.prepare('SELECT * FROM agent_threads WHERE id=?').bind(id).first();
  if (!t) return fail('not_found', 404);
  // Flatten to what the chat shows: user text + images, assistant text, tool lines.
  const out = [];
  for (const m of JSON.parse(t.messages)) for (const c of m.content) {
    if (m.role === 'user' && c.type === 'text' && !c.text.startsWith('[attached image')) out.push({ role: 'user', text: c.text });
    else if (m.role === 'user' && c.type === 'image') out.push({ role: 'user', image: c.source.url });
    else if (m.role === 'assistant' && c.type === 'text' && c.text.trim()) out.push({ role: 'agent', text: c.text });
    else if (m.role === 'assistant' && c.type === 'tool_use') out.push({ role: 'tool', name: c.name, input: c.input });
  }
  return json({ id: t.id, title: t.title, items: out });
}
