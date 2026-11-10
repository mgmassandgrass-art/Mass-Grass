/* Postcards: the envelope that hands out cards, the desk where a card is written, stamped and sealed into a link,
   every card with the places it is shown, and the card someone receives. */
(function(){
'use strict';
let AR=MG.ar,torn;const draw=()=>MG.tear();

/* the fifteen postcards */
const PLACE={hero:['Al-Mawasi','المواصي'],blueflowers:['Beit Lahia','بيت لاهيا'],waves:['Gaza beach','بحر غزة'],boatman:['Gaza port','ميناء غزة'],house:['Az-Zawayda','الزوايدة'],dovegirl:['Deir al-Balah','دير البلح'],hill:['Khan Younis','خان يونس'],boattop:['Gaza port','ميناء غزة'],alley:['Old City','البلدة القديمة'],sparklers:['Gaza City','مدينة غزة'],guitar:['Tel al-Hawa','تل الهوا']};
const P=MG.products('postcard').map(p=>[p.id,p.title_en,p.title_ar||p.title_en,(p.place_en&&p.place_en!=='Gaza'?p.place_en:(PLACE[p.id]||['Gaza'])[0]),(p.place_ar&&p.place_ar!=='غزة'?p.place_ar:(PLACE[p.id]||['','غزة'])[1]),MG.img(p.id,p),MG.thumb(p.id,p)]);
/* stamps: the Gaza stamp, and stamps cut from Farah's paintings */
const STAMPS=[{real:'stamp-gaza'},{img:'pmoon'},{img:'seafish'},{img:'snowglobe'},{img:'pflower'},{img:'sparklers'},{img:'pelephant'}];
const stampHTML=i=>{const s=STAMPS[i]||STAMPS[0];return s.real?`<span class="stamp real"><img src="assets/${s.real}.webp" alt=""></span>`:`<span class="stamp"><i style="background-image:url(assets/t-${s.img}.webp)"></i><b><span>GAZA</span><em>M&amp;G</em></b></span>`};
/* the places a card can be shown: on a table, pinned to a board, on a shelf, in a hand */
const MK={"pc-hands":{"w":1536,"h":1152,"x":0.1725,"y":0.1641,"ww":0.6628,"wh":0.5842,"occ":true,"side":"front"},"pc-read":{"w":1536,"h":1152,"x":0.4128,"y":0.2891,"ww":0.345,"wh":0.2925,"occ":true,"side":"back"},"pc-sea":{"w":1536,"h":1152,"x":0.2279,"y":0.2708,"ww":0.543,"wh":0.4384,"occ":true,"side":"front"},"pc-desk":{"w":1536,"h":1152,"x":0.3112,"y":0.3247,"ww":0.3978,"wh":0.3472,"occ":true,"side":"back"},"pcp-window":{"w": 1536, "h": 1920, "x": 0.2168, "y": 0.1391, "ww": 0.5462, "wh": 0.663, "clip": "0.00% 0.47%,99.05% 0.00%,100.00% 99.92%,0.83% 100.00%", "occ": true, "side": "front", "o": "p"},"pcp-table":{"w": 1536, "h": 1152, "x": 0.321, "y": 0.1597, "ww": 0.3561, "wh": 0.6571, "occ": true, "side": "front", "o": "p"}};const MKK=Object.keys(MK);
const MKN={'pc-hands':['In hand','في اليد'],'pc-read':['Being read','وهي تُقرأ'],'pc-sea':['By the sea','أمام البحر'],'pc-desk':['On the table','على الطاولة'],'pcp-window':['By the window','عند النافذة'],'pcp-table':['In both hands','بين اليدين']};
/* the back of a card as it arrives: Farah's note, a stamp and the Gaza postmark */
function backHTML(i){const p=P[i];return `<div class="fc back still"><div class="msg${AR?' ar':''}">${T('From Gaza, with love.\nThinking of you.','من غزة، مع المحبة.\nأفكر فيكم.')}<span class="from">— ${T('Farah','فرح')}</span></div><div class="addr"><span class="stampbox">${stampHTML(i%STAMPS.length)}</span><span class="pm on">GAZA<br>${today()}<br>✶</span><span class="to${AR?' ar':''}">${T('To you, wherever you are','إليكم، أينما كنتم')}</span><i></i><i></i><i></i></div><span class="cap2">${AR?p[2]:p[1]}, ${T('Farah Al-Helou, Gaza','فرح الحلو، غزة')}</span></div>`}
/* every card is cut to its painting's shape, and the painting is printed edge to edge (nothing cropped, no white border) */
const DIM=window.MG_ART||{},pa=k=>DIM[k]?DIM[k][0]/DIM[k][1]:1.4;
/* a card in a 3:2 slot: as wide as the slot when landscape, as tall as it when upright */
function cardBox(el,k){const a=pa(k);el.style.setProperty('--a',a);el.classList.toggle('pt',a<1);el.style.aspectRatio=a;el.style.width=a>=1.5?'100%':(100*a/1.5)+'%';el.style.marginInline='auto'}
function envCard(el,k){const a=pa(k),w=Math.min(88,58.7*a);el.style.left=el.style.right=((100-w)/2)+'%';el.style.aspectRatio=a}
/* photographed scenes: the card in the photo is landscape, so its front only carries landscape paintings */
const faceW=k=>pa(k)<1.5?`width:${100*pa(k)/1.5}%;margin-inline:auto`:'';
const scenesFor=k=>MKK.filter(m=>MK[m].side==='back'||(MK[m].o==='p'?pa(k)<1.15:pa(k)>=1.15));
function sceneHTML(key,k){const m=MK[k],i=Math.max(0,P.findIndex(p=>p[0]===key)),pos=`left:${m.x*100}%;top:${m.y*100}%;width:${m.ww*100}%;height:${m.wh*100}%`;const ins=.004,ipos=`left:${(m.x+m.ww*ins)*100}%;top:${(m.y+m.wh*ins)*100}%;width:${m.ww*(1-ins*2)*100}%;height:${m.wh*(1-ins*2)*100}%`;
  return `<div class="scene" style="--ar:${m.w/m.h}"><img class="room" src="assets/${k}.webp" alt="">${m.side==='back'?`<div class="bk" style="${pos}">${backHTML(i)}</div>`:`<img class="art" src="assets/${key}.webp" alt="" style="${m.clip?pos+`;clip-path:polygon(${m.clip})`:ipos}">`}${m.occ?`<img class="top" src="assets/${k}-top.webp" alt="">`:''}</div>`}
const $=id=>document.getElementById(id),T=(en,ar)=>AR?ar:en;const SH={fmt:MG.fmt,price:MG.price,toast:MG.toast,BAG:{has:(k,id)=>MG.bag.has(k,id),toggle:(k,id)=>MG.bag.toggle(k,id)}};

/* 1 · the envelope in the intro hands out one card after another */
const ienv=$('ienv');let ii=0,itimer=0;
function nextCard(){ienv.classList.remove('up');setTimeout(()=>{ii=(ii+1)%P.length;$('iimg').src=P[ii][5];$('iimg').alt=P[ii][1];envCard($('icard'),P[ii][0]);requestAnimationFrame(()=>ienv.classList.add('up'))},700)}
function loopIntro(){clearInterval(itimer);if(!matchMedia('(prefers-reduced-motion: reduce)').matches)itimer=setInterval(nextCard,4200)}
envCard($('icard'),P[0][0]);setTimeout(()=>ienv.classList.add('up'),500);loopIntro();ienv.onclick=()=>{nextCard();loopIntro()};

/* 2 · the desk */
const S={c:0,s:0,back:false,sent:false};const card=$('card3'),dst=$('dst'),toIn=$('toIn'),msgIn=$('msgIn'),fromIn=$('fromIn');
const isAr=s=>/[؀-ۿ]/.test(s);
const today=()=>{const d=new Date();return String(d.getDate()).padStart(2,'0')+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+d.getFullYear()};
function flip(b){S.back=b;card.classList.toggle('back-on',b);$('flipT').textContent=b?T('Show the front','اعرضوا الوجه'):T('Show the back','اعرضوا الظهر')}
function paint(){const p=P[S.c];$('dimg').src=p[5];$('dimg').alt=p[1];cardBox(card,p[0]);
  const m=msgIn.value,f=fromIn.value,mo=$('msgOut');mo.className='msg'+(isAr(m+f)?' ar':'');mo.innerHTML='';
  if(m||f){mo.textContent=m;if(f){const s=document.createElement('span');s.className='from';s.textContent='— '+f;mo.append(s)}}
  mo.dataset.empty=T('Dear…\nyour message appears here, in handwriting.','عزيزي…\nتظهر رسالتكم هنا بخط اليد.');
  const to=$('toOut');to.textContent=toIn.value;to.className='to'+(isAr(toIn.value)?' ar':'');
  $('stampOut').innerHTML=stampHTML(S.s);$('pmd').textContent=today();$('capOut').textContent=(AR?p[2]:p[1])+(AR?'، ':', ')+T('Farah Al-Helou, Gaza','فرح الحلو، غزة')}
function pickers(){$('thumbs').innerHTML=P.map((p,i)=>`<button type="button" data-i="${i}" aria-pressed="${i===S.c}" aria-label="${AR?p[2]:p[1]}"><img src="${p[6]}" alt="" loading="lazy"></button>`).join('');
  $('stamps').innerHTML=STAMPS.map((s,i)=>`<button type="button" data-i="${i}" aria-pressed="${i===S.s}" aria-label="${T('Stamp','طابع')} ${i+1}">${stampHTML(i)}</button>`).join('')}
$('thumbs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;reset();S.c=+b.dataset.i;pickers();flip(false);paint()});
$('stamps').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;reset();S.s=+b.dataset.i;pickers();flip(true);paint()});
[toIn,msgIn,fromIn].forEach(el=>{el.addEventListener('focus',()=>{if(!S.sent)flip(true)});el.addEventListener('input',()=>{reset();paint()})});
$('dflip').onclick=()=>flip(!S.back);card.onclick=()=>{if(!S.sent)flip(!S.back)};
function reset(){if(!S.sent)return;S.sent=false;dst.classList.remove('env-on','in','sealing');$('efront').classList.remove('shut');$('seal').classList.remove('on');$('pm').classList.remove('on');$('desk').classList.remove('done');$('share').hidden=true}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
/* the card carries itself in the link: painting, stamp and words */
const enc=o=>btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const dec=s=>JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/')))));
$('send').onclick=async()=>{if(S.sent)return;S.sent=true;flip(true);await wait(500);$('pm').classList.add('on');await wait(700);
  flip(false);await wait(700);$('desk').classList.add('done');dst.classList.add('env-on');await wait(800);dst.classList.add('in');await wait(900);
  dst.classList.add('sealing');$('efront').classList.add('shut');await wait(800);$('seal').classList.add('on');
  const url=location.href.split('#')[0]+'#card='+enc({c:P[S.c][0],s:S.s,m:msgIn.value,t:toIn.value,f:fromIn.value});
  const txt=T('A postcard from Gaza for you','بطاقة بريدية من غزة لكم')+(toIn.value?(AR?'، ':', ')+toIn.value:'');
  $('sWa').href='https://wa.me/?text='+encodeURIComponent(txt+'\n'+url);$('sMail').href='mailto:?subject='+encodeURIComponent(txt)+'&body='+encodeURIComponent(txt+'\n\n'+url);$('sCopy').dataset.url=url;
  $('share').hidden=false;MG.tear()};
$('sCopy').onclick=async()=>{try{await navigator.clipboard.writeText($('sCopy').dataset.url);$('copyT').textContent=T('Copied','تم النسخ')}catch(e){prompt(T('Copy the link','انسخوا الرابط'),$('sCopy').dataset.url)}};
$('again').onclick=()=>{msgIn.value='';toIn.value='';reset();flip(false);paint()};

/* 3 · all the cards */
const grid=$('cards2'),view=$('view');let vi=0,vmode='card';
function render(){pickers();paint();flip(S.back);
  grid.innerHTML=P.map((p,i)=>`<a class="pk" href="#${p[0]}" data-i="${i}" aria-label="${AR?p[2]:p[1]}"><div class="face" style="${faceW(p[0])}"><img src="${p[6]}" alt="${p[1]}, postcard of a watercolour by Farah Al-Helou" loading="lazy" style="aspect-ratio:${pa(p[0])}"><div class="mk" aria-hidden="true">${sceneHTML(p[0],scenesFor(p[0])[i%scenesFor(p[0]).length])}</div></div>
  <div class="cap"><div><h3>${AR?p[2]:p[1]}</h3><span class="where">${AR?p[4]:p[3]}</span></div><span class="pr">${SH.fmt(SH.price('postcard',p[0]))}</span></div></a>`).join('')}
grid.addEventListener('click',e=>{const a=e.target.closest('.pk');if(!a)return;e.preventDefault();vmode='card';open_(+a.dataset.i)});
$('vtabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;vmode=b.dataset.v;open_(vi)});
function printBlock(kind,id){const pr=MG.printOf(kind,id);if(!pr)return '';const z=pr.size?MG.L(pr.size):'',sh=Object.values(MG.shipping);
  return `${MG.printBtn(kind,id,'add')}<p class="pnote">${z?MG.esc(z)+MG.t('. ','. '):''}${sh.length?MG.t('Shipped to ','نشحنها إلى ')+sh.map(c=>MG.L(c.name)).join(MG.t(' and ',' و')):MG.t('Shipping opens soon.','الشحن قريبًا.')}</p>`}
function open_(i){vi=(i+P.length)%P.length;const p=P[vi];
  if(vmode!=='card'&&!scenesFor(p[0]).includes(vmode))vmode='card';
  $('vtabs').innerHTML=[['card',T('The card','البطاقة')],...scenesFor(p[0]).map(k=>[k,AR?MKN[k][1]:MKN[k][0]])].map(([v,l])=>`<button type="button" data-v="${v}" aria-pressed="${v===vmode}">${l}</button>`).join('');
  $('vbig').innerHTML=vmode==='card'?`<div class="pk" style="rotate:0deg;translate:none;pointer-events:none"><div class="face" style="${faceW(p[0])}"><img src="${p[5]}" alt="${p[1]}" style="aspect-ratio:${pa(p[0])}"></div></div>`:`<div class="mkv">${sceneHTML(p[0],vmode)}</div>`;
  $('v-h').textContent=AR?p[2]:p[1];$('vwhere').textContent=(AR?p[4]:p[3])+(AR?'، ':', ')+T('postcard','بطاقة بريدية');$('vprint').innerHTML=printBlock('postcard',p[0]);
  const b=$('vadd'),inb=SH.BAG.has('postcard',p[0]),pr=SH.fmt(SH.price('postcard',p[0]));b.textContent=inb?T('In your bag','في السلة'):(MG.isFree('postcard',p[0])?T('Free download','حمّلوها مجانًا'):T(`Add to bag (${pr})`,`أضيفوها إلى السلة (${pr})`));
  if(!view.open){view.showModal();MG.tear()}}
$('vadd').onclick=()=>{const p=P[vi];if(MG.isFree('postcard',p[0])&&!MG.bag.has('postcard',p[0])){MG.bag.add('postcard',p[0]);location.href='checkout.html';return}if(SH.BAG.toggle('postcard',p[0],p[1],p[2]))SH.toast(T('The postcard is in your bag.','أُضيفت البطاقة إلى السلة.'));};
$('vwrite').onclick=()=>{S.c=vi;view.close();reset();pickers();flip(false);paint();$('write').scrollIntoView({behavior:'smooth'})};
$('vnext').onclick=()=>open_(vi+1);$('vprev').onclick=()=>open_(vi-1);$('vx').onclick=()=>view.close();
view.addEventListener('click',e=>{if(e.target===view)view.close()});
addEventListener('keydown',e=>{if(!view.open||e.target.matches('input,textarea'))return;if(e.key==='ArrowRight')open_(vi+(AR?-1:1));if(e.key==='ArrowLeft')open_(vi-(AR?-1:1))});

/* someone opened a card sent to them */
function receive(){const m=location.hash.match(/card=([\w-]+)/);if(!m)return;let o;try{o=dec(m[1])}catch(e){return}
  const p=P.find(x=>x[0]===o.c)||P[o.c]||P[0];$('recv').hidden=false;$('rimg').src=p[5];envCard($('rcard'),p[0]);
  $('rFrom').textContent=o.f?T('A postcard from ','بطاقة بريدية من ')+o.f:T('A postcard from Gaza for you','بطاقة بريدية من غزة لكم');
  const back=`<div class="flip3"><div class="card3 back-on" id="rc3"><div class="fc front"><img src="${p[5]}" alt=""></div><div class="fc back"><div class="msg${isAr((o.m||'')+(o.f||''))?' ar':''}" dir="auto"></div><div class="addr"><span class="stampbox">${stampHTML(o.s)}</span><span class="pm on">GAZA<br>${today()}<br>✶</span><span class="to${isAr(o.t||'')?' ar':''}" dir="auto"></span><i></i><i></i><i></i></div><span class="cap2">${(AR?p[2]:p[1])}, ${T('Farah Al-Helou, Gaza','فرح الحلو، غزة')}</span></div></div></div>`;
  $('rfull').innerHTML=back;const mo=$('rfull').querySelector('.msg');mo.textContent=o.m||'';if(o.f){const s=document.createElement('span');s.className='from';s.textContent='— '+o.f;mo.append(s)}$('rfull').querySelector('.to').textContent=o.t||'';
  cardBox($('rfull').querySelector('.card3'),p[0]);$('rfull').querySelector('.card3').onclick=e=>e.currentTarget.classList.toggle('back-on');
  $('renv').onclick=async()=>{$('renv').classList.add('open');await wait(1900);$('recv').classList.add('read');$('racts').hidden=false};
  const close=()=>{$('recv').hidden=true;history.replaceState(null,'',location.pathname)};$('rClose').onclick=close;$('rReply').onclick=()=>{close()}}
let first=true;
MG.page(function(why){AR=MG.ar;if(why==='bag'||why==='user'){if(view.open)open_(vi);return}render();if(view.open)open_(vi);
  if(first){first=false;receive();const i=P.findIndex(p=>p[0]===location.hash.slice(1));if(i>=0)open_(i)}});
})();
