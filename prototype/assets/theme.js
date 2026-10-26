/* Mass & Grass site theme: the full top menu on every page, and the shared reveal motion. */
(function(){
  const MENU=[['index.html','Home','الرئيسية'],['paintings.html','Paintings','اللوحات'],['postcards.html','Postcards','البطاقات البريدية'],
    ['stickers.html','Stickers','الملصقات'],['calendar.html','Calendar','التقويم'],['shop.html','Shop','المتجر'],['story.html','Story','الحكاية']];
  const page=(location.pathname.split('/').pop()||'index.html').replace(/^$/,'index.html');
  const isAR=()=>document.documentElement.lang==='ar'||document.body.classList.contains('ar-on');

  function menu(){const nav=document.querySelector('header nav:not(.tabs):not(.toc):not(.mstrip)');if(!nav)return;
    nav.setAttribute('aria-label','Main');
    nav.innerHTML=MENU.map(([h,en,ar])=>`<a href="${h}"${h===page||(page==='index.html'&&h==='index.html')?' class="on" aria-current="page"':''} data-menu-en="${en}" data-menu-ar="${ar}">${isAR()?ar:en}</a>`).join('');
    // keep the menu in the visitor's language whenever the page switches it
    new MutationObserver(()=>nav.querySelectorAll('a').forEach(a=>{a.textContent=isAR()?a.dataset.menuAr:a.dataset.menuEn}))
      .observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    // on phones the menu scrolls sideways: start it at the page you're on
    const on=nav.querySelector('.on');if(on&&nav.scrollWidth>nav.clientWidth)on.scrollIntoView({block:'nearest',inline:'center'})}

  // a quiet line of reassurance above the footer, where people decide to buy
  const TRUST=[['M4 13l4 4L20 5','Instant download','تحميل فوري'],['M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z','Secure checkout','دفع آمن'],
    ['M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z','Every piece supports Farah in Gaza','كل قطعة تدعم فرح في غزة']];
  function trust(){if(/^(checkout|account|profile|404)\.html$/.test(page)||document.querySelector('.mgtrust'))return;const f=document.querySelector('footer');if(!f)return;
    const d=document.createElement('div');d.className='mgtrust';
    d.innerHTML=TRUST.map(([p,en,ar])=>`<span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${p}"/></svg><b data-t-en="${en}" data-t-ar="${ar}">${isAR()?ar:en}</b></span>`).join('');
    f.before(d);new MutationObserver(()=>d.querySelectorAll('b').forEach(b=>b.textContent=isAR()?b.dataset.tAr:b.dataset.tEn)).observe(document.documentElement,{attributes:true,attributeFilter:['lang']})}

  function motion(){if(!window.gsap||!window.ScrollTrigger||document.getElementById('cal27'))return; // the home page runs its own
    gsap.registerPlugin(ScrollTrigger);
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)',()=>{
      gsap.utils.toArray('main h2, section h2, .shead h2').forEach(h=>{
        gsap.from(h,{y:12,opacity:0,duration:.6,ease:'power3.out',scrollTrigger:{trigger:h,start:'top 88%',once:true}})})})}

  const go=()=>{menu();trust();motion()};
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',go):go();
})();
