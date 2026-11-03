# The collage direction (preview, not live)

The torn-paper collage version of the shop, built section by section with the owner.
Its design system is `DESIGN.md` at the repo root.

- `site/index.html` is the home page and holds the shared head (tokens, header, footer, shared JS).
- `parts/<p>_main.html`, `<p>_css.txt`, `<p>_js.txt` are the other pages: `pg` paintings, `pc` postcards,
  `sk` stickers, `st` story (map), `ca` calendar, `ac` account (sign in / sign up / Google / reset), `co` checkout,
  `pf` profile (files, name, password, data), `hp` help, `tm` terms, `nf` 404, `sh` the shop (every product, by category).
- Rebuild every page at once: `./build_all.sh`.
- Header: sticky; logo, sections in the middle, language, account and a bag icon at the side. Buttons (`.ink`) are olive.
- `site/assets/shop.js` is the shop layer on every page: the bag (`localStorage.mgBag`, the same lines the Worker's
  `/api/orders` prices), the bag sheet, the account link (`/api/me`), prices from `window.MGCAT` (defaults offline),
  and `data-add` / `data-price`. Product ids: Farah's `cal-XX` scans map to catalog ids in `IDS`.
- Test against the real API: `wrangler.local.toml` (commands inside) runs the Worker with this site on :8787.
- Mockups: paintings sit whole inside the frame's mat (`artBox`, scene picked by frame shape); postcards and calendar
  pages are cut to the painting's shape and printed edge to edge (photo scenes with a landscape card only carry landscape paintings; an upright card turns a quarter to show its back); calendar pages use `object-fit: contain`; stickers are kept fully on the object when placed.
- Build a page: `python3 build_pg.py <p> <out.html> <Title> <out.html>` (run from this folder), e.g.
  `python3 build_pg.py ca calendar.html Calendar calendar.html`.
- Check it: `node ../../.claude/skills/hallmark/scripts/sloplint.mjs site/<page>.html` (0 FAIL), then
  Playwright at 1440 and 390, Arabic and English.
- Preview artifact: https://claude.ai/artifact/4saBPLwjywiwbG2kMfHHkH (publish `site/index.html` with the
  other pages and assets as `files`, root `site`).

## Calendar 2027: Things kept in bottles

- Pages come from Farah's A5 PDFs: `pdftoppm -r 220 -png -singlefile <file>.pdf c27-MM` then WebP into `site/assets/c27-MM.webp`
  (`00` is the cover). `c27-MM-b.webp` is the bottle torn out of each page for the shelf.
- Only the cover, May, August, September and December exist so far; add the others to `P` in `parts/ca_js.txt` and to `M`
  in the home calendar (`site/index.html`).
- Mockup photos (Canva, exported through page 46 of `DAHWgLZfDEc`): `c27-wall`, `c27-hands`, `pcp-window`, `pcp-table`.
- `occluder.py assets/<scene>.webp x y ww wh` cuts the fingers / wire that sit over the blank card or page into
  `<scene>-top.webp` (keeps anything that is not the card's own tint and reaches the card's edge).
