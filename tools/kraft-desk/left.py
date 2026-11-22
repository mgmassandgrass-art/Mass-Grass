import cv2, numpy as np
H0=cv2.imread('../hero/clean.png'); X0,Y0=300,650
hero=H0[Y0:2150,X0:1600].astype(np.float32); cv2.imwrite('lcrop.png',hero.astype(np.uint8))
src=cv2.imread('../../images/7.jpg')
s=cv2.SIFT_create(6000)
g1=cv2.cvtColor(src[450:1300,350:950],cv2.COLOR_BGR2GRAY); g2=cv2.cvtColor(hero.astype(np.uint8),cv2.COLOR_BGR2GRAY)
k1,d1=s.detectAndCompute(g1,None); k2,d2=s.detectAndCompute(g2,None)
m=cv2.BFMatcher().knnMatch(d1,d2,k=2); good=[a for a,b in m if a.distance<.7*b.distance]
p1=np.float32([k1[a.queryIdx].pt for a in good])+[350,450]; p2=np.float32([k2[a.trainIdx].pt for a in good])
Hm,inl=cv2.findHomography(p1,p2,cv2.RANSAC,3); print(len(good),inl.sum())
QL=np.load('quads.npy')[0]
q=cv2.perspectiveTransform(QL.reshape(-1,1,2).astype(np.float32),Hm).reshape(-1,2); print(q.round(1).tolist())
np.save('lq0.npy',q)
