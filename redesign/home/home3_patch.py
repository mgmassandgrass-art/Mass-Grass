import re,sys
p='home3/index.html';t=open(p,encoding='utf8').read()
def rep(a,b,count=1):
    global t
    if a not in t: sys.exit('MISS: '+a[:70])
    t=t.replace(a,b,count)
# light by default (the viewer's own dark theme does not leak in)
rep('<link rel="stylesheet" href="fonts/fonts.css">','<link rel="stylesheet" href="fonts/fonts.css"><script>(function(){var d=document.documentElement,w=function(){var t="light";try{t=localStorage.getItem("mg-theme")||"light"}catch(e){}return t};d.dataset.theme=w();new MutationObserver(function(){var t=w();if(d.dataset.theme!==t)d.dataset.theme=t}).observe(d,{attributes:true,attributeFilter:["data-theme"]})})()</script>')
# words of the hero
rep("kick:{ar:'الموقع الجديد على الطريق',en:'The new website is on its way'}","kick:{ar:'رسومات مائية من غزة',en:'Watercolours from Gaza'}")
rep("soon:{ar:'قريباً',en:'Soon'}","soon:{ar:'ماس وغراس',en:'Mass & Grass'}")
t=re.sub(r"lead:\{ar:'[^']*',en:'[^']*'\}","lead:{ar:'فرح الحلو ترسم بالألوان المائية ناساً وأماكن وأشياء صغيرة من البيت. كل رسمة ملف رقمي تحمّلونه فور الدفع.',en:'Farah Al Helou paints people, places and small things from home in watercolour. Every drawing is a file you can download right after you pay.'}",t,count=1)
rep("document.title=LANG==='ar'?'Mass & Grass · قريباً':'Mass & Grass · Soon';","document.title='Mass & Grass';")
# new words for the new sections
rep("const T={","""const T={
 menu:{ar:'القائمة',en:'Menu'},basket:{ar:'السلة',en:'Basket'},shopNow:{ar:'تصفحوا المتجر',en:'Shop the drawings'},ourStory:{ar:'حكايتنا',en:'Our story'},
 kEnv:{ar:'المتجر',en:'The shop'},envT:{ar:'اختاروا ظرفاً',en:'Pick an envelope'},envD:{ar:'في كل ظرف ركن من رسومات فرح. مرّروا فوقه ليُفتح.',en:'Each envelope holds a corner of Farah’s work. Hover to open it.'},
 cClothing:{ar:'الملابس',en:'Clothing'},cStickers:{ar:'الملصقات',en:'Stickers'},cPaintings:{ar:'اللوحات',en:'Paintings'},cCalendar:{ar:'التقويم السنوي',en:'Calendar'},cPostcards:{ar:'البطاقات البريدية',en:'Postcards'},
 open:{ar:'افتحوه',en:'Open'},
 kLine:{ar:'جديد',en:'Just in'},lineT:{ar:'على الحبل',en:'Fresh off the line'},lineD:{ar:'اسحبوا الحبل لتروا أحدث القطع.',en:'Drag the line to see the newest pieces.'},
 tPost:{ar:'بطاقة بريدية',en:'Postcard'},tStk:{ar:'ملصق',en:'Sticker'},tPrint:{ar:'لوحة',en:'Painting'},
 kStory:{ar:'حكايتنا',en:'Our story'},storyT:{ar:'من غزة، بالألوان المائية',en:'From Gaza, in watercolour'},
 storyP:{ar:'ماس وغراس مشروع من غزة. فرح الحلو ترسم بالألوان المائية ناساً وأماكن وتفاصيل صغيرة من حياتنا، وتصير الرسومات بطاقات وملصقات وتقاويم وملابس.',en:'Mass & Grass is a project from Gaza. Farah Al Helou paints people, places and small details of our life in watercolour, and her drawings become postcards, stickers, calendars and clothes.'},
 storyGo:{ar:'اقرؤوا حكاية فرح',en:'Read Farah’s story'},
 fShop:{ar:'المتجر',en:'Shop'},fInfo:{ar:'معلومات',en:'Info'},ship:{ar:'الشحن عند الطلب إلى الإمارات وبلجيكا والدنمارك وفلسطين والولايات المتحدة',en:'Shipping on request to the UAE, Belgium, Denmark, Palestine and the USA'},""")
# header: menu on the left, basket on the right (same buttons as the soon page)
rep('<div class="lt"><button class="txt" id="langBtn">EN</button></div>','<div class="lt"><button id="menuBtn" data-tl="menu"><svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="square"><path d="M3 7h20M3 13h20M3 19h20"/></svg></button><button class="txt" id="langBtn">EN</button></div>')
rep('<div class="rt"><button id="themeBtn"','<div class="rt"><button id="bagBtn" data-tl="basket"><svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M4.5 8.5h17l-1 14h-15z"/><path d="M9 8.5V7a4 4 0 0 1 8 0v1.5"/></svg></button><button id="themeBtn"')
# hero: two buttons instead of the email form
rep('<div class="row2">','<div class="row2 hbtns"><a class="btn" href="#envs2" data-t="shopNow"></a><a class="btn ghost" href="#story2" data-t="ourStory"></a></div><div class="row2 oldmail" hidden>')
# new sections after the hero; the soon page's own extra sections stay out of view
ENV=[('cClothing','tee-photo'),('cStickers','s-dove'),('cPaintings','guitar'),('cCalendar','sparklers'),('cPostcards','p-sea')]
envs=''.join(f'<a class="env5 rv" href="#envs2" style="--d:{i}"><span class="ein"></span><span class="lt2"><span class="letter2"><i class="pic" style="--img:var(--img-{img})"></i><b data-t="{k}"></b><small data-t="open"></small></span></span><span class="epk"></span><span class="flap"><span class="fo"><i class="seal"></i></span><span class="fi"></span></span><span class="lab" data-t="{k}"></span></a>' for i,(k,img) in enumerate(ENV))
LINE=[('p-sea','tPost'),('s-lemons','tStk'),('dovegirl','tPrint'),('p-boat','tPost'),('s-heart','tStk'),('p-whale','tPrint'),('p-poppies','tPost'),('s-elephant','tStk'),('p-moon','tPrint'),('p-tree','tPost')]
line=''.join(f'<figure class="hang" style="--i:{i}"><span class="peg"></span><span class="card{" cut" if t2=="tStk" else ""}"><i style="--img:var(--img-{k})"></i></span><figcaption data-t="{t2}"></figcaption></figure>' for i,(k,t2) in enumerate(LINE))
new=f'''
  <section class="sec" id="envs2"><div class="center rv"><span class="kick" data-t="kEnv"></span><h2 class="h2" data-t="envT"></h2><p class="sub" data-t="envD"></p></div><div class="envrow">{envs}</div></section>
  <section class="sec" id="line2"><div class="lhead rv"><div><span class="kick" data-t="kLine"></span><h2 class="h2" data-t="lineT"></h2></div><p class="sub" data-t="lineD"></p></div>
    <div class="lwrap" id="lwrap"><svg class="rope" id="rope" preserveAspectRatio="none" aria-hidden="true"><path id="ropeP" fill="none" stroke="#6f5e4b" stroke-width="2.4"/></svg><div class="ltrack" id="ltrack">{line}</div></div></section>
  <section class="sec" id="story2"><div class="sgrid"><div class="sletter ppr rv"><span class="kick" data-t="kStory"></span><h2 class="h2" data-t="storyT"></h2><p data-t="storyP"></p><div class="sig2"></div><a class="btn" href="#story2" data-t="storyGo"></a></div><div class="spics rv" style="--d:1"><i class="sp1" style="--img:var(--img-p-cartgirl)"></i><i class="sp2" style="--img:var(--img-coast)"></i><i class="sp3" style="--img:var(--img-s-gaza)"></i></div></div></section>
'''
rep('<!-- 2. scratch a painting -->',new+'  <!-- 2. scratch a painting -->')
# footer: the soon footer, with the site's links
rep('<div class="fgrid"><h3 data-t="handPainted"></h3><div class="flinks" id="flinks"></div></div>','<div class="fgrid"><h3 data-t="handPainted"></h3><div class="flinks" id="flinks"></div><nav class="fnav"><b data-t="fShop"></b><a href="#envs2" data-t="cPaintings"></a><a href="#envs2" data-t="cPostcards"></a><a href="#envs2" data-t="cStickers"></a><a href="#envs2" data-t="cClothing"></a><a href="#envs2" data-t="cCalendar"></a></nav><nav class="fnav"><b data-t="fInfo"></b><a href="#story2" data-t="ourStory"></a><span class="fship" data-t="ship"></span></nav></div>')
CSS=r'''
#peek,#wall,#coming{display:none!important}
:root{--img-env-in:url(assets/env-inside.webp);--img-env-pk:url(assets/env-pocket.webp);--img-flap-o:url(assets/flap-out.webp);--img-flap-i:url(assets/flap-in.webp);--img-seal:url(assets/seal.webp);--img-sig:url(assets/signature.png)}
.hbtns{gap:14px!important}
.hdr #menuBtn,.hdr #bagBtn{pointer-events:auto}
/* five envelopes: the envelope from the start of the story page */
.envrow{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:clamp(18px,2.6vw,40px);max-width:1240px;margin:clamp(40px,5vw,70px) auto 0;padding-top:60px}
.env5{position:relative;display:block;aspect-ratio:1200/840;text-decoration:none;color:#2E241B;perspective:900px}
.env5>span{position:absolute;display:block}
.env5 .ein{inset:0;background:var(--img-env-in) center/100% 100%;z-index:1;box-shadow:4px 5px 0 var(--shadow)}
.env5 .epk{inset:0;background:var(--img-env-pk) center/100% 100%;z-index:3}
.env5 .lt2{left:7%;right:7%;bottom:6%;top:-90%;z-index:2;overflow:hidden;pointer-events:none}
.env5 .letter2{position:absolute;left:0;right:0;bottom:0;height:88%;transform:translateY(64%);transition:transform .7s cubic-bezier(.2,.9,.25,1) .1s;
  background:#FCF8EE var(--img-paper);background-size:240px;box-shadow:2px 3px 0 rgba(46,36,27,.45);
  background-image:var(--img-paper),repeating-linear-gradient(transparent 0 13px,rgba(91,134,168,.22) 13px 14px);display:flex;flex-direction:column;align-items:center;gap:6px;padding:9% 8%}
.env5 .pic{display:block;width:100%;aspect-ratio:4/3;background:var(--img) center/cover;box-shadow:0 1px 2px rgba(0,0,0,.15)}
.env5 .letter2 b{font:400 clamp(15px,1.4vw,19px)/1 var(--f-disp);text-transform:uppercase;letter-spacing:.02em}
body[data-lang=ar] .env5 .letter2 b{font-family:var(--f-ar-disp);text-transform:none}
.env5 .letter2 small{font:500 11px var(--f-mono);color:var(--red)}
.env5 .flap{left:0;right:0;top:0;height:45%;z-index:4;transform-origin:50% 0;transform-style:preserve-3d;transition:transform .6s cubic-bezier(.4,0,.2,1),z-index 0s .3s}
.env5 .flap>span{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;background:center/100% 100% no-repeat}
.env5 .flap .fo{background-image:var(--img-flap-o)}.env5 .flap .fi{background-image:var(--img-flap-i);transform:rotateX(180deg)}
.env5 .seal{position:absolute;display:block;width:30%;aspect-ratio:1;left:35%;top:72%;background:var(--img-seal) center/contain no-repeat;transition:opacity .2s}
.env5 .lab{left:0;right:0;top:calc(100% + 14px);text-align:center;font:400 18px/1 var(--f-disp);text-transform:uppercase;color:var(--ink)}
body[data-lang=ar] .env5 .lab{font-family:var(--f-ar-disp);text-transform:none;font-size:20px}
.env5:hover .flap,.env5:focus-visible .flap{transform:rotateX(-180deg);z-index:0;transition:transform .6s cubic-bezier(.4,0,.2,1),z-index 0s}
.env5:hover .seal,.env5:focus-visible .seal{opacity:0}
.env5:hover .letter2,.env5:focus-visible .letter2{transform:translateY(0)}
.env5:focus-visible{outline:2px solid var(--red);outline-offset:6px}
@media (hover:none){.env5 .flap{transform:rotateX(-180deg);z-index:0}.env5 .seal{opacity:0}.env5 .letter2{transform:translateY(22%)}}
/* the line: a real scroll, the cord sags between pegs, pieces sway on their own */
.lhead{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap;max-width:1240px;margin:0 auto}
.lwrap{position:relative;margin-top:30px}
.ltrack{display:flex;gap:clamp(24px,3vw,44px);overflow-x:auto;scroll-snap-type:x proximity;scroll-behavior:smooth;padding:34px clamp(16px,5vw,80px) 40px;scrollbar-width:none;cursor:grab;overscroll-behavior-x:contain}
.ltrack::-webkit-scrollbar{display:none}.ltrack.drag{cursor:grabbing;scroll-snap-type:none;scroll-behavior:auto}
.rope{position:absolute;left:0;top:0;width:100%;height:120px;pointer-events:none;z-index:0}
.hang{position:relative;flex:none;margin:0;scroll-snap-align:center;transform-origin:50% 0;animation:sway 5.5s ease-in-out infinite;animation-delay:calc(var(--i)*-.7s);z-index:1}
.hang .peg{position:absolute;left:50%;top:-16px;width:12px;height:30px;translate:-50% 0;background:linear-gradient(90deg,#b98a57,#d9ab72 50%,#a77845);border-radius:2px;box-shadow:1px 2px 0 rgba(46,36,27,.3);z-index:2}
.hang .card{display:block;width:clamp(150px,16vw,210px);aspect-ratio:3/4;background:#fff;padding:6%;box-shadow:0 1px 1px rgba(0,0,0,.08),0 16px 22px -12px rgba(40,30,20,.45)}
.hang .card i{display:block;width:100%;height:100%;background:var(--img) center/cover}
.hang .card.cut{background:none;box-shadow:none;padding:0;aspect-ratio:1}.hang .card.cut i{background-size:contain;background-repeat:no-repeat;filter:drop-shadow(0 6px 8px rgba(40,30,20,.3))}
.hang figcaption{margin-top:10px;text-align:center;font:500 11px var(--f-mono);letter-spacing:.08em;text-transform:uppercase;color:var(--ink);opacity:.75}
@keyframes sway{0%,100%{rotate:-1.6deg}50%{rotate:1.6deg}}
/* our story */
.sgrid{display:grid;grid-template-columns:1.1fr 1fr;gap:clamp(30px,5vw,80px);align-items:center;max-width:1180px;margin:0 auto}
.sletter{background:#FCF8EE var(--img-paper);background-image:var(--img-paper),repeating-linear-gradient(transparent 0 31px,rgba(91,134,168,.2) 31px 32px);padding:clamp(26px,4vw,48px);border:2.5px solid var(--ink);box-shadow:6px 7px 0 var(--shadow);rotate:-1deg;color:#2E241B}
.sletter p{font-size:17px;line-height:2;margin:14px 0 18px;max-width:52ch}
.sig2{width:180px;aspect-ratio:2.56;background:var(--img-sig) center/contain no-repeat;margin-bottom:18px}
.spics{position:relative;aspect-ratio:1/1}
.spics i{position:absolute;display:block;background:#fff var(--img) center/cover;border:10px solid #fff;box-shadow:0 1px 1px rgba(0,0,0,.08),0 18px 26px -14px rgba(40,30,20,.5)}
.spics .sp1{left:4%;top:6%;width:56%;aspect-ratio:.8;rotate:-4deg}.spics .sp2{right:2%;bottom:10%;width:52%;aspect-ratio:1.3;rotate:3deg}
.spics .sp3{right:16%;top:2%;width:26%;aspect-ratio:1;border:0;background-color:transparent;background-size:contain;background-repeat:no-repeat;box-shadow:none;filter:drop-shadow(0 6px 6px rgba(40,30,20,.3));rotate:8deg}
/* footer links */
.fnav{display:flex;flex-direction:column;gap:6px;font-size:14px}.fnav b{font:600 11px var(--f-mono);letter-spacing:.18em;text-transform:uppercase;opacity:.7;margin-bottom:4px}.fnav a{text-decoration:none;color:inherit;opacity:.88}.fnav a:hover{opacity:1;text-decoration:underline}
.fship{opacity:.7;font-size:13px;max-width:30ch}
@media (max-width:900px){.envrow{grid-template-columns:repeat(2,minmax(0,1fr));row-gap:90px}.sgrid{grid-template-columns:1fr}}
@media (prefers-reduced-motion:reduce){.hang{animation:none}.env5 .flap,.env5 .letter2{transition:none}}
'''
rep('</style>',CSS+'</style>')
JS=r'''<script>
(function(){
  var tr=document.getElementById('ltrack'),P=document.getElementById('ropeP'),S=document.getElementById('rope'),W=document.getElementById('lwrap');if(!tr)return;
  /* drag with the mouse; touch scrolls natively */
  var down=false,sx=0,sl=0,moved=0;
  tr.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse')return;down=true;moved=0;sx=e.clientX;sl=tr.scrollLeft;tr.classList.add('drag');tr.setPointerCapture(e.pointerId)});
  tr.addEventListener('pointermove',function(e){if(!down)return;moved=Math.abs(e.clientX-sx);tr.scrollLeft=sl-(e.clientX-sx)});
  var up=function(){if(!down)return;down=false;tr.classList.remove('drag')};tr.addEventListener('pointerup',up);tr.addEventListener('pointercancel',up);
  /* the cord: sags between pegs and follows the scroll */
  function rope(){var r=W.getBoundingClientRect(),pg=[].map.call(tr.querySelectorAll('.peg'),function(p){var b=p.getBoundingClientRect();return [b.left+b.width/2-r.left,b.top+8-r.top]});
    if(!pg.length)return;var w=r.width;S.setAttribute('viewBox','0 0 '+w+' 120');var pts=[[-20,pg[0][1]+10]].concat(pg,[[w+20,pg[pg.length-1][1]+10]]),d='M'+pts[0][0]+','+pts[0][1];
    for(var i=1;i<pts.length;i++){var a=pts[i-1],b=pts[i],sag=Math.min(28,Math.abs(b[0]-a[0])*.08);d+=' Q'+((a[0]+b[0])/2)+','+((a[1]+b[1])/2+sag)+' '+b[0]+','+b[1]}P.setAttribute('d',d)}
  var raf=0;function loop(){rope();raf=requestAnimationFrame(loop)}
  var io='IntersectionObserver' in window?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){if(!raf)loop()}else{cancelAnimationFrame(raf);raf=0}})}):null;
  if(io)io.observe(W);else loop();
})();
</script>
</html>'''
t=t.rstrip()
if t.endswith('</html>'):t=t[:-7]
t=t+JS
open(p,'w',encoding='utf8').write(t)
print('ok')
