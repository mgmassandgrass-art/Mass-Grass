---
name: reel-sound
description: Score and sound effects for Mass & Grass reels, synthesised in numpy (no samples, no AI audio) and synced to the animation's event list. Use when a reel or video needs music, sound effects or a mix.
---

# Reel sound

The audio tools on the account make speech only (no music, no effects), so reels get their
sound from `tools/reel/sound.py`, which synthesises everything and places it on the events the
animation exports.

```
python3 tools/reel/sound.py out.events.json out.wav 30
ffmpeg -i out.mp4 -i out.wav -c:v copy -c:a aac -b:a 192k \
  -af loudnorm=I=-14:TP=-1.5:LRA=11 -shortest final.mp4
```

## Music

A small Arab ensemble in D harmonic minor (D E F G A B♭ C♯), maqsum at 100 bpm:

- **oud**: Karplus-Strong pluck (vectorised one period at a time) through a wooden body band-pass;
- **darbuka**: `dum` (sine with a pitch drop) and `tak` (band-passed noise click), **riq** jingles;
- **ney**: sine + 2nd/3rd harmonic, breath noise, delayed vibrato;
- **pad**: detuned additive saws, low-passed; **bells** for magic (inharmonic partials).

Shape: music-box notes over the hook (no beat), drums + oud from the moment the lead figure
leaves, drums fall away at night (pad + ney), a darbuka roll into the logo, then a D major
resolution (strum + pad + ney phrase) that rings out under the end.

## Effects

One function per event type (`FX` table): `shake` paper rattle + glass tinkle, `engine` sputter,
`peel` paper lifting + pop, `land` soft thud, `honk` toy horn, `startle` boing, `whoosh`, `splash`
with bubbles, `drops` plinks, `hop`, `pick` chime, `flap` wing beats for the whole flight,
`night` low swell, `flicker` + `moon` (swell into a bell cluster), `brake`, `logo` brush sweep,
`snow` wind + twinkles; `drive` adds an engine hum under the whole drive. Each is panned by the
event's `pan` (screen position).

## Mix

Music ×0.55, effects ×0.9, separate synthetic-IR reverbs (music 2 s, effects 1.2 s), tanh soft
clip, peak −1 dB, then `loudnorm` to −14 LUFS when muxing (Instagram/TikTok level).

## Checking without ears

Plot a spectrogram with the event times drawn on it and the RMS curve: every event should have
energy right at its line, and no section should drop out or clip.
