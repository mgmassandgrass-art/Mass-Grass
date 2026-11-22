# Our pages laid onto the kraft desk mockup (images/7.jpg): exact page corners (quad.py, edges fitted to the photo),
# printed on the mockup's own paper (the page's white becomes the photo's paper colour and light), its grain and softness,
# rings and punched holes kept from the photo.
import cv2, numpy as np
from scipy import ndimage
ph=cv2.imread('../../images/7.jpg').astype(np.float32); H,W=ph.shape[:2]
L=ph.mean(2); sat=ph.max(2)-ph.min(2)
QL,QR=np.load('quads.npy')
P='/tmp/claude-0/-home-user-Mass-Grass/3c3a7cf0-a5d3-55d4-bdc2-a4e0bc8d42f0/scratchpad/pdf27/'
def mask_of(q,s=8):
    m=np.zeros((H*s,W*s),np.uint8); cv2.fillPoly(m,[np.int32(np.round(np.array(q)*s))],255,lineType=cv2.LINE_AA)
    return cv2.resize(m,(W,H),interpolation=cv2.INTER_AREA).astype(np.float32)/255
def paper(q):
    """the page's paper colour and light, a plane per channel fitted on its plain margins (top strip under the holes, bottom strip)"""
    q=np.array(q); m=ndimage.binary_erosion(mask_of(q)>.99,iterations=6)
    Y,X=np.mgrid[0:H,0:W].astype(np.float64)
    def frac(p0,p1):   # distance down the page, 0 at the top edge, 1 at the bottom edge (by the two side midpoints)
        top=(q[0]+q[1])/2; bot=(q[3]+q[2])/2; d=bot-top; return ((X-top[0])*d[0]+(Y-top[1])*d[1])/(d@d)
    f=frac(0,0)
    strip=m&(((f>.07)&(f<.13))|((f>.93)&(f<.985)))
    cand=strip&(sat<32)
    v=L[cand]; cand&=L>np.percentile(v,35)
    cand&=~ndimage.binary_dilation((L<150)|(sat>40),iterations=3)      # keep clear of the old print's lines and colours
    ys,xs=np.nonzero(cand); A=np.c_[np.ones(len(xs)),xs,ys].astype(np.float64)
    k,*_=np.linalg.lstsq(A,L[ys,xs].astype(np.float64),rcond=None)
    light=(k[0]+k[1]*X+k[2]*Y)/np.median(L[ys,xs])                       # the light across the page, as a gain
    tint=np.median(ph[ys,xs],0); tint=tint.mean()*(.55+.45*tint/tint.mean())   # the paper's colour, half of its warmth (the art keeps its own colours)
    out=(light[...,None]*tint[None,None,:]).astype(np.float32)
    hp=(L-cv2.GaussianBlur(L,(0,0),1.5))[cand]; g=float(np.median(np.abs(hp))*1.4826)
    print('paper RGB',out[int(ys.mean()),int(xs.mean())][::-1].round(),'grain',round(g,2),'n',len(xs))
    return out,g
def holes(q,d=34):
    (x1,y1),(x2,y2)=q[0],q[1]; Y,X=np.mgrid[0:H,0:W]
    dist=((X-x1)*(y2-y1)-(Y-y1)*(x2-x1))/np.hypot(x2-x1,y2-y1)
    band=(np.abs(dist)<d)&(mask_of(q)>.5)
    k=band&((L<150)|(sat>52))
    k=ndimage.binary_closing(k,structure=np.ones((3,3)),iterations=3); k=ndimage.binary_fill_holes(k)
    k=ndimage.binary_opening(k,structure=np.ones((2,2)))
    k=ndimage.binary_dilation(k,iterations=1).astype(np.float32)
    return cv2.GaussianBlur(k,(0,0),.7)
def put(out,q,img,seed):
    art=cv2.imread(img).astype(np.float32); h,w=art.shape[:2]; S=4
    M=cv2.getPerspectiveTransform(np.float32([[0,0],[w,0],[w,h],[0,h]]),np.float32(np.array(q)*S))
    big=cv2.warpPerspective(art,M,(W*S,H*S),flags=cv2.INTER_AREA,borderMode=cv2.BORDER_REPLICATE)
    wa=cv2.resize(big,(W,H),interpolation=cv2.INTER_AREA)
    pc,gsd=paper(q)
    pr=wa/255.0*pc                                   # printed on that paper, in that light
    pr=cv2.GaussianBlur(pr,(0,0),.55)                 # the photograph's softness
    rng=np.random.default_rng(seed); n=cv2.GaussianBlur(rng.normal(0,1,(H,W)).astype(np.float32),(0,0),.6); n*=gsd/max(n.std(),1e-6)
    pr=pr+n[...,None]
    a=mask_of(q)*(1-holes(q))
    return out*(1-a[...,None])+pr*a[...,None]
out=put(ph.copy(),QL,P+'p01.png',3)
out=put(out,QR,P+'p05.png',4)
out=np.clip(out,0,255).astype(np.uint8); cv2.imwrite('desk2.png',out)
o=cv2.imread('../../images/7.jpg')
for n,b in {'L':(400,500,940,1220),'R':(1060,480,1620,1150)}.items():
    x0,y0,x1,y1=b; cv2.imwrite('c2'+n+'.png',np.hstack([o[y0:y1,x0:x1],out[y0:y1,x0:x1]]))
