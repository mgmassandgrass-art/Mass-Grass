# Redesign (preview build, not live)

Sources for the new site that is being designed as artifact previews. Nothing here is served:
`_redirects` sends `/redesign/*` home.

Build: `python3 redesign/build_site.py "$PWD/redesign"` → `redesign/site/` (21+ linked pages).
Then serve `redesign/site` with `python3 -m http.server` or publish it as an artifact.

- `design/full-*.html`: the designer's original pages (input).
- `shared/catalog.js`: products, automatic SKU codes (`MG-<TYPE>-<DESIGN>-<OPTIONS>`), basket.
- `shared/chrome.js`, `shared/gen_pages.py`: shop, books, info pages.
- `site_extra/`: real product photos (garments, objects, envelopes), pencil versions, page-flip.js (MIT).
