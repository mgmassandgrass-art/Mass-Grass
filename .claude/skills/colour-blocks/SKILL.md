---
name: colour-blocks
description: Mass & Grass "colour blocks" look for shop pages: flat blocks of Gaza colours edge to edge, heavy grotesque type, black pill buttons, Farah's paintings laid on the blocks as white-bordered prints and cut-out stickers. Use when building or restyling a page of the shop in this look (reference page: prototype/home-v3.html).
---

# Colour blocks

The reference page is `prototype/home-v3.html`. Copy its tokens and parts from there rather than from memory.

## Tokens
- Colours: `--blue #2D5BD3` (sea), `--yellow #F7C823` (lemon), `--pink #F59BC0` (sunset), `--red #E5452E` (poppy),
  `--green #1F6B45` (olive), `--sand #E8D5B0`, `--ink #111`, `--cream #FBF4EA` (page and header), `--grey #ECE7DE` (product photo ground).
- Type: Archivo 800 for Latin, Readex Pro 700 for Arabic (`fonts/riso.css`, self-hosted). Headlines are uppercase in English, tight
  tracking (-.03em), line-height .86–.92; Arabic headlines keep normal case and line-height 1.1–1.3. Body is 500 weight.
- Buttons: pills (`.pill`), black by default, `.red`, `.white`, `.blue` variants; small uppercase label. Tags are outlined pills.

## Layout rules
- Sections are full-bleed colour blocks with no gaps or rounded corners; neighbouring blocks never share a colour.
- Split blocks (art | text, 1fr 1fr) stack on phones (≤820px), art first.
- Collection tiles: square, one colour each, art in the middle (prints get a white 8–12px border and a hard offset shadow
  `8px 9px 0 rgba(0,0,0,.2)`), a white pill label at the bottom centre.
- Product grids: 1–2px ink lines between cards (grid gap on an ink background), grey photo ground, name + price + round "+" button.
- A black marquee band can separate the hero from the rest (CSS animation, reversed in Arabic).

## Motion
- Springy ease `cubic-bezier(.34,1.56,.64,1)` for pops, hovers and button presses; `cubic-bezier(.2,.8,.2,1)` for wipes.
- `.pop` (scale + fade, staggered with `--i`) for tiles and cards; `.wipe` (clip-path from the top) for big headlines;
  hero lines slide up on load. Clipped elements are observed through their parent (IntersectionObserver ignores them otherwise).
- Hover: art scales ~6% and tilts 2–3°; pills lift 3px and tilt. Prints bob slowly; stickers sway.
- Everything still under `prefers-reduced-motion`.

## Keep
- Real paintings and photos only, never drawn imitations of objects.
- Standard Arabic copy, plural imperatives, Western digits; every text has `data-ar`.
- mg.js hooks: `header nav a[href=shop.html]`, `header .tools`, `#bag`, `footer form.news`, `footer .legal`. On a light footer,
  override mg.js's cream footer colours with `html body footer …` selectors.
