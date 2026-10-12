import re,os,hashlib,base64,shutil,sys,json,subprocess
S=sys.argv[1];O=S+'/site';shutil.rmtree(O,ignore_errors=True);os.makedirs(O+'/assets');os.makedirs(O+'/img')
for f in os.listdir(S+'/product/img'):shutil.copy(S+'/product/img/'+f,O+'/img/'+f)
shutil.copy(S+'/site_extra/assets/paper-tile.jpg',O+'/assets/paper-tile.jpg')  # kept for pages that still name it
for f in ['catalog.js','chrome.js']:shutil.copy(S+'/shared/'+f,O+'/'+f)
IDS={'86FYLHG2xY2QL5ZyCvArrs':'index.html','5kf85a5RN8kA35V5coBxKt':'story.html','K5g6D9pQNBhfmd9Uq4gXpf':'paintings.html','Qcvq65wrNorvCo5JCqTzHc':'stickers.html','UPQYPnsmuWtFVHu3Sez6Ns':'calendar.html','EW7hxmo69ZWij9g4u3GweT':'apparel.html','RDtLrFNcSadjNbdhcxXMnZ':'product.html','5VtMLRwsvXpHd5kLDY5oQj':'checkout.html'}
NAVL="['shop.html','paintings.html','stickers.html','calendar.html','apparel.html','postcards.html','designs.html','story.html','story.html#support']"
exec(open(S+'/ar_formal.py').read())
STR=json.load(open(S+'/ar_strings.json'))
IND=str.maketrans('٠١٢٣٤٥٦٧٨٩','0123456789')
TERMS=[('أضف للحقيبة','أضف إلى السلة'),('انضافت للحقيبة','أُضيفت إلى السلة'),('أضف للسلة','أضف إلى السلة'),('انضافت للسلة','أُضيفت إلى السلة'),("ar:'شيل'","ar:'احذف'"),('كمّل للدفع','متابعة الدفع'),('كمّل تسوّق','متابعة التسوق'),('رجوع للسلة','العودة إلى السلة'),('رجوع للوحات','العودة إلى اللوحات'),('نزّل الملف','تحميل الملف'),("ar:'طبّق'","ar:'تطبيق'"),('السلة فاضية','السلة فارغة'),("ar:'اسألنا'","ar:'تواصل معنا'"),('ملابس وشنط وطواقي','الملابس والحقائب'),('ملابس وشنط','الملابس والحقائب')]
SHARED='''<style id="mg-shared">
:root{--yellow:#F5F2EA;--grain-o:0;--pb:normal;--paper-img:url(assets/paper.webp)}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--yellow:#463928;--cream:#54452F;--shadow:#1C150D;--glow:#4E402D;--pb:normal;--paper-img:url(assets/paper-dark.webp)}}
:root[data-theme="dark"]{--yellow:#463928;--cream:#54452F;--shadow:#1C150D;--glow:#4E402D;--pb:normal;--paper-img:url(assets/paper-dark.webp)}
html body{background-color:var(--yellow)!important;background-image:var(--paper-img)!important;background-size:900px 900px!important;background-repeat:repeat!important;background-blend-mode:var(--pb)!important}
body::after{display:none!important}
main section,main .sec,.band,.phero,.shero,.pdp,#wrap,section.sec,section.sec.alt{background-color:transparent!important}
main .sec.alt{background-color:color-mix(in srgb,var(--cream) 45%,transparent)!important}
#shops,.stp.empty{display:none!important}
.mg-badge{position:absolute;top:-9px;inset-inline-end:-9px;min-width:22px;height:22px;border-radius:11px;background:var(--red);color:var(--on-accent,#fff);font:600 12px/22px ui-monospace,monospace;padding:0 6px;border:2px solid var(--ink);text-align:center}
.hdr{position:fixed!important}.hdr .logo{transition:opacity .3s,transform .3s}
.hdr.mg-stuck .logo{opacity:0;pointer-events:none;transform:translate(-50%,-24px) rotate(-2deg)!important}
#finfo{display:flex;flex-wrap:wrap;gap:4px 16px;font-size:13px;opacity:.85}#finfo a{text-decoration:none}#finfo a:hover{text-decoration:underline}.fbot{flex-wrap:wrap;gap:10px 24px}
.toast:not(.on){visibility:hidden}
#searchBtn,.hdr [aria-label=Search]{display:none!important}
#navList small{display:block;font:600 12px/1 ui-monospace,monospace;letter-spacing:.2em;margin:18px 0 4px;opacity:.7}
.mgq{border:0;padding:0;max-width:min(860px,94vw);width:100%;background:var(--yellow) var(--paper-img) 0 0/900px 900px;background-blend-mode:var(--pb);color:var(--ink);box-shadow:0 20px 60px rgba(30,20,10,.35);border-radius:3px}
.mgq[open]{display:grid;grid-template-columns:1.1fr 1fr}.mgq::backdrop{background:rgba(30,24,18,.55)}
.mgq .x{position:absolute;top:8px;inset-inline-end:10px;background:none;border:0;font-size:30px;line-height:1;color:var(--ink);cursor:pointer;z-index:2}
.mgq .qi{display:grid;place-items:center;padding:30px;background:color-mix(in srgb,#fff 35%,transparent)}.mgq .qi img{max-height:60vh;background:#fff;padding:5%;box-shadow:0 3px 14px rgba(0,0,0,.18)}.mgq .qi.cut img{background:none;padding:0;box-shadow:none;filter:drop-shadow(0 3px 5px rgba(0,0,0,.25))}
.mgq .qt{padding:34px 30px;display:flex;flex-direction:column;gap:10px}.mgq small{text-transform:uppercase;letter-spacing:.1em;font-size:12px;opacity:.7}.mgq h3{margin:0;font-weight:400;font-size:28px;line-height:1.1}.mgq p{margin:0;font-size:15px;line-height:1.6}
.mgq .qp{font-size:24px;font-weight:500}.mgq code{font-size:12px;opacity:.6}.mgq .qb{display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-top:8px}
.mgq .qa{background:var(--ink);color:var(--yellow);border:0;border-radius:3px;padding:12px 20px;font:inherit;cursor:pointer}.mgq .qb a{color:inherit}
@media(max-width:700px){.mgq[open]{grid-template-columns:1fr;max-height:92vh;overflow:auto}.mgq .qi img{max-height:42vh}}
.mgmk{position:relative;display:block}.mgmk .ph{display:block;width:100%;height:auto}.mgmk .pa{position:absolute;display:flex;align-items:center;justify-content:center}.mgmk .pa img{max-width:100%;max-height:100%;object-fit:contain;mix-blend-mode:multiply;opacity:.94}
</style>
<script src="catalog.js"></script>
<script>(function(){var INFO=[['shipping.html','الشحن والإرجاع','Shipping & returns'],['faq.html','الأسئلة الشائعة','FAQ'],['track.html','تتبّع الطلب','Track an order'],['contact.html','تواصل معنا','Contact'],['wholesale.html','البيع بالجملة','Wholesale'],['terms.html','الشروط والرخصة','Terms & licence'],['privacy.html','الخصوصية','Privacy']];
function en(){return (document.documentElement.lang||document.body.dataset.lang)==='en'}
function sync(){var f=document.getElementById('flinks')||document.querySelector('.foot .fgrid,footer .fgrid,footer');if(f){var g=document.querySelector('.fbot')||document.querySelector('.fgrid')||f,i=document.getElementById('finfo');if(!i){i=document.createElement('nav');i.id='finfo';i.className='finfo';g.appendChild(i)}var h=INFO.map(function(l){return '<a href="'+l[0]+'">'+(en()?l[2]:l[1])+'</a>'}).join('');if(i.innerHTML!==h)i.innerHTML=h}
var NV=[['SHOP'],['shop.html','كل المنتجات','All products'],['paintings.html','اللوحات','Paintings'],['postcards.html','البطاقات البريدية','Postcards'],['stickers.html','الملصقات','Stickers'],['apparel.html','الملابس والحقائب والقبعات','Apparel, totes & caps'],['calendar.html','التقويم السنوي','Calendar'],['books.html','الكتب والقصص المصورة','Books & stories'],['designs.html','تصاميم متنوعة','More designs'],['MASS &amp; GRASS'],['story.html','الحكاية','Our story'],['story.html#support','دعم الحكاية','Support the story'],['contact.html','تواصل معنا','Contact']],here=location.pathname.split('/').pop()||'index.html';
document.querySelectorAll('.drawer nav').forEach(function(n){var L=en()?'en':'ar';if(n.dataset.mg===L&&n.querySelector('small'))return;n.dataset.mg=L;var x=n.querySelector('button');n.innerHTML='';if(x)n.appendChild(x);n.insertAdjacentHTML('beforeend',NV.map(function(l){return l.length===1?'<small>'+l[0]+'</small>':'<a href="'+l[0]+'"'+(l[0]===here?' aria-current="page"':'')+'>'+(en()?l[2]:l[1])+'</a>'}).join(''))});
document.querySelectorAll('.mg-allp').forEach(function(a){a.textContent=en()?'All products':'كل المنتجات'});if(window.MGCart)MGCart.badge()}
var b=document.getElementById('bagBtn');if(b&&b.tagName==='BUTTON')b.addEventListener('click',function(){location.href='checkout.html'});
new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['data-lang']});new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});var fl=document.getElementById('flinks');if(fl)new MutationObserver(sync).observe(fl,{childList:true});document.querySelectorAll('.drawer nav').forEach(function(n){new MutationObserver(function(){if(!n.querySelector('small'))sync()}).observe(n,{childList:true})});window.mgQuick=function(o){var d=document.getElementById('mgq');if(!d){d=document.createElement('dialog');d.id='mgq';d.className='mgq';document.body.appendChild(d);d.addEventListener('click',function(e){if(e.target===d||e.target.closest('.x'))d.close()})}
var E=en(),L=function(v){return v?(E?v.en:v.ar):''},esc=function(x){return String(x==null?'':x).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
d.dir=E?'ltr':'rtl';d.innerHTML='<button class="x" aria-label="'+(E?'Close':'إغلاق')+'">×</button><div class="qi'+(o.cut?' cut':'')+'"><img src="'+esc(o.img)+'" alt=""></div><div class="qt"><small>'+esc(L(o.type))+'</small><h3>'+esc(L(o.name))+'</h3><p>'+esc(L(o.desc))+'</p><b class="qp">€'+o.price+'</b><code>'+esc(o.sku)+'</code><div class="qb"><button class="qa">'+(E?'Add to basket':'أضف إلى السلة')+'</button><a href="'+esc(o.href)+'">'+(E?'All options':'كل الخيارات')+'</a></div><p class="qs" role="status"></p></div>';
d.querySelector('.qa').onclick=function(){o.add();if(window.MGCart)MGCart.badge();d.querySelector('.qs').textContent=E?'Added to your basket':'أُضيفت إلى السلة'};d.showModal()};
sync();var H=document.querySelector('.hdr');if(H){var st=function(){H.classList.toggle('mg-stuck',scrollY>80)};addEventListener('scroll',st,{passive:true});st()}})();</script>'''
def assets(t):
    def rep(m):
        b=m.group(2)
        if len(b)<1500:return m.group(0)
        ext={'jpeg':'jpg','svg+xml':'svg'}.get(m.group(1),m.group(1))
        n=hashlib.md5(b[:4000].encode()+str(len(b)).encode()).hexdigest()[:12]+'.'+ext
        p=O+'/assets/'+n
        if not os.path.exists(p):open(p,'wb').write(base64.b64decode(b))
        return 'assets/'+n
    return re.sub(r'data:image/([a-z+]+);base64,([A-Za-z0-9+/=]+)',rep,t)
def formal(t):
    def sub1(m):
        s=m.group(1);i=STR.index(s) if s in STR else -1
        n=M.get(i,s).translate(IND)
        return m.group(0)[:m.start(1)-m.start(0)]+n.replace("'","\\'")+"'"
    t=re.sub(r"ar:'((?:[^'\\]|\\.)*)'",sub1,t)
    def sub2(m):
        s=m.group(1);i=STR.index(s) if s in STR else -1
        n=M.get(i,s).translate(IND)
        return m.group(0)[:m.start(1)-m.start(0)]+n.replace('"','\\"')+'"'
    t=re.sub(r'ar:"((?:[^"\\]|\\.)*)"',sub2,t);t=re.sub(r'"ar": ?"((?:[^"\\]|\\.)*)"',sub2,t)
    return t
def apparel(t):
    R=t.replace
    def rep(a,b):
        nonlocal t
        if a not in t:print('APPAREL MISS',a[:60])
        t=t.replace(a,b)
    rep(""" tee:{ar:'تيشيرت',en:'T-shirt',p:28,fab:'cotton',places:['chest','pocket','back'],tz:['cuffs','hem']},
 long:{ar:'كم طويل',en:'Long sleeve',p:34,fab:'cotton',places:['chest','pocket','back','sleeve'],tz:['cuffs','hem']},
 hoodie:{ar:'هودي',en:'Hoodie',p:48,fab:'fleece',places:['chest','back','sleeve'],tz:['cuffs','hem']},
 cap:{ar:'طاقية',en:'Cap',p:22,fab:'twill',places:['front','back'],tz:['band'],one:1},
 tote:{ar:'توت باج',en:'Tote bag',p:18,fab:'canvas',places:['front'],tz:['top'],one:1}""",""" hoodie:{ar:'هودي',en:'Hoodie',p:52,fab:'fleece',places:['chest'],tz:[]},
 sweat:{ar:'سويتشيرت',en:'Sweatshirt',p:44,fab:'fleece',places:['chest'],tz:[]},
 tote:{ar:'حقيبة قماشية',en:'Tote bag',p:22,fab:'canvas',places:['front'],tz:[],one:1},
 cap:{ar:'قبعة',en:'Cap',p:24,fab:'twill',places:['front'],tz:[],one:1}""")
    i=t.index("const COLORS=[{c:'#D8D2C2'");j=t.index("];",i)+2
    t=t[:i]+"const COLORS=MG.AC.split(' ').map(k=>({c:MG.COLORS[k].hex,k,ar:MG.COLORS[k].ar,en:MG.COLORS[k].en}));"+t[j:]
    i=t.index("function garment(kind,side,o={}){");j=t.index("/* ---------- state ---------- */",i)
    t=t[:i]+"""function garment(kind,side,o={}){const code={hoodie:'HOD',sweat:'SWT',tote:'TOT',cap:'CAP'}[kind]||'HOD',c=COLORS.find(x=>x.c===o.color)||COLORS[0];let slug=MG.slugOf(o.design||'postmark2');if(code==='CAP'&&MG.design(slug).kind!=='mark')slug='c-gaza';
  return `<div class="mkr">${MG.mock(code,slug,c.k,side==='b')}</div>`}
"""+t[j:]
    rep("const ST={kind:'tee',color:COLORS[0].c,","const ST={kind:'hoodie',color:COLORS[2].c,")
    rep("const LINE=[['hoodie','#737362','s-dove','chest',[2,4,40,-6]],['tee','#D8D2C2','postmark2','chest',[38,0,34,4]],['tote','#F1EDE3','guitar','front',[68,8,30,-3]],['long','#B5654A','s-star','chest',[24,46,36,8]],['cap','#8C9A78','s-gaza','front',[60,37,32,-8]]];",
        "const LINE=[['hoodie','#8C9A78','dovegirl','chest',[2,4,30,-5]],['sweat','#D9C19D','s-dove','chest',[30,0,28,4]],['tote','#B8633D','boatman','front',[56,6,22,-3]],['cap','#F1EDE3','s-gaza','front',[76,10,20,-6]]];")
    rep("const LINE_M={hoodie:[-6,0,62,-6],tee:[42,-2,60,5],tote:[50,36,52,-3],long:[-6,40,60,8],cap:[34,60,44,-8]};","const LINE_M={hoodie:[-4,0,54,-5],sweat:[48,0,52,4],tote:[2,40,46,-3],cap:[52,44,44,-6]};")
    rep("const OF={top:{k:'hoodie',c:'#737362'},head:{k:'cap',c:'#D8D2C2'},bag:{k:'tote',c:'#F1EDE3'}};","const OF={top:{k:'hoodie',c:'#8C9A78'},head:{k:'cap',c:'#F1EDE3'},bag:{k:'tote',c:'#D9C19D'}};")
    t=t.replace("['hoodie','tee','long']","['hoodie','sweat']").replace("['tee','long','hoodie']","['hoodie','sweat']")
    rep("$('#totefront').innerHTML=garment('tote','f',{color:'#F1EDE3',design:'guitar',place:'front',size:90});","$('#totefront').innerHTML=garment('tote','f',{color:'#D9C19D',design:'boatman',place:'front',size:90});")
    rep("TOTE_OFF=.15","TOTE_OFF=0")
    t=t.replace("off=items.length>=3?Math.round(sum*(1-SET)):sum;","off=sum;").replace("$('#owas').textContent=items.length>=3?'€'+sum:'';","$('#owas').textContent='';")
    rep("$('#toteAdd').onclick=()=>{if(!inTote.size){toast(tr('empty'));return}addBag()};",
        "$('#toteAdd').onclick=()=>{if(!inTote.size){toast(tr('empty'));return}const A=MG.cart.add;A('TOT','boatman',{color:'SND'},1);if(inTote.has('stk'))MG.helpers.sticker('s-star',5);if(inTote.has('pc'))A('PCD','coast',{pack:'P1'},3);if(inTote.has('cal'))A('CAL',null,{version:'DESK',year:'2027'},1);if(inTote.has('heart'))A('STK','s-heart',{size:'M',finish:'MAT'},1);window._mgSkip=1;addBag(1+inTote.size);window._mgSkip=0};")
    rep("$('#outAdd').onclick=()=>addBag(Object.values(OF).filter(o=>o.k).length);",
        "$('#outAdd').onclick=()=>{const cc=h=>(COLORS.find(x=>x.c===h)||COLORS[0]).k,n=Object.values(OF).filter(o=>o.k).length;if(!n)return;if(OF.top.k)MG.cart.add(OF.top.k==='sweat'?'SWT':'HOD','c-dove',{size:'M',color:cc(OF.top.c)},1);if(OF.head.k)MG.cart.add('CAP','c-gaza',{color:cc(OF.head.c)},1);if(OF.bag.k)MG.cart.add('TOT','c-star',{color:cc(OF.bag.c)},1);window._mgSkip=1;addBag(n);window._mgSkip=0};")
    import re as _re
    for k,ar,en in [('intro','هوديات وسويتشيرتات وحقائب قماشية وقبعات، مطبوعة برسومات فرح. اختاروا القطعة واللون والرسمة.','Hoodies, sweatshirts, totes and caps printed with Farah’s paintings. Pick the piece, the colour and the painting.'),
                    ('studioD','اختاروا القطعة والرسمة واللون، واسحبوا الصورة لتروها على شخص.','Choose the piece, the painting and the colour, and drag the photo to see it worn.'),
                    ('outD','اختاروا قطعة علوية وقبعة وحقيبة بالألوان التي تريدونها. عند اختيار ثلاث قطع ينخفض سعر الطقم.','Pick a top, a cap and a tote in the colours you want. Choose all three and the set price drops.')]:
        t,n=_re.subn(k+r":\{ar:(['\"]).*?\1,en:(['\"]).*?\2\}",k+":{ar:'"+ar+"',en:'"+en.replace("'","\\'")+"'}",t,count=1)
        if not n:print('APPAREL MISS',k)
    # "you, wearing it": visitors send a photo; it shows only after the owner approves it
    i=t.index("function renderWorn(){");j=t.index("\n",i)
    t=t[:i]+r"""function renderWorn(){const ar=LANG==='ar';let A=[];try{A=JSON.parse(localStorage.getItem('mg-worn-ok')||'[]')}catch(e){}
  $('#pols').innerHTML=Array.from({length:6},(_,i)=>{const a=A[i];return `<div class="pol" style="--r:${[-4,3,-2,5,-5,2][i]}deg"><div class="ph">${a?`<img src="${esc(a.src)}" alt="">`:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M8 6l1.5-2h5L16 6"/></svg>'}</div><span>${esc(a?a.note:tr('yourPhoto'))}</span><i class="pin"></i></div>`}).join('');
  if(!$('#wform')){const f=document.createElement('form');f.id='wform';f.className='wform';$('#pols').after(f);
    f.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(f),file=fd.get('photo'),st=f.querySelector('.st');
      if(!file||!file.size||!/^image\/(jpeg|png|webp|heic)$/.test(file.type)||file.size>8e6){st.textContent=tr('wBad');return}
      f.querySelector('button').disabled=true;st.textContent=tr('wSending');
      try{const r=await fetch('/api/wear',{method:'POST',body:fd});if(!r.ok)throw 0;f.reset();st.textContent=tr('wThanks')}catch(_){st.textContent=tr('wLater')}
      f.querySelector('button').disabled=false})}
  $('#wform').innerHTML=`<h3>${esc(tr('wT'))}</h3><label class="wf"><input type="file" name="photo" accept="image/jpeg,image/png,image/webp,image/heic" required><span>${esc(tr('wPick'))}</span></label><input name="name" maxlength="40" placeholder="${esc(tr('wName'))}" autocomplete="name"><textarea name="note" maxlength="160" rows="2" placeholder="${esc(tr('wNote'))}"></textarea><input name="website" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true"><label class="ok"><input type="checkbox" name="ok" required> ${esc(tr('wOk'))}</label><button class="btn" type="submit">${esc(tr('wSend'))}</button><p class="st" role="status"></p>`}"""+t[j:]
    rep("yourPhoto:{ar:'صورتك هون؟',en:'Your photo here?'}","""yourPhoto:{ar:'صورتكم هنا',en:'Your photo here'},wT:{ar:'أرسلوا صورتكم',en:'Send us your photo'},wPick:{ar:'اختاروا صورة (حتى 8 ميغابايت)',en:'Choose a photo (up to 8 MB)'},wName:{ar:'الاسم (اختياري)',en:'Name (optional)'},wNote:{ar:'كلمة قصيرة عن القطعة',en:'A few words about the piece'},wOk:{ar:'أوافق على نشر الصورة في الموقع بعد مراجعتها',en:'I agree to the photo appearing on the site after review'},wSend:{ar:'أرسلوا الصورة',en:'Send the photo'},wSending:{ar:'جارٍ الإرسال…',en:'Sending…'},wThanks:{ar:'شكراً. تظهر صورتكم هنا بعد مراجعتها.',en:'Thank you. Your photo will appear here once it is reviewed.'},wLater:{ar:'الإرسال يعمل بعد إطلاق الموقع.',en:'Sending works once the site is live.'},wBad:{ar:'اختاروا صورة JPG أو PNG أو WebP حتى 8 ميغابايت.',en:'Choose a JPG, PNG or WebP photo up to 8 MB.'}""")
    rep("wornD:{ar:'الحيط هاد إلكم. صوّر حالك لابس قطعة من ماس وجراس وشاركها بالهاشتاغ، ومنعلّق صورتك هون.',en:'This wall is yours. Take a photo wearing a Mass & Grass piece, share it with the hashtag, and we will pin it here.'}",
        "wornD:{ar:'هذا الجدار لكم. أرسلوا صورة وأنتم ترتدون قطعة من ماس وغراس، ونعلّقها هنا بعد مراجعتها.',en:'This wall is yours. Send a photo of you wearing a Mass & Grass piece and we will pin it here once we have reviewed it.'}")
    rep("turnHint:{ar:'اسحب عشان تلفّها',en:'Drag to turn it'}","turnHint:{ar:'اسحبوها لترونها على شخص',en:'Drag to see it worn'}")
    t=t.replace("</style>","""#print,#drop,.cta a[href="#drop"],.turnbar .sq,#places,label.sz,.pblock:has(#tzOpts),.pblock:has(#places){display:none!important}
.mkr{position:relative;width:100%;aspect-ratio:1}.mkr>.mgmk{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);height:96%;width:auto}.mkr>.mgmk .ph{height:100%;width:auto;max-width:none}.mkr>.mgmk.look{height:100%}.mkr>.mgmk.look .ph{border-radius:6px}
.wform{max-width:520px;margin:34px auto 0;display:grid;gap:12px;text-align:start}.wform h3{font-weight:400;font-size:22px;margin:0}.wform input,.wform textarea{font:inherit;color:var(--ink);background:color-mix(in srgb,#fff 50%,transparent);border:0;border-bottom:1.5px solid var(--ink);padding:10px 4px}
.wform .wf{display:block;border:1.5px dashed var(--ink);border-radius:4px;padding:16px;text-align:center;cursor:pointer}.wform .wf input{display:block;margin:0 auto 8px;border:0;background:none}.wform .ok{font-size:14px;display:flex;gap:8px;align-items:flex-start}.wform .hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}.wform .st{min-height:1.4em;margin:0;font-size:14px}
.pol .ph img{width:100%;height:100%;object-fit:cover}
</style>""",1)
    return t

def simple_collage(t):
    import json as _j
    a=t.index('const DEFAULT={"d"');a2=t.index('{"d"',a);i=t.index('"s": 21}]};',a2)+len('"s": 21}]}')
    o=_j.loads(t[a2:i])
    def pick(lst,spec):
        out=[];used=set()
        for sp in spec:
            for n,it in enumerate(lst):
                if n in used or it['t']!=sp[0] or (len(sp)>6 and it.get('k')!=sp[6]):continue
                it=dict(it);it.update(x=sp[1],y=sp[2],w=sp[3],r=sp[4],z=sp[5]);used.add(n);out.append(it);break
        return out+[it for it in lst if it['t']=='torn']
    o['d']=pick(o['d'],[('p_guitar', 170, 150, 320, -4, 18), ('p_doves', 620, 110, 300, 3, 16), ('p_waves', 1040, 170, 340, -2, 17), ('p_sparklers', 380, 560, 230, 4, 19), ('p_boattop', 860, 590, 280, -3, 20), ('c_jug', 1270, 610, 200, 6, 26), ('c_bird', 1430, 110, 130, -6, 36), ('c_sig', 1230, 885, 230, -5, 40), ('pill', 650, 350, 120, -3, 35, 'paintings'), ('pill', 1010, 893, 130, -3, 35, 'shop'), ('tape', 240, 135, 90, -10, 45), ('tape', 1110, 155, 90, 8, 45)]);o['m']=pick(o['m'],[('p_guitar', 60, 170, 340, -3, 18), ('p_doves', 430, 200, 300, 4, 16), ('p_waves', 60, 640, 330, 3, 17), ('p_boattop', 430, 720, 290, -4, 20), ('p_sparklers', 150, 1040, 260, 4, 19), ('c_jug', 480, 1120, 200, 6, 26), ('c_bird', 640, 150, 110, -6, 36), ('c_sig', 500, 1392, 170, -5, 40), ('pill', 450, 660, 110, -3, 35, 'paintings'), ('pill', 470, 1300, 120, -3, 35, 'shop'), ('tape', 200, 150, 80, -10, 45)])
    t=t[:a2]+_j.dumps(o)+t[i:]
    return t.replace("const STORE='mg-vox-layout-v5'","const STORE='mg-vox-layout-v6'")
def home(t):
    t=simple_collage(t)
    def rep(a,b):
        nonlocal t
        if a not in t:print('HOME MISS',a[:60])
        t=t.replace(a,b)
    i=t.index('<div class="stp rv" style="--rr:-3deg;--img:var(--img-waves)">');j=t.index('</div>\n  </section>',i)
    P=[('gaza','waves',-3),('wb','house',2),('p48','alley',-1.5),('uae','sparklers',2.5),('usa','coast',-2),('cph','boattop',1.5)]
    t=t[:i]+''.join(f'<div class="stp rv" style="--rr:{r}deg;--d:{n%3};--img:url(img/{im}.jpg)"><span class="val">0{n+1}</span><div class="im"></div><div class="tx"><b data-i18n="{k}"></b><small data-i18n="{k}D"></small></div></div>' for n,(k,im,r) in enumerate(P))+'\n    '+t[j:]
    rep("cph:{ar:'كوبنهاغن، الدنمارك',en:'Copenhagen, Denmark'},cphD:{ar:'بطاقاتنا متوفرة هناك',en:'Our postcards are available there'},",
        "cph:{ar:'كوبنهاغن، الدنمارك',en:'Copenhagen, Denmark'},cphD:{ar:'بطاقاتنا متوفرة هناك',en:'Our postcards are available there'},wb:{ar:'الضفة الغربية',en:'West Bank'},wbD:{ar:'رسوماتنا في بيوت الضفة',en:'Our drawings in homes across the West Bank'},p48:{ar:'فلسطين الداخل',en:'Palestine, 1948 lands'},p48D:{ar:'من حيفا إلى الناصرة',en:'From Haifa to Nazareth'},uae:{ar:'الإمارات العربية المتحدة',en:'United Arab Emirates'},uaeD:{ar:'تصل طلباتنا إلى هناك',en:'Our orders reach there'},usa:{ar:'الولايات المتحدة',en:'United States'},usaD:{ar:'تصل طلباتنا إلى هناك',en:'Our orders reach there'},")
    rep("whereT:{ar:'من غزة لكوبنهاغن',en:'From Gaza to Copenhagen'}","whereT:{ar:'من غزة إلى العالم',en:'From Gaza to the world'}")
    rep(".step.s1 .v i{filter:grayscale(1) contrast(1.9) brightness(1.25);opacity:.85}",".step.s1 .v i{background-image:url(img/pencil-guitar.webp);filter:none;opacity:.9}")
    t=t.replace("</style>",""".stamps{grid-template-columns:repeat(3,minmax(0,1fr))!important;row-gap:clamp(30px,4vw,56px)!important}@media(max-width:700px){.stamps{grid-template-columns:repeat(2,minmax(0,1fr))!important}.stp b{font-size:17px!important}}
.step.s3 .v{overflow:hidden;cursor:crosshair}.step.s3 .v::after{content:"";position:absolute;left:0;right:0;top:-30%;height:30%;background:linear-gradient(180deg,transparent,rgba(140,230,190,.0) 40%,rgba(150,240,200,.55) 92%,rgba(255,255,255,.95));box-shadow:0 2px 12px rgba(120,230,180,.7);opacity:0;pointer-events:none}
.step.s3:hover .v::after,.step.s3:focus-within .v::after{opacity:1;animation:mgscan 1.6s cubic-bezier(.45,0,.55,1) infinite}
@keyframes mgscan{from{top:-30%}to{top:100%}}@media(prefers-reduced-motion:reduce){.step.s3:hover .v::after{animation:none;opacity:0}}
#line .prod .art{cursor:zoom-in}
</style>""",1)
    rep("const a=e.target.closest('.add');if(a){cart++;","const pr0=e.target.closest('#line .prod');if(pr0){mgHomeQuick(PRODS[[...pr0.parentNode.querySelectorAll('.prod')].indexOf(pr0)]);return}const a=e.target.closest('.add');if(a){cart++;")
    t=t.replace("/* cart */",r"""function mgHomeQuick(p){if(!p||!window.mgQuick)return;const code={tPost:'PCD',tStk:'STK',tPrint:'PRT'}[p.t]||'PCD',slug={jug:'s-jug',truckfull:'s-truck',bird1:'c-dove',crate:'s-crate'}[p.img]||p.img,d=MG.design(slug);if(!d)return;
  const opt=code==='PCD'?{pack:'P1'}:code==='STK'?{size:'M',finish:'MAT'}:{size:'A4',frame:'NON'};
  mgQuick({img:code==='STK'?(d.stk||d.img):d.img,cut:code==='STK',name:{ar:d.ar,en:d.en},type:MG.type(code),desc:d.d,price:MG.price(code,opt),sku:MG.sku(code,slug,opt),add:()=>MG.cart.add(code,slug,opt,1),href:code==='STK'?'stickers.html':'product.html#'+slug+'&t='+code})}
/* cart */""",1)
    return t
def paintings(t):
    def rep(a,b):
        nonlocal t
        if a not in t:print('PAINT MISS',a[:60])
        t=t.replace(a,b)
    i=t.index("function renderBook(){");j=t.index("$('#bNext').onclick=()=>turn(1);$('#bPrev').onclick=()=>turn(-1);")
    t=t[:i]+r"""let PF=null;
function renderBook(){
  const pg=(k,pencil)=>`<div class="bpage"><div class="pin"><img src="img/${pencil?'pencil-'+k+'.webp':k+'.jpg'}" alt=""></div><span class="cap">${esc(pencil?tr('pencil'):L2(PT.find(p=>p.k===k)))}</span></div>`;
  const pages=[`<div class="bpage hard cover" data-density="hard"><div class="lb"><b>${esc(tr('cover'))}</b><small>MASS &amp; GRASS · SKETCHBOOK</small></div></div>`];
  SK.forEach(k=>{pages.push(pg(k,1),pg(k,0))});
  pages.push(`<div class="bpage endp"><b>${esc(tr('endp'))}</b></div>`,`<div class="bpage endpaper"></div>`,`<div class="bpage hard cover back" data-density="hard"></div>`);
  if(PF){try{PF.destroy()}catch(_){}PF=null}
  const host=$('#sketch .bookwrap');host.innerHTML='<div class="book" id="book"></div>';const el=$('#book');el.innerHTML=pages.join('');
  if(!window.St||!St.PageFlip){el.classList.add('nopf');return}
  PF=new St.PageFlip(el,{width:440,height:600,size:'stretch',minWidth:150,maxWidth:520,minHeight:200,maxHeight:720,showCover:true,maxShadowOpacity:.45,drawShadow:true,flippingTime:900,mobileScrollSupport:true,usePortrait:true});
  PF.loadFromHTML(el.querySelectorAll('.bpage'));
}
"""+t[j:]
    rep("$('#bNext').onclick=()=>turn(1);$('#bPrev').onclick=()=>turn(-1);","$('#bNext').onclick=()=>PF&&PF.flipNext();$('#bPrev').onclick=()=>PF&&PF.flipPrev();")
    rep("bookHint:{ar:'اضغط على الصفحة عشان تقلبها',en:'Tap a page to turn it'}","bookHint:{ar:'اسحبوا طرف الصفحة لتقلبوها',en:'Drag the corner of a page to turn it'}")
    t=t.replace("<head>",'<head><script src="page-flip.js"></script>',1)
    t=t.replace("</style>",""".bookwrap{width:min(960px,94vw);margin:34px auto 0}.bookwrap .book{width:100%!important;aspect-ratio:auto!important;direction:ltr;position:relative}
.bpage{background:#FBF8F1;background-image:linear-gradient(90deg,rgba(0,0,0,.06),transparent 7%,transparent 93%,rgba(0,0,0,.05)),url(img/paper.jpg);background-size:auto,300px;background-blend-mode:multiply;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:9% 8% 7%;box-sizing:border-box;overflow:hidden}
.bpage .pin{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;width:100%}.bpage img{max-width:100%;max-height:100%;object-fit:contain;mix-blend-mode:multiply}
.bpage .cap{margin-top:12px;font:400 15px/1.3 var(--f-script,serif);color:#5b4a37}
.bpage.cover{background:#3E5446;background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.035) 0 2px,transparent 2px 5px),linear-gradient(90deg,rgba(0,0,0,.25),transparent 12%);color:#F3EAD8}
.bpage.cover .lb{background:#F3EAD8;color:#2E241B;padding:18px 22px;text-align:center;box-shadow:0 1px 2px rgba(0,0,0,.3);display:flex;flex-direction:column;gap:6px}.bpage.cover .lb b{font-weight:400;font-size:22px}.bpage.cover .lb small{font-size:11px;letter-spacing:.14em}
.bpage.endpaper{background:#E9DFC9 url(img/paper.jpg) 0 0/260px;background-blend-mode:multiply}.bpage.endp b{font-weight:400;font-size:20px;color:#5b4a37}
.book.nopf{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}.book.nopf .bpage{aspect-ratio:.73}
.bookhint{opacity:1!important;font-size:16px!important}
</style>""",1)
    # the wall hint: readable on any wall colour
    t=t.replace("</style>",".wallnote{background:rgba(30,24,18,.72)!important;color:#FBF6EA!important;padding:9px 14px!important;border-radius:3px;text-shadow:none!important;opacity:1!important;font:500 16px/1.3 var(--f-ar,system-ui)!important;letter-spacing:0!important}\n</style>",1)
    return t
def stickers(t):
    def rep(a,b):
        nonlocal t
        if a not in t:print('STK MISS',a[:60])
        t=t.replace(a,b)
    i=t.index("const SURF={");j=t.index("let surf='laptop'",i)
    t=t[:i]+"""const SURF={laptop:{bg:'#E6DED1',img:'img/obj/laptop.webp',f:.86},notebook:{bg:'#DCD5C8',img:'img/obj/notebook.webp',f:.94},bag:{bg:'#E4DCCD',img:'img/mk/tote-white.webp',f:.96},bottle:{bg:'#D9D3C8',img:'img/obj/bottle.webp',f:.96},phone:{bg:'#E3DCD0',img:'img/obj/phone.webp',f:.94}};
const SL={laptop:{ar:'الحاسوب',en:'Laptop'},notebook:{ar:'الدفتر',en:'Notebook'},bag:{ar:'الحقيبة',en:'Tote bag'},bottle:{ar:'زجاجة الماء',en:'Water bottle'},phone:{ar:'غطاء الهاتف',en:'Phone case'}};
Object.values(SURF).forEach(v=>v.svg=`<img class="sp" src="${v.img}" alt="" style="--f:${v.f}">`);
"""+t[j:]
    rep("esc(L2(T.surf[s]))","esc(L2(SL[s]))")
    rep("""const svg=SURF[surf].svg.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1040" ');
    g.drawImage(await loadImg('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)),0,0,W,H);""","""{const im=await loadImg(SURF[surf].img),k=Math.min(W/im.width,H/im.height)*SURF[surf].f,w=im.width*k,h=im.height*k;g.drawImage(im,(W-w)/2,(H-h)/2,w,h)}""")
    # direct manipulation: drag to move, corner handle to turn and resize, × to remove
    rep("""$('#placed').innerHTML=placed.map((p,i)=>`<div class="pl${i===sel?' sel':''}" data-i="${i}" style="left:${p.x}%;top:${p.y}%;width:${p.w}%;--r:${p.r}deg">${stk(p.k)}</div>`).join('');""",
        """$('#placed').innerHTML=placed.map((p,i)=>`<div class="pl${i===sel?' sel':''}" data-i="${i}" style="left:${p.x}%;top:${p.y}%;width:${p.w}%;--r:${p.r}deg">${stk(p.k)}<i class="hd" aria-hidden="true"></i><b class="rmx" aria-label="${esc(tr('remove'))}">×</b></div>`).join('');""")
    rep("""$('#placed').addEventListener('pointerdown',e=>{const el=e.target.closest('.pl');if(!el)return;e.preventDefault();sel=+el.dataset.i;""",
        """$('#placed').addEventListener('pointerdown',e=>{const el=e.target.closest('.pl');if(!el)return;e.preventDefault();sel=+el.dataset.i;
  if(e.target.closest('.rmx')){placed.splice(sel,1);sel=-1;renderPlaced();return}
  if(e.target.closest('.hd')){const s=$('#stage').getBoundingClientRect(),p=placed[sel],cx=s.left+p.x/100*s.width,cy=s.top+p.y/100*s.height;
    pd={id:e.pointerId,rot:1,cx,cy,a0:Math.atan2(e.clientY-cy,e.clientX-cx),d0:Math.hypot(e.clientX-cx,e.clientY-cy),r0:p.r,w0:p.w,el};el.setPointerCapture(e.pointerId);return}""")
    rep("""$('#placed').addEventListener('pointermove',e=>{if(!pd||e.pointerId!==pd.id)return;const p=placed[sel];""",
        """$('#placed').addEventListener('pointermove',e=>{if(!pd||e.pointerId!==pd.id)return;const p=placed[sel];
  if(pd.rot){p.r=pd.r0+(Math.atan2(e.clientY-pd.cy,e.clientX-pd.cx)-pd.a0)*180/Math.PI;p.w=Math.max(5,Math.min(55,pd.w0*Math.hypot(e.clientX-pd.cx,e.clientY-pd.cy)/pd.d0));pd.el.style.setProperty('--r',p.r+'deg');pd.el.style.width=p.w+'%';return}""")
    t=t.replace("</style>","""#wall,a[href="#wall"],#ctl{display:none!important}
.surf{position:absolute;inset:0;display:grid;place-items:center}.surf .sp{max-width:calc(var(--f)*100%);max-height:calc(var(--f)*100%);object-fit:contain;filter:drop-shadow(0 10px 16px rgba(40,30,20,.22));pointer-events:none}
#stage{background-image:radial-gradient(ellipse at 50% 40%,rgba(255,255,255,.45),transparent 70%),var(--img-paper)!important}
.pl .hd,.pl .rmx{display:none;position:absolute;width:26px;height:26px;border-radius:50%;background:#FBF6EA;border:2px solid #2E241B;box-shadow:0 2px 4px rgba(0,0,0,.3)}
.pl.sel .hd,.pl.sel .rmx{display:grid;place-items:center}.pl .hd{right:-16px;bottom:-16px;cursor:nwse-resize}.pl .hd::after{content:"";width:10px;height:10px;border:2px solid #2E241B;border-left:0;border-top:0;border-radius:0 0 8px 0}
.pl .rmx{left:-16px;top:-16px;font:600 16px/1 system-ui;color:#2E241B;cursor:pointer}
.env{aspect-ratio:1000/1068!important;max-width:380px!important}.envback{background:url(img/obj/envelope-back.webp) 0 0/100% 100% no-repeat!important;border:0!important;border-radius:0!important;filter:drop-shadow(0 12px 18px rgba(40,30,20,.25))}
.envin{inset:22% 9% 18%!important}.envfront{height:57.4%!important;background:url(img/obj/envelope-front.webp) 0 100%/100% auto no-repeat!important;border:0!important;clip-path:none!important;border-radius:0!important;padding-bottom:12%!important}
.envfront b,.envfront span{color:#4A3A28}.envstamp{top:auto!important;bottom:30%!important}
.albpage::before{display:none!important}
.lid{background:url(img/obj/laptop.webp) center/contain no-repeat!important;border:0!important;box-shadow:none!important;aspect-ratio:1193/845!important;display:grid!important;place-items:center!important;filter:drop-shadow(0 16px 20px rgba(40,30,20,.25))}.lid::before,.lid::after{display:none!important}
.card8{background:url(img/obj/bankcard.webp) center/100% 100% no-repeat!important;box-shadow:0 8px 14px -4px rgba(0,0,0,.35)!important;color:transparent!important}.card8 span{display:none}.card8 b{color:#FBF6EA!important}
</style>""",1)
    return t
def calendar(t):
    def rep(a,b):
        nonlocal t
        if a not in t:print('CAL MISS',a[:60])
        t=t.replace(a,b)
    rep("const YEAR=2027;","const YEAR=(d=>d.getMonth()>=8?d.getFullYear()+1:d.getFullYear())(new Date());")
    rep("function seasonsOn(","""/* the year follows today; Ramadan and the two Eids come from the Umm al-Qura calendar, so they move every year by themselves */
for(const k in T)for(const l of ['ar','en'])if(T[k]&&typeof T[k][l]==='string')T[k][l]=T[k][l].replace(/2027|٢٠٢٧/g,String(YEAR));
try{const f=new Intl.DateTimeFormat('en-u-ca-islamic-umalqura',{day:'numeric',month:'numeric'}),H={};for(let d=new Date(YEAR,0,1);d.getFullYear()===YEAR;d.setDate(d.getDate()+1)){const p=f.formatToParts(d),m=+p.find(x=>x.type==='month').value,dd=+p.find(x=>x.type==='day').value;
   if(m===9&&dd===1&&!H.r)H.r=new Date(d);if(m===10&&dd===1&&!H.f)H.f=new Date(d);if(m===12&&dd===10&&!H.a)H.a=new Date(d)}
  const md=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return [x.getMonth()+1,x.getDate()]},set=(k,a,b)=>{const s=SEA.find(x=>x.k===k);if(s&&a)s.r=[[...a,...b]]};
  if(H.r)set('ramadan',md(H.r,0),H.f?md(H.f,-1):md(H.r,29));if(H.f)set('fitr',md(H.f,0),md(H.f,2));if(H.a)set('adha',md(H.a,0),md(H.a,3))}catch(_){}
function seasonsOn(""")
    # seasons: twelve small month cards instead of coloured bars
    i=t.index("function renderYear(){");j=t.index("$('#year').innerHTML=head+rows;\n}",i)+len("$('#year').innerHTML=head+rows;\n}")
    t=t[:i]+r"""function renderYear(){
  $('#year').innerHTML=`<div class="ycards">${M.map((mo,m)=>{const on=SEA.filter(s=>s.r.some(([a,b,c,e])=>a<=m+1&&c>=m+1));
    return `<div class="ycard"><i class="yi" style="--img:var(--img-${mo.k})"></i><b>${esc(mName(m))}</b>${on.map(s=>`<span class="ys" tabindex="0" style="--c:${s.c}"><svg viewBox="0 0 24 24" style="color:${s.c}">${ICON[s.k]}</svg>${esc(L2(s))}<em class="tip">${esc(L2(s.d))}</em></span>`).join('')}</div>`}).join('')}</div>`;
}"""+t[j:]
    # postcards torn off the calendar: what to do with them
    rep("pileN:{ar:'بطاقة معك',en:'postcards'}","pileN:{ar:'بطاقة معكم',en:'postcards'},pileDo:{ar:'اكتبوا على ظهرها وأرسلوها بالبريد، أو علّقوها على الحائط واحدة بعد الأخرى. وعندما تجمعون اثنتي عشرة بطاقة تصبح عندكم سنة كاملة من رسومات فرح، تؤطَّر معاً أو تُحفظ في ألبوم البطاقات.',en:'Write on the back and post it, or pin them on the wall one after another. Collect all twelve and you have a whole year of Farah’s paintings to frame together or keep in a postcard album.'}")
    rep("(ks.length?`<b>${num(ks.length)} ${esc(tr('pileN'))}</b>`:`<b class=\"hint\">${esc(tr('tearHint'))}</b>`)}","(ks.length?`<b>${num(ks.length)} ${esc(tr('pileN'))}</b><p class=\"piledo\">${esc(tr('pileDo'))}</p>`:`<b class=\"hint\">${esc(tr('tearHint'))}</b>`)}")
    # the shelf: every year can be bought, printed or digital
    rep("const YEARS=[{y:2023,k:'boatman',st:'sold'},{y:2024,k:'coast',st:'sold'},{y:2025,k:'wall2025',st:'sold',real:1},{y:2026,k:'hill',st:'sold'},{y:2027,k:COVER,st:'soon'}];",
        "const YK=['boatman','coast','wall2025','hill',COVER,'waves','alley'],YEARS=[];for(let y=2023;y<=YEAR;y++)YEARS.push({y,k:YK[(y-2023)%YK.length],st:y===YEAR?'soon':'',real:y===2025?1:0});")
    rep("<div><b>${num(o.y)}</b><p>${esc(o.real?tr('realYear'):tr('demoYear'))}</p></div></div>`;","<div><b>${num(o.y)}</b><p>${esc(o.real?tr('realYear'):tr('demoYear'))}</p><div class=\"ybuy\">${['WALL','DESK','DIGI'].map(v=>`<button class=\"btn${v==='WALL'?'':' ghost'}\" data-buy=\"${v}\" data-y=\"${o.y}\">${esc(L2(MG.type('CAL').opts[0][1][v]))} · €${MG.price('CAL',{version:v})}</button>`).join('')}</div></div></div>`;")
    rep("$('#books').addEventListener('click',e=>{","$('#opened').addEventListener('click',e=>{const b=e.target.closest('[data-buy]');if(!b)return;MG.cart.add('CAL',null,{version:b.dataset.buy,year:b.dataset.y},1);addBag();toast(tr('added'))});\n$('#books').addEventListener('click',e=>{")
    rep("realYear:{ar:'صفحة حقيقية من تقويم ٢٠٢٥: «الطريق لدير البلح»',en:'A real page from the 2025 calendar: “The road to Deir al-Balah”'}","realYear:{ar:'صفحة حقيقية من تقويم 2025: «الطريق إلى دير البلح»',en:'A real page from the 2025 calendar: “The road to Deir al-Balah”'}")
    # pencil to page: a softer pencil, a different painting
    rep("const PM=3;","const PM=2;")
    rep("nowD:{ar:'اليوم مدوّر بالأحمر، والأيام اللي راحت مشطوبة. هيك بيكون التقويم على مكتبك.',en:'Today is circled in red and the days gone are crossed out. That is how it sits on your desk.'}","nowD:{ar:'اليوم محاط بدائرة حمراء، والأيام الماضية مشطوبة. هكذا يبدو التقويم على حائطكم.',en:'Today is circled in red and the days gone are crossed out. That is how it hangs on your wall.'}")
    rep("roomD:{ar:'نسختين: تقويم حيط كبير، وتقويم مكتب صغير بيوقف لحاله. الغرفة بالمقاس الحقيقي، الطاولة عرضها ١٢٠ سم.',en:'Two versions: a large wall calendar, and a small desk calendar that stands on its own. The room is to scale; the table is 120 cm wide.'}","roomD:{ar:'نسختان: تقويم جداري كبير، وتقويم مكتبي صغير يقف وحده. وكلاهما متاح مطبوعاً أو نسخة رقمية.',en:'Two versions: a large wall calendar and a small desk calendar that stands on its own. Both come printed or as a digital file.'}")
    t=t.replace("</style>","""#hero{transition:background-color 1.2s}#hero.mbg{background-color:color-mix(in srgb,var(--mbg) 26%,transparent)!important}
.cal .wire{background:url(img/obj/binding.webp) center/100% 100% no-repeat!important;height:auto!important;aspect-ratio:1800/143;top:-2.2%!important;left:1%!important;right:1%!important}
.wallcal .string,.wallcal .nail{display:none}
.pg{border:0!important;border-radius:1px!important;background:#FCFAF4 url(img/paper.jpg) 0 0/340px!important;background-blend-mode:multiply!important;box-shadow:0 1px 1px rgba(0,0,0,.08),0 22px 34px -14px rgba(40,30,20,.45),0 3px 0 -1px #efe9dc,0 6px 0 -2px #e6dfcf!important}
.pg .art{box-shadow:inset 0 0 0 1px rgba(0,0,0,.05)}.pg.up{box-shadow:none!important}
.piledo{flex-basis:100%;margin:46px 0 0;font-size:14px;line-height:1.6;max-width:44ch;text-align:start}
.pile{flex-wrap:wrap}
.ycards{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:18px;max-width:1100px;margin:28px auto 0}
@media(max-width:900px){.ycards{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:520px){.ycards{grid-template-columns:repeat(2,minmax(0,1fr))}}
.ycard{background:#FCFAF4 url(img/paper.jpg) 0 0/300px;background-blend-mode:multiply;padding:8px 8px 12px;box-shadow:0 10px 20px -12px rgba(40,30,20,.45);display:flex;flex-direction:column;gap:5px;color:#2E241B}
.ycard .yi{display:block;aspect-ratio:4/3;background:var(--img) center/cover;margin-bottom:4px}.ycard b{font-weight:500;font-size:15px}
.ys{position:relative;display:flex;gap:6px;align-items:center;font-size:12.5px;line-height:1.3}.ys svg{width:15px;height:15px;flex:none}
.ys .tip{display:none;position:absolute;bottom:120%;inset-inline-start:0;z-index:5;background:#2E241B;color:#FBF6EA;font-style:normal;font-size:12px;padding:6px 8px;border-radius:3px;width:180px}.ys:hover .tip,.ys:focus .tip{display:block}
.ybuy{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.ybuy .btn{font-size:13px;padding:8px 12px}
.book .st:empty{display:none}
#proc .l0 i{background-image:url(img/pencil-dovegirl.webp)!important;filter:none!important}
.desk{background:url(img/obj/mock-wall.webp) center/100% 100% no-repeat!important;aspect-ratio:1080/1350;padding:0!important;border-radius:2px;box-shadow:0 20px 40px -20px rgba(40,30,20,.5);max-width:520px;width:100%;margin-inline:auto}
.desk .pencil{display:none}.desk .tent{position:absolute!important;left:26.8%;top:13.4%;width:46.4%!important;height:53.2%;margin:0!important;rotate:0deg!important;filter:none!important}
.desk .tpg{height:100%;box-sizing:border-box;border:0!important;background:transparent!important;mix-blend-mode:multiply;padding:5cqw!important;overflow:hidden}
.roomv{border:0!important;box-shadow:0 20px 40px -20px rgba(40,30,20,.5)!important;background:url(img/obj/mock-wall.webp) center/100% 100% no-repeat;aspect-ratio:1080/1350!important;max-width:460px;width:100%;margin-inline:auto}
.roomv[data-f=desk]{background-image:url(img/obj/mock-desk.webp);aspect-ratio:1440/1080!important;max-width:620px}
.roomv>*:not(.wallv):not(.deskv){display:none!important}
.roomv .wallv,.roomv .deskv{opacity:1!important;filter:none!important;outline:0!important;transform:none!important;rotate:0deg!important}
.roomv[data-f=wall] .deskv,.roomv[data-f=desk] .wallv{display:none!important}
.roomv .wallv{left:26.8%!important;top:13.4%!important;width:46.4%!important;height:53.2%!important;bottom:auto!important}
.roomv .deskv{left:25.8%!important;top:31.8%!important;width:51%!important;height:50%!important;bottom:auto!important}
.roomv .wpage,.roomv .dpage{height:100%!important;box-sizing:border-box;border:0!important;box-shadow:none!important;background:transparent!important;mix-blend-mode:multiply;transform:none!important}
.roomv .rnail{display:none}
</style>""",1)
    # page background follows the month on the hero calendar
    t=t.replace("</body>","""<script>(function(){var P=document.getElementById('pages'),h=document.getElementById('hero');if(!P||!h)return;var C={};
function col(k){if(C[k])return Promise.resolve(C[k]);var v=getComputedStyle(document.documentElement).getPropertyValue('--img-'+k).trim().match(/url\\(["']?(.*?)["']?\\)/);if(!v)return Promise.resolve(null);
 return new Promise(function(res){var im=new Image();im.onload=function(){try{var c=document.createElement('canvas');c.width=c.height=12;var g=c.getContext('2d');g.drawImage(im,0,0,12,12);var d=g.getImageData(0,0,12,12).data,r=0,gg=0,b=0;for(var i=0;i<d.length;i+=4){r+=d[i];gg+=d[i+1];b+=d[i+2]}var n=d.length/4;C[k]='rgb('+(r/n|0)+','+(gg/n|0)+','+(b/n|0)+')';res(C[k])}catch(e){res(null)}};im.onerror=function(){res(null)};im.src=v[1]})}
function upd(){var pg=[].slice.call(P.querySelectorAll('.pg')).filter(function(x){return !x.classList.contains('up')})[0];if(!pg)return;var a=pg.querySelector('.art');var m=a&&(a.getAttribute('style')||'').match(/--img-([\\w-]+)/);if(!m)return;col(m[1]).then(function(c){if(c){h.style.setProperty('--mbg',c);h.classList.add('mbg')}})}
new MutationObserver(upd).observe(P,{subtree:true,attributes:true,attributeFilter:['class'],childList:true});setTimeout(upd,300)})();</script></body>""",1)
    return t
def fix(t,name):
    if name=='calendar':t=calendar(t)
    if name=='stickers':t=stickers(t)
    if name=='paintings':t=paintings(t)
    if name=='index':t=home(t)
    if name=='apparel':t=apparel(t)
    t=assets(t)
    for i,f in IDS.items():t=t.replace('https://claude.ai/artifact/'+i,f)
    t=t.replace(' target="_top"','').replace("' target=\"_top\"'","''")
    t=re.sub(r'const NAVURL=\[[^\]]*\];','const NAVURL='+NAVL+';',t)
    t=t.replace("nav:{ar:['اللوحات'","nav:{ar:['كل المنتجات','اللوحات'").replace("en:['Paintings','Stickers'","en:['All products','Paintings','Stickers'")
    t=re.sub(r'(<a class="bag" id="bagBtn" href=")[^"]*"','\\1checkout.html"',t)
    t=t.replace("'#'+c.k}\"","c.k+'.html'}\"").replace('href="#where" data-i18n="wholesale"','href="wholesale.html" data-i18n="wholesale"').replace('href="#shop" data-i18n="postcards"','href="postcards.html" data-i18n="postcards"')
    t=t.replace('<a href="paintings.html" data-i18n="paintings"></a>','<a href="shop.html" class="mg-allp">كل المنتجات</a><a href="paintings.html" data-i18n="paintings"></a>')
    # Arabic by default
    t=re.sub(r"\(?\(navigator\.language\|\|''\)\.toLowerCase\(\)\.(?:startsWith\('ar'\)|indexOf\('ar'\)[^?]*)\)?\?'ar':'en'\)?","'en'",t)
    t=t.replace("localStorage.getItem('mg-lang')||'ar'","localStorage.getItem('mg-lang')||'en'")
    for a,b in TERMS:t=t.replace(a,b)
    t=formal(t)
    # basket hooks in the designer's pages
    t=t.replace("function addBag(n=1){","function addBag(n=1){try{if(!window._mgSkip)MG.helpers.apparel(ST,n)}catch(_){}")
    t=t.replace("$('#bagBtn').addEventListener('click',e=>{if(bag){e.preventDefault();toast(`${num(bag)} · ${tr('added')}`)}});","")
    t=t.replace("e=>{bagPre++;addBag();","e=>{bagPre++;addBag();try{MG.helpers.calendar(e.currentTarget.id==='preDesk'?'DESK':'WALL')}catch(_){}")
    t=t.replace("function addItem(k,n=1){","function addItem(k,n=1){try{MG.helpers.sticker(k,n)}catch(_){}")
    t=t.replace("cart++;toast(tr('added')+' · '+L2(p)+' · '+size)","location.href='product.html#'+p.k")
    t=t.replace("const a=e.target.closest('.add');if(a){cart++;","const a=e.target.closest('.add');if(a){location.href='shop.html';return;")
    # product / checkout / postcards internal links
    t=t.replace('T.nav[LANG].map(t=>`<a href="#top">${esc(t)}</a>`)','T.nav[LANG].map((t,i)=>`<a href="${'+NAVL+'[i]}">${esc(t)}</a>`)')
    t=t.replace('<a href="#top">${esc(tr(\'home\'))}</a>','<a href="index.html">${esc(tr(\'home\'))}</a>').replace('<a class="logo" href="#top"','<a class="logo" href="index.html"')
    return t+'\n'+SHARED
def product(t):
    a=t.index('const PT=[');b=t.index('const img=')
    t=t[:a]+"const PT=MG.paintings().map(d=>({k:d.slug,ar:d.ar,en:d.en,w:d.where.ar,we:d.where.en,stk:d.stk?d.stk.replace(/^img\\/|\\.webp$/g,''):null,d:d.d}));\nconst AR=Object.fromEntries(MG.DESIGNS.map(d=>[d.slug,d.ratio||1]).concat(MG.DESIGNS.filter(d=>d.stk).map(d=>[d.stk.replace(/^img\\/|\\.webp$/g,''),1])));\n"+t[b:]
    t=t.replace("home:{ar:'الرئيسية',en:'Home'},paintings:","code:{ar:'رمز المنتج',en:'Product code'},home:{ar:'الرئيسية',en:'Home'},paintings:",1)
    t=t.replace('<span class="pnote" id="pnote"></span>','<span class="pnote" id="pnote"></span><span class="pnote" style="width:100%"><span data-t="code"></span>: <b class="num" id="skuV" style="font-family:var(--f-mono)"></b></span>')
    t=t.replace("$('#pnote').textContent=tr(S.mode==='digital'?'pnoteDig':'pnotePrt');","$('#pnote').textContent=tr(S.mode==='digital'?'pnoteDig':'pnotePrt');{const f=MG.fromState(S);$('#skuV').textContent=MG.sku(f.code,S.k,f.opt)}")
    t=t.replace("let BAG=[];try{BAG=JSON.parse(localStorage.getItem('mg-cart-preview')||'[]')}catch(e){BAG=[]}","let BAG=MGCart.items();addEventListener('mg-cart',()=>{BAG=MGCart.items()});")
    t=t.replace("const saveBag=()=>{try{localStorage.setItem('mg-cart-preview',JSON.stringify(BAG))}catch(e){}};","const saveBag=()=>MGCart.save(BAG);")
    t=t.replace("const p=P(),item={id:Date.now(),k:p.k,","const p=P(),f0=MG.fromState(S),item={id:Date.now(),sku:MG.sku(f0.code,p.k,f0.opt),img:MG.design(p.k).img,name:{ar:p.ar,en:p.en},k:p.k,")
    t=t.replace("const same=BAG.find(b=>b.k===item.k&&b.what.en===item.what.en);","const same=BAG.find(b=>b.sku===item.sku);")
    t=t.replace("<small>${esc(b.what[LANG])}</small>","<small>${esc(b.what[LANG])}</small><small class=\"num\" style=\"opacity:.6\">${esc(b.sku||'')}</small>")
    t=t.replace("badge();applyLang();","{const h0=location.hash.slice(1);const d0=MG.design(h0);if(d0&&d0.kind==='painting')S.k=d0.slug}badge();applyLang();")
    t=t.replace("S.k=b.dataset.k;S.view='prod';S.flip=false;renderProduct();","S.k=b.dataset.k;S.view='prod';S.flip=false;try{history.replaceState(null,'','#'+S.k)}catch(_){}renderProduct();")
    t=t.replace("<small class=\"num\">${esc(tr('from'))} €3</small>","<small class=\"num\">D${MG.pad(MG.design(x.k).n)} · ${esc(tr('from'))} €3</small>")
    t=t.replace("$('#goPay').onclick=()=>toast(tr('demoCheckout'));","$('#goPay').onclick=()=>location.href='checkout.html';").replace('<a href="#top">${esc(tr(\'paintings\'))}</a>','<a href="paintings.html">${esc(tr(\'paintings\'))}</a>')
    # real-photo mockups for clothing and bags (no drawn garments)
    t=t.replace("const COLORS=[{c:'#F1EDE3',ar:'أبيض قطن',en:'Natural white'},{c:'#D8D2C2',ar:'إكرو',en:'Ecru'},{c:'#BBAB8E',ar:'رملي',en:'Sand'},{c:'#8C9A78',ar:'مريمية',en:'Sage'},{c:'#B5654A',ar:'طيني',en:'Clay'},{c:'#2E241B',ar:'بنّي غامق',en:'Dark brown'}];",
      "const COLORS=MG.AC.split(' ').map(k=>({c:MG.COLORS[k].hex,k,ar:MG.COLORS[k].ar,en:MG.COLORS[k].en}));const PC={sweat:'SWT',hoodie:'HOD',tote:'TOT'};")
    t=t.replace(" tee:{ar:'تيشيرت',en:'T-shirt',from:28},\n hoodie:{ar:'هودي',en:'Hoodie',from:48},"," hoodie:{ar:'هودي',en:'Hoodie',from:52},\n sweat:{ar:'سويتشيرت',en:'Sweatshirt',from:44},")
    t=t.replace("ICON={","ICON={sweat:'<svg viewBox=\"0 0 44 44\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linejoin=\"round\"><path d=\"M15 6l-10 7 3 23h6V18v20h16V18v18h6l3-23-10-7c-2 3-5 4-7 4s-5-1-7-4z\"/></svg>',",1)
    t=t.replace("    case 'tee':return 28+(S.place==='back'?4:0);\n    case 'hoodie':return 48+(S.place==='back'?4:0);\n    case 'tote':return 22;","    case 'sweat':case 'hoodie':case 'tote':{const f=MG.fromState(S);return MG.price(f.code,f.opt)}")
    t=t.replace("case 'tee':case 'hoodie':return `${pr} ${S.csz} · ${L(c)} · ${placeName(S.place)}`;","case 'sweat':case 'hoodie':return `${pr} ${S.csz} · ${L(c)}`;")
    a=t.index("function garment(kind){");b=t.index("function stageHTML(){")
    t=t[:a]+"function garment(kind,look){const c=COLORS.find(x=>x.c===S.color)||COLORS[0];return MG.mock(PC[kind],S.k,c.k,look)}\n"+t[b:]
    t=t.replace("function stageHTML(){\n  const p=P(),ar=AR[p.k],I=img(p.k);","function stageHTML(){\n  const p=P(),ar=AR[p.k],I=img(p.k);\n  if(S.view==='look'&&PC[S.prod]&&S.mode!=='digital')return `<div class=\"vw\">${garment(S.prod,1)}</div>`;")
    t=t.replace("  return vs.map(([v,l,ic])=>","  if(PC[S.prod]&&S.mode!=='digital')vs.splice(1,0,['look',LANG==='ar'?'على شخص':'Worn','<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\"><circle cx=\"12\" cy=\"6\" r=\"3\"/><path d=\"M5 21v-4a7 7 0 0 1 14 0v4\"/></svg>']);\n  return vs.map(([v,l,ic])=>",1)
    t=t.replace("if(S.prod==='look')","if(0)")
    t=t.replace("        h+=`<span class=\"lbl2\">${esc(tr('place'))}</span><div class=\"seg\" data-g=\"place\">${['chest','back'].map(k=>btn(`data-val=\"${k}\"`,S.place===k,`${esc(placeName(k))}${k==='back'?'<small class=\"num\">+€4</small>':''}`)).join('')}</div>`;\n","")
    t=t.replace("if(d0&&d0.kind==='painting')S.k=d0.slug}","if(d0&&d0.kind==='painting')S.k=d0.slug;const q0=new URLSearchParams(location.hash.slice(1).split('&').slice(1).join('&'));const t0=q0.get('t'),c0=q0.get('c');const PM={PRT:'print',PCD:'postcard',STK:'sticker',HOD:'hoodie',SWT:'sweat',TOT:'tote'};if(t0==='DIG')S.mode='digital';else if(PM[t0])S.prod=PM[t0];const cc=COLORS.find(x=>x.k===c0||MG.CN[x.k]===c0);if(cc)S.color=cc.c}")
    t=t.replace("const h0=location.hash.slice(1);","const h0=location.hash.slice(1).split('&')[0];")
    t=t.replace("</style>",".vw .card{background:url(img/obj/bankcard.webp) center/100% 100% no-repeat!important;border:0!important;color:transparent!important;box-shadow:0 8px 14px -4px rgba(0,0,0,.35);opacity:1!important}.vw>.mgmk{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);height:92%;width:auto}.vw>.mgmk .ph{height:100%;width:auto;max-width:none}.vw>.mgmk.look{height:100%}\n</style>",1)
    return t
def checkout(t):
    t=t.replace("let BAG=JSON.parse(JSON.stringify(SEED)),CODE=null;","let BAG=MGCart.items().map(b=>Object.assign({name:{ar:b.ar,en:b.en},r:((b.id%7)-3)},b)),CODE=null;")
    t=t.replace("const img=k=>`url(img/${k}.jpg)`;","const img=k=>{const d=MG.design(k);return `url(${d?d.img:'img/paper.jpg'})`};")
    t=t.replace('<button type="button" class="btn" id="refill">${esc(tr(\'refill\'))}</button>','').replace("$('#refill').onclick=()=>{BAG=JSON.parse(JSON.stringify(SEED));render()};","")
    t=t.replace('class="btn pri" href="#top">${esc(tr(\'browse\'))}','class="btn pri" href="shop.html">${esc(tr(\'browse\'))}')
    t=t.replace("<span class=\"demo\">${esc(tr('example'))} · ${esc(tr('demo'))}</span>","<span class=\"demo\">${esc(tr('demo'))}</span>")
    t=t.replace("<small>${esc(L(b.what))}</small>\n","<small>${esc(L(b.what))}</small><small class=\"num\" style=\"opacity:.6\">${esc(b.sku||'')}</small>\n")
    t=t.replace("<span><b>${esc(L(b.name))}</b><small>${esc(L(b.what))}</small></span>","<span><b>${esc(L(b.name))}</b><small>${esc(L(b.what))}</small><small class=\"num\" style=\"display:block;opacity:.6\">${esc(b.sku||'')}</small></span>")
    t=t.replace("<div><b>${esc(L(b.name))}</b><small>${esc(L(b.what))}</small><button","<div><b>${esc(L(b.name))}</b><small>${esc(L(b.what))}</small><small class=\"num\">${esc(b.sku||'')}</small><button")
    t=t.replace("p.map(b=>esc(L(b.name))+' · '+esc(L(b.what))).join('<br>')","p.map(b=>esc(L(b.name))+' · '+esc(L(b.what))+' · <span class=\"num\">'+esc(b.sku||'')+'</span>').join('<br>')")
    t=t.replace("go('done');\n});","MGCart.clear();BAG=[];go('done');\n});")
    t=t.replace("function render(){","function render(){if(S.view!=='done')MGCart.save(BAG);")
    t=t.replace("tr('cartT')","tr('cartT')")
    t=t.replace('class="btn pri" href="#top">','class="btn pri" href="shop.html">').replace('<a class="btn" href="#top" style="width:100%;margin-top:12px">','<a class="btn" href="shop.html" style="width:100%;margin-top:12px">').replace('<a class="btn pri" href="#top" id="againBtn"','<a class="btn pri" href="shop.html" id="againBtn"').replace("$('#againBtn').onclick=e=>{e.preventDefault();BAG=JSON.parse(JSON.stringify(SEED));CODE=null;go('cart')};","")
    return t
def postcards(t):
    t=t.replace("const NAV=['paintings.html'","const NAV=['shop.html','paintings.html'").replace("nav:{ar:['اللوحات'","nav:{ar:['كل المنتجات','اللوحات'")
    t=t.replace("$('#addOne').onclick=()=>toast(L(cur())+' · '+tr('added'));","$('#addOne').onclick=()=>{MGCart.add('PCD',cur().k,{pack:'P1'},1);toast(L(cur())+' · '+tr('added'))};")
    t=t.replace("if(S.mode==='print'){toast(L(cur())+' · '+tr('added'));return}","if(S.mode==='print'){MGCart.add('PSM',cur().k,{},1,{what:{ar:'بطاقة مُرسلة إلى: '+($('#to').value||'—'),en:'Mailed to: '+($('#to').value||'—')},note:$('#msg').value});toast(L(cur())+' · '+tr('added'));return}")
    t=t.replace("if(b)toast(L(PACKS[+b.dataset.p])+' · '+tr('added'))","if(b){MGCart.add('PCK',null,{series:['SEA','PPL','HOM','MIX'][+b.dataset.p]},1);toast(L(PACKS[+b.dataset.p])+' · '+tr('added'))}")
    return t
D=S+'/design/full-';src={'index':D+'home.html','story':D+'story.html','paintings':D+'paintings.html','stickers':D+'stickers.html','calendar':D+'calendar.html','apparel':D+'apparel.html','soon':D+'soon.html','product':S+'/product/pub/product.html','checkout':S+'/checkout/pub/checkout.html'}
for n,p in src.items():
    t=open(p,encoding='utf8').read()
    if n=='product':t=product(t)
    if n=='checkout':t=checkout(t)
    t=fix(t,n)
    if n in('product','checkout'):
        exec(open(S+'/ar_mine.py').read(),G:={})
        for x,y in G['R']:t=t.replace("'"+x+"'","'"+y+"'")
    if n in('product','checkout'):t='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><script src="catalog.js"></script>'+t
    open(f'{O}/{n}.html','w').write(t)
p=open(S+'/product/src.html').read();head=p[:p.index('<style>')].replace('Mass &amp; Grass Product','Mass &amp; Grass Postcards')
css=open(S+'/checkout/base.css').read()
hdr=open(S+'/checkout/header.html').read().replace('{{LOGO}}',open(S+'/product/logo.svg').read().strip()).replace('href="#top"','href="index.html"')
b=open(S+'/checkout/pc-body.html').read().replace('{{HEADER}}',hdr).replace('{{FOOTER}}',open(S+'/checkout/footer.html').read())
open(O+'/postcards.html','w').write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><script src="catalog.js"></script>'+fix(postcards(head+'<style>'+css+'</style>\n'+b),'postcards'))
subprocess.run(['python3',S+'/shared/gen_pages.py',S],check=True)
ST=SHARED.replace('<script src="catalog.js"></script>','')
for g in ['shop','books','designs','wholesale','shipping','faq','terms','privacy','contact','track','404','codes']:
    open(f'{O}/{g}.html','a').write(ST)
for f in sorted(os.listdir(O)):
    if f.endswith('.html'):print(f,round(os.path.getsize(O+'/'+f)/1e3),'KB',end=' | ')
shutil.copytree(S+'/site_extra',O,dirs_exist_ok=True)
HS='<script>(function(){var d=document.documentElement,w=function(){var t="light";try{t=localStorage.getItem("mg-theme")||"light"}catch(e){}return t};d.dataset.theme=w();new MutationObserver(function(){var t=w();if(d.dataset.theme!==t)d.dataset.theme=t}).observe(d,{attributes:true,attributeFilter:["data-theme"]})})()</script>'
for f in os.listdir(O):
    if f.endswith('.html'):
        q=open(O+'/'+f).read()
        if HS not in q:
            q=q.replace('<script src="catalog.js"></script>','');H2=HS+'<script src="catalog.js"></script>'
            q=q.replace('<head>','<head>'+H2,1) if '<head>' in q else H2+q
            open(O+'/'+f,'w').write(q)
EOF_MARK=1
