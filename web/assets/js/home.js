/* Home: the pieces that circle the name, the calendar's views and pages, and a few pieces straight into the bag. */
(function () {
  'use strict';
  const { $, $$, esc, t, L } = MG;
  const PAGE = MG.PAGE;

  /* ---------- 1 · the table: every painting as a print with its white border, in rows on a light table seen from above
     at an angle. The view drifts slowly along the rows and never ends (the prints wrap round), now and then one print
     lifts off the table and settles back, the pointer lifts the one under it, and a click opens it in a real photograph. ---------- */
  if (!MG.still) document.documentElement.classList.add('home-intro');
  const cam = $('#tbcam'), plane = $('#tbplane');
  const ART = MG.products('painting');
  const tiles = []; let CW = 0, CH = 0, COLS = 0, ROWS = 0, off = 0, last = 0, vis = true, hovered = null;
  function lay() {
    if (!plane || !ART.length) return;
    const phone = innerWidth < 700;
    CW = phone ? 150 : 236; CH = phone ? 120 : 186; COLS = phone ? 8 : 11; ROWS = phone ? 10 : 9;
    plane.innerHTML = ''; tiles.length = 0; let k = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      /* each row starts further along the list, so a painting never sits next to itself */
      const pi = (c + r * 4 + (r % 2) * 2) % ART.length, pr = ART[pi], a = MG.mock.asp(pr.id);
      const mw = CW * .76, mh = CH * .78; let w = mw, h = mw / a; if (h > mh) { h = mh; w = h * a; }
      const el = document.createElement('a'); el.className = 'tb-t'; el.href = 'paintings.html#' + pr.id; el.dataset.peek = 'painting:' + pr.id; el.tabIndex = -1;
      el.setAttribute('aria-label', pr.title_en);
      el.innerHTML = `<i class="sh" style="width:${w.toFixed(0)}px;height:${h.toFixed(0)}px"></i><span class="pr" style="width:${w.toFixed(0)}px;height:${h.toFixed(0)}px"><img src="${esc(MG.thumb(pr.id, pr))}" alt="" decoding="async" draggable="false"></span>`;
      plane.append(el); tiles.push({ el, c, r, x0: c * CW + (r % 2) * CW * .5, y0: r * CH }); k++;
    }
    place();
  }
  function place() {
    const SW = COLS * CW, SH = ROWS * CH;
    tiles.forEach((t) => {
      let x = (t.x0 + off) % SW; if (x < 0) x += SW; x -= SW / 2;
      let y = (t.y0 + off * .18) % SH; if (y < 0) y += SH; y -= SH / 2;
      t.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
    });
  }
  function drift(now) {
    const dt = Math.min(64, now - (last || now)); last = now;
    if (vis && !MG.still) { off += dt * .022; place(); }
    requestAnimationFrame(drift);
  }
  /* now and then a print lifts off the table and settles back */
  function lift() {
    if (vis && !MG.still && tiles.length) {
      const b = cam.getBoundingClientRect(), near = tiles.filter((t) => { const r = t.el.getBoundingClientRect(); return t.el !== hovered && r.left > b.left + 40 && r.right < b.right - 40 && r.top > b.top + 40 && r.bottom < b.bottom - 40; });
      const t = near[Math.floor(Math.random() * near.length)]; if (t) { t.el.classList.add('up'); setTimeout(() => t.el.classList.remove('up'), 2600); }
    }
    setTimeout(lift, 1500 + Math.random() * 1200);
  }
  if (cam && plane) {
    lay(); let rw = innerWidth; addEventListener('resize', () => { if ((rw < 700) !== (innerWidth < 700)) lay(); rw = innerWidth; });
    new IntersectionObserver((en) => { vis = en[0].isIntersecting; }).observe(cam);
    plane.addEventListener('pointerover', (e) => { const a = e.target.closest('.tb-t'); hovered = a; });
    plane.addEventListener('pointerout', () => { hovered = null; });
    requestAnimationFrame(() => cam.classList.add('on'));
    if (!MG.still) { requestAnimationFrame(drift); setTimeout(lift, 1400); }
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
    if (vnav && (why === 'init' || why === 'lang')) { vnav.innerHTML = VN.map((n, i) => `<button type="button" data-v="${i}" aria-pressed="${i === vi}">${L(n)}</button>`).join(''); view(vi, why !== 'init'); }
    $('#calshare').innerHTML = MG.shareBtn('calendar', '');
    const pr = MG.printOf('calendar', ''); $('#calprint').innerHTML = pr ? MG.printBtn('calendar', '') : '';
    $('#hpages').innerHTML = MG.calendar.pages.map((p) => `<li><a href="calendar.html#${p.k}"><span class="pg"><img src="assets/${p.k}.webp" alt="" loading="lazy" width="910" height="641"></span><b class="hand">${esc(L(p.n))}</b></a></li>`).join('');
    $('#grid').innerHTML = J.map((p, i) => `<li class="it${i === 0 ? ' big' : ''}${p.kind === 'sticker' ? ' stk' : ''}">
      <a class="im" href="${PAGE[p.kind]}#${esc(p.id)}" data-peek="${p.kind}:${esc(p.id)}"><img src="${esc(i === 0 ? MG.img(p.id, p) : MG.thumb(p.id, p))}" alt="${esc(p.title_en)}, by Farah Al-Helou" loading="lazy"></a>
      <div class="cap"><h3 class="hand">${esc(MG.title(p))}</h3><span class="pr">${MG.fmt(MG.price(p.kind, p.id))}</span></div><span class="kind">${L(KN[p.kind])}</span>
      <div class="acts">${MG.addBtn(p.kind, p.id)}${MG.shareBtn(p.kind, p.id)}</div></li>`).join('') +
      `<li class="it all"><a href="shop.html"><span>${t('See everything Farah has painted', 'شاهدوا كل ما رسمته فرح')}</span><svg viewBox="0 0 12 12" width="20" height="20" aria-hidden="true"><path d="M3 9l6-6M4 3h5v5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></a></li>`;
    $$('[data-alt-ar]').forEach((e) => { if (e.dataset.altEn == null) e.dataset.altEn = e.alt; e.alt = MG.ar ? e.dataset.altAr : e.dataset.altEn; });
  });
})();
