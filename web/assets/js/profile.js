(function(){
'use strict';
let AR=MG.ar;
/* The profile: a summary (since when, orders, files, spent, parcels on the way), every paid order with its files and, for
   printed pieces, the parcel's state, tracking and address; then the settings: name, password, the monthly e-mail, the
   devices signed in, a copy of your data, sign out and delete. */
const S={esc:MG.esc,fmt:MG.fmt,toast:MG.toast,USER:{get:()=>MG.user.get(),set:u=>MG.user.set(u),api:MG.api,out:()=>MG.user.out()}},U=S.USER,T=(en,ar)=>AR?ar:en,esc=S.esc,$=id=>document.getElementById(id);
let me=U.get(),orders=null,offline=false,news=null,sessions=null;
const ERR={password_short:['The new password needs at least 10 characters.','تحتاج كلمة المرور الجديدة إلى 10 أحرف على الأقل.'],bad_credentials:['The current password is not right.','كلمة المرور الحالية غير صحيحة.'],
  name_required:['Please write your name.','اكتبوا اسمكم.'],rate_limited:['Too many tries. Please wait a little.','محاولات كثيرة. انتظروا قليلًا.']};
const err=r=>T(...(ERR[r.data&&r.data.error]||['Something went wrong. Please try again.','حدث خطأ. حاولوا مرة أخرى.']));
const date=d=>new Date(d).toLocaleDateString(AR?'ar-u-nu-latn':'en-GB',{day:'numeric',month:'long',year:'numeric'});
const thumb=i=>i.kind==='calendar'?(MG.calOf(i.k).cover||'assets/t-v2-00.webp'):'assets/'+(i.kind==='pack'?(i.pack||[])[0]:i.k)+'.webp';
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
function render(){const box=$('pf');
  if(!me){$('pf-h').textContent=T('Your account','حسابكم');$('pf-sub').textContent='';
    box.innerHTML=`<div class="pf-empty"><p>${offline?T('Accounts open with the shop. This preview cannot reach the server.','تُفتح الحسابات مع افتتاح المتجر. هذه المعاينة لا تصل إلى الخادم.'):T('Sign in to see your files and orders.','سجّلوا الدخول لتروا ملفاتكم وطلباتكم.')}</p><a class="ink" href="account.html?next=profile.html">${T('Sign in','الدخول')}</a></div>`;return}
  $('pf-h').textContent=T('Hello, ','أهلًا، ')+(me.name||'').split(' ')[0];$('pf-sub').textContent=me.email;
  const os=orders||[],nFiles=os.reduce((n,o)=>n+(o.files||[]).length,0),spent=os.reduce((n,o)=>n+(+o.total||0),0),onWay=os.filter(o=>o.ship_status&&o.ship_status!=='delivered').length;
  const sum=`<ul class="pf-sum" aria-label="${T('Your account in numbers','حسابكم بالأرقام')}">
    <li><b>${me.joined?date(me.joined):'-'}</b><span>${T('With us since','معنا منذ')}</span></li>
    <li><b>${os.length}</b><span>${T('Orders','الطلبات')}</span></li>
    <li><b>${nFiles}</b><span>${T('Files','الملفات')}</span></li>
    <li><b>${spent?S.fmt(spent):'€0'}</b><span>${T('Spent with Farah','دعمتم بها فرح')}</span></li>
    <li><b>${onWay}</b><span>${T('Parcels on the way','طرود في الطريق')}</span></li></ul>`;
  const list=orders===null?`<p class="fmsg ok" role="status">${T('Loading your orders…','نحمّل طلباتكم…')}</p>`:os.length?os.map(orderHTML).join('')
    :`<div class="pf-empty"><p>${T('No orders yet. Everything you buy stays here.','لا طلبات بعد. كل ما تشترونه يبقى هنا.')}</p><a class="go" href="shop.html">${T('See the shop','شاهدوا المتجر')}</a></div>`;
  const devs=sessions===null?'':`<ul class="devs">${sessions.map(x=>`<li><span>${esc(device(x.ua))}${x.current?` <em>${T('this one','هذا الجهاز')}</em>`:''}</span><small>${date(x.seen)}${x.ip?', '+esc(x.ip):''}</small>${x.current?'':`<button class="linkb" type="button" data-end="${esc(x.id)}">${T('Sign out','إخراج')}</button>`}</li>`).join('')}</ul>${sessions.length>1?`<button class="linkb" type="button" id="endAll">${T('Sign out everywhere else','الخروج من كل الأجهزة الأخرى')}</button>`:''}`;
  box.innerHTML=`${sum}<div class="pf-grid"><section class="pf-files" aria-labelledby="files-h"><h2 class="sec" id="files-h">${T('Your orders and files','طلباتكم وملفاتكم')}</h2>${list}</section>
   <div class="pf-set"><form class="sheet" id="nf" novalidate><h2>${T('Your name','الاسم')}</h2>
     <label class="fld"><span class="sr">${T('Your name','الاسم')}</span><input id="nm" autocomplete="name" maxlength="60" value="${esc(me.name||'')}"></label><p class="fmsg" role="status"></p><button class="ink" type="submit">${T('Save','احفظوا')}</button></form>
    <form class="sheet" id="pwf" novalidate><h2>${T('Password','كلمة المرور')}</h2>
     ${me.via==='google'?`<p>${T('You sign in with Google. You can also add a password here.','تدخلون عبر Google، ويمكنكم إضافة كلمة مرور هنا أيضًا.')}</p>`:`<label class="fld">${T('Current password','كلمة المرور الحالية')}<input id="opw" type="password" autocomplete="current-password"></label>`}
     <label class="fld">${T('New password','كلمة المرور الجديدة')}<input id="npw" type="password" autocomplete="new-password" minlength="10"><small>${T('At least 10 characters.','10 أحرف على الأقل.')}</small></label><p class="fmsg" role="status"></p><button class="ink" type="submit">${T('Change the password','غيّروا كلمة المرور')}</button></form>
    <section class="sheet"><h2>${T('One painting a month','لوحة كل شهر')}</h2><p>${T('A new painting from Farah in your e-mail, once a month.','لوحة جديدة من فرح في بريدكم، مرة كل شهر.')}</p>
     <label class="tgl"><input type="checkbox" id="news" ${news?'checked':''} ${news===null?'disabled':''}><span>${T('Send it to ','أرسلوها إلى ')}${esc(me.email)}</span></label></section>
    <section class="sheet"><h2>${T('Signed in on','الأجهزة المسجّلة')}</h2>${devs||`<p>${T('Loading…','نحمّل…')}</p>`}</section>
    <section class="sheet"><h2>${T('Your data','بياناتكم')}</h2><p>${T('Take a copy of everything we keep about you, or leave.','خذوا نسخة من كل ما نحفظه عنكم، أو غادروا.')}</p>
     <div class="acts"><a class="linkb" href="/api/me/export" download>${T('Download my data','تحميل بياناتي')}</a><button class="linkb" type="button" id="out">${T('Sign out','الخروج')}</button><button class="linkb danger" type="button" id="del">${T('Delete the account','حذف الحساب')}</button></div></section></div></div>`;
  const say=(f,m,good)=>{const el=f.querySelector('.fmsg');el.textContent=m;el.classList.toggle('ok',!!good)};
  $('nf').onsubmit=async e=>{e.preventDefault();const f=e.target,n=$('nm').value.trim();if(!n)return say(f,T(...ERR.name_required));
    const r=await U.api('PATCH','/api/me',{name:n});if(!r.ok)return say(f,err(r));me=r.data.user;U.set(me);$('pf-h').textContent=T('Hello, ','أهلًا، ')+n.split(' ')[0];say(f,T('Saved.','حُفظ.'),true)};
  $('pwf').onsubmit=async e=>{e.preventDefault();const f=e.target,np=$('npw').value;if(np.length<10)return say(f,T(...ERR.password_short));
    const r=await U.api('POST','/api/me/password',{old:($('opw')||{}).value||'',password:np});if(!r.ok)return say(f,err(r));f.reset();say(f,T('The password is changed.','تغيّرت كلمة المرور.'),true)};
  $('news').onchange=async e=>{const on=e.target.checked,r=await U.api('POST','/api/me/news',{on});if(r.ok){news=r.data.on;S.toast(news?T('You will get one painting a month.','ستصلكم لوحة كل شهر.'):T('The monthly e-mail is off.','أُوقفت الرسالة الشهرية.'))}else{e.target.checked=!on;S.toast(err(r))}};
  box.querySelectorAll('[data-end]').forEach(b=>b.onclick=async()=>{await U.api('DELETE','/api/me/sessions?id='+encodeURIComponent(b.dataset.end));loadSessions()});
  if($('endAll'))$('endAll').onclick=async()=>{await U.api('DELETE','/api/me/sessions');loadSessions()};
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
