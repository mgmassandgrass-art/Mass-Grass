# Render the owner's PSD (Free Mini Desktop Calendar Mockup, 4500x3600) with our pages in its two smart objects, layer by layer:
# Shadow, Base, Spiral Ring, bottom pages, page/jacket colour fills (masked), the two pages (perspective from the smart objects'
# transform boxes, clipped by their masks), Shadows (linear burn), Highlights (screen). No background fill, no web tag: RGBA out.
import sys, cv2, numpy as np
from psd_tools import PSDImage
from PIL import Image
Image.MAX_IMAGE_PIXELS=None
p=PSDImage.open('x/Free Mini Desktop Calendar Mockup.psd'); W,H=p.size
L={}
for l in p.descendants(): L.setdefault(l.name,[]).append(l)
def layer_rgba(l):
    im=l.composite()           # RGBA at its bbox, mask applied
    a=np.zeros((H,W,4),np.float32); x0,y0,x1,y1=l.bbox
    arr=np.asarray(im.convert('RGBA')).astype(np.float32)/255
    X0,Y0=max(0,x0),max(0,y0); X1,Y1=min(W,x1),min(H,y1)
    a[Y0:Y1,X0:X1]=arr[Y0-y0:Y1-y0,X0-x0:X1-x0]; return a
def over(dst,src):
    sa=src[...,3:]; da=dst[...,3:]; oa=sa+da*(1-sa)
    rgb=(src[...,:3]*sa+dst[...,:3]*da*(1-sa))/np.maximum(oa,1e-6); return np.concatenate([rgb,oa],-1)
CACHE='base.npz'
import os
if os.path.exists(CACHE):
    z=np.load(CACHE); under=z['under']; shadows=z['shadows']; highs=z['highs']; mL=z['mL']; mR=z['mR']; boxes=z['boxes']
else:
    under=np.zeros((H,W,4),np.float32)
    for n in ('Shadow','Base','Spiral Ring','bottom pages'): under=over(under,layer_rgba(L[n][0]))
    for l in L['COLOR'][0]: under=over(under,layer_rgba(l))
    shadows=layer_rgba(L['Shadows'][0]); highs=layer_rgba(L['Highlights'][0])
    so=[l for l in p.descendants() if l.kind=='smartobject']
    ms=[]; boxes=[]
    for l in so:
        m=np.zeros((H,W),np.float32); x0,y0,x1,y1=l.mask.bbox
        mm=np.asarray(l.mask.topil()).astype(np.float32)/255; m[y0:y1,x0:x1]=mm[:y1-y0,:x1-x0]; ms.append(m); boxes.append(np.array(l.smart_object.transform_box).reshape(4,2))
    mL,mR=ms; boxes=np.array(boxes)
    np.savez(CACHE,under=under,shadows=shadows,highs=highs,mL=mL,mR=mR,boxes=boxes)
def page(img_path,box,mask):
    pg=np.asarray(Image.open(img_path).convert('RGB')).astype(np.float32)/255
    h,w=pg.shape[:2]; t=1277/1780
    if w/h>t: nw=int(h*t); pg=pg[:,(w-nw)//2:(w-nw)//2+nw]
    else: nh=int(w/t); pg=pg[(h-nh)//2:(h-nh)//2+nh]
    h,w=pg.shape[:2]
    M=cv2.getPerspectiveTransform(np.float32([[0,0],[w,0],[w,h],[0,h]]),np.float32(box))
    wa=cv2.warpPerspective(pg,M,(W,H),flags=cv2.INTER_AREA,borderMode=cv2.BORDER_REPLICATE)
    return np.dstack([wa,mask])
def render(left,right,out):
    c=under.copy()
    if left: c=over(c,page(left,boxes[0],mL))
    if right: c=over(c,page(right,boxes[1],mR))
    rgb=c[...,:3]; a=c[...,3:]
    sa=shadows[...,3:]; lb=np.clip(rgb+shadows[...,:3]-1,0,1); rgb=rgb*(1-sa)+lb*sa
    ha=highs[...,3:]; sc=1-(1-rgb)*(1-highs[...,:3]); rgb=rgb*(1-ha)+sc*ha
    o=np.dstack([rgb,a]); Image.fromarray((np.clip(o,0,1)*255).astype(np.uint8)).save(out); return o
if __name__=='__main__':
    P='/tmp/claude-0/-home-user-Mass-Grass/3c3a7cf0-a5d3-55d4-bdc2-a4e0bc8d42f0/scratchpad/pdf27/'
    render('/home/user/Mass-Grass/drafts/calendar-v2/pg-000.jpg',P+'p03.png','pair.png')
    print('ok')
