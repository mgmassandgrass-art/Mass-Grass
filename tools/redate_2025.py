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
Y = 2027
src = fitz.open(SRC); doc = fitz.open(SRC)
COVERED = fitz.PDF_REDACT_LINE_ART_REMOVE_IF_COVERED
NOIMG = fitz.PDF_REDACT_IMAGE_NONE

# 2025 circle day -> 2027 day, per month (page = month). Moves: Arafat + Eid al-Adha leave June for May, the Prophet's birthday
# leaves September for August.
HOL = {1: [(1, 5)], 3: [(21, 21)], 5: [(1, 1)], 6: [(26, 6)], 11: [(15, 15)], 12: [(25, 25)]}
ADD = {5: [(15, 6, 0), (16, 6, 1)], 8: [(14, 9, 0)]}   # month: [(2027 day, source page, source legend line index)]
DROP = {6: [0, 1], 9: [0]}                             # month: legend lines (index from the top) that leave the page
DROPC = {6: [5, 6], 9: [4]}                            # month: 2025 circle days whose holiday leaves the month

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
    # the year: "202" as it was (fill + outline), then the 7 as one marker stroke where the 5 stood
    bw = 2.04
    p.insert_text(yorg, '202', fontname='lj', fontsize=yfs, color=ycol, fill=ycol, render_mode=2, border_width=bw / yfs)
    f5 = char5 or fitz.Rect(ybox.x1 - ybox.width / 4, ybox.y0, ybox.x1, ybox.y1)
    lf = fitz.Font(fontbuffer=lj); x0 = yorg[0] + lf.text_length('202', yfs) + yfs * .035
    top_y = yorg[1] - yfs * .70; bot_y = yorg[1] - yfs * .02; wid = f5.width * .86
    stem = yfs * .135 + bw
    sh = p.new_shape()
    sh.draw_polyline([(x0 + wid * .12, top_y + yfs * .03), (x0 + wid * .55, top_y - yfs * .005), (x0 + wid * .95, top_y)])
    sh.draw_polyline([(x0 + wid * .95, top_y), (x0 + wid * .62, top_y + yfs * .30), (x0 + wid * .42, bot_y - stem * .5)])
    sh.finish(color=ycol, width=stem, lineCap=1, lineJoin=1, closePath=False)
    sh.commit()
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
crop = im.crop((round((R.x0 - ir.x0) * sx), round((R.y0 - ir.y0) * sy), round((R.x1 - ir.x0) * sx), round((R.y1 - ir.y0) * sy)))
buf = io.BytesIO(); crop.save(buf, 'JPEG', quality=95); p.insert_image(R, stream=buf.getvalue(), overlay=True)
p.insert_font(fontname='cs', fontbuffer=cs)
p.insert_text(org, '2027', fontname='cs', fontsize=fs, color=(1, 1, 1), fill=(1, 1, 1), render_mode=2, border_width=1.2165 / fs)
doc.save(OUT, garbage=3, deflate=True)
print('saved', OUT)
