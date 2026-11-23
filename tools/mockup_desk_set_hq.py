# second pass, done properly: everything at 2x, the month printed sharp from the PDF, holes redrawn clean, the rings' own shadow
# on the new page, a hair of page edge, paper grain, the old base text taken off.
import cv2, numpy as np
from scipy import ndimage
_src=open('comp.py').read()
J=eval(_src.split("J=",1)[1].split("\nOCC=")[0].split("\ndef ")[0])
OCC=eval(_src.split("OCC=",1)[1].split("\ndef qmask")[0])
I='/tmp/claude-0/-home-user-Mass-Grass/3c3a7cf0-a5d3-55d4-bdc2-a4e0bc8d42f0/images/'
P='/tmp/claude-0/-home-user-Mass-Grass/3c3a7cf0-a5d3-55d4-bdc2-a4e0bc8d42f0/scratchpad/pdf27/'
SC=2
AUTO=set()
def qmask(q,H,W,s=4):
    m=np.zeros((H*s,W*s),np.uint8); cv2.fillPoly(m,[np.int32(np.round(np.array(q)*s))],255); return cv2.resize(m,(W,H),interpolation=cv2.INTER_AREA).astype(np.float32)/255
def topdist(q,Xg,Yg):
    (x1,y1),(x2,y2)=q[0],q[1]; c=q.mean(0)
    d=((Xg-x1)*(y2-y1)-(Yg-y1)*(x2-x1))/np.hypot(x2-x1,y2-y1)
    s=np.sign((c[0]-x1)*(y2-y1)-(c[1]-y1)*(x2-x1)); return d*s   # >0 inside, below the top edge
def run(k):
    im0=cv2.imread(I+f'{k}.webp')
    im=cv2.resize(im0,None,fx=SC,fy=SC,interpolation=cv2.INTER_CUBIC)
    f=im.astype(np.float32); H,W=f.shape[:2]
    hsv=cv2.cvtColor(im,cv2.COLOR_BGR2HSV); S=hsv[...,1].astype(np.float32); V=hsv[...,2].astype(np.float32)
    Yg,Xg=np.mgrid[0:H,0:W].astype(np.float32)
    pages=[(np.float32([tl,tr,br,bl])*SC,m) for (tl,tr,br,bl,m) in J[k]]
    # the wire's own colour, from the rings above the pages (on the plain backdrop)
    wsamp=[]
    for q,_ in pages:
        d=topdist(q,Xg,Yg); xs=(Xg>q[:2,0].min())&(Xg<q[:2,0].max())
        wsamp.append(f[(d<-6)&(d>-40)&xs&(S<60)&(V<170)])
    Fw=np.median(np.concatenate(wsamp),0); Fd=np.array([30.,28.,30.])
    Fl=np.median(f[(S<18)&(V>215)],0)
    out=f.copy()
    for n,(q,m) in enumerate(pages):
        c=q.mean(0); qg=np.float32([p+(p-c)/np.linalg.norm(p-c)*3 for p in q])
        A=qmask(qg,H,W)
        d=topdist(q,Xg,Yg)
        above=(d<0)&(d>-12)&(qmask(np.float32([q[0]+(q[0]-q[3])*.04,q[1]+(q[1]-q[2])*.04,q[2],q[3]]),H,W)>.5)&(S>60)
        A=np.maximum(A,above.astype(np.float32))
        if (k,n) in AUTO:   # the stand in front, found by its colour (pinkish card, darker than paper), the old page's text is not it
            lab=cv2.cvtColor(im,cv2.COLOR_BGR2LAB).astype(np.float32)
            st_=(lab[...,1]>=135.5)&(lab[...,0]<195)&(qmask(q,H,W)>.01)
            st_=ndimage.binary_opening(st_,np.ones((3,3)),iterations=1); st_=ndimage.binary_closing(st_,np.ones((5,5)),iterations=2)
            lb,nl=ndimage.label(st_); sz=ndimage.sum(st_,lb,range(1,nl+1))
            st_=np.isin(lb,1+np.nonzero(sz>4000)[0]); st_=ndimage.binary_fill_holes(st_)
            A*=1-cv2.GaussianBlur(st_.astype(np.float32),(0,0),.7)
        else:
            for oc in OCC.get((k,n),[]): A*=1-qmask(np.float32(oc)*SC,H,W)
        A=cv2.GaussianBlur(A,(0,0),.7)
        # the paper's light, from the old page's plain cream (smoothed, carried over its coloured head)
        cream=(A>.99)&(S<40)&(V>120)&(cv2.blur(V,(9,9))-V<6); cream=ndimage.binary_erosion(cream,iterations=4)
        Lc=f.mean(2)*cream; w=cream.astype(np.float32)
        def nc(s): return cv2.GaussianBlur(Lc,(0,0),s)/np.maximum(cv2.GaussianBlur(w,(0,0),s),1e-4), cv2.GaussianBlur(w,(0,0),s)
        a1,w1=nc(24); a2,w2=nc(120); light=np.where(w1>.05,a1,a2)
        ref=np.percentile(f.mean(2)[cream],97) if cream.sum()>200 else 240
        light=np.clip(light/ref,.3,1.04)
        tint=np.median(f[cream],0) if cream.sum()>200 else np.array([235,228,222.]); tint=tint/tint.mean(); tint=1+(tint-1)*.3
        art=cv2.imread(P+f'p{m:02d}.png').astype(np.float32); h,w_=art.shape[:2]; K=2
        M=cv2.getPerspectiveTransform(np.float32([[0,0],[w_,0],[w_,h],[0,h]]),q*K)
        big=cv2.warpPerspective(art,M,(W*K,H*K),flags=cv2.INTER_AREA,borderMode=cv2.BORDER_REPLICATE)
        wa=cv2.resize(big,(W,H),interpolation=cv2.INTER_AREA)
        pr=wa*.965*light[...,None]*tint[None,None,:]
        # a hair of page edge: slightly darker rim along the sides and bottom, as paper catches light
        inner=qmask(q,H,W); rim=np.clip(cv2.GaussianBlur(inner,(0,0),1.2)*-1+1,0,1)*inner
        pr*=(1-.10*rim[...,None])
        g=cv2.GaussianBlur(np.random.default_rng(k*10+n).normal(0,1,(H,W)).astype(np.float32),(0,0),.8); pr+=g[...,None]*1.8
        pr=cv2.GaussianBlur(pr,(0,0),.5)
        # the top band: the rings, their punched holes and their shadows are taken off the old coloured head as a matte
        # (each pixel = a mix of the head colour and either the wire or a dark hole/shadow) and laid back over the new print
        ph_=np.hypot(*(q[3]-q[0])); D0=max(19*SC,.085*ph_)
        st=(d>D0-2*SC)&(d<D0+6*SC)&(A>.99)
        B=np.zeros((H,W,3),np.float32)
        xs_=np.arange(W)
        colm=np.full((W,3),np.nan,np.float32)
        ys,xs=np.nonzero(st)
        if len(xs):
            for ch in range(3):
                sums=np.bincount(xs,f[ys,xs,ch],W); cnt=np.bincount(xs,None,W)
                colm[:,ch]=np.where(cnt>0,sums/np.maximum(cnt,1),np.nan)
            ok=~np.isnan(colm[:,0])
            for ch in range(3):
                colm[:,ch]=np.interp(xs_,xs_[ok],colm[ok,ch])
                colm[:,ch]=cv2.GaussianBlur(colm[:,ch].reshape(1,-1),(0,0),3*SC).ravel()
            B[:]=colm[None]
        rx=np.nonzero(((d<-4*SC)&(d>-20*SC)&(S<60)&(V<190)).any(0))[0]
        band=(d>-12*SC)&(d<D0)&(A>.01)
        if len(rx): band&=(Xg>rx.min()-8*SC)&(Xg<rx.max()+8*SC)
        # the old head is a saturated colour (red, blue, green): saturated = page, its brightness against the plain head
        # = the light and the rings' shadows, carried onto the new print; unsaturated (wire, white punched tabs) stays
        VB=B.max(2); Vp=f.max(2)
        shade=np.where(band,np.clip(Vp/np.maximum(VB,1),.1,1.0),1.0).astype(np.float32)
        shade=cv2.morphologyEx(shade,cv2.MORPH_OPEN,np.ones((9,9),np.uint8))   # the head's thin light pattern lines go; broad shadows stay
        # wire: a pixel lying on the line from the head colour to the wire's colour (small residual), by how far along it is
        v=Fw[None,None,:]-B; aw=np.clip(((f-B)*v).sum(2)/np.maximum((v*v).sum(2),1),0,1)
        res=np.linalg.norm(f-(aw[...,None]*Fw+(1-aw[...,None])*B),axis=2)
        aw=aw*np.clip((30-res)/15,0,1)
        # white punched tabs (light, unsaturated) stay too
        tab=np.clip((Vp-200)/25,0,1)*(1-np.clip((S-28)/22,0,1))
        aw=aw*(1-np.clip((S-95)/25,0,1))          # the head's light pattern lines are still saturated; the wire is not
        keep=np.maximum(np.clip(aw*1.3,0,1),tab)*(Vp>70)
        keep=cv2.GaussianBlur(keep.astype(np.float32),(0,0),.6)*band
        shade=cv2.GaussianBlur(shade,(0,0),1.2)
        pr=pr*shade[...,None]
        # un-mix the head's colour out of the wire's edge pixels, so no red fringe follows the wire onto the new page
        Lf=f.mean(2,keepdims=True)
        Fest=np.clip(Fw[None,None,:]*(Lf/max(Fw.mean(),1)),0,255)          # the wire's own colour, with the photograph's light on it
        Fest=np.where(tab[...,None]>.5,np.repeat(Lf,3,2)*np.array([1.0,.99,.98]),Fest)
        pr=keep[...,None]*Fest+(1-keep[...,None])*pr
        out=out*(1-A[...,None])+pr*A[...,None]
        # the base strip: the mockup's own printed text taken off
        tl,tr,br,bl=q; e=bl-tl; L=np.hypot(*e); dd=e/L; hg=.14*L
        strip=np.float32([bl,br,br+dd*hg,bl+dd*hg])
        sm=qmask(strip,H,W)>.5; sm=ndimage.binary_erosion(sm,iterations=3)&~(cv2.dilate(A,np.ones((7,7)))>.1)
        for oc in OCC.get((k,n),[]): sm&=~(cv2.dilate((qmask(np.float32(oc)*SC,H,W)>.02).astype(np.uint8),np.ones((5,5)))>0)
        base=cv2.medianBlur(im,31).astype(np.float32).mean(2)
        txt=sm&(base-f.mean(2)>8); txt=ndimage.binary_dilation(txt,iterations=4)&ndimage.binary_dilation(sm,iterations=2)
        o8=np.clip(out,0,255).astype(np.uint8); o8=cv2.inpaint(o8,txt.astype(np.uint8),9,cv2.INPAINT_TELEA)
        out=o8.astype(np.float32)
        out[txt]+=cv2.GaussianBlur(np.random.default_rng(n+7).normal(0,1,(H,W)).astype(np.float32),(0,0),.8)[txt][:,None]*2.4
    out=np.clip(out,0,255).astype(np.uint8)
    cv2.imwrite(f'hq{k}.png',out); return out
if __name__=='__main__':
    import sys
    for k in map(int,sys.argv[1:]): run(k); print(k)
