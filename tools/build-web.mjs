#!/usr/bin/env node
// Builds the site's pages: web/_src/pages/<name>.html (a JSON comment on the first line, then the page's <main>)
// set into web/_src/layout.html → web/<name>.html. No inline scripts or styles blocks: pages name their css/js files.
//   node tools/build-web.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const web = join(dirname(fileURLToPath(import.meta.url)), '..', 'web');
const layout = readFileSync(join(web, '_src/layout.html'), 'utf8');
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
  const css = (meta.css || []).map((c) => `\n<link rel="stylesheet" href="assets/css/${c}.css?v=${v}">`).join('');
  const js = (meta.js || []).map((c) => `\n<script src="assets/js/${c}.js?v=${v}" defer></script>`).join('');
  const title = meta.home ? 'Mass & Grass: watercolours from Gaza' : `${meta.title} · Mass & Grass`;
  let out = layout.replaceAll('{{title}}', title.replace(/&/g, '&amp;')).replaceAll('{{desc}}', meta.desc.replace(/&/g, '&amp;').replace(/"/g, '&quot;'))
    .replaceAll('{{canon}}', f === 'index.html' ? '' : f.replace(/\.html$/, '')).replace('{{robots}}', meta.noindex ? '\n<meta name="robots" content="noindex">' : '')
    .replaceAll('{{v}}', v).replace('{{css}}', css).replace('{{js}}', js).replace('{{main}}', main);
  if (meta.home) out = out.replace('<html lang="en">', '<html lang="en" data-page="home">');
  // the current page is marked in both menus
  if (meta.nav) out = out.replaceAll(`<a href="${meta.nav}" data-ar`, `<a href="${meta.nav}" aria-current="page" data-ar`);
  if (meta.nav) out = out.replaceAll(`<a class="sub" href="${meta.nav}" data-ar`, `<a class="sub" href="${meta.nav}" aria-current="page" data-ar`);
  writeFileSync(join(web, f), out); n++;
}
console.log(`built ${n} pages, assets v=${v}`);
