# HyperFrames render rules (v0.7.7x)

> **SHARED FILE.** An identical copy lives in the sibling video skill (`explainer-shorts` / `product-video`).
> Edit one, copy to the other. They are duplicated rather than symlinked because each skill ships standalone.
> The ONE legitimate difference: pointers to references that exist in only one skill
> (`glass-material.md` / `camera-and-motion.md` are product-video-only). Diff before syncing so you
> carry real updates across without importing a broken cross-reference.

Author to these from line one. Every rule here is a real failure that shipped and had to be rebuilt. The linter hard-enforces most of them now, so breaking one costs a render cycle.

## The composition contract

One self-contained `index.html`. Root element directly in `<body>`, no `<template>` wrapper:

```html
<div data-composition-id="main"
     data-width="1080" data-height="1920"
     data-fps="30" data-start="0" data-duration="42">
```

One `gsap.timeline({paused:true})`, built synchronously, registered to `window.__timelines['main']`. The framework seeks it; never call `play()`.

## The nine rules that break renders

### 1. Full-bleed background goes on a CHILD, not the root
The producer can drop the root's own background and you get a black frame. Put a `.canvas-bg { position:absolute; inset:0 }` child inside the root, and keep `background:var(--bg)` on the root only as a fallback.

### 2. Anything hidden at frame 0 needs `opacity:0` in CSS
A `tl.set(el, {opacity:0}, 0)` does NOT paint while the playhead sits exactly at 0. Lint calls this `gsap_timeline_set_initial_hide`. Put `opacity:0` in the stylesheet, and set transform initials with an immediate `gsap.set(...)` (not a timeline set). Reveal with `fromTo` or `to`. Never a bare `from`.

### 3. Never animate layout properties
`left`, `top`, `width`, `height` snap to integer pixels and stutter under seek-capture. Lint errors `gsap_non_transform_motion`.
- Slide with `x` / `xPercent`
- Fill a bar with `scaleX` + `transform-origin:left`, never `width`

### 4. No CSS `transform:` on a GSAP-animated element
Errors `gsap_css_transform_conflict`, and `transform:scaleX(0)` counts. Own the whole transform in GSAP: center with `xPercent:-50` / `yPercent:-50` in *every* state. Keep only `transform-origin` in CSS.
Exception: `tl.fromTo` is exempt, and a static element GSAP never touches may keep a CSS `translate(-50%,-50%)`.

### 5. Deterministic state changes must be GSAP-tweened
A `classList.add()` or `textContent` swap will not animate under a paused seek-render. It snaps or renders mid-state unpredictably. Cross-fade two stacked elements with `tl.fromTo` instead.

### 6. Draw lines with `strokeDashoffset`
No premium GSAP plugins are loaded (no DrawSVG, no MotionPath). Set `stroke-dasharray` to the path length and animate `stroke-dashoffset` to 0. Travelling dots animate `attr:{cx,cy}` or plain x/y.

### 7. `<video>` must be a direct child of the composition root
It cannot live inside a scene div that gets opacity-animated. Give it `class="clip"`, `muted`, `playsinline`, `src`, `data-start`, `data-duration`, `data-track-index`. The framework owns show/hide and playback. Do not call play/seek, do not animate its width/height.
A `<video>` windowed LONGER than its source goes black when the source ends. Match `data-duration` to real footage length.

**A clip's `data-duration` window is INCLUSIVE at its end.** A hard cut authored at exactly
`data-start + data-duration` leaves the video visible for ONE frame underneath the incoming
scene, because the framework still considers the clip inside its window at that instant while
your `tl.set` has already swapped scenes. Lint passes, and a contact sheet almost never samples
that single frame.

```html
<!-- cut at 2.70 (frame 81): pull the window in by ~half a frame -->
<video class="clip" muted playsinline src="assets/aroll.mp4"
       data-start="0" data-duration="2.68" data-track-index="1"></video>
```

The source file stays full length, so nothing goes black; you are only asking for slightly less
of it. Verify by extracting the cut frame and the one before it by exact frame number.


### 8. Keep heavy overlays down
`composition_heavy_overlay_count_high` fires when many elements carry `filter` / `radial-gradient` / `clip-path`, and it is a documented cause of all-black captures. Use ONE shared full-bleed background layer, not a per-scene gradient. Watch for residual inline `filter: blur(0px)` left behind by a blur crossfade.

### 9. Mark intentional overlap explicitly
Decorative layering (a highlight bar behind its own text, a status dot on a card) gets `data-layout-allow-overlap data-layout-allow-occlusion`. Entrance moves that start off-canvas get `data-layout-allow-overflow`. Never use these to silence a real collision.

**These attributes also blind the layout checker to real collisions inside the element you put them on.** A stacked caption band legitimately needs `allow-overlap`; adding it there also suppressed detection of a headline that had silently wrapped to an extra line and was running straight through those captions. Scope them to the narrowest wrapper that actually needs them, and never read a clean Layout pass on an element carrying them as evidence it is clean.

## The five silent failures

None of these throw. Four of the five pass `check` completely clean, and each one shipped at least once before being caught by looking at frames.

### A. A rounded cut time fires a frame late
A `tl.set()` fires when the playhead reaches or passes its position. Frame 56 at 30fps renders at t=1.866666…, so a cut authored at the natural-looking `1.8667` is fractionally *later* than that frame and lands on frame 57 instead — one frame out of sync with the audio it was timed to.

**Author every cut and caption `set` as `frame/fps - 0.001`.** Rounding down is safe; rounding up is not. Only `set` calls are affected — tweens ramp, so a one-frame offset there is invisible.

```python
cut = round(frame/FPS - 0.001, 4)     # frame 56 @30 -> 1.8657
```

Prove it afterwards rather than trusting it: `scripts/qc.py --cuts ...` reports each cut as `hard cut` or `DISSOLVE / LATE CUT` from the luma delta, and flags large jumps at frames you did not declare.

### B. `<audio>` without an `id` renders silent
The renderer discovers media elements by id. `class="clip"` plus `data-start` is not enough, and a silent 51-second video looks perfect in every extracted frame.

```html
<audio id="narration" class="clip" src="vo/narration.mp3"
       data-start="0" data-duration="51.2333" data-track-index="0"></audio>
```
Lint does catch this one (`media_missing_id`). `qc.py` fails if the render has no audio stream.

### C. A user-space `transformOrigin` displaces an SVG child
GSAP resolves `transformOrigin` against the element's **own bounding box**, not the SVG user coordinate system. Setting `transformOrigin: '861.8px 269px'` on `<circle cx="861.8" cy="269">` puts the origin far outside the shape, and any `scale` then throws it across the frame. The symptom is a marker that drifts away from geometry it should sit on.

Omit it. GSAP's default (`50% 50%` of the bbox) is already a circle's centre.

### D. Headline text wraps silently into whatever is below
A line one character too wide for its box wraps, every following line moves down, and the last one lands in the caption band. Nothing errors.

Put `white-space:nowrap` on headline lines so an over-wide line overflows *visibly* instead of quietly reflowing, and author explicit line breaks rather than trusting the box to break where you imagined. Archivo Black caps run roughly **0.72em** average (digits nearer 0.6) — wider than most estimates, which is exactly why the first draft wraps.

### E. A chart scene whose data animates in leaves the cut frame blank
Covered fully in `data-and-maps.md`: axis, labels and source land **on** the cut, data second.

## Three lint traps that cost a cycle

None of these break a render, but each one costs a check-fix-recheck loop, and the fixes are
one-liners once you recognise the message.

**`duplicate_media_discovery_risk`** fires when the same `src` appears twice with the same start
and duration, which happens naturally when you reuse one image for continuity (shown in scene 2,
called back in scene 4). Copy the file to a second filename and point the second use at it.
Keeping the visual repeat is right; the compiler just needs distinct sources.

**`overlapping_gsap_tweens`** fires when two tweens touch the same property on the same element
at overlapping times. The usual cause is folding opacity into a long `fromTo` that also moves
something, then adding a separate fade-out that starts before the first tween ends. Split travel
and opacity into their own tweens so each property has one owner at a time:

```js
tl.fromTo('#scan', { x: 0 }, { x: 1100, duration: 1.05 }, 6.40)   // travel
  .to('#scan', { opacity: 1, duration: 0.18 }, 6.40)              // in
  .to('#scan', { opacity: 0, duration: 0.22 }, 7.23);             // out, after travel ends
```

**`system_font_will_alias`** fires on a system font anywhere in a `font-family` chain, including
as a fallback. `font-family: 'MyFace', Georgia, serif` makes the renderer resolve Georgia and
substitute a bundled face. Drop the system font: `font-family: 'MyFace', serif`. Your real
`@font-face` is loading anyway, so the fallback was never doing anything.

## Fonts

Custom fonts are NOT auto-resolved. Add `@font-face` pointing at local `fonts/*.woff2`. Reference families by LITERAL name in CSS; lint cannot resolve `var()` in a `font-family`.
Gotcha: the `font:` shorthand with a leading-dot line-height (`/.92`) is silently rejected by Chrome and text renders tiny. Use longhand `font-size` / `line-height`, or write `/0.92`.

## Rendering

```bash
npx hyperframes check                       # 0 errors before rendering
npx hyperframes render -q draft -o renders/draft.mp4
npx hyperframes render -q high --crf 15 -o renders/final.mp4
```

- Default render outputs at the composition's NATIVE canvas size. A 1080x1920 comp renders 1080x1920 with no `--resolution` flag. The flag only does integer multiples (1080p / 4K).
- **For a true-4K deliverable, render 4K — do NOT upscale in post.** `--resolution` presets: `landscape-4k` (3840x2160), `portrait-4k` (2160x3840), `square-4k` (2160x2160). It raises Chrome's deviceScaleFactor (DPR 2) so the whole composition rasterizes at 2x; aspect must match the composition. 4K is ~4x the pixels and memory-heavy: render **solo**, `--workers 3`, `NODE_OPTIONS=--max-old-space-size=8192`, and wrap in a retry loop (4K trips the `Conversion failed! Try --docker` contention more often). Verify sharpness with native-pixel crops of the zoomed/tilted moments (`crop=W:H:X:Y` with no scale), not a downscaled contact sheet. A 4K render does NOT rescue a layer scaled above 1.0 or a live-glass pane under transform — fix those in the composition first.
- **Render scenes SOLO.** Concurrent 4K renders fail with `Conversion failed! Try --docker` from pure Chrome/ffmpeg resource contention, not a broken composition. Retry alone before touching HTML:
  ```bash
  for a in 1 2 3; do npx hyperframes render ... && break; sleep 3; done
  ```
- **Wait on a DONE marker, never `[ -f file ]`.** An mp4's moov atom is written LAST, so the file exists long before it is playable. Gate on a sentinel the producing script echoes after its last step.

## Muxing audio into the final (the "no audio on playback" trap)

The renderer outputs SILENT video; audio is a separate track you mux in afterward. A file can
have a valid audio stream and still play **video-only** for the user. Two causes, both real:

- **No `+faststart`.** ffmpeg writes the `moov` atom (the stream index) at the END of the file by
  default. On a large 4K master, Finder Quick Look, QuickTime, and most web players cannot locate
  the audio track without scanning the whole file, so they silently play video only — it looks
  exactly like "you forgot the audio." **ALWAYS mux finals with `-movflags +faststart`.**
- **A short or mono track.** Prefer AAC **stereo 48 kHz**, and `apad` the audio to the full video
  length so the track spans the entire clip.

```bash
ffmpeg -i render_silent.mp4 -i vo.mp3 \
  -filter_complex "[1:a]aresample=48000:ochl=stereo,apad=whole_dur=<video_secs>[a]" \
  -map 0:v:0 -map "[a]" -c:v copy -c:a aac -b:a 192k -movflags +faststart master.mp4
```

Verify, don't assume: `moov` byte-offset is BEFORE `mdat`, an audio stream exists, AND it has
real level (`volumedetect`) at several timestamps (start / middle / end), not just that a stream
is present. `-c:v copy` keeps the render untouched, so re-muxing is cheap and lossless.

## Sharpness: what softens a close-up

Two things soften rendered type, both measured with Laplacian variance at 4K on identical text
at identical on-screen size.

**1. 3D rotation costs roughly HALF your sharpness.** Any non-zero `rotateX`/`rotateY` makes
Chrome texture-map the layer, and the resampling blurs every glyph edge. Measured 843 tilted 6°
vs 1798 flat. Extra layout resolution does not help, it makes no difference whether the rotation
sits on the frame or a parent, and 6 degrees already costs the full penalty. **Settle the tilt
to EXACTLY 0° for any close-up where the viewer reads text**; that recovers 99%.

**2. Scaling a layer above 1.0 magnifies its raster.** A scale animation promotes the element to
a composited layer that Chrome rasterizes at layout size and then GPU-scales. Even a subtle
Ken Burns push costs real detail: a scene pushed 1.0 → 1.04 measured **0.89x** the sharpness of
the same scene unpushed. Rendering at 4K does not rescue either problem.

**RULE for any new composition: a push must be authored big and scaled down**, so the camera
never exceeds native. This applies at any magnitude, including a subtle Ken Burns drift.
```
maxZoom 1.04  →  author the scene at canvas x 1.04, rest at scale(0.962), push to 1.0
```
Concretely: give the scene `width: calc(100% * maxZoom)`, `height: calc(100% * maxZoom)`,
`left:50%; top:50%`, then `gsap.set(scene, {xPercent:-50, yPercent:-50, scale: 1/maxZoom})` and
tween `scale` to 1.0. Child coordinates stay in the scene's own (enlarged) space.

If that is more ceremony than the push is worth, drop the push. A static frame is sharper than
a slightly-drifting soft one. Do not ship a bare `scale: 1 -> 1.0x` push in new work.

> **Known exception:** the shipped `explainer-shorts/template/` S1 cold open still uses a bare
> 1.0 → 1.04 push (measured 0.89x sharpness). It is grandfathered so the template stays simple;
> do not copy that pattern into new scenes.

Verify with native-pixel crops (`crop=W:H:X:Y`, no scale) at the deepest point of any push or
tilt, never from a downscaled contact sheet.

## Verifying output

`check` passing with 0 issues does NOT mean it looks right. The inspector only samples text overlap at a few timestamps. It cannot see container overlap, messy mid-transition frames, clutter, or an element that doesn't serve the story.

**Run the bundled gate instead of hand-rolling ffmpeg each time:**

```bash
python3 scripts/qc.py renders/final.mp4 --cuts 56,184,336,506,600 --out qc/
python3 scripts/qc.py renders/final-16x9.mp4 --cuts 56,184,336 --safe none   # 16:9
```

It probes the spec, fails if there is no audio stream, runs blackdetect, sweeps mean
luma per frame, tests every declared cut for the single-frame-swap signature, checks
that the platform-UI safe bands contain nothing but background, and writes two contact
sheets. Non-zero exit on any objective failure, so it can gate a build.

Then **look at both sheets.** The script proves the mechanical half; you still owe the
editorial half — is this a clean, correct visualization of this exact line, and is it
interesting enough to hold a scrolling thumb?

Doing it by hand (the script does this for you):

```bash
# frame-accurate check around a cut. Do NOT use -ss: fast seek is frame-inaccurate
# and will show you a crossfade that is not there, or hide one that is.
ffmpeg -v error -i renders/final.mp4 \
  -vf "select='eq(n\,55)+eq(n\,56)'" -vsync 0 -q:v 2 cut_%02d.jpg -y
```
This ffmpeg build has no `drawtext` (no libfreetype), so print a cell→timestamp map rather than burning labels.

### Why the luma test proves a hard cut
A hard cut puts the entire change into one frame step: a large delta at frame N, then
~0.00 at N+1. A two-frame crossfade splits it across both. That makes "is this a cut or
a dissolve" an objective measurement rather than a judgement call about a JPEG — and it
catches an off-by-one cut, which is otherwise nearly invisible.
