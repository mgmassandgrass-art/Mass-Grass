"""Lay each month of the Palestine calendar (set for 2027) onto the owner's photograph of June on its acrylic stand (pm-2).
The flat June page is registered to the photograph (SIFT + homography); then, in small windows, the photograph is fitted as
gain * page + offset (a guided filter with the page as guide), which carries the photograph's own light, the stack's shade and
the acrylic's haze and edge glints. Each other month is warped the same way and lit with that gain and offset.
Output: web/assets/pdp-MM.webp (the page region only, transparent outside) and pdm-base.webp (the photograph)."""
import sys, cv2, numpy as np
from PIL import Image
R = '/home/user/Mass-Grass/'
photo = cv2.imread(R + 'drafts/calendar-2026/mockups/pm-2.jpg').astype(np.float32) / 255
H0, W0 = photo.shape[:2]
src = lambda m: cv2.imread(R + f'drafts/calendar-2026/2027/m-{m:02d}.jpg')
ref = src(6)
s = 1600 / ref.shape[0]; refs = cv2.resize(ref, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
sift = cv2.SIFT_create(8000)
g = lambda a: cv2.cvtColor(a, cv2.COLOR_BGR2GRAY)
k1, d1 = sift.detectAndCompute(g(refs), None); k2, d2 = sift.detectAndCompute(g((photo * 255).astype(np.uint8)), None)
mt = cv2.BFMatcher().knnMatch(d1, d2, k=2); good = [m for m, n in mt if m.distance < .72 * n.distance]
A = np.float32([k1[m.queryIdx].pt for m in good]); B = np.float32([k2[m.trainIdx].pt for m in good])
Hm, inl = cv2.findHomography(A, B, cv2.RANSAC, 2.0); print('matches', len(good), 'inliers', int(inl.sum()))
warp = lambda im: cv2.warpPerspective(cv2.resize(im, (refs.shape[1], refs.shape[0]), interpolation=cv2.INTER_AREA).astype(np.float32) / 255, Hm, (W0, H0), flags=cv2.INTER_CUBIC)
mask = cv2.warpPerspective(np.ones(refs.shape[:2], np.float32), Hm, (W0, H0)); mask = cv2.erode((mask > .99).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(np.float32)
print('corners', cv2.perspectiveTransform(np.float32([[[0, 0], [refs.shape[1], 0], [refs.shape[1], refs.shape[0]], [0, refs.shape[0]]]]), Hm).round().tolist())
I = warp(ref)
# the light, as two slow fields: the paper's white W (read where June's page is plain paper, spread by normalised convolution)
# and the black level K (read off June's ink, the acrylic's haze lifts it); a page is then K + (W - K) * page, with the same
# gain on all three channels so no colour of June's carries over. The photograph's fine detail on plain paper (the acrylic's
# glints, the stack's edge) is added back as a high-pass residual.
gray = lambda x: x.mean(2)
Ig = gray(I); Pg = gray(photo)
sp = lambda x, s: cv2.GaussianBlur(x, (0, 0), s)
var = cv2.boxFilter(Ig * Ig, -1, (9, 9)) - cv2.boxFilter(Ig, -1, (9, 9)) ** 2
flat = ((Ig > .93) & (var < 1e-4)).astype(np.float32) * mask
nc = lambda v, w, s: sp(v * w, s) / (sp(w, s) + 1e-6)
def ncw(v, w):  # fine where paper is near, coarser where a big painting leaves no paper close by
    out = nc(v, w, 160)
    for s_ in (60, 18):
        cw = np.clip(sp(w, s_) * 6, 0, 1); out = out * (1 - cw) + nc(v, w, s_) * cw
    return out
W = np.dstack([ncw(photo[..., c], flat) for c in range(3)])
# black level: where June has dark ink, photo = K + (W-K)*I  ->  K = (P - W*I) / (1 - I)
ink = ((Ig < .5) * mask).astype(np.float32)
Kraw = np.clip((Pg - gray(W) * Ig) / np.maximum(1 - Ig, .3), 0, 1)
K = nc(Kraw, ink, 40)[..., None]
hp = np.clip(photo - np.dstack([sp(photo[..., c], 3) for c in range(3)]), -0.015, 1) * sp(cv2.erode(flat, np.ones((5, 5), np.uint8)), 1.5)[..., None]
y0, x0 = np.argwhere(mask > 0).min(0); y1, x1 = np.argwhere(mask > 0).max(0) + 1
print('box', x0, y0, x1, y1)
soft = cv2.GaussianBlur(mask, (0, 0), 1.0)
out = R + 'web/assets/'
for m in range(1, 13):
    J = warp(src(m)); o = np.clip(K + (W - K) * J + hp, 0, 1)
    rgba = np.dstack([o[..., ::-1], soft])[y0:y1, x0:x1]
    Image.fromarray((rgba * 255).round().astype(np.uint8), 'RGBA').save(out + f'pdp-{m:02d}.webp', quality=90, method=6)
    if m == 6: print('June error', float(np.abs(o - photo)[mask > 0].mean()))
Image.fromarray((photo[..., ::-1] * 255).astype(np.uint8)).save(out + 'pdm-base.webp', quality=88, method=6)
print('W H', W0, H0)

# the stand photograph cut square round the calendar (the page overlay sits at the same place inside it)
CX0, CY0, CS = 450, 140, 1100
Image.open(out + 'pdm-base.webp').crop((CX0, CY0, CX0 + CS, CY0 + CS)).save(out + 'pdm-base.webp', quality=88, method=6)
print('page box in the square: left %.4f%% top %.4f%% width %.4f%% height %.4f%%' % ((x0 - CX0) / CS * 100, (y0 - CY0) / CS * 100, (x1 - x0) / CS * 100, (y1 - y0) / CS * 100))
# the opening photograph: two calendars on their stands (pm-3), cut tight round them with an even margin, the pair in the middle
p3 = np.asarray(Image.open(R + 'drafts/calendar-2026/mockups/pm-3.jpg').convert('RGB')).astype(np.int16)
ink = (255 - p3.min(2)) > 26; ys, xs = np.where(ink); bx0, bx1, by0, by1 = xs.min(), xs.max(), ys.min(), ys.max()
pad = int((by1 - by0) * .06); cx = (bx0 + bx1) // 2; hw = (bx1 - bx0) // 2 + pad
box = (max(0, cx - hw), max(0, by0 - pad), min(2000, cx + hw), min(1333, by1 + pad)); print('hero box', box)
h = Image.open(R + 'drafts/calendar-2026/mockups/pm-3.jpg').convert('RGB').crop(box); h.save(out + 'ps-hero.webp', quality=88, method=6)
h.resize((1100, round(h.height * 1100 / h.width)), Image.LANCZOS).save(out + 'ps-hero-m.webp', quality=86, method=6); print('hero', h.size)
