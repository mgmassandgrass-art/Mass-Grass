import cv2, numpy as np
from PIL import Image; Image.MAX_IMAGE_PIXELS=None
from scipy import ndimage
h=Image.open('../hero/clean.png').convert('RGB').crop((140,500,1620,2300))
h.paste(Image.open('L01.png').convert('RGB'),(280,210))
a=np.asarray(h).astype(np.float32); H,W=a.shape[:2]
L=a.mean(2)
# background light: a smooth surface fitted on the plain backdrop (far from the calendar and its shadow)
Y,X=np.mgrid[0:H,0:W].astype(np.float32); u=X/W; v=Y/H
far=np.ones((H,W),bool); far[150:1650,120:1400]=False
ys,xs=np.nonzero(far[::4,::4]); ys*=4; xs*=4
def basis(u,v): return [np.ones_like(u),u,v,u*u,v*v,u*v,u**3,v**3,u*u*v,u*v*v]
B=np.stack([b[ys,xs] for b in basis(u,v)],1)
bg=np.stack([sum(k*b for k,b in zip(np.linalg.lstsq(B,a[ys,xs,c],rcond=None)[0],basis(u,v))) for c in range(3)],-1)
ratio=np.clip(a/np.maximum(bg,1),0,1.2)
r=ratio.mean(2)
# the object: the stand and the calendar (clearly darker or differently coloured than the backdrop), filled and feathered
col=np.abs(a/np.maximum(a.sum(2,keepdims=True),1)-bg/np.maximum(bg.sum(2,keepdims=True),1)).sum(2)
obj=(r<.74)|(col>.035)
obj=ndimage.binary_opening(obj,iterations=2); obj=ndimage.binary_closing(obj,iterations=6)
lab,n=ndimage.label(obj); sz=ndimage.sum(obj,lab,range(1,n+1)); obj=lab==(1+np.argmax(sz))
obj=ndimage.binary_fill_holes(obj); obj=ndimage.binary_erosion(obj,iterations=1)
al=cv2.GaussianBlur(obj.astype(np.float32),(0,0),1.2)
# the shadow layer: the photograph divided by its backdrop (backdrop = white), to multiply onto the page
sh=np.clip(ratio,0,1); sh=np.where(obj[...,None],1,sh)
sh=1-(1-sh)*1.0
cv2.imwrite('shadow.png',(sh[...,::-1]*255).astype(np.uint8))
Image.fromarray(np.dstack([a.astype(np.uint8),(al*255).astype(np.uint8)])).save('object.png')
Image.fromarray((al*255).astype(np.uint8)).resize((370,450)).save('objm.png')
Image.fromarray((sh.mean(2)*255).astype(np.uint8)).resize((370,450)).save('shm.png')
print('bg corners',bg[5,5].round(),bg[-5,-5].round(),'min ratio outside',r[~obj].min().round(2))
over=(a/np.maximum(bg,1)>1.0).any(2); print('pixels brighter than backdrop: %.2f%%'%(over.mean()*100), (a/bg).max())
norm=np.clip(a/np.maximum(bg,1),0,1)*255
cv2.imwrite('norm.png',norm[...,::-1].astype(np.uint8))
# the object as the convex hull of what was found (stand + calendar are one convex-ish block), with the rings added from the original page fit
pts=np.column_stack(np.nonzero(obj)[::-1]).astype(np.int32)
hull=cv2.convexHull(pts)
hm=np.zeros((H,W),np.uint8); cv2.fillPoly(hm,[hull],255)
vis=a.astype(np.uint8)[...,::-1].copy(); cv2.polylines(vis,[hull],True,(0,0,255),3)
cv2.imwrite('hull.png',cv2.resize(vis,(740,900)))
np.save('hull.npy',hull)
