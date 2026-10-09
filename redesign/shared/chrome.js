/* shared header/footer behaviour for the generated pages: language, theme, menu, footer links */
(function(){
'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const BASE={
 home:{ar:'الرئيسية',en:'Home'},menu:{ar:'القائمة',en:'Menu'},basket:{ar:'السلة',en:'Basket'},close:{ar:'إغلاق ✕',en:'Close ✕'},
 handPainted:{ar:'رسومات مائية مرسومة باليد',en:'Hand-painted watercolours'},rights:{ar:'جميع الرسومات © فرح الحلو',en:'All artwork © Farah Al Helou'},
 dark:{ar:'الوضع الليلي',en:'Dark mode'},light:{ar:'الوضع النهاري',en:'Light mode'},added:{ar:'أُضيفت إلى السلة',en:'Added to your basket'},from:{ar:'من',en:'from'}
};
const NAV=[['shop.html','كل المنتجات','All products'],['paintings.html','اللوحات','Paintings'],['postcards.html','البطاقات البريدية','Postcards'],['stickers.html','الملصقات','Stickers'],['apparel.html','الملابس والحقائب والقبعات','Apparel, totes & caps'],['calendar.html','التقويم السنوي','Calendar'],['books.html','الكتب والقصص المصورة','Books & stories'],['designs.html','تصاميم متنوعة','More designs']],NAV2=[['story.html','الحكاية','Our story'],['story.html#support','دعم الحكاية','Support the story'],['contact.html','تواصل معنا','Contact']];
const INFO=[['shipping.html','الشحن والإرجاع','Shipping & returns'],['faq.html','الأسئلة الشائعة','FAQ'],['track.html','تتبّع الطلب','Track an order'],['contact.html','تواصل معنا','Contact'],['wholesale.html','البيع بالجملة','Wholesale'],['terms.html','الشروط والرخصة','Terms & licence'],['privacy.html','الخصوصية','Privacy']];
let LANG='en';try{LANG=localStorage.getItem('mg-lang')||'en'}catch(e){}
const P=window.PAGE||{T:{},render(){}};const T=Object.assign({},BASE,P.T);
const tr=k=>{const v=T[k];return v?(v[LANG]??v.ar):k},L=o=>o==null?'':(o[LANG]??o.ar);
let tt;function toast(m){const t=$('#toast');if(!t)return;t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),2600)}
window.UI={$,$$,esc,tr,L,toast,get lang(){return LANG}};
function apply(){
  document.body.dataset.lang=LANG;document.documentElement.lang=LANG;document.documentElement.dir=LANG==='ar'?'rtl':'ltr';
  $$('[data-t]').forEach(n=>n.textContent=tr(n.dataset.t));$$('[data-th]').forEach(n=>n.innerHTML=tr(n.dataset.th));
  $$('[data-tl]').forEach(n=>n.setAttribute('aria-label',tr(n.dataset.tl)));$$('[data-tp]').forEach(n=>n.placeholder=tr(n.dataset.tp));
  $('#langBtn').textContent=LANG==='ar'?'EN':'ع';$('#langBtn').setAttribute('aria-label',LANG==='ar'?'English':'العربية');
  const a=(l)=>`<a href="${l[0]}">${esc(LANG==='ar'?l[1]:l[2])}</a>`,here=location.pathname.split('/').pop();
  $('#navList').innerHTML=`<button class="xbtn" id="drawerX">${esc(tr('close'))}</button><small>SHOP</small>`+NAV.map(a).join('')+'<small>MASS &amp; GRASS</small>'+NAV2.map(a).join('');
  $('#drawerX').onclick=()=>$('#drawer').hidden=true;
  $('#flinks').innerHTML=`<a href="index.html">${esc(tr('home'))}</a>`+NAV.concat(NAV2).map(a).join('');
  $$('#navList a,#flinks a,#finfo a').forEach(x=>{if(x.getAttribute('href')===here)x.setAttribute('aria-current','page')});
  syncTheme();P.render();if(window.MGCart)MGCart.badge();
}
$('#langBtn').onclick=()=>{LANG=LANG==='ar'?'en':'ar';try{localStorage.setItem('mg-lang',LANG)}catch(e){}apply()};
const dmq=matchMedia('(prefers-color-scheme: dark)');
function dark(){const t=document.documentElement.dataset.theme;return t?t==='dark':dmq.matches}
function syncTheme(){const d=dark();document.documentElement.dataset.theme=d?'dark':'light';$('#themeBtn').setAttribute('aria-label',tr(d?'light':'dark'))}
try{const t=localStorage.getItem('mg-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}
$('#themeBtn').onclick=()=>{const n=dark()?'light':'dark';document.documentElement.dataset.theme=n;try{localStorage.setItem('mg-theme',n)}catch(e){}syncTheme()};
$('#menuBtn').onclick=()=>$('#drawer').hidden=false;
$('#drawer').addEventListener('click',e=>{if(e.target.id==='drawer'||e.target.tagName==='A')$('#drawer').hidden=true});
document.addEventListener('keydown',e=>{if(e.key==='Escape')$('#drawer').hidden=true});
$('#bagBtn').onclick=()=>location.href='checkout.html';
(function(){let s=77;const r=()=>(s=(s*16807)%2147483647)/2147483647;const pts=['0,0'];for(let i=0;i<=90;i++)pts.push((i/90*100).toFixed(2)+','+(i%2?r()*5+4:r()*3+1).toFixed(2));pts.push('100,0');const f=$('#footEdge');if(f)f.setAttribute('points',pts.join(' '))})();
apply();
})();
