import numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS=None
exec(open('comp.py').read().split("if __name__")[0])
P='/tmp/claude-0/-home-user-Mass-Grass/3c3a7cf0-a5d3-55d4-bdc2-a4e0bc8d42f0/scratchpad/pdf27/'
A='/home/user/Mass-Grass/web/assets/'
COVER='/home/user/Mass-Grass/drafts/calendar-v2/pg-000.jpg'
def crop(o,box,r=140):
    x0,y0,x1,y1=box; c=o[y0:y1,x0:x1].copy(); h,w=c.shape[:2]
    ramp=lambda n: np.clip(np.arange(n)/r,0,1)
    e=np.minimum(ramp(w),ramp(w)[::-1])[None]*np.minimum(ramp(h),ramp(h)[::-1])[:,None]
    c[...,3]=np.where(c[...,3]>.98,c[...,3],c[...,3]*e)
    return Image.fromarray((np.clip(c,0,1)*255).astype(np.uint8))
HERO=(235,1040,4053,3160); ONE=(2206,985,3843,2825)
import os
if False:
  h=None
if True:
  o=render(COVER,P+'p03.png','pair.png'); h=crop(o,HERO)
  h.resize((2400,int(2400*h.height/h.width)),Image.LANCZOS).save(A+'cal-hero.webp',quality=92,alpha_quality=100,method=6)
  h.resize((1100,int(1100*h.height/h.width)),Image.LANCZOS).save(A+'cal-hero-m.webp',quality=90,alpha_quality=100,method=6)
  print('hero',h.size)
for m in range(1,13):
    o=render(COVER,P+f'p{m:02d}.png','tmp.png')
    c=crop(o,ONE); c=c.resize((1100,int(1100*c.height/c.width)),Image.LANCZOS)
    c.save(A+f'cdp-{m:02d}.webp',quality=90,alpha_quality=100,method=6)
    if m==1: c.save(A+'cdm-base.webp',quality=90,alpha_quality=100,method=6); print('one',c.size)
