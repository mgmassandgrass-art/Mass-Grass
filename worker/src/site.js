// Page and image control for the admin panel: page texts, hidden pages/sections, image library and replacements.
import MANIFEST from './manifest.json';
import { json, fail, readJson, clean } from './util.js';
import { getSetting, dropCache } from './shop.js';

export const PAGES = MANIFEST.files.filter((f) => f.path.endsWith('.html')).map((f) => f.path);
const SYSTEM_PAGES = ['index.html', 'checkout.html', 'account.html', 'profile.html', '404.html']; // never hidden
export const TYPES = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8' };

// ---------- edited copies of files (D1 site_files.published), with every save kept in site_file_versions ----------
let pubCache = null, pubAt = 0;
export async function publishedPaths(env) {
  if (pubCache && Date.now() - pubAt < 15e3) return pubCache;
  const { results } = await env.DB.prepare('SELECT path FROM site_files WHERE published IS NOT NULL').all();
  pubCache = new Set(results.map((r) => r.path)); pubAt = Date.now();
  return pubCache;
}
async function original(env, origin, path) {
  let r = await env.ASSETS.fetch(new Request(`${origin}/${path}`));
  for (let i = 0; i < 3 && r.status >= 300 && r.status < 400 && r.headers.get('location'); i++) r = await env.ASSETS.fetch(new Request(new URL(r.headers.get('location'), origin)));
  return r.ok ? r.text() : null;
}
export async function current(env, origin, path) {
  const row = await env.DB.prepare('SELECT published FROM site_files WHERE path=?').bind(path).first();
  return row && row.published != null ? row.published : original(env, origin, path);
}
async function save(env, path, content, note) {
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO site_files(path,published,updated_at) VALUES(?,?,?) ON CONFLICT(path) DO UPDATE SET published=excluded.published, updated_at=excluded.updated_at').bind(path, content, now),
    env.DB.prepare('INSERT INTO site_file_versions(path,content,note,created_at) VALUES(?,?,?,?)').bind(path, content, clean(note, 200), now),
  ]);
  pubCache = null;
}

// ---------- texts of a page: elements with data-ar (static) and t('en','ar') pairs (in page scripts) ----------
const RE_ATTR = /(<([a-z][a-z0-9]*)\b[^>]*?\sdata-ar=")([^"]*)("[^>]*>)([^<]*)(<\/\2>)/g;
const RE_T = /\bt\(\s*'((?:[^'\\\n]|\\.)*)'\s*,\s*'((?:[^'\\\n]|\\.)*)'\s*\)/g;
const unJs = (s) => s.replace(/\\(.)/g, '$1');
const toJs = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/[\r\n\u2028\u2029]/g, ' ');
const unHtml = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const toHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const editable = (en, ar) => (en.trim() || ar.trim()) && !/\$\{|<[a-z/]/i.test(en + ar) && (en + ar).length < 600;

function texts(html) {
  const out = [];
  let i = 0;
  for (const m of html.matchAll(RE_ATTR)) { const en = unHtml(m[5]), ar = unHtml(m[3]); if (editable(en, ar)) out.push({ id: 'a' + i, en, ar }); i++; }
  i = 0;
  for (const m of html.matchAll(RE_T)) { const en = unJs(m[1]), ar = unJs(m[2]); if (editable(en, ar) && /[a-zA-Z؀-ۿ]/.test(en + ar)) out.push({ id: 't' + i, en, ar }); i++; }
  return out;
}
function applyTexts(html, changes) {
  const by = Object.fromEntries(changes.map((c) => [c.id, c]));
  let i = 0, n = 0;
  html = html.replace(RE_ATTR, (all, a, tag, ar, b, en, c) => {
    const ch = by['a' + i++];
    if (!ch || unHtml(en) !== ch.old_en || unHtml(ar) !== ch.old_ar) return all;
    n++; return a + toHtml(ch.ar) + b + toHtml(ch.en) + c;
  });
  i = 0;
  html = html.replace(RE_T, (all, en, ar) => {
    const ch = by['t' + i++];
    if (!ch || unJs(en) !== ch.old_en || unJs(ar) !== ch.old_ar) return all;
    n++; return `t('${toJs(ch.en)}','${toJs(ch.ar)}')`;
  });
  return { html, n };
}
const sections = (html) => [...html.matchAll(/<section\b[^>]*\bid="([a-zA-Z][\w-]*)"/g)].map((m) => m[1]);
const titleOf = (html) => unHtml((html.match(/<title>([^<]*)/) || [, ''])[1]);

// ---------- what the Worker adds to every page: hidden pages' links and hidden sections ----------
export async function pageRules(env) { return getSetting(env, 'pages', { hidden: [], sections: {} }); }
export function hideCss(rules, path) {
  const links = (rules.hidden || []).flatMap((p) => { const s = p.replace(/\.html$/, ''); return [`a[href="${p}"]`, `a[href="/${p}"]`, `a[href="/${s}"]`, `a[href^="${p}?"]`, `a[href^="${p}#"]`].map((x) => `html body ${x}`); });
  const secs = ((rules.sections || {})[path] || []).map((id) => `html body #${id}`);
  const all = [...links, ...secs];
  return all.length ? `<style>${all.join(',')}{display:none!important}</style>` : '';
}

// ---------- images: every image of the site + uploads, where each one is used ----------
let imgCache = null, imgAt = 0;
export async function imageOverrides(env) {
  if (imgCache && Date.now() - imgAt < 15e3) return imgCache;
  const { results } = await env.DB.prepare("SELECT key FROM images WHERE key NOT LIKE 'u-%'").all();
  imgCache = new Set(results.map((r) => r.key)); imgAt = Date.now();
  return imgCache;
}
export async function serveImageFile(env, file) {
  const r = await env.DB.prepare('SELECT type, data FROM images WHERE key=?').bind(file).first();
  return r ? new Response(r.data, { headers: { 'content-type': r.type, 'cache-control': 'public, max-age=300' } }) : null;
}

const KIND_AR = { painting: 'لوحة', postcard: 'بوست كارد', sticker: 'ستكر' };
async function imageLibrary(env, origin) {
  const { results: up } = await env.DB.prepare('SELECT key, type, name, note, created_at, length(data) size FROM images ORDER BY created_at DESC').all();
  const { results: prods } = await env.DB.prepare('SELECT id, kind, title_en, title_ar, hidden FROM products WHERE deleted=0').all();
  const pages = {};
  for (const p of PAGES) pages[p] = (await current(env, origin, p)) || '';
  const overridden = new Set(up.filter((u) => !u.key.startsWith('u-')).map((u) => u.key));
  const files = [...MANIFEST.images.map((f) => ({ file: f, builtin: true })), ...up.filter((u) => u.key.startsWith('u-')).map((u) => ({ file: u.key + '.webp', builtin: false, up: u }))];
  return files.map(({ file, builtin, up: u }) => {
    const key = file.replace(/\.(webp|jpg|png|svg)$/, '');
    const products = prods.filter((p) => p.id === key).map((p) => ({ kind: p.kind, kind_ar: KIND_AR[p.kind], title_en: p.title_en, title_ar: p.title_ar, hidden: !!p.hidden }));
    const usedIn = Object.entries(pages).filter(([, h]) => h.includes('assets/' + file)).map(([p]) => p);
    const meta = u || up.find((x) => x.key === file);
    return { file, url: '/assets/' + file, builtin, replaced: overridden.has(file), name: meta ? meta.name : '', note: meta ? meta.note : '',
      size: meta ? meta.size : null, products, pages: usedIn, deletable: !builtin && !products.length && !usedIn.length };
  });
}

// ---------- admin endpoints ----------
export async function siteAdmin(env, req, url, p) {
  const m = req.method, origin = url.origin;
  if (p === '/api/admin/pages' && m === 'GET') {
    const rules = await pageRules(env), edited = await publishedPaths(env), out = [];
    for (const path of PAGES) {
      const h = (await current(env, origin, path)) || '';
      out.push({ path, title: titleOf(h), url: '/' + (path === 'index.html' ? '' : path.replace(/\.html$/, '')), hidden: (rules.hidden || []).includes(path),
        system: SYSTEM_PAGES.includes(path), edited: edited.has(path), sections: sections(h).map((id) => ({ id, hidden: ((rules.sections || {})[path] || []).includes(id) })), texts: texts(h).length });
    }
    return json({ pages: out });
  }
  if (p === '/api/admin/page' && m === 'GET') {
    const path = url.searchParams.get('path');
    if (!PAGES.includes(path)) return fail('not_found', 404);
    const h = await current(env, origin, path);
    const { results } = await env.DB.prepare('SELECT id, note, created_at FROM site_file_versions WHERE path=? ORDER BY id DESC LIMIT 20').bind(path).all();
    return json({ path, title: titleOf(h), texts: texts(h), versions: results });
  }
  if (p === '/api/admin/page' && m === 'PUT') {
    const b = await readJson(req);
    if (!b || !PAGES.includes(b.path) || !Array.isArray(b.changes)) return fail('bad_request');
    const ch = b.changes.slice(0, 500).map((c) => ({ id: String(c.id), old_en: String(c.old_en ?? ''), old_ar: String(c.old_ar ?? ''), en: String(c.en ?? '').slice(0, 600), ar: String(c.ar ?? '').slice(0, 600) }));
    // Texts stay plain text: a tag in a t('…') pair would land inside the page's <script> as HTML (e.g. </script>).
    if (ch.some((c) => /<[a-z/!?]/i.test(c.en + c.ar))) return fail('bad_text');
    const { html, n } = applyTexts(await current(env, origin, b.path), ch);
    if (n !== ch.length) return fail('changed_meanwhile', 409, { applied: n });
    await save(env, b.path, html, b.note || 'texts');
    return json({ ok: true, changed: n });
  }
  if (p === '/api/admin/page/restore' && m === 'POST') {
    const b = await readJson(req);
    if (!b || !PAGES.includes(b.path)) return fail('bad_request');
    if (b.version) {
      const v = await env.DB.prepare('SELECT content FROM site_file_versions WHERE id=? AND path=?').bind(b.version, b.path).first();
      if (!v) return fail('not_found', 404);
      await save(env, b.path, v.content, 'restore #' + b.version);
    } else {
      await env.DB.prepare('UPDATE site_files SET published=NULL WHERE path=?').bind(b.path).run();
      pubCache = null;
    }
    return json({ ok: true });
  }
  if (p === '/api/admin/page/visibility' && m === 'PUT') {
    const b = await readJson(req);
    if (!b || !PAGES.includes(b.path)) return fail('bad_request');
    const rules = await pageRules(env);
    rules.hidden = rules.hidden || []; rules.sections = rules.sections || {};
    if (typeof b.hidden === 'boolean') {
      if (b.hidden && SYSTEM_PAGES.includes(b.path)) return fail('system_page');
      rules.hidden = rules.hidden.filter((x) => x !== b.path).concat(b.hidden ? [b.path] : []);
    }
    if (b.section) {
      if (typeof b.section !== 'string' || !/^[a-zA-Z][\w-]*$/.test(b.section)) return fail('bad_request'); // goes into a <style> on every page
      const s = (rules.sections[b.path] || []).filter((x) => x !== b.section);
      rules.sections[b.path] = b.sectionHidden ? s.concat([b.section]) : s;
    }
    await env.DB.prepare('INSERT OR REPLACE INTO settings(k,v) VALUES(?,?)').bind('pages', JSON.stringify(rules)).run();
    dropCache();
    return json({ ok: true, rules });
  }
  if (p === '/api/admin/library' && m === 'GET') return json({ images: await imageLibrary(env, origin) });
  if (p === '/api/admin/library/replace' && m === 'POST') {
    // Replace a built-in image everywhere it is used (the original stays in the site files; "restore" brings it back).
    const file = clean(url.searchParams.get('file'), 80), type = req.headers.get('content-type') || '';
    if (!MANIFEST.images.includes(file)) return fail('not_found', 404);
    if (!/^image\/(webp|jpeg|png)$/.test(type)) return fail('bad_type');
    const data = await req.arrayBuffer();
    if (data.byteLength > 1.8e6) return fail('too_big', 413);
    await env.DB.prepare('INSERT OR REPLACE INTO images(key,type,data,created_at,name) VALUES(?,?,?,?,?)').bind(file, type, data, Date.now(), file).run();
    const key = file.replace(/\.\w+$/, '');
    await env.DB.prepare('UPDATE products SET big=0 WHERE id=?').bind(key).run(); // the old zoom file no longer matches
    imgCache = null; dropCache();
    return json({ ok: true });
  }
  if (p === '/api/admin/library/replace' && m === 'DELETE') {
    await env.DB.prepare('DELETE FROM images WHERE key=?').bind(clean(url.searchParams.get('file'), 80)).run();
    imgCache = null;
    return json({ ok: true });
  }
  return null;
}
