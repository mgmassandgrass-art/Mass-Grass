"""Lay each month of Places in Gaza 2027 onto the owner's photograph of August on its wooden stand (stand-aug).
Same method as tools/palestine/month_on_stand.py (SIFT homography, the photo's paper white W and black level K as slow fields,
the fine residual added back); the wooden stand in front of the page is found where the lit August page and the photograph
disagree, and the photograph keeps it.
Output: web/assets/gzs-MM.webp (page overlay, transparent outside) + gzs-base.webp (the photo, cut square), and the hero
gz-hero{,-m}.webp from stand-pair (cover + October)."""
import cv2, numpy as np, pymupdf as fitz
from PIL import Image
R = '/home/user/Mass-Grass/'; D = R + 'drafts/calendar-2025/'
def onwhite(path):  # the owner's photographs come with a transparent background: lay them on white
    im = Image.open(path).convert('RGBA'); bg = Image.new('RGB', im.size, (255, 255, 255)); bg.paste(im, mask=im.split()[3]); return bg
photo = cv2.cvtColor(np.asarray(onwhite(D + 'mockups/stand-aug.webp')), cv2.COLOR_RGB2BGR).astype(np.float32) / 255; H0, W0 = photo.shape[:2]
doc = fitz.open(D + 'Places-in-Gaza-2027.pdf')
def src(m, h=1600):
    p = doc[m]; z = h / p.rect.height; px = p.get_pixmap(matrix=fitz.Matrix(z, z))
    return cv2.cvtColor(np.frombuffer(px.samples, np.uint8).reshape(px.height, px.width, px.n)[..., :3], cv2.COLOR_RGB2BGR)
ref = src(8); sift = cv2.SIFT_create(12000); g = lambda a: cv2.cvtColor(a, cv2.COLOR_BGR2GRAY)
k1, d1 = sift.detectAndCompute(g(ref), None); k2, d2 = sift.detectAndCompute(g((photo * 255).astype(np.uint8)), None)
good = [m for m, n in cv2.BFMatcher().knnMatch(d1, d2, k=2) if m.distance < .72 * n.distance]
A = np.float32([k1[m.queryIdx].pt for m in good]); B = np.float32([k2[m.trainIdx].pt for m in good])
Hm, inl = cv2.findHomography(A, B, cv2.RANSAC, 2.0); print('matches', len(good), 'inliers', int(inl.sum()))
warp = lambda im: cv2.warpPerspective(im.astype(np.float32) / 255, Hm, (W0, H0), flags=cv2.INTER_CUBIC)
mask = cv2.warpPerspective(np.ones(ref.shape[:2], np.float32), Hm, (W0, H0)); mask = cv2.erode((mask > .99).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(np.float32)
I = warp(ref); gray = lambda x: x.mean(2); Ig = gray(I); Pg = gray(photo); sp = lambda x, s: cv2.GaussianBlur(x, (0, 0), s)
var = cv2.boxFilter(Ig * Ig, -1, (9, 9)) - cv2.boxFilter(Ig, -1, (9, 9)) ** 2
nc = lambda v, w, s: sp(v * w, s) / (sp(w, s) + 1e-6)
# the stand: where the photo is far from the page (wood is darker / browner than paper or ink of the page)
first = np.abs(Pg - Ig) * mask
occ = (sp(first, 2) > .18).astype(np.uint8); occ = cv2.morphologyEx(occ, cv2.MORPH_OPEN, np.ones((9, 9), np.uint8))
# keep only big blobs (the stand), not small differences in the painting
n, lab, st, _ = cv2.connectedComponentsWithStats(occ); occ = np.isin(lab, [i for i in range(1, n) if st[i, 4] > 20000]).astype(np.uint8)
occ = cv2.dilate(occ, np.ones((7, 7), np.uint8)).astype(np.float32); print('stand px', int(occ.sum()))
vis = mask * (1 - occ)
flat = ((Ig > .93) & (var < 1e-4)).astype(np.float32) * vis
def ncw(v, w):
    out = nc(v, w, 160)
    for s_ in (60, 18):
        cw = np.clip(sp(w, s_) * 6, 0, 1); out = out * (1 - cw) + nc(v, w, s_) * cw
    return out
W = np.dstack([ncw(photo[..., c], flat) for c in range(3)])
ink = ((Ig < .5) * vis).astype(np.float32)
K = nc(np.clip((Pg - gray(W) * Ig) / np.maximum(1 - Ig, .3), 0, 1), ink, 40)[..., None]
hp = np.clip(photo - np.dstack([sp(photo[..., c], 3) for c in range(3)]), -0.015, 1) * sp(cv2.erode(flat, np.ones((5, 5), np.uint8)), 1.5)[..., None]
soft = cv2.GaussianBlur(mask, (0, 0), 1.0) * (1 - cv2.GaussianBlur(occ, (0, 0), 1.2))
y0, x0 = np.argwhere(mask > 0).min(0); y1, x1 = np.argwhere(mask > 0).max(0) + 1
# the square crop round the calendar
ys, xs = np.where((255 - (photo * 255).min(2)) > 26); cx, cy = (xs.min() + xs.max()) // 2, (ys.min() + ys.max()) // 2
CS = int(max(xs.max() - xs.min(), ys.max() - ys.min()) * 1.12); CX0, CY0 = max(0, cx - CS // 2), max(0, cy - CS // 2); CS = min(CS, W0 - CX0, H0 - CY0)
out = R + 'web/assets/'
for m in range(1, 13):
    J = warp(src(m)); o = np.clip(K + (W - K) * J + hp, 0, 1)
    if m == 8: print('August error', float(np.abs(o - photo)[vis > 0].mean()))
    rgba = np.dstack([o[..., ::-1], soft])[y0:y1, x0:x1]; k = 1100 / CS
    Image.fromarray((rgba * 255).round().astype(np.uint8), 'RGBA').resize((round((x1 - x0) * k), round((y1 - y0) * k)), Image.LANCZOS).save(out + f'gzs-{m:02d}.webp', quality=90, method=6)
Image.fromarray((photo[..., ::-1] * 255).astype(np.uint8)).crop((CX0, CY0, CX0 + CS, CY0 + CS)).resize((1100, 1100), Image.LANCZOS).save(out + 'gzs-base.webp', quality=88, method=6)
print('scale', 1100 / CS, 'page box in the square: left %.4f%% top %.4f%% width %.4f%% height %.4f%%' % ((x0 - CX0) / CS * 100, (y0 - CY0) / CS * 100, (x1 - x0) / CS * 100, (y1 - y0) / CS * 100))
# the hero: two calendars on their stands, cut tight with an even margin
p3 = np.asarray(onwhite(D + 'mockups/stand-pair.webp')).astype(np.int16)
ys, xs = np.where((255 - p3.min(2)) > 26); bx0, bx1, by0, by1 = xs.min(), xs.max(), ys.min(), ys.max()
pad = int((by1 - by0) * .06); box = (max(0, bx0 - pad), max(0, by0 - pad), min(p3.shape[1], bx1 + pad), min(p3.shape[0], by1 + pad))
h = onwhite(D + 'mockups/stand-pair.webp').crop(box); h.save(out + 'gz-hero.webp', quality=88, method=6)
h.resize((1100, round(h.height * 1100 / h.width)), Image.LANCZOS).save(out + 'gz-hero-m.webp', quality=86, method=6); print('hero', box, h.size)
