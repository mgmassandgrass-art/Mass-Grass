// Lists the site's pages (with the script files each one loads) and images, for the admin's page editor and image library.
// Run before every deploy (npm run deploy does):  node tools/manifest.mjs
import fs from 'fs';
const root = new URL('../../web/', import.meta.url);
const files = fs.readdirSync(root).filter((f) => f.endsWith('.html')).sort().map((p) => {
  const s = fs.readFileSync(new URL(p, root), 'utf8');
  const js = [...s.matchAll(/<script src="(assets\/js\/[\w-]+\.js)/g)].map((m) => m[1]).filter((f) => !/\/(boot|catalog|art)\.js$/.test(f));
  return { path: p, bytes: s.length, js };
});
const imgs = fs.readdirSync(new URL('assets/', root)).filter((f) => /\.(webp|jpg|png|svg)$/.test(f)).sort();
fs.writeFileSync(new URL('../src/manifest.json', import.meta.url), JSON.stringify({ files, images: imgs }));
console.log(files.length, 'pages,', imgs.length, 'images');
