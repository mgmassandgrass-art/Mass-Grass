# The paper-cut visual language

Everything here is implementable in CSS + SVG + GSAP and renders deterministically. The look: **a motion-designed magazine spread, never a filmed scene.**

Flat 2D elements with intentionally imperfect edges, stacked as physical paper on a flat color field. Clarity over realism. Handcrafted over polished.

## Two corrections to the "classic" Vox recipe

The reference material for this style comes from After Effects workflows. Two of its signature moves are wrong for a deterministic HTML renderer, and doing them the AE way will get your video rejected:

**1. Transitions are CUTS, not blur dissolves.** The classic Vox scene change is a camera push plus a blur pulse that masks the edit. Under a seek-based render, a blur crossfade shows both scenes legibly for several frames, which reads as an overlap defect. It also leaves residual inline `filter: blur(0px)` that trips `composition_heavy_overlay_count_high`, a documented cause of all-black captures.
> **Do this instead:** hard cut at 0.10s (three frames at 30fps), pair it with a whoosh, and put the energy into the *incoming* element's entrance. You keep the snap and lose the mush.

**2. The 12fps stutter uses a stepped ease, not a frame hack.** The handmade quality comes from graphics rendered at 12fps inside a 24fps timeline. Do NOT implement this by throttling `requestAnimationFrame`; that is not seek-safe and will render differently every time.
> **Do this instead:** `ease: "steps(6)"` on the tween. Deterministic, seek-safe, and it produces the same chunky quality.
> ```js
> tl.fromTo(".cutout", {scale:0.9, opacity:0}, {scale:1, opacity:1, duration:0.5, ease:"steps(6)"});
> ```
> Use it on a few accent elements, never on everything. Overused it reads as broken, not stylish.

## Construction: the cutout

Every photo, illustration, or shape is a piece of paper sitting on the page.

### Torn edge
Precompute a jagged `clip-path` polygon per asset at build time with a seeded random, so it is identical on every render. Walk each edge, varying point depth **4-14px** at a rhythm of every **3-6%** of the edge length.

```css
.cutout {
  clip-path: polygon(1% 0%, 4% 3%, 9% 0%, 13% 4%, 19% 1%, /* ... */);
}
```

### Shadow stack
Two shadows, not one. A tight dark one seats it on the layer below; a soft diffuse one lifts it.

```css
.cutout {
  filter: drop-shadow(0 2px 0 rgba(0,0,0,.25))
          drop-shadow(0 8px 16px rgba(0,0,0,.20));
}
```
Use `filter: drop-shadow()`, never `box-shadow`, on anything with a `clip-path`. `box-shadow` follows the box, not the cut silhouette.

### Halftone
```css
.halftone {
  background-image: radial-gradient(circle at center, #000 .25rem, transparent 0);
  background-size: 1rem 1rem;
}
```
For a more convincing newsprint feel, layer two radial-gradients offset by half the tile size.

### Grain
One full-frame overlay, not per-asset. Keep opacity **0.08-0.14**; above that it reads as damaged footage.

```css
.grain::before {
  content:""; position:absolute; inset:0; pointer-events:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size:180px; opacity:.10; mix-blend-mode:overlay;
}
```
This is one element with a `filter`, which is cheap. Do not add per-scene gradient stacks on top of it.

### Tape
Optional. A small rotated rectangle (`-6deg` to `4deg`), semi-transparent warm white, at a cutout's corner. Sells "physically stuck down." Use on at most one or two elements per video.

## Typography

Vox's editorial fonts (Harriet, Balto, Alright Sans) are commercial. The free pairing that lands closest:

| Role | Font | Notes |
|---|---|---|
| Headline cards | **Archivo Black** (or **Bebas Neue** for ultra-condensed) | Big, heavy, all-caps for section titles |
| Body, lower-thirds, captions | **Work Sans** (or **Inter**) | Documented close match to Balto |
| Editorial serif accent | **Source Serif 4** | Pull-quotes and chapter cards only |

Bundle as local `.woff2` and reference by literal family name. Lint cannot resolve `var()` inside `font-family`.

### The highlighter (the signature move)
A colored bar sweeps in behind a key word. It is punctuation, so it lands **100-150ms after** the text settles, never simultaneously.

```js
tl.fromTo(".mark", {scaleX:0}, {scaleX:1, duration:.26, ease:"power3.out"}, "+=0.12");
```
```css
.mark { transform-origin:left; background:var(--accent); opacity:.32; }
```
No CSS `transform` on it. `fromTo` owns the whole transform (a `tl.to` over a CSS `scaleX(0)` errors `gsap_css_transform_conflict`).

**One highlighter per scene, on the single most important phrase.** Overused it stops meaning anything.

Other emphasis moves, use sparingly: underline draw-on via `strokeDashoffset`, a marker circle lassoing a number (same technique), a single-word color swap, a 110-120% scale pop on a stat.

## Color

The operating principle is **a limited palette per video**, not one fixed brand scheme. Lock it before writing a single scene, then never drift.

- **1 base**, near-black but never pure `#000` (`#1a1a1a`-`#22242b`) or a warm paper cream (`#f2ede4`)
- **1 topic color**, the dominant field
- **1-2 accents, maximum**, used only for the highlighter, the answer bar, and map pins

Default preset (the combination most associated with the genre): paper cream `#F2EDE4`, near-black `#1A1A1A`, accent yellow `#FFEB00`. Expose the accent as a per-video parameter.

**Photos get desaturated or duotone-mapped into the palette.** Full-color photography breaks a flat 2-3 color system instantly.

**Color means "look here."** In a chart, only the bar being narrated right now carries the accent; every other bar stays neutral gray. Never split the eye with two saturated colors competing.

## Depth and layering

Depth is stacked flat planes, never 3D rendering.

Background field → mid-ground cutouts (each with the shadow stack) → foreground text. Layers move at different rates on a camera push to fake parallax.

- **Entrances scale in place**, 85-95% → 100%. Not flying in from off-screen. Keeps the "paper placed on the table" feel.
- **Camera push-ins** are subtle in vertical: 100% → 104-106%. Big Ken Burns pushes read as sluggish against fast cuts.
- **Reveals use the torn silhouette as the mask** where you can. It keeps the paper metaphor alive through transitions.

## Motion defaults

A small, repeated set of eases reads as intentional style. Reuse these; do not invent per scene.

| Move | Duration | Ease |
|---|---|---|
| Cutout entrance (scale in place) | 0.40-0.50s | `back.out(1.4)` |
| Camera push | 0.50-0.70s | `power2.inOut` |
| Highlighter / emphasis pop | 0.20-0.30s | `power3.out` |
| Word-by-word text reveal | 0.25s, `stagger: 0.05-0.08` | `power2.out` |
| Chart bars building | 0.60s, `stagger: 0.12` | `power3.out` |
| Route / line draw | 1.00-1.20s | `power1.inOut` |

Never `linear` except a genuine progress bar. Never a bare `from()`.

## Data visualization

Three workhorses carry the narrative: **maps, timelines, charts.**

> **Full treatment in `references/data-and-maps.md`** — chart-type selection per beat,
> line/donut/stacked recipes with the geometry maths, and how to put **real Census state
> borders** on screen (prebuilt in `assets/us-map.js`) instead of an abstract blob. Read it
> before building any scene whose job is to show data or a place.

**Vary the form beat to beat.** Three bar charts in one video reads as a slideshow no matter
how good the numbers are. One line chart, one donut, one stacked bar and one map is the same
amount of work and a completely different piece of television.

**Build order is always: static base first, data second.** Axis and labels are already there; the data animates in on top.

```js
tl.fromTo(".bar", {scaleY:0}, {scaleY:1, transformOrigin:"bottom",
  duration:.6, ease:"power3.out", stagger:.12});
tl.to(".bar--answer", {backgroundColor:"var(--accent)", duration:.2});
```

**Routes and timelines** draw via dash offset (no DrawSVG plugin is loaded):
```css
.route { stroke-dasharray: var(--len); stroke-dashoffset: var(--len); }
```
```js
tl.to(".route", {strokeDashoffset:0, duration:1.1, ease:"power1.inOut"});
```

**Maps** are simplified SVG landmass paths, not live tiles. In vertical, crop tight to the relevant region and use 1-3 pins, never a swarm. Small map labels are illegible on a phone; lean on the highlighter and circle-emphasis instead.

**The dot-population unit chart** (100 dots = 100% of a population, dots move and regroup to show a shift) is unusually visceral because viewers estimate proportion directly. Strong pattern, worth reaching for over a bar chart when showing a share.

## Vertical adaptation (the part most people get wrong)

This style was built for widescreen. Porting it to 9:16 under 60 seconds needs real changes, not a reframe.

- **1-2 stacked layers per beat, maximum.** The depth trick relies on stacking, but three labelled layers in a ~430px-wide safe area is noise. Save a full composite for one hero moment.
- **2-5 words per text card.** Headline text runs roughly 15-20% of frame height, far larger relative to frame than a horizontal lower-third.
- **Safe zones:** content in the middle ~80% of width; nothing critical in the top 12% or bottom 20% where platform UI sits.
- **Compress every hold.** A chart that gets 4-6 seconds in a horizontal explainer gets 2-3 seconds here, and gets simplified to a single number or one comparison.
- **Captions are load-bearing, not decorative.** Most vertical viewing is sound-off, so the kinetic text system carries the information and the collage reinforces it. That is the reverse of horizontal.
- **Let cuts carry the energy, not camera moves.**
