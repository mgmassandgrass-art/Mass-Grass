# explainer-shorts template — the locked exemplar

A verified, rendering, lint-clean 12-second composition proving the whole visual system. **Copy this scaffold and swap the content.** Do not invent a new structure per video.

Verified 2026-07-27: `check` 0 errors / 0 warnings, contrast 19/19 AA, renders in ~19s, no black frames, luma 198-216 across the timeline.

```bash
npx hyperframes check
npx hyperframes render -q high --crf 16 -o renders/exemplar.mp4
```

## What each scene proves

| Scene | Window | Techniques |
|---|---|---|
| S1 hook | 0.0-4.0s | torn-edge `clip-path` cutout, two-shadow stack, halftone fill, staggered line reveal, highlighter sweep, subtle 104% push-in |
| S2 map | 4.0-8.0s | `strokeDashoffset` route draw, staggered pin pops, abstract landmasses |
| S3 chart | 8.0-12.0s | static base first then data, bars build from baseline, accent on the answer bar only |

## The three things this template gets right that a first draft gets wrong

These were all real defects caught by frame-level review, not by the linter. The linter passed clean before every one of them was fixed.

**1. Cuts are `set`, never a short tween.**
```js
tl.set('#s1', { opacity: 0 }, 4.00)
  .set('#s2', { opacity: 1 }, 4.00);
```
A `to({opacity:0, duration:0.08})` is a two-frame crossfade at 30fps. Both scenes render semi-transparent and it reads as an overlap defect. `set` swaps in exactly one frame.

**...and the cut time is `frame/fps - 0.001`, never a rounded decimal.** The 4.00 above is exact only because 4.00 × 30 is a whole number. Frame 56 renders at t=1.866666…, so a cut written `1.8667` is fractionally *past* it and fires on frame 57 — one frame out of sync with the audio, and invisible unless you measure. Rounding down is safe; rounding up is not. Applies to caption `set`s too; tweens ramp and are unaffected.
```js
const cut = f => Math.round(f / 30 * 1000 - 1) / 1000;   // 56 -> 1.8657
```

**2. Every scene lands already composed.** If the incoming scene's elements begin their entrance *at* the cut, the cut frame is blank. Set the hero elements visible on the cut and animate only their scale:
```js
tl.set('#landA, #landB', { opacity: 1 }, 4.00)
  .to('#landA', { scale: 1, duration: 0.40, ease: 'back.out(1.3)' }, 4.00);
```
This bites hardest on **chart scenes**, where the data legitimately should not appear until its trigger word seconds later. The frame of reference is what lands on the cut — axis, gridlines, tick labels, source line — and the data animates on top. A bare axis on an empty field is the same blank-frame defect wearing a disguise.

**3. Frame 0 is composed.** In short-form the first frame is the thumbnail and the scroll-stop. Never open on an empty field. The hero cutout is present at t=0 and only settles its scale.

## Known exception: the S1 Ken Burns push

S1 pushes `#s1` from `scale 1.0` to `1.04`. That scales a composited layer above native and
measures **0.89x** the sharpness of the same frame unpushed (portrait-4k). It is grandfathered
here to keep the template simple.

**Do not copy this pattern into new scenes.** Any new push must be authored big and scaled down
so it ends at native rather than exceeding it. See `references/render-rules.md` §Sharpness.

## Vertical safe zones (1080x1920)

Keep everything meaningful between **y=230** and **y=1536**. Platform UI covers the top 12% and bottom 20%. The first draft of this template put the sub-line and the `4x` value below 1536 and both had to move up.

Horizontal margin is 86px each side.

## Swapping in your content

1. **Keep the `:root` block.** That is the style lock. Change the three colours once, never per scene.
2. **Replace `.cutout` contents.** The yellow halftone block is the slot for an archival photo. Put an `<img>` inside it, keep the `clip-path` and the shadow stack.
3. **Keep the timing shape.** Something changes every 2-4 seconds. One highlighter per scene, on the single most important phrase.
4. **Re-time to real audio.** The 4s/4s/4s split is a placeholder. Transcribe the narration and land each beat ~0.12-0.15s before its trigger word.
5. **Re-verify.** `check`, render, extract frames at 0, every cut, and the busiest moment, and look at all of them.

## Fonts

`fonts/ArchivoBlack-400.woff2` (headlines) and `fonts/WorkSans-var.woff2` (body), both Google Fonts latin subsets, referenced by literal family name because lint cannot resolve `var()` inside `font-family`.

## QC artifacts

- `qc_sheet.jpg` — 11-frame temporal strip across the full timeline
- `qc_keyframes.jpg` — frame 0, and the exact frames on both sides of each cut
