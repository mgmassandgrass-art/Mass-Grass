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
  if(state==='done'){h.textContent=T('Thank you','شكرًا لكم');const f=order.files||[];
    box.innerHTML=`<div class="co-done"><div><img class="seal" src="assets/sealA.webp" alt=""><h2>${T('Sealed in Gaza, sent to you.','خُتمت في غزة وأُرسلت إليكم.')}</h2>
      <p>${T(`Order ${esc(order.id)}. A copy of every link is in your email (${esc(order.email)}). Each piece you bought helps Farah keep painting.`,`الطلب ${esc(order.id)}. أرسلنا نسخة من كل رابط إلى بريدكم (${esc(order.email)}). كل قطعة اشتريتموها تساعد فرح على مواصلة الرسم.`)}</p>
      <a class="go" href="paintings.html">${T('Back to the paintings','العودة إلى اللوحات')}</a></div>
      ${order.ship?`<div class="sheet paper" data-tear="6"><span class="fill"></span><h2>${T('Your prints','قطعكم المطبوعة')}</h2><p>${T(`Farah prints and packs them by hand, then they travel to ${esc(order.ship.city)}. We e-mail you when they leave the studio.`,`تطبعها فرح وتغلّفها بيدها، ثم تسافر إلى ${esc(order.ship.city)}. نراسلكم عند خروجها من المرسم.`)}</p></div>`:''}
      ${(order.items||[]).some(i=>i.fmt!=='print')?`<div class="sheet paper" data-tear="6"><span class="fill"></span><h2>${T('Your files','ملفاتكم')}</h2>${f.length?`<ul class="files">${f.map(x=>`<li><a href="${esc(x.url)}" download><span>${esc(x.name)}</span><small>${kb(x.size||0)}</small></a></li>`).join('')}</ul>`:`<p>${T('Farah is preparing your files. They reach your email within a day.','تجهّز فرح ملفاتكم، وتصل إلى بريدكم خلال يوم.')}</p>`}</div>`:''}</div>`;retear();return}
  h.textContent=T('Checkout','إتمام الشراء');const a=B.get(),u=U.get(),pr=B.printed();
  if(!a.length){box.innerHTML=`<div class="co-empty">${msg?`<p class="fmsg" role="status">${T(...msg)}</p>`:''}<p>${T('Your bag is empty.','السلة فارغة.')}</p><a class="ink" href="paintings.html">${T('See the paintings','شاهدوا اللوحات')}</a></div>`;return}
  box.innerHTML=`<div class="co-grid"><div><ul class="co-ls">${a.map((x,i)=>`<li><span class="th"><img src="${esc(x.img||S.img(x.k))}" alt=""></span><div><b>${esc(AR?(x.ta||x.t):x.t)}</b><small>${x.fmt==='print'?T('Printed and shipped','مطبوعة وتُشحن'):esc(T(...(KIND[x.kind]||['Digital file','ملف رقمي'])))}</small>${x.fmt==='print'?`<span class="qty"><button type="button" data-q="${i}" data-d="-1" aria-label="${T('One less','نسخة أقل')}"${(x.q||1)<=1?' disabled':''}>−</button><b>${x.q||1}</b><button type="button" data-q="${i}" data-d="1" aria-label="${T('One more','نسخة أخرى')}"${(x.q||1)>=10?' disabled':''}>+</button></span>`:''}</div><div class="pr">${S.fmt((+x.p||0)*(x.q||1))}<button type="button" class="rm" data-rm="${i}">${T('Remove','إزالة')}</button></div></li>`).join('')}</ul>
    ${pr?`<p class="co-sub"><span>${T('Shipping','الشحن')}</span><span id="shipFee">${zone()?S.fmt(zone().fee):T('Choose the country','اختاروا البلد')}</span></p>`:''}
    <p class="co-tt"><span>${T('Total','المجموع')}</span><b id="coTotal">${S.fmt(B.total()+(pr&&zone()?zone().fee:0))}</b></p></div>
   <form class="sheet paper" data-tear="6" id="f" novalidate><span class="fill"></span><h2>${pr?T('Where should we send it?','إلى أين نرسل الطلب؟'):T('Where should we send the files?','إلى أين نرسل الملفات؟')}</h2>
    <label class="fld">${T('Email','البريد الإلكتروني')}<input id="em" type="email" autocomplete="email" required value="${esc(u?u.email:'')}"></label>
    <label class="fld"><span>${T('Your name','الاسم')} <small>${T('(optional)','(اختياري)')}</small></span><input id="nm" autocomplete="name" maxlength="60" value="${esc(u?u.name:'')}"></label>
    ${pr?shipFields():''}
    <label class="chk"><input type="checkbox" id="news"><span>${T('Send me one new painting from Gaza each month.','أرسلوا لي لوحة جديدة من غزة كل شهر.')}</span></label>
    <p class="fmsg${soon?' ok':''}" role="status">${msg?esc(T(...msg)):''}</p>
    <button class="ink full" type="submit"${pr&&!Object.keys(MG.shipping).length?' disabled':''}>${B.total()===0&&!pr?T('Get the files','احصلوا على الملفات'):`${T('Pay','ادفعوا')} <span data-paytotal>${S.fmt(B.total()+(pr&&zone()?zone().fee:0))}</span> ${T('with PayPal or a card','عبر PayPal أو البطاقة')}`}</button>
    <p class="fine">${u?'':`${T('Have an account?','لديكم حساب؟')} <a href="account.html?next=checkout.html">${T('Sign in','سجّلوا الدخول')}</a> ${T('to keep your files in your profile.','لتبقى ملفاتكم في حسابكم.')} `}${pr?T('Printed pieces are shipped by hand from the studio. By paying you accept the','تُشحن القطع المطبوعة باليد من المرسم. بالدفع توافقون على'):T('Digital files, nothing is shipped. By paying you accept the','ملفات رقمية، لا شيء يُشحن. بالدفع توافقون على')} <a href="terms.html">${T('terms and licence','الشروط والرخصة')}</a>.</p></form></div>`;
  retear();$('f').onsubmit=pay;box.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{B.remove(+b.dataset.rm);render()});
  box.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{const i=+b.dataset.q;B.qty(i,(B.get()[i].q||1)+(+b.dataset.d));render()});
  const sc=$('sc');if(sc)sc.onchange=()=>{ship.country=sc.value;const z=zone();$('shipFee').textContent=z?S.fmt(z.fee):T('Choose the country','اختاروا البلد');const tt=S.fmt(B.total()+(z?z.fee:0));$('coTotal').textContent=tt;const pt=box.querySelector('[data-paytotal]');if(pt)pt.textContent=tt;const pc=$('spc');if(pc)pc.closest('label').hidden=sc.value!=='DK'}}
/* the address for printed pieces: only the countries shipped to now; kept while the page is open */
const ship={country:''};
function zone(){return MG.shipping[ship.country]||null}
function shipFields(){const C=Object.entries(MG.shipping);if(C.length===1&&!ship.country)ship.country=C[0][0];
  if(!C.length)return `<p class="fmsg" role="status">${T('Printed pieces cannot be shipped right now. Remove them to buy the files.','لا يمكن شحن القطع المطبوعة الآن. أزيلوها لشراء الملفات.')}</p>`;
  const v=k=>esc(ship[k]||'');
  return `<fieldset class="shipf"><legend>${T('Shipping address','عنوان الشحن')}</legend>
    <label class="fld">${T('Country','البلد')}<select id="sc" required><option value="">${T('Choose','اختاروا')}</option>${C.map(([c,z])=>`<option value="${c}"${ship.country===c?' selected':''}>${esc(MG.L(z.name))}${z.days?` (${esc(z.days)})`:''}</option>`).join('')}</select></label>
    <label class="fld">${T('Full name','الاسم الكامل')}<input id="sn" autocomplete="name" maxlength="80" required value="${v('name')}"></label>
    <label class="fld">${T('Phone, for the courier','الهاتف، لمندوب التوصيل')}<input id="sp" type="tel" autocomplete="tel" maxlength="30" required dir="ltr" value="${v('phone')}"></label>
    <label class="fld">${T('Street and number','الشارع والرقم')}<input id="s1" autocomplete="address-line1" maxlength="120" required value="${v('line1')}"></label>
    <label class="fld"><span>${T('Flat, building','الشقة، المبنى')} <small>${T('(optional)','(اختياري)')}</small></span><input id="s2" autocomplete="address-line2" maxlength="120" value="${v('line2')}"></label>
    <label class="fld">${T('City','المدينة')}<input id="sci" autocomplete="address-level2" maxlength="60" required value="${v('city')}"></label>
    <label class="fld"${ship.country==='DK'?'':' hidden'}>${T('Postcode','الرمز البريدي')}<input id="spc" autocomplete="postal-code" inputmode="numeric" maxlength="4" dir="ltr" value="${v('postal')}"></label></fieldset>`}
function retear(){MG.tear()}
async function pay(e){e.preventDefault();const f=e.target,btn=f.querySelector('[type=submit]'),say=(m,good)=>{msg=m;soon=!!good;const el=f.querySelector('.fmsg');el.textContent=T(...m);el.classList.toggle('ok',!!good)};
  const em=$('em').value.trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)){say(ERR.email_invalid);$('em').focus();return}
  const pr=B.printed();
  if(pr){const g=id=>($(id)||{}).value||'';Object.assign(ship,{country:g('sc'),name:g('sn').trim(),phone:g('sp').trim(),line1:g('s1').trim(),line2:g('s2').trim(),city:g('sci').trim(),postal:g('spc').trim()});
    if(!zone()){say(ERR.ship_country);$('sc').focus();return}
    if(!ship.name||!ship.line1||!ship.city||!/^[+\d][\d\s()-]{5,}$/.test(ship.phone)||(ship.country==='DK'&&!/^\d{4}$/.test(ship.postal))){say(ERR.ship_address);return}}
  btn.disabled=true;const r=await U.api('POST','/api/orders',{email:em,name:$('nm').value.trim(),news:$('news').checked,items:B.get(),ship:pr?ship:undefined});btn.disabled=false;
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
