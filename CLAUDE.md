# Mass & Grass: handoff notes for Claude

Read this first. It carries everything from the earlier sessions, so a new session (or a new
Claude account) can continue without losing context.

## Working with the owner

- Reply in Palestinian Arabic, short and direct.
- The owner pre-approves routine steps ("وافق على كل اشي"): don't ask for confirmation on
  normal work; commit and push when a change is done and tested.
- Show every change as a preview (a claude.ai artifact built with `tools/build_preview.py`).
- They want real photos, never drawn or code-built imitations of real objects. Code-made 3D
  models and drawn calendar hardware were rejected.
- Style: simple paper. The whole site sits on one real paper texture (`assets/paper/paper.webp`, a
  seamless tile; `paper-dark.webp` in dark mode), and the work is laid on it like objects on a table
  (prints with a white border, cut-out stickers, garments). Light type: IBM Plex Sans Arabic, weights
  200–600, headings at 300. Ink buttons with 3px corners; tabs and filters are plain text with an
  underline, never pills or coloured chips; dialogs are paper sheets. Clay is only an accent. Earlier
  looks the owner replaced: Marhey + Rubik fonts, a glass theme, the big animated home.
- Sales are digital: every product has an order button that opens the order sheet. Pay by card comes
  first (the piece's own `checkout` link, else `content/settings.json` → `shop.link`; empty = "coming
  soon"), then WhatsApp / e-mail / Instagram. Contact and shop links in `settings.json` are still empty.
- Copy is standard Arabic (فصحى بسيطة), never colloquial, with the usual shop terms: اللوحات، الملصقات،
  التقويم السنوي، الملابس والحقائب، البطاقات البريدية (not ستيكرات / كاليندر / بوست كارد). Keep text short and
  skip instructions: let people explore (hints and eyebrows are empty strings, and `[data-t]:empty`
  hides them). Imperatives are plural (اطلبوها، الصقوها), never feminine singular. Story narration
  stays in Farah's first person; the calendar's folk proverbs stay as they are.
- Numbers are Western digits (0-9) in both languages: `MG.num`/`MG.pad` never localise, and content
  JSON has no Arabic-Indic digits.
- Header: the logo in the middle; on wide screens the sections run in a line under it that sticks to
  the top (a small logo appears in it once the big one scrolls away), with the story link and EN at
  the sides. On phones (≤900px) the logo bar sticks and a three-line button opens a full-screen paper
  menu (`renderMenu()` in `shell.js`: home, the sections, the story, support, theme). The story is
  not a collection; the story page ends with a support section. Donation and Ko-fi links go in
  `content/settings.json` → `support` (`donate`, `kofi`); empty means "coming soon".

## Where the work stands

Branch with all the work: `main` (the default branch; renamed from `claude/clever-brown-tvlhfo`). Every push to `main` goes live.

| Page | Path | State |
|---|---|---|
| Home | `/` (`index.html`) | ready (simple, paper): the six collections laid on the paper as real objects in a loose grid (a taped print, scattered stickers, a wall calendar with the real binding, a printed hoodie, two postcards, a sketchbook for "more designs"); each is a link to its page. Under them a short note on Farah's story (portrait, two lines, link); the owner will talk about this part later. Code: `assets/js/home.js`, `assets/css/home.css`, `content/home.json` (`table` holds each object's photos). |
| Paintings (اللوحات) | `/paintings/` | ready: pegged line + text filters + grid; price under the title; `checkout` per painting |
| Stickers (الملصقات) | `/stickers/` | ready |
| Calendar (التقويم السنوي) | `/calendars/` | ready: real wire-o binding photo, WebGL page flip (page swings behind the calendar), no sound |
| Clothes & bags (الملابس والحقائب) | `/cloth/` | ready: hoodies, sweatshirts, tote bags, caps in one display, kinds row on top; grid shows the piece first, the painting on hover. `/hoodies/` redirects here |
| Postcards (البطاقات البريدية) | `/postcards/` | ready: cards rise from an envelope as a column, flip to the back (stamp + postmark), write-your-own-card, grid |
| Story (الحكاية) | `/story/` | ready: "Farah's map". A painted SVG map of the Gaza Strip (real OSM outline) stays on screen (sticky; on phones on top) while ink-bordered story panels scroll past (after Codrops' animated map path + SBS "The Boat"). Farah's watercolour face walks dashed routes between real places: al-Jalaa → az-Zawayda 2023 → al-Jalaa 2025 → a small office at al-Saraya (2025) → Deir al-Balah → bombed home → Tel al-Hawa → the office. Farah is the only person in the story: Ahmed was removed at the owner's request (map token, routes, text, portrait and images). Faces change mood (happy, worried, sad, joyful) and the map darkens in the hard chapters. Each step has `photos` (empty = a placeholder frame). Farah's portrait with her bio at the end, then the support section. |
| More designs (تصاميم متنوعة) | `/designs/` | not started (`ready:false` in site.json) |

Ideas discussed but dropped: 3D orbit view of products (dropped by the owner).

## How the site is built

- Static site, vanilla JS, Arabic RTL with an English toggle. No build step.
- All text lives in `content/*.json` as `{ "ar": "…", "en": "…" }`; each page points to its file
  with `<meta name="mg-content">`. Nav comes from `content/site.json` → `collections`
  (link is `/${id}/`, `ready:false` shows "قيد التجهيز").
- Shared shell `MG` in `assets/js/shell.js` (`MG.ready`, `$`, `$$`, `L`, `t`, `esc`, `MG.num`,
  `MG.onLang`, `MG.openOrder`, `MG.reduced`, `MG.finePointer`); `a[data-order]` opens the order sheet.
- Page code: `assets/js/<page>.js` + `assets/css/<page>.css`.
- Type scale tokens in `main.css` (`--fs-hero`, `--fs-h1`, `--fs-h2`, `--fs-h3`, `--fs-body`): page titles use
  `--fs-h1`, section titles `--fs-h2`, item/lightbox titles `--fs-h3`; use the tokens instead of new clamps.
  Surfaces: `--paper` + `--paper-img` (texture; repeat it on anything sticky or a dialog so it matches),
  `--sheet` (white print border), `--lift` / `--lift-hi` (shadows of things resting on paper).
- Global CSS has `img,canvas{max-width:100%}`: give wide canvases `max-width:none`.
- Page-to-page transitions use cross-document View Transitions (`@view-transition` in `main.css`).
- `--head` (header height) is set by `shell.js` for anything sticky under the header.
- Run locally: `python3 -m http.server 8765` and open `http://localhost:8765/`.
- Test with Playwright (Chromium is preinstalled in cloud sessions), desktop and mobile widths,
  and check the console for JS errors before pushing.

## Domain and hosting

- Domain: https://www.massandgrass.com. Every page has a canonical URL and absolute `og:image`/`og:url`
  on that domain; `sitemap.xml`, `robots.txt`, `404.html` and `CNAME` (for GitHub Pages) are at the root.
- Hosting: Cloudflare Pages project `mass-grass` (https://mass-grass.pages.dev) connected to the GitHub repo
  (now `mgmassandgrass-art/Mass-Grass`), production branch `main`, no build command, output = repo root.
  Every push to `main` redeploys the site. The domain massandgrass.com was bought on Cloudflare.
- www.massandgrass.com is live. The bare massandgrass.com had no DNS record yet (add it under Custom domains).
- `_redirects` sends repository-only files (CLAUDE.md, .claude/, tools/, docs/, studio/, .pages.yml) to the
  home page; Pages redirects only allow 3xx codes, not 404.
- The session's network allow-list includes massandgrass.com and mass-grass.pages.dev, so curl can check the
  live site. Chromium through the proxy needs `ignore_https_errors=True` and `wait_until='load'`.

## Content panel (Pages CMS)

- The owner edits content at https://app.pagescms.org (sign in with GitHub, pick Mass-Grass, branch `main`).
  The panel is configured by `.pages.yml`; every save is a commit on `main`, so it goes live.
- What the panel edits lives in files of its own, so a save can never drop page settings:
  `content/catalog/paintings.json` (the paintings; `content/paintings.json` points at it with
  `"itemsFile"`) and `content/settings.json` (contact, shop and support links, merged into `MG.site`).
  `shell.js` and `build_preview.py` both load `itemsFile`; `tidyItem()` in `shell.js` fills what a
  panel entry may leave out (ratio arrives as "4:5", empty id, no palette/motif).
- Uploads go to `assets/uploads/`; `.github/workflows/optimize-uploads.yml` runs
  `tools/optimize_uploads.py` on each upload: JPG/PNG/HEIC become WebP (max 2000 px) and the content
  files are re-pointed; the workflow also runs on `content/**` changes, because a panel save made after
  the conversion can still name the original .jpg. Claude can edit the same JSON files directly.
- When the owner replaces an entry in the panel, fields such as `sample` carry over: check new real
  paintings have `"sample": false`.
- Next sections to add to the panel: stickers, postcards, calendar months, cloth.

## Previews

Whole site as one linked artifact: `python3 tools/build_site.py OUT_DIR` bundles every page
(home, paintings, stickers, calendars, cloth, postcards, story) into self-contained files whose nav
links point at each other (`index.html`, `paintings.html`, …); publish `index.html` with the others
as `files`. Current link: https://claude.ai/artifact/GJLaXvWzK6iE6MJmD5XbTK. Fonts come from Google Fonts,
which the artifact viewer allows. Local Playwright screenshots need `ignore_https_errors=True` for the
fonts to load through the session proxy.

Single pages:

`python3 tools/build_preview.py <page path> <out.html>` inlines the page, its CSS/JS/JSON and
`/assets/...` images into one HTML file, then publish it as an artifact.
`tools/preview_links.json` maps site paths to artifact URLs so nav links jump between previews.
Artifacts belong to the account that published them: on a new account publish new ones and
update `tools/preview_links.json` with the new URLs, then rebuild all pages so links point right.

## Brand logo

`assets/brand/logo.svg` is the owner's logo (MASS& / GRASS lettering, #463928), used as a CSS mask
(`.logo-svg` in `main.css`) so it follows the text colour: brown on light, light on dark. It is in
the header, the footer and the home intro of every page, and is the favicon. The site opens in the
light theme by default; dark only when the visitor picks it (`theme.js`). The theme attribute is
`data-mg-theme` (not `data-theme`, which the artifact viewer sets from claude.ai's own theme).

## Product photos

See `.claude/skills/canva-product-photos/SKILL.md` (Canva generate-image → remove-background →
export → `tools/web_image.py` to WebP) and `.claude/skills/hanging-display/SKILL.md`
(the garment display). Photos live in `assets/products/<collection>/`.
The Canva connector must be connected on the account for new photos.

## Story page notes (`assets/js/story.js`, `content/story.json`)

- Places are lat/lon in `story.json` → `places` (projected onto an 800×1000 map); `labelWest` puts a
  label on the left of its dot. Steps say where Farah is (`farah`, a place or a list of places); routes between consecutive places are built automatically. `bombed` marks
  a place as destroyed; `sway` makes the panel rock.
- The owner's watercolour portrait of Farah is cropped into
  `assets/products/story/portrait-*.webp` and the face tokens `face-*.webp`.
- Real photos: run `python3 tools/boat_sketch.py IN.jpg assets/products/story/photos/NAME.webp`
  (ink lines + flat washes on warm paper) and add `{"src": "/assets/products/story/photos/NAME.webp"}`
  to that step's `photos`.
- `strip` in `story.json` is the real outline of the Gaza Strip (OpenStreetMap data from the npm
  package `@geo-maps/countries-land-100m`); places use real coordinates (office at al-Saraya).
- Steps carry `mood` (faces in `faces` → `farah` → calm, happy, joy, worried, sad; generated in Canva from the owner's portraits, page 42 of `DAHWgLZfDEc`) and
  `dark` (0–1) which darkens the map and the section background.
- Earlier experiments (paper fold in WebGL, handwriting, watercolour/paper cut-out poses) were
  replaced; their Canva images are on pages 39-41 of the holder design `DAHWgLZfDEc`.

## Calendar flip notes (`assets/js/calendar.js`)

WebGL sheet mesh (30×72) hanging from the wire; angle 0→2π with a sag term; a depth-only quad
hides the page once it passes behind; `angleFor(screenY)` maps drag to angle. Next completes past
0.32π or on a fast upward flick. A ResizeObserver on `#pages` repaints; `sizePages()` bumps
`revealRun` so a stale reveal never draws at the old size.

## Next steps

1. Build "تصاميم متنوعة" (`/designs/`).
2. Fill real contact details (WhatsApp, Instagram, e-mail) in `content/site.json`.
3. Replace sample art with real scans; write the story section on the home page.
5. Connect www.massandgrass.com to the Pages project, then build the content panel.

## New shop (Oct 2026): prototype v38 + Worker backend

- `prototype/` is the live site on www.massandgrass.com, served by the Worker `mass-grass` (`worker/`, static assets +
  API, D1 database `mass-grass`). The old Pages site is untouched; deleting the route `www.massandgrass.com/*` brings it back.
- The Worker injects `window.MGCAT` (products, prices, rates, links from D1) into every HTML page; page arrays are wrapped
  in `MGK(kind, defaults, mapper)` so the admin's products replace the hardcoded ones.
- Admin panel: `/admin/` (only `info@massandgrass.com` with role admin; everyone else gets a redirect / 404). Side menu, Arabic/English.
  Products (add/edit/hide/soft-delete; a kind keeps at least one visible item), Pages (hide a page → 404 + its links hidden;
  hide `<section id>`s; edit every `data-ar` text and `t('en','ar')` pair, saved to D1 `site_files` with versions),
  Image library (every built-in image + uploads, where each is used; replacing a built-in image is served from D1).
  Server code for this: `worker/src/site.js`; `worker/src/manifest.json` (from `tools/manifest.mjs`) lists pages and images.
  Reset its password with `node worker/tools/make-admin.mjs` and run the SQL with `wrangler d1 execute --remote`.
- Checkout: `/api/orders` prices every line on the server; PayPal (redirect flow) switches on once the
  `PAYPAL_CLIENT_ID` / `PAYPAL_SECRET` secrets exist (`PAYPAL_ENV=live` for real money). Until then checkout says payments open soon.
- Staging copy: https://mass-grass-staging.mg-massandgrass.workers.dev (same database).
- Deploy from a cloud session: the Cloudflare token is a network secret on the environment (injected by the proxy
  for `api.cloudflare.com`, path prefixes `/client/v4/accounts/<id>/workers/s` and `/client/v4/zones`; the asset
  upload path must stay outside them because it uses its own upload token). Run
  `cd worker && CLOUDFLARE_API_TOKEN=placeholder npm run deploy`; a trailing 400 on `/workers/workers/...` after
  "Deployed" is harmless. Never paste tokens into the chat.
- Coming-soon gate: `SOON = "1"` in `worker/wrangler.toml` serves `prototype/soon.html` (assets in `prototype/soon-assets/`)
  for every page; the signed-in admin still sees the whole site (sign in at `/account.html`). The soon page's e-mail form
  posts to `/api/subscribe` (source `soon`). To launch: set `SOON = "0"` (or remove it) and deploy.

## Launch reel (Oct 2026)

- "The snow globe" teaser: figures leave Farah's paintings (prints on the paper table), join a
  procession that only moves right-to-left, and gather at the real logo; music and an effect per
  action. Code: `tools/reel/` (cut → refine → prep → `reel.html` → `capture.py` → `sound.py`).
  How-to: `.claude/skills/painting-reel/` and `.claude/skills/reel-sound/`.
- Source scans are in the owner's Google Drive (`Work/Art/ART`); keep them out of the repo.
- Owner's notes on v1: motion must all go one way, cuts must be clean, the moon must glow hard,
  and every action needs a sound.

## Design skills and the collage direction (Nov 2026)

- The owner asked for these skills to be used in every design conversation from now on:
  `hallmark`, `impeccable`, `design-taste-frontend` (taste-skill), `frontend-design`, `ui-ux-pro-max`,
  `typography-scale-builder`, `extract-design-md`, `interface-design` (app screens only), `hue` (new design
  languages), `shadcn` (only if a React/shadcn project appears). They live in `.claude/skills/`.
- `unslop` (from theclaymethod/unslop) checks the English copy for AI writing patterns: extract the page text,
  run `.claude/skills/unslop/scripts/banned_phrase_scan.py` and `structure_scan.py`, then fix only confirmed
  defects (and the matching Arabic). Farah's story narration and quotes stay as they are.
- `DESIGN.md` at the root is the locked system for the collage direction (tokens, type roles, spacing,
  components, mockup method). Read it first; new pages follow it.
- The collage pages are in `drafts/collage/` (see its README). Before showing a page, run
  `node .claude/skills/hallmark/scripts/sloplint.mjs drafts/collage/site/<page>.html` and fix every FAIL.
- Hallmark floor rules the site now follows: colours and fonts only through `:root` tokens, type through the
  role tokens (`--fs-*`), spacing on a 4px scale, `minmax(0,1fr)` image tracks, no tracked-caps labels or
  eyebrows, no middle-dot meta strings or arrows glued to links, focus-visible everywhere, content visible
  without scripts (`.js` gates hidden states), no fake success messages.

## The rebuilt site (Nov 2026): `web/` + Worker, live since 10 Nov 2026

- The owner asked for the whole site to be rebuilt and redesigned. It lives in `web/` (see `web/README.md` and the skill
  `.claude/skills/site-build/`): pages built from `web/_src/` by `node tools/build-web.mjs`, one shared core (`MG` in
  `assets/js/core.js`), external CSS/JS only, the collage design system of `DESIGN.md`. `drafts/collage/` is the old draft it grew from.
- Pages: home, shop, paintings, postcards, stickers, calendar, story, account, profile, checkout, help, terms, 404, soon.
  Everything works except payment itself (waits for the owner's PayPal Business keys; until then checkout records the order
  and says payments open soon).
- `worker/wrangler.toml` serves `../web`. Deployed and opened (`SOON = "0"`) on 10 Nov 2026 at the owner's request; both
  www.massandgrass.com and massandgrass.com (301 to www) route to the Worker. The old `prototype/` is no longer served.
- The database updates itself: `worker/src/migrate.js` runs bundled migrations once on the first request (the session's
  Cloudflare token cannot reach the D1 API) and records them in `d1_migrations`. New migrations go in its `STEPS` list.
- Deploying from a cloud session: if the Worker was last saved on the Cloudflare dashboard, `wrangler deploy` first downloads
  the dashboard config and fails on `/workers/domains/records` (outside the token's paths). Patch only that fetch in
  `node_modules/wrangler/wrangler-dist/cli.js` to `.catch(() => [])` for the deploy, then restore the file. The trailing 400 on
  `/workers/workers/...` skips the triggers step: set the cron with
  `PUT /client/v4/accounts/<id>/workers/scripts/mass-grass/schedules` body `[{"cron":"*/15 * * * *"}]` (inside the token's paths).
  After a deploy: `sh worker/test/smoke.sh`.
- PayPal (Nov 2026): the owner's PayPal Business app is Live; `PAYPAL_CLIENT_ID` / `PAYPAL_SECRET` are Worker secrets they set
  themselves, `PAYPAL_ENV = "live"` is in `wrangler.toml`. A setup check created order `MG-94828A67` (pending, never paid).
  The buyer may come back with the order secret or only PayPal's `?token=`; PayPal holds (capture `PENDING`) answer 202 and
  the files follow when it clears; a cron every 15 minutes (`sweepPending`) and the admin's "ask PayPal" button capture
  orders approved but never brought back. Local test: `sh test/local.sh paypal` + `node test/pay.test.cjs` (stand-in PayPal).
- Free downloads (Nov 2026): a piece with price 0 in the admin is free. The site shows "Free" / "مجانًا" and a "Free download"
  button that goes straight to checkout ("Get the files"); an all-free order skips PayPal and is ready at once (files on the
  page and by e-mail, no e-mail to the owner). A free piece needs its file (`not_ready` otherwise); 15 free orders per address
  an hour and 10 per e-mail a day. Free stickers never go into a priced pack. The overview counts free downloads apart from
  sales. Test: `node test/free.test.cjs` (part of `npm test`).
- Printed pieces (Nov 2026): the admin offers a piece printed in its product sheet ("النسخة المطبوعة": on, price, size in both
  languages → `extra.print`); the printed calendar's price is `prices.calendarPrint` (empty = not offered). Shipping countries are
  the UAE and Denmark (`COUNTRIES` in `worker/src/shop.js`), each switched on with a fee and delivery time in Settings; a country
  is offered only when it is on and has a fee (migration 0009 starts both with no fee, so shipping is closed until set). Bag lines
  carry `fmt:'print'` and `q` (1-10); checkout asks for the address (postcode only for Denmark), the server prices everything and
  sends PayPal the item total, shipping and address. Print lines have no files. Orders: "للشحن" filter, parcel state
  (to_print / sent / delivered) with tracking; "sent" e-mails the buyer. Test: `sh test/local.sh paypal` + `node test/ship.test.cjs`.
- Images: one clean set in `web/assets` (`python3 tools/web_assets.py`). Watermarked copies (old `assets/*.jpg` with the tiled
  "MASS & GRASS © FARAH AL HELOU" mark, `pmoon`, `ppoppies`, `ptree`, `s-dove`, `s-gaza`, `s-heart`) are not used. Farah's own
  sticker sheet from Drive gives ten die-cut stickers. "Blue Poppies" was the same painting as "White Dove" and "Little Tree"
  had no clean scan: both left the catalog; "Bike Ride", "Snow Globe" and "The Boatman" joined the paintings.
- Still missing from the owner: 8 calendar months (Jan, Feb, Mar, Apr, Jun, Jul, Oct, Nov) and the sale files (hi-res PDF/PNG)
  for every piece; the admin's overview lists the pieces without a file.
- Admin (`/admin/`, "دفتر المتجر"): overview with real figures and a before-launch list, orders, products and their files,
  customers, subscribers, messages (the help form is now saved in the database), pages (hide, sections, every text in both
  languages, versions), image library, settings (prices, links), security (two-step sign-in, devices, password, audit log).
- Security added in the Worker: CSP without inline scripts, HSTS preload, COOP/CORP, audit log (`audit_log`), two-step sign-in
  (TOTP + ten recovery codes) for accounts with a password, 8 tries per account per 15 minutes, sessions with device and
  address that can be ended, admin sessions of 7 days, server-side product names in orders, constant-time order secrets.
  The seed's sample "sold" figures were reset to what paid orders say.
- Tests: `cd worker && sh test/local.sh`, then `npm test` and `node test/e2e.test.cjs`; with `sh test/local.sh paypal`, `node test/pay.test.cjs`
  and `node test/ship.test.cjs` (each on a fresh database). The security test runs last in `npm test` because it uses up the sign-in limit.
- Preview of the rebuilt site (static, built-in catalog, no server): https://claude.ai/artifact/6P2BSgN7w62h8C7mYAkjo2
  (publish `web/index.html` with root `web` and every other file of `web/` except `_src/` and `admin/` as `files`). The admin
  needs the Worker, so it is shown to the owner as screenshots (Playwright against `sh test/local.sh`).

## The light system (Nov 2026, in progress): after getartcraft.com

- The owner rejected the torn-paper collage and a dark watercolour-wash direction, and pointed at https://getartcraft.com:
  a light sheet (`--cream` #F3F2EE), hair-line rules framing cells, square corners, black square buttons (blue on hover),
  bold tight headings, and things in orbit around the name. Ours adds a hand face (`--hand`: Caveat + Aref Ruqaa) for the
  names under pieces and small asides. Tokens and shared parts: `web/assets/css/site.css`; tiles: `tiles.css`.
  The old token names are kept and remapped; `MG.tear` does nothing now and `.tape` is hidden. `DESIGN.md` still
  describes the collage and must be rewritten once the pages are all moved.
- Done: header (Home, Shop with a dropdown, Story in the middle), compact footer with the social links (`#soc`, from the
  admin's links; e-mail always), share button on every tile (`MG.shareBtn`; the phone's share sheet, else a menu), share
  pages `/s/<kind>/<id>` in the Worker (the piece's own title and picture), home page (orbit hero, collections, the large
  calendar stage with the four mock-up views, "just in" mosaic, story). "Calendar" carries no year in section names.
- Second round (the owner found the orbit hero a copy of the reference and not selling): the hero is now "the wall", a real
  photograph of a frame (`wall-l`) in which the chosen painting hangs (`#hang`, eight thumbnails, name in the hand face, add to
  bag, share, "see it closer"). `web/assets/js/mock.js` (on every page, after `core.js`) holds: `MG.mock` (every piece in a real
  photograph: rooms for paintings, hands for postcards, laptop / notebook / phone for stickers, the calendar's four photographs),
  `MG.peek(kind,id)` the quick view any `[data-peek="kind:id"]` opens (tiles, just-in, the hero), the reveal on scroll
  (`.rv` → `.in`: up 28px out of an 8px blur, staggered, as on the reference; the selector list is `RV`), and the colour chart
  that follows the scroll (`.rail`: pencil rule, a stroke of paint growing in the section's pigment, a drop with the percent in
  the hand face, the sections as swatches; under 1180px it is a thin stroke under the header). Scroll fraction is `--sf`
  (never `--f`, which is the font token). Footer has a "Contact and support" column (`#ftc`).
- Third round (Nov 2026): the owner wants Risotto Studio's way of showing products with ArtCraft's colours and simplicity,
  one piece at a time. The menu is done first, as on getartcraft.com: one 48px ruled bar, the logo in its own cell, HOME / SHOP /
  STORY on the left in Geist Mono 11px capitals spaced .15em (`--mono2`, self-hosted `web/fonts/geist-mono-latin-*.woff2`, OFL;
  Arabic stays Readex Pro 14px, no capitals), the current page in a small ink box (a background, no extra element), SHOP drops a
  bordered list (hover with a mouse, click otherwise), then SIGN IN, the language cell and the ink BAG cell with its count. Phones:
  logo cell, language cell, bag icon cell, black menu cell; the menu is a sheet under the bar (shop pages indented under a grey
  label, BAG as an ink row, SIGN IN / HELP at the foot). Never put backdrop-filter on the header: it traps the fixed phone menu.
- Header icons (after Risotto's Lordicon icons, drawn by us because the CSP blocks outside scripts): the account (`.acct.ico`,
  a plain cell; signed in it shows the name's first letter in `.ini`) and the bag (`.bagb.ico`, the ink cell with its count;
  the plain `.bagi` cell on phones) are pen-line SVGs (`.ic`, `pathLength=1`); on hover the lines are drawn again and the
  head nods / the bag swings on its handle; `bump()` adds `.hop` so the bag swings when a piece goes in.
- Next, page by page with the owner: paintings, postcards, stickers, calendar, story, checkout/account; admin charts;
  the admin's link fields for facebook / tiktok. Not deployed yet.
