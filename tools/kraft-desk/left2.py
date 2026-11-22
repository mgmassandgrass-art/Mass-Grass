import cv2, numpy as np
hero=cv2.imread('lcrop.png').astype(np.float32); H,W=hero.shape[:2]
pg=cv2.imread('../pdf27/p01.png').astype(np.float32); ph,pw=pg.shape[:2]
q=np.load('lq0.npy').astype(np.float32); S=np.float32([[0,0],[pw,0],[pw,ph],[0,ph]])
M=cv2.getPerspectiveTransform(S,q).astype(np.float64)
G=lambda x: cv2.GaussianBlur(cv2.cvtColor(x,cv2.COLOR_BGR2GRAY),(0,0),1.5)
for it in range(3):
    w=cv2.warpPerspective(pg,M,(W,H),flags=cv2.INTER_AREA)
    mk=np.zeros((H,W),np.uint8); cq=cv2.perspectiveTransform(S.reshape(-1,1,2),M).reshape(-1,2)
    cv2.fillPoly(mk,[np.int32(cq)],255); mk=cv2.erode(mk,np.ones((41,41),np.uint8)); mk[:int(cq[:2,1].max())+90]=0
    D=np.eye(3,dtype=np.float32)
    cc,D=cv2.findTransformECC(G(w),G(hero),D,cv2.MOTION_HOMOGRAPHY,(cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,300,1e-7),mk,5)
    # hero(D x) ~ w(x)  => hero ~ w(D^-1 y): page->hero = D @ M
    M=D.astype(np.float64)@M; print(it,round(cc,4))
q2=cv2.perspectiveTransform(S.reshape(-1,1,2),M).reshape(-1,2); print(q2.round(1).tolist()); np.save('lM.npy',M)
