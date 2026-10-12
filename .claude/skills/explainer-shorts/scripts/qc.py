#!/usr/bin/env python3
"""
qc.py - the whole render QC gate in one command.

`hyperframes check` passing is NOT evidence a video looks right; it samples text
overlap at a few timestamps and is blind to blank cut frames, dissolves, content
drifting under platform UI, and elements that render in the wrong place. Every
defect that has ever shipped from this skill was caught by looking at frames.

This script does the mechanical half of that review so you can spend your
attention on the editorial half. It proves four things objectively, then builds
contact sheets for you to actually look at.

    python3 scripts/qc.py renders/final.mp4 --cuts 56,184,336,506 --out qc/

  --cuts        frame numbers where a hard cut should land (comma separated).
                Pass the same numbers you authored the timeline with.
  --safe        "top,bottom" pixel rows that must stay empty. Defaults to
                230,1536 for 1080x1920. Pass --safe none for 16:9.
  --out         directory for luma data and contact sheets (default: qc/)

Exit code is 1 if any objective check fails, so it can gate a build.
"""
import argparse, json, math, os, re, subprocess, sys


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True).stdout


def probe(path):
    out = run(["ffprobe", "-v", "error", "-show_entries",
               "stream=codec_type,codec_name,width,height,r_frame_rate",
               "-of", "json", path])
    streams = json.loads(out)["streams"]
    v = next((s for s in streams if s["codec_type"] == "video"), None)
    a = next((s for s in streams if s["codec_type"] == "audio"), None)
    n = run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0",
             "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", path]).strip()
    num, den = v["r_frame_rate"].split("/")
    return {"w": v["width"], "h": v["height"], "fps": float(num) / float(den),
            "frames": int(n) if n.isdigit() else None,
            "vcodec": v["codec_name"], "audio": a["codec_name"] if a else None}


def luma_series(path, outdir):
    f = os.path.join(outdir, "luma.txt")
    subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf",
                    f"signalstats,metadata=print:key=lavfi.signalstats.YAVG:file={f}",
                    "-an", "-f", "null", "-"], capture_output=True)
    vals = []
    with open(f) as fh:
        for line in fh:
            m = re.search(r"YAVG=([\d.]+)", line)
            if m:
                vals.append(float(m.group(1)))
    return vals


def band_min(path, top, height):
    out = run(["ffmpeg", "-v", "error", "-i", path, "-vf",
               f"crop=iw:{height}:0:{top},signalstats,"
               "metadata=print:key=lavfi.signalstats.YMIN:file=-",
               "-an", "-f", "null", "-"])
    vals = [float(m) for m in re.findall(r"YMIN=([\d.]+)", out)]
    return min(vals) if vals else None


def sheet(path, frames, out, cols, scale=300):
    """Extract exact frames BY NUMBER and tile them.

    Never use -ss for this. Fast seek is frame-inaccurate: it will show you a
    crossfade that is not there, or hide one that is.
    """
    sel = "+".join(rf"eq(n\,{f})" for f in frames)
    tmp = os.path.join(os.path.dirname(out) or ".", "_f_%03d.jpg")
    for old in os.listdir(os.path.dirname(out) or "."):
        if old.startswith("_f_"):
            os.remove(os.path.join(os.path.dirname(out) or ".", old))
    subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", f"select='{sel}'",
                    "-vsync", "0", "-q:v", "2", tmp, "-y"], capture_output=True)
    rows = math.ceil(len(frames) / cols)
    subprocess.run(["ffmpeg", "-v", "error", "-pattern_type", "sequence", "-i", tmp,
                    "-vf", f"scale={scale}:-1,tile={cols}x{rows}:padding=10:color=0x333333",
                    "-frames:v", "1", out, "-y"], capture_output=True)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("video")
    p.add_argument("--cuts", default="")
    p.add_argument("--safe", default="")
    p.add_argument("--out", default="qc")
    p.add_argument("--silent-ok", action="store_true",
                   help="deliverable is intentionally silent (a B-roll or technique cut); skip the audio check")
    p.add_argument("--dark", action="store_true",
                   help="dark premium palette; lower the near-black floor from 60 to 12 so a legitimately "
                        "dark composition is not flagged. Real capture failures still read ~0-5.")
    a = p.parse_args()
    os.makedirs(a.out, exist_ok=True)
    fails = []

    info = probe(a.video)
    print(f"SPEC          {info['w']}x{info['h']} {info['fps']:.3f}fps  "
          f"{info['frames']} frames  {info['vcodec']}  audio={info['audio'] or 'NONE'}")
    if not info["audio"]:
        if a.silent_ok:
            print("              (intentionally silent, --silent-ok)")
        else:
            fails.append("no audio stream (an <audio> element without an id renders silent)")

    # 1. black frames
    out = run(["ffmpeg", "-v", "info", "-i", a.video, "-vf",
               "blackdetect=d=0.02:pix_th=0.10", "-an", "-f", "null", "-"])
    err = subprocess.run(["ffmpeg", "-v", "info", "-i", a.video, "-vf",
                          "blackdetect=d=0.02:pix_th=0.10", "-an", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    hits = [l for l in err.splitlines() if "blackdetect" in l.lower()]
    print(f"BLACK FRAMES  {'NONE' if not hits else chr(10).join(hits)}")
    if hits:
        fails.append("black frames detected")

    # 2. luma sweep
    v = luma_series(a.video, a.out)
    if v:
        floor = 12 if a.dark else 60
        lo = sum(1 for x in v if x < floor)
        hi = sum(1 for x in v if x > 245)
        print(f"LUMA          min {min(v):.1f}  max {max(v):.1f}  mean {sum(v)/len(v):.1f}"
              f"   <{floor}: {lo}   >245: {hi}")
        if lo:
            fails.append(f"{lo} near-black frames (luma < {floor})")
        if hi:
            fails.append(f"{hi} blown-out frames (luma > 245)")

    # 3. cut integrity - a hard cut puts the whole change in ONE frame step.
    #    If frame N and N+1 both jump, it is a 2-frame crossfade reading as mush.
    cuts = [int(c) for c in a.cuts.split(",") if c.strip()]
    if cuts and v:
        print("CUT INTEGRITY")
        for c in cuts:
            if c + 2 >= len(v):
                continue
            d0, d1 = abs(v[c] - v[c - 1]), abs(v[c + 1] - v[c])
            ok = d1 < d0 * 0.5 or d1 < 0.6
            print(f"  frame {c:5d}  step {d0:6.2f}  next {d1:5.2f}   "
                  f"{'hard cut' if ok else 'DISSOLVE / LATE CUT'}")
            if not ok:
                fails.append(f"cut at frame {c} is not a single-frame swap")
    if v:
        deltas = sorted(((abs(v[i] - v[i - 1]), i) for i in range(1, len(v))), reverse=True)
        top = [i for _, i in deltas[:max(len(cuts), 6)]]
        unexpected = [i for i in top if cuts and i not in cuts and abs(v[i] - v[i - 1]) > 2.0]
        if unexpected:
            print(f"  NOTE large luma jumps at non-cut frames {sorted(unexpected)} "
                  f"- check these are intentional")

    # 4. safe band
    if a.safe.lower() != "none":
        if a.safe:
            top, bottom = (int(x) for x in a.safe.split(","))
        elif (info["w"], info["h"]) == (1080, 1920):
            top, bottom = 230, 1536
        else:
            top = bottom = None
        if top is not None:
            t = band_min(a.video, 0, top)
            b = band_min(a.video, bottom, info["h"] - bottom)
            print(f"SAFE BAND     top y=0..{top} darkest {t}   "
                  f"bottom y={bottom}..{info['h']} darkest {b}")
            print("              (bare paper reads ~211; ink reads ~24. A low value "
                  "means content is under the platform UI.)")
            for name, val in (("top", t), ("bottom", b)):
                if val is not None and val < 150:
                    fails.append(f"content intrudes into the {name} safe band (YMIN {val})")

    # 5. contact sheets - the part you actually have to look at
    n = info["frames"] or 0
    if cuts:
        pairs = [f for c in cuts for f in (c - 1, c) if 0 <= f < n]
        sheet(a.video, pairs, os.path.join(a.out, "sheet_cuts.jpg"), cols=4)
        print(f"SHEET         {a.out}/sheet_cuts.jpg  (each cut: last frame | first frame)")
    if n:
        step = max(1, n // 12)
        sheet(a.video, list(range(0, n, step))[:12], os.path.join(a.out, "sheet_timeline.jpg"), cols=4)
        print(f"SHEET         {a.out}/sheet_timeline.jpg  (frame 0 -> final hold)")
    for old in os.listdir(a.out):
        if old.startswith("_f_"):
            os.remove(os.path.join(a.out, old))

    print()
    if fails:
        print("FAILED:")
        for f in fails:
            print(f"  - {f}")
        print("\nObjective checks only. Now LOOK at both sheets before shipping.")
        sys.exit(1)
    print("All objective checks passed. Now LOOK at both sheets - the linter and this "
          "script are both blind to clutter, wrong-place elements, and scenes that do "
          "not earn their seconds.")


if __name__ == "__main__":
    main()
