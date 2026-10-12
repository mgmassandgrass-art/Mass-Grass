# Changelog

## 2026-08-02 — re-voicing an existing cut (Annie), and HeyGen latency

Third and fourth passes on the AI-datacenter explainer: full-frame presenter A-roll, then a
complete re-voice by a different avatar. Both fed back here.

**Full-frame A-roll beats the matted overlay for this format.** V1 used `outputFormat: "webm"`
alpha to float the presenter on the canvas; Moe wanted a genuine cut to the real talking-head
shot instead. Both are now documented in `references/heygen-mcp.md`, but the default for an
explainer should be the full-frame cut: it reads as normal A-roll and needs no compositing.
Slice each clip to START on its scene cut so the A-roll IS the cut, not a second cut 0.14s
after it.

**Re-voicing is a time warp, not a re-author.** When the script text is unchanged and only the
delivery differs, warp every timeline position piecewise-linearly between word starts. A
reusable implementation now lives at
`projects/ContentCreation/explainer-shorts/ai-datacenter-power-bills-16x9-annie/retime.py`.
It moved 112 positions across a 51.23s -> 69.70s change with every scene cut still landing on
its beat. Snap `.set()` positions to the frame grid, leave tweens as floats.

**Dependent windows must be re-derived together.** The caption backing plate is gated to the
A-roll windows. After the warp, one A-roll window was nudged by hand and the plate was not —
so the plate switched off while the presenter was still on screen and dark caption text landed
on her hair and a yellow chair. If B tracks A, never adjust A alone.

**HeyGen operational facts worth knowing before you plan a build:**
- `create_speech` (standalone TTS) needs **'api' credits**, a different type from the
  premium credits that cover `create_video_from_avatar`. On a Team plan it returns 402. Get
  narration out of a full-length avatar render instead and cut the A-roll from that same file.
- **Long renders are slow and silent.** A 69.7s Avatar IV job sat in `processing` for ~100
  minutes with no progress field, while 1-3s clips finished in ~90s. Other jobs completing is
  NOT evidence yours is stuck. Budget for it or split from the start — but do not do both, as
  the fallback split here cost ~25 credits and the original completed minutes later.
- The API's `duration` field **under-reports** the delivered file (1.07664 vs an actual
  1.120s). Always `ffprobe` the download before setting `data-duration`.

## 2026-07-28 — HeyGen presenter A-roll, first real run

`references/heygen-mcp.md` (SHARED with product-video, all copies synced) rewritten against the
live MCP. Everything below came from adding avatar A-roll to the 16:9 AI-datacenter explainer.

- **The documented tool names were wrong.** The file listed `generate_avatar_video`,
  `get_avatar_groups` and `get_remaining_credits`; the server actually exposes
  `create_video_from_avatar`, `list_avatar_groups` / `list_avatar_looks`, and `get_current_user`
  (no credits tool at all). Corrected, with a note that the look `id` is the `avatarId`.
- **New: lip-sync to narration you already have.** Slice the existing VO and pass it as
  `audioAssetId` instead of generating from `script`. Keeps the original cloned voice, one
  audio track, and every word timing and cut point — the avatar becomes a pure visual layer.
  Includes the upload dance (`create_asset_upload` → PUT → `complete_asset_upload`) and the
  re-encode-don't-stream-copy note.
- **New: `outputFormat: "webm"` for a real alpha channel**, which is what lets a presenter sit
  inside a motion-graphics piece rather than in a video box. Documents the gotcha that reads as
  failure: `ffprobe` says `yuv420p` and a naive `overlay` renders black, because the alpha is a
  VP9 side-channel — check `alpha_mode` in the container and decode with `-c:v libvpx-vp9`.
- **New: captions vs presenter.** `data-track-index` can beat DOM order for stacking, and dark
  caption text on dark clothing is illegible regardless of z-index. Fix is a backing plate in
  the canvas colour with a gradient top edge (a solid one slices the torso).
- Noted that clips return at **25fps**, so `data-duration` rarely lands on a 30fps frame grid.

Verify the avatar by downloading its `preview_image_url` and looking at it — a name says
nothing about wardrobe, and users pick by appearance.

## 2026-07-27 — inherited fixes from the sibling product-video build (Sevenposts)

Two changes reached this skill from a `product-video` run rather than an explainer build.
Both are renderer-level or policy-level, so they apply here unchanged.

**`references/render-rules.md` gained "Three lint traps that cost a cycle."** The shared file
now documents `duplicate_media_discovery_risk` (the same `src` reused for a visual callback —
copy it to a second filename), `overlapping_gsap_tweens` (split travel and opacity so each
property has one owner at a time), and `system_font_will_alias` (fires on a system font used
only as a *fallback*, e.g. `'Archivo Black', Impact, sans-serif`). None break a render; each
otherwise costs a check-fix-recheck loop. The section is byte-identical in both skills.

**Narration section 6 rewritten: the voice sets the runtime, never the reverse.** Generate at
native speed; correct only with the provider's own speed parameter in a natural 1.0-1.1 range;
never time-stretch after the fact; and treat "sub-60-second" as a description of the format
rather than a threshold to hit. Never pad a script, insert filler pauses, or regenerate a good
read because the total came in under or over a number — fix length in the script instead.
Provider-agnostic, since narration here may come from HeyGen, ElevenLabs, or local TTS.
Prompted by a sibling build that regenerated a perfectly good 18.8s voiceover purely to clear a
20s floor. See `decisions/log.md` 2026-07-27.

Deliberately NOT imported: the light-palette vignette recipe added to `product-video`'s gate 3.
This skill's canvas is a flat cream field with halftone texture rather than a vignette, so the
failure mode does not arise. Worth revisiting only if a future variant introduces a gradient
background.

## 2026-07-27 — production learnings from the AI-datacenter build

First full production run of this skill (a 51s explainer on AI data centers and PJM
capacity prices, shipped in 9:16 and 16:9). Everything below is a defect that actually
shipped and had to be caught by frame review, or a technique that produced a visible
quality jump. Four of the five "silent failures" passed `hyperframes check` completely
clean.

### Added

- **`scripts/qc.py`** — the whole render QC gate in one command: spec + audio-present
  check, blackdetect, per-frame luma sweep, cut integrity (single-frame-swap test),
  platform-UI safe-band check, and two contact sheets. Non-zero exit on failure.
  Validated against a deliberately broken render: it caught injected black frames, an
  off-by-one cut, and safe-band intrusion. Replaces the hand-rolled ffmpeg snippets that
  were being rewritten from scratch on every run.
- **`assets/us-map.js`** — prebuilt real US state borders (lower 48 + DC), Albers Equal
  Area Conic, ~28KB, with a centroid table. Makes accurate maps essentially free.
- **`scripts/make_us_map.py`** — regenerates the above for other geography. Carries
  orientation assertions, because a sign error in the y term renders the country upside
  down and survives a casual look.
- **`references/data-and-maps.md`** — chart-type-per-beat selection, line/donut/stacked
  geometry recipes, callout-vs-line collision checking, and the full real-map approach
  including why tile services (Mapbox/Leaflet/Google) cannot work under a deterministic
  seek-based renderer.

### Changed

- **`render-rules.md`** — new "five silent failures" section: rounded cut times firing a
  frame late (`frame/fps - 0.001`), `<audio>` without an `id` rendering silent, GSAP
  resolving `transformOrigin` against an SVG element's own bbox, headline text wrapping
  silently into the caption band, and chart scenes leaving a blank cut frame. Verification
  section now points at `qc.py` and explains why the luma-delta test proves a hard cut.
  Rule 9 gained the caveat that `allow-overlap` also blinds the checker to real collisions
  inside the element carrying it.
- **`SKILL.md`** — bundled-tools table; research section now requires reading numbers in
  the primary document (with `pdftotext` guidance), verifying subagent findings personally,
  scoping every on-screen figure, keeping single-sourced numbers off screen, and surfacing
  the strongest counter-source; narration section wires up the `<audio>` element; timing
  section prefers the TTS provider's own alignment (e.g. ElevenLabs `with-timestamps`) over
  re-transcribing; QC section runs the gate and sets the expectation that a first pass finds
  real defects; delivery section adds the 16:9 derivation.
- **`vox-visual-language.md`** — pointer to `data-and-maps.md` and the rule that chart form
  must vary beat to beat.
- **`template/README.md`** — frame-exact cut arithmetic, and the note that the
  "land composed" rule bites hardest on chart scenes, where the axis is what lands.

## 2026-07-27 — shared-file maintenance (close-out)

- **`scripts/qc.py` gained `--dark` and `--silent-ok`.** The sibling `product-video` skill
  adopted the gate and it threw two false failures on a correct render: a dark premium palette
  read as 1350 "near-black" frames, and an intentionally silent B-roll deliverable failed the
  audio check. `--dark` lowers the near-black floor from 60 to 12 (a real capture failure still
  reads ~0-5); `--silent-ok` skips the audio check. Defaults are unchanged, so explainer runs
  behave exactly as before.
- **`references/render-rules.md` and `references/heygen-mcp.md` now carry a SHARED FILE header.**
  Identical copies live in `product-video`. They had already drifted once (product-video was
  missing the entire "five silent failures" section). Duplicated rather than symlinked because
  each skill ships standalone. **Edit one, copy to the other, every time.**

## 2026-07-27 — sharpness rule added (measured on this skill's own template)

`render-rules.md` gained a **Sharpness** section, shared with `product-video`. Two measured
causes of soft type: 3D rotation (~half the sharpness; settle tilt to exactly 0° for text
close-ups) and scaling a layer above 1.0.

**This skill is largely immune to the first** — it uses no `rotateX`/`rotateY`, no
`perspective`, no `preserve-3d` anywhere. The paper-cut style is genuinely 2D.

**It is mildly exposed to the second.** The template's S1 Ken Burns push (`#s1` scale
1.0 → 1.04) measured **0.89x** the sharpness of the same frame with the push removed, at
portrait-4k. Real but modest, and confined to one scene. Left in place for now because the
drift suits the artifact-first cold open; the documented fix if it ever matters is to author
that scene at `canvas x 1.04` and rest it at `scale(0.962)` so the push ends at native rather
than exceeding it.

## 2026-08-08 — issues found on the first 16:9 landscape build (not yet fixed in the skill)

Surfaced by the HeyGen Video 183 intro B-roll build (9 scenes, 1920x1080), which copied the
template as its starting scaffold.

- **`.cutout` polygon is 9:16-tuned.** ~1% point variance is 3-5px on a 700px landscape card —
  invisible. The cards render as plain rectangles and the paper-cut identity is lost entirely.
  A 16:9 build needs ~0.4-2.8%. Consider shipping a second polygon, or documenting that the
  variance must scale with the element.
- **`--paper-2` (#E8E1D4) does not separate from the canvas at 1920.** A cream card on the cream
  field is invisible at native resolution. The fix that worked was the real Vox construction:
  a coloured/neutral field behind the card, larger on every side. Worth adding to
  `vox-visual-language.md` as the default card construction rather than an option.
- **Template pins `hyperframes@0.7.76`; latest is 0.7.89.** Projects scaffolded from it inherit
  the stale pin silently.
- **`README.md` says "Pass `--safe none` for 16:9"** but does not mention `--silent-ok`, which
  every silent B-roll deliverable needs. Without it the gate prints `FAILED: no audio stream`
  on every run and readers learn to ignore the failure line. Worth naming both together in the
  16:9 section.
- **BUILD-DOC drift, general lesson:** a build doc that duplicates the exemplar's `:root` and
  `.cutout` will drift from it, and fan-out subagents copy the doc. Docs should point at the
  exemplar and say it is the source of truth.

## 2026-08-26 — two gate gaps found on the Video 183 avatar rebuilds (not yet implemented)

**1. `qc.py` should lint cut-time precision, not just catch it after the fact.**
The documented rule ("cut times must be `frame/fps - 0.001`, never a rounded decimal") RECURRED
this session in a new variant: a cut authored `8.6667` against frame 260, which seeks at
`260/30 = 8.666666...`, so the clip window opened one frame late and produced a one-frame avatar
dropout. It was the brightest frame in the file (luma 228.1 vs ~206/216 either side), invisible on
a contact sheet, and `check` passed clean. The per-frame luma sweep is what caught it.
Proposed: a static pass over the composition that flags any `set`/window time which is not
`floor(t*fps)/fps - epsilon`, so it is caught before a render rather than after one. A rule that
has now recurred despite being written down is a rule that wants a mechanical check.

**2. `scripts/check-overlap.mjs` (inherited from the MiniMax build) is not portable.**
It is hardcoded to that build's multi-file layout and does not run on a single-composition project
at all. Both rebuild agents had to write their own. Whatever replaces it must: compare PAINTED
LEAVES rather than container boxes, skip subtrees with `opacity:0`, use glyph bounds for text, skip
transformed subtrees (a rotated card's bbox is much larger than its painted parallelogram), and
sample across time (~every 0.2s inside a window) rather than at a few fixed seeks. A single-seek
check passed both builds clean while a real occlusion existed at another timestamp.

**3. Known false positive to document, not fix.** The layout gate reads an avatar `<video>` as an
opaque full-frame rectangle, so any scene carrying an avatar emits `text_occluded` infos that are
false. Verify at native resolution and move on.
