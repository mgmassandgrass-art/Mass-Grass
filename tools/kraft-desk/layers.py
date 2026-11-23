# The desk calendar split in two layers so it sits on any page colour with no seam:
#  shadow layer = the photograph divided by its own backdrop (backdrop -> white), shown with mix-blend-mode:multiply;
#  object layer = the calendar and its stand only, cut out with a feathered edge.
exec(open('shadow.py').read().split("over=(a/")[0])
from PIL import ImageFilter
hull=np.load('hull.npy'); hm=np.zeros((H,W),np.uint8); cv2.fillPoly(hm,[hull],255); hm=hm>0
diff=np.abs(a-bg).max(2)
alpha=hm.astype(np.float32)
top=hull[:,0,1].min()+60
ring=np.zeros((H,W),bool); ring[:top]=True
alpha[ring]*=np.clip((diff[ring]-4)/10,0,1)          # between the coils the backdrop shows: let it through
alpha=cv2.GaussianBlur(alpha,(0,0),.8)
shadow=np.clip(a/np.maximum(bg,1),0,1)
L_=cv2.GaussianBlur(shadow.mean(2),(0,0),3)                  # shadows are soft: take the photo's grain out of them
L_=np.clip((L_-.955)/(1-.955),0,1)*(1-L_)*0+np.where(L_>.975,1.0,np.where(L_<.93,L_,.93+(L_-.93)*(1-.93)/(.975-.93)))
shadow=np.repeat(L_[...,None],3,2).astype(np.float32)
shadow=shadow*(1-alpha[...,None])+alpha[...,None]     # under the object: white (the object covers it)
edge=np.ones((H,W),np.float32); m=60
ramp=lambda n: np.clip(np.arange(n)/m,0,1)
edge*=np.minimum(ramp(W),ramp(W)[::-1])[None,:]; edge*=np.minimum(ramp(H),ramp(H)[::-1])[:,None]
shadow=1-(1-shadow)*edge[...,None]
A='/home/user/Mass-Grass/web/assets/'
Image.fromarray((shadow*255).astype(np.uint8)).save(A+'cdm-shadow.webp',quality=88)
obj=Image.fromarray(a.astype(np.uint8)).filter(ImageFilter.UnsharpMask(2,45,0)); obj.putalpha(Image.fromarray((alpha*255).astype(np.uint8)))
obj.save(A+'cdm-base.webp',quality=90,alpha_quality=100,method=6)
for mm in range(1,13):
    im=Image.open(f'P{mm:02d}.png').convert('RGBA'); rgb=im.convert('RGB').filter(ImageFilter.UnsharpMask(2,45,0)); rgb.putalpha(im.getchannel('A'))
    rgb.save(A+f'cdp-{mm:02d}.webp',quality=90,alpha_quality=100,method=6)
print('ok')
