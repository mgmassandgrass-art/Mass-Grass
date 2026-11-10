#!/usr/bin/env python3
"""Builds the clean image set of the new site (web/assets) from the best source of every painting.

Product id == file name (web/assets/<id>.webp). Farah's hi-res calendar scans (cal-XX) replace the small or
watermarked copies; her own sticker sheet (Drive: "stickers Folder/stickers.pdf", rendered at 600 dpi into
STK_DIR as h-NN.png) gives the die-cut stickers. Run from the repo root:  python3 tools/web_assets.py [STK_DIR]
"""
import cv2, numpy as np, os, shutil, sys, glob
C = 'drafts/collage/site/assets/'; OUT = 'web/assets/'
os.makedirs(OUT, exist_ok=True)

def save(im, name, q=86, maxside=1800):
    h, w = im.shape[:2]; s = min(1, maxside / max(h, w))
    if s < 1: im = cv2.resize(im, (round(w * s), round(h * s)), interpolation=cv2.INTER_AREA)
    cv2.imwrite(OUT + name + '.webp', im, [cv2.IMWRITE_WEBP_QUALITY, q])

# 1 · paintings: id -> best clean source
ART = {
 'hero': C + 'hero.webp', 'sparklers': 'prototype/assets/sparklers.jpg', 'dovegirl': C + 'cal-06.webp', 'boattop': C + 'cal-07.webp',
 'guitar': 'prototype/assets/guitar.jpg', 'pmoon': C + 'cal-05.webp', 'house': 'prototype/assets/house.jpg', 'alley': C + 'alley.webp',
 'blueflowers': C + 'cal-03.webp', 'seafish': 'prototype/assets/seafish.jpg', 'pcartgirl': C + 'cal-08.webp', 'hill': 'prototype/assets/hill.jpg',
 'pelephant': C + 'cal-10.webp', 'waves': C + 'cal-01.webp', 'deirbalah': 'prototype/assets/deirbalah.jpg', 'pflower': C + 'cal-04.webp',
 'pmoonsleep': C + 'cal-11.webp', 'psea': C + 'cal-02.webp', 'bikeride': C + 'cal-09.webp', 'snowglobe': C + 'cal-12.webp',
 'boatman': C + 'boatman.webp',
}
for k, src in ART.items():
    im = cv2.imread(src); assert im is not None, src
    save(im, k)
    save(im, 't-' + k, 80, 640)          # thumbnail for grids

# 2 · die-cut stickers from Farah's sheet: white paper -> transparent, with a white sticker border
STK = {2: 's-lemons', 3: 's-pomegranate', 4: 's-kaak', 5: 's-jug', 6: 's-olives', 7: 's-family', 8: 's-fishers', 9: 's-jaffa', 10: 's-coast', 11: 's-cactus'}
sd = sys.argv[1] if len(sys.argv) > 1 else None
if sd:
    for n, name in STK.items():
        im = cv2.imread(f'{sd}/h-{n:02d}.png'); g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
        m = (g < 244).astype(np.uint8) * 255
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25)))
        cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cs = [c for c in cs if cv2.contourArea(c) > 400]
        solid = np.zeros_like(m); cv2.drawContours(solid, cs, -1, 255, -1)
        border = cv2.dilate(solid, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41)))
        border = cv2.GaussianBlur(border, (0, 0), 6); border = ((border > 110) * 255).astype(np.uint8)  # one smooth outline
        a = cv2.GaussianBlur(border, (0, 0), 1.2)
        ys, xs = np.where(a > 0); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        rgba = np.dstack([im, a])[y0:y1, x0:x1]
        cv2.imwrite(OUT + name + '.webp', rgba, [cv2.IMWRITE_WEBP_QUALITY, 90])
        print(name, rgba.shape)

# 3 · everything that is not art (mockups, papers, envelope, faces, calendar pages) comes over as it is
SKIP = {'pmoon', 'ppoppies', 'ptree', 's-dove', 's-gaza', 's-heart', 's-lemons'}   # watermarked or replaced above
UNUSED = set('''binding-mid.webp binding.webp coast.webp peg.webp pin.webp postmark.png pupil.png rope.webp sealB.webp sk-alley.webp sk-guitar.webp sk-hero.webp sk-hill.webp sk-house.webp sk-seafish.webp sk-sparklers.webp tear-edge.png pc-cork.webp pc-cork-top.webp pc-shelf.webp pc-shelf-top.webp pc-table.webp pc-hand.webp pc-hand-top.webp'''.split())   # in the old drafts, used by no page of the new site
SKIP_PRE = ('cal-', 'sk-cal-', 'calmock', 'c27-hero', 'c27-wall', 'c27-hands', 'c27-kitchen', 'cw-')
for f in sorted(glob.glob(C + '*')):
    b = os.path.basename(f); k = b.rsplit('.', 1)[0]
    if os.path.isdir(f) or b.endswith('.js') or k in SKIP or k in ART or b in UNUSED or b.startswith(SKIP_PRE): continue
    if not os.path.exists(OUT + b) or sd: shutil.copy2(f, OUT + b)
for f in glob.glob(C + 'p/sc-*.webp'): shutil.copy2(f, OUT + os.path.basename(f))   # small copies of the rooms, for thumbnails
# 4 · the size of every painting's file, for the page's "prints sharp up to" table and the frame it suits
import json
dims = {k: list(cv2.imread(OUT + k + '.webp').shape[1::-1]) for k in ART}
open('web/assets/js/art.js', 'w').write('/* written by tools/web_assets.py: [width, height] of every painting file */\nwindow.MG_ART = ' + json.dumps(dims) + ';\n')
print(len(os.listdir(OUT)), 'files in', OUT)
