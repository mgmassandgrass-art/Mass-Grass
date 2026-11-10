// Writes the SQL that brings the products table in line with the site's own list (web/assets/js/catalog.js).
// New pieces are added, pieces the site no longer has are soft-deleted. What the admin set on existing pieces
// (titles, prices, hidden, order) is left alone; stickers only get their cut shape.
//   node tools/catalog-sql.mjs > migrations/00NN_catalog.sql
import fs from 'fs';
const window = {};
new Function('window', fs.readFileSync(new URL('../../web/assets/js/catalog.js', import.meta.url), 'utf8'))(window);
const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
const L = window.MG_DEFAULT.products, out = [];
const sort = {};
for (const p of L) {
  const s = (sort[p.kind] = (sort[p.kind] ?? -1) + 1);
  out.push(`INSERT INTO products(id,kind,title_en,title_ar,sort,extra,updated_at) VALUES(${q(p.id)},${q(p.kind)},${q(p.title_en)},${q(p.title_ar)},${s},${q(JSON.stringify(p.extra || {}))},0) ON CONFLICT(id,kind) DO UPDATE SET extra=CASE WHEN products.kind='sticker' THEN json_patch(products.extra, excluded.extra) ELSE products.extra END;`);
}
for (const kind of ['painting', 'postcard', 'sticker']) {
  const ids = L.filter((p) => p.kind === kind).map((p) => q(p.id)).join(',');
  out.push(`UPDATE products SET deleted=1, hidden=1 WHERE kind=${q(kind)} AND id NOT LIKE 'u-%' AND id NOT IN (${ids});`);
}
console.log(out.join('\n'));
