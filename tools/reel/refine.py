# Clean the SAM cut-outs: drop stray specks, fill holes, then alpha-matte the
# edge so no paper halo is left around the paint.
import os
import json, sys, numpy as np, cv2
from PIL import Image
from scipy import ndimage
from pymatting import estimate_alpha_cf, estimate_foreground_ml

S = os.environ.get('REEL_WORK', 'reelwork')
CUT = S + '/cut/'
meta = json.load(open(CUT + 'meta.json'))

def refine(name, keep_frac=0.15, band=6):
    m = meta[name]
    src = np.array(Image.open(S + '/drive/' + m['pic'] + '.jpg').convert('RGB'))
    crop = src[m['y']:m['y'] + m['h'], m['x']:m['x'] + m['w']]
    a = np.array(Image.open(CUT + name + '.png'))[..., 3] > 128
    lab, n = ndimage.label(a)
    if n > 1:
        sizes = ndimage.sum(a, lab, range(1, n + 1))
        a = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= keep_frac * sizes.max()])
    a = ndimage.binary_fill_holes(a)
    a = ndimage.binary_closing(a, iterations=3)
    a = ndimage.binary_fill_holes(a)
    fg = ndimage.binary_erosion(a, iterations=band)
    bgm = ~ndimage.binary_dilation(a, iterations=band)
    tri = np.full(a.shape, .5); tri[fg] = 1; tri[bgm] = 0
    img = crop.astype(np.float64) / 255
    sc = 1.0
    if max(a.shape) > 1400:   # matting is O(pixels); work at reduced size for big crops
        sc = 1400 / max(a.shape)
        small = cv2.resize(img, None, fx=sc, fy=sc, interpolation=cv2.INTER_AREA)
        tris = cv2.resize(tri, (small.shape[1], small.shape[0]), interpolation=cv2.INTER_NEAREST)
        al = cv2.resize(estimate_alpha_cf(small, tris), (a.shape[1], a.shape[0]), interpolation=cv2.INTER_LINEAR)
    else:
        al = estimate_alpha_cf(img, tri)
    al = np.clip(al, 0, 1); al[fg] = 1; al[bgm] = 0
    fgc = estimate_foreground_ml(img, al)
    out = np.dstack([np.clip(fgc * 255, 0, 255), al * 255]).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(CUT + name + '.png')
    print(name, 'ok', a.mean().round(3))

for name in (sys.argv[1:] or [k for k in meta if k != 'whale']):
    refine(name)
