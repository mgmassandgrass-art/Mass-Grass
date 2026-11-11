/* Home: the pieces that circle the name, the calendar's views and pages, and a few pieces straight into the bag. */
(function () {
  'use strict';
  const { $, $$, esc, t, L } = MG;
  const PAGE = MG.PAGE;

  /* ---------- 1 · the orbit: prints and stickers ride two pencil rings around the name ---------- */
  const hero = $('#hero'), orbit = $('#orbit'), rings = $('#rings');
  const RING = [
    { items: [['painting', 'hero'], ['sticker', 's-lemons'], ['painting', 'dovegirl'], ['sticker', 's-kaak'], ['painting', 'waves']], dir: 1, turn: 150 },
    { items: [['painting', 'sparklers'], ['sticker', 's-pomegranate'], ['painting', 'boattop'], ['painting', 'guitar'], ['sticker', 's-jaffa'], ['painting', 'bikeride']], dir: -1, turn: 210 },
  ];
  const els = [];
  RING.forEach((r, ri) => r.items.forEach(([kind, id], i) => {
    const p = MG.product(kind, id); if (!p) return;
    const a = document.createElement('a'); a.className = 'orb ' + (kind === 'sticker' ? 'stk' : 'prn'); a.href = PAGE[kind] + '#' + id; a.tabIndex = -1;
    a.innerHTML = `<img src="${esc(MG.thumb(id, p))}" alt="" draggable="false"><span class="hand"></span>`;
    orbit.append(a); els.push({ a, p, ri, base: (i / r.items.length) * Math.PI * 2 + ri * 0.5 });
  }));
  let W = 0, H = 0, R = [], px = 0, py = 0, tx = 0, ty = 0, t0 = performance.now(), held = 0, pausedAt = 0, vis = true;
  function size() {
    W = hero.clientWidth; H = hero.clientHeight; const ph = W < 700;
    R = ph ? [{ rx: W * 0.62, ry: H * 0.4 }, { rx: W * 0.95, ry: H * 0.52 }] : [{ rx: Math.min(W * 0.37, 560), ry: Math.min(H * 0.42, 370) }, { rx: Math.min(W * 0.5, 760), ry: Math.min(H * 0.56, 500) }];
    const cx = W / 2, cy = H / 2, more = ph ? [1.5, 2.1] : [1.38, 1.8, 2.3];
    rings.setAttribute('viewBox', `0 0 ${W} ${H}`);
    rings.innerHTML = R.map((r, i) => `<ellipse class="rg r${i}" cx="${cx}" cy="${cy}" rx="${r.rx}" ry="${r.ry}" pathLength="1"/>`).join('') +
      more.map((k) => `<ellipse class="rg far" cx="${cx}" cy="${cy}" rx="${R[1].rx * k}" ry="${R[1].ry * k}" pathLength="1"/>`).join('') +
      `<ellipse class="rg in" cx="${cx}" cy="${cy}" rx="${R[0].rx * 0.6}" ry="${R[0].ry * 0.6}" pathLength="1"/>` +
      R.map((r, i) => `<ellipse class="tk" cx="${cx}" cy="${cy}" rx="${r.rx}" ry="${r.ry}"/>`).join('');
    frame(performance.now());
  }
  function frame(now) {
    const s = (now - t0 - held) / 1000;
    px += (tx - px) * 0.06; py += (ty - py) * 0.06;
    els.forEach((e) => { const r = R[e.ri], g = RING[e.ri], th = e.base + g.dir * (s / g.turn) * Math.PI * 2, d = e.ri ? 26 : 14;
      const x = W / 2 + r.rx * Math.cos(th) + px * d, y = H / 2 + r.ry * Math.sin(th) + py * d;
      e.a.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(-50%,-50%) rotate(${(Math.sin(th * 2 + e.base) * 5).toFixed(2)}deg)`; });
  }
  function loop(now) { if (vis && !pausedAt) frame(now); requestAnimationFrame(loop); }
  if (hero && orbit) {
    size(); new ResizeObserver(size).observe(hero); hero.classList.add('go');
    if (!MG.still) {
      requestAnimationFrame(loop);
      new IntersectionObserver((en) => { vis = en[0].isIntersecting; }).observe(hero);
      if (matchMedia('(hover:hover)').matches) {
        hero.addEventListener('pointermove', (e) => { const b = hero.getBoundingClientRect(); tx = (e.clientX - b.left) / b.width - 0.5; ty = (e.clientY - b.top) / b.height - 0.5; });
        orbit.addEventListener('pointerover', (e) => { if (e.target.closest('.orb') && !pausedAt) pausedAt = performance.now(); });
        orbit.addEventListener('pointerout', (e) => { if (e.target.closest('.orb') && pausedAt) { held += performance.now() - pausedAt; pausedAt = 0; } });
      }
    }
  }

  /* ---------- 3 · the calendar's views ---------- */
  const views = $$('#views img'), vnav = $('#vnav');
  const VN = [['On the wall', 'على الحائط'], ['In the hands', 'بين اليدين'], ['On the desk', 'على المكتب'], ['The pages', 'الصفحات']];
  let vi = 0, vt = 0;
  function view(i, user) { vi = (i + views.length) % views.length; views.forEach((im, k) => im.classList.toggle('on', k === vi)); $$('button', vnav).forEach((b, k) => b.setAttribute('aria-pressed', k === vi)); quote();
    clearInterval(vt); if (!user && !MG.still) vt = setInterval(() => view(vi + 1), 5200); }
  function quote() { const pg = MG.calendar.pages, p = pg[vi % pg.length]; const q = $('#calq'); if (q && p) q.textContent = L(p.q); }
  if (vnav) vnav.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) view(+b.dataset.v, true); });

  /* a few pieces from each shelf */
  const pick = (kind, ids) => ids.map((id) => MG.product(kind, id)).filter(Boolean);
  const J = [...pick('painting', ['psea', 'dovegirl', 'sparklers']), ...pick('sticker', ['s-kaak']), ...pick('painting', ['pcartgirl']), ...pick('postcard', ['pmoonsleep']), ...pick('sticker', ['s-jaffa']), ...pick('painting', ['snowglobe'])];
  const KN = { painting: ['Painting', 'لوحة'], postcard: ['Postcard', 'بطاقة بريدية'], sticker: ['Sticker', 'ملصق'] };

  MG.page(function (why) {
    els.forEach((e) => { e.a.lastChild.textContent = MG.title(e.p); });
    if (vnav && (why === 'init' || why === 'lang')) { vnav.innerHTML = VN.map((n, i) => `<button type="button" data-v="${i}" aria-pressed="${i === vi}">${L(n)}</button>`).join(''); view(vi, why !== 'init'); }
    $('#calshare').innerHTML = MG.shareBtn('calendar', '');
    const pr = MG.printOf('calendar', ''); $('#calprint').innerHTML = pr ? MG.printBtn('calendar', '') : '';
    $('#hpages').innerHTML = MG.calendar.pages.map((p) => `<li><a href="calendar.html#${p.k}"><span class="pg"><img src="assets/${p.k}.webp" alt="" loading="lazy" width="910" height="641"></span><b class="hand">${esc(L(p.n))}</b></a></li>`).join('');
    $('#grid').innerHTML = J.map((p, i) => `<li class="it${i === 0 ? ' big' : ''}${p.kind === 'sticker' ? ' stk' : ''}">
      <a class="im" href="${PAGE[p.kind]}#${esc(p.id)}"><img src="${esc(i === 0 ? MG.img(p.id, p) : MG.thumb(p.id, p))}" alt="${esc(p.title_en)}, by Farah Al-Helou" loading="lazy"></a>
      <div class="cap"><h3 class="hand">${esc(MG.title(p))}</h3><span class="pr">${MG.fmt(MG.price(p.kind, p.id))}</span></div><span class="kind">${L(KN[p.kind])}</span>
      <div class="acts">${MG.addBtn(p.kind, p.id)}${MG.shareBtn(p.kind, p.id)}</div></li>`).join('') +
      `<li class="it all"><a href="shop.html"><span>${t('See everything Farah has painted', 'شاهدوا كل ما رسمته فرح')}</span><svg viewBox="0 0 12 12" width="20" height="20" aria-hidden="true"><path d="M3 9l6-6M4 3h5v5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></a></li>`;
    $$('[data-alt-ar]').forEach((e) => { if (e.dataset.altEn == null) e.dataset.altEn = e.alt; e.alt = MG.ar ? e.dataset.altAr : e.dataset.altEn; });
  });
})();
