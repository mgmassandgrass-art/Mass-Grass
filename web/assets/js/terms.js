(function(){
'use strict';
let AR=MG.ar;
const T=(en,ar)=>AR?ar:en,$=id=>document.getElementById(id);
const D=[['licence','Licence','الرخصة',[
  ['What you get','ما تحصلون عليه','When you buy a file you get a personal licence to use it. The painting and its copyright stay with Farah Al-Helou.','عند شراء ملف تحصلون على رخصة استخدام شخصي. تبقى اللوحة وحقوقها لفرح الحلو.'],
  ['You may','يُسمح لكم',['Print it for your home or office','Use it as a phone or desktop wallpaper','Send a postcard file to friends','Give a print as a gift'],['طباعته لبيتكم أو مكتبكم','استخدامه خلفية للهاتف أو الحاسوب','إرسال ملف البطاقة البريدية إلى أصدقائكم','إهداء طبعة منه']],
  ['You may not','لا يُسمح لكم',['Sell the file or prints of it','Put it on products for sale','Share it publicly for download','Use it to train AI','Remove the signature'],['بيع الملف أو طبعاته','وضعه على منتجات للبيع','نشره للتحميل العام','استخدامه لتدريب الذكاء الاصطناعي','إزالة التوقيع']]]],
 ['sale','Terms of sale','شروط البيع',[
  ['Prices and payment','الأسعار والدفع','Prices are in euros and include all fees. You pay through PayPal, with your PayPal account or a card; we never see your card.','الأسعار باليورو وتشمل كل الرسوم. تدفعون عبر PayPal بحسابكم أو ببطاقتكم، ولا نرى بطاقتكم أبدًا.'],
  ['Delivery','التسليم','Files arrive at once, on the page and by email. Printed pieces are made to order and shipped to the United Arab Emirates and Denmark only; we e-mail you when the parcel leaves, and the delivery time is shown at checkout.','تصل الملفات فورًا في الصفحة وعلى البريد الإلكتروني. تُطبع القطع المطبوعة عند الطلب وتُشحن إلى الإمارات العربية المتحدة والدنمارك فقط، ونراسلكم عند خروج الطرد، وتظهر مدة الوصول عند الشراء.'],
  ['Refunds','الاسترداد','Files arrive at once, so sales are final. If a file is broken or not what you ordered, write within 14 days and we fix it or refund you.','تصل الملفات فورًا، لذا يكون البيع نهائيًا. إن كان الملف تالفًا أو غير ما طلبتم، راسلونا خلال 14 يومًا ونصلحه أو نعيد المبلغ.'],
  ['Printed pieces','القطع المطبوعة','If a print arrives damaged or wrong, send us a photo within 14 days and we print it again or refund you. Shipping fees are refunded only when the mistake is ours.','إن وصلت القطعة المطبوعة تالفة أو غير ما طلبتم، أرسلوا لنا صورة خلال 14 يومًا فنطبعها من جديد أو نردّ المبلغ. لا تُردّ أجرة الشحن إلا إذا كان الخطأ منّا.']]],
 ['privacy','Privacy','الخصوصية',[
  ['What we keep','ما نحفظه','Your name, email and orders. If you sign in with Google, Google sends us your name, email and photo.','اسمكم وبريدكم وطلباتكم. وعند الدخول عبر Google يرسل لنا Google اسمكم وبريدكم وصورتكم.'],
  ['What we do with it','ما نفعله بها','We deliver your files, run your account and, if you agree, send the monthly painting email. We never sell your data.','نوصل ملفاتكم وندير حسابكم، ونرسل رسالة اللوحة الشهرية إن وافقتم. ولا نبيع بياناتكم أبدًا.'],
  ['Your rights','حقوقكم','Download a copy of your data or delete your account at any time from your account page, or write to info@massandgrass.com.','يمكنكم تحميل نسخة من بياناتكم أو حذف حسابكم في أي وقت من صفحة الحساب، أو مراسلتنا على info@massandgrass.com.']]]];
const body=x=>Array.isArray(x)?`<ul>${x.map(i=>`<li>${i}</li>`).join('')}</ul>`:`<p>${x}</p>`;
function render(){$('toc').innerHTML=D.map(d=>`<a href="#${d[0]}">${T(d[1],d[2])}</a>`).join('');
  $('doc').innerHTML=D.map(d=>`<section id="${d[0]}"><h2>${T(d[1],d[2])}</h2>${d[3].map(x=>`<h3>${T(x[0],x[1])}</h3>${body(AR?x[3]:x[2])}`).join('')}</section>`).join('')+`<p class="upd">${T('Last updated 3 November 2026.','آخر تحديث: 3 تشرين الثاني 2026.')}</p>`}

MG.page(function(why){AR=MG.ar;if(why==='init'||why==='lang')render()});
})();
