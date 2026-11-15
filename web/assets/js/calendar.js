/* The calendar page (2027, "Things kept in bottles"):
   1 · the calendar on a desk: the film of a hand turning the cover to January, then a photograph of the desk calendar open on
       each month (cd-MM), chosen from the row below the stage;
   2 · the twelve bottles side by side, floating on one line; a click shows that month in the calendar (on the desk, or the
       page itself) with its line;
   3 · calendars from earlier years, set for 2027 (palestine.html). */
(function () {
  'use strict';
  const { $, $$, esc, t, L } = MG, C = MG.calendar, P = C.pages;
  const name = (p) => (p.m ? (MG.ar ? C.monthsAr[p.m - 1] : C.months[p.m - 1]) : t('The cover', 'الغلاف'));
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------- 1 · the stage: film first, then the desk photographs ---------- */
  const vid = $('#cvvid'), mk = $('#cvmk'), th = $('#cvth');
  let cur = -1;
  th.innerHTML = `<button type="button" aria-pressed="true" data-i="-1"><img src="assets/cal-flip.webp" alt="" loading="lazy"><span class="pl" aria-hidden="true"></span></button>` +
    P.map((p, i) => `<button type="button" aria-pressed="false" data-i="${i}"><img src="assets/cd-${pad(i)}.webp" alt="" loading="lazy"></button>`).join('');
  const label = () => {
    $$('button', th).forEach((b) => { const i = +b.dataset.i; b.setAttribute('aria-label', i < 0 ? t('The film: the cover turned to January', 'الفيلم: الغلاف يُقلب إلى كانون الثاني') : name(P[i]) + t(', on the desk', '، على المكتب')); });
    if (cur >= 0) mk.alt = name(P[cur]) + t(': the 2027 calendar on a desk', ': تقويم 2027 على مكتب');
  };
  function stage(i) {
    cur = i; $$('button', th).forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.i === i)));
    if (i < 0) { mk.classList.remove('on'); vid.classList.add('on'); vid.currentTime = 0; if (!MG.still) vid.play().catch(() => {}); }
    else { mk.src = `assets/cd-${pad(i)}.webp`; mk.classList.add('on'); vid.classList.remove('on'); vid.pause(); }
    label();
  }
  th.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) stage(+b.dataset.i); });
  if (MG.still) { vid.removeAttribute('autoplay'); vid.pause(); }
  /* the film plays only while it is on screen */
  new IntersectionObserver((es) => es.forEach((en) => { if (cur >= 0 || MG.still) return; if (en.isIntersecting) vid.play().catch(() => {}); else vid.pause(); }), { threshold: .2 }).observe(vid);

  /* ---------- 2 · the bottles in a row, floating; one chosen shows its month ---------- */
  const MS = P.filter((p) => p.m > 0), row = $('#btrow');
  row.innerHTML = MS.map((p, i) => `<li><button type="button" class="btb" data-i="${i}" aria-pressed="${!i}" style="--d:${(-i * .37).toFixed(2)}s"><img src="assets/bt-${pad(i + 1)}.webp" alt="" draggable="false"><span class="btn-n"></span></button></li>`).join('');
  const bts = $$('.btb', row), A = $('#btsA'), B = $('#btsB'); let sel = 0, view = 'desk', front = A;
  function show(i, scroll) {
    sel = (i + MS.length) % MS.length; const p = MS[sel];
    bts.forEach((b, k) => b.setAttribute('aria-pressed', String(k === sel)));
    const src = view === 'desk' ? `assets/cd-${pad(p.m)}.webp` : `assets/v2-${pad(p.m)}.webp`;
    const back = front === A ? B : A; back.src = src; back.alt = name(p) + (view === 'desk' ? t(', the calendar on a desk', '، التقويم على مكتب') : t(', the page', '، الصفحة'));
    $('#btsim').classList.toggle('page', view === 'page');
    const swap = () => { back.classList.add('on'); front.classList.remove('on'); front = back; };
    if (back.complete && back.naturalWidth) swap(); else back.onload = swap;
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
    bts.forEach((b, i) => { b.setAttribute('aria-label', name(MS[i])); b.querySelector('.btn-n').textContent = name(MS[i]); });
    label(); show(sel);
  });
})();
