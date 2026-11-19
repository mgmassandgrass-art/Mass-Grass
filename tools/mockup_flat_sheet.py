import numpy as np, cv2, make
from PIL import Image
from scipy import ndimage
S='/tmp/claude-0/-home-user-Mass-Grass/3c3a7cf0-a5d3-55d4-bdc2-a4e0bc8d42f0/'
ph=np.asarray(Image.open(S+'images/4.webp').convert('RGB')).astype(float)
make.ph=ph; make.L=ph.mean(2); make.H,make.W=ph.shape[:2]
Q=[(648,252),(1321,247),(1322,1267),(649,1268)]
# the paper's own outline, read from the photo (sub-pixel: the blue channel goes from the yellow ground to the white sheet), grown a little
# so no sliver of the old sheet or its lit edge is left, and cut to a margin round the quad so shadows and the ground are never touched
B=ph[...,2]; a=np.clip((B-130)/60,0,1); a=np.clip(a*1.7,0,1)
box=np.zeros(B.shape); box[240:1280,640:1332]=1; a=a*ndimage.gaussian_filter(box,1.0)
a=np.maximum(ndimage.gaussian_filter(a,.5),make.mask_of(Q))
def fit(art):
    h,w=art.shape[:2]; nw=int(round(h*673/1018)); x=(w-nw)//2; return art[:,x:x+nw]
for name,pg in (('cover','pg-000'),('january','pg-001'),('june','pg-006')):
    art=fit(make.load(make.R+'drafts/calendar-v2/%s.jpg'%pg))
    out=make.put(ph.copy(),Q,art,soft=.5,grain=1.4,rings=False,alpha=a)
    Image.fromarray(np.clip(out,0,255).astype('uint8')).save(S+'scratchpad/mk/flat-%s.png'%name)
print('ok')
