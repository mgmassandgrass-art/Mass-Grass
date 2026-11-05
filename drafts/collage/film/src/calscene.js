/* Mass & Grass · the 2027 calendar in real photographs.
   MGCal.flip(el, opts): pages turn up and over the wire (a WebGL sheet that bends as it rises, its shadow on the page below).
   MGCal.tear(el, opts): pull a page down and it tears off the wire and falls; scraps stay caught in the coils.
   opts: {room, top, box:[x,y,w,h] (fractions of the room photo), pages:[urls], alt:[...], onchange(i)}.
   Every page is printed into the photo with multiply, so it takes the photo's own light; the moving sheet is baked
   with that same light, so nothing jumps when a page starts or stops moving. */
(function(){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const RM=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const tween=(ms,f,ease)=>new Promise(res=>{const t0=performance.now();const step=t=>{const k=clamp((t-t0)/ms,0,1);f(ease?ease(k):k);k<1?requestAnimationFrame(step):res()};requestAnimationFrame(step)});
const loadImg=src=>new Promise((res,rej)=>{const i=new Image();i.decoding='async';i.onload=()=>res(i);i.onerror=rej;i.src=src});

function scene(el,o){
  el.classList.add('cs');el.innerHTML='';
  const room=document.createElement('img');room.className='cs-room';room.src=o.room;room.alt=o.roomAlt||'';room.decoding='async';
  const page=document.createElement('div');page.className='cs-page';
  const [bx,by,bw,bh]=o.box;Object.assign(page.style,{left:bx*100+'%',top:by*100+'%',width:bw*100+'%',height:bh*100+'%'});
  const cur=document.createElement('img'),nxt=document.createElement('img');cur.className='cs-p';nxt.className='cs-p';nxt.style.visibility='hidden';
  page.append(nxt,cur);
  const top=document.createElement('img');top.className='cs-top';top.src=o.top;top.alt='';top.decoding='async';
  el.append(room,page,top);
  return {room,page,cur,nxt,top};
}
/* the page as it looks in the photo: the room's blank page multiplied by the print (for the moving sheet) */
async function baked(roomImg,box,src,w,h){
  const [bx,by,bw,bh]=box,c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
  const R=roomImg.naturalWidth,H=roomImg.naturalHeight;
  x.drawImage(roomImg,bx*R,by*H,bw*R,bh*H,0,0,w,h);
  if(src){const im=await loadImg(src);x.globalCompositeOperation='multiply';const a=im.width/im.height,ba=w/h;let sw=im.width,sh=im.height,sx=0,sy=0;
    if(a>ba){sw=im.height*ba;sx=(im.width-sw)/2}else{sh=im.width/ba;sy=(im.height-sh)/2}x.drawImage(im,sx,sy,sw,sh,0,0,w,h);x.globalCompositeOperation='source-over'}
  return c}
function setImg(img,src,alt){img.src=src;img.alt=alt||''}

/* ---------- turning pages ---------- */
function flip(el,o){
  const s=scene(el,o),N=o.pages.length;let i=0,busy=false;
  setImg(s.cur,o.pages[0],o.alt&&o.alt[0]);
  const glc=document.createElement('canvas');glc.className='cs-gl';s.page.append(glc);
  let gl=null;try{gl=glc.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:true,depth:true})}catch(e){}
  const sheet=gl?makeSheet(gl,glc):null;
  let W=0,Hp=0;
  const size=()=>{const r=s.page.getBoundingClientRect();W=r.width;Hp=r.height;if(sheet)sheet.size(W,Hp)};
  new ResizeObserver(size).observe(s.page);
  async function turn(d){
    const n=i+d;if(busy||n<0||n>=N)return;busy=true;size();
    const dpr=Math.min(2,devicePixelRatio||1),tw=Math.round(W*dpr),th=Math.round(Hp*dpr);
    await s.room.decode().catch(()=>{});
    if(sheet&&!RM()){
      const goingUp=d>0;
      const face=await baked(s.room,o.box,o.pages[goingUp?i:n],tw,th),back=await baked(s.room,o.box,null,tw,th);
      sheet.load(face,back);
      setImg(s.nxt,o.pages[goingUp?n:i]);await s.nxt.decode().catch(()=>{});s.nxt.style.visibility='visible';
      s.cur.style.visibility='hidden';glc.classList.add('on');
      const from=goingUp?0:2*Math.PI,to=goingUp?2*Math.PI:0;sheet.draw(from);
      await tween(goingUp?1100:1000,k=>sheet.draw(from+(to-from)*k),goingUp?(k=>.35*k+.65*(1-Math.cos(Math.PI*k))/2):(k=>k<.8?Math.pow(k/.8,2):1-Math.sin((k-.8)/.2*Math.PI)*.025));
      glc.classList.remove('on');
    }
    i=n;setImg(s.cur,o.pages[i],o.alt&&o.alt[i]);await s.cur.decode().catch(()=>{});s.cur.style.visibility='';s.nxt.style.visibility='hidden';
    busy=false;o.onchange&&o.onchange(i);
    if(o.pages[i+1]){const p=new Image();p.src=o.pages[i+1]}
  }
  /* drag up on the page to lift it, or click it */
  let y0=null;
  s.page.addEventListener('pointerdown',e=>{y0=e.clientY});
  s.page.addEventListener('pointerup',e=>{if(y0==null)return;const dy=e.clientY-y0;y0=null;if(dy>40)turn(-1);else turn(1)});
  return {next:()=>turn(1),prev:()=>turn(-1),go:async k=>{while(i<k)await turn(1);while(i>k)await turn(-1)},get i(){return i},N};
}
function makeSheet(gl,glc){
  const VS=`attribute vec3 p;attribute vec3 n;attribute vec2 uv;attribute float a;
    uniform vec2 page;uniform vec4 box;uniform float D;uniform float eye;
    varying vec2 vUv;varying vec3 vN;varying float vA;varying vec2 vP;
    void main(){float k=D/(D-p.z);vec2 s=vec2(page.x*.5+(p.x-page.x*.5)*k,eye+(p.y-eye)*k);vec2 c=(s-box.xy)/box.zw;
      gl_Position=vec4(c.x*2.-1.,1.-c.y*2.,-p.z/5000.,1.);vUv=uv;vN=n;vA=a;vP=p.xy;}`;
  const FS=`precision mediump float;uniform sampler2D front,back;uniform int mode;uniform vec3 L;uniform vec2 pageF;
    varying vec2 vUv;varying vec3 vN;varying float vA;varying vec2 vP;
    void main(){if(mode==1){if(vP.x<0.||vP.x>pageF.x||vP.y<0.||vP.y>pageF.y)discard;gl_FragColor=vec4(0.,0.,0.,1.)*vA;return;}
      if(mode==2){gl_FragColor=vec4(0.);return;}
      vec3 nn=normalize(vN);if(!gl_FrontFacing)nn=-nn;float d=clamp(dot(nn,L)/L.z,0.,1.4);
      float sh=mix(.8,1.,clamp(d,0.,1.))+.06*clamp(d-1.,0.,.4);
      vec3 c=gl_FrontFacing?texture2D(front,vUv).rgb:texture2D(back,vec2(1.-vUv.x,vUv.y)).rgb;gl_FragColor=vec4(c*sh,1.);}`;
  const sh=(t,src)=>{const o=gl.createShader(t);gl.shaderSource(o,src);gl.compileShader(o);return o};
  const prog=gl.createProgram();gl.attachShader(prog,sh(gl.VERTEX_SHADER,VS));gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS))return null;gl.useProgram(prog);
  const U=n=>gl.getUniformLocation(prog,n),A=n=>gl.getAttribLocation(prog,n);
  const NX=30,NY=72,NV=(NX+1)*(NY+1),DIST=7,EYE=.45;
  const P=new Float32Array(NV*3),Nn=new Float32Array(NV*3),UV=new Float32Array(NV*2),AL=new Float32Array(NV),SP=new Float32Array(NV*3),SA=new Float32Array(NV);
  for(let i=0;i<=NY;i++)for(let j=0;j<=NX;j++){const v=i*(NX+1)+j;UV[v*2]=j/NX;UV[v*2+1]=i/NY;AL[v]=1}
  const idx=[];for(let i=0;i<NY;i++)for(let j=0;j<NX;j++){const v=i*(NX+1)+j;idx.push(v,v+NX+1,v+1,v+1,v+NX+1,v+NX+2)}
  const IB=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,IB);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(idx),gl.STATIC_DRAW);
  const buf=()=>gl.createBuffer(),bP=buf(),bN=buf(),bUV=buf(),bA=buf(),bSP=buf(),bSA=buf(),bQ=buf();
  gl.bindBuffer(gl.ARRAY_BUFFER,bUV);gl.bufferData(gl.ARRAY_BUFFER,UV,gl.STATIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,bA);gl.bufferData(gl.ARRAY_BUFFER,AL,gl.STATIC_DRAW);
  const attr=(b,name,size)=>{const l=A(name);if(l<0)return;gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,size,gl.FLOAT,false,0,0)};
  const tex=()=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);[gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T].forEach(k=>gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE));
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);return t};
  const tF=tex(),tB=tex();gl.uniform1i(U('front'),0);gl.uniform1i(U('back'),1);
  const Lv=[.12,-.5,1],Ll=Math.hypot(...Lv);gl.uniform3f(U('L'),Lv[0]/Ll,Lv[1]/Ll,Lv[2]/Ll);
  let pw=1,ph=1,dpr=1;const MX=.14,MT=1.3,MB=.08;
  function size(w,h){pw=w;ph=h;dpr=Math.min(2,devicePixelRatio||1);const box=[-pw*MX,-ph*MT,pw*(1+2*MX),ph*(MT+1+MB)];
    Object.assign(glc.style,{left:box[0]+'px',top:box[1]+'px',width:box[2]+'px',height:box[3]+'px'});
    glc.width=Math.round(box[2]*dpr);glc.height=Math.round(box[3]*dpr);gl.viewport(0,0,glc.width,glc.height);
    gl.uniform2f(U('page'),pw,ph);gl.uniform2f(U('pageF'),pw,ph);gl.uniform4f(U('box'),...box);gl.uniform1f(U('D'),pw*DIST);gl.uniform1f(U('eye'),ph*EYE);
    gl.bindBuffer(gl.ARRAY_BUFFER,bQ);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,-1.5,pw,0,-1.5,0,ph,-1.5,pw,ph,-1.5]),gl.STATIC_DRAW)}
  function load(face,back){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tF);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,face);
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,tB);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,back)}
  function build(an){const H=ph,Wd=pw,ds=H/NY,r=pw*.012,half=Math.sin(clamp(an,0,2*Math.PI)/2),sag=-1.05*half;
    for(let j=0;j<=NX;j++){let y=-r*Math.sin(an/2),z=-r+r*Math.cos(an/2);const x=j/NX*Wd;
      for(let i=0;i<=NY;i++){const v=i*(NX+1)+j;P[v*3]=x;P[v*3+1]=y;P[v*3+2]=z;const th=an+sag*Math.pow((i+.5)/NY,1.3);y+=Math.cos(th)*ds;z+=Math.sin(th)*ds}}
    for(let i=0;i<=NY;i++)for(let j=0;j<=NX;j++){const v=i*(NX+1)+j,vx=i*(NX+1)+Math.min(NX,j+1),vX=i*(NX+1)+Math.max(0,j-1),vy=Math.min(NY,i+1)*(NX+1)+j,vY=Math.max(0,i-1)*(NX+1)+j;
      const ax=P[vx*3]-P[vX*3],ay=P[vx*3+1]-P[vX*3+1],az=P[vx*3+2]-P[vX*3+2],bx=P[vy*3]-P[vY*3],by=P[vy*3+1]-P[vY*3+1],bz=P[vy*3+2]-P[vY*3+2];
      let nx=ay*bz-az*by,ny=az*bx-ax*bz,nz=ax*by-ay*bx;const l=Math.hypot(nx,ny,nz)||1;Nn[v*3]=nx/l;Nn[v*3+1]=ny/l;Nn[v*3+2]=nz/l;
      const pz=P[v*3+2];SP[v*3]=P[v*3];SP[v*3+1]=P[v*3+1]+Math.max(0,pz)*.55;SP[v*3+2]=-.5;
      const edge=Math.min(1,j/NX/.1,(NX-j)/NX/.1,(NY-i)/NY/.12);SA[v]=pz>.5?.32*edge*clamp(1-pz/(H*.6),0,1)*clamp(pz/12,0,1):0}}
  function draw(an){build(an);gl.clearColor(0,0,0,0);gl.clearDepth(1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);const mode=U('mode');
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.colorMask(false,false,false,false);gl.uniform1i(mode,2);attr(bQ,'p',3);attr(bN,'n',3);attr(bUV,'uv',2);attr(bA,'a',1);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);gl.colorMask(true,true,true,true);
    gl.disable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.bindBuffer(gl.ARRAY_BUFFER,bSP);gl.bufferData(gl.ARRAY_BUFFER,SP,gl.DYNAMIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,bSA);gl.bufferData(gl.ARRAY_BUFFER,SA,gl.DYNAMIC_DRAW);
    gl.uniform1i(mode,1);attr(bSP,'p',3);attr(bSA,'a',1);gl.drawElements(gl.TRIANGLES,idx.length,gl.UNSIGNED_SHORT,0);gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);gl.bindBuffer(gl.ARRAY_BUFFER,bP);gl.bufferData(gl.ARRAY_BUFFER,P,gl.DYNAMIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,bN);gl.bufferData(gl.ARRAY_BUFFER,Nn,gl.DYNAMIC_DRAW);
    gl.uniform1i(mode,0);attr(bP,'p',3);attr(bN,'n',3);attr(bA,'a',1);gl.drawElements(gl.TRIANGLES,idx.length,gl.UNSIGNED_SHORT,0)}
  /* where a point on the bottom edge (u across, 0..1) shows on screen for angle an, in page pixels */
  function tip(an,u){const H=ph,ds=H/NY,r=pw*.012,half=Math.sin(clamp(an,0,2*Math.PI)/2),sag=-1.05*half;let y=-r*Math.sin(an/2),z=-r+r*Math.cos(an/2);
    for(let i=0;i<NY;i++){const th=an+sag*Math.pow((i+.5)/NY,1.3);y+=Math.cos(th)*ds;z+=Math.sin(th)*ds}
    const D=pw*DIST,E=ph*EYE,k=D/(D-z);return [pw*.5+(u*pw-pw*.5)*k,E+(y-E)*k,z]}
  return {size,load,draw,tip};
}

/* ---------- tearing pages off ---------- */
function rng(seed){return()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646}}
/* a ragged line just under the wire: the same line cuts the page that falls and the scraps that stay */
function tearLine(w,y,seed){const r=rng(seed),pts=[];let yy=y;for(let x=0;x<=w;x+=w/90){yy=clamp(yy+(r()-.5)*w*.006,y-w*.008,y+w*.012);pts.push([x,yy+(r()-.5)*w*.004])}return pts}
function tear(el,o){
  const s=scene(el,o),N=o.pages.length;let i=0,busy=false,seed=7;
  setImg(s.cur,o.pages[0],o.alt&&o.alt[0]);
  const scraps=document.createElement('canvas');scraps.className='cs-scraps';s.page.append(scraps);
  const fall=document.createElement('canvas');fall.className='cs-fall';s.page.append(fall);
  let W=0,H=0;const lineY=()=>H*.045;
  const size=()=>{const r=s.page.getBoundingClientRect();W=r.width;H=r.height};new ResizeObserver(size).observe(s.page);
  let piece=null;
  async function prepare(){size();const dpr=Math.min(2,devicePixelRatio||1);await s.room.decode().catch(()=>{});
    const pg=await baked(s.room,o.box,o.pages[i],Math.round(W*dpr),Math.round(H*dpr));
    const line=tearLine(W,lineY(),seed++);
    /* the page below the tear */
    fall.width=pg.width;fall.height=pg.height;Object.assign(fall.style,{left:0,top:0,width:W+'px',height:H+'px'});
    const x=fall.getContext('2d');x.save();x.scale(dpr,dpr);x.beginPath();x.moveTo(0,H);x.lineTo(0,line[0][1]);line.forEach(p=>x.lineTo(p[0],p[1]));x.lineTo(W,H);x.closePath();x.clip();
    x.drawImage(pg,0,0,W,H);
    /* the torn fibres along the edge: a thin lighter rim */
    x.strokeStyle='rgba(255,253,248,.85)';x.lineWidth=1.6;x.beginPath();line.forEach((p,k)=>k?x.lineTo(p[0],p[1]+.8):x.moveTo(p[0],p[1]+.8));x.stroke();x.restore();
    /* what stays in the coils */
    scraps.width=pg.width;scraps.height=Math.round(H*.1*dpr);Object.assign(scraps.style,{left:0,top:0,width:W+'px',height:H*.1+'px'});
    const y=scraps.getContext('2d');y.save();y.scale(dpr,dpr);y.beginPath();y.moveTo(0,0);y.lineTo(W,0);for(let k=line.length-1;k>=0;k--)y.lineTo(line[k][0],line[k][1]);y.closePath();y.clip();y.drawImage(pg,0,0,W,H);y.restore();
    if(o.pages[i+1]){setImg(s.nxt,o.pages[i+1]);await s.nxt.decode().catch(()=>{})}
    piece={line}}
  async function rip(vx,vy,rot0){
    if(!piece)return;busy=true;s.nxt.style.visibility=o.pages[i+1]?'visible':'hidden';s.cur.style.visibility='hidden';fall.classList.add('on');scraps.classList.add('on');
    if(!RM()){const g=H*3.2,t0=performance.now(),rv=(vx>0?1:-1)*(.6+Math.random()*.6);let x=0,y=0,r=rot0||0,dx=vx*60,dy=Math.max(vy*60,H*.2);
      await new Promise(res=>{const step=t=>{const dt=Math.min(.033,(t-(step.l||t))/1000);step.l=t;dy+=g*dt;x+=dx*dt;y+=dy*dt;r+=rv*dt*60;
        fall.style.transform=`translate(${x}px,${y}px) rotate(${r}deg)`;fall.style.opacity=clamp(1-(y-H*.6)/(H*1.4),0,1);
        (y<H*2.2&&t-t0<2600)?requestAnimationFrame(step):res()};requestAnimationFrame(step)})}
    fall.classList.remove('on');fall.style.transform='';fall.style.opacity='';
    if(i<N-1){i++;setImg(s.cur,o.pages[i],o.alt&&o.alt[i]);await s.cur.decode().catch(()=>{});s.cur.style.visibility='';s.nxt.style.visibility='hidden'}
    else{s.cur.style.visibility='hidden';s.nxt.style.visibility='hidden';el.classList.add('cs-empty')}
    piece=null;busy=false;o.onchange&&o.onchange(i,i>=N-1&&el.classList.contains('cs-empty'))}
  /* pull the page down: it hinges at the corner you did not hold and tears when you pull far enough */
  let drag=null;
  s.page.addEventListener('pointerdown',async e=>{if(busy||el.classList.contains('cs-empty'))return;e.preventDefault();s.page.setPointerCapture(e.pointerId);
    const r=s.page.getBoundingClientRect();drag={x0:e.clientX,y0:e.clientY,side:(e.clientX-r.left)<r.width/2?-1:1,t:performance.now(),lx:e.clientX,ly:e.clientY,vx:0,vy:0,ready:false};
    await prepare();if(!drag)return;drag.ready=true;fall.classList.add('on');scraps.classList.add('on');s.cur.style.visibility='hidden';s.nxt.style.visibility=o.pages[i+1]?'visible':'hidden'});
  s.page.addEventListener('pointermove',e=>{if(!drag||!drag.ready)return;const dy=Math.max(0,e.clientY-drag.y0),dx=e.clientX-drag.x0,now=performance.now();
    drag.vx=(e.clientX-drag.lx)/Math.max(8,now-drag.t);drag.vy=(e.clientY-drag.ly)/Math.max(8,now-drag.t);drag.lx=e.clientX;drag.ly=e.clientY;drag.t=now;
    const rot=clamp((dy*.06+dx*.03)*drag.side,-16,16);fall.style.transformOrigin=drag.side>0?'0 0':'100% 0';fall.style.transform=`translate(${dx*.15}px,${dy*.35}px) rotate(${rot}deg)`;drag.rot=rot;
    if(dy>H*.28){const d=drag;drag=null;rip(d.vx*16||dx*.02,d.vy*16||4,rot)}});
  const end=()=>{if(!drag)return;const d=drag;drag=null;if(!d.ready)return;
    if(Math.abs(d.vy)>.8||Math.abs(d.vx)>1.2){rip(d.vx*16,d.vy*16,d.rot);return}
    /* not far enough: the page settles back */
    tween(260,k=>{fall.style.transform=`translate(0,0) rotate(${(d.rot||0)*(1-k)}deg)`}).then(()=>{fall.classList.remove('on');scraps.classList.remove('on');fall.style.transform='';s.cur.style.visibility='';s.nxt.style.visibility='hidden'})};
  s.page.addEventListener('pointerup',end);s.page.addEventListener('pointercancel',end);
  return {tear:async()=>{if(busy||el.classList.contains('cs-empty'))return;await prepare();await rip(1.5,3,4)},
    reset:()=>{i=0;el.classList.remove('cs-empty');setImg(s.cur,o.pages[0],o.alt&&o.alt[0]);s.cur.style.visibility='';scraps.classList.remove('on');o.onchange&&o.onchange(0,false)},get i(){return i},N};
}
window.MGCal={flip,tear,sheet:makeSheet,baked};
})();
