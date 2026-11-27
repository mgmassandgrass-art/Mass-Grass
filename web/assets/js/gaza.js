/* Places in Gaza: Farah's 2025 calendar set for 2027, laid out like the Palestine calendar's page:
   1 · the photograph of two calendars on wooden stands, and buy;
   2 · the twelve months in a row; a click lays that month on the calendar on its wooden stand (gzs-base + gzs-MM, from
       tools/gaza/month_on_stand.py), with its place and its line;
   3 · the QR codes: every page opens its place's story (/g/MM);
   4 · every page: the cover, then the months two by two;
   5 · size and printing (MG.calSpec); 6 · the other 2027 calendars. */
(function () {
  'use strict';
  const { $, $$, esc, t, L } = MG, C = MG.gaza, P = C.pages, M = MG.calendar;
  const pad = (n) => String(n).padStart(2, '0');
  const mon = (p) => (p.m ? (MG.ar ? M.monthsAr[p.m - 1] : M.months[p.m - 1]) : t('The cover', 'الغلاف'));
  const MS = P.filter((p) => p.m > 0), row = $('#btrow'), pg = $('#btspg');
  let sel = 0;
  /* the row of months: each page small, its month under it */
  row.innerHTML = MS.map((p, i) => `<li><button type="button" class="btb psb" data-i="${i}" aria-pressed="${!i}"><img src="assets/t-gz-${pad(p.m)}.webp" alt="" draggable="false" loading="lazy"><span class="btn-n"></span></button></li>`).join('');
  const bts = $$('.btb', row);
  /* the calendar on its stand: one photograph, and only its page changes; all twelve are fetched once the section comes near */
  pg.innerHTML = MS.map((p, i) => `<img src="assets/gzs-${pad(p.m)}.webp" alt="" ${i ? 'loading="lazy" ' : ''}decoding="async" draggable="false"${i ? '' : ' class="on"'}>`).join('');
  const pgs = $$('img', pg);
  new IntersectionObserver((es, o) => es.forEach((en) => { if (en.isIntersecting) { pgs.forEach((im) => { im.loading = 'eager'; }); o.disconnect(); } }), { rootMargin: '600px' }).observe(pg);
  function show(i, scroll) {
    sel = (i + MS.length) % MS.length; const p = MS[sel];
    bts.forEach((b, k) => b.setAttribute('aria-pressed', String(k === sel)));
    pgs.forEach((im, k) => im.classList.toggle('on', k === sel));
    $('.bts-base').alt = `${mon(p)} 2027, ${L(p.n)}, ${t('on the calendar on its stand', 'على التقويم فوق حامله')}`;
    $('#btss').textContent = mon(p) + ' 2027'; $('#btsn').textContent = L(p.n); $('#btsq').textContent = L(p.q);
    if (scroll) { const r = $('#btshow').getBoundingClientRect(); if (r.top > innerHeight * .7 || r.bottom < 0) $('#btshow').scrollIntoView({ behavior: MG.still ? 'auto' : 'smooth', block: 'center' }); }
  }
  row.addEventListener('click', (e) => { const b = e.target.closest('.btb'); if (b) show(+b.dataset.i, true); });

  /* what the printed price is made of, for where the visitor is */
  function shipLine(pr) {
    const sh = MG.shipHere();
    return sh ? (sh.fee ? t(`Printed ${MG.fmt(pr.price)} + shipping ${MG.fmt(sh.fee)}`, `المطبوع ${MG.fmt(pr.price)} + الشحن ${MG.fmt(sh.fee)}`) : t(`Printed ${MG.fmt(pr.price)}, shipping included`, `المطبوع ${MG.fmt(pr.price)}، والشحن مشمول`)) : '';
  }
  function printBlock() {
    const pr = MG.printOf('calendar', C.id), sh = Object.values(MG.shipping), to = sh.length ? sh.map((c) => L(c.name)).join(t(' and ', ' و')) : t('the UAE and Denmark', 'الإمارات والدنمارك');
    if (pr && (MG.shipping.ALL || MG.shipping.GCC)) return `${MG.printBtn('calendar', C.id, 'ghost')}<p class="pnote">${shipLine(pr)}</p>`;
    return pr ? `${MG.printBtn('calendar', C.id, 'ghost')}<p class="pnote">${t('Printed copies are shipped to ', 'نشحن النسخ المطبوعة إلى ')}${esc(to)}.</p>`
      : `<p class="pnote">${t('Printed copies, shipped to the UAE and Denmark, open soon.', 'النسخ المطبوعة، بالشحن إلى الإمارات والدنمارك، قريبًا.')}</p>`;
  }
  const cell = (n, href, lb, im, mk, name) => `<li class="ac-cell"><a class="ol-ac-a" href="${href}"><span class="ac-hd"><b class="no">${n}</b><span class="lb">${esc(lb)}</span></span><span class="ac-im"><img class="ol-one" src="${im}" alt="" loading="lazy"><span class="mk"><img src="${mk}" alt="" loading="lazy"></span></span><span class="ac-ft"><h3 class="hand">${esc(name)}</h3><span class="pr">${MG.fmt(MG.price('calendar'))}</span></span></a></li>`;
  MG.page(function (why) {
    $('#gzprint').innerHTML = printBlock();
    const hp = $('#hprint'), pr0 = MG.printOf('calendar', C.id); if (hp) hp.innerHTML = MG.printBtn('calendar', C.id, 'ghost');
    const hs = $('#hship'); if (hs) hs.textContent = pr0 ? shipLine(pr0) : '';
    $('#cspec').innerHTML = MG.calSpec(C.id);
    if (why === 'bag' || why === 'user') return;
    bts.forEach((b, i) => { b.setAttribute('aria-label', mon(MS[i])); b.querySelector('.btn-n').textContent = MG.ar ? mon(MS[i]) : mon(MS[i]).slice(0, 3); });
    $('#gzpages').innerHTML = P.map((p) => `<li${p.m ? '' : ' class="cfl-cover"'}><img src="assets/gz-${pad(p.m)}.webp" alt="${esc(p.m ? mon(p) + ' 2027, ' + L(p.n) : t('The cover: Gaza Sea Hill', 'الغلاف: تلّة بحر غزة'))}" loading="lazy" decoding="async"></li>`).join('');
    const pa = MG.palestine;
    $('#olgrid').innerHTML = cell('01', 'calendar.html', t('New for 2027', 'جديد لعام 2027'), 'assets/olc-cal-a.webp', 'assets/olc-cal-b.webp', t('Things kept in bottles', 'أشياء نحفظها في قوارير'))
      + cell('02', pa.page, t('From 2026, set for 2027', 'من 2026، بتواريخ 2027'), 'assets/olc-ps-a.webp', 'assets/olc-ps-b.webp', L(pa.short));
    $$('[data-alt-ar]').forEach((e) => { if (e.dataset.altEn == null) e.dataset.altEn = e.alt; e.alt = MG.ar ? e.dataset.altAr : e.dataset.altEn; });
    show(sel);
  });
})();
