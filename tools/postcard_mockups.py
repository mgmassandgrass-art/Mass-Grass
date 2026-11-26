"""Postcard photographs for the postcards page: Farah's paintings laid onto the cards of two free mockup photos.

  python3 tools/postcard_mockups.py          # both
  python3 tools/postcard_mockups.py env      # the envelopes and eggs (page hero)  -> web/assets/pcm-env{,-m}.webp
  python3 tools/postcard_mockups.py hands    # four hands holding cards            -> web/assets/pcm-hands{,-m}.webp

The blanks are in drafts/mockups/postcards/ (blank-env.jpg, blank-hands.png); card corners were measured on them
(quads-hands.json was fitted to the cards' edges). Things that lie on a card (envelope flaps, eggs, fingers) stay in
front: flaps by their kraft colour, eggs and fingers by hand-drawn shapes, each with a soft shadow on the card.
"""
import cv2, numpy as np, json, os, sys
from PIL import Image
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
A = R + 'web/assets/'; B = R + 'drafts/mockups/postcards/'
PARTS = set(sys.argv[1:]) or {'env', 'hands'}

def art(key):
    return np.asarray(Image.open(A + key + '.webp').convert('RGB')).astype(np.float32)

def trim(img, t=232):
    """cut away a scan's white margin"""
    g = img.mean(2); rows = np.nonzero(g.mean(1) < t)[0]; cols = np.nonzero(g.mean(0) < t)[0]
    return img[rows[0]:rows[-1] + 1, cols[0]:cols[-1] + 1] if len(rows) and len(cols) else img

def grow(quad, px):
    """push the corners out by px so no edge of the blank card shows"""
    q = np.float32(quad); c = q.mean(0); d = q - c
    return (q + d / np.linalg.norm(d, axis=1, keepdims=True) * px * 1.41).tolist()

def cover(img, ratio):
    """crop the painting to the card's shape (centre), so it prints edge to edge"""
    h, w = img.shape[:2]
    if w / h > ratio: nw = int(h * ratio); x = (w - nw) // 2; return img[:, x:x + nw]
    nh = int(w / ratio); y = (h - nh) // 2; return img[y:y + nh]

def quad_mask(shape, quad, ss=4):
    H, W = shape
    m = np.zeros((H * ss, W * ss), np.uint8)
    cv2.fillPoly(m, [np.int32(np.array(quad) * ss)], 255)
    return cv2.resize(m, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32) / 255

def plane_light(ch, mask):
    """the card's light as a gentle plane fitted to its brightest channel (prints on the blank card are ignored)"""
    H, W = ch.shape; ys, xs = np.nonzero(mask > .99)
    v = ch[ys, xs]; keep = v > np.percentile(v, 40)
    X = np.c_[xs[keep], ys[keep], np.ones(keep.sum())]
    c, *_ = np.linalg.lstsq(X, v[keep], rcond=None)
    yy, xx = np.mgrid[0:H, 0:W]
    pl = c[0] * xx + c[1] * yy + c[2]
    return pl / np.percentile(pl[mask > .99], 99)

def lay(ph, quad, key, occ, shadow, level, grain=1.6, soft=.55, pad=3):
    """warp the painting onto the card at quad (TL, TR, BR, BL), under the occluders"""
    H, W = ph.shape[:2]; quad = grow(quad, pad); q = np.float32(quad)
    wpx = (np.linalg.norm(q[1] - q[0]) + np.linalg.norm(q[2] - q[3])) / 2
    hpx = (np.linalg.norm(q[3] - q[0]) + np.linalg.norm(q[2] - q[1])) / 2
    a = cover(trim(art(key)), wpx / hpx); h, w = a.shape[:2]
    M = cv2.getPerspectiveTransform(np.float32([[0, 0], [w, 0], [w, h], [0, h]]), q)
    wa = cv2.warpPerspective(a, M, (W, H), flags=cv2.INTER_AREA if w > wpx * 1.5 else cv2.INTER_LANCZOS4)
    wa = cv2.GaussianBlur(wa, (0, 0), soft)
    m = quad_mask((H, W), quad)
    light = plane_light(ph.max(2), m)
    wa = wa * (level * light * (1 - shadow))[..., None]
    wa = wa + np.random.default_rng(7).normal(0, grain, (H, W, 1)).astype(np.float32)
    al = (m * (1 - occ))[..., None]
    return ph * (1 - al) + wa * al

def poly(shape, pts, feather=1.2):
    m = np.zeros(shape, np.uint8); cv2.fillPoly(m, [np.int32(pts)], 255)
    return cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), feather)

def drop(occ, dx, dy, blur, strength):
    """a soft shadow the occluder casts on the card"""
    M = np.float32([[1, 0, dx], [0, 1, dy]])
    s = cv2.warpAffine(occ, M, occ.shape[::-1]); s = cv2.GaussianBlur(s, (0, 0), blur)
    return np.clip(s * strength, 0, 1) * (1 - occ)

def save(arr, name, sizes):
    im = Image.fromarray(np.clip(arr, 0, 255).astype('uint8'))
    for suf, w in sizes:
        im.resize((w, round(im.height * w / im.width)), Image.LANCZOS).save(A + name + suf + '.webp', quality=86)
    print('ok', name)

if 'env' in PARTS:
    ph = np.asarray(Image.open(B + 'blank-env.jpg').convert('RGB')).astype(np.float32); H, W = ph.shape[:2]
    r, g, b = ph[..., 0], ph[..., 1], ph[..., 2]
    kraft = ((r - b > 22) & (r - g < 48) & (r < 215) & (r > 45)).astype(np.uint8)
    kraft = cv2.morphologyEx(kraft, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    kraft = cv2.morphologyEx(kraft, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    eggs = np.zeros((H, W), np.uint8)
    for cx, cy, rx, ry, ang in [(970, 1048, 86, 108, -20), (1268, 1252, 112, 103, 0), (1528, 412, 82, 108, -15)]:
        cv2.ellipse(eggs, (cx, cy), (rx, ry), ang, 0, 360, 1, -1)
    occ = cv2.GaussianBlur(np.maximum(kraft, eggs).astype(np.float32), (0, 0), 1.0)
    sh = drop(occ, -7, 6, 5, .28)                     # light comes from the right: shadows fall left and down
    CARDS = [('blueflowers', [(918, 248), (1322, -66), (1524, 198), (1120, 512)]),
             ('waves', [(428, 609), (925, 705), (859, 1058), (362, 962)]),
             ('hero', [(1067, 768), (1577, 799), (1555, 1161), (1045, 1130)])]
    for key, q in CARDS:
        ph = lay(ph, q, key, occ, sh, .93)
    save(ph, 'pcm-env', [('', 2000), ('-m', 1100)])

if 'hands' in PARTS:
    ph = np.asarray(Image.open(B + 'blank-hands.png').convert('RGB')).astype(np.float32); H, W = ph.shape[:2]
    Q = json.load(open(B + 'quads-hands.json'))
    FING = [  # fingers in front of the cards
        [(770, 250), (900, 250), (905, 300), (880, 318), (850, 316), (825, 318), (800, 312), (785, 300), (775, 280)],
        [(255, 1015), (300, 996), (340, 984), (370, 973), (392, 970), (402, 978), (404, 995), (398, 1008), (380, 1016),
         (340, 1032), (300, 1050), (260, 1068)],
        [(1000, 760), (1080, 745), (1140, 770), (1140, 840), (1115, 836), (1100, 836), (1060, 830), (1030, 824),
         (1012, 812), (1008, 795)],
        [(1120, 836), (1150, 860), (1175, 895), (1195, 925), (1230, 925), (1230, 830)]]
    zone = np.zeros((H, W), np.float32)
    for f in FING: zone = np.maximum(zone, poly((H, W), f))
    zone = cv2.dilate((zone > .5).astype(np.uint8), np.ones((15, 15), np.uint8))
    r, g, b = ph[..., 0], ph[..., 1], ph[..., 2]
    skin = ((r - g) - (g - b) > 30) | (ph.max(2) < 95)        # skin is pinker than the kraft card; nails are dark
    occ = (skin & (zone > 0)).astype(np.uint8)
    occ = cv2.morphologyEx(occ, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    occ = cv2.morphologyEx(occ, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    occ = cv2.GaussianBlur(occ.astype(np.float32), (0, 0), 1.0)
    sh = drop(occ, 6, 16, 7, .38)                     # light from above: fingers shade the card below them
    for key, k in [('sparklers', 'A'), ('dovegirl', 'B'), ('guitar', 'C'), ('pmoonsleep', 'D')]:
        ph = lay(ph, Q[k], key, occ, sh, .97)
    save(ph, 'pcm-hands', [('', 1500), ('-m', 900)])
