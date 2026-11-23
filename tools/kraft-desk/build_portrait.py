# The bottles' desk calendar from the owner's portrait photo (calendar-hero-v3, 1877x2560):
# 1 register January of the PDF onto the photo's page, 2 print every month in that page's colour/light with the rings kept,
# 3 cut the calendar out (GrabCut), 4 the photo's shadow as a multiply layer (backdrop -> white).
import cv2, numpy as np
from scipy import ndimage
from PIL import Image, ImageFilter
Image.MAX_IMAGE_PIXELS=None
P='../pdf27/'; A='/home/user/Mass-Grass/web/assets/'
img=cv2.imread('i-000.png').astype(np.float32); H,W=img.shape[:2]
p1=cv2.imread(P+'p01.png').astype(np.float32); ph,pw=p1.shape[:2]; S=np.float32([[0,0],[pw,0],[pw,ph],[0,ph]])
# 1 registration
sift=cv2.SIFT_create(8000)
g1=cv2.cvtColor(p1.astype(np.uint8),cv2.COLOR_BGR2GRAY); g2=cv2.cvtColor(img.astype(np.uint8),cv2.COLOR_BGR2GRAY)
k1,d1=sift.detectAndCompute(g1,None); k2,d2=sift.detectAndCompute(g2,None)
mt=[a for a,b in cv2.BFMatcher().knnMatch(d1,d2,k=2) if a.distance<.7*b.distance]
M,inl=cv2.findHomography(np.float32([k1[m.queryIdx].pt for m in mt]),np.float32([k2[m.trainIdx].pt for m in mt]),cv2.RANSAC,3)
print('matches',len(mt),inl.sum())
G=lambda x: cv2.GaussianBlur(cv2.cvtColor(x,cv2.COLOR_BGR2GRAY),(0,0),1.5)
for it in range(2):
    w=cv2.warpPerspective(p1,M,(W,H),flags=cv2.INTER_AREA); cq=cv2.perspectiveTransform(S.reshape(-1,1,2),M).reshape(-1,2)
    mk=np.zeros((H,W),np.uint8); cv2.fillPoly(mk,[np.int32(cq)],255); mk=cv2.erode(mk,np.ones((41,41),np.uint8)); mk[:int(cq[:2,1].max())+110]=0
    D=np.eye(3,dtype=np.float32)
    cc,D=cv2.findTransformECC(G(w),G(img),D,cv2.MOTION_HOMOGRAPHY,(cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,300,1e-7),mk,5)
    M=D.astype(np.float64)@M; print('ecc',round(cc,4))
q=cv2.perspectiveTransform(S.reshape(-1,1,2),M).reshape(-1,2); print('page',q.round().tolist())
def push(q,i,j,d):
    p=q[j]-q[i]; n=np.array([p[1],-p[0]])/np.hypot(*p); c=q.mean(0)
    if np.dot(n,(q[i]+q[j])/2-c)<0: n=-n
    q=q.copy(); q[i]+=n*d; q[j]+=n*d; return q
qa=push(push(q,1,2,4.0),2,3,8.0)
def warp(im):
    K=2; big=cv2.warpPerspective(im,np.diag([K,K,1])@M,(W*K,H*K),flags=cv2.INTER_LINEAR,borderMode=cv2.BORDER_REPLICATE)
    return cv2.resize(big,(W,H),interpolation=cv2.INTER_AREA)
m8=np.zeros((H*4,W*4),np.uint8); cv2.fillPoly(m8,[np.int32(np.round(qa*4))],255); Am=cv2.resize(m8,(W,H),interpolation=cv2.INTER_AREA).astype(np.float32)/255
Y,X=np.mgrid[0:H,0:W].astype(np.float32); u=X/W; v=Y/H
w1=warp(p1)
fit=ndimage.binary_erosion(Am>.99,iterations=16); fit[:int(q[:2,1].max())+110]=False
ys,xs=np.nonzero(fit); sel=np.random.default_rng(0).choice(len(ys),min(300000,len(ys)),replace=False); ys,xs=ys[sel],xs[sel]
K=[]
for c in range(3):
    wv=w1[ys,xs,c]; Z=np.c_[wv,wv*u[ys,xs],wv*v[ys,xs],np.ones_like(wv),u[ys,xs],v[ys,xs]]
    K.append(np.linalg.lstsq(Z,img[ys,xs,c],rcond=None)[0])
model=lambda w: np.stack([K[c][0]*w[...,c]+K[c][1]*w[...,c]*u+K[c][2]*w[...,c]*v+K[c][3]+K[c][4]*u+K[c][5]*v for c in range(3)],-1)
m1=model(w1); print('residual',np.abs(m1-img).mean(2)[fit].mean().round(2))
# 2 rings/holes kept from the photo: dark or coppery in the band just under the page top
top=int(q[:2,1].max())+60
Lh=img.mean(2); sat=img.max(2)-img.min(2); Bc,Gc,Rc=img[...,0],img[...,1],img[...,2]
keep=((Lh<85)|((sat>30)&(Rc>Gc)&(Gc>Bc)))&(Am>.3); keep[top:]=False
keep=ndimage.binary_closing(keep,np.ones((3,3)),iterations=2); keep=ndimage.binary_fill_holes(keep); keep=ndimage.binary_opening(keep,np.ones((2,2)))
keep=cv2.GaussianBlur(keep.astype(np.float32),(0,0),.8)
r=(img-m1).mean(2); r=r-cv2.GaussianBlur(r,(0,0),2); gsd=r[fit].std()
al=(Am*(1-keep)); a8=(al*255).astype(np.uint8)
ys,xs=np.nonzero(a8>0); by0,by1,bx0,bx1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
rng=np.random.default_rng(5)
for m in range(1,13):
    pr=model(warp(cv2.imread(P+f'p{m:02d}.png').astype(np.float32)))+(cv2.GaussianBlur(rng.normal(0,1,(H,W)).astype(np.float32),(0,0),.7)*gsd*.5)[...,None]
    pr=np.clip(pr,0,255).astype(np.uint8)[by0:by1,bx0:bx1,::-1]
    o=Image.fromarray(pr).filter(ImageFilter.UnsharpMask(1.6,40,0)); o.putalpha(Image.fromarray(a8[by0:by1,bx0:bx1]))
    o.save(A+f'cdp-{m:02d}.webp',quality=90,alpha_quality=100,method=6)
print('page box %%: left %.4f top %.4f w %.4f h %.4f'%(bx0/W*100,by0/H*100,(bx1-bx0)/W*100,(by1-by0)/H*100))
# 3 cut-out
rough=(np.abs(img-cv2.GaussianBlur(img,(0,0),40)).max(2)>6).astype(np.uint8)
rough=cv2.morphologyEx(rough,cv2.MORPH_CLOSE,np.ones((31,31),np.uint8))
n,lb,st,_=cv2.connectedComponentsWithStats(rough); rough=(lb==1+np.argmax(st[1:,4])).astype(np.uint8)
hull=cv2.convexHull(np.column_stack(np.nonzero(rough)[::-1]).astype(np.int32)); hm=np.zeros((H,W),np.uint8); cv2.fillPoly(hm,[hull],255)
far=(cv2.dilate(hm,np.ones((161,161)))==0).astype(np.float32)
bg=np.stack([cv2.GaussianBlur(img[...,c]*far,(0,0),260) for c in range(3)],-1)/np.maximum(cv2.GaussianBlur(far,(0,0),260),1e-5)[...,None]
ch=lambda x: x/np.maximum(x.sum(2,keepdims=True),1)
cd0=cv2.GaussianBlur(np.abs(ch(img)-ch(bg)).sum(2),(0,0),1.5)
gm=np.full((H,W),cv2.GC_BGD,np.uint8); gm[hm>0]=cv2.GC_PR_BGD
gm[(hm>0)&(cd0>.03)]=cv2.GC_PR_FGD
gm[(cv2.erode((cd0>.06).astype(np.uint8),np.ones((9,9)))>0)|(Am>.99)]=cv2.GC_FGD
ringband=np.zeros((H,W),bool); ringband[int(q[:,1].min())-110:int(q[:2,1].max())+30, int(q[0,0])-10:int(q[1,0])+30]=True
ringpx=ringband&(np.abs(img-bg).max(2)>28)
cv2.grabCut(img.astype(np.uint8),gm,None,np.zeros((1,65)),np.zeros((1,65)),6,cv2.GC_INIT_WITH_MASK)
fg=((gm==1)|(gm==3))
fg|=ndimage.binary_opening(ringpx,np.ones((2,2)))                    # the rings, thin wire: kept by their own colour
# 4 backdrop and shadow
ch=lambda x: x/np.maximum(x.sum(2,keepdims=True),1)
cd=np.abs(ch(img)-ch(bg)).sum(2); low=np.zeros((H,W),bool); low[int(H*.6):]=True
fg&=~(low&(cd<.03)); fg=ndimage.binary_opening(fg,np.ones((3,3)))
lb,nl=ndimage.label(fg); fg=lb==(1+np.argmax(ndimage.sum(fg,lb,range(1,nl+1)))); pre=fg.copy(); fg=ndimage.binary_fill_holes(fg)
ab=ringband&(~(np.abs(img-bg).max(2)>18)); ab&=~(Am>.5); fg[ab]=False   # between and inside the coils: the page shows through
alpha=cv2.GaussianBlur(fg.astype(np.float32),(0,0),.9)
Ls=cv2.GaussianBlur(np.clip(img/np.maximum(bg,1),0,1).mean(2),(0,0),4)
Ls=np.where(Ls>.975,1.0,np.where(Ls<.93,Ls,.93+(Ls-.93)*(1-.93)/(.975-.93)))
sh=Ls*(1-alpha)+alpha
ys_,xs_=np.nonzero(fg); cy0=max(0,ys_.min()-90); cy1=min(H,ys_.max()+260); cx0=max(0,xs_.min()-300); cx1=min(W,xs_.max()+140)
print('crop',cx0,cy0,cx1,cy1)
sh=sh[cy0:cy1,cx0:cx1]; alpha=alpha[cy0:cy1,cx0:cx1]; imgc=img[cy0:cy1,cx0:cx1]; Hc,Wc=sh.shape
e=np.ones((Hc,Wc),np.float32); r_=120; ramp=lambda N: np.clip(np.arange(N)/r_,0,1)
e*=np.minimum(ramp(Wc),ramp(Wc)[::-1])[None]; e*=np.minimum(ramp(Hc),ramp(Hc)[::-1])[:,None]; sh=1-(1-sh)*e
Image.fromarray((np.clip(sh,0,1)*255).astype(np.uint8)).save(A+'cdm-shadow.webp',quality=88)
o=Image.fromarray(imgc.astype(np.uint8)[...,::-1]).filter(ImageFilter.UnsharpMask(1.6,40,0)); o.putalpha(Image.fromarray((alpha*255).astype(np.uint8)))
o.save(A+'cdm-base.webp',quality=90,alpha_quality=100,method=6)
vis=img.astype(np.uint8).copy(); vis[~fg.astype(bool)]=(vis[~fg]*.3+np.array([0,0,255])*.7).astype(np.uint8); cv2.imwrite('cutvis.jpg',cv2.resize(vis,(470,640)))
pc=np.array([245,224,202.])[::-1]; prev=np.tile(pc,(Hc,Wc,1))*sh[...,None]; prev=prev*(1-alpha[...,None])+imgc*alpha[...,None]
cv2.imwrite('prev.jpg',prev)
print('size',Wc,Hc,'page box %%: left %.4f top %.4f w %.4f h %.4f'%((bx0-cx0)/Wc*100,(by0-cy0)/Hc*100,(bx1-bx0)/Wc*100,(by1-by0)/Hc*100))
print('ok')
