# HeyGen MCP (optional avatar + voice)

> **SHARED FILE.** An identical copy lives in the sibling video skill (`explainer-shorts` / `product-video`).
> Edit one, copy to the other. They are duplicated rather than symlinked because each skill ships standalone.
> The ONE legitimate difference: pointers to references that exist in only one skill
> (`glass-material.md` / `camera-and-motion.md` are product-video-only). Diff before syncing so you
> carry real updates across without importing a broken cross-reference.

**This is entirely optional.** The skill produces a complete, finished video without it. HeyGen adds two things: a real narrator voice, and a talking-head presenter cut into the piece. If the user has not connected it, say so once and carry on with the free path.

## Connecting (one time, ~1 minute)

Remote MCP over OAuth, **no API key**; generation draws on the user's existing HeyGen plan credits.
Endpoint: `https://mcp.heygen.com/mcp/v1/`.
- **claude.ai app:** Settings → Connectors → Add custom connector → paste the URL → sign in.
- **Claude Code (CLI):** `claude mcp add --transport http heygen https://mcp.heygen.com/mcp/v1/ -s user`,
  then `/mcp` to finish the OAuth sign-in, then **restart the session** so the tools load — adding +
  authing does NOT load them into the running session. Verify with `claude mcp list`.

It is a **per-session connector**: it can read as disconnected in a later session even after a
previous one used it. Confirm the `create_video_from_avatar` tools are actually present before
planning avatar work; if they are absent it needs reconnecting, which you cannot do from a
non-interactive run — say so and stop.

## Tools exposed

**Verified against the live MCP 2026-07-28.** Earlier versions of this file listed
`generate_avatar_video` / `get_avatar_groups` / `get_remaining_credits`, none of which exist.

| Tool | Use |
|---|---|
| `get_current_user` | Credits + plan. Call FIRST. (There is no `get_remaining_credits`.) |
| `list_avatar_groups` | Avatar groups (characters). `ownership:"private"` for the user's own. |
| `list_avatar_looks` | Looks inside a group. **The look `id` is the `avatarId` you pass.** |
| `create_asset_upload` → PUT → `complete_asset_upload` | Upload audio for lip-sync. Returns an `asset_id`. |
| `create_video_from_avatar` | Submit. `script`+`voiceId`, **or** `audioAssetId`/`audioUrl` to lip-sync existing audio. Also: `aspectRatio`, `resolution:"4k"`, `engine:{type:"avatar_iii"}` (Digital Twin, 4K-capable — needed for a 4K comp; lip-sync works at 4k), `fit:"contain"/"cover"`, `background:{type:"color",value:"#RRGGBB"}`. |
| `get_video` | Poll until `status:"completed"`, then take `video_url`. ~80-120s for a few seconds of avatar. |
| `clone_voice`, `create_lipsync`, `create_video_agent` | Also available; not needed for the presenter workflow. |

Confirm the avatar visually, not by name — download `preview_image_url` and look at it. Names
like "Moe's Avatar -- 5" say nothing about wardrobe, and the user usually picks by appearance
("-- 5" is the 5th look inside that group, found via `list_avatar_looks`). **Verify any look id
before generating** — a stale/wrong id returns 404 `avatar_not_found`; substitute a real one
(`list_avatar_looks ownership:"public" avatarType:"studio_avatar"` for stock characters) and tell
the user you swapped it rather than failing the batch.

## The workflow

Use the names in the table above. This list previously repeated the dead ones.

1. `get_current_user`. Read `subscription.credits.premium_credits.remaining`. State the clip
   count and the balance before generating; never spend in a silent loop.
2. `list_avatar_groups` (`ownership:"private"`) → `list_avatar_looks`. Prefer the user's digital
   twin over a stock avatar and say which you picked. **The look `id` is the `avatarId`.**
   Open its `preview_image_url` and look at it before designing around it.
3. Decide the audio. If the piece already has a voiceover, lip-sync to it (next section) rather
   than picking a HeyGen voice. Only when there is no existing narration do you choose a voice
   with `list_voices` / `get_voice`, and then reuse the SAME voice id for every clip.
4. `create_video_from_avatar` per presenter block. **Generate each aspect ratio natively**
   (`aspectRatio:"16:9"` and `aspectRatio:"9:16"`) rather than cropping a landscape render; a
   1080-tall 16:9 cropped to vertical is a ~2.7x upscale and looks it.
5. `get_video` until `status:"completed"`. Download into the project's `assets/`.
6. Place it in the composition as a direct child of the composition root:

```html
<video class="clip" muted playsinline
       src="assets/aroll-01.mp4"
       data-start="12.4" data-duration="6.2"
       data-track-index="1"></video>
```

## Lip-sync to narration you already have

When the piece already has a voiceover, do NOT regenerate narration in a HeyGen voice — the
video would switch voices mid-piece, and you would lose whatever word-level alignment the
original provider gave you (which is what your cut points are built on).

Instead slice the existing audio and pass it as `audioAssetId`. The avatar becomes a pure
visual layer: same voice, same single audio track, every timing preserved.

```bash
# re-encode, never -c copy: mp3 stream-copy snaps to ~26ms frame boundaries
ffmpeg -i vo/narration.mp3 -ss 48.169 -to 51.223 -c:a libmp3lame -q:a 2 aroll/seg3.mp3
```

Then `create_asset_upload` (send `sizeBytes` + `checksumSha256`) → PUT the bytes to the
presigned `upload_url` with the returned `upload_headers` → `complete_asset_upload` → pass the
`asset_id` as `audioAssetId`.

**Mute every such `<video>`.** Its audio is a duplicate of the track already playing, so
unmuting doubles every word.

## Switching the avatar AND the voice (swap demo)

To show how easily the presenter swaps, generate the cut-ins from a `script` + the new avatar's
own `voiceId` (not lip-sync). Then build a **spliced master audio**: the new voice at the cut-in
windows + the original VO in the middle, and **level-match** them — HeyGen TTS came back ~6 dB
quieter than an ElevenLabs read, so boost it before muxing (`[a]volume=6dB`). Keep the middle
scenes on their original absolute timing so only the endpoints change, and place each cut-in's
audio at the same offset as its `<video>` so lip-sync holds. Mute the `<video>` clips (the master
carries the audio). Mux the final with `+faststart` (see `render-rules.md`) or it plays video-only.

For a presenter who OWNS the frame for a beat (a hook or CTA cut-in on a dark brand canvas), skip
alpha entirely: render a **studio avatar** with `background:{type:"color", value:"<canvas hex>"}`
and `fit:"contain"`, at the comp's `aspectRatio` + `resolution`. It comes back on that exact
colour and drops in as a full-frame `<video>` with `object-fit:cover` — no keying, no VP9 alpha,
seamless on the dark canvas. A **digital twin** has its real room baked in and ignores a
background colour; that reads fine as an authentic "creator to camera" cut, just not on the brand
canvas. Reach for transparent webm (below) only when the presenter must float OVER live graphics.

## Transparent background: `outputFormat: "webm"`

This is what makes a presenter sit *inside* a motion-graphics piece instead of floating in a
video box with their real room behind them. It returns a genuine VP9 alpha channel, and Chrome
composites it correctly at render time.

**The gotcha that reads as failure:** `ffprobe` reports `pix_fmt=yuv420p` and a naive ffmpeg
`overlay` renders the background BLACK, because the alpha is a VP9 side-channel the default
decoder drops. Check the container instead, and decode with the right codec:

```bash
ffprobe -v error -show_entries stream_tags -of json clip.webm   # want alpha_mode: "1"
ffmpeg -c:v libvpx-vp9 -i clip.webm ...                          # resolves to yuva420p
```

Measure the subject once from the alpha channel (`alphaextract`) to get its bounding box and
head centre, then place the element by arithmetic rather than by eye.

## Captions and a presenter collide

Two failures worth pre-empting, both found by looking at frames:

- **`data-track-index` can beat DOM order for stacking**, so a caption authored after the video
  can still render behind it. And since caption text is usually dark, landing it on dark
  clothing makes it illegible — z-index alone does not fix legibility.
- The fix is a **backing plate in the canvas colour** behind the caption band. On graphics-only
  scenes it is invisible (same colour as the page); behind a presenter it reads as a clean
  lower third. Give its top edge a ~40px gradient ramp, or it slices the torso with a hard line
  and looks like a crop. Start it below the deepest source line so it never washes out type.

## Rules that matter

- **`<video>` must be a direct child of the composition root.** It cannot sit inside a scene div that gets opacity-animated. The framework owns show/hide and playback; never call play or seek, never animate its width or height.
- **Match `data-duration` to the real clip length.** A window longer than the source goes black when the source ends. Probe it:
  ```bash
  ffprobe -v error -show_entries format=duration -of csv=p=0 assets/aroll-01.mp4
  ```
- **Conform the clip to the composition's fps when you cut it.** HeyGen usually delivers **25fps**
  (studio avatars); **digital twins can return 30fps** — always `ffprobe` and re-encode each
  segment with `-r 30` so source frames map 1:1 and a frame-exact cut check means what it says.
  ```bash
  ffmpeg -i full.mp4 -ss 16.50 -t 3.40 -an -r 30 -c:v libx264 -crf 16 -pix_fmt yuv420p seg.mp4
  ```
- **One file per A-roll window.** Windowing a single long clip twice makes the second window
  play from the clip's own beginning and the lip-sync drifts. Cut a segment per window so each
  starts at 0.
- **Pull each window in by ~half a frame at a hard cut.** `data-duration` is inclusive at its
  end, so a cut authored at exactly `data-start + data-duration` leaves the footage up for one
  frame under the incoming scene. See `render-rules.md` rule 7.
- **Put the copy where the subject is not.** A centre-framed avatar makes a left-aligned copy box
  look like it is covering him. Either a full-width lower-third band or content-sized chips
  works; prefer chips when part of the copy lands on a later beat, because a wide band sits
  visibly half-empty until it fills, and frame 0 is the thumbnail.
- **Expect the luma floor to drop** once footage is in the piece (a cream graphics build held
  YAVG ~206-228; with A-roll the floor fell to ~119). That is two image types in one video, not
  a defect, but it retires any "narrow luma spread" check for the footage stretches.
- **The avatar clip carries its own audio.** When generated from a `script`, that audio IS the narration for its window, so do not also lay a separate voiceover track underneath it. When generated from `audioAssetId` (see above), the opposite holds: the clip duplicates the existing track, so mute it.
- **Clips come back at 25fps (studio) or 30fps (digital twin).** Either way `duration` rarely lands on your frame grid — always `ffprobe` and window slightly under.
- **Removing the background** turns a presenter into an overlay that can float over motion graphics rather than owning the full frame. See the `hyperframes-media` skill's `remove-background`.
- **175+ languages.** Regenerating the same script with a different voice produces a native-language cut of the same video. Reuse every visual; only the presenter clips and captions change.

## Budget honesty

Avatar generation spends real credits and every reroll spends again. Before a batch, state the clip count and the credit balance, then proceed. Never silently burn a user's credits in a loop. If a clip comes back wrong twice, the script is the problem, not the seed.

## Falling back

No HeyGen connection means:
- Narration comes from local TTS (`npx hyperframes tts`, see the `hyperframes-media` skill) or the user records their own.
- The presenter slot is simply not built. The piece is designed to work as pure motion graphics, so nothing breaks.

Do not treat the absence of HeyGen as an error. Mention it once, then deliver the free path.
