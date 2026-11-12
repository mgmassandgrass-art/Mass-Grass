import sys, json, numpy as np
from PIL import Image
from scipy import ndimage
D=sys.argv[1]; A='/home/user/Mass-Grass/web/assets/'
B=json.load(open(f'{D}/src/boxes.json'))
PICK={'wide':'00','close':'05','desk':'09','bed':'12'}
BAND={'wide':.075,'close':.11,'desk':.0,'bed':.08}
for n,(l,t,r,b) in B.items():
  for k in (sys.argv[2:] or [PICK[n]]):
    ph=np.asarray(Image.open(f'{D}/src/{n}.webp').convert('RGB')).astype(float)
    w,h=r-l+1,b-t+1
    art=Image.open(f'{A}c27-{k}-hd.webp').convert('RGB')
    s=max(w/art.width,h/art.height); aw,ah=round(art.width*s),round(art.height*s)
    art=art.resize((aw,ah),Image.LANCZOS); x0,y0=(aw-w)//2,(ah-h)//2
    art=np.asarray(art.crop((x0,y0,x0+w,y0+h))).astype(float)
    pg=ph[t:b+1,l:r+1]; L=pg.mean(2)
    ill=ndimage.grey_closing(L,size=(31,31)); ill=ndimage.gaussian_filter(ill,18)
    shade=np.clip(ill/np.percentile(ill,99.5),0,1.02)[...,None]
    out=art*shade
    # what the photo keeps on top: wire, punched holes, the hanger notch (within the top band)
    ref=np.median(pg[h//3:2*h//3, w//4:3*w//4].reshape(-1,3),0)
    diff=np.abs(pg-ref*shade/shade.mean()).max(2)
    keep=np.zeros((h,w)); bh=int(h*BAND[n])
    if bh: keep[:bh]=(diff[:bh]>16)|((ill[:bh]-L[:bh])>12)
    keep=ndimage.binary_dilation(keep>0,iterations=2).astype(float); keep=ndimage.gaussian_filter(keep,1.2)[...,None]
    edge=np.ones((h,w)); edge[0,:]=edge[-1,:]=edge[:,0]=edge[:,-1]=.5
    a=(1-keep)*edge[...,None]
    pg2=pg*(1-a)+out*a
    res=ph.copy(); res[t:b+1,l:r+1]=pg2
    im=Image.fromarray(np.clip(res,0,255).astype('uint8'))
    im.save(f'{D}/out-{n}-{k}.png'); im.save(f'{D}/out-{n}-{k}.webp',quality=88)
    print('ok',n,k)
