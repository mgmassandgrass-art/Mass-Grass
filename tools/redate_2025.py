"""Re-date Farah's 2025 calendar (Canva PDF, vector) for 2027, in the PDF itself, so everything stays sharp.
  python3 tools/redate_2025.py drafts/calendar-2025/src.pdf OUT.pdf

- the day numbers are text in the page's own Coming Soon subset (every digit is in it): they are removed and set again on the
  2027 grid (weeks start on Sunday, as printed), drawn twice with the same small offset Canva used for its faux bold;
- the holiday circles move to their 2027 dates in their own colours (Islamic dates by Umm al-Qura via hijridate, subject to
  moon sighting); a holiday that moves into another month takes its legend line with it (copied as vector from its page);
- the big year "2025" (LJ Studios MB: fill + a 2pt outline in the same colour) becomes "2027": "202" is set again in the same
  subset font, and the 7, which that subset lacks, is drawn as a marker stroke of the same weight and colour;
- the cover's "2025" becomes "2027" in Coming Soon (white fill, white outline), like the original.
"""
import sys, calendar, io
import pymupdf as fitz

SRC, OUT = sys.argv[1], sys.argv[2]
QR_BASE = sys.argv[3] if len(sys.argv) > 3 else ''   # e.g. https://www.massandgrass.com/g/ : each page gets a QR to <base>MM

def qr_code(p, r, url, col):
    """a QR code drawn as vector squares on a white tile, filling the rect where the old one stood"""
    import segno
    q = segno.make(url, error='m', micro=False); mx = [list(row) for row in q.matrix]; n = len(mx); quiet = 1
    p.draw_rect(r, color=None, fill=(1, 1, 1), overlay=True)
    u = r.width / (n + 2 * quiet); sh = p.new_shape()
    for y, row in enumerate(mx):
        x = 0
        while x < n:
            if row[x]:
                x1 = x
                while x1 < n and row[x1]: x1 += 1
                sh.draw_rect(fitz.Rect(r.x0 + (quiet + x) * u, r.y0 + (quiet + y) * u, r.x0 + (quiet + x1) * u + .02, r.y0 + (quiet + y + 1) * u + .02))
                x = x1
            else: x += 1
    sh.finish(color=None, fill=col, closePath=False); sh.commit()

def qr_colour(pno, r):
    """the old code's ink, read off the original page (the darkest third of its non-white pixels), kept dark enough to scan"""
    pix = src[pno].get_pixmap(matrix=fitz.Matrix(6, 6), clip=r)
    import numpy as np
    a = np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width, pix.n)[..., :3].reshape(-1, 3).astype(float)
    ink = a[a.mean(1) < 200]
    if not len(ink): return (.3, .3, .3)
    c = np.median(ink[ink.mean(1) <= np.percentile(ink.mean(1), 35)], 0) / 255
    k = min(1, .42 / max(c.mean(), .01)) if c.mean() > .42 else 1      # never lighter than 42%: phones must read it
    return tuple(float(v * k) for v in c)
Y = 2027
src = fitz.open(SRC); doc = fitz.open(SRC)
COVERED = fitz.PDF_REDACT_LINE_ART_REMOVE_IF_COVERED
NOIMG = fitz.PDF_REDACT_IMAGE_NONE

# 2025 circle day -> 2027 day, per month (page = month). Moves: Arafat + Eid al-Adha leave June for May, the Prophet's birthday
# leaves September for August.
HOL = {1: [(1, 5)], 3: [(21, 21)], 5: [(1, 1)], 6: [(26, 6)], 12: [(25, 25)]}
ADD = {5: [(15, 6, 0), (16, 6, 1)], 8: [(14, 9, 0)]}   # month: [(2027 day, source page, source legend line index)]
DROP = {6: [0, 1], 9: [0], 11: [0]}                             # month: legend lines (index from the top) that leave the page
DROPC = {6: [5, 6], 9: [4], 11: [15]}   # (the owner, 26 Nov 2026: no Independence Day, no flag)                            # month: 2025 circle days whose holiday leaves the month

def spans(p):
    for b in p.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            for s in l['spans']:
                yield s

def font_with(p, name, need):
    """the page's own subset of `name` that has every character in `need`"""
    from fontTools.ttLib import TTFont
    for f in p.get_fonts():
        if name in f[3]:
            buf = doc.extract_font(f[0])[3]
            cm = TTFont(io.BytesIO(buf)).getBestCmap() or {}
            if all(ord(c) in cm for c in need): return buf
    return None

def shown(pno, r):
    """the colour a dot shows on the printed page: sampled off the original near its rim, where no digit sits"""
    pix = src[pno].get_pixmap(matrix=fitz.Matrix(8, 8), clip=fitz.Rect(r.x0 + r.width * .1, r.y0 + r.height * .45, r.x0 + r.width * .22, r.y0 + r.height * .55))
    px = [pix.pixel(x, y) for x in range(pix.width) for y in range(pix.height)]
    return tuple(sorted(c[k] for c in px)[len(px) // 2] / 255 for k in range(3))

def cluster(vals, tol):
    vals = sorted(vals); out = [[vals[0]]]
    for v in vals[1:]:
        if v - out[-1][-1] <= tol: out[-1].append(v)
        else: out.append([v])
    return [sum(g) / len(g) for g in out]

def legend_lines(p):
    """the holiday legend: (circle rect, text rects) per line, top to bottom (small coloured dots right of the grid)"""
    dots = [d for d in p.get_drawings() if d['type'] == 'f' and d.get('fill_opacity', 1) > 0 and 4 < d['rect'].width < 7
            and abs(d['rect'].width - d['rect'].height) < 1 and d['rect'].x0 > 138 and 290 < d['rect'].y0 < 330]
    dots.sort(key=lambda d: d['rect'].y0); out = []
    for d in dots:
        r = d['rect']; txt = [fitz.Rect(s['bbox']) for s in spans(p) if s['size'] < 6 and abs((s['bbox'][1] + s['bbox'][3]) / 2 - (r.y0 + r.y1) / 2) < 4 and s['bbox'][0] > r.x1 - 1]
        out.append((r, txt, d['fill']))
    return out

for m in range(1, 13):
    p = doc[m]
    sp = list(spans(p))
    days = [s for s in sp if 'ComingSoon' in s['font'] and abs(s['size'] - 6.57) < .3 and s['text'].strip().isdigit() and s['bbox'][0] < 145]
    # the grid of 2025: columns from the weekday header, rows from the numbers' baselines
    head = next(s for s in sp if s['text'].startswith('SUN'))
    hx0, hx1 = head['bbox'][0], head['bbox'][2]
    cols = cluster([(s['bbox'][0] + s['bbox'][2]) / 2 for s in days], 6)
    rows = cluster([s['origin'][1] for s in days], 6)
    step = (rows[-1] - rows[0]) / (len(rows) - 1)
    fs = days[0]['size']
    # Canva's faux bold: each number twice, the second a hair up-left
    dx, dy = -0.17, -0.18
    # the holiday circles of 2025 on this page
    circ = []
    for d25, d27 in HOL.get(m, []) + [(d, None) for d in DROPC.get(m, [])]:
        off = (calendar.weekday(2025, m, 1) + 1) % 7; i = off + d25 - 1
        cx, cy = cols[i % 7], rows[i // 7] - fs * .33
        dd = min((d for d in p.get_drawings() if d['type'] == 'f' and d.get('fill_opacity', 1) > 0 and 10 < d['rect'].width < 14),
                 key=lambda d: abs((d['rect'].x0 + d['rect'].x1) / 2 - cx) + abs((d['rect'].y0 + d['rect'].y1) / 2 - cy))
        circ.append((d27, dd['rect'], shown(m, dd['rect'])))
    # the legend lines that leave, and those that arrive
    leg = legend_lines(p)
    dropped = [leg[i] for i in DROP.get(m, []) if i < len(leg)]
    kept = [l for i, l in enumerate(leg) if i not in DROP.get(m, [])]
    # the year
    yr = [s for s in sp if 'LJStudios' in s['font'] and s['text'].strip() == '2025']
    ybox = fitz.Rect(yr[0]['bbox']); ycol = fitz.sRGB_to_pdf(max(yr, key=lambda s: s['color'])['color'])
    yfs = yr[0]['size']; yorg = yr[0]['origin']
    ypath = [d for d in p.get_drawings() if d['type'] == 's' and fitz.Rect(d['rect']).intersects(ybox) and d['rect'].y1 < ybox.y1 + 3]
    lj = font_with(p, 'LJStudios', '202'); cs = font_with(p, 'ComingSoon', '0123456789')
    char5 = None
    for t in p.get_texttrace():
        if 'LJStudios' in t['font'] and t['opacity'] > 0:
            ch = [c for c in t['chars'] if chr(c[0]) == '5']
            if ch: char5 = fitz.Rect(ch[-1][3])

    # ---- remove: the day numbers, the year (text and outline), the circles, the legend lines that leave
    for s in days: p.add_redact_annot(fitz.Rect(s['bbox']) + (.3, .6, -.3, -.6), fill=False)
    for s in yr: p.add_redact_annot(fitz.Rect(s['bbox']), fill=False)
    for r, txt, _ in dropped + (kept if dropped else []):
        p.add_redact_annot(r + (-.5, -.5, .5, .5), fill=False)
        for t in txt: p.add_redact_annot(t, fill=False)
    p.apply_redactions(images=NOIMG, graphics=fitz.PDF_REDACT_LINE_ART_NONE, text=fitz.PDF_REDACT_TEXT_REMOVE)
    # the old circles, the year's outline and the dots that leave sit on the page's white: white covers them
    wipe = [r + (-.8, -.8, .8, .8) for _, r, _ in circ] + [fitz.Rect(d['rect']) + (-2.5, -2.5, 2.5, 2.5) for d in ypath] + [ybox + (-2, -2, 2, 2)]
    wipe += [r + (-.8, -.8, .8, .8) for r, _, _ in dropped + (kept if dropped else [])]
    # the QR code at the foot (a white tile of vector squares, or a small image) goes too (owner, 26 Nov 2026)
    qr = [fitz.Rect(d['rect']) for d in p.get_drawings() if d['type'] == 'f' and d.get('fill') == (1.0, 1.0, 1.0)
          and 18 < d['rect'].width < 40 and abs(d['rect'].width - d['rect'].height) < 2 and d['rect'].y0 > 330]
    qr += [r for im in p.get_images(full=True) for r in p.get_image_rects(im[0]) if 25 < r.width < 40 and r.y0 > 330 and r.x0 > 150]
    wipe += [r + (-1.5, -1.5, 1.5, 1.5) for r in qr]
    qr_at = (qr[0], qr_colour(m, qr[0])) if qr else None
    if m == 11: wipe.append(fitz.Rect(138, 309, 224, 331))     # Independence Day's line and its flag
    for r in wipe: p.draw_rect(r, color=None, fill=(1, 1, 1), overlay=True)

    # ---- set again
    p.insert_font(fontname='cs', fontbuffer=cs); p.insert_font(fontname='lj', fontbuffer=lj)
    font = fitz.Font(fontbuffer=cs)
    off = (calendar.weekday(Y, m, 1) + 1) % 7; n = calendar.monthrange(Y, m)[1]
    for _, r, col in circ: pass
    for d27, r, col in circ:
        if d27 is None: continue
        i = off + d27 - 1; cx, cy = cols[i % 7], (rows[0] + (i // 7) * step) - fs * .33
        w, h = r.width, r.height; p.draw_oval(fitz.Rect(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2), color=None, fill=col, overlay=True)
    for dnum in range(1, n + 1):
        i = off + dnum - 1; s = str(dnum); w = font.text_length(s, fs)
        x = cols[i % 7] - w / 2; y = rows[0] + (i // 7) * step
        for ox, oy in ((0, 0), (dx, dy)):
            p.insert_text((x + ox, y + oy), s, fontname='cs', fontsize=fs, color=(0, 0, 0))
    # the legend: the kept lines close up from the top; new ones (copied from the page they leave) go below them
    if leg or ADD.get(m):
        slots = [l[0] for l in leg] or [fitz.Rect(150, 313, 155, 318)]
        gap = (slots[1].y0 - slots[0].y0) if len(slots) > 1 else 8.6
        top = slots[0].y0; k = 0
        def place(src_page, line, k):
            r, txt, _ = line; clip = fitz.Rect(r.x0 - .5, r.y0 - 1.6, max([t.x1 for t in txt] + [r.x1]) + .5, r.y1 + 1.6)
            to = fitz.Rect(slots[0].x0 - .5, top + k * gap - 1.6, slots[0].x0 - .5 + clip.width, top + k * gap - 1.6 + clip.height)
            p.show_pdf_page(to, src, src_page, clip=clip)
        if dropped:
            for line in kept: place(m, line, k); k += 1
        else: k = len(leg)
        for d27, sp_, li in ADD.get(m, []):
            place(sp_, legend_lines(src[sp_])[li], k); k += 1
            i = off + d27 - 1; cx, cy = cols[i % 7], (rows[0] + (i // 7) * step) - fs * .33
            col = shown(sp_, legend_lines(src[sp_])[li][0])
            p.draw_oval(fitz.Rect(cx - 6.1, cy - 6.1, cx + 6.1, cy + 6.1), color=None, fill=col, overlay=True)
            s = str(d27); w = font.text_length(s, fs)
            for ox, oy in ((0, 0), (dx, dy)): p.insert_text((cx - w / 2 + ox, cy + fs * .33 + oy), s, fontname='cs', fontsize=fs, color=(0, 0, 0))
    # the year: each of "2", "0", "2" set again at its own place (the original is tracked wider than the font), then the 7 where
    # the 5 stood, drawn as one marker stroke as tall, wide and heavy as the 2 beside it (measured off the original page)
    bw = 2.04
    vis = [t for t in src[m].get_texttrace() if 'LJStudios' in t['font'] and t['opacity'] > 0 and ''.join(chr(c[0]) for c in t['chars']).strip() == '2025']
    chars = [c for c in vis[0]['chars'] if chr(c[0]).strip()]
    for c in chars[:3]:
        p.insert_text(c[2], chr(c[0]), fontname='lj', fontsize=yfs, color=ycol, fill=ycol, render_mode=2, border_width=bw / yfs)
    Z = 10; c2 = fitz.Rect(chars[0][3]); c5 = fitz.Rect(chars[3][3])
    pix = src[m].get_pixmap(matrix=fitz.Matrix(Z, Z), clip=c2)
    import numpy as np
    a = np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width, pix.n)[..., :3].astype(int)
    ink = np.abs(a - 255).sum(2) > 120; ys = np.where(ink.any(1))[0]; xs = np.where(ink.any(0))[0]
    top = c2.y0 + ys[0] / Z; bot = c2.y0 + ys[-1] / Z; wid = (xs[-1] - xs[0]) / Z
    runs = []
    for row in ink[ys[0]:ys[-1] + 1]:
        r = 0
        for v in row:
            if v: r += 1
            elif r: runs.append(r); r = 0
    stem = float(np.median(runs)) / Z
    pix5 = src[m].get_pixmap(matrix=fitz.Matrix(Z, Z), clip=c5)
    a5 = np.frombuffer(pix5.samples, np.uint8).reshape(pix5.height, pix5.width, pix5.n)[..., :3].astype(int)
    x0 = c5.x0 + np.where((np.abs(a5 - 255).sum(2) > 120).any(0))[0][0] / Z
    h = stem / 2
    sh = p.new_shape()
    sh.draw_polyline([(x0 + h, top + h + wid * .03), (x0 + wid * .55, top + h - wid * .01), (x0 + wid - h, top + h)])
    sh.draw_polyline([(x0 + wid - h, top + h), (x0 + wid * .62, top + (bot - top) * .42), (x0 + wid * .40, bot - h)])
    sh.finish(color=ycol, width=stem, lineCap=1, lineJoin=1, closePath=False)
    sh.commit()
    if QR_BASE and qr_at: qr_code(p, qr_at[0], f'{QR_BASE}{m:02d}', qr_at[1])
    print('month', m, 'rows', len(rows), 'circles', [c[0] for c in circ if c[0]], 'moved in', [a[0] for a in ADD.get(m, [])])

# the cover: CALENDAR 2025 -> 2027
p = doc[0]
yr = [s for s in spans(p) if s['text'].strip() == '2025']
org = yr[0]['origin']; fs = yr[0]['size']; ybox = fitz.Rect(yr[0]['bbox'])
cs = font_with(doc[1], 'ComingSoon', '0123456789')
# only the year's own characters (its box reaches into CALENDAR below), then its outline path, which lies on the photo:
# removed where it touches the year (the photo is an image and stays)
for t in p.get_texttrace():
    for c in t['chars']:
        if chr(c[0]) in '2025' and fitz.Rect(c[3]).intersects(ybox) and c[3][3] < org[1] + 3: p.add_redact_annot(fitz.Rect(c[3]) + (.2, .5, -.2, -.5), fill=False)
p.apply_redactions(images=NOIMG, graphics=fitz.PDF_REDACT_LINE_ART_NONE, text=fitz.PDF_REDACT_TEXT_REMOVE)
# the old year's white outline sits in the page as drawn art: the cover photo itself, cut from its own image, is laid over that
# strip again (above CALENDAR, which stays), and the new year goes on top
from PIL import Image
bg = max(p.get_images(full=True), key=lambda i: i[2] * i[3])[0]; ir = p.get_image_rects(bg)[0]
pm = fitz.Pixmap(doc, bg); im = Image.frombytes('RGB' if pm.n < 4 else 'RGBA', (pm.width, pm.height), pm.samples).convert('RGB')
R = fitz.Rect(ybox.x0 - 3, ybox.y0 + 6, ybox.x1 + 3, org[1] + 1.2)
sx, sy = pm.width / ir.width, pm.height / ir.height
def patch(R):
    crop = im.crop((round((R.x0 - ir.x0) * sx), round((R.y0 - ir.y0) * sy), round((R.x1 - ir.x0) * sx), round((R.y1 - ir.y0) * sy)))
    buf = io.BytesIO(); crop.save(buf, 'JPEG', quality=95); p.insert_image(R, stream=buf.getvalue(), overlay=True)
patch(R)
for i in p.get_images(full=True):           # the cover's QR code (owner, 26 Nov 2026)
    for r in p.get_image_rects(i[0]):
        if 15 < r.width < 40 and r.y0 > 300:
            patch(r + (-1.5, -1.5, 1.5, 1.5))
            if QR_BASE: qr_code(p, r, f'{QR_BASE}00', qr_colour(0, r))
p.insert_font(fontname='cs', fontbuffer=cs)
p.insert_text(org, '2027', fontname='cs', fontsize=fs, color=(1, 1, 1), fill=(1, 1, 1), render_mode=2, border_width=1.2165 / fs)
doc.save(OUT, garbage=3, deflate=True)
print('saved', OUT)
