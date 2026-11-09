/* Stickers: a sheet of Farah's stickers, a table to try them on real things (drawn on a canvas, wrapped around the bottle),
   and the grid where a pack is put together. */
(function(){
'use strict';
let AR=MG.ar;
const T=(en,ar)=>AR?ar:en,$=id=>document.getElementById(id);
/* the stickers: [image, cut, EN, AR] — die-cut drawings, and round or square stickers from paintings */
const P=MG.products('sticker').map(p=>[p.id,(p.extra&&p.extra.shape)||'die',p.title_en,p.title_ar||p.title_en,MG.thumb(p.id,p)]),src=k=>(P.find(p=>p[0]===k)||[])[4]||('assets/'+k+'.webp');
const stk=k=>{const s=P.find(p=>p[0]===k);return s[1]==='die'?`<span class="stk die"><img src="${src(k)}" alt="" draggable="false" loading="lazy"></span>`:`<span class="stk ${s[1]}"><i><img src="${src(k)}" alt="" draggable="false" loading="lazy"></i></span>`};
const price=n=>{const pk=S.price('pack'),one=S.price('sticker');return Math.floor(n/6)*pk+(n%6>3?pk:(n%6)*one)};
const pack=new Set();const S={price:MG.price,fmt:MG.fmt,toast:MG.toast,BAG:{stickers:a=>MG.bag.stickers(a)}};
/* the sheet in the intro */
const SH=[['s-lemons',15,4,4,-6],['s-fishers',22,24,30,4],['s-olives',22,30,2,-3],['s-kaak',17,6,50,5],['s-pomegranate',22,54,22,-4],['s-jaffa',20,34,60,6],['s-cactus',24,74,2,-5],['s-family',25,70,58,3]].filter(s=>P.some(p=>p[0]===s[0]));
function sheet(){$('sheet').innerHTML=SH.map(([k,w,x,y,r])=>`<button type="button" class="s" style="--w:${w}%;--x:${x}%;--y:${y}%;--r:${r}deg" data-k="${k}" aria-label="${name(k)}">${stk(k)}</button>`).join('')}
const name=k=>{const s=P.find(p=>p[0]===k);return AR?s[3]:s[2]};
$('sheet').addEventListener('click',e=>{const b=e.target.closest('.s');if(!b)return;toggle(b.dataset.k)});
/* try them on things: real photos; stickers are drawn on a canvas, flat on the laptop, notebook and phone,
   and wrapped around the bottle (each column of the sticker follows the curve, with the bottle's light on it) */
const OBJ=[{k:'laptop',n:['Laptop','حاسوب محمول'],r:[.13,.15,.75,.70],s:.2},{k:'notebook',n:['Notebook','دفتر'],r:[.275,.05,.395,.905],s:.24},
  {k:'bottle',n:['Water bottle','قارورة ماء'],r:[.41,.27,.182,.62],s:.46,cyl:true},{k:'phone',n:['Phone','هاتف'],r:[.35,.25,.31,.665],s:.3}];
let oi=0,placed=[],sel=-1;const cv=$('skc'),cx=cv.getContext('2d'),sprites={};
function sprite(k,cb){if(sprites[k])return cb(sprites[k]);const s=P.find(p=>p[0]===k),im=new Image();im.onload=()=>{const S=420,c=document.createElement('canvas'),x=c.getContext('2d');
  if(s[1]==='die'){const r=im.width/im.height;c.width=r>=1?S:Math.round(S*r);c.height=r>=1?Math.round(S/r):S;x.drawImage(im,0,0,c.width,c.height)}
  else{const ar=s[1]==='round'?1:.8;c.width=Math.round(S*ar);c.height=S;const b=Math.round(S*.05);x.fillStyle='#fff';x.beginPath();
    if(s[1]==='round')x.arc(c.width/2,c.height/2,c.width/2,0,7);else x.roundRect(0,0,c.width,c.height,S*.08);x.fill();
    x.save();x.beginPath();if(s[1]==='round')x.arc(c.width/2,c.height/2,c.width/2-b,0,7);else x.roundRect(b,b,c.width-2*b,c.height-2*b,S*.05);x.clip();
    const iw=c.width-2*b,ih=c.height-2*b,sc=Math.max(iw/im.width,ih/im.height);x.drawImage(im,b+(iw-im.width*sc)/2,b+(ih-im.height*sc)/2,im.width*sc,im.height*sc);x.restore()}
  sprites[k]=c;cb(c)};im.src=src(k)}
function size(){const r=cv.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);cv.width=Math.round(r.width*d);cv.height=Math.round(r.height*d);paintAll()}
new ResizeObserver(size).observe($('stage'));
function geom(p){const o=OBJ[oi],W=cv.width,H=cv.height,[rx,ry,rw,rh]=o.r,sp=sprites[p.k];const base=o.s*p.z*rw*W,tw=base*Math.min(1,sp.width/sp.height*1.15),th=tw*sp.height/sp.width;return{W,H,rx:rx*W,ry:ry*H,rw:rw*W,rh:rh*H,tw,th,x:p.u*W,y:p.v*H}}
function paintAll(){const W=cv.width,H=cv.height;cx.clearRect(0,0,W,H);const o=OBJ[oi];
  placed.forEach(p=>{const sp=sprites[p.k];if(!sp)return;const g=geom(p);
    const L=document.createElement('canvas');L.width=W;L.height=H;const l=L.getContext('2d');
    l.save();l.beginPath();l.roundRect(g.rx,g.ry,g.rw,g.rh,o.cyl?0:Math.min(g.rw,g.rh)*.03);l.clip();
    if(!o.cyl){l.translate(g.x,g.y);l.rotate(p.r);l.drawImage(sp,-g.tw/2,-g.th/2,g.tw,g.th)}
    else{/* wrap around the cylinder: flat distance d from the bottle's middle becomes angle d/R */
      const R=g.rw/2,c0=g.rx+R,n=Math.ceil(g.tw);for(let j=0;j<n;j++){const d=(g.x-c0)+(j-g.tw/2),t1=d/R,t2=(d+1)/R;if(Math.abs(t1)>1.45)continue;
        const x1=c0+R*Math.sin(t1),x2=c0+R*Math.sin(t2);l.drawImage(sp,j/g.tw*sp.width,0,Math.max(1,sp.width/g.tw),sp.height,x1,g.y-g.th/2,Math.max(.6,x2-x1+.4),g.th)}
      /* the bottle's light: brighter on the left, falling off to both sides */
      l.globalCompositeOperation='source-atop';const gr=l.createLinearGradient(g.rx,0,g.rx+g.rw,0);
      gr.addColorStop(0,'rgba(20,24,18,.55)');gr.addColorStop(.18,'rgba(20,24,18,.12)');gr.addColorStop(.36,'rgba(255,255,250,.10)');gr.addColorStop(.6,'rgba(20,24,18,.06)');gr.addColorStop(.86,'rgba(20,24,18,.32)');gr.addColorStop(1,'rgba(20,24,18,.6)');
      l.fillStyle=gr;l.fillRect(g.rx,g.ry,g.rw,g.rh)}
    l.restore();
    cx.save();cx.shadowColor='rgba(30,24,16,.28)';cx.shadowBlur=W*.004;cx.shadowOffsetY=W*.0015;cx.drawImage(L,0,0);cx.restore()});
  if(sel>=0&&placed[sel]){const p=placed[sel],g=geom(p),o2=OBJ[oi];cx.save();cx.translate(g.x,g.y);if(!o2.cyl)cx.rotate(p.r);
    cx.setLineDash([W*.006,W*.005]);cx.lineWidth=Math.max(1.5,W*.0016);cx.strokeStyle='rgba(34,32,28,.75)';cx.strokeRect(-g.tw/2-6,-g.th/2-6,g.tw+12,g.th+12);
    cx.setLineDash([]);cx.fillStyle='#FBF8F2';cx.beginPath();cx.arc(g.tw/2+6,-g.th/2-6,W*.011,0,7);cx.fill();cx.stroke();cx.restore()}
  $('ctl').hidden=sel<0;const rb=$('ctl').querySelectorAll('[data-a=left],[data-a=right]');rb.forEach(b=>b.disabled=!!OBJ[oi].cyl);
  }
function handlePos(p){const g=geom(p),o=OBJ[oi],a=o.cyl?0:p.r,hx=g.tw/2+6,hy=-g.th/2-6;return[g.x+hx*Math.cos(a)-hy*Math.sin(a),g.y+hx*Math.sin(a)+hy*Math.cos(a)]}
function objs(){$('objs').innerHTML=OBJ.map((o,i)=>`<button type="button" role="tab" aria-selected="${i===oi}" data-i="${i}">${AR?o.n[1]:o.n[0]}</button>`).join('');
  $('tray').innerHTML=P.map(p=>`<button type="button" data-k="${p[0]}" aria-label="${AR?p[3]:p[2]}">${stk(p[0])}</button>`).join('')}
$('objs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;oi=+b.dataset.i;$('obj').src=`assets/sk-${OBJ[oi].k}.webp`;placed=[];sel=-1;objs();paintAll()});
function place(k,at){const o=OBJ[oi],[rx,ry,rw,rh]=o.r;sprite(k,()=>{const n=placed.length;let u,v;
    if(at){u=Math.min(rx+rw,Math.max(rx,at[0]));v=Math.min(ry+rh,Math.max(ry,at[1]))}else{const SL=[[.3,.28],[.72,.3],[.5,.55],[.26,.74],[.74,.74],[.52,.2],[.3,.52],[.7,.52],[.5,.84]],sl=SL[n%SL.length];u=rx+rw*(o.cyl?.5+(sl[0]-.5)*.5:sl[0]);v=ry+rh*sl[1]}
    if(o.cyl&&!at){const CV=[.16,.4,.64,.86,.28,.52,.76];v=ry+rh*CV[n%CV.length];u=rx+rw*.5}
    const q={k,u,v,z:P.find(p=>p[0]===k)[1]==='die'?1.1:1,r:o.cyl?0:((n%5)-2)*.07};placed.push(q);
    /* keep the whole sticker on the object */
    const g=geom(q),hw=g.tw/2/g.W*1.04,hh=g.th/2/g.H*1.04;q.u=Math.min(rx+rw-hw,Math.max(rx+hw,q.u));q.v=Math.min(ry+rh-hh,Math.max(ry+hh,q.v));
    sel=placed.length-1;paintAll()})}
let td=null,ghost=null,dragged=false;
$('tray').addEventListener('pointerdown',e=>{const b=e.target.closest('button');if(!b)return;td={k:b.dataset.k,x:e.clientX,y:e.clientY,b};dragged=false;b.setPointerCapture(e.pointerId)});
$('tray').addEventListener('pointermove',e=>{if(!td)return;if(!dragged&&Math.hypot(e.clientX-td.x,e.clientY-td.y)>6){dragged=true;ghost=document.createElement('div');ghost.className='ghost';ghost.innerHTML=stk(td.k);ghost.style.width=td.b.offsetWidth*1.5+'px';document.body.append(ghost)}
  if(ghost){ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px'}});
$('tray').addEventListener('pointerup',e=>{if(!td)return;const k=td.k;td=null;if(ghost){ghost.remove();ghost=null}
  if(dragged){const r=cv.getBoundingClientRect();if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)place(k,[(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height])}else place(k)});
$('tray').addEventListener('pointercancel',()=>{td=null;if(ghost){ghost.remove();ghost=null}});
$('tray').addEventListener('keydown',e=>{const b=e.target.closest('button');if(b&&(e.key==='Enter'||e.key===' ')){e.preventDefault();place(b.dataset.k)}});
const ptc=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height]};
function hit(u,v){for(let i=placed.length-1;i>=0;i--){const p=placed[i],g=geom(p);if(Math.abs(u*g.W-g.x)<g.tw/2&&Math.abs(v*g.H-g.y)<g.th/2)return i}return -1}
let drag=null,lastTap=0;
cv.addEventListener('pointerdown',e=>{const [u,v]=ptc(e);
  /* the corner dot of the selected sticker: drag it to resize and turn */
  if(sel>=0&&placed[sel]){const p=placed[sel],[hx,hy]=handlePos(p),g=geom(p);if(Math.hypot(u*g.W-hx,v*g.H-hy)<g.W*.03){const a0=Math.atan2(v*g.H-g.y,u*g.W-g.x),d0=Math.hypot(v*g.H-g.y,u*g.W-g.x);
    drag={mode:'rs',p,a0,d0,r0:p.r,z0:p.z};cv.setPointerCapture(e.pointerId);return}}
  const i=hit(u,v);if(i<0){sel=-1;paintAll();return}const p=placed.splice(i,1)[0];placed.push(p);sel=placed.length-1;drag={p,du:u-p.u,dv:v-p.v};cv.setPointerCapture(e.pointerId);cv.classList.add('drag');paintAll()});
cv.addEventListener('pointermove',e=>{if(!drag)return;const [u,v]=ptc(e),[rx,ry,rw,rh]=OBJ[oi].r;
  if(drag.mode==='rs'){const g=geom(drag.p),a=Math.atan2(v*g.H-g.y,u*g.W-g.x),d=Math.hypot(v*g.H-g.y,u*g.W-g.x);drag.p.z=Math.min(2.6,Math.max(.35,drag.z0*d/drag.d0));if(!OBJ[oi].cyl)drag.p.r=drag.r0+(a-drag.a0);paintAll();return}
  drag.p.u=Math.min(rx+rw,Math.max(rx,u-drag.du));drag.p.v=Math.min(ry+rh,Math.max(ry,v-drag.dv));paintAll()});
cv.addEventListener('wheel',e=>{if(sel<0)return;const [u,v]=ptc(e);if(hit(u,v)!==sel)return;e.preventDefault();const p=placed[sel];if(e.shiftKey&&!OBJ[oi].cyl)p.r+=e.deltaY>0?.08:-.08;else p.z=Math.min(2.6,Math.max(.35,p.z*(e.deltaY>0?.93:1.07)));paintAll()},{passive:false});
$('ctl').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||sel<0)return;const p=placed[sel],a=b.dataset.a;
  if(a==='smaller')p.z=Math.max(.35,p.z*.88);if(a==='bigger')p.z=Math.min(2.6,p.z*1.14);if(a==='left')p.r-=Math.PI/24;if(a==='right')p.r+=Math.PI/24;if(a==='remove'){placed.splice(sel,1);sel=-1}paintAll()});
addEventListener('keydown',e=>{if(sel<0||e.target.matches('input,textarea'))return;if(e.key==='Delete'||e.key==='Backspace'){placed.splice(sel,1);sel=-1;paintAll()}});
const endD=()=>{drag=null;cv.classList.remove('drag')};cv.addEventListener('pointerup',endD);cv.addEventListener('pointercancel',endD);
cv.addEventListener('dblclick',e=>{const [u,v]=ptc(e),i=hit(u,v);if(i>=0){placed.splice(i,1);sel=-1;paintAll()}});
$('clear').onclick=()=>{placed=[];sel=-1;paintAll()};
$('usePack').onclick=()=>{placed.forEach(p=>pack.add(p.k));sync();$('grid').scrollIntoView({behavior:'smooth'})};
/* all the stickers, and the pack */
function toggle(k){pack.has(k)?pack.delete(k):pack.add(k);sync()}
function sync(){$('grid').querySelectorAll('.sc').forEach(b=>{const on=pack.has(b.dataset.k);b.setAttribute('aria-pressed',on);b.querySelector('.chk').textContent=on?'✓':'+'});
  const n=pack.size;$('packbar').hidden=!n;$('pbS').innerHTML=[...pack].map(stk).join('');$('pbN').textContent=n+' '+T(n===1?'sticker':'stickers',n===1?'ملصق':'ملصقات');
  $('pbP').textContent=', '+S.fmt(price(n))+(n%6&&n>0?(AR?'، ':', ')+T(`${6-n%6} more for the next pack`,`أضيفوا ${6-n%6} لتكتمل المجموعة`):'');
  $('pbAdd').textContent=T('Add to bag ('+S.fmt(price(n))+')','أضيفوها إلى السلة ('+S.fmt(price(n))+')');
  MG.tear()}
$('grid').addEventListener('click',e=>{const b=e.target.closest('.sc');if(b)toggle(b.dataset.k)});
$('pbClear').onclick=()=>{pack.clear();sync()};
$('pbAdd').onclick=()=>{S.BAG.stickers([...pack]);S.toast(T('Your stickers are in the bag.','أُضيفت الملصقات إلى السلة.'));$('pbAdd').textContent=T('Added to your bag','أُضيفت إلى السلة');pack.clear();setTimeout(sync,1100)};
function render(){sheet();objs();$('grid').innerHTML=P.map(p=>`<button type="button" class="sc" data-k="${p[0]}" aria-pressed="false" aria-label="${AR?p[3]:p[2]}"><span class="pad">${stk(p[0])}</span><span class="chk" aria-hidden="true">+</span><span class="cap"><b class="nm">${AR?p[3]:p[2]}</b><span class="pr">${S.fmt(S.price('sticker',p[0]))}</span></span></button>`).join('');sync();}
MG.page(function(why){AR=MG.ar;if(why==='bag'||why==='user')return;render();paintAll()});
})();
