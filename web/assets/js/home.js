/* Home: the calendar full screen, page after page, the calendar on the wall tearing off its pages, the twelve months
   unfolding as the page goes down, the shelves in real photographs, a few pieces straight into the bag. */
(function () {
  'use strict';
  const { $, $$, esc, t, L } = MG;
  const PAGE = MG.PAGE, C = MG.calendar;
  /* ---------- 0 · the opening: MASS & GRASS arrives letter by letter in the middle of an empty page, then rises and
     shrinks into the logo cell of the menu, the page appearing round it ---------- */
  (function () {
    const root = document.documentElement, sp = $('#splash');
    if (!sp) return;
    if (!root.classList.contains('home-intro')) { sp.remove(); return; }
    const big = sp.querySelector('.mark'), dest = $('header .logo img');
    const lettersDone = 1250, wait = Math.max(0, lettersDone - performance.now());
    setTimeout(() => {
      const a = big.getBoundingClientRect(), b = dest.getBoundingClientRect();
      const dx = (b.left + b.width / 2) - (a.left + a.width / 2), dy = (b.top + b.height / 2) - (a.top + a.height / 2), k = b.width / a.width;
      root.classList.add('flying');
      const ease = 'cubic-bezier(.7,0,.2,1)';
      const fl = big.animate([{ transform: 'none' }, { transform: `translate(${dx}px,${dy}px) scale(${k})` }], { duration: 950, easing: ease, fill: 'forwards' });
      sp.animate([{ backgroundColor: getComputedStyle(sp).backgroundColor }, { backgroundColor: 'rgba(243,242,238,0)' }], { duration: 700, delay: 300, easing: 'ease', fill: 'forwards' });
      fl.finished.then(() => { root.classList.add('landed'); sp.remove(); });
    }, wait);
  })();

  const vis = (el, fn) => { if (!el) return; new IntersectionObserver((en) => fn(en[0].isIntersecting)).observe(el); };

  /* ---------- 1 · the ring (from the calendar's own page "a year of things worth keeping"): the twelve bottles stand round
     the words and the ring turns very slowly, each bottle staying upright. Under the pointer a bottle drifts out of the ring
     and floats, as if in space, while the ring slows to a stop; it settles back when the pointer leaves. ---------- */
  const rgList = $('#rglist');
  if (rgList) {
    const N = 12;
    rgList.innerHTML = Array.from({ length: N }, (_, i) => `<li class="rg-b"><button type="button" data-m="${i + 1}"><img src="assets/bt-${String(i + 1).padStart(2, '0')}.webp" alt="" decoding="async" draggable="false"></button></li>`).join('');
    /* a click on a bottle hangs its paper tag beside it: the month and the line Farah wrote for it, as on the calendar */
    const tag = document.createElement('div'); tag.className = 'rg-tag'; tag.setAttribute('role', 'status'); tag.setAttribute('aria-live', 'polite'); rgList.parentNode.append(tag);
    let open = null;
    const btns = () => $$('.rg-b button', rgList);
    const fillTag = (i) => { const pg = C.pages.find((p) => p.m === i + 1); if (!pg) return;
      tag.innerHTML = `<b>${esc(MG.ar ? C.monthsAr[i] : C.months[i])}</b><span>${esc(L(pg.q))}</span>`; };
    const closeTag = () => { open = null; tag.classList.toggle('on', false); btns().forEach((x) => x.setAttribute('aria-expanded', 'false')); };
    rgList.addEventListener('click', (e) => { const btn = e.target.closest('button'); if (!btn) return; const i = +btn.dataset.m - 1;
      if (open === i) { closeTag(); return; } open = i; fillTag(i); tag.classList.toggle('on', false); void tag.offsetWidth; tag.classList.add('on');
      btns().forEach((x, k) => x.setAttribute('aria-expanded', String(k === i))); });
    document.addEventListener('pointerdown', (e) => { if (open !== null && !e.target.closest('.rg-b,.rg-tag')) closeTag(); });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && open !== null) closeTag(); });
    const labels = () => btns().forEach((b, k) => b.setAttribute('aria-label', MG.ar ? C.monthsAr[k] : C.months[k]));
    labels(); MG.page((why) => { if (why === 'lang') { labels(); if (open !== null) fillTag(open); } });
    const bs = $$('.rg-b', rgList).map((el, i) => ({ el, a0: -Math.PI / 2 + (i / N) * Math.PI * 2, out: 0, to: 0, ph: i * 1.7 }));
    /* a true circle; the ring turns slowly on its own and further with the scroll (gliding, never jumping); with the pointer
       anywhere over the section every bottle floats out a little and drifts on its own, as if in space. The hover is on the
       section, not on a bottle, so a bottle moving away never makes it flicker. */
    let W = 0, H = 0, R = 0, turn = 0, aim = 0, spd = 1, last = 0, seen = true, fl = 0, flTo = 0, lastY = scrollY;
    const ring = rgList.closest('.ring'), dir = () => (MG.ar ? -1 : 1);
    const size = () => { const r = rgList.getBoundingClientRect(); W = r.width; H = r.height; R = Math.min(W * (W < 700 ? .4 : .34), H * .37); };
    const draw = (now) => {
      const dt = Math.min(64, now - (last || now)); last = now;
      spd += ((flTo ? .25 : 1) - spd) * .03; aim += dt * .00004 * spd * dir(); turn += (aim - turn) * .06; fl += (flTo - fl) * .035;
      bs.forEach((o) => {
        const a = o.a0 + turn, t = now / 1000 + o.ph, k = 1 + .08 * fl;
        const x = W / 2 + Math.cos(a) * R * k + (Math.sin(t * .8) * 14 + Math.cos(t * .45) * 8) * fl;
        const y = H / 2 + Math.sin(a) * R * k + Math.sin(t * 1.2) * 3 + (Math.cos(t * .7) * 16 + Math.sin(t * .35) * 8) * fl;
        o.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${(Math.sin(t * .6) * 3 + Math.sin(t * .5) * 10 * fl).toFixed(2)}deg) scale(${(1 + .1 * fl).toFixed(3)})`;
      });
      if (open !== null) { const o = bs[open], m = o.el.style.transform.match(/translate3d\(([-\d.]+)px,\s*([-\d.]+)px/);
        if (m) { const x = +m[1], y = +m[2], tw = tag.offsetWidth, th = tag.offsetHeight, side = x < W / 2 ? -1 : 1;
          let tx = side > 0 ? x + 54 : x - 54 - tw, ty = y - th - 28; tx = Math.max(12, Math.min(W - tw - 12, tx)); ty = Math.max(12, Math.min(H - th - 12, ty));
          tag.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0)`; tag.style.setProperty('--tilt', (side * 3) + 'deg'); tag.style.setProperty('--ox', side > 0 ? '0%' : '100%'); } }
      rgList.classList.toggle('up', fl > .3);
      if (seen) requestAnimationFrame(draw); else last = 0;
    };
    ring.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') flTo = 1; });
    ring.addEventListener('pointerleave', () => { flTo = 0; });
    addEventListener('scroll', () => { const y = scrollY; aim += (y - lastY) * .0022 * dir(); lastY = y; }, { passive: true });
    size(); addEventListener('resize', size);
    if (MG.still) { draw(0); } else {
      new IntersectionObserver((en) => { const v = en[0].isIntersecting; if (v && !seen) { seen = true; requestAnimationFrame(draw); } seen = v; }).observe(rgList);
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(() => rgList.classList.add('in'));
  }

  /* ---------- 2a · the calendar in four real rooms: a slow cross-fade from one to the next, the small views below choose ---------- */
  const cwm = $('#cwm');
  if (cwm) {
    const ims = $$(':scope > img', cwm), bts = $$('.cm-th button', cwm); let at = 0, seen = false, timer = 0;
    const go = (i) => { ims[at].classList.toggle('on', false); bts[at].setAttribute('aria-pressed', 'false'); at = (i + ims.length) % ims.length; ims[at].classList.add('on'); bts[at].setAttribute('aria-pressed', 'true'); };
    const run = () => { clearInterval(timer); if (!MG.still) timer = setInterval(() => { if (seen && !document.hidden) go(at + 1); }, 4500); };
    bts.forEach((b, i) => b.addEventListener('click', () => { go(i); run(); }));
    vis(cwm, (v) => { seen = v; }); run();
  }

  /* ---------- 2 · the calendar on the wall: its pages lie in the photograph's page, the wire on top; every few seconds
     the front page is torn up over the wire and goes to the back, so the next month shows ---------- */
  const cwp = $('#cwp');
  if (cwp) {
    const ORDER = C.pages.map((p) => p.k);
    ORDER.slice().reverse().forEach((k, i) => { const d = document.createElement('div'); d.className = 'cw-pg'; d.innerHTML = `<img src="assets/${k}.webp" alt="" loading="lazy" decoding="async" draggable="false">`; cwp.insertBefore(d, cwp.querySelector('.wire')); });
    let seen = false, busy = false;
    const tear = () => {
      if (!seen || busy || document.hidden) return;
      const pgs = $$('.cw-pg', cwp), top = pgs[pgs.length - 1]; if (!top || pgs.length < 2) return; busy = true;
      top.classList.add('tear');
      setTimeout(() => { top.classList.remove('tear'); cwp.insertBefore(top, pgs[0]); busy = false; }, 1100);
    };
    vis(cwp, (v) => { seen = v; });
    if (!MG.still) setInterval(tear, 3000);
    cwp.parentNode.addEventListener('click', () => { busy = false; tear(); });
  }

  /* ---------- 3 · the twelve months: a folded leaflet of thirteen panels (the cover and the months) that slides along as
     the section is scrolled through. Months whose page Farah has not finished yet wait as a blank sheet with their name. ---------- */
  const track = $('#motrack'), row = $('#morow');
  let panels = [], step = 0, pw = 0;
  function months() {
    if (!row) return;
    const list = [C.pages.find((p) => p.m === 0)].concat(C.months.map((n, i) => C.pages.find((p) => p.m === i + 1) || { m: i + 1, soon: true }));
    row.innerHTML = list.map((p, i) => { const nm = p.m === 0 ? L(p.n) : (MG.ar ? C.monthsAr[p.m - 1] : C.months[p.m - 1]);
      return `<li class="mo${p.soon ? ' soon' : ''}${i % 2 ? ' b' : ''}"><a href="calendar.html${p.soon ? '' : '#' + p.k}" tabindex="-1"><span class="pg">${p.soon ? `<span class="blank"><b class="hand">${esc(nm)}</b><small>${t('Being painted', 'قيد الرسم')}</small></span>` : `<img src="assets/t-${p.k}.webp" alt="${esc(nm)}" loading="lazy" decoding="async">`}</span><span class="nm"><b class="no">${String(p.m).padStart(2, '0')}</b><span class="hand">${esc(nm)}</span></span></a></li>`; }).join('');
    panels = $$('.mo', row); size();
  }
  function size() {
    if (!track || !panels.length) return;
    const phone = innerWidth < 760, A = 24 * Math.PI / 180;
    pw = phone ? 210 : Math.min(340, innerWidth * .24); step = pw * Math.cos(A);
    const total = step * (panels.length - 1) + pw, run = Math.max(0, total - innerWidth + (phone ? 32 : 160));
    track.style.setProperty('--pw', pw + 'px'); track.style.height = `calc(100svh + ${run}px)`; track.dataset.run = run;
    panels.forEach((p, i) => { p.style.setProperty('--x', i * step + 'px'); });
    slide();
  }
  function slide() {
    if (!track || !panels.length) return;
    const r = track.getBoundingClientRect(), run = +track.dataset.run || 0, f = run ? Math.min(1, Math.max(0, -r.top / (r.height - innerHeight))) : 0;
    row.style.transform = `translateX(${(MG.ar ? 1 : -1) * f * run}px)`;
  }
  if (track) { addEventListener('scroll', () => requestAnimationFrame(slide), { passive: true }); addEventListener('resize', size); }

  /* ---------- 4 · the shelves: four real photographs, each piece in its place, the shelf's name on it ---------- */
  const SHELF = [['painting', 'dovegirl', 'mk-bench', 'paintings.html', ['Paintings', 'اللوحات']], ['postcard', 'hero', 'pc-hands', 'postcards.html', ['Postcards', 'البطاقات البريدية']],
    ['sticker', 's-lemons', 'sk-laptop', 'stickers.html', ['Stickers', 'الملصقات']], ['calendar', '', 'cr2-hands', 'calendar.html', ['Calendar', 'التقويم']]];
  function shelves() {
    const g = $('#clgrid'); if (!g) return;
    g.innerHTML = SHELF.map((s) => `<li class="ct"><a href="${s[3]}"><span class="ph">${MG.mock.scene(s[0], s[1], s[2])}</span><span class="lb">${esc(L(s[4]))}</span><span class="pr">${t('from', 'من')} ${MG.fmt(MG.price(s[0]))}</span></a></li>`).join('');
  }

  /* ---------- 5 · just in ---------- */
  const pick = (kind, ids) => ids.map((id) => MG.product(kind, id)).filter(Boolean);
  const J = [...pick('painting', ['psea', 'dovegirl', 'sparklers']), ...pick('sticker', ['s-kaak']), ...pick('painting', ['pcartgirl']), ...pick('postcard', ['pmoonsleep']), ...pick('sticker', ['s-jaffa']), ...pick('painting', ['snowglobe'])];
  const KN = { painting: ['Painting', 'لوحة'], postcard: ['Postcard', 'بطاقة بريدية'], sticker: ['Sticker', 'ملصق'] };

  MG.page(function (why) {
    if (why === 'init' || why === 'lang') { months(); shelves(); }
    const pr = MG.printOf('calendar', ''); const cp = $('#calprint'); if (cp) cp.innerHTML = pr ? MG.printBtn('calendar', '') : '';
    $('#grid').innerHTML = J.map((p, i) => `<li class="it${i === 0 ? ' big' : ''}${p.kind === 'sticker' ? ' stk' : ''}">
      <a class="im" href="${PAGE[p.kind]}#${esc(p.id)}" data-peek="${p.kind}:${esc(p.id)}"><img src="${esc(i === 0 ? MG.img(p.id, p) : MG.thumb(p.id, p))}" alt="${esc(p.title_en)}, by Farah Al-Helou" loading="lazy"></a>
      <div class="cap"><h3 class="hand">${esc(MG.title(p))}</h3><span class="pr">${MG.fmt(MG.price(p.kind, p.id))}</span></div><span class="kind">${L(KN[p.kind])}</span>
      <div class="acts">${MG.addBtn(p.kind, p.id)}${MG.shareBtn(p.kind, p.id)}</div></li>`).join('') +
      `<li class="it all"><a href="shop.html"><span>${t('See everything Farah has painted', 'شاهدوا كل ما رسمته فرح')}</span><svg viewBox="0 0 12 12" width="20" height="20" aria-hidden="true"><path d="M3 9l6-6M4 3h5v5" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></a></li>`;
    $$('[data-alt-ar]').forEach((e) => { if (e.dataset.altEn == null) e.dataset.altEn = e.alt; e.alt = MG.ar ? e.dataset.altAr : e.dataset.altEn; });
  });
})();
