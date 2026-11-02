# Design System: Mass & Grass (collage direction)

The locked system for every new page and section of the Mass & Grass shop: Farah Al-Helou's
watercolours from Gaza, sold as files people print at home. The source lives in
`drafts/collage/` (`index.html` holds the tokens; pages are built with `build_pg.py`).
Read this before designing anything; the design skills (Hallmark, impeccable, taste, ui-ux-pro-max,
typography-scale-builder) work inside it, not around it.

## 1. Visual Theme & Atmosphere

Torn-paper collage on a warm table: every surface is a piece of paper with a ragged edge
(`.paper` + `data-tear`, a seeded clip-path), a fibre texture multiplied on top, and a soft shadow
under it. Calm, light and handmade. The paintings are always the heroes; type and paper frame them.
Real photographs only for objects (mockups of rooms, hands, laptops, envelopes): never drawn or
code-built imitations of real things. Motion is gentle (fades, a slow lift, paper falling into place).

## 2. Color Palette & Roles

All colours are tokens on `:root`; nothing is written as a literal past the token block.

### Primary foundation
- `--cream` #F3EEE4: the table, the page background.
- `--paper` #FBF8F2: prints, cards, sheets, dialogs.
- `--paper-white` #FFFDF8: the white of a printed card or calendar page (never pure #fff).
- `--ink` #22201C: text and the solid button. `--ink-rgb` for shadows: `rgba(var(--ink-rgb), .3)`.
- `--soft` #4E4A43: secondary text, captions.

### Accent and paper colours (used sparingly, as pieces of torn paper)
- `--terra` #C4593F, `--indigo` #3F6E9F (focus ring), `--mustard` #D7A63A, `--olive` #56683F, `--kraft` #B88D60 (footer).
- Section tints: `--c-e9e1d2` (try-on / write desks), `--c-e2d6c0` (support sheet), season tints on the calendar.

### Functional states
- Focus: 3px `--indigo` outline, offset 3px, instant.
- Disabled: fill `--c-e9e0ce`, ink `--soft`, `cursor: not-allowed`, plus the `disabled` attribute.

## 3. Typography Rules

Fonts: Figtree (English), Readex Pro (Arabic), IBM Plex Mono only for figures and code.
Scale: ratio 1.25 on a 17px body, fluid at display sizes. Components use the roles, never raw sizes.

| Role | Token | Size | Use |
|---|---|---|---|
| display | `--fs-display` | clamp(50px, 7vw, 104px) | page title on a hero |
| h1 | `--fs-h1` | clamp(44px, 6vw, 88px) | page titles |
| h2 | `--fs-h2` | clamp(32px, 4vw, 56px) | section titles (`h2.big`) |
| title | `--fs-title` | clamp(28px, 3vw, 44px) | dialog and viewer titles |
| h3 | `--fs-h3` | clamp(24px, 2.4vw, 34px) | card and chapter titles |
| h4 | `--fs-h4` | clamp(20px, 1.6vw, 22px) | small headings |
| figure | `--fs-figure` | 32px | prices |
| lead | `--fs-lead` | 19px | the one intro sentence |
| body | `--fs-body` | 17px / 1.55 | text |
| small | `--fs-sm` | 15px | nav, buttons, meta |
| caption | `--fs-caption` | 13px | captions |

- Headings: weight 800 (Arabic 700), tight leading (.95 to 1.1), negative tracking at display sizes, `text-wrap: balance`.
- Labels, nav, captions and tags: body face, a step smaller, sentence case, never tracked capitals or eyebrows.
- No middle-dot meta strings and no arrows glued to link text; typographic quotes (’ “ ”).
- Numbers in Western digits in both languages. Arabic copy is فصحى, imperatives plural.

## 4. Component Stylings

### Buttons
- `.ink`: solid ink pill, `--fs-sm`, min-height 46px, nowrap. The one primary action per screen.
- `.tbtn`: a torn paper button (`.paper` + `data-tear="3"`), for secondary actions and prev/next.
- `.go`: a text link with a 1.5px underline, no arrow.

### Prints, cards and sheets
- A painting is shown as a print: `--paper` border (3 to 4%), slight rotation (-1.6deg to 1.6deg), soft shadow; it lifts on hover.
- Notes and labels are small torn papers in a tint (`.note`, `.tag`), rotated a little.
- Dialogs are a torn `--paper` sheet with a round ink close button at the corner.

### Navigation
- Header: logo, sections in a line (sentence case), language toggle, bag. On phones (900px and under) a three-line button opens a full-screen paper menu.
- The bag opens a small paper note; its count lives in the browser and follows the visitor between pages.

### Inputs and forms
- 1.5px ink border, 3px corners, `--paper-white` fill, indigo focus ring; a form only says thank you after the server answers.

### Mockups (shared method)
- Real scenes from Canva, exported at full size through page 46 of design `DAHWgLZfDEc`.
- The blank card or page is measured as fractions of the photo (`x, y, ww, wh`); the art is printed into it with `mix-blend-mode: multiply` and a white print border.
- Fingers and pins on top come back as a `-top.webp` overlay cut with GrabCut (skin seeds plus card seeds).
- Stickers on objects are drawn on a canvas; on a cylinder each column follows the curve and takes the bottle's light.

## 5. Layout Principles

### Grid and structure
- Container `.wrap`: max 1180px, centred, gutters clamp(16px, 6vw, 72px). Image tracks use `minmax(0, 1fr)`.
- Two-column sections share one gap: `--col-gap` clamp(28px, 5vw, 80px).

### Whitespace
- Spacing on a 4px scale. Between sections `--sec` clamp(64px, 8vw, 112px); heading to content `--gh` clamp(28px, 3.2vw, 48px).
- About 80 words per screen; the intro is a heading, one sentence of 12 words or fewer, and its action.

### Responsive and touch
- Tested at 1440 and 390, in Arabic (RTL) and English. No horizontal scroll (`overflow-x: clip` on html and body).
- Touch targets 44px or more; everything visible with scripting off (`.js` gates the hidden states); every animation has a reduced-motion fallback.

## 6. Notes for generating new pages

- Describe the page as objects on a table: prints, envelopes, a wall calendar, stickers on a sheet.
- Start from the painting, not from the text. One idea per section.
- Run `node .claude/skills/hallmark/scripts/sloplint.mjs drafts/collage/<page>.html` before showing a page; fix every FAIL.
