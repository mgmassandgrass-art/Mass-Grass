"""Bring a finished mockup photograph up to date: wherever a page of the OLD calendar shows in it, the parts that changed in
the NEW calendar (year, dates, QR codes...) are laid in, in the photo's own light and perspective.
  python3 tools/mockup_swap_pages.py OLD.pdf NEW.pdf IN.jpg OUT.png

Each old page is found in the photo by SIFT features (a homography per page, RANSAC). The mockups may have been made from an
earlier draft of the design, where a block (the cover's year, a month's grid) sits a little elsewhere: so every changed block is
matched again on its own (an affine fitted to its own features near where the page puts it) before it is replaced.
Only pixels where the old and new pages differ are replaced, and only where the photo shows the old page there (a stand, a leaf
or another sheet in front keeps the photo's pixels). The light is the photo's own: the new pixels are scaled by the local ratio
of the photo to the warped old page.
"""
import sys, numpy as np, cv2, pymupdf as fitz
from PIL import Image
from scipy import ndimage

import argparse
ap = argparse.ArgumentParser(); ap.add_argument('old'); ap.add_argument('new'); ap.add_argument('inp'); ap.add_argument('out')
ap.add_argument('--full', action='store_true', help='replace each changed block whole (the mockup came from an older draft)')
ap.add_argument('--front', type=int, action='append', default=[], help='a page lying in front of the others')
ap.add_argument('--keep', action='append', default=[], help='a polygon "x,y x,y ..." the photo keeps (a stand in front)')
args = ap.parse_args(); OLD, NEW, INP, OUT = args.old, args.new, args.inp, args.out
po, pn = fitz.open(OLD), fitz.open(NEW)
ph = cv2.cvtColor(cv2.imread(INP), cv2.COLOR_BGR2RGB).astype(np.float32); H, W = ph.shape[:2]
gray = cv2.cvtColor(ph.astype(np.uint8), cv2.COLOR_RGB2GRAY)
sift = cv2.SIFT_create(nfeatures=40000); kp2, de2 = sift.detectAndCompute(gray, None)
P2 = np.float32([k.pt for k in kp2])
flann = cv2.FlannBasedMatcher({'algorithm': 1, 'trees': 5}, {'checks': 64})

def render(doc, i, h=1600):
    p = doc[i]; z = h / p.rect.height; pix = p.get_pixmap(matrix=fitz.Matrix(z, z))
    return np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width, pix.n)[..., :3].astype(np.float32)

def match(img, mask=None, near=None):
    g = cv2.cvtColor(img.astype(np.uint8), cv2.COLOR_RGB2GRAY)
    k1, d1 = sift.detectAndCompute(g, mask)
    if d1 is None or len(k1) < 8: return None, None
    if near is not None:
        sel = np.where((P2[:, 0] >= near[0]) & (P2[:, 0] < near[2]) & (P2[:, 1] >= near[1]) & (P2[:, 1] < near[3]))[0]
        if len(sel) < 8: return None, None
        fl = cv2.FlannBasedMatcher({'algorithm': 1, 'trees': 4}, {'checks': 64}); mm = fl.knnMatch(d1, de2[sel], k=2)
        good = [m for m, n in (x for x in mm if len(x) == 2) if m.distance < .75 * n.distance]
        return np.float32([k1[m.queryIdx].pt for m in good]), P2[sel][[m.trainIdx for m in good]]
    good = [m for m, n in flann.knnMatch(d1, de2, k=2) if m.distance < .7 * n.distance]
    return np.float32([k1[m.queryIdx].pt for m in good]), P2[[m.trainIdx for m in good]]

out = ph.copy(); log = []
KEEP = np.zeros((H, W), np.uint8)
for poly in args.keep: cv2.fillPoly(KEEP, [np.int32([[float(v) for v in pt.split(',')] for pt in poly.split()])], 1)
KEEP = KEEP.astype(bool); FRONT = {}
for i in range(len(po)):
    a, b = render(po, i), render(pn, i); h, w = a.shape[:2]
    s1, s2 = match(a)
    if s1 is None or len(s1) < 30: continue
    M, inl = cv2.findHomography(s1, s2, cv2.RANSAC, 4.0)
    if M is None or inl.sum() < 40: continue
    if i in args.front: FRONT[i] = cv2.warpPerspective(np.ones((h, w), np.float32), M, (W, H)) > .5
    hide = KEEP.copy()
    for j, q in FRONT.items():
        if j != i: hide |= q
    diff = (np.abs(a - b).sum(2) > 24).astype(np.uint8)
    lab, n = ndimage.label(cv2.dilate(diff, np.ones((41, 41), np.uint8)))      # the changed blocks of the page
    for k, sl in enumerate(ndimage.find_objects(lab)):
        y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
        m = 60; Y0, Y1, X0, X1 = max(0, y0 - m), min(h, y1 + m), max(0, x0 - m), min(w, x1 + m)
        # the block on its own: where does the photo really have it?
        corners = cv2.perspectiveTransform(np.float32([[[X0, Y0]], [[X1, Y0]], [[X1, Y1]], [[X0, Y1]]]), M).reshape(-1, 2)
        pad = 0.25 * max(np.ptp(corners[:, 0]), np.ptp(corners[:, 1])) + 20
        near = (corners[:, 0].min() - pad, corners[:, 1].min() - pad, corners[:, 0].max() + pad, corners[:, 1].max() + pad)
        msk = np.zeros((h, w), np.uint8); msk[Y0:Y1, X0:X1] = 255
        t1, t2 = match(a, msk, near)
        Mb = M
        if t1 is not None and len(t1) >= 8:
            A, ok = cv2.estimateAffine2D(t1, t2, ransacReprojThreshold=3.0)
            if A is not None and ok.sum() >= 6: Mb = np.vstack([A, [0, 0, 1]])
        blk = np.zeros((h, w), np.float32); blk[Y0:Y1, X0:X1] = 1
        Db = ((lab == k + 1) & (diff > 0)).astype(np.uint8); Db = cv2.dilate(Db, np.ones((9, 9), np.uint8)).astype(np.float32)
        # an older draft may have the old text a little elsewhere: also clear where the photo shows old ink that the block moved
        wa = cv2.warpPerspective(a, Mb, (W, H)); wb = cv2.warpPerspective(b, Mb, (W, H))
        cov = cv2.warpPerspective(blk, Mb, (W, H)) > .99
        D = (cv2.warpPerspective(Db, Mb, (W, H)) > .3) & cov
        keep = (cov & ~D).astype(np.float32); s = max(4, int(np.sqrt(cov.sum()) / 20))
        num = cv2.GaussianBlur(ph * keep[..., None], (0, 0), s); den = cv2.GaussianBlur(wa * keep[..., None], (0, 0), s)
        gain = np.clip(num / np.maximum(den, 1), .2, 3)
        err = np.abs(cv2.GaussianBlur(ph, (0, 0), 1.5) - cv2.GaussianBlur(wa * gain, (0, 0), 1.5)).mean(2)
        shown = cv2.GaussianBlur((err < 45).astype(np.float32), (0, 0), 3) > .5
        if args.full: D = cov; shown = np.ones_like(cov)
        R = cv2.GaussianBlur((D & shown & ~hide).astype(np.float32), (0, 0), 1.0)[..., None]
        out = out * (1 - R) + np.clip(wb * gain, 0, 255) * R
        log.append((i, k, 'own' if Mb is not M else 'page', int(D.sum()), int((D & shown).sum())))
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(OUT)
print('blocks (page, block, fit, changed px, laid in px):', log)
