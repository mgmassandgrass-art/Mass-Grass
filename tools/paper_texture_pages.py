# Farah's pages printed on the owner's paper: the paper's fibres and its soft light carried onto every page (multiply of the
# paper's own variation around its mean, so the page keeps its colours), a hair of edge darkening, as a printed sheet.
import cv2, numpy as np
from PIL import Image
T=cv2.imread('../../images/35.jpg').astype(np.float32); print(T.shape)
P='../pdf27/'; A='/home/user/Mass-Grass/web/assets/'
W,H=1100,1546
t=cv2.resize(T,(W,H),interpolation=cv2.INTER_AREA)
mean=t.reshape(-1,3).mean(0)
fib=t/mean                                          # fibres and specks, around 1
low=cv2.GaussianBlur(t.mean(2),(0,0),80); low=low/low.mean()   # the sheet's soft light
fine=fib/np.repeat(cv2.GaussianBlur(fib.mean(2),(0,0),80)[...,None],3,2)
k=1+(np.clip(fine,.92,1.06)-1)*1.0                                    # fibres a touch stronger so they read at this size
light=1+(low-1)*.8
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
d=np.minimum.reduce([xx,yy,W-1-xx,H-1-yy]); edge=1-.05*np.clip(1-d/14,0,1)
fl=[None,1,0,-1]
k0,l0=k.copy(),light.copy()
for m in range(1,13):
    f=fl[m%4]; k=k0 if f is None else cv2.flip(k0,f); light=l0 if f is None else cv2.flip(l0,f)
    sh=(m*137)%400; k=np.roll(k,sh,0); light=np.roll(light,sh,0)   # each page its own piece of the sheet
    pg=cv2.imread(P+f'p{m:02d}.png').astype(np.float32)
    pg=cv2.resize(pg,(W,H),interpolation=cv2.INTER_AREA)
    out=pg*k*light[...,None]*edge[...,None]
    # paper shows through the light inks a little more than the dark ones
    out=np.clip(out,0,255).astype(np.uint8)
    cv2.imwrite(f'pt{m:02d}.png',out)
    Image.fromarray(out[...,::-1]).save(A+f'c27t-{m:02d}.webp',quality=90,method=6)
print('ok')
