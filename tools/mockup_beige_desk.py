import cv2, numpy as np
from PIL import Image
from scipy import ndimage
D='/tmp/claude-0/-home-user-Mass-Grass/3c3a7cf0-a5d3-55d4-bdc2-a4e0bc8d42f0/scratchpad/mk/'
R='/home/user/Mass-Grass/'
p=np.asarray(Image.open(D+'m5.png')).astype(float); H,W=p.shape[:2]
rows,cols=np.mgrid[0:H,0:W]
d=p[...,0]-(p[...,1]+p[...,2])/2
# ---- 1. background: red -> beige, keeping the glow and the shadows
B=np.zeros((H,W),bool)
for x0,x1 in ((379,922),(1145,1688)): B[180:1020,x0:x1]=True
near=ndimage.binary_dilation(B,iterations=6)
pure=(~near).astype(float)
def nconv(s):
    num=ndimage.gaussian_filter(p*pure[...,None],(s,s,0)); den=ndimage.gaussian_filter(pure,s)[...,None]
    return num/np.maximum(den,1e-4),den[...,0]
b1,w1=nconv(10); b2,w2=nconv(45)
bg=np.where((w1>.04)[...,None],b1,b2)
bgd=bg[...,0]-(bg[...,1]+bg[...,2])/2
a=np.clip(d/np.maximum(bgd,60),0,1)
# the boards (and what is on them) are left alone, 2px inside their edge; wires above the boards are un-mixed from the red
zone=np.zeros((H,W),bool)
for x0,x1 in ((381,919),(1147,1685)): zone[222:1018,x0:x1]=True
a[zone]=0
a=np.where(near,a,1.0)
a[zone]=0
a=np.where(a<.04,0,a)
BEIGE=np.array([229,218,198.])
bs,ws=nconv(24); bs=np.where((ws>.03)[...,None],bs,b2)
Y=bs.mean(2); s=np.clip(Y/np.median(Y[pure>0]),.5,1.04)
newbg=BEIGE[None,None,:]*(s[...,None]**.9)
fg=(p-a[...,None]*bg)/np.maximum(1-a,.12)[...,None]
fg=np.clip(fg,0,255)
t=np.clip((a-.9)/.08,0,1)[...,None]          # a>.98: pure background, no chroma noise of the old render survives
mixed=(1-a[...,None])*fg+a[...,None]*newbg
out=np.where(a[...,None]>0,(1-t)*mixed+t*newbg,p)
# the boards caught a pink bounce of the red room: take the cast out of them (keep the light, drop the colour)
cast=np.zeros((H,W)); 
for x0,x1 in ((381,919),(1147,1685)): cast[222:1018,x0:x1]=1
cast=ndimage.gaussian_filter(cast,1.2)
lum=out.mean(2,keepdims=True); neut=lum+(out-lum)*.12+np.array([4,1,-5.])
out=out*(1-cast[...,None])+neut*cast[...,None]
# ---- 2. the pages
def mask_rect(x0,y0,x1,y1,sc=8):
    m=np.zeros((H*sc,W*sc),np.uint8); cv2.rectangle(m,(int(x0*sc),int(y0*sc)),(int(x1*sc)-1,int(y1*sc)-1),255,-1)
    return cv2.resize(m,(W,H),interpolation=cv2.INTER_AREA).astype(float)/255
def art(path,w,h):
    im=np.asarray(Image.open(path).convert('RGB')).astype(float); ih,iw=im.shape[:2]
    t=w/h
    if iw/ih>t: nw=int(ih*t); im=im[:,(iw-nw)//2:(iw-nw)//2+nw]
    else: nh=int(iw/t); im=im[(ih-nh)//2:(ih-nh)//2+nh]
    return cv2.resize(im,(w*4,h*4),interpolation=cv2.INTER_AREA)
def page(out,box,img,seed):
    x0,y0,x1,y1=box; w,h=int(round(x1-x0)),int(round(y1-y0))
    a4=art(img,w,h)
    # lay it at the exact (sub-pixel) box: scale the 4x art onto a canvas, then area-resample
    canvas=np.zeros((H*4,W*4,3)); X0,Y0=int(round(x0*4)),int(round(y0*4))
    canvas[Y0:Y0+h*4,X0:X0+w*4]=a4
    lay=cv2.resize(canvas,(W,H),interpolation=cv2.INTER_AREA)
    m=mask_rect(x0,y0,x1,y1)
    lay=lay*.965+np.random.default_rng(seed).normal(0,1.6,(H,W,1))   # a printed page is a touch darker, with the paper grain
    mm=m[...,None]
    return out*(1-mm)+lay*mm, m
sat=p.max(2)-p.min(2); L=p.mean(2)
orig=out.copy()
o2,mL=page(out,(393,232,902,952),R+'drafts/calendar-v2/pg-001.jpg',3)
o2,mR=page(o2,(1161,232,1669,952),R+'drafts/calendar-v2/pg-000.jpg',4)
# ---- 3. rings: keep the original metal where the wires run over the page
wire=(d<110)&(rows<213)&(rows>188)      # wires seen against the red, above the boards
colm=ndimage.binary_dilation(wire.any(0)[None,:].repeat(H,0),iterations=0)
cm=np.zeros((H,W),bool); cm[:]=wire.any(0)[None,:]
cm=ndimage.binary_dilation(cm,structure=np.ones((1,11)))
band=(rows>=221)&(rows<262)
neutral=(sat<26)
pagecol=np.where(cols<1000,255,255)
metal=band&cm&(sat<20)&(L>95)&(L<(np.where(cols<1000,246,236)))
wc0=np.nonzero(wire.any(0))[0]
tight=np.zeros((H,W),bool); tight[:, :]=False
_g=[];_s=wc0[0];_p=wc0[0]
for _x in wc0[1:]:
    if _x-_p>6: _g.append((_s,_p)); _s=_x
    _p=_x
_g.append((_s,_p))
for g0,g1 in _g: tight[:252,max(g0-3,0):g1+4]=True
keep=metal&tight&((mL>0)|(mR>0))
keep=ndimage.binary_opening(keep,structure=np.ones((2,1)))
keep=ndimage.binary_closing(keep,structure=np.ones((3,3)),iterations=2)
keep=ndimage.binary_dilation(keep,iterations=1).astype(float); keep=ndimage.gaussian_filter(keep,.8)
keep=np.minimum(keep,1)[...,None]
wc=np.nonzero(wire.any(0))[0]; groups=[]; st=wc[0]; pv=wc[0]
for x in wc[1:]:
    if x-pv>6: groups.append((st,pv)); st=x
    pv=x
groups.append((st,pv))
sh=np.zeros((H,W))
for g0,g1 in groups:
    if not (393<g0<905 or 1161<g0<1672): continue
    cx=(g0+g1)/2
    sh[233:251,int(cx-9):int(cx+10)]=1       # the punched hole
sh=ndimage.gaussian_filter(sh,1.1)
halo=ndimage.gaussian_filter(sh,3.5)
pg=((mL>0)|(mR>0))[...,None]
o2=o2*(1-(.62*sh+.22*halo)[...,None]*pg)
fin=o2*(1-keep)+out*keep
Image.fromarray(np.clip(fin,0,255).astype('uint8')).save(D+'mcd.png')
Image.fromarray(np.clip(fin,0,255).astype('uint8')).save(D+'mcd.jpg',quality=94)
Image.fromarray((keep[...,0]*255).astype('uint8')).save(D+'keep.png')
print('ok')
