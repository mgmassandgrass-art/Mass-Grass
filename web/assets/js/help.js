(function(){
'use strict';
let AR=MG.ar;
const S={esc:MG.esc,fmt:MG.fmt,toast:MG.toast,img:k=>'assets/'+k+'.webp',BAG:MG.bag,USER:{get:()=>MG.user.get(),set:u=>MG.user.set(u),api:MG.api,sync:()=>MG.user.sync(),out:()=>MG.user.out()}},U=S.USER,T=(en,ar)=>AR?ar:en,esc=S.esc,$=id=>document.getElementById(id);
const QA=[
 ['How do I get my files?','كيف تصلني الملفات؟','Right after you pay, the download links appear on the page and a copy reaches your email. If you have an account, every file also stays in your profile.','بعد الدفع مباشرة تظهر روابط التحميل في الصفحة، وتصل نسخة منها إلى بريدكم. وإن كان لديكم حساب، تبقى كل الملفات محفوظة فيه.'],
 ['What formats do I get?','ما صيغ الملفات؟','Paintings and postcards come as high-resolution PDF and PNG files (300 dpi). Stickers come as transparent PNG files with a cut line. The calendar is an A5 landscape PDF.','اللوحات والبطاقات البريدية بصيغتي PDF وPNG بدقة عالية (300 dpi). الملصقات بصيغة PNG بخلفية شفافة وخط قص. والتقويم ملف PDF بمقاس A5 عرضي.'],
 ['How big can I print?','إلى أي حجم يمكنني الطباعة؟','Up to A3 the print stays sharp. For anything bigger, write to us and we send a larger file.','حتى مقاس A3 تبقى الطباعة حادة. وللأكبر من ذلك، راسلونا ونرسل ملفًا أكبر.'],
 ['Can I sell prints or use them in products?','هل يمكنني بيع الطبعات أو استخدامها في منتجات؟','No. The files are for you: print them, hang them, give them as gifts. Selling them or putting them on products needs Farah’s written permission.','لا. الملفات لكم: اطبعوها وعلّقوها وأهدوها. أما البيع أو الاستخدام في منتجات فيحتاج إلى إذن مكتوب من فرح.'],
 ['Something is wrong with my file. Can I get a refund?','في الملف مشكلة. هل يمكنني استرداد المبلغ؟','If a file is broken or not what you ordered, write to us within 14 days and we fix it or refund you.','إن كان الملف تالفًا أو غير ما طلبتم، راسلونا خلال 14 يومًا ونصلحه أو نعيد المبلغ.'],
 ['Do you ship printed things?','هل تشحنون أشياء مطبوعة؟','Not yet. Everything in the shop today is a digital file you print at home.','ليس بعد. كل ما في المتجر اليوم ملفات رقمية تطبعونها في البيت.'],
 ['Where does the money go?','إلى أين يذهب المال؟','Straight to the studio in Gaza, for paint and paper, and so Farah can keep painting.','مباشرة إلى المرسم في غزة: ألوان وورق، لتواصل فرح الرسم.']];
const TOP=[['My order','طلبي'],['A file problem','مشكلة في ملف'],['A licence or a big print','رخصة أو طباعة كبيرة'],['Press or a collaboration','صحافة أو تعاون'],['Something else','موضوع آخر']];
let sent=false;
function render(){const open=[...document.querySelectorAll('#faq details')].map(d=>d.open);
  $('faq').innerHTML=QA.map((q,i)=>`<details${(open.length?open[i]:i===0)?' open':''}><summary>${T(q[0],q[1])}</summary><p>${T(q[2],q[3])}</p></details>`).join('');
  const u=U.get(),cf=$('cf');
  if(sent){cf.innerHTML=`<span class="fill"></span><h2>${T('Thank you','شكرًا لكم')}</h2><p class="fmsg ok" role="status">${T('Your message reached us. We write back within two days.','وصلتنا رسالتكم، ونرد خلال يومين.')}</p>`;return}
  const keep=id=>($(id)||{}).value;const v={n:keep('n')??(u?u.name:''),e:keep('e')??(u?u.email:''),s:keep('s'),m:keep('m')??''};
  cf.innerHTML=`<span class="fill"></span><h2>${T('Write to us','راسلونا')}</h2>
   <div class="two"><label class="fld">${T('Name','الاسم')}<input id="n" autocomplete="name" maxlength="60" value="${esc(v.n)}"></label><label class="fld">${T('Email','البريد الإلكتروني')}<input id="e" type="email" autocomplete="email" maxlength="120" value="${esc(v.e)}"></label></div>
   <label class="fld">${T('About','الموضوع')}<select id="s">${TOP.map((o,i)=>`<option value="${o[0]}"${v.s===o[0]?' selected':''}>${T(...o)}</option>`).join('')}</select></label>
   <label class="fld">${T('Message','الرسالة')}<textarea id="m" maxlength="3000">${esc(v.m)}</textarea></label>
   <p class="fmsg" role="status"></p><button class="ink" type="submit">${T('Send','أرسلوا')}</button>
   <div class="ways"><a href="mailto:info@massandgrass.com">info@massandgrass.com</a><a href="https://instagram.com/farahh.gaza" target="_blank" rel="noopener">Instagram</a></div>`;
  MG.tear()}
$('cf').onsubmit=async e=>{e.preventDefault();const f=$('cf'),say=m=>f.querySelector('.fmsg').textContent=m,em=$('e').value.trim(),m=$('m').value.trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)){say(T('We need your email to reply.','نحتاج إلى بريدكم لنرد عليكم.'));$('e').focus();return}
  if(m.length<5){say(T('Please write a few words.','اكتبوا بضع كلمات.'));$('m').focus();return}
  const b=f.querySelector('[type=submit]');b.disabled=true;const r=await U.api('POST','/api/contact',{name:$('n').value.trim(),email:em,topic:$('s').value,message:m});b.disabled=false;
  if(r.ok){sent=true;render();return}
  say(r.data&&r.data.error==='rate_limited'?T('Too many messages. Please try again later.','رسائل كثيرة. حاولوا لاحقًا.'):T('It did not go through. Write to info@massandgrass.com.','لم تصل الرسالة. راسلونا على info@massandgrass.com.'))};

MG.page(function(why){AR=MG.ar;if(why==='init'||why==='lang')render()});
})();
