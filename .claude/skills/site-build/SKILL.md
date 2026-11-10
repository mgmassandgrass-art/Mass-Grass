---
name: site-build
description: Build, run and check the Mass & Grass site (web/) and its Worker. Use when adding or changing a page, a product, an image, a text or the admin, or before showing or deploying the site.
---

# Building the Mass & Grass site

Read `web/README.md` first (layout, `MG`, catalog). `DESIGN.md` is the design system.

## Change a page
1. Edit `web/_src/pages/<name>.html` (markup), `web/assets/css/<name>.css`, `web/assets/js/<name>.js`.
2. `node tools/build-web.mjs` (rebuilds every page; fails on an inline `<script>` or `<style>`).
3. Text is bilingual: English in the element, Arabic in `data-ar`; in scripts `MG.t('English', 'عربي')`. Arabic is فصحى,
   imperatives plural, Western digits. Only `t('…','…')` pairs with plain quoted strings are editable from the admin.

## Add a page
Create `_src/pages/<name>.html` with the JSON first line, its CSS/JS in `assets/`, build, then `node worker/tools/manifest.mjs`
(the admin's page list and image library come from that manifest).

## Add or change products
- In the shop for real: the admin (`/admin/#products`), which also holds the files buyers receive.
- In the built-in list: `web/assets/js/catalog.js`, an image `assets/<id>.webp` (+ `t-<id>.webp`), then
  `node worker/tools/catalog-sql.mjs > worker/migrations/00NN_catalog.sql`.
- Never add an image with a watermark or a drawn imitation of a real object.

## Check before showing
```
cd worker && sh test/local.sh            # terminal 1
cd worker && npm test && node test/e2e.test.cjs   # terminal 2: must end with "all passed" three times
for f in web/*.html; do node .claude/skills/hallmark/scripts/sloplint.mjs $f | tail -1; done   # 0 FAIL each
```
Then look at the page at 1440 and 390, Arabic and English (Playwright screenshots), before telling the owner it is done.

## Security rules that must stay true
- No inline scripts; the CSP is `script-src 'self'` (+ Cloudflare's analytics host). Do not loosen it.
- Prices, product names and totals are computed by the Worker; the browser's numbers are never trusted.
- `/admin/` and `/api/admin/*` answer only the admin (role admin AND the `ADMIN_EMAIL` address); everyone else gets a redirect or 404.
- Every admin change and every sign-in is written to `audit_log`. New admin endpoints go through `api()` in `worker/src/index.js` so they are logged.
- Never deploy, and never put keys or passwords in the chat or the repo. Deploy only when the owner asks (see CLAUDE.md).
