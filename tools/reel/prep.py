# Scale paintings and cut-outs to working size for the canvas renderer.
import os
import json, os, numpy as np
from PIL import Image
S = os.environ.get('REEL_WORK', 'reelwork')
OUT = S + '/a/'; os.makedirs(OUT, exist_ok=True)
LONG = 1400
PICS = {'globe': 'IMG_9906', 'bike': 'IMG_9920', 'sea': 'IMG_9916', 'boatp': 'IMG_9924',
        'flower': 'IMG_9926', 'blue': 'IMG_9923', 'woman': 'IMG_9922', 'moon': 'IMG_9917'}
meta = json.load(open(S + '/cut/meta.json'))
man = {'prints': {}, 'els': {}}
scale = {}
for key, pic in PICS.items():
    im = Image.open(S + '/drive/' + pic + '.jpg').convert('RGB')
    s = LONG / max(im.size); scale[pic] = s
    im = im.resize((round(im.width*s), round(im.height*s)), Image.LANCZOS)
    im.save(OUT + key + '.jpg', quality=90)
    man['prints'][key] = {'w': im.width, 'h': im.height}
for name, m in meta.items():
    s = scale[m['pic']]
    el = Image.open(S + '/cut/' + name + '.png')
    w, h = round(el.width*s), round(el.height*s)
    el.resize((w, h), Image.LANCZOS).save(OUT + 'el_' + name + '.png')
    hole = Image.open(S + '/cut/' + m['hole']).convert('L') if 'hole' in m else el.split()[3]
    hole.resize((w, h), Image.LANCZOS).save(OUT + 'hole_' + name + '.png')
    pk = [k for k, v in PICS.items() if v == m['pic']][0]
    man['els'][name] = {'print': pk, 'x': round(m['x']*s), 'y': round(m['y']*s), 'w': w, 'h': h}
json.dump(man, open(OUT + 'manifest.json', 'w'), indent=1)
print(json.dumps(man))
# the table texture and the site's real logo
import shutil
ROOT = os.path.dirname(os.path.abspath(__file__)) + '/../../'
shutil.copy(ROOT + 'assets/paper/paper.webp', OUT + 'paper.webp')
shutil.copy(ROOT + 'prototype/assets/logo.svg', OUT + 'logo.svg')
