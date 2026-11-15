"""Set the owner's photographed mockups of the 2026 "Palestine" calendar to 2027.
Each visible page is found in the photograph by matching it against the 2026 page (SIFT + RANSAC, one homography per band
down the page, since the sheets bend into the acrylic stand at the foot). Only what changed is added to the photograph:
photo + (2027 page - 2026 page), both warped the same way and scaled to the photo's own light, and only where the photograph
really shows that page (not where another calendar stands in front of it). Paper, acrylic, shadows stay the photograph's.
  python3 tools/redate_mockups.py PAGES_2026_DIR PAGES_2027_DIR PHOTO OUT  m [m ...]     (m: 0 = cover, 1..12 = months)
"""
import sys, numpy as np, cv2
from PIL import Image

OLD, NEW, PHOTO, OUT = sys.argv[1:5]; MONTHS = [int(x) for x in sys.argv[5:]]
PW = 1400; import os; DBG = os.environ.get("DBG")
def page(d, m, new):
    f = f'{d}/m-{m:02d}.jpg' if new else (f'{d}/pg-000.jpg' if m == 0 else f'{d}/pg-{4 + 2 * (m - 1):03d}.jpg')
    im = Image.open(f).convert('RGB'); return np.asarray(im.resize((PW, round(PW * im.height / im.width)), Image.LANCZOS)).astype(np.float32)

ph = np.asarray(Image.open(PHOTO).convert('RGB')).astype(np.float32); H, W = ph.shape[:2]
gph = cv2.cvtColor(ph.astype(np.uint8), cv2.COLOR_RGB2GRAY)
sift = cv2.SIFT_create(nfeatures=40000, contrastThreshold=.01)
kp2, d2 = sift.detectAndCompute(gph, None)
out = ph.copy()
for m in MONTHS:
    o, n = page(OLD, m, False), page(NEW, m, True); ph_h = o.shape[0]
    go = cv2.cvtColor(o.astype(np.uint8), cv2.COLOR_RGB2GRAY)
    kp1, d1 = sift.detectAndCompute(go, None)
    mt = cv2.BFMatcher().knnMatch(d1, d2, k=2)
    good = [a for a, b in mt if a.distance < .75 * b.distance]
    src = np.float32([kp1[g.queryIdx].pt for g in good]); dst = np.float32([kp2[g.trainIdx].pt for g in good])
    Hg, inl = cv2.findHomography(src, dst, cv2.USAC_MAGSAC, 3.0)
    print('month', m, 'matches', len(good), 'inliers', int(inl.sum()) if inl is not None else 0)
    if Hg is None or inl.sum() < 25: continue
    near = np.zeros((H, W), np.uint8)
    hull = cv2.convexHull(dst[inl.ravel() > 0].astype(np.int32)); cv2.fillPoly(near, [hull], 1)   # where this page shows
    # per band homographies (the sheet bends at the foot): fit on matches in the band, else keep the global one; the bands are
    # blended into one warped old page (wo), new page (wn) and coverage (wv)
    bands = [(0, .58), (.5, .8), (.72, 1.0)]
    WO = np.zeros((H, W, 3), np.float32); WN = np.zeros((H, W, 3), np.float32); WS = np.zeros((H, W), np.float32); WV = np.zeros((H, W), np.float32)
    for b0, b1 in bands:
        sel = (src[:, 1] >= b0 * ph_h) & (src[:, 1] <= b1 * ph_h); Hb = Hg
        if sel.sum() >= 12:
            h2, i2 = cv2.findHomography(src[sel], dst[sel], cv2.USAC_MAGSAC, 2.5)
            if h2 is not None and i2.sum() >= 10:
                # keep a band's own fit only if it stays close to the page's (a few matches can run wild)
                cs = np.float32([[0, b0 * ph_h], [PW, b0 * ph_h], [PW, b1 * ph_h], [0, b1 * ph_h]]).reshape(-1, 1, 2)
                dev = np.abs(cv2.perspectiveTransform(cs, h2) - cv2.perspectiveTransform(cs, Hg)).max()
                if dev < 25: Hb = h2
        s_ = np.sqrt(abs(np.linalg.det(Hb[:2, :2]))) / max(abs(Hb[2, 2]), 1e-6)
        sig = max(0, .5 / max(s_, 1e-3) - .5) if s_ < 1 else 0
        ob = cv2.GaussianBlur(o, (0, 0), sig) if sig > .3 else o; nb = cv2.GaussianBlur(n, (0, 0), sig) if sig > .3 else n
        bm = np.zeros(o.shape[:2], np.float32); bm[int(b0 * ph_h):int(b1 * ph_h)] = 1; bm = cv2.GaussianBlur(bm, (0, 0), 6)
        wb = cv2.warpPerspective(bm, Hb, (W, H)); wv = cv2.warpPerspective(np.ones(o.shape[:2], np.float32), Hb, (W, H), flags=cv2.INTER_NEAREST)
        WO += cv2.warpPerspective(ob, Hb, (W, H)) * wb[..., None]; WN += cv2.warpPerspective(nb, Hb, (W, H)) * wb[..., None]; WS += wb; WV = np.maximum(WV, wv)
    wo = WO / np.maximum(WS, 1e-4)[..., None]; wn = WN / np.maximum(WS, 1e-4)[..., None]; wv = WV * (WS > .05)
    # the paper's light: a wide closing takes away ink, holiday circles and digits alike
    Lp = cv2.GaussianBlur(cv2.morphologyEx(out, cv2.MORPH_CLOSE, np.ones((31, 31), np.uint8)), (0, 0), 4)
    lit_o = Lp * wo / 255
    # per-pixel alignment: dense optical flow from the photo to the warped old page corrects the stand's refraction and the
    # sheet's bend; old and new pages are then read through the same flow
    gp = cv2.cvtColor(np.clip(out, 0, 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
    go_ = cv2.cvtColor(np.clip(lit_o, 0, 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
    dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    flow = dis.calc(gp, go_, None)
    flow = np.clip(flow, -12, 12)
    gx, gy = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
    mx, my = gx + flow[..., 0], gy + flow[..., 1]
    rm = lambda a: cv2.remap(a, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    wo_a, wn_a, wv_a = rm(wo), rm(wn), rm(wv.astype(np.float32))
    lit_oa = Lp * wo_a / 255
    chg = (np.abs(wn_a - wo_a).max(2) > 14).astype(np.uint8) * (wv_a > .5).astype(np.uint8)
    nlab, lab, stats, _ = cv2.connectedComponentsWithStats(cv2.dilate(chg, np.ones((11, 11), np.uint8)))
    ink_n = np.clip((255 - cv2.GaussianBlur(wn_a, (0, 0), .5)) / 255 * 1.3, 0, 1)
    exp = np.clip((Lp - lit_oa).mean(2), 0, None); got = np.clip((Lp - out).mean(2), 0, None)
    res = np.abs(cv2.GaussianBlur(out, (0, 0), 1) - cv2.GaussianBlur(lit_oa, (0, 0), 1)).mean(2)
    done = 0
    for k in range(1, nlab):
        x, y, w_, h_ = stats[k, :4]; P = 10
        x0, y0, x1, y1 = max(0, x - P), max(0, y - P), min(W, x + w_ + P), min(H, y + h_ + P)
        cx, cy = x + w_ // 2, y + h_ // 2
        e = exp[y0:y1, x0:x1]; g = got[y0:y1, x0:x1]; inkm = e > 25
        # seen: the old mark is there about as dark as expected, and the aligned old page agrees with the photo round it
        ratio = (g * inkm).sum() / max((e * inkm).sum(), 1)
        c = (e * g).sum() / (np.sqrt((e * e).sum() * (g * g).sum()) + 1e-6)
        r = res[y0:y1, x0:x1].mean()
        if DBG: print('   blob', k, round(c, 2), round(ratio, 2), round(r, 1))
        if inkm.sum() and (c < .55 or ratio < .45): continue
        if r > 30: continue
        mk = cv2.dilate((lab[y0:y1, x0:x1] == k).astype(np.float32) * chg[y0:y1, x0:x1], np.ones((5, 5), np.uint8))
        mk = cv2.GaussianBlur(mk, (0, 0), 1)
        new = Lp[y0:y1, x0:x1] * (1 - ink_n[y0:y1, x0:x1])
        out[y0:y1, x0:x1] = out[y0:y1, x0:x1] * (1 - mk[..., None]) + new * mk[..., None]; done += 1
    print('  replaced', done, 'of', nlab - 1, 'marks')
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(OUT, quality=93)
print('saved', OUT)
