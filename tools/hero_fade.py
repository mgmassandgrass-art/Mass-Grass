"""The calendar pages' opening photographs, with their edges faded out so a shadow that runs to the photo's edge fades
instead of being cut (owner, 27 Nov 2026). A cut-out (transparent) photo fades its alpha; an opaque one fades to white.
Each photo also gets room round it, so the fade never touches the calendars.
Writes web/assets/<name>-f.webp and <name>-fm.webp (1100 wide)."""
import numpy as np
from PIL import Image
from scipy import ndimage
A = '/home/user/Mass-Grass/web/assets/'
def fade(name, room=.08, edge=.07):
    im = Image.open(A + name + '.webp'); cut = im.mode == 'RGBA'
    a = np.asarray(im.convert('RGBA')).astype(np.float32); H, W = a.shape[:2]
    p = int(W * room); out = np.zeros((H + 2 * p, W + 2 * p, 4), np.float32)
    if not cut: out[..., :3] = 255; out[..., 3] = 255
    out[p:p + H, p:p + W] = a
    m = np.zeros(out.shape[:2], np.float32); m[p:p + H, p:p + W] = 1
    d = ndimage.distance_transform_edt(m); f = np.clip(d / (edge * W), 0, 1); f = f * f * (3 - 2 * f)
    if cut: out[..., 3] *= f
    else: out[..., :3] = 255 - (255 - out[..., :3]) * f[..., None]
    r = Image.fromarray(out.round().astype(np.uint8), 'RGBA' if cut else 'RGBA')
    if not cut: r = r.convert('RGB')
    r.save(A + name + '-f.webp', quality=90, method=6)
    r.resize((1100, round(r.height * 1100 / r.width)), Image.LANCZOS).save(A + name + '-fm.webp', quality=88, method=6)
    print(name, r.size, 'cut-out' if cut else 'opaque')
for n in ('cal-hero', 'ps-hero', 'gz-hero'): fade(n)
