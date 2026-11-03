"""Cut the fingers (anything that is not the blank card) over a mockup's card into <scene>-top.webp.
usage: python3 occluder.py assets/pc-sea.webp x y ww wh [preview.png]"""
import sys, cv2, numpy as np
src, x, y, ww, wh = sys.argv[1], *map(float, sys.argv[2:6])
im = cv2.imread(src, cv2.IMREAD_COLOR); H, W = im.shape[:2]
x0, y0, x1, y1 = int(x*W), int(y*H), int((x+ww)*W), int((y+wh)*H)
lab = cv2.cvtColor(im, cv2.COLOR_BGR2LAB).astype(np.float32)
hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV).astype(np.float32)
card = (slice(y0+int((y1-y0)*.3), y1-int((y1-y0)*.3)), slice(x0+int((x1-x0)*.3), x1-int((x1-x0)*.3)))
ref = np.median(lab[card].reshape(-1, 3), 0)          # the card's own colour, light and tint
d = np.sqrt(((lab - ref) * [1.0, 2.2, 2.2]) ** 2).sum(2) ** .5 if False else np.sqrt((((lab - ref) * [1.0, 2.2, 2.2]) ** 2).sum(2))
# a smooth, slow change of light across the card is still card: compare with a heavily blurred copy too
blur = cv2.GaussianBlur(lab, (0, 0), 25)
dl = np.sqrt((((lab - blur) * [1.0, 2.2, 2.2]) ** 2).sum(2))
skin = (hsv[..., 1] > 40) & (hsv[..., 0] < 25)        # warm, saturated: skin
# card-like: the card's own tint, lit or shaded (its shaded edges are still card, the art goes over them)
cardlike = (np.abs(lab[..., 1] - ref[1]) < 5) & (np.abs(lab[..., 2] - ref[2]) < 7) & (lab[..., 0] > ref[0] - 70)
m = (((d > 26) & ~cardlike) | (skin & (d > 14))).astype(np.uint8)
roi = np.zeros_like(m); pad = 6
roi[max(0, y0-pad):y1+pad, max(0, x0-pad):x1+pad] = 1
m &= roi
m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
# keep only pieces that reach the card's edge (fingers come from outside), and are not thin edge lines
n, lb, st, _ = cv2.connectedComponentsWithStats(m)
keep = np.zeros_like(m)
for i in range(1, n):
    a, (bx, by, bw, bh) = st[i, 4], st[i, :4]
    if a < 400 or min(bw, bh) < 14: continue
    touches = bx <= x0+8 or by <= y0+8 or bx+bw >= x1-8 or by+bh >= y1-8
    if touches: keep[lb == i] = 1
# fill holes (nails, highlights) inside each finger
# only small holes: a ring along the card's edge must not turn into a filled card
inv = (1 - keep).astype(np.uint8)
n2, lb2, st2, _ = cv2.connectedComponentsWithStats(inv)
small = (x1 - x0) * (y1 - y0) * 0.01
for i in range(1, n2):
    if st2[i, 4] < small: keep[lb2 == i] = 1
keep = cv2.dilate(keep, np.ones((3, 3), np.uint8))
alpha = cv2.GaussianBlur(keep.astype(np.float32) * 255, (0, 0), 1.0)
out = np.dstack([im, alpha.clip(0, 255).astype(np.uint8)])
dst = src.replace('.webp', '-top.webp')
cv2.imwrite(dst, out, [cv2.IMWRITE_WEBP_QUALITY, 92])
if len(sys.argv) > 6:
    pv = im.copy(); pv[keep > 0] = (pv[keep > 0] * .4 + np.array([255, 0, 255]) * .6).astype(np.uint8)
    cv2.rectangle(pv, (x0, y0), (x1, y1), (0, 0, 255), 2); cv2.imwrite(sys.argv[6], pv)
print(dst, int(keep.sum()))
