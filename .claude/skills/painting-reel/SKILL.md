---
name: painting-reel
description: Make a short vertical reel where figures leave Farah's paintings (laid as prints on the paper table) and travel together to the MASS&GRASS logo. Use for launch teasers, Instagram/TikTok reels, or any "the painting comes alive" video from the real scans.
---

# Painting reel

A reel built from Farah's real scans: prints lie on the paper table, figures are cut out of
them (leaving a cut-out hole in the print), move along the table and meet at the site's real
logo. Code in `tools/reel/`; sound in the `reel-sound` skill. The first reel ("the snow
globe", Oct 2026) is the reference: `tools/reel/reel.html`.

## Rules the owner set

- **One direction.** Everything travels right-to-left on one line; nothing ever goes back.
  The camera only pans one way (it may zoom). New figures join a procession led by the first one.
- **Real art only.** Only Farah's own scans and cut-outs, never AI-redrawn figures. The logo is
  `prototype/assets/logo.svg` (the one on the live site).
- **Clean cuts.** No paper halo, no stray specks, no holes inside a figure (see "Cutting").
- **Strong motion.** Anticipation squash before every leap, stretch on launch, arcs, a damped
  spring on landing, lean into the direction of travel, wing flaps, motion blur.
- **A loud moon.** Night scenes need a real light source: bright core, rays, a light pool.
- **Sound for everything** (music + an effect per action), synced to the events.

## Source scans

Google Drive folder from the owner (`Work/Art/ART`): `IMG_99xx` photos of the paintings,
mostly JPEG-in-DNG (download with the Drive tool; the result is saved to a JSON file whose
`content` is base64), a few HEIC (`pip install pillow-heif`). The two raw DNGs (18–25 MB) were
not needed. Keep scans in the work dir, never in the repo: they are unwatermarked originals.

## Pipeline

Work dir: `REEL_WORK=<scratchpad>/reelwork` with `drive/` (scans), `cut/`, `a/` (renderer assets).

1. **Cut** – `segment.py`: SAM point prompts (`rembg` session `sam`) on a crop around each
   figure; `EL` holds painting, crop box and positive/negative points (fractions of the image).
2. **Refine** – `refine.py`: keep the big components, fill holes, close, then closed-form alpha
   matting (`pymatting`) on a ±6 px trimap and foreground colour estimation (kills the paper halo).
3. **Hidden parts** – `whale.py` shows how to finish a figure that another one covers: colour-mask
   the visible paint, spline a silhouette, fill the gap with the figure's blurred colours + grain,
   and redraw the ink outline and back spots across the bridge. The hole left in the print is the
   visible part only.
4. **Prep** – `prep.py`: scales prints to 1400 px, writes `el_*.png`, `hole_*.png`, the manifest,
   the paper texture and the logo into `a/`.
5. **Animate** – `reel.html`: `render(t)` is deterministic; `frame(t)` averages 5 sub-frames
   (180° shutter) for motion blur. `?assets=a` path; open it directly for a live preview.
   - Layout: `PR` (one row of prints, x decreasing), `ROAD`/`SKY` lanes, `LOGO` at the end.
   - Timing: the lead figure's drive is a trapezoid speed profile (`drive()`), and every beat is
     derived from where it is (`tAtBus`), so changing speed keeps everything in sync.
   - `st(name, t)` returns each figure's state; helpers `squash`, `land`, `arc`, `lean`, `wiggle`.
   - Check any later figure only moves left: wake it after the leader has passed (see `B.small`).
   - `window.EVENTS` lists every action with time and stereo pan for the sound.
6. **Render** – `capture.py video out.mp4` (Chromium via Playwright, `executable_path` =
   `/opt/pw-browsers/chromium`) writes `out.mp4` and `out.events.json`. ~6–8 min for 30 s.
   `capture.py stills 2.5 9 18` for quick checks (make a contact sheet and look at it).
7. **Sound + mux** – see `reel-sound`.

## Checks before sending

- Contact sheet of stills every ~1.5 s: framing, nothing reversing, holes look like cuts.
- `ffprobe` duration, 1080×1920, 30 fps; audio spectrogram with event markers.
- Send with `SendUserFile` (the owner watches on the phone); keep it under ~20 MB (crf 23).
