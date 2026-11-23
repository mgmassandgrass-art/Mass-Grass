import cv2, numpy as np
from scipy import ndimage
I='/tmp/claude-0/-home-user-Mass-Grass/3c3a7cf0-a5d3-55d4-bdc2-a4e0bc8d42f0/images/'
P='/tmp/claude-0/-home-user-Mass-Grass/3c3a7cf0-a5d3-55d4-bdc2-a4e0bc8d42f0/scratchpad/pdf27/'
# page corners TL TR BR BL measured on the photographs, and which month goes on each (back to front order)
J={18:[((511,173),(891,173),(890,714),(511,715),1)],
   21:[((544,140),(828,200),(736,744),(461,664),1)],
   19:[((334,194),(668,187),(687,669),(356,676),1),((718,203),(1015,224),(955,717),(662,690),2)],
   20:[((289,211),(580,199),(618,634),(327,646),2),((843,198),(1115,214),(1071,648),(799,625),3),((518,239),(830,239),(829,685),(519,685),1)],
   17:[((899,178),(1086,237),(1005,620),(818,562),3),((657,201),(834,255),(756,648),(580,594),2),((313,252),(581,277),(545,676),(286,653),1)]}
OCC={(17,1):[[(581,268),(592,268),(626,668),(540,700)]],
     (17,0):[[(830,236),(846,236),(934,655),(790,655)]],
     (20,0):[[(516,238),(833,238),(833,748),(516,748)]],(20,1):[[(516,238),(833,238),(833,748),(516,748)]],
     (19,0):[[(662,690),(718,203),(760,203),(760,700)]]}
def qmask(q,H,W,s=8):
    m=np.zeros((H*s,W*s),np.uint8); cv2.fillPoly(m,[np.int32(np.round(np.array(q)*s))],255); return cv2.resize(m,(W,H),interpolation=cv2.INTER_AREA).astype(np.float32)/255
def run(k,months=None,tag=''):
    im=cv2.imread(I+f'{k}.webp'); f=im.astype(np.float32); H,W=f.shape[:2]
    hsv=cv2.cvtColor(im,cv2.COLOR_BGR2HSV); S=hsv[...,1].astype(np.float32); V=hsv[...,2].astype(np.float32)
    out=f.copy()
    Yg,Xg=np.mgrid[0:H,0:W].astype(np.float32)
    # every calendar's rings and punched holes stay as photographed: metal and dark in a band along each top edge
    METAL=np.zeros((H,W),bool)
    for (tl,tr,br,bl,_) in J[k]:
        (x1,y1),(x2,y2)=tl,tr; d=np.abs((Xg-x1)*(y2-y1)-(Yg-y1)*(x2-x1))/np.hypot(x2-x1,y2-y1)
        xs=(Xg>min(tl[0],tr[0])-4)&(Xg<max(tl[0],tr[0])+4)
        wire=(d<16)&xs&(S<45)&(V<185); wire=ndimage.binary_opening(wire,np.ones((3,1)))
        METAL|=wire|((d<16)&xs&(V<90))
    METAL=ndimage.binary_closing(METAL,np.ones((3,3)),iterations=1); METAL=ndimage.binary_dilation(METAL,iterations=1)
    for n,(tl,tr,br,bl,m) in enumerate(J[k]):
        if months: m=months[n]
        q=np.float32([tl,tr,br,bl]); A=qmask(q,H,W)
        inq=A>.5
        # what of the old page is visible: its paper or its coloured head, plus everything enclosed (print), never what crosses its edge (rings, other calendars)
        c=q.mean(0); qg=np.float32([p+(p-c)/np.linalg.norm(p-c)*1.5 for p in q])
        page=qmask(qg,H,W)>.5
        for oc in OCC.get((k,n),[]): page&=~(qmask(np.float32(oc),H,W)>.02)
        # the head colour showing just above the fitted top edge belongs to the page too
        (x1,y1),(x2,y2)=q[0],q[1]
        dist=((Xg-x1)*(y2-y1)-(Yg-y1)*(x2-x1))/np.hypot(x2-x1,y2-y1)
        sgn=np.sign(((c[0]-x1)*(y2-y1)-(c[1]-y1)*(x2-x1)))
        above=(dist*sgn<0)&(dist*sgn>-6)&(qmask(np.float32([q[0]+(q[0]-q[3])*.03,q[1]+(q[1]-q[2])*.03,q[2],q[3]]),H,W)>.5)
        page|=above&(S>60)
        outer=(qmask(qg,H,W)<.5)&(cv2.dilate((qmask(q,H,W)>.5).astype(np.uint8),np.ones((3,3)))>0)
        nearb=np.abs(((Xg-q[3][0])*(q[2][1]-q[3][1])-(Yg-q[3][1])*(q[2][0]-q[3][0]))/np.hypot(*(q[2]-q[3])))<8
        page|=outer&(S>100)&~nearb
        for oc in OCC.get((k,n),[]): page&=~(qmask(np.float32(oc),H,W)>.02)
        page&=~METAL
        vis=cv2.GaussianBlur(page.astype(np.float32),(0,0),.6)*A; cv2.imwrite(f'vis{k}_{n}.png',(vis*255).astype(np.uint8))
        # the paper's light: from the plain cream of the old page, smoothed and carried over its coloured head
        cream=page&(S<40)&(V>120)&(cv2.blur(V,(7,7))-V<6)
        cream=ndimage.binary_erosion(cream,iterations=2)
        Lc=f.mean(2)*cream; w=cream.astype(np.float32)
        def nc(s): return cv2.GaussianBlur(Lc,(0,0),s)/np.maximum(cv2.GaussianBlur(w,(0,0),s),1e-4), cv2.GaussianBlur(w,(0,0),s)
        a1,w1=nc(12); a2,w2=nc(60)
        light=np.where(w1>.05,a1,a2)
        ref=np.percentile(f.mean(2)[cream],96) if cream.sum()>50 else 240
        light=np.clip(light/ref,.35,1.05)
        tint=np.median(f[cream],0); tint=tint/tint.mean(); tint=1+(tint-1)*.35
        # the month, warped onto the page at 4x then area-reduced
        art=cv2.imread(P+f'p{m:02d}.png').astype(np.float32); h,w_=art.shape[:2]; K=4
        M=cv2.getPerspectiveTransform(np.float32([[0,0],[w_,0],[w_,h],[0,h]]),q*K)
        big=cv2.warpPerspective(art,M,(W*K,H*K),flags=cv2.INTER_LINEAR,borderMode=cv2.BORDER_REPLICATE)
        wa=cv2.resize(big,(W,H),interpolation=cv2.INTER_AREA)
        pr=wa*.97*light[...,None]*tint[None,None,:]
        pr=cv2.GaussianBlur(pr,(0,0),.45)
        g=cv2.GaussianBlur(np.random.default_rng(k*10+n).normal(0,1,(H,W)).astype(np.float32),(0,0),.6); pr+=g[...,None]*1.6
        out=out*(1-vis[...,None])+pr*vis[...,None]
        # the base strip under the page: the mockup's own printed text taken off
        e=(bl[0]-tl[0],bl[1]-tl[1]); L=np.hypot(*e); d=np.array(e)/L; hgt=.14*L
        strip=np.float32([bl,br,(br[0]+d[0]*hgt,br[1]+d[1]*hgt),(bl[0]+d[0]*hgt,bl[1]+d[1]*hgt)])
        sm=qmask(strip,H,W)>.5; sm=ndimage.binary_erosion(sm,iterations=3)&~(cv2.dilate(vis,np.ones((11,11)))>.1)
        for oc in OCC.get((k,n),[]): sm&=~(cv2.dilate((qmask(np.float32(oc),H,W)>.02).astype(np.uint8),np.ones((3,3)))>0)
        base=cv2.medianBlur(im,15).astype(np.float32).mean(2)
        txt=sm&(base-f.mean(2)>9); txt=ndimage.binary_dilation(txt,iterations=2)&ndimage.binary_dilation(sm,iterations=1)
        o8=np.clip(out,0,255).astype(np.uint8); o8=cv2.inpaint(o8,txt.astype(np.uint8),6,cv2.INPAINT_TELEA)
        out=o8.astype(np.float32)
        out[txt]+=np.random.default_rng(n).normal(0,2.2,(txt.sum(),1)).astype(np.float32)
    # the punched holes show dark through the old coloured head: keep them, but as shadow, not colour
    hol=METAL&(S>45); g=out.mean(2,keepdims=True)*.85
    out=np.where(hol[...,None],g,out)
    out=np.clip(out,0,255).astype(np.uint8); cv2.imwrite(f'out{k}{tag}.png',out); return out
if __name__=='__main__':
    for k in (18,21,19,20,17): run(k); print(k)
