#!/usr/bin/env node
// Builds the site's pages: web/_src/pages/<name>.html (a JSON comment on the first line, then the page's <main>)
// set into web/_src/layout.html → web/<name>.html. No inline scripts or styles blocks: pages name their css/js files.
//   node tools/build-web.mjs
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const web = join(dirname(fileURLToPath(import.meta.url)), '..', 'web');
const layout = readFileSync(join(web, '_src/layout.html'), 'utf8');
// web/routes.json is the one list of public addresses (page file → path). The build turns it into assets/js/routes.js (for core.js's
// cleanLinks), canonical / og:url, the JSON-LD and sitemap.xml; the Worker imports the same file to serve and redirect.
const ORIGIN = 'https://www.massandgrass.com';
const routes = JSON.parse(readFileSync(join(web, 'routes.json'), 'utf8'));
writeFileSync(join(web, 'assets/js/routes.js'), `window.MG_ROUTES=${JSON.stringify(routes)};\n`);
const prices = JSON.parse(readFileSync(join(web, 'assets/js/catalog.js'), 'utf8').match(/prices:\s*(\{[^}]*\})/)[1].replace(/(\w+):/g, '"$1":'));
const abs = (path) => ORIGIN + (path === '/' ? '/' : path);
const absImg = (i) => `${ORIGIN}/${i.replace(/^\//, '')}`;
const crumbs = {};   // file → short name, read from each page's meta while building (pages are read once first)
const metaOf = {};
for (const f of readdirSync(join(web, '_src/pages')).filter((x) => x.endsWith('.html'))) {
  const m = readFileSync(join(web, '_src/pages', f), 'utf8').match(/^<!--(\{.*?\})-->\n/s); if (m) { metaOf[f] = JSON.parse(m[1]); crumbs[f] = metaOf[f].crumb; }
}
const fileOfPath = Object.fromEntries(Object.entries(routes).map(([f, p]) => [p, f]));
const GROUPS = { '/calendars': 'Calendars' };   // path levels that are not pages of their own
function breadcrumb(f) {
  const path = routes[f]; if (!path || path === '/') return null;
  const parts = path.split('/').filter(Boolean), items = [{ name: 'Home', url: abs('/') }];
  for (let i = 1; i <= parts.length; i++) {
    const sub = '/' + parts.slice(0, i).join('/'), file = fileOfPath[sub];
    items.push({ name: i === parts.length ? crumbs[f] : (file && crumbs[file]) || GROUPS[sub], url: abs(sub) });
  }
  return { '@type': 'BreadcrumbList', itemListElement: items.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name, item: x.url })) };
}
const ldBlock = (o) => `\n<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`;
function jsonld(f, meta) {
  const out = [], path = routes[f], bc = breadcrumb(f), image = absImg(meta.image || 'assets/hero.webp');
  if (meta.home) out.push({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'Organization', '@id': ORIGIN + '/#org', name: 'Mass & Grass', url: ORIGIN + '/', logo: ORIGIN + '/assets/logo.svg', sameAs: [] },
    { '@type': 'WebSite', '@id': ORIGIN + '/#site', name: 'Mass & Grass', url: ORIGIN + '/', publisher: { '@id': ORIGIN + '/#org' }, inLanguage: ['en', 'ar'] }] });
  if (meta.product) out.push({ '@context': 'https://schema.org', '@type': 'Product', name: meta.product.name, description: meta.desc, image: [image], url: abs(path),
    brand: { '@type': 'Brand', name: 'Mass & Grass' },
    offers: { '@type': 'Offer', url: abs(path), priceCurrency: 'EUR', price: Number(prices[meta.product.price]).toFixed(2), availability: 'https://schema.org/InStock' } });
  if (meta.person) out.push({ '@context': 'https://schema.org', '@type': 'Person', name: 'Farah Al-Helou', jobTitle: 'Painter', description: 'Watercolour painter from Gaza.',
    homeLocation: { '@type': 'Place', name: 'Gaza' }, url: abs(path), image, worksFor: { '@type': 'Organization', name: 'Mass & Grass', url: ORIGIN + '/' } });
  if (bc) out.push({ '@context': 'https://schema.org', ...bc });
  return out.map(ldBlock).join('');
}
const hash = (f) => createHash('sha1').update(readFileSync(join(web, f))).digest('hex').slice(0, 8);
const all = (dir) => readdirSync(join(web, dir)).sort().map((f) => hash(join(dir, f))).join('');
const v = createHash('sha1').update(all('assets/css') + all('assets/js')).digest('hex').slice(0, 8);

let n = 0;
for (const f of readdirSync(join(web, '_src/pages')).filter((x) => x.endsWith('.html')).sort()) {
  const src = readFileSync(join(web, '_src/pages', f), 'utf8');
  const m = src.match(/^<!--(\{.*?\})-->\n/s);
  if (!m) throw new Error(`${f}: the first line must be <!--{"title":…}-->`);
  const meta = JSON.parse(m[1]), main = src.slice(m[0].length).trim();
  if (/<script\b(?![^>]*\bsrc=)/i.test(main) || /<style\b/i.test(main)) throw new Error(`${f}: no inline <script> or <style>; put it in assets/`);
  const css = ((meta.home || meta.hand) ? ['hand', ...(meta.css || [])] : (meta.css || [])).map((c) => `\n<link rel="stylesheet" href="assets/css/${c}.css?v=${v}">`).join('');
  const js = (meta.js || []).map((c) => `\n<script src="assets/js/${c}.js?v=${v}" defer></script>`).join('');
  // indexable pages carry their full, keyword-rich title in the meta; the others get the shop's name added
  const title = meta.seo ? meta.title : `${meta.title} · Mass & Grass`;
  if (!meta.noindex && !routes[f]) throw new Error(`${f}: an indexable page needs a path in web/routes.json`);
  const att = (x) => x.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  let out = layout.replaceAll('{{title}}', att(title)).replaceAll('{{desc}}', att(meta.desc))
    .replaceAll('{{canon}}', routes[f] ? abs(routes[f]) : '').replaceAll('{{image}}', absImg(meta.image || 'assets/hero.webp')).replace('{{robots}}', meta.noindex ? '\n<meta name="robots" content="noindex">' : '')
    .replace('{{ld}}', meta.noindex ? '' : jsonld(f, meta))
    .replaceAll('{{v}}', v).replace('{{css}}', css).replace('{{js}}', js).replace('{{main}}', main);
  // a hidden page (noindex) carries no canonical / og:url; a page served at a deeper address (/g/07) takes <base href="/"> so its relative links still work
  if (meta.noindex) out = out.replace(/<link rel="canonical"[^>]*>\n/, '').replace(/<meta property="og:url"[^>]*>\n/, '');
  // account / profile / checkout / track have a path but are not for search: noindex, so no canonical either (kept as before)
  if (meta.base) out = out.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<base href="/">');
  if (meta.home) out = out.replace('<html lang="en">', '<html lang="en" data-page="home" data-hand>');
  else if (meta.hand) out = out.replace('<html lang="en">', '<html lang="en" data-hand>');
  // each page carries its name, for its own colour (hand.css: one colour per page, from the calendar's months)
  out = out.replace('<html lang="en"', `<html lang="en" data-pg="${f.replace(/\.html$/, '')}"`);
  // the current page is marked in both menus
  if (meta.nav) out = out.replaceAll(`<a href="${meta.nav}" data-ar`, `<a href="${meta.nav}" aria-current="page" data-ar`);
  if (meta.nav) out = out.replaceAll(`<a class="sub" href="${meta.nav}" data-ar`, `<a class="sub" href="${meta.nav}" aria-current="page" data-ar`);
  writeFileSync(join(web, f), out); n++;
}
// sitemap.xml: every indexable public path (no noindex page), dated today
const today = new Date().toISOString().slice(0, 10);
// while the Worker runs the calendar-only opening (worker/wrangler.toml ONLY = "calendar"), the shop pages answer "opening soon":
// they stay out of the sitemap until the shop opens
let onlyCal = false; try { onlyCal = /^\s*ONLY\s*=\s*"calendar"/m.test(readFileSync(join(web, '../worker/wrangler.toml'), 'utf8')); } catch (e) {}
const CLOSED = ['shop.html', 'paintings.html', 'postcards.html', 'stickers.html', 'designs.html', 'book.html', 'commission.html'];
const urls = Object.entries(routes).filter(([f]) => metaOf[f] && !metaOf[f].noindex && !(onlyCal && (CLOSED.includes(f) || f === 'index.html'))).map(([, p]) => `  <url><loc>${abs(p)}</loc><lastmod>${today}</lastmod></url>`);
writeFileSync(join(web, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
console.log(`built ${n} pages, assets v=${v}`);
