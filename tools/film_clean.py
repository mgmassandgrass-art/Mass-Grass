# The owner's mockup film, rebuilt clean: the same mockup (cleaned of posterizing and blocks), the pages of the film itself
# (each month is seen twice, left and right: both copies averaged, de-noised, sharpened), the print run up to the rings.
import sys
exec(open(__file__.replace("film_clean.py","film_clean_base.py")).read().split("if __name__")[0])
import cv2, numpy as np
P0=int(np.ceil(PT))                     # first page row under the board (324)
def crop(i,s):
    x0,y0,x1,y1=BOX[s]; return cv2.imread(f'seg{i:02d}.png')[y0:y1,x0:x1].astype(np.float32)
def page(m):            # month m: right page of segment m-2, left page of segment m-1
    a=crop((m-1)%12,'L'); b=crop((m-2)%12,'R')
    av=((a+b)/2).clip(0,255).astype(np.uint8)
    dn=cv2.fastNlMeansDenoisingColored(av,None,3,3,5,15).astype(np.float32)
    sh=dn+0.45*(dn-cv2.GaussianBlur(dn,(0,0),1.0))
    # the page's hidden top (under the old white strip): its own paper colour carried up, smooth along the row
    n=359-P0; band=sh[2:14]; col=np.median(band,0)
    rowmed=np.median(col,0); dev=np.abs(col-rowmed).sum(1)>24; col[dev]=rowmed
    col=cv2.GaussianBlur(col[None],(0,0),(18,0))[0] if False else cv2.GaussianBlur(col.reshape(1,-1,3),(0,0),18).reshape(-1,3)
    top=np.repeat(col[None],n+3,0)
    sh=sh.copy(); k=np.linspace(1,0,8)[:,None,None]
    sh[3:11]=sh[3:11]*(1-k)+col[None]*k        # melt the page's first rows into the fill
    sh=sh[3:]
    # blend the seam: the first rows of the page lean toward the fill where they are plain paper
    return np.clip(np.vstack([top,sh]),0,255)
PAGES={m:page(m) for m in range(1,13)}
def frame2(i):
    fr=plate.copy()
    yy=np.arange(H,dtype=np.float32)[:,None]
    shade=np.clip(.9+.1*(yy-PT)/9,.9,1.0)
    for side,m in (('L',i+1),('R',(i+1)%12+1)):
        x0,y0,x1,y1=BOX[side]; pg=PAGES[m]
        lay=np.zeros_like(fr); lay[P0:y1,x0:x1]=pg
        a=np.zeros((H,W),np.float32); a[P0:y1,x0:x1]=1
        if PT<P0: a[P0-1,x0:x1]=P0-PT; lay[P0-1,x0:x1]=pg[0]
        g=np.ones((H,W,1),np.float32); g[P0-1:362]=1+(GRAIN[P0-1:362]-1)*.5   # grain only on the filled strip; the film's page has its own
        lay=lay*shade[...,None]*g
        fr=fr*(1-a[...,None])+lay*a[...,None]
    p90=np.array([np.percentile(Ls[y,cal&~_dev],92) if 300<=y<362 else 1 for y in range(H)],np.float32)
    ratio=np.clip(Ls/np.maximum(p90[:,None],1),0,1)
    fade=np.clip((357-np.arange(H,dtype=np.float32))/10,0,1)[:,None]
    ratio=1-(1-cv2.GaussianBlur(ratio,(0,0),1.6))*.7*np.maximum(fade,WC*0)
    ratio=ratio[...,None]
    rb=np.zeros((H,W),np.float32)
    for side in BOX: x0,y0,x1,y1=BOX[side]; rb[P0-1:358,x0:x1]=1
    rb=rb[...,None]
    fr=fr*(1-rb)+fr*ratio*rb                       # the rings' soft shadow falls on the print in its own colour
    fr=fr*(1-WC[...,None])+PS*WC[...,None]          # metal and the punched holes stay as in the mockup
    return np.clip(fr,0,255)
if __name__=='__main__':
    for i in map(int,sys.argv[1:]):
        cv2.imwrite(f'o2_{i:02d}.png',frame2(i).astype(np.uint8)); print(i)
