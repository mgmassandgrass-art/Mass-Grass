/* Palestine, a journey through time and space: Farah's 2026 calendar set for 2027, laid out like the 2027 calendar's page:
   1 · the owner's photograph of two calendars on their acrylic stands, and buy;
   2 · the twelve months in a row; a click shows that month on the calendar on its stand (pdm-base + pdp-MM, from
       tools/palestine/month_on_stand.py), with its name and its line;
   3 · every page: the cover, then the months two by two;
   4 · the 2027 calendar. */
(function () {
  'use strict';
  const { $, $$, esc, t, L } = MG, C = MG.palestine, P = C.pages, M = MG.calendar;
  const pad = (n) => String(n).padStart(2, '0');
  const mon = (p) => (p.m ? (MG.ar ? M.monthsAr[p.m - 1] : M.months[p.m - 1]) : t('The cover', 'الغلاف'));
  const SEASON = (m) => (m === 12 || m < 3 ? t('Winter', 'الشتاء') : m < 6 ? t('Spring', 'الربيع') : m < 9 ? t('Summer', 'الصيف') : t('Autumn', 'الخريف'));
  const MS = P.filter((p) => p.m > 0), row = $('#btrow'), pg = $('#btspg');
  let sel = 0;
  /* the row of months: each page small, its month under it */
  row.innerHTML = MS.map((p, i) => `<li><button type="button" class="btb psb" data-i="${i}" aria-pressed="${!i}"><img src="assets/t-ps-${pad(p.m)}.webp" alt="" draggable="false" loading="lazy"><span class="btn-n"></span></button></li>`).join('');
  const bts = $$('.btb', row);
  /* the calendar on its stand: one photograph, and only its page changes; all twelve are fetched once the section comes near */
  pg.innerHTML = MS.map((p, i) => `<img src="assets/pdp-${pad(p.m)}.webp" alt="" ${i ? 'loading="lazy" ' : ''}decoding="async" draggable="false"${i ? '' : ' class="on"'}>`).join('');
  const pgs = $$('img', pg);
  new IntersectionObserver((es, o) => es.forEach((en) => { if (en.isIntersecting) { pgs.forEach((im) => { im.loading = 'eager'; }); o.disconnect(); } }), { rootMargin: '600px' }).observe(pg);
  function show(i, scroll) {
    sel = (i + MS.length) % MS.length; const p = MS[sel];
    bts.forEach((b, k) => b.setAttribute('aria-pressed', String(k === sel)));
    pgs.forEach((im, k) => im.classList.toggle('on', k === sel));
    $('.bts-base').alt = `${mon(p)} 2027, ${L(p.n)}, ${t('on the calendar on its stand', 'على التقويم فوق حامله')}`;
    $('#btss').textContent = SEASON(p.m) + ' 2027'; $('#btsn').textContent = mon(p); $('#btsq').textContent = L(p.n); $('#btsd').textContent = L(p.d);
    if (scroll) { const r = $('#btshow').getBoundingClientRect(); if (r.top > innerHeight * .7 || r.bottom < 0) $('#btshow').scrollIntoView({ behavior: MG.still ? 'auto' : 'smooth', block: 'center' }); }
  }
  row.addEventListener('click', (e) => { const b = e.target.closest('.btb'); if (b) show(+b.dataset.i, true); });

  function printBlock() {
    const pr = MG.printOf('calendar', C.id), sh = Object.values(MG.shipping), to = sh.length ? sh.map((c) => L(c.name)).join(t(' and ', ' و')) : t('the UAE and Denmark', 'الإمارات والدنمارك');
    if (pr && MG.shipping.ALL) return `${MG.printBtn('calendar', C.id, 'ghost')}<p class="pnote">${MG.shipping.ALL.fee ? t('Printed copies are shipped to every country.', 'نشحن النسخ المطبوعة إلى كل الدول.') : t('Printed on paper and shipped to every country, shipping included.', 'مطبوع على الورق ويُشحن إلى كل الدول، والشحن مشمول.')}</p>`;
    return pr ? `${MG.printBtn('calendar', C.id, 'ghost')}<p class="pnote">${t('Printed copies are shipped to ', 'نشحن النسخ المطبوعة إلى ')}${esc(to)}.</p>`
      : `<p class="pnote">${t('Printed copies, shipped to the UAE and Denmark, open soon.', 'النسخ المطبوعة، بالشحن إلى الإمارات والدنمارك، قريبًا.')}</p>`;
  }
  MG.page(function (why) {
    $('#psprint').innerHTML = printBlock();
    if (why === 'bag' || why === 'user') return;
    bts.forEach((b, i) => { b.setAttribute('aria-label', mon(MS[i])); b.querySelector('.btn-n').textContent = MG.ar ? mon(MS[i]) : mon(MS[i]).slice(0, 3); });
    $('#pspages').innerHTML = P.map((p) => `<li${p.m ? '' : ' class="cfl-cover"'}><img src="assets/ps-${pad(p.m)}.webp" alt="${esc(p.m ? mon(p) + ' 2027, ' + L(p.n) : t('The cover: a clay jug on a tiled plate', 'الغلاف: جرّة فخار على صحن من البلاط'))}" loading="lazy" decoding="async"></li>`).join('');
    $('#olgrid').innerHTML = `<li><a class="ol-c" href="calendar.html"><span class="ol-im"><img src="assets/cal-hero-m.webp" alt="" loading="lazy"></span><span class="ol-y">${t('New for 2027', 'جديد لعام 2027')}</span><span class="ol-n">${esc(t('Things kept in bottles', 'أشياء نحفظها في قوارير'))}</span><span class="ol-p"><b>${MG.fmt(MG.price('calendar'))}</b><span class="go">${t('Open the calendar', 'افتحوا التقويم')}</span></span></a></li>`;
    $$('[data-alt-ar]').forEach((e) => { if (e.dataset.altEn == null) e.dataset.altEn = e.alt; e.alt = MG.ar ? e.dataset.altAr : e.dataset.altEn; });
    show(sel);
  });
})();
