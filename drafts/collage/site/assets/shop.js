/* Mass & Grass · the shop layer shared by every collage page.
   The bag lives in this browser (localStorage.mgBag, the same lines the Worker's /api/orders prices),
   the header shows who is signed in (/api/me), and prices come from the server's catalog (window.MGCAT)
   with the shop's defaults when the page is opened without the server (previews). */
(function(){
'use strict';
const AR=()=>document.documentElement.lang==='ar';
const T=(en,ar)=>AR()?ar:en;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>document.querySelector(s);

/* Farah's clean scans are named by calendar month; the shop knows them by their product id */
const IDS={'cal-01':'waves','cal-02':'psea','cal-03':'blueflowers','cal-04':'pflower','cal-05':'pmoon','cal-06':'dovegirl','cal-07':'boattop','cal-08':'pcartgirl','cal-10':'pelephant','cal-11':'pmoonsleep'};
const IMG=Object.fromEntries(Object.entries(IDS).map(([a,b])=>[b,a]));
const id=k=>IDS[k]||k, img=k=>'assets/'+(IMG[k]||k)+'.webp';
const CAT=()=>window.MGCAT||{};
const DEF={painting:12,postcard:2,sticker:1,pack:3,calendar:8};
function product(kind,k){return (CAT().products||[]).find(p=>p.kind===kind&&p.id===id(k))||null}
/* the price of one piece in euros, as the server will charge it */
function price(kind,k){const pr=CAT().prices||{},base=pr[kind]!=null?pr[kind]:DEF[kind];if(kind==='pack'||kind==='calendar'||!k)return base;
  const p=product(kind,k);if(!p)return base;const e=p.price!=null?p.price:base;return Math.round(e*(100-(p.sale||0)))/100}
const fmt=e=>'€'+(Math.round(e*100)%100?e.toFixed(2):String(Math.round(e)));
const KIND={painting:['Painting, PDF and PNG','لوحة، PDF وPNG'],postcard:['Postcard, PDF and PNG','بطاقة بريدية، PDF وPNG'],sticker:['Sticker, PNG','ملصق، PNG'],pack:['Sticker pack, PNG','مجموعة ملصقات، PNG'],calendar:['Calendar 2027, PDF in A5','تقويم 2027، PDF بمقاس A5']};

/* ---------- the bag ---------- */
const BAG={
  get(){try{const a=JSON.parse(localStorage.mgBag||'[]');return Array.isArray(a)?a:[]}catch(e){return []}},
  set(a){try{localStorage.mgBag=JSON.stringify(a)}catch(e){}paint();document.dispatchEvent(new CustomEvent('mgbag'))},
  count(){return this.get().length},
  total(){return this.get().reduce((n,x)=>n+(+x.p||0),0)},
  has(kind,k){k=id(k);return this.get().some(x=>x.kind===kind&&x.k===k)},
  /* one line per piece; a painting or a postcard is a file, so it is in the bag once */
  add(kind,k,t,ta,extra){const a=this.get(),kk=id(k);if(kind!=='pack'&&a.some(x=>x.kind===kind&&x.k===kk))return false;
    const p=product(kind,k);a.push(Object.assign({k:kk,kind,t:(p&&p.title_en)||t,ta:(p&&p.title_ar)||ta||t,p:price(kind,k),img:img(k)},extra||{}));this.set(a);bump();return true},
  remove(i){const a=this.get();a.splice(i,1);this.set(a)},
  drop(kind,k){k=id(k);this.set(this.get().filter(x=>!(x.kind===kind&&x.k===k)))},
  toggle(kind,k,t,ta){if(this.has(kind,k)){this.drop(kind,k);return false}this.add(kind,k,t,ta);return true},
  clear(){this.set([])},
  /* stickers: every six (or four or more left over) go in as one pack at the pack price, the rest one by one */
  stickers(list){const a=this.get();let rest=[...list];while(rest.length){const n=rest.length>=6?6:rest.length>3?rest.length:0;if(!n)break;const pk=rest.slice(0,n).map(id);rest=rest.slice(n);
      a.push({k:'pack-'+Date.now().toString(36)+a.length,kind:'pack',t:`Sticker pack, ${pk.length} stickers`,ta:`مجموعة ملصقات، ${pk.length} ملصقات`,p:price('pack'),img:img(pk[0]),pack:pk})}
    rest.forEach(k=>{const p=product('sticker',k);a.push({k:id(k),kind:'sticker',t:p?p.title_en:k,ta:p?p.title_ar:k,p:price('sticker',k),img:img(k)})});
    this.set(a);bump()}
};
function bump(){const b=$('#bagb');if(b&&b.animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches)b.animate([{transform:'scale(1.12) rotate(-4deg)'},{transform:'none'}],{duration:320,easing:'ease-out'})}
function paint(){const n=BAG.count();document.querySelectorAll('#bagn,[data-bagn]').forEach(e=>e.textContent=n);document.querySelectorAll('.bagb').forEach(b=>{b.classList.toggle('has',n>0);b.setAttribute('aria-label',T('Bag','السلة')+(n?` (${n})`:''))})}

/* ---------- the bag sheet ---------- */
let D=null;
function sheet(){if(!D){D=document.createElement('dialog');D.className='bagd';D.setAttribute('aria-labelledby','bagd-h');document.body.append(D);
    D.addEventListener('click',e=>{if(e.target===D||e.target.closest('[data-close]'))D.close();const r=e.target.closest('[data-rm]');if(r){BAG.remove(+r.dataset.rm);fill()}})}
  fill();if(!D.open)D.showModal()}
function name(x){return AR()?(x.ta||x.t):x.t}
function fill(){const a=BAG.get(),n=a.length;D.dir=AR()?'rtl':'ltr';
  D.innerHTML=`<div class="bagd-in paper"><span class="fill"></span>
   <div class="bagd-hd"><h2 id="bagd-h">${T('Your bag','سلتكم')}</h2><button class="x" type="button" data-close aria-label="${T('Close','إغلاق')}">✕</button></div>
   ${n?`<ul class="bagd-ls">${a.map((x,i)=>`<li><span class="th"><img src="${esc(x.img||img(x.k))}" alt=""></span><div class="nm"><b>${esc(name(x))}</b><small>${esc(T(...(KIND[x.kind]||['Digital file','ملف رقمي'])))}</small></div><div class="pr"><span>${fmt(+x.p||0)}</span><button type="button" class="rm" data-rm="${i}">${T('Remove','إزالة')}</button></div></li>`).join('')}</ul>
   <div class="bagd-ft"><p class="tt"><span>${T('Total','المجموع')}</span><b>${fmt(BAG.total())}</b></p><a class="ink" href="checkout.html">${T('Checkout','إتمام الشراء')}</a><p class="note">${T('Digital files. The download links reach your email as soon as you pay.','ملفات رقمية. تصل روابط التحميل إلى بريدكم فور الدفع.')}</p></div>`
   :`<div class="bagd-em"><p>${T('Your bag is empty.','السلة فارغة.')}</p><a class="go" href="paintings.html">${T('See the paintings','شاهدوا اللوحات')}</a></div>`}</div>`}

/* ---------- who is signed in ---------- */
const USER={
  get(){try{return JSON.parse(localStorage.mgUser||'null')}catch(e){return null}},
  set(u){try{localStorage.mgUser=JSON.stringify(u)}catch(e){}acct()},
  async api(method,path,body){try{const r=await fetch(path,{method,credentials:'same-origin',headers:body?{'content-type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
      const ct=r.headers.get('content-type')||'';if(!ct.includes('json'))return {ok:false,status:r.status,offline:true,data:null};return {ok:r.ok,status:r.status,data:await r.json()}}
    catch(e){return {ok:false,status:0,offline:true,data:null}}},
  async sync(){const r=await this.api('GET','/api/me');if(r.offline)return this.get();const u=r.data&&r.data.user;this.set(u||null);return u||null},
  async out(){this.set(null);await this.api('POST','/api/logout')}
};
function acct(){const u=USER.get();document.querySelectorAll('.acct').forEach(a=>{a.href=u?'profile.html':'account.html';
  a.innerHTML=u?`<b aria-hidden="true">${esc((u.name||u.email||'?').trim()[0].toUpperCase())}</b><span class="sr">${T('Your account','حسابكم')}</span>`:`<span>${T('Sign in','الدخول')}</span>`;
  if(u)a.setAttribute('aria-label',T('Your account','حسابكم'));else a.removeAttribute('aria-label')})}
function header(){const bb=$('#bagb');if(bb&&!$('header .acct')){const a=document.createElement('a');a.className='acct';a.href='account.html';bb.before(a)}
  const mm=$('#mmenu');if(mm&&!mm.querySelector('.acct')){const a=document.createElement('a');a.className='acct';a.href='account.html';mm.append(a)}
  if(bb){bb.removeAttribute('aria-controls');bb.removeAttribute('aria-expanded');bb.setAttribute('aria-haspopup','dialog');bb.onclick=e=>{e.preventDefault();sheet()}}
  document.querySelectorAll('[data-price]').forEach(e=>e.textContent=fmt(price(e.dataset.price)));
  acct();paint()}

/* ---------- a short note at the foot of the screen ---------- */
function toast(msg){let el=$('.mgtoast');if(!el){el=document.createElement('p');el.className='mgtoast';el.setAttribute('role','status');document.body.append(el)}
  el.textContent=msg;el.classList.add('on');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('on'),2400)}

/* any button with data-add="calendar" puts the calendar in the bag */
document.addEventListener('click',e=>{const b=e.target.closest('[data-add]');if(!b)return;e.preventDefault();const kind=b.dataset.add;
  if(kind==='calendar'){const added=BAG.add('calendar','calendar-2027','Things kept in bottles, 2027','أشياء نحفظها في قوارير، 2027',{img:'assets/c27-00.webp'});toast(added?T('The calendar is in your bag.','أُضيف التقويم إلى السلة.'):T('The calendar is already in your bag.','التقويم في السلة.'))}});
window.MGShop={BAG,USER,price,fmt,id,img,product,toast,open:sheet,esc};
/* the header stays on top: its height is shared as --head for anything sticky under it */
function stick(){const h=$('header');if(!h)return;const set=()=>document.documentElement.style.setProperty('--head',h.offsetHeight+'px');set();new ResizeObserver(set).observe(h);
  const on=()=>h.classList.toggle('stuck',scrollY>4);on();addEventListener('scroll',on,{passive:true})}
const boot=()=>{header();stick();USER.sync();new MutationObserver(()=>{acct();if(D&&D.open)fill()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']})};
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',boot):boot();
addEventListener('storage',e=>{if(e.key==='mgBag')paint();if(e.key==='mgUser')acct()});
})();
