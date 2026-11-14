import cv2, numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage
S='/tmp/claude-0/-home-user-Mass-Grass/3c3a7cf0-a5d3-55d4-bdc2-a4e0bc8d42f0/scratchpad/mk/'; A='/home/user/Mass-Grass/web/assets/'

def put(ph, blank, art, quad, keep_dark_top=0, soft=.6, grain=2.0):
    """warp art (RGB float) onto quad (TL,TR,BR,BL) of photo, lit by the blank photo's own light"""
    H,W=ph.shape[:2]; h,w=art.shape[:2]
    M=cv2.getPerspectiveTransform(np.float32([[0,0],[w,0],[w,h],[0,h]]),np.float32(quad))
    wa=cv2.warpPerspective(art,M,(W,H),flags=cv2.INTER_LANCZOS4)
    mask=np.zeros((H*4,W*4),np.uint8); cv2.fillPoly(mask,[np.int32(np.array(quad)*4)],255)
    mask=cv2.resize(mask,(W,H),interpolation=cv2.INTER_AREA).astype(float)/255
    L=blank.mean(2); ins=mask>.99
    ill=ndimage.grey_closing(L,size=(25,25)); ill=ndimage.gaussian_filter(ill,14)
    shade=np.clip(ill/np.percentile(ill[ins],99.3),0,1.03)[...,None]
    wa=ndimage.gaussian_filter(wa,(soft,soft,0))*shade
    wa=wa+np.random.default_rng(3).normal(0,grain,(H,W,1))
    a=mask.copy()
    if keep_dark_top:
        y0=int(min(q[1] for q in quad))-40; band=np.zeros((H,W),bool); band[y0:y0+keep_dark_top]=True
        keep=band&((L<150)|(blank.max(2)-blank.min(2)>40))
        keep=ndimage.binary_dilation(keep,iterations=2).astype(float); keep=ndimage.gaussian_filter(keep,1.0)
        a=a*(1-keep)
    a=a[...,None]
    return ph*(1-a)+wa*a

def load(p): return np.asarray(Image.open(p).convert('RGB')).astype(float)
def save(arr,name):
    im=Image.fromarray(np.clip(arr,0,255).astype('uint8')); im.save(S+name+'.png')
    im.resize((1200,1200),Image.LANCZOS).save(A+name+'.webp',quality=86); print('ok',name)

# 1 · the calendar on the desk: the V2 cover on the standing page, under the wire
cal=load(S+'cal.png'); Q=[(560,358),(1494,362),(1452,1642),(516,1576)]
cover=load('/home/user/Mass-Grass/drafts/calendar-v2/pg-000.jpg')
save(put(cal.copy(),cal,cover,Q,keep_dark_top=110),'sh-cal')

# 2 · two postcards: the back (Farah's note, stamp, postmark) under, the painting on top
pc=load(S+'pc.png')
back=load(S+'pcback.png'); front=load(A+'hero.webp')
BQ=[(252,547),(1224,369),(1334,1047),(362,1225)]
FQ=[(825,730),(1807,891),(1704,1581),(722,1420)]
out=put(pc.copy(),pc,back,BQ)
# the top card casts a soft shadow on the card below
H,W=pc.shape[:2]; sh=np.zeros((H,W),np.uint8); cv2.fillPoly(sh,[np.int32(np.array(FQ)+[-6,10])],255)
sh=ndimage.gaussian_filter(sh.astype(float)/255,10)
fm=np.zeros((H,W),np.uint8); cv2.fillPoly(fm,[np.int32(FQ)],255)
bm=np.zeros((H,W),np.uint8); cv2.fillPoly(bm,[np.int32(BQ)],255)
out=out*(1-.22*(sh*(fm==0)*(bm>0)))[...,None]
out=put(out,pc,front,FQ)
save(out,'sh-pc')

# 3 · the sticker sheet: Farah's stickers printed on one sheet, kiss-cut round each; one already peeled off and lying beside it
sk=load(S+'sk.png'); SQ=[(511,309),(1530,305),(1533,1716),(506,1718)]
SW,SH=2040,2820; sheet=Image.new('RGB',(SW,SH),(250,248,243))
names=['s-lemons','s-pomegranate','s-kaak','s-olives','s-jaffa','s-whale']
cells=[(0,0),(1,0),(0,1),(1,1),(0,2),(1,2)]; cw,ch=SW//2,(SH-260)//3
peel=5   # the whale is off the sheet
outline=Image.new('L',(SW,SH),0); dr=ImageDraw.Draw(sheet)
for n,(cx,cy) in zip(names,cells):
    st=Image.open(A+n+'.webp').convert('RGBA'); s=min((cw-80)/st.width,(ch-60)/st.height); st=st.resize((int(st.width*s),int(st.height*s)),Image.LANCZOS)
    x=cx*cw+(cw-st.width)//2; y=110+cy*ch+(ch-st.height)//2
    al=np.asarray(st.split()[-1])>20
    ring=ndimage.binary_dilation(al,iterations=10)
    cut=ring^ndimage.binary_erosion(ring,iterations=3)
    o=Image.fromarray((cut*255).astype('uint8')); outline.paste(o,(x,y),o)
    if n!=names[peel]: sheet.paste(st,(x,y),st)
    else:
        hole=Image.fromarray((ring*255).astype('uint8')); sheet.paste((243,241,235),(x,y),hole)
sheet.paste((205,200,190),(0,0),outline)
try: f=ImageFont.truetype('/home/user/Mass-Grass/web/fonts/annie-use-your-telescope.ttf',78)
except Exception: f=None
dr.text((SW//2,SH-120),'Mass & Grass  stickers by Farah Al-Helou',fill=(150,90,92),font=f,anchor='mm')
out=put(sk.copy(),sk,np.asarray(sheet).astype(float),SQ,soft=.5)
# the peeled whale on the desk, beside the sheet, with its own shadow
st=Image.open(A+names[peel]+'.webp').convert('RGBA'); st=st.resize((int(st.width*.3),int(st.height*.3)),Image.LANCZOS).rotate(-14,expand=True,resample=Image.BICUBIC)
al=np.asarray(st.split()[-1]).astype(float)/255; px,py=1610,900
Hs,Ws=al.shape; shadow=ndimage.gaussian_filter(np.pad(al,40),9)[40-10:40-10+Hs,40-14:40-14+Ws] if False else ndimage.gaussian_filter(al,8)
reg=out[py+12:py+12+Hs,px+8:px+8+Ws]; reg*=(1-.35*shadow)[...,None]
rgb=np.asarray(st.convert('RGB')).astype(float)*np.clip(sk[py:py+Hs,px:px+Ws].mean(2,keepdims=True)/np.percentile(sk[py:py+Hs,px:px+Ws].mean(2),99)*1.15,0,1.02)
reg=out[py:py+Hs,px:px+Ws]; out[py:py+Hs,px:px+Ws]=reg*(1-al[...,None])+rgb*al[...,None]
save(out,'sh-sk')
