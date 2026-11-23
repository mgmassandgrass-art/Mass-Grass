# The owner's white desk calendar PNG (27, July, with its own soft shadow in the alpha): every month registered onto its page
import cv2, numpy as np
from scipy import ndimage
from PIL import Image, ImageFilter
P='../pdf27/'; A='/home/user/Mass-Grass/web/assets/'
rgba=np.asarray(Image.open('../../images/27.webp').convert('RGBA')).astype(np.float32)
al=rgba[...,3:]/255; img=(rgba[...,:3]*al+255*(1-al))[...,::-1].copy(); H,W=img.shape[:2]
p1=cv2.imread(P+'p07.png').astype(np.float32); ph,pw=p1.shape[:2]; S=np.float32([[0,0],[pw,0],[pw,ph],[0,ph]])
sift=cv2.SIFT_create(8000)
k1,d1=sift.detectAndCompute(cv2.cvtColor(p1.astype(np.uint8),cv2.COLOR_BGR2GRAY),None); k2,d2=sift.detectAndCompute(cv2.cvtColor(img.astype(np.uint8),cv2.COLOR_BGR2GRAY),None)
mt=[a for a,b in cv2.BFMatcher().knnMatch(d1,d2,k=2) if a.distance<.7*b.distance]
M,inl=cv2.findHomography(np.float32([k1[m.queryIdx].pt for m in mt]),np.float32([k2[m.trainIdx].pt for m in mt]),cv2.RANSAC,3); print('matches',len(mt),inl.sum())
G=lambda x: cv2.GaussianBlur(cv2.cvtColor(x,cv2.COLOR_BGR2GRAY),(0,0),1.5)
for it in range(2):
    w=cv2.warpPerspective(p1,M,(W,H),flags=cv2.INTER_AREA); cq=cv2.perspectiveTransform(S.reshape(-1,1,2),M).reshape(-1,2)
    mk=np.zeros((H,W),np.uint8); cv2.fillPoly(mk,[np.int32(cq)],255); mk=cv2.erode(mk,np.ones((41,41),np.uint8)); mk[:int(cq[:2,1].max())+90]=0
    D=np.eye(3,dtype=np.float32); cc,D=cv2.findTransformECC(G(w),G(img),D,cv2.MOTION_HOMOGRAPHY,(3,300,1e-7),mk,5); M=D.astype(np.float64)@M; print('ecc',round(cc,4))
q=cv2.perspectiveTransform(S.reshape(-1,1,2),M).reshape(-1,2); print(q.round().tolist())
def push(q,i,j,d):
    p=q[j]-q[i]; n=np.array([p[1],-p[0]])/np.hypot(*p); c=q.mean(0)
    if np.dot(n,(q[i]+q[j])/2-c)<0: n=-n
    q=q.copy(); q[i]+=n*d; q[j]+=n*d; return q
qa=push(push(push(q,1,2,2.0),2,3,2.0),3,0,1.0)
def warp(im):
    K=2; big=cv2.warpPerspective(im,np.diag([K,K,1])@M,(W*K,H*K),flags=cv2.INTER_LINEAR,borderMode=cv2.BORDER_REPLICATE)
    return cv2.resize(big,(W,H),interpolation=cv2.INTER_AREA)
m8=np.zeros((H*4,W*4),np.uint8); cv2.fillPoly(m8,[np.int32(np.round(qa*4))],255); Am=cv2.resize(m8,(W,H),interpolation=cv2.INTER_AREA).astype(np.float32)/255
Y,X=np.mgrid[0:H,0:W].astype(np.float32); u=X/W; v=Y/H
w1=warp(p1); fit=ndimage.binary_erosion(Am>.99,iterations=14); fit[:int(q[:2,1].max())+90]=False
ys,xs=np.nonzero(fit); sel=np.random.default_rng(0).choice(len(ys),min(300000,len(ys)),replace=False); ys,xs=ys[sel],xs[sel]
K=[]
for c in range(3):
    wv=w1[ys,xs,c]; Z=np.c_[wv,wv*u[ys,xs],wv*v[ys,xs],np.ones_like(wv),u[ys,xs],v[ys,xs]]; K.append(np.linalg.lstsq(Z,img[ys,xs,c],rcond=None)[0])
model=lambda w: np.stack([K[c][0]*w[...,c]+K[c][1]*w[...,c]*u+K[c][2]*w[...,c]*v+K[c][3]+K[c][4]*u+K[c][5]*v for c in range(3)],-1)
print('residual',np.abs(model(w1)-img).mean(2)[fit].mean().round(2))
top=int(q[:2,1].max())+55
Lh=img.mean(2); sat=img.max(2)-img.min(2)
keep=((Lh<120)&(sat<40))&(Am>.3); keep[top:]=False          # silver rings and the dark punched holes
keep=ndimage.binary_closing(keep,np.ones((3,3)),iterations=2); keep=ndimage.binary_fill_holes(keep); keep=ndimage.binary_opening(keep,np.ones((2,2)))
keep=ndimage.binary_dilation(keep,iterations=1); keep=cv2.GaussianBlur(keep.astype(np.float32),(0,0),.8)
a=Am*(1-keep); a8=(a*255).astype(np.uint8)
ys,xs=np.nonzero(a8>0); y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
for m in range(1,13):
    pr=np.clip(model(warp(cv2.imread(P+f'p{m:02d}.png').astype(np.float32))),0,255).astype(np.uint8)[y0:y1,x0:x1,::-1]
    o=Image.fromarray(pr).filter(ImageFilter.UnsharpMask(1.4,35,0)); o.putalpha(Image.fromarray(a8[y0:y1,x0:x1])); o.save(A+f'cdp-{m:02d}.webp',quality=92,alpha_quality=100,method=6)
    if m==1: 
        prev=Image.open('../../images/27.webp').convert('RGBA'); prev.alpha_composite(o,(int(x0),int(y0))); prev.save('prev1.png')
Image.open('../../images/27.webp').convert('RGBA').save(A+'cdm-base.webp',quality=92,alpha_quality=100,method=6)
Image.open('../../images/26.webp').convert('RGBA').save(A+'cal-hero.webp',quality=92,alpha_quality=100,method=6)
Image.open('../../images/26.webp').convert('RGBA').resize((1000,800),Image.LANCZOS).save(A+'cal-hero-m.webp',quality=90,alpha_quality=100,method=6)
print('page box %%: %.4f %.4f %.4f %.4f'%(x0/W*100,y0/H*100,(x1-x0)/W*100,(y1-y0)/H*100))
