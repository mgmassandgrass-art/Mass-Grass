import cv2, numpy as np
ph=cv2.imread('../../images/7.jpg').astype(np.float32); L=cv2.GaussianBlur(ph.mean(2),(0,0),1.0)
gy,gx=np.gradient(L)
def side(p,q,n_in):
    p=np.array(p,float); q=np.array(q,float); d=q-p; d/=np.linalg.norm(d); n=np.array([-d[1],d[0]])
    if np.dot(n,n_in)<0: n=-n          # n points into the page
    pts=[]
    for t in np.linspace(.06,.94,120):
        c=p+(q-p)*t; best=None
        for s in np.arange(-12,12.01,.25):
            x,y=c+n*s
            g=cv2.getRectSubPix(gx,(1,1),(x,y))[0,0]*n[0]+cv2.getRectSubPix(gy,(1,1),(x,y))[0,0]*n[1]   # brightening into the page
            if best is None or g>best[0]: best=(g,x,y)
        if best[0]>6: pts.append(best[1:])
    pts=np.float32(pts); vx,vy,x0,y0=cv2.fitLine(pts,cv2.DIST_HUBER,0,.01,.01).ravel()
    return (x0,y0,vx,vy),len(pts)
def inter(a,b):
    x1,y1,vx1,vy1=a; x2,y2,vx2,vy2=b
    A=np.array([[vx1,-vx2],[vy1,-vy2]]); t=np.linalg.solve(A,[x2-x1,y2-y1]); return (x1+vx1*t[0], y1+vy1*t[0])
def refine(Q):
    c=np.mean(Q,0); lines=[]
    for i in range(4):
        p,q=Q[i],Q[(i+1)%4]; m=(np.array(p)+np.array(q))/2; l,n=side(p,q,c-m); lines.append(l); print(' side',i,n)
    return [inter(lines[i-1],lines[i]) for i in range(4)]
QL=refine([(447,580),(786,557),(878,1105),(540,1159)])
QR=refine([(1155,539),(1537,550),(1496,1102),(1112,1073)])
print('QL',np.round(QL,1).tolist()); print('QR',np.round(QR,1).tolist())
np.save('quads.npy',np.array([QL,QR]))
