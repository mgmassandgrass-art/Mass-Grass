exec(open('shadow.py').read().split("ratio=np.clip")[0])
stops=[(0,(232,199,166)),(.22,(240,211,182)),(.5,(245,224,202)),(.75,(248,234,218)),(1,(250,240,228))]
def page(f):
    f=np.clip(f,0,1); out=np.zeros(f.shape+(3,),np.float32)
    for (f0,c0),(f1,c1) in zip(stops,stops[1:]):
        m=(f>=f0)&(f<=f1); t=((f-f0)/(f1-f0))[m][:,None]; out[m]=np.array(c0)*(1-t)+np.array(c1)*t
    return out
sx=(215.5+np.arange(W)/W*621.5)/1440
T=np.repeat(page(sx)[None],H,0)            # RGB
k=T[...,::-1]/np.maximum(bg[...,::-1],1)    # bg is RGB already (from PIL), keep order consistent below
k=T/np.maximum(bg,1)
out=np.clip(a*k,0,255)
print('gain range',k.min(0).min(0).round(3),k.max(0).max(0).round(3))
im=Image.fromarray(out.astype(np.uint8))
from PIL import ImageFilter
im=im.filter(ImageFilter.UnsharpMask(2,45,0)); im.save('/home/user/Mass-Grass/web/assets/cdm-base.webp',quality=90,method=6)
np.save('gain.npy',k)
