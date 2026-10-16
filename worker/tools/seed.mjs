// Builds migrations/0003_seed.sql from the product arrays in the prototype pages.
import fs from 'fs';
const R = (f) => fs.readFileSync(new URL(`../../prototype/${f}`, import.meta.url), 'utf8');
const arr = (src, name) => { const i = src.indexOf(`const ${name}=`); let d = 0, j = src.indexOf('[', i);
  for (let k = j; k < src.length; k++) { if (src[k] === '[') d++; else if (src[k] === ']' && !--d) return eval(src.slice(j, k + 1)); } };
const shop = R('shop.html'), pnt = R('paintings.html'), idx = R('index.html');
const PT = arr(shop, 'PT'), S = arr(shop, 'S'), PCK = arr(shop, 'PCK'), PP = arr(pnt, 'PT'), HOME = arr(idx, 'S');
const BS = arr(idx, 'BS'); const sold = Object.fromEntries(BS.map((b) => [b[0], b[6]]));
const pp = Object.fromEntries(PP.map((p) => [p[0], p])), byP = Object.fromEntries(PT.map((p) => [p[0], p]));
const homeKeys = HOME.map((h) => h[0]);
const q = (v) => v == null ? 'NULL' : typeof v === 'number' ? v : `'${String(v).replace(/'/g, "''")}'`;
const rows = [];
PT.forEach((p, i) => { const x = pp[p[0]] || [];
  rows.push(['painting', p[0], p[1], p[2], p[3], p[4], p[6], i, sold[p[0]] || 0, p[5], { map: x[5] || '', ratio: x[6] || 1, home: homeKeys.includes(p[0]) ? 1 : 0 }]); });
PCK.forEach((k, i) => { const p = byP[k] || ({ boatman: ['boatman', 'The Boatman', 'الصياد', 'Gaza port', 'ميناء غزة'] })[k];
  rows.push(['postcard', k, p[1], p[2], p[3], p[4], 0, i, 0, 0, {}]); });
S.forEach((s, i) => rows.push(['sticker', s[0], s[2], s[3], s[4], s[5], 0, i, 0, 0, { shape: s[1] }]));
const sql = rows.map(([kind, id, te, ta, pe, pa, nw, sort, sd, big, ex]) =>
  `INSERT OR IGNORE INTO products(id,kind,title_en,title_ar,place_en,place_ar,is_new,sort,sold,big,extra,updated_at) VALUES(${[id, kind, te, ta, pe, pa, nw, sort, sd, big, JSON.stringify(ex)].map(q).join(',')},0);`).join('\n');
fs.writeFileSync(new URL('../migrations/0003_seed.sql', import.meta.url), sql + '\n');
console.log(rows.length, 'products');
