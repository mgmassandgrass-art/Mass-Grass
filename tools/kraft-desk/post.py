# the two owner PNGs for the page: veil off, cropped to content, padded so the calendars (not their shadow) are centred
from PIL import Image; import numpy as np, sys
A='/home/user/Mass-Grass/web/assets/'
def prep(src):
    im=np.asarray(Image.open(src).convert('RGBA')).astype(np.float32); a=im[...,3]; H,W=a.shape
    b=np.zeros_like(a,bool); b[:3]=b[-3:]=True; b[:,:3]=b[:,-3:]=True
    fl=np.percentile(a[b],95)+3; na=np.clip((a-fl)/(255-fl),0,1)*255
    r=90; ramp=lambda n: np.clip(np.arange(n)/r,0,1); e=np.minimum(ramp(W),ramp(W)[::-1])[None]*np.minimum(ramp(H),ramp(H)[::-1])[:,None]
    na=np.where(a>250,a,na*e); im[...,3]=na; return Image.fromarray(im.astype(np.uint8))
def centre(im,vert,pad=10):
    a=np.asarray(im)[...,3]
    ys,xs=np.nonzero(a>240); ox0,ox1,oy0,oy1=xs.min(),xs.max(),ys.min(),ys.max()
    cys,cxs=np.nonzero(a>8); cx0,cx1,cy0,cy1=cxs.min(),cxs.max(),cys.min(),cys.max()
    cx=(ox0+ox1)/2; hw=max(cx-cx0,cx1-cx)+pad; cy=(oy0+oy1)/2; hh=max(cy-cy0,cy1-cy)+pad
    nw=int(2*hw); nh=int(2*hh) if vert else int(cy1-cy0+2*pad)
    ox=int(round(hw-cx)); oy=int(round(hh-cy)) if vert else int(pad-cy0)
    out=Image.new('RGBA',(nw,nh)); out.paste(im,(ox,oy)); return out,ox,oy
h,_,_=centre(prep('../../images/26.webp'),False)
h.save(A+'cal-hero.webp',quality=92,alpha_quality=100,method=6)
h.resize((1100,int(1100*h.height/h.width)),Image.LANCZOS).save(A+'cal-hero-m.webp',quality=90,alpha_quality=100,method=6)
b,ox,oy=centre(prep('../../images/27.webp'),True)
b.save(A+'cdm-base.webp',quality=92,alpha_quality=100,method=6)
x0,y0,w,h_=[float(v) for v in sys.argv[1:5]]
print('hero',h.size,'base',b.size)
print('.btshow .bts-pg{left:%.4f%%;top:%.4f%%;width:%.4f%%;height:%.4f%%}'%((x0+ox)/b.width*100,(y0+oy)/b.height*100,w/b.width*100,h_/b.height*100))
