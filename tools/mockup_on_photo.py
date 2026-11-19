# Lays our calendar pages onto a mockup photograph: perspective warp onto the page corners (QL, QR measured by eye), the light fitted from the page margins, rings and binder holes kept, edges grown 1.3px with the border replicated so no sliver of the old sheet or dark rim shows.
import cv2, numpy as np, sys
from PIL import Image
from scipy import ndimage
R = '/home/user/Mass-Grass/'
SRC = sys.argv[1] if len(sys.argv) > 1 else 'blank-mockup.jpg'
OUT = sys.argv[2] if len(sys.argv) > 2 else '/tmp/'
ph = np.asarray(Image.open(SRC).convert('RGB')).astype(float)
H, W = ph.shape[:2]
L = ph.mean(2)
QL = [(442.5, 582.5), (797.5, 555), (881, 1105), (529, 1162.5)]   # left calendar's front page: TL TR BR BL
QR = [(1155, 539), (1536.5, 550), (1496, 1102.5), (1110, 1074)]   # right calendar's page

def load(p): return np.asarray(Image.open(p).convert('RGB')).astype(float)

def mask_of(q, s=4):
    m = np.zeros((H * s, W * s), np.uint8); cv2.fillPoly(m, [np.int32(np.array(q) * s)], 255)
    return cv2.resize(m, (W, H), interpolation=cv2.INTER_AREA).astype(float) / 255

def light_plane(q):
    """the light on the page, fitted as a plane from its plain paper margins (top and bottom strips), so the old art does not leak in"""
    m = mask_of(q) > .99
    m = ndimage.binary_erosion(m, iterations=6)
    ys, xs = np.nonzero(m); y0, y1 = ys.min(), ys.max(); h = y1 - y0
    strip = m & (((np.arange(H)[:, None] < y0 + .14 * h) & (np.arange(H)[:, None] > y0 + .06 * h)) | (np.arange(H)[:, None] > y1 - .10 * h))
    sat = ph.max(2) - ph.min(2)
    cand = strip & (sat < 40)
    v = L[cand]; keep = v > np.percentile(v, 55)
    yy, xx = np.nonzero(cand); yy, xx, v = yy[keep], xx[keep], v[keep]
    A = np.c_[xx, yy, np.ones_like(xx)].astype(float)
    c, *_ = np.linalg.lstsq(A, v, rcond=None)
    X, Y = np.meshgrid(np.arange(W), np.arange(H))
    return c[0] * X + c[1] * Y + c[2]

def put(out, q, art, soft=.7, grain=1.8, seed=3, rings=True, alpha=None):
    h, w = art.shape[:2]
    M = cv2.getPerspectiveTransform(np.float32([[0, 0], [w, 0], [w, h], [0, h]]), np.float32(q))
    wa = cv2.warpPerspective(art, M, (W, H), flags=cv2.INTER_AREA if w > 2 * W else cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
    mask = mask_of(q) if alpha is None else alpha
    plane = light_plane(q)
    shade = (plane / np.percentile(plane[mask_of(q) > .99], 98))[..., None]
    shade = np.clip(shade, 0, 1.02) * .955   # a printed page is a touch darker than pure white
    wa = ndimage.gaussian_filter(wa, (soft, soft, 0)) * shade
    wa = wa + np.random.default_rng(seed).normal(0, grain, (H, W, 1))
    # keep the rings and their binder holes: dark or coppery pixels in the strip along the top edge
    y0 = int(min(p[1] for p in q)) - 45
    band = np.zeros((H, W), bool); band[y0:y0 + 120] = True
    sat = ph.max(2) - ph.min(2)
    keep = band & ((L < 150) | (sat > 52)) if rings else np.zeros((H, W), bool)
    if rings: keep &= ndimage.binary_erosion(mask_of(q) > .99, iterations=16)   # only the holes inside the page, never its edge or the card behind
    if rings:   # a binder hole is dark metal with lighter bits: close the gaps and fill each hole whole
        copper = band & (sat > 52) & (L > 120) & ndimage.binary_erosion(mask_of(q) > .99, iterations=22)   # the ring ends that dip into the holes, thin strands: kept as they are
        keep = ndimage.binary_closing(keep, structure=np.ones((3, 3)), iterations=5)
        keep = ndimage.binary_fill_holes(keep)
        keep = ndimage.binary_opening(keep, structure=np.ones((3, 3)), iterations=1)
        keep = (keep & ndimage.binary_erosion(mask_of(q) > .99, iterations=12)) | copper
    keep = ndimage.binary_dilation(keep, iterations=2).astype(float); keep = ndimage.gaussian_filter(keep, 1.0)
    a = (mask * (1 - keep))[..., None]
    return out * (1 - a) + wa * a

def grow(q, d=1.3):
    c = np.mean(q, 0); out = []
    for p in q:
        v = np.array(p) - c; out.append(tuple(np.array(p) + v / np.linalg.norm(v) * d))
    return out

if __name__ == '__main__':
    QL = grow(QL); QR = grow(QR)
    left = load(R + 'drafts/calendar-v2/pg-001.jpg')
    right = load(R + 'drafts/calendar-v2/pg-000.jpg')
    out = put(ph.copy(), QL, left, seed=3)
    out = put(out, QR, right, seed=4)
    im = Image.fromarray(np.clip(out, 0, 255).astype('uint8'))
    im.save(OUT + 'calendar-mockup.png'); im.save(OUT + 'calendar-mockup.jpg', quality=93)
    im.crop((380, 480, 1600, 1230)).save(OUT + 'calendar-mockup-crop.png')
    print('ok')
