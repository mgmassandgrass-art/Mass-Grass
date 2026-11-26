"""Lay a mockup photograph on white: the plain backdrop (and the shadows on it) is lifted to white, the objects stay as shot.
  python3 tools/whiten_bg.py IN OUT [--sat 12] [--lo .35] [--hi 1.12]
The backdrop is every low-saturation pixel, within a band around the backdrop's own brightness, connected to the picture's edge.
Each such pixel is divided by the backdrop's smooth light (a wide blur of the backdrop alone), so a shadow keeps its depth on white.
"""
import sys, argparse, numpy as np, cv2
from PIL import Image
from scipy import ndimage
ap = argparse.ArgumentParser(); ap.add_argument('inp'); ap.add_argument('out')
ap.add_argument('--sat', type=float, default=12); ap.add_argument('--lo', type=float, default=.35); ap.add_argument('--hi', type=float, default=1.12)
ap.add_argument('--width', type=int, default=0)
a = ap.parse_args()
rgb = np.asarray(Image.open(a.inp).convert('RGB')).astype(np.float32)
L = rgb.mean(2); sat = rgb.max(2) - rgb.min(2)
edge = np.concatenate([L[:8].ravel(), L[-8:].ravel(), L[:, :8].ravel(), L[:, -8:].ravel()])
lb = float(np.median(edge))
cand = (sat < a.sat) & (L > lb * a.lo) & (L < lb * a.hi)
lab, n = ndimage.label(cand)
border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
bg = np.isin(lab, list(border))
bg = ndimage.binary_opening(bg, iterations=1)
# the backdrop's own light: a wide normalised blur of its brightest half (shadows left out), so vignetting goes too
lit = bg & (L > lb * .9)
s = max(rgb.shape[:2]) / 8
num = cv2.GaussianBlur(np.where(lit, L, 0).astype(np.float32), (0, 0), s); den = cv2.GaussianBlur(lit.astype(np.float32), (0, 0), s)
light = np.clip(num / np.maximum(den, 1e-3), lb * .7, 255)
gain = (255 / light)[..., None]
lifted = np.clip(rgb * gain, 0, 255)
# objects keep their own pixels; the seam is feathered
w = cv2.GaussianBlur(bg.astype(np.float32), (0, 0), 1.2)[..., None]
out = lifted * w + rgb * (1 - w)
# a pixel of an object right against the backdrop that was lighter than it stays; nothing ends darker than it was lifted
im = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
if a.width: im = im.resize((a.width, round(im.height * a.width / im.width)), Image.LANCZOS)
im.save(a.out, quality=88) if a.out.endswith(('.jpg', '.webp')) else im.save(a.out)
print('backdrop', round(lb), 'share', round(bg.mean(), 2))
