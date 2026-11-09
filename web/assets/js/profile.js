(function(){
'use strict';
let AR=MG.ar;
/* the profile: files from every paid order, name, password, a copy of your data, sign out and delete */
const S={esc:MG.esc,fmt:MG.fmt,toast:MG.toast,img:k=>'assets/'+k+'.webp',BAG:MG.bag,USER:{get:()=>MG.user.get(),set:u=>MG.user.set(u),api:MG.api,sync:()=>MG.user.sync(),out:()=>MG.user.out()}},U=S.USER,T=(en,ar)=>AR?ar:en,esc=S.esc,$=id=>document.getElementById(id);
let me=U.get(),orders=null,offline=false;
const ERR={password_short:['The new password needs at least 10 characters.','تحتاج كلمة المرور الجديدة إلى 10 أحرف على الأقل.'],bad_credentials:['The current password is not right.','كلمة المرور الحالية غير صحيحة.'],
  name_required:['Please write your name.','اكتبوا اسمكم.'],rate_limited:['Too many tries. Please wait a little.','محاولات كثيرة. انتظروا قليلًا.']};
const err=r=>T(...(ERR[r.data&&r.data.error]||['Something went wrong. Please try again.','حدث خطأ. حاولوا مرة أخرى.']));
const date=d=>new Date(d).toLocaleDateString(AR?'ar-u-nu-latn':'en-GB',{day:'numeric',month:'long',year:'numeric'});
function render(){const box=$('pf');
  if(!me){$('pf-h').textContent=T('Your account','حسابكم');$('pf-sub').textContent='';
    box.innerHTML=`<div class="pf-empty"><p>${offline?T('Accounts open with the shop. This preview cannot reach the server.','تُفتح الحسابات مع افتتاح المتجر. هذه المعاينة لا تصل إلى الخادم.'):T('Sign in to see your files and orders.','سجّلوا الدخول لتروا ملفاتكم وطلباتكم.')}</p><a class="ink" href="account.html?next=profile.html">${T('Sign in','الدخول')}</a></div>`;return}
  $('pf-h').textContent=T('Hello, ','أهلًا، ')+(me.name||'').split(' ')[0];$('pf-sub').textContent=me.email;
  const list=orders===null?`<p class="fmsg ok" role="status">${T('Loading your files…','نحمّل ملفاتكم…')}</p>`:orders.length?orders.map(o=>`<article class="order"><div class="order-hd"><b>${esc(o.id)}</b><span>${date(o.date)}</span><span>${S.fmt(o.total)}</span></div>
      <div class="its">${o.items.map(i=>`<span><img src="${esc(S.img(i.kind==='pack'?(i.pack||[])[0]:i.k))}" alt="">${esc(AR?(i.ta||i.t):i.t)}</span>`).join('')}</div>
      ${(o.files||[]).length?`<ul class="files">${o.files.map(f=>`<li><a href="${esc(f.url)}" download><span>${esc(f.name)}</span><small>${T('Download','تحميل')}</small></a></li>`).join('')}</ul>`:`<p class="fmsg ok">${T('Farah is preparing these files. They reach your email within a day.','تجهّز فرح هذه الملفات، وتصل إلى بريدكم خلال يوم.')}</p>`}</article>`).join('')
    :`<div class="pf-empty"><p>${T('No files yet. Everything you buy stays here.','لا ملفات بعد. كل ما تشترونه يبقى هنا.')}</p><a class="go" href="paintings.html">${T('See the paintings','شاهدوا اللوحات')}</a></div>`;
  box.innerHTML=`<div class="pf-grid"><section class="pf-files" aria-labelledby="files-h"><h2 class="sec" id="files-h">${T('Your files','ملفاتكم')}</h2>${list}</section>
   <div class="pf-set"><form class="sheet paper" data-tear="6" id="nf" novalidate><span class="fill"></span><h2>${T('Your name','الاسم')}</h2>
     <label class="fld"><span class="sr">${T('Your name','الاسم')}</span><input id="nm" autocomplete="name" maxlength="60" value="${esc(me.name||'')}"></label><p class="fmsg" role="status"></p><button class="ink" type="submit">${T('Save','احفظوا')}</button></form>
    <form class="sheet paper" data-tear="6" id="pwf" novalidate><span class="fill"></span><h2>${T('Password','كلمة المرور')}</h2>
     ${me.via==='google'?`<p>${T('You sign in with Google. You can also add a password here.','تدخلون عبر Google، ويمكنكم إضافة كلمة مرور هنا أيضًا.')}</p>`:`<label class="fld">${T('Current password','كلمة المرور الحالية')}<input id="opw" type="password" autocomplete="current-password"></label>`}
     <label class="fld">${T('New password','كلمة المرور الجديدة')}<input id="npw" type="password" autocomplete="new-password" minlength="10"><small>${T('At least 10 characters.','10 أحرف على الأقل.')}</small></label><p class="fmsg" role="status"></p><button class="ink" type="submit">${T('Change the password','غيّروا كلمة المرور')}</button></form>
    <section class="sheet paper" data-tear="6"><span class="fill"></span><h2>${T('Your data','بياناتكم')}</h2><p>${T('Take a copy of everything we keep about you, or leave.','خذوا نسخة من كل ما نحفظه عنكم، أو غادروا.')}</p>
     <div class="acts"><a class="linkb" href="/api/me/export" download>${T('Download my data','تحميل بياناتي')}</a><button class="linkb" type="button" id="out">${T('Sign out','الخروج')}</button><button class="linkb danger" type="button" id="del">${T('Delete the account','حذف الحساب')}</button></div></section></div></div>`;
  MG.tear()
  const say=(f,m,good)=>{const el=f.querySelector('.fmsg');el.textContent=m;el.classList.toggle('ok',!!good)};
  $('nf').onsubmit=async e=>{e.preventDefault();const f=e.target,n=$('nm').value.trim();if(!n)return say(f,T(...ERR.name_required));
    const r=await U.api('PATCH','/api/me',{name:n});if(!r.ok)return say(f,err(r));me=r.data.user;U.set(me);$('pf-h').textContent=T('Hello, ','أهلًا، ')+n.split(' ')[0];say(f,T('Saved.','حُفظ.'),true)};
  $('pwf').onsubmit=async e=>{e.preventDefault();const f=e.target,np=$('npw').value;if(np.length<10)return say(f,T(...ERR.password_short));
    const r=await U.api('POST','/api/me/password',{old:($('opw')||{}).value||'',password:np});if(!r.ok)return say(f,err(r));f.reset();say(f,T('The password is changed.','تغيّرت كلمة المرور.'),true)};
  $('out').onclick=async()=>{await U.out();location.href='index.html'};
  $('del').onclick=()=>{$('delD').showModal();MG.tear()}}
$('delNo').onclick=()=>$('delD').close();
$('delYes').onclick=async()=>{const r=await U.api('DELETE','/api/me');if(r.ok){U.set(null);location.href='index.html'}else{$('delD').close();S.toast(err(r))}};
U.api('GET','/api/me').then(async r=>{if(r.offline){offline=true;me=null;render();return}
  me=r.data&&r.data.user;U.set(me||null);if(!me){location.replace('account.html?next=profile.html');return}
  render();const o=await U.api('GET','/api/me/orders');orders=o.ok?o.data.orders:[];render()});

MG.page(function(why){AR=MG.ar;if(why==='init'||why==='lang')render()});
})();
