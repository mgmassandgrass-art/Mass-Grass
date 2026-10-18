# The whale is hugged by the girl, so its middle is hidden. Cut the visible
# head and tail by colour, bridge the hidden middle by inpainting, and keep
# the visible-only mask as the hole it leaves in the painting.
import os
import json, cv2, numpy as np
from PIL import Image
S = os.environ.get('REEL_WORK', 'reelwork')
im = cv2.imread(S + '/drive/IMG_9920.jpg')
H, W = im.shape[:2]
x0, y0, x1, y1 = int(.24*W), int(.19*H), int(.63*W), int(.43*H)
c = im[y0:y1, x0:x1].copy()
h, w = c.shape[:2]
k = w / 1000.0   # polygon below is in the 1000-wide preview's units

b, g, r = [c[..., i].astype(int) for i in range(3)]
teal = (b > r + 25) & (g > r + 5)
dark = (b + g + r < 260)
# visible whale = teal paint plus the ink lines touching it, holes filled
vis = teal.astype(np.uint8) * 255
vis = cv2.morphologyEx(vis, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
ink = cv2.dilate(vis, np.ones((13, 13), np.uint8)) & (dark.astype(np.uint8) * 255)
vis = vis | ink
ff = vis.copy(); m2 = np.zeros((h+2, w+2), np.uint8); cv2.floodFill(ff, m2, (0, 0), 255)
vis = vis | cv2.bitwise_not(ff)
n, lab, st, _ = cv2.connectedComponentsWithStats(vis)
keep = [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] > 4000]
vis = np.isin(lab, keep).astype(np.uint8) * 255

pts = np.array([(75,70),(130,150),(190,270),(330,315),(470,322),(560,300),(660,262),(780,250),(900,258),(945,300),(950,380),(905,440),(820,490),(720,520),(600,535),(470,545),(370,540),(290,500),(230,420),(170,320),(110,230),(40,180),(60,165),(110,170)], np.float32) * k
def catmull(P, n=12):
    out = []
    for i in range(len(P)):
        p0, p1, p2, p3 = P[i-1], P[i], P[(i+1) % len(P)], P[(i+2) % len(P)]
        for u in np.linspace(0, 1, n, endpoint=False):
            out.append(.5 * ((2*p1) + (-p0+p2)*u + (2*p0-5*p1+4*p2-p3)*u*u + (-p0+3*p1-3*p2+p3)*u**3))
    return np.array(out)
poly = catmull(pts)
full = np.zeros((h, w), np.uint8); cv2.fillPoly(full, [poly.astype(np.int32)], 255)
raw_gap = ((full > 0) & (vis == 0)).astype(np.uint8)
raw_gap = cv2.morphologyEx(raw_gap, cv2.MORPH_OPEN, np.ones((int(9*k), int(9*k)), np.uint8))
n, lab, st, _ = cv2.connectedComponentsWithStats(raw_gap)
main = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
gap = lab == main
full = (vis | (gap.astype(np.uint8) * 255))
full = cv2.morphologyEx(full, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))

# the girl's arm leaves an ink line and paper slivers along the visible edge;
# widen the gap a little into the visible paint so those go too
near = cv2.dilate(gap.astype(np.uint8), np.ones((int(30*k), int(30*k)), np.uint8)) > 0
gap = gap | (near & (full > 0) & (cv2.erode(vis, np.ones((int(14*k), int(14*k)), np.uint8)) == 0))
# fill: smooth blend of the head and tail colours plus soft paper grain
src = cv2.erode(vis, np.ones((15, 15), np.uint8)) > 0
src &= ~cv2.dilate(gap.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
num = cv2.GaussianBlur(c.astype(np.float32) * src[..., None], (0, 0), 60 * k)
den = cv2.GaussianBlur(src.astype(np.float32), (0, 0), 60 * k)[..., None]
smooth = num / np.maximum(den, 1e-4)
rs = np.random.RandomState(4)
grain = cv2.GaussianBlur(rs.randn(h, w).astype(np.float32), (0, 0), 3) * 22
blot = cv2.GaussianBlur(rs.randn(h, w).astype(np.float32), (0, 0), 18) * 60
tex = smooth + (grain + blot)[..., None] * np.array([1.0, .9, .6])
soft = cv2.GaussianBlur(gap.astype(np.float32), (0, 0), 4)[..., None]
out = np.clip(c * (1 - soft) + tex * soft, 0, 255).astype(np.uint8)
out[~(full > 0)] = c[~(full > 0)]
# ink outline and the dashed spots along the back, drawn across the bridge
gapband = cv2.dilate(gap.astype(np.uint8), np.ones((int(8*k), int(8*k)), np.uint8)) > 0
cnt = max(cv2.findContours(full, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)[0], key=cv2.contourArea)[:, 0, :]
ink = (52, 44, 40)
for i in range(len(cnt)):
    x, y = cnt[i]
    if gapband[y, x]:
        cv2.circle(out, (int(x), int(y)), max(2, int(3.2 * k)), ink, -1, cv2.LINE_AA)
rs2 = np.random.RandomState(9)
mom = cv2.moments(full); cy_ = mom['m01'] / mom['m00']
for i in range(0, len(cnt), max(1, int(16 * k))):
    x, y = cnt[i]
    if not gapband[y, x] or y > cy_: continue
    for d in (14, 30):
        px, py = int(x), int(y + d * k + rs2.randint(-4, 4))
        if 0 <= py < h and full[py, px]:
            cv2.ellipse(out, (px + rs2.randint(-5, 5), py), (int(5 * k), int(2.5 * k)), rs2.randint(-30, 30), 0, 360, ink, -1, cv2.LINE_AA)
alpha = cv2.GaussianBlur(full, (3, 3), 0)
rgba = cv2.cvtColor(out, cv2.COLOR_BGR2BGRA); rgba[..., 3] = alpha
cv2.imwrite(S + '/cut/whale.png', rgba)
hole = cv2.GaussianBlur(vis, (3, 3), 0)
cv2.imwrite(S + '/cut/whale_hole.png', hole)
prev = np.full_like(out, (255, 0, 255)); a = alpha[..., None] / 255.0
cv2.imwrite(S + '/cut/prev_whale.jpg', (out * a + prev * (1 - a)).astype(np.uint8))
m = json.load(open(S + '/cut/meta.json'))
m['whale'] = {'pic': 'IMG_9920', 'x': x0, 'y': y0, 'w': w, 'h': h, 'W': W, 'H': H, 'hole': 'whale_hole.png'}
json.dump(m, open(S + '/cut/meta.json', 'w'), indent=1)
