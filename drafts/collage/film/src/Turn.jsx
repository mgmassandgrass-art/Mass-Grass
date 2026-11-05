/* One page turn of "Things kept in bottles", filmed on a bright wall:
   a hand comes in from the right, pinches the bottom corner, lifts the page up and over the wire,
   lets go, and the page falls behind the calendar. The page is a WebGL sheet (calscene.js) lit like the photo. */
import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {AbsoluteFill,Img,interpolate,Easing,useCurrentFrame,staticFile,delayRender,continueRender,random} from 'remotion';
import './calscene.js';

/* the photo window: a 1920x1080 crop of wall.jpg (2560x1440), drawn at 1440x810 */

const PAPER='rgb(239,233,217)';
/* the four hand photos (same hand), their pinch point (fraction of the image) and size */
const HANDS=[{k:'h0',w:1440,h:728,px:.035,py:.245,arm:0},{k:'h1',w:1350,h:662,px:.035,py:.385,arm:0},{k:'h2',w:1447,h:1387,px:.04,py:.085,arm:42},{k:'h3',w:1093,h:2194,px:.13,py:.025,arm:72}];

const ease=Easing.bezier(.45,0,.25,1);

const load=src=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src});
async function pageTex(art,shade,w,h,back){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
  x.fillStyle=PAPER;x.fillRect(0,0,w,h);
  if(back){x.save();x.globalAlpha=.07;x.translate(w,0);x.scale(-1,1);}
  const a=art.width/art.height;let dw=w,dh=w/a;if(dh>h){dh=h;dw=h*a}x.drawImage(art,(w-dw)/2,(h-dh)/2,dw,dh);
  if(back)x.restore();
  x.globalCompositeOperation='multiply';x.globalAlpha=back?.75:.8;x.drawImage(shade,0,0,w,h);
  if(back){x.globalAlpha=1;x.fillStyle='rgb(226,218,200)';x.fillRect(0,0,w,h);const g=x.createRadialGradient(w/2,h/2,h*.2,w/2,h/2,w*.75);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(185,172,150,1)');x.fillStyle=g;x.fillRect(0,0,w,h)}
  return c}

export const Turn=({from,to,crop,outW})=>{
  const CROP=crop||{x:320,y:60,w:1920,h:1080},S=(outW||1440)/CROP.w;
  const BOX={x:(960-CROP.x)*S,y:(350-CROP.y)*S,w:640*S,h:477*S},HS=.6*S/.75;
  const f=useCurrentFrame();
  const pageRef=useRef(null),glRef=useRef(null),sheet=useRef(null);
  const [ready,setReady]=useState(false);
  const [handle]=useState(()=>delayRender('textures'));
  useEffect(()=>{(async()=>{
    const [a,sh]=await Promise.all([load(staticFile(`${from}.webp`)),load(staticFile('shade.png'))]);
    const gl=glRef.current.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:true,depth:true,preserveDrawingBuffer:true});
    const s=window.MGCal.sheet(gl,glRef.current);s.size(BOX.w,BOX.h);
    s.load(await pageTex(a,sh,1400,1043,false),await pageTex(a,sh,1400,1043,true));sheet.current=s;setReady(true);continueRender(handle)})()},[]);

  /* the angle of the page at the wire, 0 (hanging) to 2π (hanging behind) */
  const lift=interpolate(f,[15,34],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:ease});
  const fall=interpolate(f,[34,44],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.in(Easing.quad)});
  const ang=f<34?lift*1.12*Math.PI:(1.12+.88*fall)*Math.PI;
  useLayoutEffect(()=>{if(ready&&sheet.current)sheet.current.draw(Math.min(ang,2*Math.PI-1e-4))},[ready,ang]);

  /* where the hand is: coming in, then on the corner it holds, then away */
  /* the arm turns as the page rises: 0deg (forearm level, from the right) to about 74deg (forearm hanging, the hand reaching up) */
  const arm=f<15?0:interpolate(lift,[0,.15,1],[0,4,74]);
  let hx,hy,op=1;
  const tip=ready&&sheet.current?sheet.current.tip(Math.min(ang,1.12*Math.PI),.965):[BOX.w*.965,BOX.h];
  const cx=BOX.x+tip[0],cy=BOX.y+tip[1];
  if(f<14){const k=interpolate(f,[0,14],[0,1],{extrapolateRight:'clamp',easing:Easing.out(Easing.cubic)});hx=cx+(1-k)*560*S/.75;hy=cy+(1-k)*90*S/.75-Math.sin(k*Math.PI)*14}
  else if(f<34){hx=cx;hy=cy}
  else{const k=interpolate(f,[34,46],[0,1],{extrapolateRight:'clamp',easing:Easing.in(Easing.cubic)});hx=cx+k*380*S/.75;hy=cy-k*120*S/.75;op=1-k}
  /* which photo: the open hand, then the pinch; while lifting, the photo whose arm is closest to the arm's angle (a two-frame swap) */
  const w=[0,0,0,0];
  if(f<11)w[0]=1;else if(f<14){const k=(f-11)/3;w[0]=1-k;w[1]=k}
  else{const sw=(a0,a1,i0,i1)=>{const m=(a0+a1)/2,k=Math.min(1,Math.max(0,(arm-(m-3))/6));w[i0]=1-k;w[i1]=k};
    if(arm<21)w[1]=1,sw(0,42,1,2);else if(arm<57)sw(0,42,1,2),w[2]>=1&&sw(42,72,2,3);else sw(42,72,2,3)}
  const rotOf=i=>arm-HANDS[i].arm+(f<14?(1-f/14)*6:0);
  const grainSeed=Math.floor(random(`g${f}`)*1000);
  return (<AbsoluteFill style={{background:'#f2ede4',overflow:'hidden'}}>
    <Img src={staticFile('wall.jpg')} style={{position:'absolute',left:-CROP.x*S,top:-CROP.y*S,width:2560*S,height:1440*S}}/>
    {/* the next page, under the one being turned */}
    <div style={{position:'absolute',left:BOX.x,top:BOX.y,width:BOX.w,height:BOX.h,background:PAPER}}>
      <Img src={staticFile(`${to}.webp`)} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'contain'}}/>
      <Img src={staticFile('shade.png')} style={{position:'absolute',inset:0,width:'100%',height:'100%',mixBlendMode:'multiply',opacity:.8}}/>
    </div>
    <div ref={pageRef} style={{position:'absolute',left:BOX.x,top:BOX.y,width:BOX.w,height:BOX.h}}>
      <canvas ref={glRef} style={{position:'absolute'}}/>
    </div>
    {/* the wire over the pages */}
    <Img src={staticFile('wire.png')} style={{position:'absolute',left:-CROP.x*S,top:-CROP.y*S,width:2560*S,height:1440*S}}/>
    {/* the hand */}
    {HANDS.map((h,i)=>w[i]>0&&<Img key={h.k} src={staticFile(`${h.k}.png`)} style={{position:'absolute',left:0,top:0,width:h.w*HS,height:h.h*HS,opacity:w[i]*op,
      transformOrigin:`${h.px*100}% ${h.py*100}%`,transform:`translate(${hx-h.px*h.w*HS}px,${hy-h.py*h.h*HS}px) rotate(${rotOf(i)}deg)`,
      filter:'drop-shadow(-22px 26px 20px rgba(70,52,30,.26)) drop-shadow(-3px 4px 3px rgba(70,52,30,.18))'}}/>)}
    {/* film: soft vignette and grain so everything sits in one photograph */}
    <AbsoluteFill style={{background:'radial-gradient(ellipse at 50% 45%,transparent 55%,rgba(60,45,25,.10))',pointerEvents:'none'}}/>
    <AbsoluteFill style={{opacity:.07,mixBlendMode:'overlay',pointerEvents:'none'}}>
      <svg width="100%" height="100%"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed={grainSeed}/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>
    </AbsoluteFill>
  </AbsoluteFill>);
};
