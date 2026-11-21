import cv2, numpy as np
from scipy import ndimage
V='/home/user/Mass-Grass/drafts/calendar-v2/'
plate=cv2.imread('plate.png').astype(np.float32); H,W=plate.shape[:2]
RAW=plate.copy()
# ---- clean the mockup itself: the source is posterized (steps of ~16 levels) and blocky from WhatsApp
BRD=[(529,307,1284,1429),(1607,307,2362,1429)]
inb=np.zeros((H,W),np.float32); ring=np.zeros((H,W),np.float32)
for x0,y0,x1,y1 in BRD: inb[y0+3:y1-3,x0+3:x1-3]=1; ring[255:362,x0:x1]=1
inb=cv2.GaussianBlur(inb,(0,0),1); ring=cv2.GaussianBlur(ring,(0,0),1)
bgm=np.clip(1-cv2.GaussianBlur(np.maximum(inb,ring),(0,0),2)*1.5,0,1)
_g=np.random.default_rng(11)
bgs=cv2.bilateralFilter(plate,0,6,9); bgs=cv2.GaussianBlur(bgs,(0,0),2.2)+_g.normal(0,.7,(H,W,1)).astype(np.float32)
bds=cv2.GaussianBlur(plate,(0,0),1.1)+(cv2.GaussianBlur(_g.normal(0,1,(H,W)).astype(np.float32),(0,0),.7)*3.2)[...,None]
inb2=inb*(1-ring)
plate=plate*(1-bgm[...,None])+bgs*bgm[...,None]
plate=plate*(1-inb2[...,None])+bds*inb2[...,None]
L=plate.mean(2)
Ls=cv2.GaussianBlur(cv2.medianBlur(plate.astype(np.uint8),5).mean(2).astype(np.float32),(0,0),1.0)
PT=323.5                     # the page's real top edge (under the rings)
BOX={'L':(548,359,1263,1332),'R':(1626,359,2341,1332)}   # where the mockup showed the art
PS=cv2.medianBlur(RAW.astype(np.uint8),3).astype(np.float32)
def _groups(mask):
    xs=np.nonzero(mask)[0]; g=[]; st=xs[0]; pv=xs[0]
    for x in xs[1:]:
        if x-pv>6: g.append((st,pv)); st=x
        pv=x
    g.append((st,pv)); return g
def mfile(m): return V+f'pg-{(m if m<=6 else m+1):03d}.jpg'
# ---- ring wires: columns seen against the wall above the board, carried down through the page top
wires=np.zeros((H,W),bool)
row=L[282:292].mean(0); bgv=np.median(row)
dev=np.abs(L[282:292]-bgv).max(0)>5
cols=dev
wires[300:362,:]=cols[None,:]
cal=np.zeros(W,bool); cal[540:1275]=True; cal[1618:2353]=True
wires&=cal[None,:]
_dev=(np.abs(L[282:292]-bgv).max(0)>5)&cal
WC=np.zeros((H,W),np.float32)
paper=np.zeros(H)
for y in range(300,362):
    paper[y]=np.percentile(Ls[y,cal&~_dev],60)
for g0,g1 in _groups(_dev):
    y0,y1=int(np.ceil(PT)),357
    box=np.zeros((H,W),bool); box[y0:y1,g0-4:g1+5]=True
    w=np.clip((paper[:,None]-Ls-40)/25,0,1)
    WC=np.maximum(WC,(w*box).astype(np.float32)); RB=np.maximum(RB,box.astype(np.float32)) if 'RB' in dir() else box.astype(np.float32)
WC=cv2.GaussianBlur(WC,(0,0),.5)
# within the wire columns keep only what is metal or hole (differs from the clean paper of the strip)
strip=slice(int(PT),359)
# clean paper level of the strip, per row, from the columns between rings
paper=np.zeros(H)
for y in range(300,362):
    v=L[y,cal&~cols]; paper[y]=np.percentile(v,60)
# ---- per page: ECC registration of the page onto the old art, then colour fit, then laid in full from the page top
def lay(seg,side,m):
    x0,y0,x1,y1=BOX[side]; w,h=x1-x0,y1-y0
    pg=cv2.imread(mfile(m)).astype(np.float32); ph,pw=pg.shape[:2]
    s=w/pw; small=cv2.resize(pg,(w,int(round(ph*s))),interpolation=cv2.INTER_AREA)
    vid=seg[y0:y1,x0:x1]
    G=lambda x: cv2.GaussianBlur(cv2.cvtColor(x,cv2.COLOR_BGR2GRAY),(0,0),1.2)
    M=np.array([[1,0,0],[0,1,-35.6]],np.float32)
    cc,M=cv2.findTransformECC(G(small),G(vid),M,cv2.MOTION_AFFINE,(cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,200,1e-6),None,5)
    # page->plate affine, from full-res page pixels
    A=np.array([[s,0,0],[0,s,0],[0,0,1]],np.float64)
    B=np.vstack([M.astype(np.float64),[0,0,1]])
    T=np.array([[1,0,x0],[0,1,y0],[0,0,1]],np.float64)@B@A
    # render at 4x then area-reduce for clean edges and text
    K=4; T4=np.diag([K,K,1])@T
    big=cv2.warpAffine(pg,T4[:2],(W*K,H*K),flags=cv2.INTER_AREA if False else cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
    msk=cv2.warpAffine(np.ones(pg.shape[:2],np.float32),T4[:2],(W*K,H*K),flags=cv2.INTER_LINEAR)
    art=cv2.resize(big,(W,H),interpolation=cv2.INTER_AREA); a=cv2.resize(msk,(W,H),interpolation=cv2.INTER_AREA)
    # colour: the mockup's print look, fitted per channel (gain, offset, gentle light across the page)
    yy,xx=np.mgrid[y0+8:y1-8,x0+8:x1-8]; out=art.copy()
    for c in range(3):
        sv=vid[8:-8,8:-8,c].ravel(); sa=art[y0+8:y1-8,x0+8:x1-8,c].ravel()
        X=np.c_[sa,np.ones_like(sa),(xx.ravel()-x0)/w,(yy.ravel()-y0)/h]
        k,*_=np.linalg.lstsq(X,sv,rcond=None)
        Y,Xg=np.mgrid[0:H,0:W]
        out[...,c]=art[...,c]*k[0]+k[1]+k[2]*(Xg-x0)/w+k[3]*(Y-y0)/h
    # clip to the page: from its real top (under the rings) to the old bottom, old left/right
    clip=np.zeros((H*K,W*K),np.uint8); cv2.rectangle(clip,(int(x0*K),int(PT*K)),(int(x1*K)-1,int(y1*K)-1),255,-1)
    clip=cv2.resize(clip,(W,H),interpolation=cv2.INTER_AREA).astype(np.float32)/255
    return out,np.minimum(a,clip),cc
_rng=np.random.default_rng(7)
def _n(sg):
    z=cv2.GaussianBlur(_rng.normal(0,1,(H,W)).astype(np.float32),(0,0),sg); return z/z.std()
GRAIN=(1+.010*_n(.8)+.006*_n(2.6)+.004*_n(9))[...,None]   # paper grain, the same sheet in every frame
def frame(i):
    seg=cv2.imread(f'seg{i:02d}.png').astype(np.float32)
    fr=plate.copy(); ccs=[]
    for side,m in (('L',i+1),('R',(i+1)%12+1)):
        art,a,cc=lay(seg,side,m); ccs.append(round(cc,4))
        # page top under the rings: the print runs up to the board; the strip's light (soft shadow) multiplies it,
        # and inside each ring's box what is darker than paper (wire, hole, its shadow) is kept from the mockup
        top=np.zeros((H,W),np.float32); top[int(np.ceil(PT)):359]=1
        yy=np.arange(H,dtype=np.float32)[:,None]; sh=np.clip(.9+.1*(yy-PT)/9,.9,1.0)*np.ones((1,W),np.float32)   # a soft contact shadow under the board's top edge
        art2=(art*(1-top[...,None])+art*(sh*top)[...,None])*GRAIN
        fr=fr*(1-a[...,None])+art2*a[...,None]
    fr=fr*(1-WC[...,None])+PS*WC[...,None]
    return np.clip(fr,0,255),ccs
def texture():
    import os
    if os.path.exists('tex.npy'): return np.load('tex.npy')
    R={'L':[],'R':[]}
    for i in range(12):
        seg=cv2.imread(f'seg{i:02d}.png').astype(np.float32)
        for side,m in (('L',i+1),('R',(i+1)%12+1)):
            x0,y0,x1,y1=BOX[side]; art,a,cc=lay(seg,side,m)
            v=seg[y0:y1,x0:x1].mean(2); f=art[y0:y1,x0:x1].mean(2)
            R[side].append(v/np.maximum(cv2.GaussianBlur(f,(0,0),0.8),20))
    tex={}
    for side in R:
        r=np.median(np.stack(R[side]),0); t=r/cv2.GaussianBlur(r,(0,0),10)
        tex[side]=np.clip(t,.88,1.12)
    T=np.stack([tex['L'],tex['R']]); np.save('tex.npy',T); return T
if __name__=='__main__':
    import sys
    for i in map(int,sys.argv[1:]):
        f,cc=frame(i); cv2.imwrite(f'out{i:02d}.png',f.astype(np.uint8)); print(i,cc)
