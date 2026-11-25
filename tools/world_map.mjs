// World map for the admin dashboard: one <path> per country with its ISO alpha-2 code, Natural Earth 110m (world-atlas),
// equal-earth projection, Antarctica left out. Written to web/admin/world.svg.
// Run from a folder with world-atlas@2.0.2, topojson-client@3.1.0, d3-geo@3.1.1, i18n-iso-countries@7.11.3 installed:
//   node tools/world_map.mjs web/admin/world.svg
import fs from 'fs';
import { feature, merge } from 'topojson-client';
import { geoEqualEarth, geoPath } from 'd3-geo';
import countries from 'i18n-iso-countries';
const topo = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-110m.json', 'utf8'));
const fc = feature(topo, topo.objects.countries);
fc.features = fc.features.filter((f) => f.id !== '010');
// Palestine as one land: the 1948 territories and the West Bank / Gaza drawn as a single shape named Palestine (owner's request)
const pal = merge(topo, topo.objects.countries.geometries.filter((g) => g.id === '376' || g.id === '275'));
fc.features = fc.features.filter((f) => f.id !== '376' && f.id !== '275');
fc.features.push({ type: 'Feature', id: '275', properties: { name: 'Palestine' }, geometry: pal });
const W = 960, H = 470;
const proj = geoEqualEarth().fitSize([W, H], fc), path = geoPath(proj);
let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">`;
let miss = 0;
for (const f of fc.features) {
  const a2 = f.id ? countries.numericToAlpha2(f.id) : null;
  const d = path(f); if (!d) continue;
  const short = d.replace(/(\d+\.\d)\d+/g, '$1');
  if (!a2) miss++;
  out += `<path ${a2 ? `data-c="${a2}"` : ''} d="${short}"><title>${(f.properties.name || '').replace(/&/g, '&amp;')}</title></path>`;
}
out += '</svg>';
fs.writeFileSync(process.argv[2], out);
console.log('countries', fc.features.length, 'without code', miss, 'bytes', out.length);
