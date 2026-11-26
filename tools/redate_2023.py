"""Re-date Farah's 2023 calendar (13 flat JPEG pages) for 2027, from the pages' own digits.
  python3 tools/redate_2023.py SRC_DIR OUT_DIR ABRIL_FATFACE.ttf

For each month page: the 2023 grid is found (weeks start on Sunday, as printed), every digit is cut from it into a bank, the old
numbers and holiday circles are painted out (inpainted from the paper around them, so the October blue stays blue), and the 2027
dates are set again with the same digits, columns and rows. Holiday circles move to their 2027 days in their own colour; a holiday
that moves into another month takes its legend line with it (cut from the page it leaves, which is painted clean there).
The cover's year: 2023 -> 2027, the 7 set in Abril Fatface (the cover's own typeface, OFL) at the 2's size and colour.
Islamic dates: Umm al-Qura via hijridate (Isra and Mi'raj 5 Jan, Eid al-Fitr 9 Mar, Eid al-Adha 16 May, the Prophet's birthday
14 Aug 2027), subject to moon sighting.
"""
import sys, calendar, numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

SRC, OUT, ABRIL = sys.argv[1], sys.argv[2], sys.argv[3]
page = lambda m: f'{SRC}/page{m + 1:02d}_1.jpg'
# 2023 circle day -> 2027 day (same month)
HOL = {3: [(8, 8), (30, 30)], 5: [(1, 1)]}
# taken off at the owner's request (26 Nov 2026): Independence Day (its circle and legend) and the flag beside Earth Day
GONE = [(11, 15)]
WIPE_EXTRA = {3: [(3125, 3196, 628, 736)]}
LEG_X = {11: .3}                    # November's legend sits at the left (the drawing on the right has round shapes too)
# holidays that change month: (2023 month, 2023 day) -> (2027 month, 2027 day)
MOVE = {(2, 18): (1, 5), (4, 21): (3, 9), (6, 29): (5, 16), (9, 27): (8, 14)}
WRAP = {10}                         # October: 31 goes into the first row's empty Sunday (no room for a sixth row)
XMAX = {7: .70}                      # July: the plant comes down beside the Saturday column
DARK_ON_LIGHT = {m: m != 10 for m in range(1, 13)}

def layout(y, m):
    off = (calendar.weekday(y, m, 1) + 1) % 7; n = calendar.monthrange(y, m)[1]
    rows = {}
    for d in range(1, n + 1): i = off + d - 1; rows.setdefault(i // 7, []).append((i % 7, d))
    return [rows[r] for r in sorted(rows)]

def ink_mask(rgb, m):
    L = rgb.mean(2)
    return (L < 140) if DARK_ON_LIGHT[m] else ((L > 205) & (rgb.max(2) - rgb.min(2) < 60))

def find_grid(rgb, m):
    """the 2023 rows of numbers: components grouped into rows whose digit counts match the 2023 month, top to bottom"""
    H, W = rgb.shape[:2]; mk = ink_mask(rgb, m)
    mk[:, int(W * XMAX.get(m, .80)):] = False; mk[:int(H * .04)] = False
    lab, n = ndimage.label(mk); objs = ndimage.find_objects(lab)
    comps = []
    for k, s in enumerate(objs):
        h, w = s[0].stop - s[0].start, s[1].stop - s[1].start
        if 35 <= h <= 140 and 6 <= w <= 140 and (lab[s] == k + 1).sum() > 120: comps.append((s, k + 1))
    comps.sort(key=lambda c: (c[0][0].start + c[0][0].stop) / 2)
    rows = []
    for c in comps:
        cy = (c[0][0].start + c[0][0].stop) / 2
        if rows and abs(cy - rows[-1]['cy']) < 48: rows[-1]['c'].append(c); rows[-1]['cy'] = np.mean([(x[0][0].start + x[0][0].stop) / 2 for x in rows[-1]['c']])
        else: rows.append({'cy': cy, 'c': [c]})
    # inside a row, a piece of another colour (a leaf, a stroke of the drawing) is not a digit
    for r in rows:
        if len(r['c']) < 3: continue
        cols = [np.median(rgb[c[0]][lab[c[0]] == c[1]], 0) for c in r['c']]; med = np.median(cols, 0)
        r['f'] = [c for c, cc in zip(r['c'], cols) if np.abs(cc - med).sum() < 70]
    want = [sum(len(str(d)) for _, d in r) for r in layout(2023, m)]
    # find consecutive rows whose counts match (a row may carry stray bits: allow the exact count only)
    def fits(j, w):
        r = rows[j]
        if len(r['c']) == w: return True
        if len(r.get('f', [])) == w: r['c'] = r['f']; return True
        return False
    # the dated rows, top to bottom, each the next one a row's height below (stray specks between them are skipped)
    for i in range(len(rows)):
        if not fits(i, want[0]): continue
        got = [i]
        for k in range(1, len(want)):
            nxt = [j for j in range(got[-1] + 1, len(rows)) if 110 < rows[j]['cy'] - rows[got[-1]]['cy'] < 240 and fits(j, want[k])]
            if not nxt: break
            got.append(nxt[0])
        if len(got) == len(want): return [rows[j] for j in got], lab
    raise SystemExit(f"month {m}: grid not found; rows {[len(r['c']) for r in rows]}, want {want}")

def bg_fill(rgb, mask):
    """paint a mask out from the paper around it"""
    img = np.clip(rgb, 0, 255).astype(np.uint8)
    return cv2.inpaint(img, mask.astype(np.uint8) * 255, 9, cv2.INPAINT_TELEA).astype(float)

def circle_of(rgb, box, m):
    """a holiday circle around a number: its colour, centre and radius (the tinted pixels around the digits)"""
    y0, y1, x0, x1 = box; cy, cx = (y0 + y1) / 2, (x0 + x1) / 2; R = int(max(y1 - y0, x1 - x0) * 1.2)
    win = rgb[int(cy - R):int(cy + R), int(cx - R):int(cx + R)]; L = win.mean(2); sat = win.max(2) - win.min(2)
    t = ((sat > 18) | (L < 235)) & (L > 120)
    lab, n = ndimage.label(t); k = max(range(1, n + 1), key=lambda i: (lab == i).sum())
    ys, xs = np.where(lab == k)
    col = np.median(win[lab == k], 0); r = (xs.max() - xs.min() + ys.max() - ys.min()) / 4
    return col, (cx - R + xs.mean(), cy - R + ys.mean()), r, (int(cy - R) + ys.min(), int(cy - R) + ys.max() + 1, int(cx - R) + xs.min(), int(cx - R) + xs.max() + 1)

def disk(rgb, cx, cy, r, col):
    S = 4; n = int(r * 2 + 8); yy, xx = np.mgrid[0:n * S, 0:n * S] / S; x0, y0 = int(cx - n / 2), int(cy - n / 2)
    a = (((xx + x0 - cx) ** 2 + (yy + y0 - cy) ** 2) <= r * r).astype(float).reshape(n, S, n, S).mean((1, 3))
    reg = rgb[y0:y0 + n, x0:x0 + n]; reg[:] = reg * (1 - a[..., None]) + np.array(col) * a[..., None]

def dots(rgb, below):
    """the legend's round dots under the grid: (y0, y1, x0, x1, colour)"""
    L = rgb.mean(2); sat = rgb.max(2) - rgb.min(2); mk = (sat > 30) & (L > 90) & (L < 235); mk[:int(below)] = False
    lab, n = ndimage.label(mk); out = []
    for k, s_ in enumerate(ndimage.find_objects(lab)):
        h, w = s_[0].stop - s_[0].start, s_[1].stop - s_[1].start
        if 40 < h < 110 and abs(h - w) < 14 and (lab[s_] == k + 1).mean() > .6:
            out.append((s_[0].start, s_[0].stop, s_[1].start, s_[1].stop, np.median(rgb[s_][lab[s_] == k + 1], 0)))
    return out

def legend_near(rgb, circ_col, gbox, m):
    """the legend line of a holiday: the round dot nearest the circle's colour under the grid, and the words after it"""
    ds = dots(rgb, gbox[1] + 20)
    if not ds: return None
    # a legend dot has words right after it
    def words(d):
        y0, y1, x0, x1, _ = d; band = ink_any(rgb[y0:y1, x1 + 10:x1 + 120])
        return band.mean() > .02
    ds = [d for d in ds if words(d)] or ds
    if m in LEG_X: ds = [d for d in ds if d[2] < rgb.shape[1] * LEG_X[m]] or ds
    y0, y1, x0, x1, _ = min(ds, key=lambda d: np.abs(d[4] - circ_col).sum())
    row = ink_any(rgb[y0 - 10:y1 + 10, x0:]); xs = np.where(row.any(0))[0]
    end = xs[0]
    for a, b in zip(xs, xs[1:]):
        if b - a > 120: break
        end = b
    return (y0 - 14, y1 + 14, x0 - 10, x0 + end + 14)

def ink_any(win):
    L = win.mean(2); return (L < 200) | (win.max(2) - win.min(2) > 40)

pages = {m: np.asarray(Image.open(page(m)).convert('RGB')).astype(float) for m in range(1, 13)}
orig = {m: pages[m].copy() for m in pages}
grids, legend_out = {}, {}

# ---- read every page: the grid, the digit bank, columns and rows, the circles
for m in range(1, 13):
    rgb = orig[m]; rows, lab = find_grid(rgb, m); L23 = layout(2023, m)
    bank, lefts, bases, gaps, numboxes = {}, {}, [], [], []
    for r, row in zip(L23, rows):
        cs = sorted(row['c'], key=lambda c: c[0][1].start); k = 0; base = []
        for col, d in r:
            s = str(d); parts = cs[k:k + len(s)]; k += len(s)
            for ch, (sl, lb) in zip(s, parts):
                a = (lab[sl] == lb).astype(float)
                # soft edges: the glyph's own anti-aliasing, read off the pixels around the component
                win = rgb[sl]; L = win.mean(2)
                if DARK_ON_LIGHT[m]: al = np.clip((235 - L) / (235 - 60), 0, 1)
                else: al = np.clip((L - 120) / (245 - 120), 0, 1)
                al = np.maximum(al * ndimage.binary_dilation(a, iterations=2), a)
                if ch not in bank or a.sum() > bank[ch][0].sum(): bank[ch] = (al, sl[0].stop - sl[0].start)
                base.append(sl[0].stop)
            if len(parts) == 2: gaps.append(parts[1][0][1].start - parts[0][0][1].stop)
            lefts.setdefault(col, []).append(parts[0][0][1].start)
            y0 = min(p[0][0].start for p in parts); y1 = max(p[0][0].stop for p in parts)
            numboxes.append((d, (y0, y1, parts[0][0][1].start, parts[-1][0][1].stop)))
        bases.append(np.median(base))
    dm = np.zeros(lab.shape, bool)
    for row in rows:
        for sl, lb in row['c']: dm[sl] |= lab[sl] == lb
    dm = ndimage.binary_erosion(dm, iterations=2)
    ink = np.median(rgb[dm], 0)
    cols = {c: np.median(v) for c, v in lefts.items()}
    # a column never filled in 2023 (none should be missing, but be safe): spaced like its neighbours
    step_c = np.median(np.diff([cols[c] for c in sorted(cols)]))
    for c in range(7): cols.setdefault(c, cols[min(cols, key=lambda k: abs(k - c))] + (c - min(cols, key=lambda k: abs(k - c))) * step_c)
    step = np.median(np.diff(bases))
    grids[m] = dict(rows=rows, lab=lab, bank=bank, cols=cols, base0=bases[0], step=step, gap=int(np.median(gaps)) if gaps else 10,
                    ink=ink, numboxes=dict(numboxes), gbox=(min(b[1][0] for b in numboxes), max(b[1][1] for b in numboxes)))
    print('read', m, 'rows', len(rows), 'digits', ''.join(sorted(bank)), 'ink', ink.astype(int), 'step', round(step))

# digits missing from a month's bank (a short month may lack some) come from a neighbour of the same polarity
for m in range(1, 13):
    for ch in '0123456789':
        if ch not in grids[m]['bank']:
            donor = min((k for k in grids if ch in grids[k]['bank'] and DARK_ON_LIGHT[k] == DARK_ON_LIGHT[m]), key=lambda k: abs(k - m))
            grids[m]['bank'][ch] = grids[donor]['bank'][ch]

# ---- circles and legends
circles = {m: [] for m in range(1, 13)}; moved_in = {m: [] for m in range(1, 13)}; wipe = {m: [] for m in range(1, 13)}
for m in range(1, 13):
    g = grids[m]
    for d23, d27 in HOL.get(m, []):
        col, c, r, box = circle_of(orig[m], g['numboxes'][d23], m)
        nb = g['numboxes'][d23]; circles[m].append((d27, col, r, (c[0] - nb[2], c[1] - (nb[0] + nb[1]) / 2)))
        wipe[m].append(box)
    for m23, d23 in GONE:
        if m23 != m: continue
        col, c, r, box = circle_of(orig[m], g['numboxes'][d23], m); wipe[m].append(box)
        lg = legend_near(orig[m], col, g['gbox'], m)
        if lg: wipe[m].append(lg)
    wipe[m] += WIPE_EXTRA.get(m, [])
    for (m23, d23), (m27, d27) in MOVE.items():
        if m23 != m: continue
        col, c, r, box = circle_of(orig[m], g['numboxes'][d23], m); wipe[m].append(box)
        nb = g['numboxes'][d23]
        lg = legend_near(orig[m], col, g['gbox'], m)
        if lg: wipe[m].append(lg)
        moved_in[m27].append((d27, col, r, (c[0] - nb[2], c[1] - (nb[0] + nb[1]) / 2), m, lg))

def put(rgb, x, base, s, g, color):
    for ch in s:
        al, h = g['bank'][ch]; y = int(round(base - al.shape[0])); xx = int(round(x))
        reg = rgb[y:y + al.shape[0], xx:xx + al.shape[1]]; a = al[:reg.shape[0], :reg.shape[1]]
        reg[:] = reg * (1 - a[..., None]) + np.array(color) * a[..., None]
        x += al.shape[1] + g['gap']

def num_width(s, g): return sum(g['bank'][ch][0].shape[1] for ch in s) + g['gap'] * (len(s) - 1)

for m in range(1, 13):
    g = grids[m]; rgb = orig[m].copy(); H, W = rgb.shape[:2]
    # paint out: every old number (its pixels, grown a little) and the circles / legends that leave or move
    mk = np.zeros((H, W), bool)
    for row in g['rows']:
        for sl, lb in row['c']: mk[sl] |= g['lab'][sl] == lb
    mk = ndimage.binary_dilation(mk, iterations=5)
    for y0, y1, x0, x1 in wipe[m]: mk[max(0, y0 - 4):y1 + 4, max(0, x0 - 4):x1 + 4] = True
    rgb = bg_fill(rgb, mk)
    # the 2027 grid
    L27 = layout(2027, m)
    if m in WRAP and len(L27) == 6: L27 = [[(c, d) for c, d in L27[5]] + L27[0]] + L27[1:5]
    hol = {d: c for d, *c in circles[m]}; hol.update({d: (col, r, off) for d, col, r, off, *_ in moved_in[m]})
    for ri, row in enumerate(L27):
        base = g['base0'] + ri * g['step']
        for col, d in row:
            s = str(d); x = g['cols'][col]
            if d in hol:
                ccol, r, (ox, oy) = hol[d]; h = g['bank']['1'][1]
                disk(rgb, x + ox, base - h / 2 + oy, r, ccol)
            put(rgb, x, base, s, g, g['ink'])
    # legend lines that arrive: cut from the page they left, laid under this page's own legend (or under the grid)
    for d27, col, r, off, src_m, lg in moved_in[m]:
        if not lg: continue
        y0, y1, x0, x1 = lg; piece = orig[src_m][y0:y1, x0:x1]; hh, ww = y1 - y0, x1 - x0
        here = ink_any(rgb); own = dots(orig[m], g['gbox'][1] + 20); ty = None
        tries = ([(own[-1][0] - 14 + (ln + 1) * int(hh * 1.25), own[-1][2] - 10) for ln in range(len(moved_in[m]) + 1)] if own else []) + \
                [(yy, x0) for yy in range(int(g['gbox'][1]) + 60, H - hh - 40, 10)] + [(yy, int(g['cols'][0]) - 10) for yy in range(int(g['gbox'][1]) + 60, H - hh - 40, 10)]
        for yy, xx in tries:
            if xx + ww < W and yy + hh < H and not here[yy:yy + hh, xx:xx + ww].any(): ty, x0, x1 = yy, xx, xx + ww; break
        if ty is None: print('  no room for a legend on', m); continue
        a = np.clip((255 - piece.mean(2)) / 255 * 3, 0, 1)
        if DARK_ON_LIGHT[m]: rgb[ty:ty + (y1 - y0), x0:x1] = rgb[ty:ty + (y1 - y0), x0:x1] * (1 - a[..., None]) + piece * a[..., None]
    Image.fromarray(np.clip(rgb, 0, 255).astype('uint8')).save(f'{OUT}/m-{m:02d}.jpg', quality=93)
    print('month', m, 'circles', sorted(hol))

# ---- the cover: 2023 -> 2027 (the 3 replaced by Abril Fatface's 7, sized to the 2)
rgb = np.asarray(Image.open(page(0)).convert('RGB')).astype(float); L = rgb.mean(2); H, W = L.shape
mk = (rgb.max(2) - rgb.min(2) > 20) & (L < 200); mk[int(H * .25):] = False
lab, n = ndimage.label(mk); big = sorted([s for s in ndimage.find_objects(lab) if (s[0].stop - s[0].start) > 200], key=lambda s: s[1].start)[:4]
two, three = big[0], big[3]
col = np.median(rgb[two][mk[two]], 0)
h2 = two[0].stop - two[0].start
f = ImageFont.truetype(ABRIL, 100); bb = f.getbbox('2'); size = int(100 * h2 / (bb[3] - bb[1]))
f = ImageFont.truetype(ABRIL, size); b7 = f.getbbox('7')
gl = Image.new('L', (b7[2] - b7[0] + 20, b7[3] - b7[1] + 20), 0); ImageDraw.Draw(gl).text((10 - b7[0], 10 - b7[1]), '7', font=f, fill=255)
a = np.asarray(gl).astype(float) / 255
wm = np.zeros(L.shape, bool); wm[three[0].start - 6:three[0].stop + 6, three[1].start - 6:three[1].stop + 6] = True
rgb = bg_fill(rgb, wm & ndimage.binary_dilation(mk, iterations=6))
x0 = three[1].start + ((three[1].stop - three[1].start) - (a.shape[1] - 20)) // 2 - 10; y0 = two[0].stop - (a.shape[0] - 20) - 10
reg = rgb[y0:y0 + a.shape[0], x0:x0 + a.shape[1]]; reg[:] = reg * (1 - a[..., None]) + col * a[..., None]
Image.fromarray(np.clip(rgb, 0, 255).astype('uint8')).save(f'{OUT}/m-00.jpg', quality=93)
print('cover ok')
