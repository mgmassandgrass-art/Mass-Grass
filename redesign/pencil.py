from PIL import Image, ImageFilter
import numpy as np, sys
for slug in sys.argv[1:]:
    im=Image.open(f'product/img/{slug}.jpg').convert('L');im.thumbnail((900,900))
    g=np.array(im).astype(float);bl=np.array(Image.fromarray((255-g).astype('uint8')).filter(ImageFilter.GaussianBlur(9))).astype(float)
    d=np.clip(g*255/(255-bl+1),0,255);d=255-(255-d)*0.75
    out=np.clip(d+np.random.default_rng(3).normal(0,4,d.shape),0,255).astype('uint8')
    o=Image.blend(Image.fromarray(out).convert('RGB'),Image.new('RGB',out.shape[::-1],(250,247,240)),0.12)
    o.save(f'site_extra/img/pencil-{slug}.webp',quality=82)
