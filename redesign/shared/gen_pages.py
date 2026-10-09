import json,sys,os
S=sys.argv[1];O=S+'/site'
p=open(S+'/product/src.html').read()
HEAD=p[:p.index('<style>')]
CSS=open(S+'/checkout/base.css').read()
HDR=open(S+'/checkout/header.html').read().replace('{{LOGO}}',open(S+'/product/logo.svg').read().strip()).replace('href="#top"','href="index.html"')
FOOT=open(S+'/checkout/footer.html').read()
X='''
.shead{text-align:center;max-width:640px;margin:0 auto 26px}.shead .lead{margin-inline:auto}
.stabs{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 22px;margin:0 auto 18px;max-width:1000px}
.stabs button{background:none;border:0;padding:6px 0;font:400 16px/1.2 var(--f-ar);color:var(--ink);opacity:.62;border-bottom:2px solid transparent;cursor:pointer}
.stabs button[aria-pressed=true]{opacity:1;border-color:var(--ink)}.stabs sup{font:500 11px ui-monospace,monospace;opacity:.7}
.sbar{display:flex;flex-wrap:wrap;gap:12px 20px;align-items:center;justify-content:space-between;border-top:1px solid color-mix(in srgb,var(--ink) 18%,transparent);border-bottom:1px solid color-mix(in srgb,var(--ink) 18%,transparent);padding:12px 0;margin-bottom:28px}
.sbar input{flex:1 1 240px;max-width:380px;background:transparent;border:0;border-bottom:1.5px solid var(--ink);padding:8px 2px;font:inherit;color:var(--ink)}
.ssort{display:flex;gap:8px;align-items:center;font-size:14px}.ssort select{background:transparent;border:0;border-bottom:1.5px solid var(--ink);font:inherit;color:var(--ink);padding:4px}
.pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:34px 26px}
.sc{position:relative;display:flex;flex-direction:column;gap:6px}
.sc .th{width:100%;position:relative;display:grid;place-items:center;aspect-ratio:4/5;background:color-mix(in srgb,#fff 38%,transparent);border-radius:4px;overflow:hidden;transition:transform .25s}
.sc:hover .th{transform:translateY(-3px)}
.sc .th>img,.sc .th>span{max-width:86%;max-height:86%}
.sc .th>.mgmk{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);height:92%;max-width:none;width:auto}.sc .mgmk .ph{display:block;height:100%;width:auto;max-width:none}
.mgmk .pa{position:absolute;display:flex;align-items:center;justify-content:center}.mgmk .pa img{max-width:100%;max-height:100%;object-fit:contain;mix-blend-mode:multiply;opacity:.94}
.sc .print{background:#fff;padding:7%;box-shadow:0 2px 10px rgba(40,30,20,.16);width:70%}.sc .print img{display:block;width:100%}
.sc .card{background:#fff;padding:4%;box-shadow:0 2px 8px rgba(40,30,20,.16);transform:rotate(-3deg);width:80%}.sc .card img{display:block;width:100%;aspect-ratio:3/2;object-fit:cover}
.sc .dig{width:46%;border:7px solid #1d1a17;border-radius:18px;overflow:hidden;aspect-ratio:9/19;box-shadow:0 4px 14px rgba(0,0,0,.2)}.sc .dig img{width:100%;height:100%;object-fit:cover;display:block}
.sc .stk{width:62%;filter:drop-shadow(0 2px 3px rgba(0,0,0,.22))}
.sc .pack{position:relative;width:76%;aspect-ratio:3/2}.sc .pack img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border:5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.18)}.sc .pack img:nth-child(1){transform:rotate(-8deg)}.sc .pack img:nth-child(2){transform:rotate(4deg)}
.sc .book{width:62%;aspect-ratio:3/4;border-radius:2px 6px 6px 2px;overflow:hidden;box-shadow:-6px 0 0 #3a2e22 inset,0 6px 16px rgba(0,0,0,.25)}.sc .book img{width:100%;height:100%;object-fit:cover}
.sc .cal{width:70%;border-top:14px solid #2b2621;box-shadow:0 3px 12px rgba(0,0,0,.18)}
.sc .bdg{position:absolute;top:10px;inset-inline-start:10px;background:var(--ink);color:var(--yellow);font:600 10px/1 ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;padding:6px 8px;border-radius:3px}.sc .bdg.nw{background:var(--red)}
.sc .wish{position:absolute;top:8px;inset-inline-end:8px;width:36px;height:36px;border:0;border-radius:50%;background:color-mix(in srgb,#fff 80%,transparent);display:grid;place-items:center;cursor:pointer}
.sc .wish svg{width:18px;height:18px;fill:none;stroke:var(--ink);stroke-width:1.8}.sc .wish[aria-pressed=true] svg{fill:var(--red);stroke:var(--red)}
@media(max-width:700px){.pgrid{grid-template-columns:1fr 1fr;gap:24px 14px}.stabs{flex-wrap:nowrap;overflow-x:auto;justify-content:flex-start;scrollbar-width:none;margin-inline:-16px;padding-inline:16px}.stabs button{white-space:nowrap}.sc .nm b{font-size:15px!important}}
.sc .nm{text-decoration:none;color:inherit;display:flex;flex-direction:column}.sc .nm b{font-weight:500;font-size:17px}.sc .nm span{font-size:13px;opacity:.7}.sc .pr{font-size:14px}

.pg{padding-top:calc(118px + env(safe-area-inset-top,0px));padding-bottom:clamp(50px,6vw,90px)}
@media (max-width:640px){.pg{padding-top:calc(92px + env(safe-area-inset-top,0px))}}
.ph1{margin:12px 0 10px;font:400 clamp(42px,5.6vw,80px)/1 var(--f-ar-disp);text-wrap:balance}
body[data-lang=en] .ph1{font-family:var(--f-disp);text-transform:uppercase;line-height:.92}
.lead{max-width:60ch;margin:0 0 10px;font-size:17px}
.doc{max-width:780px}
.doc h2{margin:38px 0 8px;font:400 28px/1.15 var(--f-ar-disp)}
body[data-lang=en] .doc h2{font:400 26px/1 var(--f-disp);text-transform:uppercase}
.doc p,.doc li{font-size:16px;line-height:1.8}.doc ul{padding-inline-start:22px}
.doc table{width:100%;border-collapse:collapse;margin-top:10px;font-size:15px}.doc th,.doc td{border-bottom:2px dashed var(--line);padding:10px 6px;text-align:start}
.box2{border:3px solid var(--ink);border-radius:10px;background:var(--cream);box-shadow:6px 7px 0 var(--shadow);padding:clamp(18px,2.6vw,30px)}
.frm{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:16px}.frm .full{grid-column:1/-1}
@media (max-width:560px){.frm{grid-template-columns:minmax(0,1fr)}}
.frm label{display:block;font:600 14px/1.3 var(--f-ar);margin-bottom:6px}
.frm input,.frm select,.frm textarea{width:100%;border:2.5px solid var(--ink);border-radius:7px;background:var(--yellow);color:var(--ink);padding:11px 12px;font:500 16px/1.4 var(--f-ar);outline:0}
.frm input:focus,.frm select:focus,.frm textarea:focus{box-shadow:0 0 0 3px var(--red)}
.frm [aria-invalid=true]{border-color:var(--red)}
.err{color:var(--red);font:600 13px/1.4 var(--f-ar);display:block;margin-top:4px}
.ok{margin-top:16px;padding:14px 16px;border:2px dashed var(--ink);border-radius:8px;background:var(--glow)}
.finfo{margin-top:18px;opacity:.85}.finfo a{font-size:14px}
[aria-current=page]{text-decoration:underline;text-underline-offset:5px}
.mg-badge,.badge{position:absolute;top:-9px;inset-inline-end:-9px;min-width:22px;height:22px;border-radius:11px;background:var(--red);color:var(--on-accent);font:600 12px/22px var(--f-mono);padding:0 6px;border:2px solid var(--ink)}
.demo{display:inline-block;margin-top:14px;font:500 13px/1.3 var(--f-ar);padding:6px 9px;border:1.5px dashed var(--ink);border-radius:4px;opacity:.75}
/* grid of products */
.bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:26px 0 8px}
.bar input{flex:1 1 240px;border:2.5px solid var(--ink);border-radius:8px;background:var(--cream);color:var(--ink);padding:11px 13px;font:500 16px var(--f-ar)}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.chips button{border:2.5px solid var(--ink);background:var(--cream);border-radius:30px;padding:8px 14px;font:600 14px/1 var(--f-ar)}
.chips button[aria-pressed=true]{background:var(--ink);color:var(--yellow)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:clamp(18px,2.4vw,30px);margin-top:26px}
.card3{display:flex;flex-direction:column;gap:8px;text-decoration:none;color:inherit}
.card3 .th{position:relative;aspect-ratio:1;border:3px solid var(--ink);border-radius:10px;background:var(--wall) var(--img) center/var(--fit,cover) no-repeat;box-shadow:5px 6px 0 var(--shadow);transition:transform .2s,box-shadow .2s}
.card3:hover .th{transform:translate(-2px,-3px) rotate(-1deg);box-shadow:7px 9px 0 var(--shadow)}
.card3 .tg{position:absolute;top:10px;inset-inline-start:10px;background:var(--ink);color:var(--yellow);font:600 12px/1 var(--f-ar);padding:6px 8px;border-radius:4px}
.card3 b{font:400 21px/1.15 var(--f-ar-disp)}
body[data-lang=en] .card3 b{font:400 19px/1.05 var(--f-disp);text-transform:uppercase}
.card3 small{font-size:14px;opacity:.8}.card3 .pr{font:400 22px/1 var(--f-disp)}
.empty2{padding:40px;text-align:center;opacity:.8}
.code{font:600 13px/1.4 var(--f-mono);direction:ltr;unicode-bidi:isolate}
.tblw{overflow-x:auto;margin-top:16px;border:3px solid var(--ink);border-radius:10px;background:var(--cream)}
.tbl{width:100%;border-collapse:collapse;font-size:14px;min-width:760px}.tbl th,.tbl td{padding:9px 10px;border-bottom:1.5px dashed var(--line);text-align:start;vertical-align:top}
.tbl th{position:sticky;top:0;background:var(--ink);color:var(--yellow);font:600 13px var(--f-ar)}
.legend{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:16px}
.legend div{border:2px solid var(--ink);border-radius:8px;padding:12px;background:var(--cream);font-size:14px}
.legend b{display:block;font:600 14px var(--f-mono);direction:ltr;text-align:start;margin-bottom:4px}
'''
def page(name,title,main,T,render):
    js='<script src="catalog.js"></script><script>window.PAGE={T:'+json.dumps(T,ensure_ascii=False)+',render:function(){'+render+'}};</script><script src="chrome.js"></script>'
    h='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'+HEAD.replace('Mass &amp; Grass Product',title+' · Mass &amp; Grass')+'<style>'+CSS+X+'</style></head><body>'
    h+=HDR+'<div class="drawer" id="drawer" hidden><nav id="navList"></nav></div><main id="top" class="wrap pg">'+main+'</main>'+FOOT+'<div class="toast" id="toast" role="status"></div>'+js+'</body></html>'
    open(f'{O}/{name}.html','w').write(h)
def doc(name,title,kick,ttl,lead,secs,extra=''):
    T={'kick':kick,'ttl':ttl,'lead':lead}
    body=''
    for i,(h,ps) in enumerate(secs):
        T[f'h{i}']=h;T[f'p{i}']=ps
        body+=f'<h2 data-t="h{i}"></h2><div data-th="p{i}"></div>'
    main=f'<span class="kick" data-t="kick"></span><h1 class="ph1" data-t="ttl"></h1><p class="lead" data-t="lead"></p><div class="doc">{body}</div>{extra}'
    return main,T
def A(ar,en):return {'ar':ar,'en':en}

# ---------- all products ----------
T={'kick':A('دكانة ماس وغراس','The shop'),'ttl':A('كل المنتجات','All products'),'lead':A('رسومات فرح مطبوعة على أشياء تُستعمل كل يوم. كل قطعة تُطبع عند الطلب وتُشحن إليكم.','Farah’s drawings printed on things you use every day. Each piece is printed to order and shipped to you.'),
 'q':A('ابحثوا عن منتج أو رسمة','Search a product or drawing'),'none':A('لا توجد نتائج. جرّبوا كلمة أخرى.','No results. Try another word.'),'n':A('منتج','products'),
 'sort':A('الترتيب','Sort'),'s0':A('المختارة','Featured'),'s1':A('الأحدث','Newest'),'s2':A('السعر: من الأقل','Price: low to high'),'s3':A('السعر: من الأعلى','Price: high to low'),
 'best':A('الأكثر مبيعاً','Best seller'),'new':A('جديد','New'),'save':A('احفظوها','Save'),'saved':A('المحفوظة','Saved'),'soon':A('قريباً','Coming soon'),
 'book':A('كتاب فرح المصوّر','Farah’s illustrated book'),'bookD':A('حكايات مرسومة بالألوان المائية','Stories painted in watercolour')}
main='<header class="shead"><span class="kick" data-t="kick"></span><h1 class="ph1" data-t="ttl"></h1><p class="lead" data-t="lead"></p></header><nav class="stabs" id="tabs" aria-label="categories"></nav><div class="sbar"><input id="q" type="search" data-tp="q" aria-label="search"><label class="ssort"><span data-t="sort"></span><select id="sort"></select></label><span class="code" id="cnt"></span></div><div class="pgrid" id="grid"></div>'
render=r"""const {$,esc,tr,L}=UI;
const TABS=[['ALL','كل المنتجات','Everything',null],['PRINT','اللوحات والطبعات','Prints & paintings',['PRT','DIG']],['POST','البطاقات البريدية','Postcards',['PCD','PCK']],['STK','الملصقات','Stickers',['STK']],['WEAR','الملابس','Clothing',['HOD','SWT']],['BAG','الحقائب والقبعات','Bags & caps',['TOT','CAP']],['HOME','البيت والمكتب','Home & desk',['CAL']],['BOOK','الكتب والورق','Books & paper',['BOOK']],['GIFT','الهدايا','Gifts',['PCK','CAL','STK']]];
let W=[];try{W=JSON.parse(localStorage.getItem('mg-wish')||'[]')}catch(e){}
const saveW=()=>{try{localStorage.setItem('mg-wish',JSON.stringify(W))}catch(e){}};
window._f=window._f||'ALL';window._s=window._s||'0';
const cols=['WHT','SND','SGE','CLY','CHR'];
if(!window._items){const items=[];let k=0;
 MG.TYPES.filter(t=>t.code!=='PSM').forEach(t=>{
  const from=Math.min(...MG.all().filter(x=>x.type===t.code).map(x=>x.price));
  if(t.code==='CAL'){items.push({id:'CAL',code:'CAL',t,from,n:99,vis:'<img class="cal" src="img/sparklers.jpg" alt="">',name:{ar:'التقويم السنوي 2027',en:'2027 yearly calendar'},href:'calendar.html'});return}
  if(t.code==='PCK'){items.push({id:'PCK',code:'PCK',t,from,n:98,vis:'<span class="pack"><img src="img/waves.jpg" alt=""><img src="img/coast.jpg" alt=""><img src="img/boatman.jpg" alt=""></span>',name:{ar:'مجموعات البطاقات',en:'Postcard packs'},href:'postcards.html#packs'});return}
  MG.DESIGNS.filter(d=>t.for.includes(d.kind)&&(!t.needs||d[t.needs])).forEach(d=>{const c=cols[(d.n+k++)%5];let vis,href=t.page;
   if(MG.MOCK[t.code]){vis=MG.mock(t.code,d.slug,c);href='product.html#'+d.slug+'&t='+t.code+'&c='+c}
   else if(t.code==='STK')vis=`<img class="stk" src="${d.stk}" alt="" loading="lazy">`;
   else if(t.code==='PCD'){vis=`<span class="card"><img src="${d.img}" alt="" loading="lazy"></span>`;href='postcards.html'}
   else if(t.code==='DIG'){vis=`<span class="dig"><img src="${d.img}" alt="" loading="lazy"></span>`;href='product.html#'+d.slug+'&t=DIG'}
   else{vis=`<span class="print" style="--r:${d.ratio||1}"><img src="${d.img}" alt="" loading="lazy"></span>`;href='product.html#'+d.slug}
   items.push({id:t.code+'-'+d.slug,code:t.code,t,d,from,n:d.n,vis,href,name:{ar:d.ar,en:d.en},best:MG.BEST.includes(d.slug)&&['PRT','HOD','STK','TOT'].includes(t.code),neu:MG.NEW.includes(d.slug)})})});
 items.push({id:'BOOK',code:'BOOK',t:{ar:'كتاب',en:'Book'},n:100,soon:1,vis:'<span class="book"><img src="img/blueflowers.jpg" alt=""></span>',name:{ar:'كتاب فرح المصوّر',en:'Farah’s illustrated book'},href:'story.html'});
 window._items=items}
const items=window._items;
const inTab=(i,f)=>f==='ALL'||(f==='SAVED'?W.includes(i.id):(TABS.find(x=>x[0]===f)[3]||[]).includes(i.code));
const tabs=TABS.concat(W.length?[['SAVED','المحفوظة','Saved',null]]:[]);
if(_f==='SAVED'&&!W.length)_f='ALL';
$('#tabs').innerHTML=tabs.map(([c,a,e])=>`<button data-c="${c}" aria-pressed="${_f===c}">${esc(UI.lang==='ar'?a:e)} <sup>${items.filter(i=>inTab(i,c)).length}</sup></button>`).join('');
$('#tabs').onclick=e=>{const b=e.target.closest('[data-c]');if(b){_f=b.dataset.c;PAGE.render()}};
$('#sort').innerHTML=['0','1','2','3'].map(v=>`<option value="${v}"${_s===v?' selected':''}>${esc(tr('s'+v))}</option>`).join('');
$('#sort').onchange=e=>{_s=e.target.value;PAGE.render()};
const q=($('#q').value||'').trim().toLowerCase();
let list=items.filter(i=>inTab(i,_f)&&(!q||(i.name.ar+i.name.en+i.t.ar+i.t.en).toLowerCase().includes(q)));
if(_s==='1')list=list.slice().sort((a,b)=>b.n-a.n);else if(_s==='2')list=list.slice().sort((a,b)=>(a.from||999)-(b.from||999));else if(_s==='3')list=list.slice().sort((a,b)=>(b.from||0)-(a.from||0));
else if(_f==='ALL'){const by={};list.forEach(i=>(by[i.code]=by[i.code]||[]).push(i));const g=Object.values(by).map((x,j)=>x.slice(j*3%x.length).concat(x.slice(0,j*3%x.length))),o=[];for(let r=0;o.length<list.length;r++)g.forEach(x=>{if(x[r])o.push(x[r])});list=o}
$('#cnt').textContent=list.length+' '+tr('n');
$('#grid').innerHTML=list.length?list.map(i=>`<article class="sc"><a class="th" href="${i.href}" aria-label="${esc(L(i.name))}">${i.vis}</a>${i.best?`<span class="bdg">${esc(tr('best'))}</span>`:i.neu?`<span class="bdg nw">${esc(tr('new'))}</span>`:i.soon?`<span class="bdg nw">${esc(tr('soon'))}</span>`:''}<button class="wish" data-w="${i.id}" aria-pressed="${W.includes(i.id)}" aria-label="${esc(tr('save'))}"><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg></button><a class="nm" href="${i.href}"><b>${esc(L(i.name))}</b><span>${esc(L(i.t))}</span></a><span class="pr num">${i.from?esc(tr('from'))+' €'+i.from:esc(tr('soon'))}</span></article>`).join(''):`<p class="empty2">${esc(tr('none'))}</p>`;
$('#grid').onclick=e=>{const b=e.target.closest('[data-w]');if(!b)return;const id=b.dataset.w,x=W.indexOf(id);if(x<0)W.push(id);else W.splice(x,1);saveW();PAGE.render()};
$('#q').oninput=()=>PAGE.render();"""
page('shop','All products',main,T,render)

# ---------- more designs ----------
T={'kick':A('تصاميم متنوعة','More designs'),'ttl':A('علامات وملصقات صغيرة','Small marks and stickers'),'lead':A('رسومات صغيرة من دفتر فرح: رموز وكلمات وأشياء من البيت. تُطبع ملصقات، وتُطرّز وتُطبع على الملابس والحقائب.','Small drawings from Farah’s sketchbook: symbols, words and things from home. Printed as stickers, and on clothing and bags.'),
 'stk':A('ملصق','Sticker'),'tee':A('قميص','T-shirt'),'more':A('الملابس','Apparel'),'marks':A('للملابس والحقائب','For clothing and bags'),'stks':A('ملصقات','Stickers')}
main='<span class="kick" data-t="kick"></span><h1 class="ph1" data-t="ttl"></h1><p class="lead" data-t="lead"></p><h2 class="h2" style="font-size:clamp(30px,3.4vw,46px);margin-top:40px" data-t="marks"></h2><div class="grid" id="g1"></div><h2 class="h2" style="font-size:clamp(30px,3.4vw,46px);margin-top:60px" data-t="stks"></h2><div class="grid" id="g2"></div>'
render=r'''const {$,esc,tr,L,toast}=UI;const card=(d,btns)=>`<div class="card3"><span class="th" style="--img:url(${d.stk||d.img});--fit:contain"></span><b>${esc(L(d))}</b><small>${esc(L(d.d))}</small><small class="code">D${MG.pad(d.n)}</small><div style="display:flex;gap:8px;flex-wrap:wrap">${btns(d)}</div></div>`;
$('#g1').innerHTML=MG.DESIGNS.filter(d=>d.kind==='mark').map(d=>card(d,d=>(d.stk?`<button class="btn" style="padding:9px 12px;font-size:16px" data-a="stk" data-s="${d.slug}">${esc(tr('stk'))} · €3</button>`:'')+`<a class="btn" style="padding:9px 12px;font-size:16px" href="apparel.html">${esc(tr('more'))}</a>`)).join('');
$('#g2').innerHTML=MG.DESIGNS.filter(d=>d.kind==='sticker').map(d=>card(d,d=>`<button class="btn pri" style="padding:9px 12px;font-size:16px" data-a="stk" data-s="${d.slug}">${esc(tr('stk'))} · €3</button>`)).join('');
document.querySelector('main').onclick=e=>{const b=e.target.closest('[data-a=stk]');if(b){MGCart.add('STK',b.dataset.s,{size:'M',finish:'MAT'},1);toast(tr('added'))}};'''
page('designs','More designs',main,T,render)

# ---------- books ----------
T={'kick':A('الكتب','Books'),'ttl':A('الكتب والقصص المصورة','Books & illustrated stories'),'lead':A('قصص كتبتها فرح ورسمتها بالألوان المائية، للصغار والكبار.','Stories Farah wrote and painted in watercolour, for children and grown-ups.'),
 'b1':A('كتاب فرح الأول','Farah’s first book'),'b1d':A('قصة مصورة من غزة. يصدر قريباً مطبوعاً ونسخةً رقمية.','An illustrated story from Gaza. Coming soon in print and as a digital edition.'),'soon':A('قريباً','Coming soon'),
 'nT':A('أخبرونا عند صدوره','Tell me when it is out'),'em':A('البريد الإلكتروني','E-mail'),'go':A('أخبروني','Notify me'),'ok':A('شكراً، سنراسلكم عند صدوره.','Thank you. We will write when it is out.')}
main='<header class="shead"><span class="kick" data-t="kick"></span><h1 class="ph1" data-t="ttl"></h1><p class="lead" data-t="lead"></p></header><div class="bkrow"><div class="bk3"><span class="cv"><img src="img/blueflowers.jpg" alt=""></span></div><div class="bkt"><span class="bdg2" data-t="soon"></span><h2 data-t="b1"></h2><p data-t="b1d"></p><form class="bkf" id="bkf"><label><span data-t="nT"></span><input type="email" required autocomplete="email" data-tp="em"></label><button class="btn pri" type="submit" data-t="go"></button><p class="st" role="status"></p></form></div></div>'
render="const {$,tr}=UI;$('#bkf').onsubmit=e=>{e.preventDefault();$('#bkf .st').textContent=tr('ok');e.target.reset()};"
X2='.bkrow{display:grid;grid-template-columns:1fr 1.1fr;gap:clamp(24px,5vw,70px);align-items:center;max-width:1000px;margin:20px auto 0}.bk3{perspective:1400px;display:grid;place-items:center}.bk3 .cv{display:block;width:min(340px,80%);aspect-ratio:3/4;transform:rotateY(-18deg);box-shadow:-8px 0 0 #3a2e22 inset,18px 22px 30px -10px rgba(30,20,10,.45);border-radius:2px 6px 6px 2px;overflow:hidden;position:relative}.bk3 .cv::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.25),rgba(255,255,255,.12) 4%,transparent 9%)}.bk3 img{width:100%;height:100%;object-fit:cover}.bkt h2{font-weight:400;font-size:var(--fs-h2,30px);margin:10px 0}.bdg2{display:inline-block;background:var(--ink);color:var(--yellow);font:600 11px ui-monospace,monospace;letter-spacing:.1em;text-transform:uppercase;padding:5px 8px;border-radius:3px}.bkf{display:grid;gap:10px;margin-top:22px;max-width:380px}.bkf label{display:grid;gap:6px}.bkf input{font:inherit;background:transparent;border:0;border-bottom:1.5px solid var(--ink);padding:8px 2px;color:var(--ink)}.bkf .st{min-height:1.2em;margin:0}@media(max-width:760px){.bkrow{grid-template-columns:1fr}}'
X_SAVE=X;X=X+X2
page('books','Books & stories',main,T,render)
X=X_SAVE

# ---------- wholesale ----------
T={'kick':A('للمتاجر','For shops'),'ttl':A('البيع بالجملة','Wholesale'),'lead':A('للمكتبات ومتاجر الهدايا والمقاهي والمعارض. نوفّر البطاقات والملصقات والطبعات والتقاويم بأسعار الجملة، مع حامل عرض ورقي للبطاقات والملصقات.','For bookshops, gift shops, cafés and galleries. We supply postcards, stickers, prints and calendars at wholesale prices, with a paper display stand for cards and stickers.'),
 'tT':A('الأسعار حسب الكمية','Prices by quantity'),'prod':A('المنتج','Product'),'retail':A('سعر البيع','Retail'),
 'fT':A('اطلب كتالوج الجملة','Request the wholesale catalogue'),'shop':A('اسم المتجر','Shop name'),'name':A('الاسم','Your name'),'email':A('البريد الإلكتروني','E-mail'),'country':A('البلد والمدينة','Country and city'),'what':A('ما الذي يهمّك؟','What are you interested in?'),'msg':A('رسالة (اختياري)','Message (optional)'),
 'send':A('أرسل الطلب','Send request'),'sent':A('(معاينة) وصل طلبك، وسنرسل الكتالوج خلال يومي عمل.','(Preview) Request received; we will send the catalogue within two working days.'),'req':A('هذا الحقل مطلوب','This field is required'),
 'opts':A('بطاقات بريدية|ملصقات|طبعات فنية|تقاويم|ملابس وحقائب','Postcards|Stickers|Art prints|Calendars|Clothing & bags'),'note':A('الأسعار أمثلة إلى حين تثبيتها. الحد الأدنى للطلب 25 قطعة من كل تصميم.','Prices are examples until confirmed. Minimum order 25 pieces per design.')}
main='''<span class="kick" data-t="kick"></span><h1 class="ph1" data-t="ttl"></h1><p class="lead" data-t="lead"></p>
<div class="doc"><h2 data-t="tT"></h2><div class="tblw" style="margin-top:10px"><table class="tbl" style="min-width:560px"><thead><tr><th data-t="prod"></th><th data-t="retail"></th><th>25+</th><th>50+</th><th>100+</th></tr></thead><tbody id="tb"></tbody></table></div><p class="demo" data-t="note"></p></div>
<div class="box2" style="margin-top:40px;max-width:780px"><h2 class="h2" style="font-size:clamp(28px,3vw,40px);margin:0" data-t="fT"></h2>
<form class="frm" id="wf" novalidate><div><label for="w1" data-t="shop"></label><input id="w1" required></div><div><label for="w2" data-t="name"></label><input id="w2" required></div>
<div><label for="w3" data-t="email"></label><input id="w3" type="email" class="ltr" required></div><div><label for="w4" data-t="country"></label><input id="w4" required></div>
<div class="full"><label for="w5" data-t="what"></label><select id="w5"></select></div><div class="full"><label for="w6" data-t="msg"></label><textarea id="w6" rows="3"></textarea></div>
<div class="full"><button class="btn pri" data-t="send"></button></div></form><div class="ok" id="wok" hidden data-t="sent"></div></div>'''
render=r'''const {$,esc,tr,L}=UI;const R=[['PCD','P1',3],['STK','M',3],['PRT','A4',18],['CAL','WALL',24]];
$('#tb').innerHTML=R.map(([c,o,p])=>`<tr><td>${esc(L(MG.type(c)))}</td><td class="num">€${p}</td><td class="num">€${(p*.6).toFixed(2)}</td><td class="num">€${(p*.55).toFixed(2)}</td><td class="num">€${(p*.5).toFixed(2)}</td></tr>`).join('');
$('#w5').innerHTML=tr('opts').split('|').map(o=>`<option>${esc(o)}</option>`).join('');
$('#wf').onsubmit=e=>{e.preventDefault();let ok=true;['w1','w2','w3','w4'].forEach(id=>{const i=$('#'+id),bad=!i.value.trim()||(i.type==='email'&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(i.value));i.setAttribute('aria-invalid',bad);if(bad&&ok){i.focus();ok=false}});if(ok){$('#wf').hidden=true;$('#wok').hidden=false}};'''
page('wholesale','Wholesale',main,T,render)

# ---------- text pages ----------
docs={
'shipping':('Shipping & returns',A('المساعدة','Help'),A('الشحن والإرجاع','Shipping & returns'),A('كيف تصلك طلباتك، وماذا نفعل إن وصلت تالفة.','How your orders reach you, and what we do if they arrive damaged.'),[
 (A('من أين تُشحن الطلبات؟','Where do orders ship from?'),A('<p>البريد من غزة متوقف حالياً. ترسم فرح في غزة ونمسح الرسومات ضوئياً هناك، ثم تُطبع المنتجات وتُشحن من مطبعة شريكة قريبة من بلدك، فتصل أسرع وبتكلفة شحن أقل.</p>','<p>Post from Gaza is currently closed. Farah paints in Gaza and we scan the drawings there; products are then printed and shipped from a partner print house near your country, so they arrive faster and cost less to ship.</p>')),
 (A('مدة التوصيل','Delivery times'),A('<ul><li>النسخ الرقمية: فوراً بعد الدفع، على بريدك الإلكتروني.</li><li>المنتجات المطبوعة: 2–5 أيام عمل للتجهيز، ثم 3–10 أيام شحن حسب البلد.</li><li>التقويم السنوي: يُشحن من المرسم في الموعد المعلن عند الحجز المسبق.</li></ul>','<ul><li>Digital files: instantly after payment, by e-mail.</li><li>Printed products: 2–5 working days to make, then 3–10 days shipping depending on country.</li><li>The yearly calendar: ships from the studio on the date given at pre-order.</li></ul>')),
 (A('تكلفة الشحن','Shipping cost'),A('<p>تُحسب عند الدفع حسب البلد وطريقة الشحن (عادي أو سريع). النسخ الرقمية بلا شحن.</p>','<p>Worked out at checkout by country and method (standard or express). Digital files have no shipping.</p>')),
 (A('التتبّع','Tracking'),A('<p>عند شحن طلبك يصلك رقم تتبّع على بريدك الإلكتروني، ويمكنك متابعة الطلب من صفحة <a href="track.html">تتبّع الطلب</a> برقم الطلب.</p>','<p>When your order ships you receive a tracking number by e-mail, and you can follow it on the <a href="track.html">Track an order</a> page with your order number.</p>')),
 (A('وصلت تالفة أو خاطئة؟','Arrived damaged or wrong?'),A('<p>صوّر المنتج وأرسل الصورة مع رقم الطلب خلال 30 يوماً من الاستلام، ونعيد طباعته وإرساله دون تكلفة.</p>','<p>Photograph it and send the photo with your order number within 30 days of delivery, and we reprint and resend it at no cost.</p>')),
 (A('الإرجاع والاستبدال','Returns and exchanges'),A('<p>تُطبع كل قطعة خصيصاً لك، لذلك لا نقبل الإرجاع لتغيير الرأي أو المقاس، إلا إذا كان المنتج تالفاً أو مختلفاً عمّا طلبت. يُرجى مراجعة <a href="apparel.html">دليل المقاسات</a> قبل الطلب. النسخ الرقمية غير قابلة للاسترداد بعد التحميل.</p>','<p>Every piece is printed for you, so we cannot accept returns for a change of mind or size unless the item is damaged or not what you ordered. Please check the <a href="apparel.html">size guide</a> before ordering. Digital files cannot be refunded once downloaded.</p>'))]),
'faq':('FAQ',A('المساعدة','Help'),A('الأسئلة الشائعة','Frequently asked questions'),A('إن لم تجد إجابتك هنا، تواصل معنا.','If your answer is not here, write to us.'),[
 (A('ما الفرق بين النسخة الرقمية والمطبوعة؟','Digital or printed: what is the difference?'),A('<p>النسخة الرقمية ملف عالي الدقة يصلك فوراً لتطبعه أو تستخدمه خلفية. المطبوعة نطبعها على المنتج الذي تختاره ونشحنها إليك.</p>','<p>A digital file is a high-resolution file you get instantly to print or use as a wallpaper. A printed item is made on the product you choose and shipped to you.</p>')),
 (A('ما رمز المنتج؟','What is the product code?'),A('<p>لكل منتج رمز مثل <span class="code">MG-HOD-002-M-SGE</span>: النوع، ورقم الرسمة، ثم الخيارات. يظهر في صفحة المنتج والسلة والإيصال، واذكره في أي تواصل معنا لنعرف طلبك بالضبط.</p>','<p>Every product has a code like <span class="code">MG-HOD-002-M-SGE</span>: the type, the drawing number, then the options. It shows on the product page, the basket and the receipt; quote it when you write to us so we know exactly what you ordered.</p>')),
 (A('هل يمكنني طباعة النسخة الرقمية في مطبعة قريبة؟','Can I print the digital file at a local shop?'),A('<p>نعم. ملف الطباعة مناسب حتى A3، والملف الكامل حتى 50×70 سم. نوصي بورق مطفي.</p>','<p>Yes. The print file suits up to A3 and the full file up to 50×70 cm. We recommend matte paper.</p>')),
 (A('هل تصل الألوان كما على الشاشة؟','Will colours match the screen?'),A('<p>قريبة جداً. نمسح الرسومات ضوئياً ونضبط ألوانها، لكن كل شاشة تعرض الألوان بطريقتها.</p>','<p>Very close. We scan the drawings and correct colour, but every screen shows colour its own way.</p>')),
 (A('هل يمكن استخدام الرسومات تجارياً؟','Can I use the drawings commercially?'),A('<p>الاستخدام التجاري يحتاج إذناً مكتوباً. <a href="contact.html">تواصل معنا</a> بتفاصيل المشروع.</p>','<p>Commercial use needs written permission. <a href="contact.html">Write to us</a> with the project details.</p>')),
 (A('كيف يصل دعمي إلى فرح؟','How does my support reach Farah?'),A('<p>كل عملية شراء تدعم المرسم مباشرة، ويمكنك أيضاً الدعم من قسم <a href="story.html#support">دعم الحكاية</a>.</p>','<p>Every purchase supports the studio directly, and you can also give through <a href="story.html#support">Support the story</a>.</p>'))]),
'terms':('Terms',A('قانوني','Legal'),A('الشروط والرخصة','Terms of sale & licence'),A('شروط البيع، ورخصة استخدام النسخ الرقمية.','Terms of sale, and the licence for digital files.'),[
 (A('البائع','The seller'),A('<p>Mass & Grass، مشروع فني من غزة. البريد الإلكتروني: <span class="code">info@massandgrass.com</span></p>','<p>Mass & Grass, an art project from Gaza. E-mail: <span class="code">info@massandgrass.com</span></p>')),
 (A('الأسعار والدفع','Prices and payment'),A('<p>الأسعار باليورو وتشمل الضريبة إن وُجدت. يُحسب الشحن عند الدفع. يتم الدفع عبر مزوّد دفع آمن، ولا نحفظ بيانات البطاقات.</p>','<p>Prices are in euro and include tax where applicable. Shipping is added at checkout. Payment is handled by a secure provider; we never store card details.</p>')),
 (A('الإنتاج والتوصيل','Production and delivery'),A('<p>تُطبع المنتجات عند الطلب عبر شركاء طباعة. راجع <a href="shipping.html">الشحن والإرجاع</a>.</p>','<p>Products are printed on demand by print partners. See <a href="shipping.html">Shipping & returns</a>.</p>')),
 (A('رخصة النسخة الرقمية','Digital file licence'),A('<ul><li>مسموح: الطباعة للاستخدام الشخصي، والاستخدام خلفيةً لأجهزتك، وإهداء نسخة مطبوعة.</li><li>غير مسموح: إعادة البيع، أو المشاركة العامة للملف، أو الطباعة على منتجات للبيع، أو الاستخدام التجاري دون إذن مكتوب.</li><li>تبقى حقوق الرسومات كاملة لفرح الحلو.</li></ul>','<ul><li>Allowed: printing for personal use, using it as a device wallpaper, giving a printed copy as a gift.</li><li>Not allowed: resale, sharing the file publicly, printing on products for sale, or commercial use without written permission.</li><li>All rights in the artwork stay with Farah Al Helou.</li></ul>')),
 (A('حقوق الملكية','Copyright'),A('<p>جميع الرسومات © فرح الحلو. يُمنع نسخها أو إعادة استخدامها دون إذن.</p>','<p>All artwork © Farah Al Helou. No copying or reuse without permission.</p>'))]),
'privacy':('Privacy',A('قانوني','Legal'),A('الخصوصية','Privacy'),A('ما البيانات التي نجمعها ولماذا.','What data we collect and why.'),[
 (A('ما نجمعه','What we collect'),A('<p>الاسم والبريد الإلكتروني وعنوان التوصيل ورقم الهاتف (اختياري) لإتمام طلبك. بيانات الدفع يعالجها مزوّد الدفع ولا تصلنا.</p>','<p>Name, e-mail, delivery address and phone (optional) to fulfil your order. Payment details are handled by the payment provider and never reach us.</p>')),
 (A('مع من نشاركه','Who we share it with'),A('<p>شريك الطباعة والشحن (لتوصيل الطلب)، ومزوّد الدفع. لا نبيع بياناتك.</p>','<p>Our print and shipping partner (to deliver your order) and the payment provider. We never sell your data.</p>')),
 (A('الرسائل البريدية','Newsletter'),A('<p>نرسل الرسمة الشهرية فقط لمن يشترك، ويمكن إلغاء الاشتراك من أي رسالة.</p>','<p>We only send the monthly drawing to subscribers; unsubscribe from any e-mail.</p>')),
 (A('ما يُحفظ في متصفحك','Stored in your browser'),A('<p>نحفظ السلة واللغة والوضع الليلي في متصفحك فقط لتسهيل التصفح.</p>','<p>We keep your basket, language and dark-mode choice in your browser only, to make browsing easier.</p>')),
 (A('حقوقك','Your rights'),A('<p>يمكنك طلب نسخة من بياناتك أو حذفها بمراسلة <span class="code">info@massandgrass.com</span>.</p>','<p>Ask for a copy of your data or its deletion at <span class="code">info@massandgrass.com</span>.</p>'))])
}
for n,(title,k,t,l,secs) in docs.items():
    m,T=doc(n,title,k,t,l,secs);page(n,title,m,T,'')

# ---------- contact ----------
T={'kick':A('تواصل','Contact'),'ttl':A('تواصل معنا','Contact us'),'lead':A('نرد عادة خلال يومي عمل. اذكر رقم الطلب أو رمز المنتج إن كان سؤالك عن طلب.','We usually reply within two working days. Include your order number or product code if it is about an order.'),
 'mail':A('البريد الإلكتروني','E-mail'),'name':A('الاسم','Name'),'email':A('بريدك الإلكتروني','Your e-mail'),'topic':A('الموضوع','Topic'),'order':A('رقم الطلب أو رمز المنتج (اختياري)','Order number or product code (optional)'),'msg':A('رسالتك','Your message'),
 'topics':A('سؤال عن طلب|استخدام تجاري|البيع بالجملة|تعاون أو معرض|غير ذلك','About an order|Commercial use|Wholesale|Collaboration or exhibition|Something else'),
 'send':A('أرسل','Send'),'sent':A('(معاينة) وصلت رسالتك، وسنرد على بريدك قريباً.','(Preview) Message received; we will reply by e-mail soon.'),'copy':A('نسخ','Copy'),'copied':A('نُسخ العنوان','Address copied')}
main='''<span class="kick" data-t="kick"></span><h1 class="ph1" data-t="ttl"></h1><p class="lead" data-t="lead"></p>
<p><b data-t="mail"></b>: <span class="code" id="em">info@massandgrass.com</span> <button class="btn" style="padding:6px 12px;font-size:15px" id="cp" data-t="copy"></button></p>
<div class="box2" style="max-width:780px;margin-top:20px"><form class="frm" id="cf" novalidate><div><label for="c1" data-t="name"></label><input id="c1" required></div><div><label for="c2" data-t="email"></label><input id="c2" type="email" class="ltr" required></div>
<div><label for="c3" data-t="topic"></label><select id="c3"></select></div><div><label for="c4" data-t="order"></label><input id="c4" class="ltr"></div>
<div class="full"><label for="c5" data-t="msg"></label><textarea id="c5" rows="5" required></textarea></div><div class="full"><button class="btn pri" data-t="send"></button></div></form><div class="ok" id="cok" hidden data-t="sent"></div></div>'''
render=r'''const {$,esc,tr,toast}=UI;$('#c3').innerHTML=tr('topics').split('|').map(o=>`<option>${esc(o)}</option>`).join('');
$('#cp').onclick=async()=>{try{await navigator.clipboard.writeText('info@massandgrass.com');toast(tr('copied'))}catch(e){getSelection().selectAllChildren($('#em'))}};
$('#cf').onsubmit=e=>{e.preventDefault();let ok=true;['c1','c2','c5'].forEach(id=>{const i=$('#'+id),bad=!i.value.trim()||(i.type==='email'&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(i.value));i.setAttribute('aria-invalid',bad);if(bad&&ok){i.focus();ok=false}});if(ok){$('#cf').hidden=true;$('#cok').hidden=false}};'''
page('contact','Contact',main,T,render)

# ---------- track ----------
T={'kick':A('طلبك','Your order'),'ttl':A('تتبّع الطلب','Track an order'),'lead':A('اكتب رقم الطلب والبريد الإلكتروني الذي استخدمته عند الدفع.','Enter your order number and the e-mail you used at checkout.'),
 'no':A('رقم الطلب','Order number'),'email':A('البريد الإلكتروني','E-mail'),'go':A('اعرض حالة الطلب','Show order status'),'bad':A('رقم الطلب يبدأ بـ MG- مثل MG-2026-4817','Order numbers start with MG-, like MG-2026-4817'),
 's1':A('وصل الطلب','Order received'),'s2':A('في المطبعة','At the print house'),'s3':A('شُحن · رقم التتبّع على بريدك','Shipped · tracking number by e-mail'),'s4':A('وصل','Delivered'),'demo':A('معاينة: الحالة هنا مثال، وفي الموقع الحقيقي تأتي من شريك الطباعة.','Preview: this status is an example; on the live site it comes from the print partner.')}
main='''<span class="kick" data-t="kick"></span><h1 class="ph1" data-t="ttl"></h1><p class="lead" data-t="lead"></p>
<div class="box2" style="max-width:640px"><form class="frm" id="tf" novalidate><div><label for="t1" data-t="no"></label><input id="t1" class="ltr" placeholder="MG-2026-4817"><span class="err" id="te"></span></div><div><label for="t2" data-t="email"></label><input id="t2" type="email" class="ltr"></div><div class="full"><button class="btn pri" data-t="go"></button></div></form>
<ol class="steps2" id="ts" hidden style="list-style:none;padding:0;margin:20px 0 0;display:grid;gap:12px"></ol><span class="demo" id="td" hidden data-t="demo"></span></div>'''
render=r'''const {$,esc,tr}=UI;$('#tf').onsubmit=e=>{e.preventDefault();const v=$('#t1').value.trim().toUpperCase();if(!/^MG-\d{4}-\d{3,}$/.test(v)){$('#te').textContent=tr('bad');$('#t1').setAttribute('aria-invalid',true);$('#t1').focus();return}
$('#te').textContent='';$('#t1').setAttribute('aria-invalid',false);$('#ts').hidden=false;$('#td').hidden=false;
$('#ts').innerHTML=['s1','s2','s3','s4'].map((k,i)=>`<li style="display:flex;gap:12px;align-items:center"><b style="width:26px;height:26px;border-radius:50%;border:3px solid var(--ink);background:${i<2?'var(--green)':'var(--cream)'};display:inline-block"></b>${esc(tr(k))}</li>`).join('')};'''
page('track','Track an order',main,T,render)

# ---------- 404 ----------
T={'ttl':A('هذه الصفحة غير موجودة','This page does not exist'),'lead':A('ربما تغيّر الرابط. عُد إلى الرئيسية أو تصفّح كل المنتجات.','The link may have changed. Go back home or browse all products.'),'h':A('الرئيسية','Home'),'s':A('كل المنتجات','All products')}
main='<div style="text-align:center;padding:40px 0"><div style="font:400 clamp(90px,16vw,200px)/1 var(--f-disp)">404</div><h1 class="ph1" data-t="ttl"></h1><p class="lead" style="margin-inline:auto" data-t="lead"></p><div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:16px"><a class="btn pri" href="index.html" data-t="h"></a><a class="btn" href="shop.html" data-t="s"></a></div></div>'
page('404','Not found',main,T,'')

# ---------- product codes (for the owner) ----------
T={'kick':A('للإدارة','For the team'),'ttl':A('رموز المنتجات','Product codes'),'lead':A('كل المنتجات القابلة للبيع ورمز كل خيار. الرموز تُولَّد تلقائياً: أضف رسمة إلى القائمة فتظهر رموز كل منتجاتها. استخدم الرمز نفسه في Printful كـ SKU لكل خيار.','Every sellable product and the code for each option. Codes are generated automatically: add a drawing to the list and the codes for all its products appear. Use the same code in Printful as each variant’s SKU.'),
 'how':A('كيف يُقرأ الرمز','How to read a code'),'q':A('ابحث برمز أو رسمة…','Search by code or drawing…'),'c1':A('الرمز','Code'),'c2':A('النوع','Type'),'c3':A('الرسمة','Drawing'),'c4':A('الخيار','Option'),'c5':A('السعر','Price'),'c6':A('التنفيذ','Fulfilment'),'c7':A('منتج Printful','Printful product'),'tot':A('رمزاً','codes'),
 'dTitle':A('الرسومات وأرقامها','Drawings and their numbers')}
main='''<span class="kick" data-t="kick"></span><h1 class="ph1" data-t="ttl"></h1><p class="lead" data-t="lead"></p>
<h2 class="h2" style="font-size:clamp(28px,3vw,40px)" data-t="how"></h2><div class="legend" id="lg"></div>
<h2 class="h2" style="font-size:clamp(28px,3vw,40px);margin-top:40px" data-t="dTitle"></h2><div class="legend" id="ds"></div>
<div class="bar" style="margin-top:40px"><input id="q" type="search" data-tp="q" aria-label="search"><span class="code" id="cnt"></span></div><div class="chips" id="chips"></div>
<div class="tblw"><table class="tbl"><thead><tr><th data-t="c1"></th><th data-t="c2"></th><th data-t="c3"></th><th data-t="c4"></th><th data-t="c5"></th><th data-t="c6"></th><th data-t="c7"></th></tr></thead><tbody id="tb"></tbody></table></div>'''
render=r'''const {$,esc,tr,L}=UI;window._t=window._t||'ALL';const ar=UI.lang==='ar';
$('#lg').innerHTML=[['MG',ar?'المتجر: Mass & Grass':'Store: Mass & Grass'],['HOD · SWT · PRT …',ar?'نوع المنتج (3 أحرف)':'Product type (3 letters)'],['002',ar?'رقم الرسمة بترتيب إضافتها':'Drawing number, in the order added'],['M · SGE',ar?'الخيارات بالترتيب: المقاس ثم اللون':'Options in order: size, then colour'],['MG-HOD-002-M-SGE',ar?'هودي · الحمام · M · مريمية':'Hoodie · The doves · M · Sage']].map(([a,b])=>`<div><b>${esc(a)}</b>${esc(b)}</div>`).join('');
$('#ds').innerHTML=MG.DESIGNS.map(d=>`<div><b>D${MG.pad(d.n)}</b>${esc(L(d))}</div>`).join('');
const A=MG.all();$('#chips').innerHTML=[['ALL',ar?'الكل':'All']].concat(MG.TYPES.map(t=>[t.code,t.code+' · '+L(t)])).map(([c,l])=>`<button data-c="${c}" aria-pressed="${_t===c}">${esc(l)}</button>`).join('');
$('#chips').onclick=e=>{const b=e.target.closest('[data-c]');if(b){_t=b.dataset.c;PAGE.render()}};
const q=($('#q').value||'').trim().toLowerCase();const F={printful:'Printful',digital:ar?'رقمي (تحميل)':'Digital download',studio:ar?'المرسم':'Studio'};
const rows=A.filter(r=>(_t==='ALL'||r.type===_t)&&(!q||(r.sku+r.design+r.designAr).toLowerCase().includes(q)));
$('#cnt').textContent=rows.length+' / '+A.length+' '+tr('tot');
$('#tb').innerHTML=rows.slice(0,600).map(r=>`<tr><td class="code">${r.sku}</td><td>${esc(L(MG.type(r.type)))}</td><td>${esc(ar?r.designAr:r.design)}</td><td>${esc(L(r.variant))}</td><td class="num">€${r.price}</td><td>${esc(F[r.fulfil])}</td><td style="font-size:12.5px">${esc(r.printful)}</td></tr>`).join('');
$('#q').oninput=()=>PAGE.render();'''
page('codes','Product codes',main,T,render)
print('pages ok')
