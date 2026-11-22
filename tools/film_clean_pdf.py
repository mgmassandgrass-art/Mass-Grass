# The calendar film, rebuilt from the owner's final pages (Calendar2027-12-months.pdf, 1219x1713 each) laid into the cleaned mockup.
import sys
exec(open('render2.py').read().split("PAGES={m:page(m)")[0])
import cv2, numpy as np
big=cv2.imread('../pdf27/img-000.png').astype(np.float32)
R=np.load('../pdf27/rects.npy')
def pdfpage(m):
    l,t,r,b=R[m-1]; return big[t+1:b-1,l+1:r-1]
K=4
def placed(m,x0,x1,y1):
    # the whole page, from its real top under the rings (PT) to the old bottom, at 4x then area-reduced
    pg=pdfpage(m); w4=int(round((x1-x0)*K)); h4=int(round((y1-PT)*K))
    p4=cv2.resize(pg,(w4,h4),interpolation=cv2.INTER_AREA if w4<pg.shape[1] else cv2.INTER_CUBIC)
    Y0=int(round(PT*K)); X0=x0*K
    can=np.zeros((int(y1*K)+8,int(x1*K)+8,3),np.float32); a=np.zeros(can.shape[:2],np.float32)
    can[Y0:Y0+h4,X0:X0+w4]=p4; a[Y0:Y0+h4,X0:X0+w4]=1
    return can,a
def frame3(i,cache={}):
    fr=plate.copy()
    yy=np.arange(H,dtype=np.float32)[:,None]
    shade=np.clip(.9+.1*(yy-PT)/9,.9,1.0)
    for side,m in (('L',i+1),('R',(i+1)%12+1)):
        x0,y0,x1,y1=BOX[side]
        if (side,m) not in cache:
            can,a4=placed(m,x0,x1,y1)
            hh,ww=can.shape[0]//K,can.shape[1]//K
            lay=np.zeros((H,W,3),np.float32); a=np.zeros((H,W),np.float32)
            lay[:hh,:ww]=cv2.resize(can[:hh*K,:ww*K],(ww,hh),interpolation=cv2.INTER_AREA)
            a[:hh,:ww]=cv2.resize(a4[:hh*K,:ww*K],(ww,hh),interpolation=cv2.INTER_AREA)
            lay=lay/np.maximum(a[...,None],1e-3)
            cache[(side,m)]=(lay,a)
        lay,a=cache[(side,m)]
        lay=lay*.975*shade[...,None]*(1+(GRAIN-1)*.45)          # printed: a touch below screen white, the paper's grain, the board's contact shadow
        fr=fr*(1-a[...,None])+lay*a[...,None]
    p90=np.array([np.percentile(Ls[y,cal&~_dev],92) if 300<=y<362 else 1 for y in range(H)],np.float32)
    ratio=np.clip(Ls/np.maximum(p90[:,None],1),0,1)
    fade=np.clip((357-np.arange(H,dtype=np.float32))/10,0,1)[:,None]
    ratio=(1-(1-cv2.GaussianBlur(ratio,(0,0),1.6))*.7*fade)[...,None]
    rb=np.zeros((H,W),np.float32)
    for side in BOX: x0,y0,x1,y1=BOX[side]; rb[P0-1:358,x0:x1]=1
    rb=rb[...,None]
    fr=fr*(1-rb)+fr*ratio*rb
    fr=fr*(1-WC[...,None])+PS*WC[...,None]
    return np.clip(fr,0,255)
if __name__=='__main__':
    for i in map(int,sys.argv[1:]):
        cv2.imwrite(f'o3_{i:02d}.png',frame3(i).astype(np.uint8)); print(i)
