# The collage direction (preview, not live)

The torn-paper collage version of the shop, built section by section with the owner.
Its design system is `DESIGN.md` at the repo root.

- `site/index.html` is the home page and holds the shared head (tokens, header, footer, shared JS).
- `parts/<p>_main.html`, `<p>_css.txt`, `<p>_js.txt` are the other pages: `pg` paintings, `pc` postcards,
  `sk` stickers, `st` story (map), `ca` calendar.
- Build a page: `python3 build_pg.py <p> <out.html> <Title> <out.html>` (run from this folder), e.g.
  `python3 build_pg.py ca calendar.html Calendar calendar.html`.
- Check it: `node ../../.claude/skills/hallmark/scripts/sloplint.mjs site/<page>.html` (0 FAIL), then
  Playwright at 1440 and 390, Arabic and English.
- Preview artifact: https://claude.ai/artifact/4saBPLwjywiwbG2kMfHHkH (publish `site/index.html` with the
  other pages and assets as `files`, root `site`).
