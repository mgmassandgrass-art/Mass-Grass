"""Re-date Farah's 2026 calendar "Palestine, a journey through time & space" for 2027.
Every number is redrawn from the page's own digits (cut from the 2026 grid), so the type matches exactly:
the date grid (weeks start on Monday, the days of the months before and after in grey, as on the 2026 pages),
the holiday circles moved to their 2027 dates in their own colours, the year under the month name, and the cover's year.
  python3 tools/redate_2026.py drafts/calendar-2026 OUT_DIR
"""
import sys, calendar, numpy as np
from PIL import Image
from scipy import ndimage

SRC, OUT = sys.argv[1], sys.argv[2]
COLS = [729.5, 1207, 1690, 2155.5, 2629, 3103, 3568]
ROWS = [4211, 4400, 4589, 4778, 4966, 5155]
HW = 120; VH = 42            # the cell window around a date
# holidays: month -> [(2026 day, 2027 day)], Islamic dates from the Umm al-Qura calendar (subject to moon sighting, as the pages say)
HOL = {1: [(16, 5)], 2: [(17, 8)], 3: [(8, 8), (20, 9), (21, 21), (30, 30)], 4: [(7, 7), (22, 22)], 5: [(1, 1), (27, 16)],
       8: [(19, 19)], 9: [(27, 27)], 10: [(5, 4)], 11: [(15, 15)], 12: [(25, 25)]}

def page(m): return f'{SRC}/pg-{4 + 2 * (m - 1):03d}.jpg'

def cells(year, m):
    """[(row, col, day, in_month)] as the pages lay them out: Monday first, the edge rows filled from the next/previous month"""
    off = calendar.weekday(year, m, 1); n = calendar.monthrange(year, m)[1]
    py, pm = (year, m - 1) if m > 1 else (year - 1, 12); pn = calendar.monthrange(py, pm)[1]
    out = []
    for c in range(off): out.append((0, c, pn - off + 1 + c, False))
    for d in range(1, n + 1): i = off + d - 1; out.append((i // 7, i % 7, d, True))
    last = off + n - 1; r = last // 7
    for k, c in enumerate(range(last % 7 + 1, 7)): out.append((r, c, k + 1, False))
    return out

def window(a, r, c):
    y, x = ROWS[r], int(COLS[c]); return a[y - VH:y + VH, x - HW:x + HW]

def runs(alpha):
    col = alpha.max(0) > .08; xs = np.where(col)[0]
    if not len(xs): return []
    out, s = [], xs[0]
    for a, b in zip(xs, xs[1:]):
        if b != a + 1: out.append((s, a + 1)); s = b
    out.append((s, xs[-1] + 1)); return out

# ---- the glyph bank: each digit as it is printed, in ink and in grey
bank = {'ink': {}, 'grey': {}}; gaps = []
for m in range(1, 13):
    rgb = np.asarray(Image.open(page(m)).convert('RGB')).astype(float); L = rgb.mean(2)
    hol = {d for d, _ in HOL.get(m, [])}
    for r, c, d, inm in cells(2026, m):
        if inm and d in hol: continue
        w = window(L, r, c); dark = (255 - w) / 255
        if dark.max() < .05: continue
        a = np.clip(dark / dark.max(), 0, 1); rs = runs(a); s = f'{d:02d}'
        if len(rs) != 2: continue
        gaps.append(rs[1][0] - rs[0][1])
        tone = 'ink' if inm else 'grey'
        col = np.median(window(rgb, r, c)[a > .85], 0)
        for ch, (x0, x1) in zip(s, rs):
            g = a[:, x0:x1]
            if ch not in bank[tone] or g.sum() > bank[tone][ch][0].sum() * 0: bank[tone].setdefault(ch, (g, col, dark.max()))
GAP = int(np.median(gaps))
# grey digits: the cleaner ink shapes, in the pages' grey (some grey cells were too faint to cut cleanly)
g0 = next(iter(bank['grey'].values()))
gcol = np.median([v[1] for v in bank['grey'].values()], 0)
for ch, (g, col, mx) in bank['ink'].items(): bank['grey'][ch] = (g, gcol, mx)   # every grey digit: the ink shape in the grey
print('bank', {k: ''.join(sorted(v)) for k, v in bank.items()}, 'gap', GAP)

def draw_pair(rgb, r, c, s, tone, color=None, alpha_scale=None):
    gs = [bank[tone][ch] for ch in s]; w = sum(g[0].shape[1] for g in gs) + GAP
    x = int(round(COLS[c] - w / 2)); y = ROWS[r] - VH
    for g, col, mx in gs:
        a = g * (alpha_scale if alpha_scale is not None else 1); cc = np.array(color if color is not None else col)
        reg = rgb[y:y + a.shape[0], x:x + a.shape[1]]
        reg[:] = reg * (1 - a[..., None]) + cc * a[..., None]
        x += a.shape[1] + GAP

def disk(rgb, cx, cy, rad, color):
    S = 4; n = int(rad * 2 + 6); yy, xx = np.mgrid[0:n * S, 0:n * S] / S
    x0, y0 = int(cx - n / 2), int(cy - n / 2)
    m = ((xx + x0 - cx + .5 / S) ** 2 + (yy + y0 - cy + .5 / S) ** 2 <= rad ** 2).astype(float)
    a = m.reshape(n, S, n, S).mean((1, 3))
    reg = rgb[y0:y0 + n, x0:x0 + n]; reg[:] = reg * (1 - a[..., None]) + np.array(color) * a[..., None]

for m in range(1, 13):
    im = Image.open(page(m)).convert('RGB'); rgb = np.asarray(im).astype(float); L = rgb.mean(2)
    # the holiday circles of 2026: their colour and size, read off the page
    circ = {}
    for d26, d27 in HOL.get(m, []):
        r, c = next((r, c) for r, c, d, inm in cells(2026, m) if inm and d == d26)
        w = window(rgb, r, c); sat = w.max(2) - w.min(2); mask = (sat > 25) | (w.mean(2) < 200)
        lab, n = ndimage.label(mask); big = max(range(1, n + 1), key=lambda k: (lab == k).sum())
        ys, xs = np.where(lab == big)
        circ[d27] = (np.median(w[lab == big][w[lab == big].max(1) - w[lab == big].min(1) > 25], 0), (xs.max() - xs.min() + 1) / 2, ys.mean() - VH, xs.mean() - HW)
    # clear the old dates (the grid rows only; the weekday names, legend and page number stay)
    rgb[ROWS[0] - 70:ROWS[-1] + 70, 560:3760] = 255
    for r, c, d, inm in cells(2027, m):
        s = f'{d:02d}'
        if inm and d in circ:
            col, rad, dy, dx = circ[d]; disk(rgb, COLS[c], ROWS[r] + dy, rad, col)
            draw_pair(rgb, r, c, s, 'ink', color=(255, 255, 255), alpha_scale=1)
        else: draw_pair(rgb, r, c, s, 'ink' if inm else 'grey')
    # the year under the month's name: 2026 -> 2027, the 7 cut from July's large page number and set to the year's size and grey
    yb = L[3170:3300, 1700:2800] < 200; lab, n = ndimage.label(yb)
    sl = [s for s in ndimage.find_objects(lab) if (s[0].stop - s[0].start) > 30]
    # the year's four digits: group the pieces by x (a digit can fall into two pieces); the 6 is everything in the last group
    sl.sort(key=lambda s: s[1].start); grp = []
    for s in sl:
        if grp and s[1].start <= grp[-1][1] + 12: grp[-1] = [min(grp[-1][0], s[1].start), max(grp[-1][1], s[1].stop), min(grp[-1][2], s[0].start), max(grp[-1][3], s[0].stop)]
        else: grp.append([s[1].start, s[1].stop, s[0].start, s[0].stop])
    g6 = grp[-1]; x0, x1, y0, y1 = g6[0] + 1700, g6[1] + 1700, g6[2] + 3170, g6[3] + 3170
    ycol = np.median(rgb[y0:y1, x0:x1][L[y0:y1, x0:x1] < 120], 0)
    rgb[y0 - 6:y1 + 6, x0 - 6:x1 + 6] = 255
    jl = np.asarray(Image.open(page(7)).convert('L')).astype(float)
    big = jl[5450:5850, 3300:3900] < 200; lab2, n2 = ndimage.label(big)
    o = sorted(ndimage.find_objects(lab2), key=lambda s: (s[0].stop - s[0].start) * (s[1].stop - s[1].start))[-2:]
    seven = max(o, key=lambda s: s[1].start)  # the right-hand glyph of "07"
    g = (255 - jl[5450:5850, 3300:3900][seven]) / 255; g = np.clip(g / g.max(), 0, 1)
    h = y1 - y0; gi = Image.fromarray((g * 255).astype('uint8')).resize((max(1, round(g.shape[1] * h / g.shape[0])), h), Image.LANCZOS)
    a = np.asarray(gi).astype(float) / 255
    a = np.clip(a * 1.1, 0, 1)
    xx = x0 + ((x1 - x0) - a.shape[1]) // 2; reg = rgb[y0:y0 + h, xx:xx + a.shape[1]]
    reg[:] = reg * (1 - a[..., None]) + ycol * a[..., None]
    Image.fromarray(np.clip(rgb, 0, 255).astype('uint8')).save(f'{OUT}/m-{m:02d}.jpg', quality=92)
    print('month', m, 'circles', {k: (tuple(int(x) for x in v[0]), round(v[1])) for k, v in circ.items()})

# the cover: "CALENDAR 2026" -> 2027, the grid's own 7 set to the cover's size and weight, in the cover's brown
im = Image.open(f'{SRC}/pg-000.jpg').convert('RGB'); rgb = np.asarray(im).astype(float); L = rgb.mean(2)
yb = L[5550:5750, 1700:2700] < 200; lab, n = ndimage.label(yb)
six = max(ndimage.find_objects(lab), key=lambda s: s[1].start)
y0, y1, x0, x1 = six[0].start + 5550, six[0].stop + 5550, six[1].start + 1700, six[1].stop + 1700
ccol = np.median(rgb[y0:y1, x0:x1][L[y0:y1, x0:x1] < 150], 0)
g = bank['ink']['7'][0]; ys = np.where(g.max(1) > .1)[0]; g = g[ys[0]:ys[-1] + 1]
h = y1 - y0 - 2; gi = Image.fromarray((g * 255).astype('uint8')).resize((round(g.shape[1] * h / g.shape[0] * 1.08), h), Image.LANCZOS)
a = np.asarray(gi).astype(float) / 255; a = np.pad(a, 6)
a = ndimage.grey_dilation(a, footprint=np.array([[0,1,1,0],[1,1,1,1],[1,1,1,1],[0,1,1,0]])); a = np.clip((a - .12) / .6, 0, 1)
rgb[y0 - 4:y1 + 4, x0 - 4:x1 + 4] = 255
xx = x0 + ((x1 - x0) - a.shape[1]) // 2; yy = y0 - 4; reg = rgb[yy:yy + a.shape[0], xx:xx + a.shape[1]]
reg[:] = reg * (1 - a[..., None]) + ccol * a[..., None]
Image.fromarray(np.clip(rgb, 0, 255).astype('uint8')).save(f'{OUT}/m-00.jpg', quality=92)
print('cover ok')
