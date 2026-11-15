/* Palestine, a journey through time and space: Farah's 2026 calendar set for 2027. The calendar on a desk, month by month
   (pd-MM); the twelve pages (ps-MM) to open large; buy the PDF or a printed copy (data-cal="palestine-2027"). */
(function () {
  'use strict';
  const { $, $$, esc, t, L } = MG, C = MG.palestine, P = C.pages, M = MG.calendar;
  const pad = (n) => String(n).padStart(2, '0');
  const mon = (p) => (p.m ? (MG.ar ? M.monthsAr[p.m - 1] : M.months[p.m - 1]) : t('The cover', 'الغلاف'));
  /* full page: the owner's photographs of the calendar on its acrylic stand, set for 2027 (pm-2..4), one after another */
  const stage = $('#psstage'), dots = $('#psdots'), ims = $$('img', stage);
  dots.innerHTML = ims.map((im, i) => `<button type="button" aria-pressed="${!i}" data-i="${i}"></button>`).join('');
  const dbs = $$('button', dots); let at = 0, timer = 0;
  const go = (i) => { ims[at].classList.remove('on'); dbs[at].setAttribute('aria-pressed', 'false'); at = (i + ims.length) % ims.length; ims[at].classList.add('on'); dbs[at].setAttribute('aria-pressed', 'true'); };
  const run = (w) => { clearTimeout(timer); clearInterval(timer); if (MG.still) return; timer = setTimeout(() => { timer = setInterval(() => { if (!document.hidden) go(at + 1); }, 5000); }, w || 0); };
  dots.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { go(+b.dataset.i); run(8000); } });
  run();
  const ALT = [['February and May 2027 on their stands', 'شباط وأيار 2027 على حامليهما'], ['June 2027 on its stand', 'حزيران 2027 على حامله'], ['October and December 2027 on their stands', 'تشرين الأول وكانون الأول 2027 على حامليهما']];

  /* the months, and one page large in a sheet */
  const MS = P.filter((p) => p.m > 0), dlg = $('#psdlg'); let open = 0;
  function sheet(i) {
    open = (i + MS.length) % MS.length; const p = MS[open];
    $('#psdimg').src = `assets/ps-${pad(p.m)}.webp`; $('#psdimg').alt = `${mon(p)} 2027: ${L(p.n)}`;
    $('#psd-h').textContent = `${mon(p)}, ${L(p.n)}`; $('#psdd').textContent = L(p.d);
    if (!dlg.open) dlg.showModal();
  }
  $('#psgrid').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) sheet(+b.dataset.i); });
  $('#psdprev').addEventListener('click', () => sheet(open - 1)); $('#psdnext').addEventListener('click', () => sheet(open + 1));
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) dlg.close(); });

  function printBlock() {
    const pr = MG.printOf('calendar', C.id), sh = Object.values(MG.shipping), to = sh.length ? sh.map((c) => L(c.name)).join(t(' and ', ' و')) : t('the UAE and Denmark', 'الإمارات والدنمارك');
    return pr ? `${MG.printBtn('calendar', C.id, 'ghost')}<p class="pnote">${t('Printed copies are shipped to ', 'نشحن النسخ المطبوعة إلى ')}${esc(to)}.</p>`
      : `<p class="pnote">${t('Printed copies, shipped to the UAE and Denmark, open soon.', 'النسخ المطبوعة، بالشحن إلى الإمارات والدنمارك، قريبًا.')}</p>`;
  }
  MG.page(function (why) {
    $('#psprint').innerHTML = printBlock();
    if (why === 'bag' || why === 'user') return;
    ims.forEach((im, i) => { im.alt = L(ALT[i]); }); dbs.forEach((b, i) => b.setAttribute('aria-label', L(ALT[i])));
    $$('[data-alt-ar]').forEach((e) => { if (e.dataset.altEn == null) e.dataset.altEn = e.alt; e.alt = MG.ar ? e.dataset.altAr : e.dataset.altEn; });
    $('#psgrid').innerHTML = MS.map((p, i) => `<li><button type="button" data-i="${i}"><span class="pi"><img src="assets/t-ps-${pad(p.m)}.webp" alt="" loading="lazy"></span><span class="pm">${esc(mon(p))}</span><span class="pn">${esc(L(p.n))}</span></button></li>`).join('');
  });
})();
