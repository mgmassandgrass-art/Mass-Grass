# Vox-Style Video Skill for Claude Code

Turn one sentence into a finished Vox-style explainer video. Vertical, sub-60-second, paper-cut
collage motion graphics with narration, word-synced captions and an optional AI presenter.

Runs entirely on Claude Code plus [HyperFrames](https://hyperframes.heygen.com), which is free and
open source. There is no per-video cost and every render is deterministic, so the same prompt gives
you the same video twice.

Built and used on [@MoeLueker](https://www.youtube.com/@MoeLueker). Watch it get built: [VIDEO URL]

## What this is

A Claude Code skill. You give it a topic, it researches it, writes the script, generates the
voiceover, builds every scene in one consistent visual language, and renders a real MP4 on your
machine. You do not need to know motion design and you do not need to write code.

It is not a generative video model. It writes real HTML and CSS and renders it, which is why the
text is legible, the colours are exact and the output is repeatable.

## Install

You need [Node.js](https://nodejs.org) 20+ and one of Claude Code or ChatGPT Codex.

### Claude Code

```bash
git clone https://github.com/YOUR-USERNAME/vox-style-video-skill.git
mkdir -p ~/.claude/skills
ln -s "$(pwd)/vox-style-video-skill" ~/.claude/skills/explainer-shorts
```

Restart Claude Code. Check it loaded:

```
/skills
```

You should see `explainer-shorts` in the list. Then just ask for a video:

```
Make me a Vox-style explainer about why coffee prices went up
```

### ChatGPT Codex

Codex reads `AGENTS.md`, so point it at the skill directly:

```bash
git clone https://github.com/YOUR-USERNAME/vox-style-video-skill.git
cd vox-style-video-skill
codex
```

Then: `Read SKILL.md and follow it. Make me a Vox-style explainer about [your topic].`

### Install HyperFrames

The skill renders through HyperFrames. Install it once:

```bash
npm install -g hyperframes
hyperframes doctor
```

`doctor` tells you if anything is missing.

## Optional: add an AI presenter

If you want a talking-head presenter on top of the motion graphics, add the HeyGen MCP. This is
optional; everything else works without it.

Inside Claude Code:

```
/mcp
```

Pick HeyGen and authorise in the browser. HeyGen has a free plan; the Creator plan is $24/month
billed yearly. Sign up here: https://moelueker.com/go/heygen-hyperframes

## What is in here

| Path | What it is |
|---|---|
| `SKILL.md` | The skill itself. This is what the agent reads. |
| `references/` | Story engine, Vox visual language, render rules, data and maps, HeyGen MCP setup |
| `template/` | A locked reference project that lints clean and renders in about 19 seconds |
| `scripts/` | QC and helper scripts |
| `PROMPTS.md` | The exact prompts from the video |

## Try the template first

Before you build your own, render the included exemplar so you know your setup works:

```bash
cd template
npm install
npx hyperframes render
```

You should get an MP4 in `template/renders/`. If that works, the skill will work.

## Troubleshooting

**The skill does not show up in `/skills`.** The symlink has to point at the folder, not at
`SKILL.md`. Check with `ls -l ~/.claude/skills/`.

**The render fails immediately.** Run `hyperframes doctor`. It is almost always a missing ffmpeg
or a Node version below 20.

**The voiceover sounds flat.** That is the weakest part of a first pass. Ask the skill to rewrite
the narration shorter and more conversational, then re-render just the audio.

**The output is horizontal when you wanted vertical.** Say which one you want explicitly in the
prompt, or you sometimes get both.

## Licence

MIT. Use it commercially, modify it, ship it. No attribution required, though a link back is
always appreciated.
