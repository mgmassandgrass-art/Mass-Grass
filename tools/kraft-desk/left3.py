import cv2, numpy as np
from scipy import ndimage
hero=cv2.imread('lcrop.png').astype(np.float32); H,W=hero.shape[:2]
M=np.load('lM.npy'); P='../pdf27/'
p1=cv2.imread(P+'p01.png').astype(np.float32); ph,pw=p1.shape[:2]; S=np.float32([[0,0],[pw,0],[pw,ph],[0,ph]])
q=cv2.perspectiveTransform(S.reshape(-1,1,2),M).reshape(-1,2)
def warp(img):
    K=3; big=cv2.warpPerspective(img,np.diag([K,K,1])@M,(W*K,H*K),flags=cv2.INTER_LINEAR,borderMode=cv2.BORDER_REPLICATE)
    return cv2.resize(big,(W,H),interpolation=cv2.INTER_AREA)
def qmask(s=8):
    m=np.zeros((H*s,W*s),np.uint8); cv2.fillPoly(m,[np.int32(np.round(q*s))],255); return cv2.resize(m,(W,H),interpolation=cv2.INTER_AREA).astype(np.float32)/255
A=qmask(); Y,X=np.mgrid[0:H,0:W].astype(np.float32); u=X/W; v=Y/H
w1=warp(p1)
fit=ndimage.binary_erosion(A>.99,iterations=12); fit[:int(q[:2,1].max())+70]=False
ys,xs=np.nonzero(fit); sel=np.random.default_rng(0).choice(len(ys),min(200000,len(ys)),replace=False); ys,xs=ys[sel],xs[sel]
K=[]
for c in range(3):
    wv=w1[ys,xs,c]; Z=np.c_[wv,wv*u[ys,xs],wv*v[ys,xs],np.ones_like(wv),u[ys,xs],v[ys,xs]]
    k,*_=np.linalg.lstsq(Z,hero[ys,xs,c],rcond=None); K.append(k)
def model(w):
    return np.stack([K[c][0]*w[...,c]+K[c][1]*w[...,c]*u+K[c][2]*w[...,c]*v+K[c][3]+K[c][4]*u+K[c][5]*v for c in range(3)],-1)
m1=model(w1); res=np.abs(m1-hero).mean(2)
print('residual inside page',res[fit].mean().round(2))
# keep from the photo: rings, holes, their shadows (big residual in the top band), and everything outside the page
top=int(q[:2,1].max())+38
Lh=hero.mean(2); sat=hero.max(2)-hero.min(2); Bc,Gc,Rc=hero[...,0],hero[...,1],hero[...,2]
copper=(sat>30)&(Rc>Gc)&(Gc>Bc)
keep=((Lh<85)|copper)&(A>.3); keep[top:]=False
keep=ndimage.binary_closing(keep,np.ones((3,3)),iterations=2); keep=ndimage.binary_fill_holes(keep)
keep=ndimage.binary_opening(keep,np.ones((2,2)))
keep=cv2.GaussianBlur(keep.astype(np.float32),(0,0),.8)
r=(hero-m1).mean(2); r=r-cv2.GaussianBlur(r,(0,0),2)
gsd=r[fit].std(); print('grain',gsd.round(2))
rng=np.random.default_rng(5)
for m in range(1,13):
    w=warp(cv2.imread(P+f'p{m:02d}.png').astype(np.float32))
    pr=model(w)+(cv2.GaussianBlur(rng.normal(0,1,(H,W)).astype(np.float32),(0,0),.7)*gsd*.5)[...,None]
    a=(A*(1-keep))[...,None]
    out=np.clip(hero*(1-a)+pr*a,0,255).astype(np.uint8)
    cv2.imwrite(f'L{m:02d}.png',out[60:1440,120:1300])
cv2.imwrite('keep.png',(keep*255).astype(np.uint8))
print(q.round().tolist())
