/* Palestine, a journey through time and space: Farah's 2026 calendar set for 2027. The calendar on a desk, month by month
   (pd-MM); the twelve pages (ps-MM) to open large; buy the PDF or a printed copy (data-cal="palestine-2027"). */
(function () {
  'use strict';
  const { $, $$, esc, t, L } = MG, C = MG.palestine, P = C.pages, M = MG.calendar;
  const pad = (n) => String(n).padStart(2, '0');
  const mon = (p) => (p.m ? (MG.ar ? M.monthsAr[p.m - 1] : M.months[p.m - 1]) : t('The cover', 'الغلاف'));
  const A = $('#psA'), B = $('#psB'), th = $('#psth'); let front = A, cur = 0;
  th.innerHTML = P.map((p, i) => `<button type="button" aria-pressed="${!i}" data-i="${i}"><img src="assets/pd-${pad(i)}.webp" alt="" loading="lazy"></button>`).join('');
  function stage(i) {
    cur = i; $$('button', th).forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.i === i)));
    const src = `assets/pd-${pad(i)}.webp`; front.alt = mon(P[i]) + t(', the calendar on a desk', '، التقويم على مكتب');
    if (front.getAttribute('src') === src) return;
    const back = front === A ? B : A; back.src = src; back.alt = front.alt;
    const swap = () => { back.classList.add('on'); front.classList.remove('on'); front = back; };
    if (back.complete && back.naturalWidth) swap(); else back.onload = swap;
  }
  th.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) stage(+b.dataset.i); });

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
    $$('button', th).forEach((b) => b.setAttribute('aria-label', mon(P[+b.dataset.i])));
    $('#psgrid').innerHTML = MS.map((p, i) => `<li><button type="button" data-i="${i}"><span class="pi"><img src="assets/t-ps-${pad(p.m)}.webp" alt="" loading="lazy"></span><span class="pm">${esc(mon(p))}</span><span class="pn">${esc(L(p.n))}</span></button></li>`).join('');
    stage(cur);
  });
})();
