(function(){
'use strict';
let AR=MG.ar;
/* checkout: the bag, an email for the files, then PayPal (the server prices every line); back here to collect the files */
const S={esc:MG.esc,fmt:MG.fmt,toast:MG.toast,img:k=>'assets/'+k+'.webp',BAG:MG.bag,USER:{get:()=>MG.user.get(),set:u=>MG.user.set(u),api:MG.api,sync:()=>MG.user.sync(),out:()=>MG.user.out()}},B=S.BAG,U=S.USER,T=(en,ar)=>AR?ar:en,esc=S.esc,$=id=>document.getElementById(id);
const Q=new URLSearchParams(location.search);
const KIND={painting:['Painting, PDF and PNG','لوحة، PDF وPNG'],postcard:['Postcard, PDF and PNG','بطاقة بريدية، PDF وPNG'],sticker:['Sticker, PNG','ملصق، PNG'],pack:['Sticker pack, PNG','مجموعة ملصقات، PNG'],calendar:['Calendar 2027, PDF in A5','تقويم 2027، PDF بمقاس A5']};
const ERR={email_invalid:['Please enter a valid email, like name@mail.com. Your files go there.','اكتبوا بريدًا إلكترونيًا صحيحًا، مثل name@mail.com. ستصل الملفات إليه.'],
  item_unavailable:['One piece in your bag is no longer for sale. Remove it and try again.','إحدى القطع في السلة لم تعد متاحة. أزيلوها وحاولوا مرة أخرى.'],
  rate_limited:['Too many tries. Please wait a little and try again.','محاولات كثيرة. انتظروا قليلًا ثم حاولوا مرة أخرى.'],
  payment_error:['PayPal did not answer. Please try again in a moment.','لم يستجب PayPal. حاولوا مرة أخرى بعد قليل.'],
  not_paid:['We could not confirm the payment. If money left your account, write to info@massandgrass.com with your order number.','لم نتمكن من تأكيد الدفع. إن خُصم المبلغ، راسلونا على info@massandgrass.com مع رقم الطلب.'],
  ship_country:['Please choose a country we ship to.','اختاروا بلدًا نشحن إليه.'],ship_address:['Please fill in the address: name, phone, street and city (and the 4-digit postcode in Denmark).','أكملوا العنوان: الاسم والهاتف والشارع والمدينة (والرمز البريدي المكوّن من 4 أرقام في الدنمارك).'],
  not_ready:['This free piece is not ready to download yet. Please try again soon.','هذه القطعة المجانية غير جاهزة للتنزيل بعد. حاولوا لاحقًا.'],
  amount_mismatch:['The amount paid does not match the order. Please write to info@massandgrass.com.','المبلغ المدفوع لا يطابق الطلب. راسلونا على info@massandgrass.com.']};
let state=Q.get('order')?'capture':'bag',msg=Q.get('cancelled')?['The payment was cancelled. Your bag is still here.','أُلغي الدفع. سلتكم ما زالت هنا.']:null,order=null,soon=false;
const kb=n=>n>1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB';
function render(){const box=$('co'),h=$('co-h');
  if(state==='capture'){h.textContent=T('Confirming your payment','نؤكد الدفع');box.innerHTML=`<p class="fmsg ok" role="status">${T('One moment, we are collecting your files…','لحظة، نجهّز ملفاتكم…')}</p>`;return}
  if(state==='held'){h.textContent=T('Thank you','شكرًا لكم');box.innerHTML=`<div class="co-empty"><p class="fmsg ok" role="status">${T(`PayPal received your payment for order ${esc(order.id)} and is checking it. Your files reach your email as soon as it clears, usually within a few hours.`,`استلم PayPal دفعتكم للطلب ${esc(order.id)} ويراجعها الآن. تصل ملفاتكم إلى بريدكم فور اعتمادها، عادةً خلال ساعات.`)}</p><a class="go" href="paintings.html">${T('Back to the paintings','العودة إلى اللوحات')}</a></div>`;return}
  if(state==='done'){h.textContent=T('Thank you','شكرًا لكم');const f=order.files||[],its=(order.items||[]).filter(i=>!i.gift),dig=its.some(i=>i.fmt!=='print'),u=U.get();
    const when=new Date(order.date||Date.now()).toLocaleDateString(AR?'ar-u-nu-latn':'en-GB',{day:'numeric',month:'long',year:'numeric'});
    const th=i=>i.kind==='calendar'?(MG.calOf(i.k).cover||'assets/t-v2-00.webp'):'assets/'+(i.kind==='pack'?(i.pack||[])[0]:i.k)+'.webp';
    box.innerHTML=`<div class="cd">
      <div class="cd-l"><p class="hand cd-say">${T('Sealed in Gaza, sent to you.','خُتمت في غزة وأُرسلت إليكم.')}</p>
        <ul class="cd-its">${its.map(i=>`<li><span class="cd-pr"><img src="${esc(th(i))}" alt=""></span><span class="cd-nm">${esc(AR?(i.ta||i.t):i.t)}</span><small>${i.fmt==='print'?T('Printed','مطبوعة')+(i.q>1?' ×'+i.q:''):esc(T(...(KIND[i.kind]||['Digital file','ملف رقمي'])))}</small></li>`).join('')}</ul>
        <p class="cd-tx">${T(`A copy of every link is in your e-mail. Each piece you take home helps Farah keep painting.`,`أرسلنا نسخة من كل رابط إلى بريدكم. كل قطعة تأخذونها تساعد فرح على مواصلة الرسم.`)}</p>
        <img class="cd-sig" src="assets/signature.png" alt="${T('Farah’s signature','توقيع فرح')}" width="180" height="60">
        <div class="cd-acts"><a class="ink" href="shop.html">${T('Back to the shop','العودة إلى المتجر')}</a>${u?`<a class="go" href="profile.html">${T('Your account','حسابكم')}</a>`:''}</div></div>
      <aside class="cd-r" aria-label="${T('Your order','طلبكم')}">
        <dl class="cd-rc"><div><dt>${T('Order','الطلب')}</dt><dd>${esc(order.id)}</dd></div><div><dt>${T('Date','التاريخ')}</dt><dd>${esc(when)}</dd></div>
          <div><dt>${T('E-mail','البريد')}</dt><dd dir="ltr">${esc(order.email)}</dd></div><div><dt>${T('Total','المجموع')}</dt><dd>${+order.total?MG.fmtEur(+order.total):T('Free','مجانًا')}</dd></div></dl>
        ${dig?`<h2 class="cd-h">${T('Your files','ملفاتكم')}</h2>${f.length?`<ul class="cd-files">${f.map(x=>`<li><a href="${esc(x.url)}" download><span class="n">${esc(x.name)}</span><small dir="ltr">${kb(x.size||0)}</small><b>${T('Download','تحميل')}</b></a></li>`).join('')}</ul>`:`<p class="cd-note">${T('Farah is preparing your files. They reach your e-mail within a day.','تجهّز فرح ملفاتكم، وتصل إلى بريدكم خلال يوم.')}</p>`}`:''}
        ${order.ship?`<h2 class="cd-h">${T('Your prints','قطعكم المطبوعة')}</h2><p class="cd-note">${T(`Farah prints and packs them by hand, then they travel to ${esc(order.ship.city)}. We e-mail you when they leave the studio.`,`تطبعها فرح وتغلّفها بيدها، ثم تسافر إلى ${esc(order.ship.city)}. نراسلكم عند خروجها من المرسم.`)}</p>`:''}
      </aside></div>`;return}
  h.textContent=T('Checkout','إتمام الشراء');const a=B.get(),u=U.get(),pr=B.printed();
  if(!a.length){box.innerHTML=`<div class="co-empty">${msg?`<p class="fmsg" role="status">${T(...msg)}</p>`:''}<p>${T('Your bag is empty.','السلة فارغة.')}</p><a class="ink" href="paintings.html">${T('See the paintings','شاهدوا اللوحات')}</a></div>`;return}
  box.innerHTML=`<div class="co-grid"><div><ul class="co-ls">${a.map((x,i)=>`<li><span class="th"><img src="${esc(x.img||S.img(x.k))}" alt=""></span><div><b>${esc(AR?(x.ta||x.t):x.t)}</b><small>${x.fmt==='print'?T('Printed and shipped','مطبوعة وتُشحن'):esc(T(...(KIND[x.kind]||['Digital file','ملف رقمي'])))}</small>${x.fmt==='print'?`<span class="qty"><button type="button" data-q="${i}" data-d="-1" aria-label="${T('One less','نسخة أقل')}"${(x.q||1)<=1?' disabled':''}>−</button><b>${x.q||1}</b><button type="button" data-q="${i}" data-d="1" aria-label="${T('One more','نسخة أخرى')}"${(x.q||1)>=10?' disabled':''}>+</button></span>`:''}</div><div class="pr">${S.fmt((+x.p||0)*(x.q||1))}<button type="button" class="rm" data-rm="${i}">${T('Remove','إزالة')}</button></div></li>`).join('')}</ul>
    ${pr?`<p class="co-sub"><span>${T('Shipping','الشحن')}</span><span id="shipFee">${feeTx(zone())}</span></p>`:''}
    <p class="co-tt"><span>${T('Total','المجموع')}</span><b id="coTotal">${S.fmt(B.total()+(pr&&zone()?zone().fee:0))}</b></p></div>
   <form class="sheet paper" data-tear="6" id="f" novalidate><span class="fill"></span><h2>${pr?T('Contact and delivery','التواصل والتوصيل'):T('Where should we send the files?','إلى أين نرسل الملفات؟')}</h2>
    <label class="fld">${T('Email','البريد الإلكتروني')}<input id="em" type="email" autocomplete="email" required value="${esc(u?u.email:'')}"></label>
    ${pr?'':`<label class="fld"><span>${T('Your name','الاسم')} <small>${T('(optional)','(اختياري)')}</small></span><input id="nm" autocomplete="name" maxlength="60" value="${esc(u?u.name:'')}"></label>`}
    ${pr?shipFields():''}
    <label class="chk"><input type="checkbox" id="news"><span>${T('Send me one new painting from Gaza each month.','أرسلوا لي لوحة جديدة من غزة كل شهر.')}</span></label>
    <p class="fmsg${soon?' ok':''}" role="status">${msg?esc(T(...msg)):''}</p>
    <button class="ink full" type="submit"${pr&&!Object.keys(MG.shipping).length?' disabled':''}>${B.total()===0&&!pr?T('Get the files','احصلوا على الملفات'):MG.cur?T('Pay with PayPal','ادفعوا عبر PayPal'):`${T('Pay','ادفعوا')} <span data-paytotal>${MG.fmtEur(B.total()+(pr&&zone()?zone().fee:0))}</span> ${T('with PayPal','عبر PayPal')}`}</button>
    <p class="fine">${u?'':`${T('Have an account?','لديكم حساب؟')} <a href="account.html?next=checkout.html">${T('Sign in','سجّلوا الدخول')}</a> ${T('to keep your files in your profile.','لتبقى ملفاتكم في حسابكم.')} `}${pr?T('By paying you accept the','بالدفع توافقون على'):T('By paying you accept the','بالدفع توافقون على')} <a href="terms.html">${T('terms and licence','الشروط والرخصة')}</a>.</p></form></div>`;
  retear();$('f').onsubmit=pay;box.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{B.remove(+b.dataset.rm);render()});
  box.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{const i=+b.dataset.q;B.qty(i,(B.get()[i].q||1)+(+b.dataset.d));render()});
  const sc=$('sc');if(sc)sc.onchange=()=>{ship.country=sc.value;const z=zone();$('shipFee').textContent=feeTx(z);const sum=B.total()+(z?z.fee:0),tt=S.fmt(sum);$('coTotal').textContent=tt;const pt=box.querySelector('[data-paytotal]');if(pt)pt.textContent=MG.fmtEur(sum);const dl=$('sdial');if(dl)dl.textContent=DIAL[sc.value]?'+'+DIAL[sc.value]:'+';const po=$('spc');if(po)po.placeholder=POSTAL_REQ.includes(sc.value)?'':T('Optional','اختياري');ferr('sc',null)}}
/* the address for printed pieces: only the countries shipped to now; kept while the page is open */
/* a signed-in buyer's own details fill the address (they can still change it here) */
const ship=(()=>{const u=MG.user.get(),a=(u&&u.addr)||{};const here=MG.shipZone(a.country)?a.country:(MG.shipZone(MG.visitor)?MG.visitor:'');return u?{country:here,name:u.name||'',phone:u.phone||'',line1:a.line1||'',line2:a.line2||'',city:a.city||'',region:a.region||'',postal:a.postal||''}:{country:here}})();
function zone(){return MG.shipZone(ship.country)}
/* the fee on screen: nothing extra reads as included */
const feeTx=z=>z?(z.fee?S.fmt(z.fee):T('Included','مشمول')):T('Choose the country','اختاروا البلد');
/* the delivery form, set out as the big shops do: country first, first and last name, street and apartment, city with
   state / province and postcode, the phone with the country's dialling code in front; each field says what is wrong under it */
const DIAL=Object.fromEntries('AD376 AE971 AF93 AG1 AL355 AM374 AO244 AR54 AT43 AU61 AZ994 BA387 BB1 BD880 BE32 BF226 BG359 BH973 BI257 BJ229 BN673 BO591 BR55 BS1 BT975 BW267 BY375 BZ501 CA1 CD243 CF236 CG242 CH41 CI225 CL56 CM237 CN86 CO57 CR506 CU53 CV238 CY357 CZ420 DE49 DJ253 DK45 DM1 DO1 DZ213 EC593 EE372 EG20 ER291 ES34 ET251 FI358 FJ679 FR33 GA241 GB44 GD1 GE995 GH233 GM220 GN224 GQ240 GR30 GT502 GW245 GY592 HK852 HN504 HR385 HT509 HU36 ID62 IE353 IL972 IN91 IQ964 IR98 IS354 IT39 JM1 JO962 JP81 KE254 KG996 KH855 KM269 KN1 KP850 KR82 KW965 KZ7 LA856 LB961 LC1 LI423 LK94 LR231 LS266 LT370 LU352 LV371 LY218 MA212 MC377 MD373 ME382 MG261 MK389 ML223 MM95 MN976 MR222 MT356 MU230 MV960 MW265 MX52 MY60 MZ258 NA264 NE227 NG234 NI505 NL31 NO47 NP977 NZ64 OM968 PA507 PE51 PG675 PH63 PK92 PL48 PS970 PT351 PY595 QA974 RO40 RS381 RU7 RW250 SA966 SC248 SD249 SE46 SG65 SI386 SK421 SL232 SM378 SN221 SO252 SR597 SS211 ST239 SV503 SY963 SZ268 TD235 TG228 TH66 TJ992 TL670 TM993 TN216 TR90 TT1 TW886 TZ255 UA380 UG256 US1 UY598 UZ998 VA39 VC1 VE58 VN84 XK383 YE967 ZA27 ZM260 ZW263'.split(' ').map(x=>[x.slice(0,2),x.slice(2)]));
const POSTAL_REQ=['DK'];
function shipFields(){const all=!!(MG.shipping.ALL||MG.shipping.GCC),C=all?MG.countries().map(([c,n])=>[c,{name:[n,n]}]):Object.entries(MG.shipping);if(C.length===1&&!ship.country)ship.country=C[0][0];
  if(!C.length)return `<p class="fmsg" role="status">${T('Printed pieces cannot be shipped right now. Remove them to buy the files.','لا يمكن شحن القطع المطبوعة الآن. أزيلوها لشراء الملفات.')}</p>`;
  const v=k=>esc(ship[k]||''),opt=`<small>${T('(optional)','(اختياري)')}</small>`,fld=(id,label,input,cls)=>`<div class="fld${cls?' '+cls:''}"><label for="${id}">${label}</label>${input}<small class="ferr" id="${id}-e" aria-live="polite"></small></div>`;
  const [fn,...ln]=String(ship.first!=null?ship.first+' '+(ship.last||''):ship.name||'').trim().split(/\s+/);
  return `<fieldset class="shipf"><legend>${T('Delivery','التوصيل')}</legend>
    ${fld('sc',T('Country or region','البلد أو المنطقة'),`<select id="sc" autocomplete="country" required><option value="">${T('Choose','اختاروا')}</option>${C.map(([c,z])=>`<option value="${c}"${ship.country===c?' selected':''}>${esc(MG.L(z.name))}</option>`).join('')}</select>`)}
    <div class="frow two">${fld('sf',T('First name','الاسم الأول'),`<input id="sf" autocomplete="given-name" maxlength="40" required value="${esc(ship.first!=null?ship.first:fn||'')}">`)}${fld('sl',T('Last name','اسم العائلة'),`<input id="sl" autocomplete="family-name" maxlength="40" required value="${esc(ship.last!=null?ship.last:ln.join(' '))}">`)}</div>
    ${fld('s1',T('Address','العنوان'),`<input id="s1" autocomplete="address-line1" maxlength="120" required placeholder="${T('Street and house number','الشارع ورقم المبنى')}" value="${v('line1')}">`)}
    ${fld('s2',T('Apartment, suite, floor','الشقة، الطابق'),`<input id="s2" autocomplete="address-line2" maxlength="120" placeholder="${T('Optional','اختياري')}" value="${v('line2')}">`)}
    <div class="frow three">${fld('sci',T('City','المدينة'),`<input id="sci" autocomplete="address-level2" maxlength="60" required value="${v('city')}">`)}${fld('srg',T('State','الولاية'),`<input id="srg" autocomplete="address-level1" maxlength="60" placeholder="${T('Optional','اختياري')}" value="${v('region')}">`)}${fld('spc',T('Postal code','الرمز البريدي'),`<input id="spc" autocomplete="postal-code" maxlength="12" dir="ltr" placeholder="${POSTAL_REQ.includes(ship.country)?'':T('Optional','اختياري')}" value="${v('postal')}">`)}</div>
    ${fld('sp',T('Phone','الهاتف'),`<div class="tel" dir="ltr"><span id="sdial">${ship.country&&DIAL[ship.country]?'+'+DIAL[ship.country]:'+'}</span><input id="sp" type="tel" autocomplete="tel-national" inputmode="tel" maxlength="20" required value="${esc(String(ship.phone||'').replace(/^\+\d+\s*/,''))}"></div>`)}
  </fieldset>`}
/* one field's message, under it */
function ferr(id,m){const i=$(id),e=$(id+'-e');if(e)e.textContent=m?T(...m):'';if(i)i.setAttribute('aria-invalid',m?'true':'false');return !m}
function checkShip(){const g=id=>(($(id)||{}).value||'').trim(),c=g('sc'),req=['Required','مطلوب'];
  const phone=g('sp').replace(/[^\d]/g,''),postal=g('spc');
  const ok=[ferr('sc',MG.shipZone(c)?null:['Choose your country','اختاروا بلدكم']),ferr('sf',g('sf')?null:req),ferr('sl',g('sl')?null:req),ferr('s1',g('s1').length>=3?null:['Enter your street and house number','اكتبوا الشارع ورقم المبنى']),
    ferr('sci',g('sci')?null:req),ferr('spc',c==='DK'&&!/^\d{4}$/.test(postal)?['Enter a 4-digit postal code','اكتبوا رمزًا بريديًا من 4 أرقام']:null),ferr('sp',phone.length>=6&&phone.length<=15?null:['Enter a phone number the courier can call','اكتبوا رقم هاتف يتصل به المندوب'])];
  Object.assign(ship,{country:c,first:g('sf'),last:g('sl'),name:(g('sf')+' '+g('sl')).trim(),line1:g('s1'),line2:g('s2'),city:g('sci'),region:g('srg'),postal,phone:(DIAL[c]?'+'+DIAL[c]+' ':'')+g('sp').replace(/^\+?0*/,'')});
  const bad=['sc','sf','sl','s1','sci','spc','sp'].find((id,i)=>!ok[i]);if(bad)$(bad).focus();return !bad}
function retear(){MG.tear()}
async function pay(e){e.preventDefault();const f=e.target,btn=f.querySelector('[type=submit]'),say=(m,good)=>{msg=m;soon=!!good;const el=f.querySelector('.fmsg');el.textContent=T(...m);el.classList.toggle('ok',!!good)};
  const em=$('em').value.trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)){say(ERR.email_invalid);$('em').focus();return}
  const pr=B.printed();
  if(pr&&!checkShip()){msg=null;const el=f.querySelector('.fmsg');if(el)el.textContent='';return}
  btn.disabled=true;const r=await U.api('POST','/api/orders',{email:em,name:($('nm')?$('nm').value.trim():ship.name),news:$('news').checked,items:B.get(),ship:pr?ship:undefined});btn.disabled=false;
  /* free pieces: no payment, the files are ready at once */
  if(r.ok&&r.data.free&&r.data.order){order=r.data.order;state='done';B.clear();render();scrollTo(0,0);return}
  if(r.ok&&!r.data.approve&&r.data.payments!=='off'){say(ERR.payment_error);return}
  if(r.offline||(r.ok&&r.data.payments==='off')){say(['Payments open with the shop in a few days. Your bag stays here until then.','يُفتح الدفع مع افتتاح المتجر بعد أيام. ستبقى سلتكم هنا حتى ذلك الحين.'],true);return}
  if(!r.ok){say(ERR[r.data&&r.data.error]||['Something went wrong. Please try again.','حدث خطأ. حاولوا مرة أخرى.']);return}
  try{localStorage.mgPending=JSON.stringify({id:r.data.id,access:r.data.access})}catch(x){}
  if(r.data.approve)location.href=r.data.approve}
async function capture(){const id=Q.get('order');let pend={};try{pend=JSON.parse(localStorage.mgPending||'{}')}catch(e){}
  const r=await U.api('POST','/api/orders/'+encodeURIComponent(id)+'/capture',{access:pend.id===id?pend.access:'',token:Q.get('token')||''});history.replaceState(null,'','checkout.html');
  if(r.ok&&r.data.order){order=r.data.order;state='done';B.clear();try{localStorage.removeItem('mgPending')}catch(e){}}
  /* PayPal took the payment but holds it for review: the files come by email once it clears */
  else if(r.status===202&&r.data.pending){order={id:r.data.id};state='held';B.clear();try{localStorage.removeItem('mgPending')}catch(e){}}
  else{state='bag';msg=ERR[r.data&&r.data.error]||ERR.not_paid}
  render()}
if(state==='capture')capture();


MG.page(function(why){AR=MG.ar;if(why==='init'||why==='lang'||(why==='bag'&&state==='bag'))render()});
})();
