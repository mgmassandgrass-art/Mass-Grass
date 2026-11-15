/* The calendar page (2027, "Things kept in bottles"):
   1 · full page: the desk calendar photographed open on the cover and each month (cd-MM), one after another, with buy / browse;
   2 · the calendar: its cover page, a few words, what it is, buy and the printed copy;
   3 · the twelve bottles side by side, floating on one line; a click shows that month in the calendar (on the desk, or the page);
   4 · calendars from earlier years, set for 2027 (palestine.html).
   (The film of the cover being turned, assets/cal-flip.*, waits for later.) */
(function () {
  'use strict';
  const { $, $$, esc, t, L } = MG, C = MG.calendar, P = C.pages;
  const name = (p) => (p.m ? (MG.ar ? C.monthsAr[p.m - 1] : C.months[p.m - 1]) : t('The cover', 'الغلاف'));
  const pad = (n) => String(n).padStart(2, '0');
  /* calendars from earlier years, set for 2027 (each has its own page; add more here) */
  const OLD = [Object.assign({}, MG.palestine, { when: ['From 2026, set for 2027', 'من 2026، بتواريخ 2027'], img: ['assets/pm-3.webp', 'assets/pm-4.webp'] })];

  /* ---------- 1 · full page: the cover first, then the months, a slow cross-fade every 4.5s ---------- */
  const stage = $('#cfstage'), dots = $('#cfdots');
  /* the calendar on a wall and laid on a table (cww-MM / cwf-MM), the cover in both, then the months by turns */
  const SL = [['w', 0], ['f', 0], ...P.filter((p) => p.m).map((p) => [p.m % 2 ? 'f' : 'w', p.m])];
  stage.innerHTML = SL.map((x, i) => `<img class="${x[0] === 'f' ? 'sf' : 'sw'}${i ? '' : ' on'}" src="assets/cw${x[0]}-${pad(x[1])}.webp" alt="" ${i > 1 ? 'loading="lazy" ' : ''}decoding="async" draggable="false">`).join('');
  dots.innerHTML = SL.map((x, i) => `<button type="button" aria-pressed="${!i}" data-i="${i}"></button>`).join('');
  const ims = $$('img', stage), dbs = $$('button', dots); let at = 0, timer = 0, seen = true;
  function go(i) {
    ims[at].classList.remove('on'); dbs[at].setAttribute('aria-pressed', 'false');
    at = (i + ims.length) % ims.length; ims[at].classList.add('on'); dbs[at].setAttribute('aria-pressed', 'true');
    const nx = ims[(at + 1) % ims.length]; nx.loading = 'eager';
  }
  const run = (wait) => { clearTimeout(timer); clearInterval(timer); if (MG.still) return; timer = setTimeout(() => { timer = setInterval(() => { if (seen && !document.hidden) go(at + 1); }, 4500); }, wait || 0); };
  dots.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { go(+b.dataset.i); run(7000); } });
  new IntersectionObserver((es) => es.forEach((en) => { seen = en.isIntersecting; }), { threshold: .2 }).observe(stage);
  run();

  /* ---------- 3 · the bottles in a row, floating; one chosen shows its month ---------- */
  const MS = P.filter((p) => p.m > 0), row = $('#btrow');
  row.innerHTML = MS.map((p, i) => `<li><button type="button" class="btb" data-i="${i}" aria-pressed="${!i}" style="--d:${(-i * .37).toFixed(2)}s"><img src="assets/bt-${pad(i + 1)}.webp" alt="" draggable="false"><span class="btn-n"></span></button></li>`).join('');
  const bts = $$('.btb', row), A = $('#btsA'), B = $('#btsB'); let sel = 0, view = 'desk', front = A;
  function show(i, scroll) {
    sel = (i + MS.length) % MS.length; const p = MS[sel];
    bts.forEach((b, k) => b.setAttribute('aria-pressed', String(k === sel)));
    const src = view === 'desk' ? `assets/cwf-${pad(p.m)}.webp` : `assets/v2-${pad(p.m)}.webp`;
    const alt = name(p) + (view === 'desk' ? t(', the calendar on a table', '، التقويم على طاولة') : t(', the page', '، الصفحة'));
    $('#btsim').classList.toggle('page', view === 'page');
    if (front.getAttribute('src') !== src) {
      const back = front === A ? B : A; back.src = src; back.alt = alt;
      const swap = () => { back.classList.add('on'); front.classList.remove('on'); front = back; };
      if (back.complete && back.naturalWidth) swap(); else back.onload = swap;
    } else front.alt = alt;
    $('#btss').textContent = L(p.s); $('#btsn').textContent = name(p); $('#btsq').textContent = L(p.q); $('#btsd').textContent = L(p.d);
    if (scroll) { const r = $('#btshow').getBoundingClientRect(); if (r.top > innerHeight * .7 || r.bottom < 0) $('#btshow').scrollIntoView({ behavior: MG.still ? 'auto' : 'smooth', block: 'center' }); }
  }
  row.addEventListener('click', (e) => { const b = e.target.closest('.btb'); if (b) show(+b.dataset.i, true); });
  $('#btprev').addEventListener('click', () => show(sel - 1)); $('#btnext').addEventListener('click', () => show(sel + 1));
  const setView = (v) => { view = v; $('#btvDesk').setAttribute('aria-pressed', String(v === 'desk')); $('#btvPage').setAttribute('aria-pressed', String(v === 'page')); show(sel); };
  $('#btvDesk').addEventListener('click', () => setView('desk')); $('#btvPage').addEventListener('click', () => setView('page'));
  A.classList.add('on');

  /* the printed copy: a button when the admin has switched it on, else a plain line */
  function printBlock() {
    const pr = MG.printOf('calendar', C.id), sh = Object.values(MG.shipping), to = sh.length ? sh.map((c) => L(c.name)).join(t(' and ', ' و')) : t('the UAE and Denmark', 'الإمارات والدنمارك');
    return pr ? `${MG.printBtn('calendar', C.id, 'ghost')}<p class="pnote">${t('Printed copies are shipped to ', 'نشحن النسخ المطبوعة إلى ')}${esc(to)}.</p>`
      : `<p class="pnote">${t('Printed copies, shipped to the UAE and Denmark, open soon.', 'النسخ المطبوعة، بالشحن إلى الإمارات والدنمارك، قريبًا.')}</p>`;
  }
  MG.page(function (why) {
    $('#cprint').innerHTML = printBlock();
    if (why === 'bag' || why === 'user') return;
    ims.forEach((im, i) => { const x = SL[i], p = P.find((q) => q.m === x[1]); im.alt = name(p) + (x[0] === 'w' ? t(': the 2027 calendar on a wall', ': تقويم 2027 على الحائط') : t(': the 2027 calendar on a table', ': تقويم 2027 على طاولة')); });
    dbs.forEach((b, i) => b.setAttribute('aria-label', name(P.find((q) => q.m === SL[i][1]))));
    /* calendars from earlier years: one card each, each with its own page */
    $('#olgrid').innerHTML = OLD.map((c) => `<li><a class="ol-c" href="${c.page}"><span class="ol-im"><img src="${c.img[0]}" alt="" loading="lazy"><img src="${c.img[1]}" alt="" loading="lazy"></span><span class="ol-y">${esc(L(c.when))}</span><span class="ol-n">${esc(L(c.short))}</span><span class="ol-p"><b>${MG.fmt(MG.price('calendar'))}</b><span class="go">${t('Open the calendar', 'افتحوا التقويم')}</span></span></a></li>`).join('');
    bts.forEach((b, i) => { b.setAttribute('aria-label', name(MS[i])); b.querySelector('.btn-n').textContent = name(MS[i]); });
    $$('[data-alt-ar]').forEach((e) => { if (e.dataset.altEn == null) e.dataset.altEn = e.alt; e.alt = MG.ar ? e.dataset.altAr : e.dataset.altEn; });
    show(sel);
  });
})();
