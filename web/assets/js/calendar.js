/* The calendar page: the calendar photographed at home (carousel), then the bottles choose the page shown up close. */
(function () {
  'use strict';
  const { $, $$, esc, t, L } = MG, P = MG.calendar.pages;
  const name = (p) => L(p.n), label = (p) => (p.m ? `${name(p)} 2027` : L(MG.calendar.title));
  /* the photographs: each already carries its page, printed in with the room's light */
  const PH = [['cr2-wall', 0, 'On the wall', 'على الحائط', '49%'], ['cr2-desk', 1, 'On the desk', 'على المكتب', '55%'], ['cr2-hands', 2, 'In the hands', 'بين اليدين', '46%'], ['cr2-flat', 3, 'On the table', 'على الطاولة', '50%'], ['cr2-wall-12', 4, 'Back on the wall', 'على الحائط من جديد', '49%']];
  const show = MG.show($('#cal'), PH.map((s) => { const p = P[s[1]]; return { src: `assets/${s[0]}.webp`, name: p.n, place: [s[2], s[3]], alt: [`${s[2]}: the 2027 calendar open on ${p.n[0].toLowerCase()}`, `${s[3]}: تقويم 2027 مفتوح على ${p.n[1]}`], fy: s[4] }; }));

  let sel = Math.max(0, P.findIndex((p) => p.k === location.hash.slice(1))); if (!location.hash) sel = 1;
  function closeup() {
    const p = P[sel], im = $('#cimg'), src = `assets/${p.k}-hd.webp`;
    if (!im.src.endsWith(src)) im.src = src;
    im.alt = `${label(p)}, ${t('a page of the calendar', 'صفحة من التقويم')}`; $('#loupe').style.backgroundImage = `url(${src})`;
    $('#cseason').textContent = L(p.s); $('#cname').textContent = name(p); $('#cquote').textContent = L(p.q); $('#cdesc').textContent = L(p.d);
    $$('.bottle').forEach((b) => b.setAttribute('aria-pressed', +b.dataset.i === sel));
  }
  function pick(i, scroll) {
    sel = (i + P.length) % P.length; closeup(); history.replaceState(null, '', '#' + P[sel].k);
    if (scroll) { const r = $('#close').getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) $('#close').scrollIntoView({ behavior: MG.still ? 'auto' : 'smooth', block: 'center' }); }
  }
  $('#bottles').addEventListener('click', (e) => { const b = e.target.closest('.bottle'); if (b) pick(+b.dataset.i, true); });
  $('#cnext').addEventListener('click', () => pick(sel + 1)); $('#cprev').addEventListener('click', () => pick(sel - 1));
  /* a loupe over the page, for the lettering and the days */
  const cp = $('#cpage'), lp = $('#loupe');
  if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
    cp.addEventListener('pointermove', (e) => {
      const r = cp.getBoundingClientRect(), q = $('#cimg').getBoundingClientRect(), Z = 2.6, ix = e.clientX - q.left, iy = e.clientY - q.top;
      lp.style.backgroundSize = `${q.width * Z}px ${q.height * Z}px`; lp.style.backgroundPosition = `${-(ix * Z - lp.offsetWidth / 2)}px ${-(iy * Z - lp.offsetHeight / 2)}px`;
      lp.style.transform = `translate(${e.clientX - r.left - lp.offsetWidth / 2}px,${e.clientY - r.top - lp.offsetHeight / 2}px)`; cp.classList.add('lens');
    });
    cp.addEventListener('pointerleave', () => cp.classList.remove('lens'));
  }
  MG.page(function (why) {
    if (why === 'bag' || why === 'user') return;
    show.caption();
    $('#bottles').innerHTML = P.map((p, i) => `<li><button type="button" class="bottle" data-i="${i}" aria-pressed="${i === sel}" aria-label="${esc(label(p))}"><span class="piece paper" data-tear="5"><span class="fill"></span><img src="assets/${p.k}-b.webp" alt="" loading="lazy"></span><span class="tag paper" data-tear="2"><span class="fill"></span>${esc(name(p))}</span></button></li>`).join('');
    closeup();
  });
})();
