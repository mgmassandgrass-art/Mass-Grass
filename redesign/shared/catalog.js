/* Mass & Grass catalogue + basket.
   One list of designs and one list of product types. Every sellable variant gets its code (SKU)
   automatically: MG-<TYPE>-<DESIGN NO.>-<OPTIONS…>, e.g. MG-HOD-002-M-SGE.
   Adding a design = adding one line to DESIGNS; its number and all its codes follow.
   The same code is the Printful variant's "SKU / external ID", so an order can be traced end to end. */
(function(){
'use strict';
/* ---------- designs (number = order added; never reuse a number) ---------- */
const DESIGNS=[
 {n:1,slug:'guitar',kind:'painting',ar:'تحت الشجر',en:'Under the trees',img:'img/guitar.jpg',ratio:.7811,stk:'img/s-guitar.webp',where:{ar:'دير البلح',en:'Deir al-Balah'},d:{ar:'فتاة تعزف على الجيتار تحت أشجار خضراء كثيفة، جالسة على بطانية مرقّعة بين الورود.',en:'A girl playing the guitar under dense green trees, on a patchwork blanket among the flowers.'}},
 {n:2,slug:'dovegirl',kind:'painting',ar:'الحمام',en:'The doves',img:'img/dovegirl.jpg',ratio:1.3294,stk:'img/s-dovegirl.webp',where:{ar:'غزة',en:'Gaza'},d:{ar:'فتاة بثوب مطرّز، والحمام يطير حولها حاملاً أغصان الزيتون.',en:'A girl in an embroidered dress, with doves carrying olive branches.'}},
 {n:3,slug:'sparklers',kind:'painting',ar:'ليلة الشرارات',en:'Sparkler night',img:'img/sparklers.jpg',ratio:.7233,stk:'img/s-sparklers.webp',where:{ar:'غزة',en:'Gaza'},d:{ar:'أيادٍ ترفع الشرارات تحت سماء مليئة بالنجوم والهلال.',en:'Hands raising sparklers under a sky full of stars and a crescent moon.'}},
 {n:4,slug:'seafish',kind:'painting',ar:'الصيد في بحر غزة',en:"Fishing in Gaza's sea",img:'img/seafish.jpg',ratio:.6744,where:{ar:'بحر غزة',en:"Gaza's sea"},d:{ar:'قارب صيد صغير في وسط بحر غزة الأزرق.',en:"A small fishing boat in the middle of Gaza's blue sea."}},
 {n:5,slug:'coast',kind:'painting',ar:'ساحل غزة',en:'Gaza coast',img:'img/coast.jpg',ratio:1.4151,where:{ar:'الساحل',en:'The coast'},d:{ar:'خيمة بيضاء على الرمل أمام البحر وقت الغروب.',en:'A white tent on the sand facing the sea at sunset.'}},
 {n:6,slug:'boattop',kind:'painting',ar:'القارب من الأعلى',en:'Boat from above',img:'img/boattop.jpg',ratio:.9389,where:{ar:'بحر غزة',en:"Gaza's sea"},d:{ar:'قارب يُرى من الأعلى بين أوراق الشجر والسمك، وفيه شخصان بالقبعات.',en:'A boat seen from above among leaves and fish, with two people in hats.'}},
 {n:7,slug:'blueflowers',kind:'painting',ar:'الزهور الزرقاء',en:'Blue flowers',img:'img/blueflowers.jpg',ratio:1.391,where:{ar:'غزة',en:'Gaza'},d:{ar:'حمامة بيضاء تطير فوق زهور زرقاء، وطفلة صغيرة بفستان أحمر.',en:'A white dove over blue flowers, and a little girl in a red dress.'}},
 {n:8,slug:'alley',kind:'painting',ar:'الزقاق',en:'The alley',img:'img/alley.jpg',ratio:.8411,stk:'img/s-alley.webp',where:{ar:'غزة',en:'Gaza'},d:{ar:'زقاق ضيق بين البيوت، بنوافذ وأسلاك وظل.',en:'A narrow alley between houses, with windows, wires and shade.'}},
 {n:9,slug:'waves',kind:'painting',ar:'الأمواج',en:'The waves',img:'img/waves.jpg',ratio:1.473,stk:'img/s-waves.webp',where:{ar:'شاطئ غزة',en:'Gaza shore'},d:{ar:'موج أبيض يضرب الصخر على الشاطئ.',en:'White waves breaking on the rocks by the shore.'}},
 {n:10,slug:'house',kind:'painting',ar:'البيت والحديقة',en:'House & garden',img:'img/house.jpg',ratio:1.3413,where:{ar:'دير البلح',en:'Deir al-Balah'},d:{ar:'بيت حجري بسيط أمامه حديقة خضراء وممرات.',en:'A simple stone house with a green garden and paths in front.'}},
 {n:11,slug:'deirbalah',kind:'painting',ar:'الطريق إلى دير البلح',en:'Road to Deir al-Balah',img:'img/deirbalah.jpg',ratio:.815,where:{ar:'دير البلح',en:'Deir al-Balah'},d:{ar:'طريق بين النخيل، والأرض صفراء مزهرة.',en:'A road between palm trees, the ground yellow with flowers.'}},
 {n:12,slug:'hill',kind:'painting',ar:'القارب',en:'The boat',img:'img/hill.jpg',ratio:1.0112,where:{ar:'المنطقة الوسطى',en:'Middle Area'},d:{ar:'تلال على الساحل، في قرية بالمنطقة الوسطى، خلال النزوح.',en:'Hills by the coast, in a village of the Middle Area, during displacement.'}},
 {n:13,slug:'boatman',kind:'painting',ar:'القارب الصغير',en:'The little boat',img:'img/boatman.jpg',ratio:1.297,stk:'img/s-boat.webp',where:{ar:'بحر غزة',en:"Gaza's sea"},d:{ar:'قارب خشبي صغير على طرف بحر فيروزي.',en:'A small wooden boat at the edge of a turquoise sea.'}},
 {n:14,slug:'c-dove',kind:'mark',ar:'الحمامة الزرقاء',en:'The blue dove',img:'img/c-dove.webp',stk:'img/s-dove.webp',d:{ar:'حمامة زرقاء بضربة فرشاة واحدة.',en:'A blue dove in a single brushstroke.'}},
 {n:15,slug:'c-gaza',kind:'mark',ar:'غزة',en:'Gaza',img:'img/c-gaza.webp',stk:'img/s-gaza.webp',d:{ar:'اسم المدينة بخط عريض وأحمر.',en:'The city’s name in bold red letters.'}},
 {n:16,slug:'c-love',kind:'mark',ar:'من غزة مع الحب',en:'From Gaza with love',img:'img/c-love.webp',stk:'img/s-love.webp',d:{ar:'كآخر سطر في البطاقة البريدية.',en:'Like the last line of a postcard.'}},
 {n:17,slug:'c-star',kind:'mark',ar:'نجمة التطريز',en:'Tatreez star',img:'img/c-star.webp',stk:'img/s-star.webp',d:{ar:'نجمة ثمانية من غرز التطريز الفلسطيني.',en:'An eight-point star of Palestinian cross-stitch.'}},
 {n:18,slug:'c-moon',kind:'mark',ar:'الهلال',en:'The crescent',img:'img/c-moon.webp',stk:'img/s-moon.webp',d:{ar:'هلال أصفر من ليلة العيد.',en:'A yellow crescent from the night before Eid.'}},
 {n:19,slug:'postmark',kind:'mark',ar:'ختم البريد',en:'The postmark',img:'img/postmark2.png',d:{ar:'ختم بريد، كأن القطعة رسالة وصلت من غزة.',en:'A postmark, as if the piece were a letter from Gaza.'}},
 {n:20,slug:'s-jug',kind:'sticker',ar:'إبريق الفخار',en:'The clay jug',img:'img/s-jug.webp',stk:'img/s-jug.webp',d:{ar:'إبريق فخار عليه نقش، كالذي كان في كل بيت.',en:'A painted clay jug like the one in every home.'}},
 {n:21,slug:'s-truck',kind:'sticker',ar:'تكتك الليمون',en:'The lemon truck',img:'img/s-truck.webp',stk:'img/s-truck.webp',d:{ar:'التكتك محمّلاً بالليمون.',en:'The tuk-tuk loaded with lemons.'}},
 {n:22,slug:'s-heart',kind:'sticker',ar:'قلب مطرّز',en:'Stitched heart',img:'img/s-heart.webp',stk:'img/s-heart.webp',d:{ar:'قلب مطرّز غرزة غرزة.',en:'A heart stitched stitch by stitch.'}},
 {n:23,slug:'s-leaf',kind:'sticker',ar:'ورقة خريف',en:'Autumn leaf',img:'img/s-leaf.webp',stk:'img/s-leaf.webp',d:{ar:'ورقة شجر سقطت عن الغصن وما زال لونها دافئاً.',en:'A fallen leaf, still warm in colour.'}},
 {n:24,slug:'s-candle',kind:'sticker',ar:'الشمعة',en:'The candle',img:'img/s-candle.webp',stk:'img/s-candle.webp',d:{ar:'شمعة صغيرة لليالي الطويلة.',en:'A small candle for long nights.'}},
 {n:25,slug:'s-crate',kind:'sticker',ar:'صندوق الخضار',en:'Vegetable crate',img:'img/s-crate.webp',stk:'img/s-crate.webp',d:{ar:'صندوق خشبي مليء بالخضار، وبجانبه بطيخة.',en:'A wooden crate full of vegetables, with a watermelon.'}},
 {n:26,slug:'s-bahr',kind:'sticker',ar:'بحر',en:'Bahr (sea)',img:'img/s-bahr.webp',stk:'img/s-bahr.webp',d:{ar:'"بحر" بالعربية، كلمة واحدة تكفي.',en:'"Bahr", Arabic for sea. One word is enough.'}},
 {n:27,slug:'s-quote',kind:'sticker',ar:'قلبي يخفق',en:'My heart beats',img:'img/s-quote.webp',stk:'img/s-quote.webp',d:{ar:'سطر بخط فرح من دفترها.',en:'A line in Farah’s hand from her sketchbook.'}},
 {n:28,slug:'s-logo',kind:'sticker',ar:'ماس وغراس',en:'Mass & Grass',img:'img/s-logo.webp',stk:'img/s-logo.webp',d:{ar:'شعارنا على دائرة خضراء.',en:'Our logo on a green circle.'}}
];
/* ---------- product types ----------
   code: 3-letter type in the SKU · for: which design kinds it is made for · opts: option groups in SKU order
   fulfil: printful | digital | studio (made and shipped by us) · printful: the Printful catalogue product to link */
const AC='WHT CHR SGE SND CLY';
const COLORS={CHR:{hex:'#3B3835',ar:'فحمي',en:'Charcoal'},ECR:{hex:'#D8D2C2',ar:'إكرو',en:'Ecru'},WHT:{hex:'#F1EDE3',ar:'أبيض',en:'White'},SND:{hex:'#D9C19D',ar:'رملي',en:'Sand'},SGE:{hex:'#8C9A78',ar:'مريمية',en:'Sage'},OLV:{hex:'#737362',ar:'زيتي',en:'Olive'},CLY:{hex:'#B8633D',ar:'طيني',en:'Clay'},BRN:{hex:'#2E241B',ar:'بنّي داكن',en:'Dark brown'},NAT:{hex:'#F1EDE3',ar:'طبيعي',en:'Natural'},BLK:{hex:'#2a2622',ar:'أسود',en:'Black'}};
const SZ=['S','M','L','XL','XXL'];
const TYPES=[
 {code:'DIG',ar:'نسخة رقمية',en:'Digital file',for:['painting'],fulfil:'digital',page:'product.html',opts:[['file',{WAL:{ar:'خلفية للهاتف والحاسوب',en:'Phone & desktop wallpaper',p:3},PRN:{ar:'ملف للطباعة حتى A3',en:'Print file up to A3',p:8},FUL:{ar:'الملف الكامل حتى 50×70',en:'Full scan up to 50×70',p:14}}]]},
 {code:'PRT',ar:'طبعة فنية',en:'Art print',for:['painting'],fulfil:'printful',printful:'Enhanced Matte Paper Poster (cm) / Framed poster',page:'product.html',opts:[['size',{A4:{ar:'21 × 30 سم',en:'21 × 30 cm',p:18},A3:{ar:'30 × 40 سم',en:'30 × 40 cm',p:28},B2:{ar:'50 × 70 سم',en:'50 × 70 cm',p:45}}],['frame',{NON:{ar:'دون برواز',en:'No frame',p:0},BLK:{ar:'برواز أسود',en:'Black frame',p:24},OAK:{ar:'برواز خشب',en:'Oak frame',p:28},WHT:{ar:'برواز أبيض',en:'White frame',p:24}}]]},
 {code:'PCD',ar:'بطاقة بريدية',en:'Postcard',for:['painting'],fulfil:'printful',printful:'Standard Postcard',page:'product.html',opts:[['pack',{P1:{ar:'بطاقة واحدة',en:'Single',p:3},P5:{ar:'رزمة 5',en:'Pack of 5',p:12},P10:{ar:'رزمة 10',en:'Pack of 10',p:20}}]]},
 {code:'STK',ar:'ملصق',en:'Sticker',for:['painting','mark','sticker'],needs:'stk',fulfil:'printful',printful:'Kiss-Cut Stickers',page:'stickers.html',opts:[['size',{S:{ar:'5 سم',en:'5 cm',p:2},M:{ar:'7.5 سم',en:'7.5 cm',p:3},L:{ar:'10 سم',en:'10 cm',p:4}}],['finish',{MAT:{ar:'مطفي',en:'Matte',p:0},GLS:{ar:'لامع',en:'Gloss',p:0}}]]},
 {code:'HOD',ar:'هودي',en:'Hoodie',for:['painting','mark'],fulfil:'printful',printful:'Unisex Heavy Blend Hoodie | Gildan 18500',page:'product.html',opts:[['size',Object.fromEntries(SZ.map(s=>[s,{ar:s,en:s,p:0}]))],['color',pick(AC)]],base:52},
 {code:'SWT',ar:'سويتشيرت',en:'Sweatshirt',for:['painting','mark'],fulfil:'printful',printful:'Unisex Crew Neck Sweatshirt | Gildan 18000',page:'product.html',opts:[['size',Object.fromEntries(SZ.map(s=>[s,{ar:s,en:s,p:0}]))],['color',pick(AC)]],base:44},
 {code:'TOT',ar:'حقيبة قماشية',en:'Tote bag',for:['painting','mark'],fulfil:'printful',printful:'Eco Tote Bag',page:'product.html',opts:[['color',pick(AC)]],base:22},
 {code:'CAP',ar:'قبعة',en:'Cap',for:['mark'],fulfil:'printful',printful:'Dad Hat (embroidered)',page:'product.html',opts:[['color',pick(AC)]],base:24},
 {code:'CAL',ar:'التقويم السنوي',en:'Yearly calendar',for:['calendar'],fulfil:'printful',printful:'Wall Calendar (metric) / desk calendar made by us; DIGI = digital file',page:'calendar.html',opts:[['version',{WALL:{ar:'تقويم جداري مطبوع',en:'Printed wall calendar',p:24},DESK:{ar:'تقويم مكتبي مطبوع',en:'Printed desk calendar',p:16},DIGI:{ar:'نسخة رقمية للطباعة في البيت',en:'Digital, print at home',p:8}}]]},
 {code:'PCK',ar:'مجموعة بطاقات',en:'Postcard pack',for:['pack'],fulfil:'printful',printful:'Standard Postcard (bundle)',page:'postcards.html',opts:[['series',{SEA:{ar:'البحر · 5',en:'The sea · 5',p:12},PPL:{ar:'الناس · 5',en:'People · 5',p:12},HOM:{ar:'البيت · 5',en:'Home · 5',p:12},MIX:{ar:'اختيارك · 10',en:'Your pick · 10',p:20}}]]},
 {code:'PSM',ar:'بطاقة مُرسلة بالبريد',en:'Postcard mailed for you',for:['painting'],fulfil:'printful',printful:'Standard Postcard (ship to recipient)',page:'postcards.html',opts:[],base:4.5}
];
/* ---------- mockups: real photos of the blank product, the drawing printed into its print area ---------- */
const CN={WHT:'white',CHR:'charcoal',SGE:'sage',SND:'sand',CLY:'clay'};
const MOCK={HOD:{f:'hoodie',p:[.36,.31,.28,.24],look:'m1-stand',lp:[.37,.35,.25,.15]},SWT:{f:'crewneck',p:[.33,.21,.34,.28],look:'m3-stand',lp:[.37,.34,.25,.15]},
 TOT:{f:'tote',p:[.2,.49,.6,.38],look:'t1-stand',lp:[.5,.58,.26,.22]},CAP:{f:'cap',p:[.375,.3,.25,.16],look:'c1-stand',lp:[.375,.075,.25,.105]}};
function mock(code,slug,color,look){const m=MOCK[code],d=design(slug);if(!m||!d)return '';const c=CN[color]||'white',p=look?m.lp:m.p,dark=c==='charcoal';
  const art=d.kind==='painting'?d.img:(d.stk||d.img);
  return `<span class="mgmk${look?' look':''}"><img class="ph" src="img/mk/${look?m.look:m.f}-${c}.webp" alt="" loading="lazy"><span class="pa" style="overflow:hidden;left:${p[0]*100}%;top:${p[1]*100}%;width:${p[2]*100}%;height:${p[3]*100}%"><img src="${art}" alt="" loading="lazy" style="${d.kind==='painting'?'width:100%;height:100%;object-fit:cover;transform:scale(1.14);':''}${dark?'mix-blend-mode:normal;opacity:.92':''}"></span></span>`}
const BEST=['dovegirl','waves','boatman','c-gaza','s-truck'],NEW=['s-logo','s-quote','c-love','hill'];
function pick(s){const o={};s.split(' ').forEach(k=>o[k]={ar:COLORS[k].ar,en:COLORS[k].en,p:0,hex:COLORS[k].hex});return o}
const pad=n=>String(n).padStart(3,'0');
const design=slug=>DESIGNS.find(d=>d.slug===slug||'D'+pad(d.n)===slug);
const type=code=>TYPES.find(t=>t.code===code);
/* the code: MG-TYPE-DESIGN-OPTIONS (calendar and packs use the year / series in place of a design number) */
function sku(code,slug,opt){
  const t=type(code);const parts=['MG',code];
  if(code==='CAL')parts.push(opt.year||'2027');else if(code!=='PCK')parts.push(pad(design(slug).n));
  t.opts.forEach(([g])=>parts.push(opt[g]));return parts.join('-');
}
function price(code,opt){const t=type(code);let p=t.base||0;t.opts.forEach(([g,vals])=>{p+=(vals[opt[g]]||{p:0}).p});return Math.round(p*100)/100}
function label(code,opt,L){const t=type(code);return [t[L]].concat(t.opts.map(([g,vals])=>(vals[opt[g]]||{})[L]).filter(Boolean)).join(' · ')}
/* every sellable code, for the code list and the Printful import */
function all(){const out=[];
  TYPES.forEach(t=>{
    let ds=t.for.includes('calendar')?['2023','2024','2025','2026','2027'].map(y=>({slug:null,y,n:y,ar:y,en:y})):t.for.includes('pack')?[{slug:null,ar:'—',en:'—'}]:DESIGNS.filter(d=>t.for.includes(d.kind)&&(!t.needs||d[t.needs]));
    ds.forEach(d=>{let combos=[{}];t.opts.forEach(([g,vals])=>{const n=[];combos.forEach(c=>Object.keys(vals).forEach(v=>n.push(Object.assign({},c,{[g]:v}))));combos=n});
      combos.forEach(o=>{if(d.y)o=Object.assign({},o,{year:d.y});out.push({sku:sku(t.code,d.slug,o),type:t.code,design:d.slug?('D'+pad(d.n)+' · '+d.en):d.en,designAr:d.ar,variant:{ar:label(t.code,o,'ar'),en:label(t.code,o,'en')},price:price(t.code,o),fulfil:t.fulfil,printful:t.printful||''})})})});
  return out}
/* product-page state → code (keeps the product page's own option names) */
const FRAME={none:'NON',black:'BLK',oak:'OAK',white:'WHT'},SIZE={A4:'A4',A3:'A3','50×70':'B2'},DIG={wall:'WAL',printfile:'PRN',full:'FUL'},STKS={S:'S',M:'M',L:'L'},PROD={print:'PRT',postcard:'PCD',sticker:'STK',tee:'SWT',sweat:'SWT',hoodie:'HOD',tote:'TOT',cap:'CAP'};
const colorCode=hex=>{hex=(hex||'').toUpperCase();if(COLORS[hex]&&AC.includes(hex))return hex;const k=Object.keys(COLORS).find(k=>COLORS[k].hex.toUpperCase()===hex);return AC.includes(k)?k:({ECR:'WHT',NAT:'WHT',OLV:'SGE',BRN:'CHR',BLK:'CHR'})[k]||'WHT'};
function fromState(S){
  if(S.mode==='digital')return {code:'DIG',opt:{file:DIG[S.dig]}};
  const code=PROD[S.prod];let opt={};
  if(code==='PRT')opt={size:SIZE[S.size],frame:FRAME[S.frame]};
  else if(code==='PCD')opt={pack:'P'+S.pack};
  else if(code==='STK')opt={size:STKS[S.ssz],finish:S.fin==='gloss'?'GLS':'MAT'};
  else if(code==='TOT'||code==='CAP')opt={color:colorCode(S.color)};
  else opt={size:S.csz||'M',color:colorCode(S.color)};
  return {code,opt};
}
/* ---------- basket (one for the whole site, kept in this browser) ---------- */
const KEY='mg-cart';
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return []}};
function save(items){try{localStorage.setItem(KEY,JSON.stringify(items))}catch(e){}badge();dispatchEvent(new Event('mg-cart'))}
function add(code,slug,opt,q,extra){
  const d=slug?design(slug):null,items=read(),s=sku(code,slug||'guitar',opt),t=type(code);
  const it=items.find(x=>x.sku===s);
  if(it)it.q+=q||1;else items.push(Object.assign({id:Date.now()+Math.floor(Math.random()*999),sku:s,k:slug||code.toLowerCase(),img:d?d.img:'img/paper.jpg',ar:d?d.ar:t.ar,en:d?d.en:t.en,name:{ar:d?d.ar:t.ar,en:d?d.en:t.en},what:{ar:label(code,opt,'ar'),en:label(code,opt,'en')},u:price(code,opt),q:q||1,mode:t.fulfil==='digital'?'digital':'print'},extra||{}));
  save(items);return s;
}
function count(){return read().reduce((a,b)=>a+(b.q||1),0)}
function badge(){const n=count();document.querySelectorAll('#bagBtn').forEach(b=>{let e=b.querySelector('.badge,.mg-badge');if(!e){e=document.createElement('b');e.className='mg-badge';b.appendChild(e)}e.textContent=n;e.hidden=!n});const c=document.getElementById('cartN');if(c)c.textContent=n}
/* helpers the design pages call */
const markOf=k=>({'s-dove':'c-dove','s-gaza':'c-gaza','s-star':'c-star','s-love':'c-love','s-moon':'c-moon','postmark2':'postmark','postmark':'postmark'})[k]||k;
const helpers={
 apparel(ST,n){const code={sweat:'SWT',tee:'SWT',long:'SWT',sweat:'SWT',crew:'SWT',hoodie:'HOD',cap:'CAP',tote:'TOT'}[ST.kind]||'SWT';let slug=markOf(ST.design);if(!design(slug))slug='postmark';
   if(code==='CAP'&&design(slug).kind!=='mark')slug='c-gaza';const c=colorCode(ST.color);
   const opt=code==='TOT'||code==='CAP'?{color:c}:{size:ST.gsz||'M',color:c};
   add(code,slug,opt,n||1)},
 sticker(k,n){let slug=k;if(!design(slug)){const d=DESIGNS.find(x=>x.stk&&x.stk.indexOf('/'+k+'.')>-1);slug=d?d.slug:'s-heart'}add('STK',slug,{size:'M',finish:'MAT'},n||1)},
 calendar(v){add('CAL',null,{version:v||'WALL',year:'2027'},1)}
};
window.MG=Object.assign(window.MG||{},{slugOf:markOf,colorCode,mock,MOCK,CN,BEST,NEW,AC,DESIGNS,TYPES,COLORS,design,type,sku,price,label,all,fromState,pad,
  paintings:()=>DESIGNS.filter(d=>d.kind==='painting'),
  cart:{items:read,save,add,count,badge,clear:()=>save([]),remove:id=>save(read().filter(x=>x.id!==id))},helpers});
window.MGCart=window.MG.cart;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',badge);else badge();
addEventListener('storage',e=>{if(e.key===KEY)badge()});
})();
