exec(open('shadow.py').read().split("over=(a/")[0])
hull=np.load('hull.npy'); hm=np.zeros((H,W),np.uint8); cv2.fillPoly(hm,[hull],255)
img=a.astype(np.uint8)[...,::-1].copy()
gm=np.full((H,W),cv2.GC_BGD,np.uint8)
gm[cv2.dilate(hm,np.ones((41,41)))>0]=cv2.GC_PR_BGD
gm[hm>0]=cv2.GC_PR_FGD
gm[cv2.erode(hm,np.ones((61,61)))>0]=cv2.GC_FGD
bgm=np.zeros((1,65),np.float64); fgm=np.zeros((1,65),np.float64)
cv2.grabCut(img,gm,None,bgm,fgm,6,cv2.GC_INIT_WITH_MASK)
fg=((gm==cv2.GC_FGD)|(gm==cv2.GC_PR_FGD)).astype(np.uint8)
fg=cv2.morphologyEx(fg,cv2.MORPH_OPEN,np.ones((3,3)));
n,l,st,_=cv2.connectedComponentsWithStats(fg); fg=(l==1+np.argmax(st[1:,4])).astype(np.uint8)
np.save('fg.npy',fg)
vis=img.copy(); vis[fg==0]=(vis[fg==0]*.3+np.array([0,0,255])*.7).astype(np.uint8)
cv2.imwrite('cutvis.jpg',cv2.resize(vis,(740,900)))
