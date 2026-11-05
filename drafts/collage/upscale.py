import sys,torch,torch.nn as nn,torch.nn.functional as F,numpy as np
from PIL import Image
class RDB(nn.Module):
    def __init__(s,nf=64,gc=32):
        super().__init__()
        s.conv1=nn.Conv2d(nf,gc,3,1,1);s.conv2=nn.Conv2d(nf+gc,gc,3,1,1);s.conv3=nn.Conv2d(nf+2*gc,gc,3,1,1);s.conv4=nn.Conv2d(nf+3*gc,gc,3,1,1);s.conv5=nn.Conv2d(nf+4*gc,nf,3,1,1);s.l=nn.LeakyReLU(.2,True)
    def forward(s,x):
        x1=s.l(s.conv1(x));x2=s.l(s.conv2(torch.cat((x,x1),1)));x3=s.l(s.conv3(torch.cat((x,x1,x2),1)));x4=s.l(s.conv4(torch.cat((x,x1,x2,x3),1)));x5=s.conv5(torch.cat((x,x1,x2,x3,x4),1))
        return x5*.2+x
class RRDB(nn.Module):
    def __init__(s,nf=64):
        super().__init__();s.rdb1=RDB(nf);s.rdb2=RDB(nf);s.rdb3=RDB(nf)
    def forward(s,x):return s.rdb3(s.rdb2(s.rdb1(x)))*.2+x
class Net(nn.Module):
    def __init__(s,nf=64,nb=23):
        super().__init__();s.conv_first=nn.Conv2d(3,nf,3,1,1);s.body=nn.Sequential(*[RRDB(nf) for _ in range(nb)]);s.conv_body=nn.Conv2d(nf,nf,3,1,1)
        s.conv_up1=nn.Conv2d(nf,nf,3,1,1);s.conv_up2=nn.Conv2d(nf,nf,3,1,1);s.conv_hr=nn.Conv2d(nf,nf,3,1,1);s.conv_last=nn.Conv2d(nf,3,3,1,1);s.l=nn.LeakyReLU(.2,True)
    def forward(s,x):
        f=s.conv_first(x);f=f+s.conv_body(s.body(f))
        f=s.l(s.conv_up1(F.interpolate(f,scale_factor=2,mode='nearest')));f=s.l(s.conv_up2(F.interpolate(f,scale_factor=2,mode='nearest')))
        return s.conv_last(s.l(s.conv_hr(f)))
torch.set_num_threads(max(1,torch.get_num_threads()))
m=Net();sd=torch.load(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'x4.pth'),map_location='cpu');m.load_state_dict(sd.get('params_ema',sd.get('params',sd)));m.eval()
src,dst,lw,lh,ow,oh=sys.argv[1],sys.argv[2],*map(int,sys.argv[3:7])
im=Image.open(src).convert('RGB').resize((lw,lh),Image.LANCZOS);a=torch.from_numpy(np.asarray(im).astype(np.float32)/255).permute(2,0,1)[None]
T,P=256,16;out=torch.zeros(1,3,lh*4,lw*4)
with torch.no_grad():
    for y in range(0,lh,T):
        for x in range(0,lw,T):
            y0,x0=max(0,y-P),max(0,x-P);y1,x1=min(lh,y+T+P),min(lw,x+T+P)
            r=m(a[:,:,y0:y1,x0:x1]).clamp(0,1)
            ty,tx=(y-y0)*4,(x-x0)*4;hh,ww=(min(lh,y+T)-y)*4,(min(lw,x+T)-x)*4
            out[:,:,y*4:y*4+hh,x*4:x*4+ww]=r[:,:,ty:ty+hh,tx:tx+ww]
        print(src,y,lh,flush=True)
o=Image.fromarray((out[0].permute(1,2,0).numpy()*255+.5).astype(np.uint8)).resize((ow,oh),Image.LANCZOS);o.save(dst)
