#!/usr/bin/env python3
"""
make_us_map.py - regenerate assets/us-map.js from source GeoJSON.

You usually do NOT need to run this. `assets/us-map.js` is already built and
covers the lower 48 plus DC. Run this only if you need different geography
(counties, another country, a different projection or simplification level).

Why the map is baked at build time instead of fetched at render time: the
renderer seeks a paused timeline in headless Chrome, and the composition
contract forbids network fetches. Map tiles (Mapbox / Leaflet / Google) would
race the capture and produce different frames run to run. Real borders as
static SVG paths are exact, deterministic, and seek-safe - and they let you
highlight a named region with a single GSAP `fill` tween.

    python3 scripts/make_us_map.py --out assets/us-map.js

The orientation assertions at the bottom are not optional decoration. A sign
error in the y term silently renders the country upside down, and it looks
plausible enough at a glance that it can survive to a final render.
"""
import argparse, json, math, urllib.request

SRC = ("https://raw.githubusercontent.com/PublicaMundi/MappingAPI/"
       "master/data/geojson/us-states.json")
SKIP = {"Alaska", "Hawaii", "Puerto Rico"}          # they wreck the bounding box
PJM = {"Delaware", "Illinois", "Indiana", "Kentucky", "Maryland", "Michigan",
       "New Jersey", "North Carolina", "Ohio", "Pennsylvania", "Tennessee",
       "Virginia", "West Virginia", "District of Columbia"}

# Albers Equal Area Conic, the standard projection for a US map.
P1, P2, F0, L0 = map(math.radians, (29.5, 45.5, 37.5, -96))
N = (math.sin(P1) + math.sin(P2)) / 2
C = math.cos(P1) ** 2 + 2 * N * math.sin(P1)
R0 = math.sqrt(C - 2 * N * math.sin(F0)) / N


def project(lon, lat):
    f, l = math.radians(lat), math.radians(lon)
    r = math.sqrt(max(C - 2 * N * math.sin(f), 1e-12)) / N
    t = N * (l - L0)
    return r * math.sin(t), R0 - r * math.cos(t)


def rings(geom):
    if geom["type"] == "Polygon":
        return [geom["coordinates"][0]]
    return [poly[0] for poly in geom["coordinates"]]


def simplify(pts, eps):
    """Drop points closer than eps. Crude but stable, and stable matters more
    than optimal here - the same input must always give the same output."""
    out = [pts[0]]
    for q in pts[1:]:
        if math.dist(q, out[-1]) >= eps:
            out.append(q)
    return out if len(out) >= 3 else pts[:3]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="assets/us-map.js")
    ap.add_argument("--width", type=float, default=1000.0)
    ap.add_argument("--height", type=float, default=620.0)
    ap.add_argument("--eps", type=float, default=1.1,
                    help="simplification distance in viewBox units")
    a = ap.parse_args()

    with urllib.request.urlopen(SRC, timeout=120) as r:
        data = json.load(r)

    raw = {f["properties"]["name"]: [[project(x, y) for x, y in ring]
                                     for ring in rings(f["geometry"])]
           for f in data["features"] if f["properties"]["name"] not in SKIP}

    xs = [p[0] for rs in raw.values() for r in rs for p in r]
    ys = [p[1] for rs in raw.values() for r in rs for p in r]
    minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
    s = min(a.width / (maxx - minx), a.height / (maxy - miny))
    ox = (a.width - (maxx - minx) * s) / 2
    oy = (a.height - (maxy - miny) * s) / 2

    # y is FLIPPED: projection y grows north, SVG y grows down.
    def to_px(p):
        return ((p[0] - minx) * s + ox, (maxy - p[1]) * s + oy)

    paths, cent = {}, {}
    for name, rs in raw.items():
        eps = 0.3 if name in ("District of Columbia", "Delaware", "Rhode Island") else a.eps
        segs, allp = [], []
        for ring in rs:
            px = simplify([to_px(p) for p in ring], eps)
            if len(px) < 3:
                continue
            allp += px
            segs.append("M" + " ".join(f"{x:.1f},{y:.1f}" for x, y in px) + "Z")
        if segs:
            paths[name] = "".join(segs)
            cent[name] = (round(sum(p[0] for p in allp) / len(allp), 1),
                          round(sum(p[1] for p in allp) / len(allp), 1))

    # Orientation sanity. North must have the SMALLER y, west the SMALLER x.
    for north, south in (("Michigan", "Tennessee"), ("Pennsylvania", "North Carolina")):
        assert cent[north][1] < cent[south][1], \
            f"projection flipped: {north} rendered south of {south}"
    assert cent["Illinois"][0] < cent["New Jersey"][0], \
        "projection mirrored: Illinois rendered east of New Jersey"

    lines = [
        "/* US state borders, US Census via PublicaMundi GeoJSON, projected Albers Equal",
        "   Area Conic (29.5N/45.5N, -96) and simplified at build time. Static data: no",
        f"   network access at render time, so every frame is deterministic. viewBox 0 0 "
        f"{int(a.width)} {int(a.height)}. */",
        "window.US_MAP = {",
        f'  viewBox: "0 0 {int(a.width)} {int(a.height)}",',
        "  pjm: " + json.dumps(sorted(PJM)) + ",",
        "  centroids: " + json.dumps({k: list(v) for k, v in cent.items()},
                                     separators=(",", ":")) + ",",
        "  paths: {",
    ]
    for k in sorted(paths):
        lines.append(f"    {json.dumps(k)}: {json.dumps(paths[k])},")
    lines += ["  }", "};"]
    open(a.out, "w").write("\n".join(lines) + "\n")
    print(f"wrote {a.out}: {len(paths)} regions, "
          f"{sum(map(len, paths.values())):,} chars of path data")
    print("orientation assertions passed (north above south, west left of east)")


if __name__ == "__main__":
    main()
