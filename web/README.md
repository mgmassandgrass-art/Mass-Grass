# The Mass & Grass site (`web/`)

The shop as it will go live: static pages + the Worker in `worker/` (API, admin gate, catalog, security headers).
Design system: `DESIGN.md` at the repo root (torn-paper collage). Nothing here is deployed until the owner says so.

## Layout

- `_src/layout.html` is the shell (head, header, footer). `_src/pages/<name>.html` holds one page's `<main>`; its first
  line is a JSON comment: `<!--{"title":…,"desc":…,"nav":"x.html","css":[…],"js":[…]}-->`.
- `node tools/build-web.mjs` writes `web/<name>.html`. Edit the sources, never the built pages. `soon.html` and
  `admin/` are plain files (not built).
- No inline `<script>` or `<style>` anywhere: the Worker's Content-Security-Policy only runs script files of our own.
- `assets/css/site.css` (tokens, header, bag, forms, footer) + one CSS file per page. In CSS, images are `url(../x.webp)`.
- `assets/js/boot.js` (in `<head>`: language before paint), `catalog.js` (the shop's own list), `core.js` (`window.MG`),
  then the page's script. `show.js` is the carousel shared by home and calendar.

## `MG` (core.js)

`MG.page(fn)` registers a page: `fn(why)` runs with `why` = `init`, `lang`, `bag`, `user` or `view`.
`MG.t(en, ar)`, `MG.L([en, ar])`, `MG.ar`, `MG.setLang`; `MG.products(kind)`, `MG.product(kind, id)`, `MG.price`, `MG.fmt`,
`MG.img(id)`, `MG.thumb(id)`, `MG.tile(product)`, `MG.addBtn(kind, id)`; `MG.bag` (`add`, `toggle`, `has`, `stickers`, …),
`MG.openBag()`; `MG.api(method, path, body)`, `MG.user`; `MG.toast`, `MG.tear()` (torn edges on `[data-tear]`).
Text in markup: `data-ar="…"` holds the Arabic, the element's own text is the English.

## Catalog and images

- Product id == image file: `assets/<id>.webp`, thumbnail `assets/t-<id>.webp` for paintings.
- `assets/js/catalog.js` is the list used when the page is opened without the server (previews). Served by the Worker,
  the page gets the database's catalog as JSON (`<script type="application/json" id="mg-cat">`) and uses that instead.
- `python3 tools/web_assets.py [STICKER_DIR]` rebuilds the image set from the best clean source of each painting and
  writes `assets/js/art.js` (file sizes). After changing `catalog.js`: `node worker/tools/catalog-sql.mjs` gives the SQL
  for a new migration.
- No watermarked image is in this tree. Farah's own sticker sheet (Drive: `stickers Folder/stickers.pdf`) is the source
  of the die-cut stickers.

## Run and test

```
cd worker
sh test/local.sh          # fresh local database, a local-only admin, the site on http://localhost:8787
npm test                  # API: accounts, security, admin   (in another shell)
node test/e2e.test.cjs    # every page in both languages and sizes, bag → checkout, account, phone menu
```
Local admin: `info@massandgrass.com` / `local-admin-only-1` (exists only in `worker/.state`).
Before showing a page: `node .claude/skills/hallmark/scripts/sloplint.mjs web/<page>.html` (0 FAIL).
