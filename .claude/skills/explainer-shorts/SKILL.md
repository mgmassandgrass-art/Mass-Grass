---
name: explainer-shorts
description: >
  Turn one sentence into a finished Vox-style explainer short: a vertical,
  sub-60-second, paper-cut collage motion-graphics video with narration,
  kinetic captions, and an optional AI presenter. Runs entirely on Claude Code
  + HyperFrames, so there is no per-video cost and every render is
  deterministic. Use this skill whenever the user asks for a "Vox-style video",
  an "explainer short", "motion graphics", an "animated explainer", a "faceless
  short", a "TikTok/Reels/Shorts explainer", a "video about X", or a video
  about "something trending" — even when they give no topic at all (the skill
  finds one). Also use it for data-driven or educational shorts on money,
  history, geopolitics, science, or how-things-work. Prefer this over generic
  HyperFrames authoring whenever the request is for a narrated explainer rather
  than a bare title card or overlay.
---

# explainer-shorts

One sentence in, a finished explainer short out.

The skill IS the workflow. It knows an explainer needs a researched topic, a beat-mapped script, one locked visual language, narration, word-synced captions, and a real render. You do not have to know any of that.

**The look:** archival cutouts with torn paper edges drifting over flat color fields, halftone texture, hand-drawn marker emphasis, charts that build and maps that draw. A motion-designed magazine spread, never a filmed scene.

**The engine:** HyperFrames (HTML/CSS/GSAP to MP4). Free, open source, deterministic. No generation credits, no reroll lottery, real legible typography.

## Start from the template. Do not build from scratch.

`template/` is a verified, lint-clean, rendering exemplar. **Copy it and swap the content.**

```bash
cp -r <skill-dir>/template my-video && cd my-video
npx hyperframes check          # confirm the baseline is clean before you touch it
```

It already encodes three fixes that a from-scratch build gets wrong every time, none of which the linter catches:
1. **Cuts are `tl.set`, not a short opacity tween** (a 0.08s tween is a two-frame crossfade)
2. **Every scene lands already composed** (otherwise the cut frame is blank)
3. **Frame 0 is composed** (in short-form the first frame is the thumbnail)

Read `template/README.md` before editing it. Rebuilding this scaffold from scratch is the single most common way to ship a worse video.

## Read before building

| File | When |
|---|---|
| `template/README.md` | First. What the exemplar proves and how to swap content into it. |
| `references/story-engine.md` | Before writing ANY script. Beat map, word budgets, hook formulas, retention rules. |
| `references/vox-visual-language.md` | Before writing ANY HTML. Torn edges, palette, type, motion defaults. |
| `references/render-rules.md` | Before writing ANY GSAP. The nine rules that break renders, plus the five *silent* failures that pass lint clean. |
| `references/data-and-maps.md` | Before building any chart or map scene. Chart-type-per-beat, line/donut/stacked geometry, and real state borders. |
| `references/heygen-mcp.md` | Only if the user wants an on-camera presenter. |

## Bundled tools

| Path | What it saves you |
|---|---|
| `scripts/qc.py` | The whole render QC gate in one command. Do not hand-roll ffmpeg checks. |
| `assets/us-map.js` | Real US state borders (lower 48 + DC), Albers-projected, ~28KB, with centroids. Copy next to `index.html`. |
| `scripts/make_us_map.py` | Only if you need different geography than the prebuilt asset. |

## Operating mode

Run hands-off. The user delegated this.

- Honor anything they specified. Decide everything they did not, using the defaults below.
- Ask **one** short round of questions, then go. Never stop mid-pipeline for something you can default.
- Delivering a script or loose scenes instead of a rendered MP4 is a failure. Finish the video.

### The one question round

Ask these together, in one message, then proceed:

1. **Topic.** If they gave none, research what is trending, come back with **three options** plus a one-line "why this works" each, and let them pick or say "you choose."
2. **Taste.** Accent color preference? Any visual reference to follow? Do they want the presenter (needs HeyGen) or pure motion graphics?

If they say "you pick" to everything, pick and keep moving.

## Defaults

| Setting | Default | Override when |
|---|---|---|
| Canvas | 1080x1920, 30fps | user asks for 16:9 or square |
| Length | 45-60s | user names a length |
| Palette | cream `#F2EDE4`, near-black `#1A1A1A`, accent `#FFEB00` | user names colors or gives a reference |
| Type | Archivo Black (headlines) + Work Sans (body) | user names fonts |
| Narration | HeyGen MCP if connected, else local TTS | user records their own |
| Presenter | off | user asks for an avatar |
| Captions | on, burned in | user says no |

## Pipeline

Run these in order. Do not skip the QC phase.

### 1. Topic

Given a topic, use it. Otherwise search for what people are curious about right now and pick a candidate with a **concrete anchor** (an object, place, or number you can show in the first 3 seconds) plus an implied hidden mechanism.

Read the five reliable categories and the kill list in `references/story-engine.md`.

Avoid: active tragedies, gossip with no data angle, and anything you cannot verify twice.

### 2. Research

**Never script from memory.** Search the topic, fetch the two or three best sources, and collect the hook stat, three to five concrete facts with numbers and dates, and the counterintuitive turn.

Cross-check every number against a second source. Keep a Sources list and deliver it with the video. A vague true line beats a specific false one. **Never invent a statistic.**

**Read the number in the primary document, not in a summary of it.** Search snippets and news
write-ups routinely mangle which year, which entity, or which of two similar figures is being
quoted. Go to the regulator, agency, lab or company filing and pull the sentence. PDFs often
come back as binary — download and extract them (`pdftotext -layout`) rather than giving up
and citing a secondary source. It is normal for this to surface a correction: a headline
figure attributed to the wrong year, or two numbers that look interchangeable and are not.

If you delegate breadth to subagents, **verify the load-bearing numbers yourself** before they
go on screen. Subagent findings are leads; the primary document is the evidence. The strongest
possible check is a figure that reconstructs independently from two separate documents — when
that happens, say so in the Sources list.

**Three habits that keep a claim defensible:**
- **Scope every figure on screen.** Label the year, the entity, and whether it is measured or
  projected. "12%" is not a fact; "12%, projected, by 2028, per Berkeley Lab" is.
- **If a number is single-sourced, keep it off the screen.** You can still use its *shape* —
  segment widths of a chart, the slope of a line — while the rendered text stays limited to
  figures you verified twice.
- **Go looking for the strongest counter-source** and note it at delivery. If a credible study
  disagrees, the user should hear it from you, not from a commenter. Check whether it actually
  contradicts you or merely covers a different period or measure.

### 3. Script

Write to the beat map: `HOOK / CONTEXT / ESCALATION x2-4 / PAYOFF / BUTTON`.

Budget **~3 words per second**. For a 50-second video that is roughly 150 words. Tag every beat so the storyboard can map to it:

```
[HOOK 0:00-0:03]
This is the busiest shipping lane on earth. Almost nobody who uses it knows its name.

[CONTEXT 0:03-0:09]
It is a nineteen-mile gap between Yemen and Djibouti called the Bab-el-Mandeb.
...
```

Rules that are not optional:
- One clause, one idea. No sentence carries two facts.
- Present tense. Second person. Numbers, not adjectives.
- No throat-clearing in any beat, not just the hook.
- Re-hook every 10-15 seconds with a forward-pointing cue.
- Withhold the biggest number until 75-90% through.
- End on the payoff. **No summary.**

Write three hook variants and keep the one with the most concrete noun.

### 4. Style lock

Pick the palette ONCE and never drift. One base, one field color, one or two accents maximum. Every scene in the video shares it.

This is the thing that separates this from a scene-by-scene generator: consistency is the product. Scene 1 and scene 12 must look like the same designer made them.

Write the locked tokens into a `:root` block and copy that block into the composition.

### 5. Storyboard

Map each script beat to a scene. For each, name:
- the collage composition (which cutouts, which field color, which annotation)
- the ONE thing that animates
- the caption text

**Something must change every 2-4 seconds.** A chart building or a map drawing counts.

**One highlighter per scene**, on the single most important phrase.

Keep vertical discipline: 1-2 stacked layers per beat, 2-5 words per text card, nothing critical in the top 12% or bottom 20%.

### 6. Narration

**With HeyGen** (see `references/heygen-mcp.md`): check credits, pick one measured documentary voice, reuse that same voice id for every line.

**Without HeyGen:** if the project has a higher-quality TTS available (an ElevenLabs skill or MCP, a cloned voice, any project-local narration workflow), prefer it and follow that project's own voice and model conventions. Otherwise fall back to `npx hyperframes tts` for a local voice.

Say once that connecting HeyGen unlocks the on-camera presenter, then move on. Do not nag.

**The voice sets the runtime. The runtime never sets the voice.**

This holds for every provider (ElevenLabs, HeyGen, `hyperframes tts`, anything else):

- Generate at the voice's **native speed**. If a read genuinely drags or rushes, the only
  allowed correction is the **provider's own speed parameter**, kept in a natural range
  (roughly 1.0-1.1). Past that it stops sounding like a person.
- **Never time-stretch after the fact.** Post-hoc `atempo`, rubber-band, or a re-rate in the
  NLE sounds sped up and unnatural no matter how small the factor.
- **Do not treat a length as a gate.** "Sub-60-second" is a description of the format, not a
  constraint to hit. Never pad the script, never insert filler pauses, and never regenerate a
  perfectly good read because the total came in under or over some number. Write the tightest
  version of the idea, read it naturally, and let the video be however long that is.
- Pauses between beats are a legitimate **editorial** choice (they give cuts somewhere clean to
  land). Size them by what the writing wants, never by what the clock wants.

If the natural read lands well outside the format, fix it in the **script** (cut an idea, or add
one), never in the playback rate.

**Wire the audio in with an `id`, or the render is silent** — the renderer discovers media
elements by id, and a silent video looks perfect in every extracted frame:

```html
<audio id="narration" class="clip" src="vo/narration.mp3"
       data-start="0" data-duration="51.2333" data-track-index="0"></audio>
```

### 7. Timing

**Prefer the TTS provider's own alignment over re-transcribing.** If the voice came from a
provider that returns timestamps, that alignment is exact — it is what the model actually
emitted, not a guess recovered from the waveform. ElevenLabs exposes this at
`/v1/text-to-speech/{voice_id}/with-timestamps`, which returns the mp3 and a per-character
alignment in one call; group the characters into words and you have a precise map for free.

Only fall back to transcription when the provider gives you nothing:

```bash
npx hyperframes transcribe vo/narration.mp3
```

Land every animation beat **~0.12-0.15s before its trigger word** so the visual is already
there when the word arrives. Set `data-duration` to the real audio length (round *up* to the
next frame boundary), never an estimate.

**Derive cut times as `frame/fps - 0.001`.** A cut written as a tidy rounded decimal can be
fractionally later than the frame it names and fire one frame late — see `render-rules.md` §A.
Only `set` calls are affected; tweens ramp, so a frame either way is invisible.

### 8. Build

One self-contained `index.html`. Author against `references/render-rules.md` from the first line; the linter hard-enforces most of it.

The five that bite hardest:
- `opacity:0` in CSS for anything hidden at frame 0, plus an immediate `gsap.set` for transform initials
- never animate `left`/`top`/`width`/`height`, use `x` and `scaleX`
- no CSS `transform:` on a GSAP-animated element
- full-bleed background on a child, never only on the root
- scene changes are hard cuts, not dissolves

### 9. QC (mandatory, do not skip)

```bash
npx hyperframes check                                  # must be 0 errors
npx hyperframes render -q draft -o renders/draft.mp4
python3 <skill-dir>/scripts/qc.py renders/draft.mp4 --cuts 56,184,336,506,600 --out qc/
```

`qc.py` proves the mechanical half: audio actually present, no black frames, luma in range,
every declared cut a genuine single-frame swap, and nothing sitting under the platform UI. It
writes two contact sheets and exits non-zero on any objective failure. Pass `--safe none` for
16:9.

**Then look at both sheets, every cell.** The linter and the script are equally blind to
clutter, an element rendering in the wrong place, and a scene that does not earn its seconds.
Ask on each: *is this a clean, correct visualization of this exact line, and is it interesting
enough to hold a scrolling thumb?*

Expect the first pass to find real defects — that is the point, not a sign something went
wrong. The recurring ones are a blank chart frame at a cut, a callout the line crosses, text
that silently wrapped, and a graphic sitting away from the geometry it belongs to.

Fix, then re-render. **The deliverable is the render made after the last edit** — re-run the
gate on the file you are actually shipping, not on the draft you inspected.

### 10. Deliver

```bash
npx hyperframes render -q high --crf 15 -o renders/final.mp4
python3 <skill-dir>/scripts/qc.py renders/final.mp4 --cuts ... --out qc/
```

Hand back the MP4, the topic and angle in one sentence, the full script, and the Sources list.
Say plainly what the frame review found and what you changed — the fixes are evidence the
video was actually inspected.

Then offer (do not run unasked):
- the **28-35s TikTok/Reels cut**, which drops the context beat and hooks straight into escalation
- a **16:9 version** for YouTube or a site embed

### Deriving a second aspect ratio

Build it as a sibling project sharing `vo/`, `fonts/` and any map asset. Keep the **same
narration, the same word timings and the same frame-exact cut points** so the two stay in sync
and only layout differs. 16:9 earns its own layout rather than a reframe: two-column scenes
with the chart or map beside its text, flow diagrams running horizontally instead of stacked,
and pull-quotes in fewer, longer lines. Landscape has no platform-UI band, so `--safe none`.

## Failure handling

| Symptom | Cause and fix |
|---|---|
| `Conversion failed! Try --docker` | Chrome/ffmpeg resource contention, not broken HTML. Re-render solo with a retry loop before touching anything. |
| Black frames in the render | Background on the root instead of a full-bleed child, or too many `filter`/gradient overlays. Check `composition_heavy_overlay_count_high`. |
| `gsap_css_transform_conflict` | A CSS `transform` on a GSAP-animated element. `scaleX(0)` counts. Move it into `fromTo`. |
| Element visible at frame 0 that should not be | It needs `opacity:0` in CSS. A `tl.set(...,0)` does not paint at exactly 0. |
| Video clip goes black partway | `data-duration` is longer than the source. Probe with ffprobe and match it. |
| Captions drift from the voice | Timed to the script, not the transcript. Re-transcribe and re-time. |
| Every scene looks slightly different | The palette was not locked in step 4. Lock it and rebuild, do not patch scene by scene. |

## What this skill will not do

- Invent a statistic, a quote, or a source
- Ship a render it has not looked at frame by frame
- Silently burn HeyGen credits in a retry loop
- Summarize the video at the end
- Put more than one idea in one video
