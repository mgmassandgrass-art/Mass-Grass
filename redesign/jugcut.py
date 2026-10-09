from PIL import Image, ImageFilter
import numpy as np, sys
from scipy import ndimage
im=Image.open('product/img/jug.webp').convert('RGBA');a=np.array(im).astype(int)
H,W=a.shape[:2];al=a[...,3];r,g,b=a[...,0],a[...,1],a[...,2]
mx=np.maximum(np.maximum(r,g),b);sat=mx-np.minimum(np.minimum(r,g),b)
cx,cy,rx,ry=.479*W,.765*H,(.4476+float(sys.argv[1]))*W,(.2204+float(sys.argv[2]))*H
Y,X=np.mgrid[0:H,0:W];inE=((X-cx)/rx)**2+((Y-cy)/ry)**2<=1
keep=(al>20)&(inE|~((sat<30)&(mx>140)))
lab,n=ndimage.label(keep);keep=lab==(np.argmax(ndimage.sum(keep,lab,range(1,n+1)))+1)
keep=ndimage.binary_fill_holes(keep)&(al>20)
m=Image.fromarray(np.where(keep,al,0).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(.6))
out=im.copy();out.putalpha(m);out=out.crop(out.getbbox());out.save('jug_cut.webp',quality=92)
c=Image.new('RGBA',(out.width+20,out.height+20),(60,60,60,255));c.alpha_composite(out,(10,10));c.thumbnail((400,400));c.save('jug.png')
