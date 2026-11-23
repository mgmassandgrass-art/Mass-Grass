# A flat sheet on a table (images/24): the photograph's shadow as a multiply layer (backdrop -> white), and the sheet re-made at our
# page's proportion with our page printed on it in the sheet's own light and paper.
import cv2, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
ph=cv2.imread('../../images/24.webp')[...,::-1].astype(np.float32); H,W=ph.shape[:2]
x0,x1,y0,y1=648,1325,247,1270
Y,X=np.mgrid[0:H,0:W].astype(np.float32); u=X/W; v=Y/H
# backdrop: a smooth surface fitted far from the sheet and its shadow
far=np.ones((H,W),bool); far[y0-60:y1+230,x0-230:x1+60]=False
wgt=far.astype(np.float32)
def nconv(sg): return np.stack([cv2.GaussianBlur(ph[...,c]*wgt,(0,0),sg) for c in range(3)],-1)/np.maximum(cv2.GaussianBlur(wgt,(0,0),sg),1e-5)[...,None]
bg=nconv(220)
sh=cv2.GaussianBlur(np.clip(ph/np.maximum(bg,1),0,1).mean(2),(0,0),2.5)
sh=np.where(sh>.97,1.0,np.where(sh>.94,.94+(sh-.94)*2,sh))
sheet=np.zeros((H,W),bool); sheet[y0:y1,x0:x1]=True
sh[sheet]=1.0
sh=cv2.GaussianBlur(sh.astype(np.float32),(0,0),6); sh=1-(1-sh)*.62
sh[sheet]=1.0
# the sheet's light: plane fitted on its plain paper
P=ph[y0+8:y1-8,x0+8:x1-8]; Lp=P.mean(2); sat=P.max(2)-P.min(2)
pm=(sat<24)&(Lp>np.percentile(Lp,40)); pm&=~ndimage.binary_dilation(Lp<180,iterations=6)
yy,xx=np.nonzero(pm); A=np.c_[np.ones(len(xx)),xx/P.shape[1],yy/P.shape[0]]
k=np.linalg.lstsq(A,Lp[yy,xx],rcond=None)[0]; tint=np.median(P[pm],0)
print('paper',tint.round(),'light',k.round(2))
# our page at the sheet's height, our proportion
pg=np.asarray(Image.open('../pdf27/p01.png').convert('RGB')).astype(np.float32)
h=y1-y0; w=int(round(h*pg.shape[1]/pg.shape[0])); cx=(x0+x1)/2; nx0=int(round(cx-w/2))
pgs=cv2.resize(pg,(w,h),interpolation=cv2.INTER_AREA)
gy,gx=np.mgrid[0:h,0:w].astype(np.float32)
light=(k[0]+k[1]*gx/w+k[2]*gy/h)/k[0]
paper=tint/tint.max()*.985
out=pgs/255*paper[None,None,:]*255*light[...,None]
n=cv2.GaussianBlur(np.random.default_rng(3).normal(0,1,(h,w)).astype(np.float32),(0,0),.7); out+=n[...,None]*1.6
out=cv2.GaussianBlur(out,(0,0),.45)
edge=np.ones((h,w),np.float32); edge[:,:1]=.93; edge[:,-1:]=.93; edge[-1:,:]=.9; edge[:1,:]=.96
out*=edge[...,None]
# shadow layer: widen around the sheet's centre to the new width
s=w/(x1-x0); M=np.float32([[s,0,cx*(1-s)],[0,1,0]])
shw=cv2.warpAffine(sh,M,(W,H),flags=cv2.INTER_LINEAR,borderMode=cv2.BORDER_REPLICATE)
edgef=np.ones((H,W),np.float32); r=80
ramp=lambda N: np.clip(np.arange(N)/r,0,1)
edgef*=np.minimum(ramp(W),ramp(W)[::-1])[None]; edgef*=np.minimum(ramp(H),ramp(H)[::-1])[:,None]
shw=1-(1-shw)*edgef
A='/home/user/Mass-Grass/web/assets/'
Image.fromarray((np.clip(shw,0,1)*255).astype(np.uint8)).save(A+'cfl-shadow.webp',quality=88)
Image.fromarray(np.clip(out,0,255).astype(np.uint8)).filter(ImageFilter.UnsharpMask(1.5,40,0)).save(A+'cfl-01.webp',quality=92)
print('sheet box %',nx0/W*100,y0/H*100,w/W*100,h/H*100)
# preview on the page colour
pc=np.array([245,224,202.]); prev=np.tile(pc,(H,W,1))*shw[...,None]; prev[y0:y1,nx0:nx0+w]=out
Image.fromarray(np.clip(prev,0,255).astype(np.uint8)).resize((1000,763)).save('prev.jpg',quality=88)
