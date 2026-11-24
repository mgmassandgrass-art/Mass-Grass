/* The calendar page (2027, "Things kept in bottles"):
   0 · the twelve months filling the screen (a click opens one large), then a quiet band to buy;
   2 · the calendar: its cover page, a few words, what it is, buy and the printed copy;
   3 · the twelve bottles side by side, floating on one line; a click shows that month in the calendar (on the desk, or the page);
   4 · calendars from earlier years, set for 2027 (palestine.html).
   (The film of the cover being turned, assets/cal-flip.*, waits for later.) */
(function () {
  'use strict';
  /* calendar-only opening: the earlier calendars wait too, so their section is taken off the page */
  if (MG.cat.only === 'calendar') { const ol = document.getElementById('earlier'); if (ol) ol.remove(); }
  const { $, $$, esc, t, L } = MG, C = MG.calendar, P = C.pages;
  const name = (p) => (p.m ? (MG.ar ? C.monthsAr[p.m - 1] : C.months[p.m - 1]) : t('The cover', 'الغلاف'));
  const pad = (n) => String(n).padStart(2, '0');
  /* calendars from earlier years, set for 2027 (each has its own page; add more here) */
  const OLD = [Object.assign({}, MG.palestine, { when: ['From 2026, set for 2027', 'من 2026، بتواريخ 2027'], img: ['assets/pm-3.webp', 'assets/pm-4.webp'] })];

  /* ---------- 1 · (no film on the page for now; the film's files are in drafts/video) the owner's film of the desk calendar (assets/cal-desk.*);
     it plays muted and looped only while on screen; with reduced motion it stays on its first frame.
     (The wall / table photographs cww-MM / cwf-MM are still used by the bottles below.) */
  const film = $('#cffilm');
  if (film) {
    film.muted = true;
    const play = () => { if (!MG.still && !document.hidden) { const pr = film.play(); if (pr) pr.catch(() => {}); } };
    new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) play(); else film.pause(); }), { threshold: .15 }).observe(film);
    document.addEventListener('visibilitychange', () => { if (document.hidden) film.pause(); else play(); });
  }

  /* ---------- 3 · the bottles in a row, floating; one chosen shows its month ---------- */
  const MS = P.filter((p) => p.m > 0), row = $('#btrow');
  row.innerHTML = MS.map((p, i) => `<li><button type="button" class="btb" data-i="${i}" aria-pressed="${!i}" style="--d:${(-i * .37).toFixed(2)}s"><img src="assets/bt-${pad(i + 1)}.webp" alt="" draggable="false"><span class="btn-n"></span></button></li>`).join('');
  const bts = $$('.btb', row), A = $('#btsA'), B = $('#btsB'); let sel = 0, view = 'desk', front = A;
  /* the desk calendar: one photograph, and only its page changes (cdp-MM: the printed page cut to the page's shape, laid where it sits);
     all twelve pages are fetched once the section comes near, so a click turns the page at once */
  const pg = $('#btspg');
  pg.innerHTML = MS.map((p, i) => `<img src="assets/cdp-${pad(p.m)}.webp" alt="" ${i ? 'loading="lazy" ' : ''}decoding="async" draggable="false"${i ? '' : ' class="on"'}>`).join('');
  const pgs = $$('img', pg);
  new IntersectionObserver((es, o) => es.forEach((en) => { if (en.isIntersecting) { pgs.forEach((im) => { im.loading = 'eager'; }); o.disconnect(); } }), { rootMargin: '600px' }).observe(pg);
  function show(i, scroll) {
    sel = (i + MS.length) % MS.length; const p = MS[sel];
    bts.forEach((b, k) => b.setAttribute('aria-pressed', String(k === sel)));
    const alt = name(p) + (view === 'desk' ? t(', on the desk calendar', '، على التقويم المكتبي') : t(', the page', '، الصفحة'));
    $('#btsim').classList.toggle('page', view === 'page');
    pgs.forEach((im, k) => im.classList.toggle('on', k === sel)); $('.bts-base').alt = view === 'desk' ? alt : '';
    const src = `assets/c27p-${pad(p.m)}.webp`;
    if (view === 'page' && front.getAttribute('src') !== src) {
      const back = front === A ? B : A; back.src = src; back.alt = alt;
      const swap = () => { back.classList.add('on'); front.classList.remove('on'); front = back; };
      if (back.complete && back.naturalWidth) swap(); else back.onload = swap;
    } else if (view === 'page') front.alt = alt;
    $('#btss').textContent = L(p.s); $('#btsn').textContent = name(p); $('#btsq').textContent = L(p.q); $('#btsd').textContent = L(p.d);
    if (scroll) { const r = $('#btshow').getBoundingClientRect(); if (r.top > innerHeight * .7 || r.bottom < 0) $('#btshow').scrollIntoView({ behavior: MG.still ? 'auto' : 'smooth', block: 'center' }); }
  }
  row.addEventListener('click', (e) => { const b = e.target.closest('.btb'); if (b) show(+b.dataset.i, true); });

  /* the printed copy: a button when the admin has switched it on, else a plain line */
  /* what the printed price is made of, for where the visitor is */
  function shipLine(pr) {
    const sh = MG.shipHere();
    /* only the two prices: the calendar and the shipping where the visitor is */
    return sh ? (sh.fee ? t(`Printed ${MG.fmt(pr.price)} + shipping ${MG.fmt(sh.fee)}`, `المطبوع ${MG.fmt(pr.price)} + الشحن ${MG.fmt(sh.fee)}`) : t(`Printed ${MG.fmt(pr.price)}, shipping included`, `المطبوع ${MG.fmt(pr.price)}، والشحن مشمول`)) : '';
  }
  function printBlock() {
    const pr = MG.printOf('calendar', C.id), sh = Object.values(MG.shipping), to = sh.length ? sh.map((c) => L(c.name)).join(t(' and ', ' و')) : t('the UAE and Denmark', 'الإمارات والدنمارك');
    if (pr && (MG.shipping.ALL || MG.shipping.GCC)) return `${MG.printBtn('calendar', C.id, 'ghost')}<p class="pnote">${shipLine(pr)}</p>`;
    return pr ? `${MG.printBtn('calendar', C.id, 'ghost')}<p class="pnote">${t('Printed copies are shipped to ', 'نشحن النسخ المطبوعة إلى ')}${esc(to)}.</p>`
      : `<p class="pnote">${t('Printed copies, shipped to the UAE and Denmark, open soon.', 'النسخ المطبوعة، بالشحن إلى الإمارات والدنمارك، قريبًا.')}</p>`;
  }
  MG.page(function (why) {
    const cp = $('#cprint'); if (cp) cp.innerHTML = printBlock();
    const hp = $('#hprint'); if (hp) hp.innerHTML = MG.printBtn('calendar', C.id, 'ghost');
    const hs = $('#hship'), pr0 = MG.printOf('calendar', C.id); if (hs) hs.textContent = pr0 ? shipLine(pr0) : '';
    if (why === 'bag' || why === 'user') return;
    /* calendars from earlier years: one card each, each with its own page */
    const og = $('#olgrid'); if (og) og.innerHTML = OLD.map((c) => `<li><a class="ol-c" href="${c.page}"><span class="ol-im"><img src="${c.img[0]}" alt="" loading="lazy"><img src="${c.img[1]}" alt="" loading="lazy"></span><span class="ol-y">${esc(L(c.when))}</span><span class="ol-n">${esc(L(c.short))}</span><span class="ol-p"><b>${MG.fmt(MG.price('calendar'))}</b><span class="go">${t('Open the calendar', 'افتحوا التقويم')}</span></span></a></li>`).join('');
    bts.forEach((b, i) => { b.setAttribute('aria-label', name(MS[i])); b.querySelector('.btn-n').textContent = name(MS[i]); });
    $$('[data-alt-ar]').forEach((e) => { if (e.dataset.altEn == null) e.dataset.altEn = e.alt; e.alt = MG.ar ? e.dataset.altAr : e.dataset.altEn; });
    show(sel);
  });
})();
