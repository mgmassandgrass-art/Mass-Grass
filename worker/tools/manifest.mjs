// Lists the site's editable text files (pages, scripts) for the admin agent. Run before every deploy.
import fs from 'fs';
const root = new URL('../../prototype/', import.meta.url);
const out = [];
for (const f of fs.readdirSync(root)) if (f.endsWith('.html')) out.push(f);
for (const f of fs.readdirSync(new URL('assets/', root))) if (/\.(js|css)$/.test(f)) out.push('assets/' + f);
const files = out.sort().map((p) => { const s = fs.readFileSync(new URL(p, root), 'utf8'); return { path: p, bytes: s.length, lines: s.split('\n').length }; });
const imgs = fs.readdirSync(new URL('assets/', root)).filter((f) => /\.(webp|jpg|png|svg)$/.test(f)).sort();
fs.writeFileSync(new URL('../src/manifest.json', import.meta.url), JSON.stringify({ files, images: imgs }));
console.log(files.length, 'files,', imgs.length, 'images');
