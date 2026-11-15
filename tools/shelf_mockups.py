import cv2, numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage
import os, sys
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))+'/'   # the repository
A=R+'web/assets/'; BL=R+'drafts/mockups/shelves/'                    # the site's images; the blank photographs (2048 px)
S=os.environ.get('MK_SCRATCH','/tmp/mk/'); os.makedirs(S,exist_ok=True)  # full-size outputs and other working files
# which photographs to make: python3 tools/shelf_mockups.py sk [cal] [pc]  (pc needs S+'pcback.png', the rendered card back)
PARTS=set(sys.argv[1:]) or {'cal','pc','sk'}

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
if 'cal' in PARTS:
  cal=load(BL+'blank-cal.webp'); Q=[(560,358),(1494,362),(1452,1642),(516,1576)]
  cover=load(R+'drafts/calendar-v2/pg-000.jpg')
  save(put(cal.copy(),cal,cover,Q,keep_dark_top=110),'sh-cal')

# 2 · two postcards: the back (Farah's note, stamp, postmark) under, the painting on top
if 'pc' in PARTS:
  pc=load(BL+'blank-pc.webp')
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

# 3 · the sticker sheet: Farah's stickers printed on one sheet, kiss-cut round each; one already peeled off and lying beside it,
#     the same size as the hole it left (the art on its white backing, cut along the same line)
if 'sk' in PARTS:
  sk=load(BL+'blank-sk.webp'); SQ=[(511,309),(1530,305),(1533,1716),(506,1718)]
  SW,SH=2040,2820; sheet=Image.new('RGB',(SW,SH),(250,248,243))
  names=['s-lemons','s-pomegranate','s-kaak','s-olives','s-jaffa','s-whale']
  cells=[(0,0),(1,0),(0,1),(1,1),(0,2),(1,2)]; cw,ch=SW//2,(SH-260)//3
  peel=5   # the bike ride is off the sheet
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
      # the piece that came off: the backing inside the cut line, with the art on it
      piece=Image.new('RGBA',st.size,(250,248,243,0)); piece.paste((250,248,243,255),(0,0),hole); piece.alpha_composite(st)
  sheet.paste((205,200,190),(0,0),outline)
  try: f=ImageFont.truetype(R+'web/fonts/annie-use-your-telescope.ttf',78)
  except Exception: f=None
  dr.text((SW//2,SH-120),'Mass & Grass  stickers by Farah Al-Helou',fill=(150,90,92),font=f,anchor='mm')
  out=put(sk.copy(),sk,np.asarray(sheet).astype(float),SQ,soft=.5)
  # the peeled sticker on the desk beside the sheet, at the sheet's own scale, with its own shadow
  k=(SQ[1][0]-SQ[0][0])/SW
  st=piece.resize((int(piece.width*k),int(piece.height*k)),Image.LANCZOS).rotate(-14,expand=True,resample=Image.BICUBIC)
  al=np.asarray(st.split()[-1]).astype(float)/255; Hs,Ws=al.shape; px,py=2048-Ws-14,740
  shadow=ndimage.gaussian_filter(al,8)
  reg=out[py+12:py+12+Hs,px+8:px+8+Ws]; reg*=(1-.35*shadow[:reg.shape[0],:reg.shape[1]])[...,None]
  # the window light across the desk, without the wood's grain: the sticker is lit as the sheet beside it is
  lit=ndimage.gaussian_filter(sk.mean(2),40)[py:py+Hs,px:px+Ws]; lit=lit/ndimage.gaussian_filter(sk.mean(2),40)[SQ[0][1]:SQ[2][1],SQ[0][0]:SQ[1][0]].max()
  rgb=np.asarray(st.convert('RGB')).astype(float)*np.clip(.82+.3*lit,0,1.02)[...,None]
  reg=out[py:py+Hs,px:px+Ws]; out[py:py+Hs,px:px+Ws]=reg*(1-al[...,None])+rgb*al[...,None]
  save(out,'sh-sk')
