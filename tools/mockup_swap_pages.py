"""Bring a finished mockup photograph up to date: wherever a page of the OLD calendar shows in it, the parts that changed in
the NEW calendar (year, dates, removed QR codes...) are laid in, in the photo's own light and perspective.
  python3 tools/mockup_swap_pages.py OLD.pdf NEW.pdf IN.jpg OUT.png

Each old page is found in the photo by SIFT features (a homography per page, RANSAC). Only pixels where the old and new pages
differ are replaced, and only where the photo really shows the old page there (anything in front of the page, a stand, a leaf,
another sheet, keeps the photo's pixels). The light is the photo's own: the new pixels are scaled by the local ratio of the
photo to the warped old page.
"""
import sys, numpy as np, cv2, pymupdf as fitz
from PIL import Image

OLD, NEW, INP, OUT = sys.argv[1:5]
po, pn = fitz.open(OLD), fitz.open(NEW)
ph = cv2.cvtColor(cv2.imread(INP), cv2.COLOR_BGR2RGB).astype(np.float32); H, W = ph.shape[:2]
gray = cv2.cvtColor(ph.astype(np.uint8), cv2.COLOR_RGB2GRAY)
sift = cv2.SIFT_create(nfeatures=20000); kp2, de2 = sift.detectAndCompute(gray, None)
flann = cv2.FlannBasedMatcher({'algorithm': 1, 'trees': 5}, {'checks': 64})

def render(doc, i, h=1400):
    p = doc[i]; z = h / p.rect.height; pix = p.get_pixmap(matrix=fitz.Matrix(z, z))
    return np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width, pix.n)[..., :3].astype(np.float32)

out = ph.copy(); done = []
for i in range(len(po)):
    a, b = render(po, i), render(pn, i)
    ga = cv2.cvtColor(a.astype(np.uint8), cv2.COLOR_RGB2GRAY)
    kp1, de1 = sift.detectAndCompute(ga, None)
    if de1 is None or len(kp1) < 20: continue
    good = [m for m, n in flann.knnMatch(de1, de2, k=2) if m.distance < .7 * n.distance]
    if len(good) < 30: continue
    M, inl = cv2.findHomography(np.float32([kp1[m.queryIdx].pt for m in good]), np.float32([kp2[m.trainIdx].pt for m in good]), cv2.RANSAC, 4.0)
    if M is None or inl.sum() < 40: continue
    wa = cv2.warpPerspective(a, M, (W, H), flags=cv2.INTER_LINEAR); wb = cv2.warpPerspective(b, M, (W, H), flags=cv2.INTER_LINEAR)
    cover = cv2.warpPerspective(np.ones(a.shape[:2], np.float32), M, (W, H)) > .99
    diff = (np.abs(a - b).sum(2) > 24).astype(np.uint8)
    diff = cv2.dilate(diff, np.ones((9, 9), np.uint8))
    D = (cv2.warpPerspective(diff.astype(np.float32), M, (W, H)) > .3) & cover
    if not D.any(): continue
    # the photo's light over this page: photo / warped old page, smoothed, from the unchanged pixels around
    keep = (cover & ~D).astype(np.float32)
    s = max(4, int(np.sqrt(cover.sum()) / 40))
    num = cv2.GaussianBlur(ph * keep[..., None], (0, 0), s); den = cv2.GaussianBlur(wa * keep[..., None], (0, 0), s)
    gain = np.clip(num / np.maximum(den, 1), .2, 3)
    # where the photo does not show the old page (something in front of it), the photo stays
    err = np.abs(ph - wa * gain).mean(2)
    shown = cv2.GaussianBlur((err < 26).astype(np.float32), (0, 0), 2) > .6
    R = (D & shown).astype(np.float32); R = cv2.GaussianBlur(R, (0, 0), 1.0)[..., None]
    out = out * (1 - R) + np.clip(wb * gain, 0, 255) * R
    done.append((i, int(inl.sum()), int(D.sum()), int((D & shown).sum())))
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(OUT)
print('pages swapped (page, inliers, changed px, laid in px):', done)
