"""The photographs in the calendars' grid (the 'other calendars' cells): each photo laid on pure white with its whole
shadow, cut with room round it, and its edges faded to white so no shadow is ever cut by the frame.
Writes web/assets/olc-<name>.webp. Run after changing any of the sources below."""
import numpy as np
from PIL import Image
R = '/home/user/Mass-Grass/'; A = R + 'web/assets/'; D = R + 'drafts/calendar-2025/mockups/'
def load(p):
    im = Image.open(p); global CUTOUT; CUTOUT = im.mode in ('RGBA', 'LA')
    if CUTOUT:
        bg = Image.new('RGB', im.size, (255, 255, 255)); bg.paste(im, mask=im.convert('RGBA').split()[3]); im = bg
    return np.asarray(im.convert('RGB')).astype(np.float32)
def cell(src, name, W=1200, ratio=4 / 3):
    a = load(src); H0, W0 = a.shape[:2]
    # the paper white of the photo -> 255 (the brightest 2% of pixels)
    wpt = np.percentile(a.reshape(-1, 3), 98, axis=0); a = np.clip(a * (255 / np.maximum(wpt, 1)), 0, 255)
    ink = (255 - a.min(2)) > 8; ys, xs = np.where(ink)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max(); cw, ch = x1 - x0, y1 - y0
    # a canvas of the cell's shape round the content, 10% room on every side, pure white outside the photo
    w = max(cw * 1.2, ch * 1.2 * ratio); h = w / ratio
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    out = np.full((int(h), int(w), 3), 255, np.float32)
    ox, oy = int(w / 2 - cx), int(h / 2 - cy)
    sx0, sy0 = max(0, -ox), max(0, -oy); sx1, sy1 = min(W0, int(w) - ox), min(H0, int(h) - oy)
    out[sy0 + oy:sy1 + oy, sx0 + ox:sx1 + ox] = a[sy0:sy1, sx0:sx1]
    # fade toward white near the photo's own edges (where the canvas meets the photo) and the canvas edges
    m = np.zeros(out.shape[:2], np.float32); m[sy0 + oy:sy1 + oy, sx0 + ox:sx1 + ox] = 1
    from scipy import ndimage
    d = ndimage.distance_transform_edt(m); f = np.clip(d / (0.06 * w), 0, 1); f = f * f * (3 - 2 * f)
    if not CUTOUT: out = 255 - (255 - out) * f[..., None]   # a cut-out photo is already on pure white
    im = Image.fromarray(out.round().astype(np.uint8)); im = im.resize((W, round(W / ratio)), Image.LANCZOS)
    im.save(A + f'olc-{name}.webp', quality=88, method=6); print(name, im.size)
cell(A + 'cdm-base.webp', 'cal-a'); cell(A + 'cal-hero.webp', 'cal-b')
cell(A + 'ps-hero.webp', 'ps-a'); cell(R + 'drafts/calendar-2026/mockups/pm-4.jpg', 'ps-b')
cell(D + 'stand-aug.webp', 'gz-a'); cell(D + 'stand-pair.webp', 'gz-b')
