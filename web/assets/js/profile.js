(function(){
'use strict';
let AR=MG.ar;
/* The profile: a summary (since when, orders, files, spent, parcels on the way), every paid order with its files and, for
   printed pieces, the parcel's state, tracking and address; then the settings: name, password, the monthly e-mail, the
   devices signed in, a copy of your data, sign out and delete. */
const S={esc:MG.esc,fmt:MG.fmt,toast:MG.toast,USER:{get:()=>MG.user.get(),set:u=>MG.user.set(u),api:MG.api,out:()=>MG.user.out()}},U=S.USER,T=(en,ar)=>AR?ar:en,esc=S.esc,$=id=>document.getElementById(id);
let me=U.get(),orders=null,offline=false,news=null,sessions=null,tab=['orders','details','security','data'].includes(location.hash.slice(1))?location.hash.slice(1):'orders';
const ERR={password_short:['The new password needs at least 10 characters.','تحتاج كلمة المرور الجديدة إلى 10 أحرف على الأقل.'],bad_credentials:['The current password is not right.','كلمة المرور الحالية غير صحيحة.'],
  name_required:['Please write your name.','اكتبوا اسمكم.'],phone_invalid:['Please write the phone with its country code, like +971 50 123 4567.','اكتبوا الهاتف مع رمز البلد، مثل ‎+971 50 123 4567.'],
  too_big:['That picture is too large.','الصورة كبيرة جدًا.'],bad_type:['Please choose a JPG, PNG or WebP picture.','اختاروا صورة JPG أو PNG أو WebP.'],code_invalid:['That code is wrong or has expired.','الرمز غير صحيح أو انتهت صلاحيته.'],
  mail_failed:['The e-mail did not go out. Try again in a minute.','لم يُرسل البريد. حاولوا بعد دقيقة.'],password_needed:['Add a password first: two-step sign-in works with a password.','أضيفوا كلمة مرور أولًا: التحقق بخطوتين يعمل مع كلمة المرور.'],rate_limited:['Too many tries. Please wait a little.','محاولات كثيرة. انتظروا قليلًا.']};
const err=r=>T(...(ERR[r.data&&r.data.error]||['Something went wrong. Please try again.','حدث خطأ. حاولوا مرة أخرى.']));
const date=d=>new Date(d).toLocaleDateString(AR?'ar-u-nu-latn':'en-GB',{day:'numeric',month:'long',year:'numeric'});
const thumb=i=>i.kind==='calendar'?(MG.calOf(i.k).cover||'assets/t-v2-00.webp'):'assets/'+(i.kind==='pack'?(i.pack||[])[0]:i.k)+'.webp';
const ISO='AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FR GA GB GD GE GH GM GN GQ GR GT GW GY HK HN HR HT HU ID IE IN IQ IR IS IT JM JO JP KE KG KH KM KN KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MK ML MM MN MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NZ OM PA PE PG PH PK PL PS PT PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TW TZ UA UG US UY UZ VA VC VE VN VU WS YE ZA ZM ZW'.split(' ');
const countries=()=>{let dn;try{dn=new Intl.DisplayNames([AR?'ar':'en'],{type:'region'})}catch(e){}return ISO.map(c=>[c,dn?dn.of(c):c]).sort((a,b)=>a[1].localeCompare(b[1],AR?'ar':'en'))};
/* a picture made square and small in the browser before it travels (320px WebP, else JPEG) */
async function squareImage(file){const bm=await createImageBitmap(file),n=Math.min(bm.width,bm.height),c=document.createElement('canvas');c.width=c.height=320;
  c.getContext('2d').drawImage(bm,(bm.width-n)/2,(bm.height-n)/2,n,n,0,0,320,320);
  const blob=t=>new Promise(r=>c.toBlob(r,t,.86));let b=await blob('image/webp');if(!b||b.type!=='image/webp')b=await blob('image/jpeg');return b}
let tfStep=null;
const SHIP={to_print:['Being printed','قيد الطباعة'],sent:['On its way','في الطريق'],delivered:['Delivered','وصلت']};
const device=ua=>{ua=String(ua||'');const b=/Edg\//.test(ua)?'Edge':/Chrome\//.test(ua)?'Chrome':/Firefox\//.test(ua)?'Firefox':/Safari\//.test(ua)?'Safari':T('A browser','متصفح');
  const o=/iPhone|iPad/.test(ua)?'iOS':/Android/.test(ua)?'Android':/Mac OS X/.test(ua)?'macOS':/Windows/.test(ua)?'Windows':/Linux/.test(ua)?'Linux':'';return o?`${b}, ${o}`:b};

function orderHTML(o){
  const prints=o.items.filter(i=>i.fmt==='print'),files=o.items.filter(i=>i.fmt!=='print');
  const parcel=prints.length?`<div class="parcel"><b>${T('Printed and shipped','مطبوعة وتُشحن')}</b><span class="pst ${esc(o.ship_status||'')}">${esc(T(...(SHIP[o.ship_status]||SHIP.to_print)))}</span>
    ${o.tracking?`<span>${T('Tracking: ','رقم التتبع: ')}<code>${esc(o.tracking)}</code></span>`:''}
    ${o.ship?`<address>${esc([o.ship.name,o.ship.line1,o.ship.line2,[o.ship.postal,o.ship.city].filter(Boolean).join(' '),o.ship.country].filter(Boolean).join(', '))}</address>`:''}</div>`:'';
  const dl=files.length?((o.files||[]).length?`<ul class="files">${o.files.map(f=>`<li><a href="${esc(f.url)}" download><span>${esc(f.name)}</span><small>${T('Download','تحميل')}</small></a></li>`).join('')}</ul>`
    :`<p class="fmsg ok">${T('Farah is preparing these files. They reach your email within a day.','تجهّز فرح هذه الملفات، وتصل إلى بريدكم خلال يوم.')}</p>`):'';
  return `<article class="order"><div class="order-hd"><b>${esc(o.id)}</b><span>${date(o.date)}</span><span>${S.fmt(o.total)}</span></div>
    <div class="its">${o.items.map(i=>`<span><img src="${esc(thumb(i))}" alt="">${esc(AR?(i.ta||i.t):i.t)}${i.fmt==='print'?` <small>${T('printed','مطبوعة')}${i.q>1?' ×'+i.q:''}</small>`:''}</span>`).join('')}</div>${dl}${parcel}</article>`;
}
function tfHTML(){
  if(me.twofa_method==='app')return `<p>${T('On: each sign-in asks for a code from your authenticator app.','مفعّل: كل دخول يطلب رمزًا من تطبيق المصادقة.')}</p>`;
  if(me.twofa_method==='email')return `<p>${T('On: each sign-in sends a code to ','مفعّل: كل دخول يرسل رمزًا إلى ')}<b dir="ltr">${esc(me.email)}</b>${T('. Devices you remember skip it for 30 days.','. الأجهزة التي تتذكّرونها لا تطلبه لمدة 30 يومًا.')}</p>
    <form id="tfOff" novalidate><label class="fld">${T('Your password, to turn it off','كلمة المرور، للإيقاف')}<input id="tfPw" type="password" autocomplete="current-password"></label><p class="fmsg" role="status"></p><button class="linkb danger" type="submit">${T('Turn it off','أوقفوه')}</button></form>`;
  if(!me.password)return `<p>${T('You sign in with Google, which keeps its own second step. Add a password above to use a code by e-mail here.','تدخلون عبر Google، وله خطوته الثانية. أضيفوا كلمة مرور في الأعلى لاستخدام رمز البريد هنا.')}</p>`;
  if(tfStep==='code')return `<p>${T('We sent a 6-digit code to ','أرسلنا رمزًا من 6 أرقام إلى ')}<b dir="ltr">${esc(me.email)}</b>.</p>
    <form id="tfOn" novalidate><label class="fld">${T('The code','الرمز')}<input id="tfCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" dir="ltr"></label><p class="fmsg" role="status"></p><button class="ink" type="submit">${T('Turn it on','فعّلوه')}</button></form>`;
  return `<p>${T('After the password, each sign-in asks for a code we send to your e-mail. A remembered device skips it for 30 days.','بعد كلمة المرور يُطلب رمز نرسله إلى بريدكم. الجهاز الذي تتذكّرونه لا يطلبه لمدة 30 يومًا.')}</p>
    <p class="fmsg" role="status"></p><button class="ink" type="button" id="tfStart">${T('Turn on the e-mail code','فعّلوا رمز البريد')}</button>`}
function render(){const box=$('pf');const a=(me&&me.addr)||{};
  if(!me){$('pf-h').textContent=T('Your account','حسابكم');$('pf-sub').textContent='';
    box.innerHTML=`<div class="pf-empty"><p>${offline?T('Accounts open with the shop. This preview cannot reach the server.','تُفتح الحسابات مع افتتاح المتجر. هذه المعاينة لا تصل إلى الخادم.'):T('Sign in to see your files and orders.','سجّلوا الدخول لتروا ملفاتكم وطلباتكم.')}</p><a class="ink" href="account.html?next=profile.html">${T('Sign in','الدخول')}</a></div>`;return}
  $('pf-h').textContent=T('Hello, ','أهلًا، ')+(me.name||'').split(' ')[0];$('pf-sub').textContent=me.email;
  const os=orders||[],nFiles=os.reduce((n,o)=>n+(o.files||[]).length,0),spent=os.reduce((n,o)=>n+(+o.total||0),0),onWay=os.filter(o=>o.ship_status&&o.ship_status!=='delivered').length;
  const sum=`<ul class="pf-sum" aria-label="${T('Your account in numbers','حسابكم بالأرقام')}">
    <li><b>${me.joined?date(me.joined):'-'}</b><span>${T('With us since','معنا منذ')}</span></li>
    <li><b>${os.length}</b><span>${T('Orders','الطلبات')}</span></li>
    <li><b>${nFiles}</b><span>${T('Files','الملفات')}</span></li>
    <li><b>${onWay}</b><span>${T('Parcels on the way','طرود في الطريق')}</span></li></ul>`;
  const list=orders===null?`<p class="fmsg ok" role="status">${T('Loading your orders…','نحمّل طلباتكم…')}</p>`:os.length?os.map(orderHTML).join('')
    :`<div class="pf-empty"><p>${T('No orders yet. Everything you buy stays here.','لا طلبات بعد. كل ما تشترونه يبقى هنا.')}</p><a class="go" href="shop.html">${T('See the shop','شاهدوا المتجر')}</a></div>`;
  const devs=sessions===null?'':`<ul class="devs">${sessions.map(x=>`<li><span>${esc(device(x.ua))}${x.current?` <em>${T('this one','هذا الجهاز')}</em>`:''}</span><small>${date(x.seen)}${x.ip?', '+esc(x.ip):''}</small>${x.current?'':`<button class="linkb" type="button" data-end="${esc(x.id)}">${T('Sign out','إخراج')}</button>`}</li>`).join('')}</ul>${sessions.length>1?`<button class="linkb" type="button" id="endAll">${T('Sign out everywhere else','الخروج من كل الأجهزة الأخرى')}</button>`:''}`;
  /* four plain tabs, as on the rest of the site: the orders first (what people come for), then details, security, e-mails and data */
  const TABS=[['orders',T('Orders and files','الطلبات والملفات')],['details',T('Details and address','البيانات والعنوان')],['security',T('Sign-in and security','الدخول والأمان')],['data',T('E-mails and data','البريد والبيانات')]];
  const pane=(k,html,cls)=>`<div class="pf-p${cls?' '+cls:''}" role="tabpanel" id="pp-${k}" aria-labelledby="pt-${k}"${tab===k?'':' hidden'}>${html}</div>`;
  box.innerHTML=`${sum}<div class="pf-tabs" role="tablist" aria-label="${T('Your account','حسابكم')}">${TABS.map(([k,n])=>`<button type="button" role="tab" id="pt-${k}" aria-controls="pp-${k}" aria-selected="${tab===k}" data-tab="${k}"${tab===k?'':' tabindex="-1"'}>${n}</button>`).join('')}</div>
   ${pane('orders',`<h2 class="sr">${T('Your orders and files','طلباتكم وملفاتكم')}</h2>${list}`,'pf-files')}
   ${pane('details',`<form class="sheet pf-me" id="nf" novalidate><h2>${T('Your details','بياناتكم')}</h2>
     <div class="av-row"><span class="av">${me.photo?`<img src="${esc(me.photo)}" alt="">`:`<b aria-hidden="true">${esc((me.name||me.email||'?').trim()[0].toUpperCase())}</b>`}</span>
      <span class="av-acts"><label class="linkb" for="avIn">${me.photo?T('Change the photo','غيّروا الصورة'):T('Add a photo','أضيفوا صورة')}</label><input type="file" class="sr" id="avIn" accept="image/jpeg,image/png,image/webp">${me.photo?`<button class="linkb" type="button" id="avDel">${T('Remove','احذفوها')}</button>`:''}</span></div>
     <label class="fld">${T('Name','الاسم')}<input id="nm" autocomplete="name" maxlength="60" value="${esc(me.name||'')}" required></label>
     <label class="fld">${T('E-mail','البريد الإلكتروني')}<input value="${esc(me.email)}" disabled dir="ltr"></label>
     <label class="fld">${T('Phone','الهاتف')}<input id="ph" type="tel" autocomplete="tel" maxlength="30" dir="ltr" placeholder="+971 50 123 4567" value="${esc(me.phone||'')}"></label>
     <fieldset class="adr"><legend>${T('Address, for printed pieces','العنوان، للقطع المطبوعة')}</legend>
      <label class="fld">${T('Country','البلد')}<select id="ac" autocomplete="country"><option value="">${T('Choose','اختاروا')}</option>${countries().map(([c,n])=>`<option value="${c}"${a.country===c?' selected':''}>${esc(n)}</option>`).join('')}</select></label>
      <label class="fld">${T('City','المدينة')}<input id="aci" autocomplete="address-level2" maxlength="60" value="${esc(a.city||'')}"></label>
      <label class="fld">${T('Street and number','الشارع والرقم')}<input id="a1" autocomplete="address-line1" maxlength="120" value="${esc(a.line1||'')}"></label>
      <label class="fld">${T('Building, flat (optional)','المبنى، الشقة (اختياري)')}<input id="a2" autocomplete="address-line2" maxlength="120" value="${esc(a.line2||'')}"></label>
      <label class="fld">${T('Postcode','الرمز البريدي')}<input id="apc" autocomplete="postal-code" maxlength="12" dir="ltr" value="${esc(a.postal||'')}"></label></fieldset>
     <p class="fmsg" role="status"></p><button class="ink" type="submit">${T('Save','احفظوا')}</button></form>`)}
   ${pane('security',`<form class="sheet" id="pwf" novalidate><h2>${T('Password','كلمة المرور')}</h2>
     ${me.via==='google'?`<p>${T('You sign in with Google. You can also add a password here.','تدخلون عبر Google، ويمكنكم إضافة كلمة مرور هنا أيضًا.')}</p>`:`<label class="fld">${T('Current password','كلمة المرور الحالية')}<input id="opw" type="password" autocomplete="current-password"></label>`}
     <label class="fld">${T('New password','كلمة المرور الجديدة')}<input id="npw" type="password" autocomplete="new-password" minlength="10"><small>${T('At least 10 characters.','10 أحرف على الأقل.')}</small></label><p class="fmsg" role="status"></p><button class="ink" type="submit">${T('Change the password','غيّروا كلمة المرور')}</button></form><section class="sheet" id="tfs"><h2>${T('Two-step sign-in','التحقق بخطوتين')}</h2>${tfHTML()}</section><section class="sheet"><h2>${T('Signed in on','الأجهزة المسجّلة')}</h2>${devs||`<p>${T('Loading…','نحمّل…')}</p>`}</section>`,'pf-two')}
   ${pane('data',`<section class="sheet"><h2>${T('One painting a month','لوحة كل شهر')}</h2><p>${T('A new painting from Farah in your e-mail, once a month.','لوحة جديدة من فرح في بريدكم، مرة كل شهر.')}</p>
     <label class="tgl"><input type="checkbox" id="news" ${news?'checked':''} ${news===null?'disabled':''}><span>${T('Send it to ','أرسلوها إلى ')}${esc(me.email)}</span></label></section><section class="sheet"><h2>${T('Your data','بياناتكم')}</h2><p>${T('Take a copy of everything we keep about you, or leave.','خذوا نسخة من كل ما نحفظه عنكم، أو غادروا.')}</p>
     <div class="acts"><a class="linkb" href="/api/me/export" download>${T('Download my data','تحميل بياناتي')}</a><button class="linkb" type="button" id="out">${T('Sign out','الخروج')}</button><button class="linkb danger" type="button" id="del">${T('Delete the account','حذف الحساب')}</button></div></section>`,'pf-two')}`;
  const tabs=[...box.querySelectorAll('[data-tab]')],go=(k,focus)=>{tab=k;tabs.forEach(b=>{const on=b.dataset.tab===k;b.setAttribute('aria-selected',on);b.tabIndex=on?0:-1;if(on&&focus)b.focus()});
    box.querySelectorAll('.pf-p').forEach(x=>x.hidden=x.id!=='pp-'+k);history.replaceState(null,'','#'+k)};
  tabs.forEach((b,i)=>{b.onclick=()=>go(b.dataset.tab);b.onkeydown=e=>{const d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(!d)return;e.preventDefault();const n=tabs[(i+(AR?-d:d)+tabs.length)%tabs.length];go(n.dataset.tab,true)}});
  const say=(f,m,good)=>{const el=f.querySelector('.fmsg');el.textContent=m;el.classList.toggle('ok',!!good)};
  $('nf').onsubmit=async e=>{e.preventDefault();const f=e.target,n=$('nm').value.trim();if(!n)return say(f,T(...ERR.name_required));
    const g=id=>$(id).value.trim(),ph=g('ph');if(ph&&!/^[+\d][\d\s()-]{5,}$/.test(ph))return say(f,T(...ERR.phone_invalid));
    const r=await U.api('PATCH','/api/me',{name:n,phone:ph,addr:{country:$('ac').value,city:g('aci'),line1:g('a1'),line2:g('a2'),postal:g('apc')}});if(!r.ok)return say(f,err(r));me=r.data.user;U.set(me);$('pf-h').textContent=T('Hello, ','أهلًا، ')+n.split(' ')[0];say(f,T('Saved.','حُفظ.'),true)};
  $('pwf').onsubmit=async e=>{e.preventDefault();const f=e.target,np=$('npw').value;if(np.length<10)return say(f,T(...ERR.password_short));
    const r=await U.api('POST','/api/me/password',{old:($('opw')||{}).value||'',password:np});if(!r.ok)return say(f,err(r));f.reset();say(f,T('The password is changed.','تغيّرت كلمة المرور.'),true)};
  $('news').onchange=async e=>{const on=e.target.checked,r=await U.api('POST','/api/me/news',{on});if(r.ok){news=r.data.on;S.toast(news?T('You will get one painting a month.','ستصلكم لوحة كل شهر.'):T('The monthly e-mail is off.','أُوقفت الرسالة الشهرية.'))}else{e.target.checked=!on;S.toast(err(r))}};
  box.querySelectorAll('[data-end]').forEach(b=>b.onclick=async()=>{await U.api('DELETE','/api/me/sessions?id='+encodeURIComponent(b.dataset.end));loadSessions()});
  if($('endAll'))$('endAll').onclick=async()=>{await U.api('DELETE','/api/me/sessions');loadSessions()};
  $('avIn').onchange=async e=>{const file=e.target.files[0];if(!file)return;let b;try{b=await squareImage(file)}catch(x){return S.toast(T(...ERR.bad_type))}
    try{const res=await fetch('/api/me/avatar',{method:'POST',credentials:'same-origin',headers:{'content-type':b.type},body:b}),d=await res.json().catch(()=>({}));
      if(!res.ok)return S.toast(T(...(ERR[d.error]||['That did not save.','لم تُحفظ.'])));me=d.user;U.set(me);render();S.toast(T('Your photo is saved.','حُفظت صورتكم.'))}catch(x){S.toast(T('That did not save.','لم تُحفظ.'))}};
  if($('avDel'))$('avDel').onclick=async()=>{const r=await U.api('DELETE','/api/me/avatar');if(r.ok){me=r.data.user;U.set(me);render()}};
  const tfs=$('tfs'),tsay=m=>{const el=tfs.querySelector('.fmsg');if(el)el.textContent=m};
  if($('tfStart'))$('tfStart').onclick=async()=>{const r=await U.api('POST','/api/me/2fa/email/start');if(!r.ok)return tsay(err(r));tfStep='code';render();$('tfCode').focus()};
  if($('tfOn'))$('tfOn').onsubmit=async e=>{e.preventDefault();const r=await U.api('POST','/api/me/2fa/email/enable',{code:$('tfCode').value.trim()});if(!r.ok)return tsay(err(r));
    tfStep=null;me.twofa=true;me.twofa_method='email';U.set(me);render();S.toast(T('Two-step sign-in is on.','التحقق بخطوتين مفعّل.'))};
  if($('tfOff'))$('tfOff').onsubmit=async e=>{e.preventDefault();const r=await U.api('POST','/api/me/2fa/email/disable',{password:$('tfPw').value});if(!r.ok)return tsay(err(r));
    me.twofa=false;me.twofa_method=null;U.set(me);render();S.toast(T('Two-step sign-in is off.','أُوقف التحقق بخطوتين.'))};
  $('out').onclick=async()=>{await U.out();location.href='index.html'};
  $('del').onclick=()=>{$('delD').showModal()}}
async function loadSessions(){const r=await U.api('GET','/api/me/sessions');sessions=r.ok?r.data.sessions:[];render()}
$('delNo').onclick=()=>$('delD').close();
$('delYes').onclick=async()=>{const r=await U.api('DELETE','/api/me');if(r.ok){U.set(null);location.href='index.html'}else{$('delD').close();S.toast(err(r))}};
U.api('GET','/api/me').then(async r=>{if(r.offline){offline=true;me=null;render();return}
  me=r.data&&r.data.user;U.set(me||null);if(!me){location.replace('account.html?next=profile.html');return}
  render();
  const [o,n,s]=await Promise.all([U.api('GET','/api/me/orders'),U.api('GET','/api/me/news'),U.api('GET','/api/me/sessions')]);
  orders=o.ok?o.data.orders:[];news=n.ok?n.data.on:false;sessions=s.ok?s.data.sessions:[];render()});
MG.page(function(why){AR=MG.ar;if(why==='init'||why==='lang')render()});
})();
