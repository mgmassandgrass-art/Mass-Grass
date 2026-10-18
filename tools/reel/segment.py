# Cut each moving element out of its painting with SAM point prompts.
import os
import json, sys
import numpy as np
from PIL import Image, ImageFilter
from rembg import new_session
from rembg.sessions.sam import SamSession

S = os.environ.get('REEL_WORK', 'reelwork')
D = S + '/drive/'
OUT = S + '/cut/'
import os; os.makedirs(OUT, exist_ok=True)

# name: painting, crop box (x0,y0,x1,y1 as fractions), positive points, negative points
EL = {
  'bus':   ('IMG_9906', (0.27, 0.46, 0.63, 0.64), [(0.40,0.52),(0.52,0.52),(0.37,0.61),(0.53,0.61),(0.33,0.55),(0.58,0.55)], [(0.70,0.55),(0.25,0.45),(0.50,0.44),(0.45,0.66)]),
  'whale': ('IMG_9920', (0.24, 0.19, 0.63, 0.43), [(0.55,0.33),(0.50,0.31),(0.40,0.34),(0.30,0.26),(0.36,0.30)], [(0.44,0.38),(0.44,0.22),(0.47,0.30),(0.58,0.38)]),
  'boat':  ('IMG_9924', (0.47, 0.21, 0.83, 0.77), [(0.68,0.45),(0.64,0.48),(0.56,0.30),(0.72,0.69),(0.76,0.40),(0.60,0.55)], [(0.45,0.62),(0.78,0.25),(0.80,0.60)]),
  'girl':  ('IMG_9926', (0.58, 0.71, 0.69, 0.91), [(0.63,0.81),(0.63,0.76),(0.62,0.86),(0.65,0.83)], [(0.60,0.92),(0.67,0.74)]),
  'dove':  ('IMG_9923', (0.39, 0.0, 1.0, 0.45), [(0.60,0.30),(0.55,0.12),(0.85,0.17),(0.70,0.30),(0.50,0.25)], [(0.45,0.45),(0.90,0.35),(0.38,0.05)]),
  'dove1': ('IMG_9922', (0.09, 0.17, 0.31, 0.40), [(0.17,0.31),(0.21,0.22),(0.24,0.31)], [(0.12,0.38),(0.28,0.37)]),
  'dove2': ('IMG_9922', (0.76, 0.15, 0.93, 0.40), [(0.86,0.30),(0.82,0.28),(0.88,0.23)], [(0.80,0.20),(0.92,0.36)]),
  'dove3': ('IMG_9922', (0.21, 0.55, 0.39, 0.79), [(0.30,0.66),(0.25,0.60),(0.32,0.72)], [(0.24,0.74),(0.37,0.58)]),
}

sess = new_session('sam')
only = sys.argv[1:]
meta = {}
for name, (pic, box, pos, neg) in EL.items():
    if only and name not in only: continue
    im = Image.open(D + pic + '.jpg').convert('RGB')
    W, H = im.size
    x0, y0, x1, y1 = int(box[0]*W), int(box[1]*H), int(box[2]*W), int(box[3]*H)
    crop = im.crop((x0, y0, x1, y1))
    pr = [{'type': 'point', 'label': 1, 'data': [p[0]*W-x0, p[1]*H-y0]} for p in pos]
    pr += [{'type': 'point', 'label': 0, 'data': [p[0]*W-x0, p[1]*H-y0]} for p in neg]
    m = sess.predict(crop, sam_prompt=pr)[0].convert('L')
    a = np.array(m) > 127
    # keep a soft, slightly grown edge so the paint edge is not clipped
    m = Image.fromarray((a*255).astype('uint8')).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.5))
    el = crop.convert('RGBA'); el.putalpha(m)
    el.save(OUT + name + '.png')
    meta[name] = {'pic': pic, 'x': x0, 'y': y0, 'w': x1-x0, 'h': y1-y0, 'W': W, 'H': H}
    # preview on a checkerboard
    chk = Image.new('RGB', crop.size, (255, 0, 255)); chk.paste(el, (0, 0), el)
    chk.thumbnail((500, 500)); chk.save(OUT + 'prev_' + name + '.jpg')
    print(name, crop.size, a.mean().round(3))
old = json.load(open(OUT + 'meta.json')) if os.path.exists(OUT + 'meta.json') else {}
old.update(meta); json.dump(old, open(OUT + 'meta.json', 'w'), indent=1)
