/* The book reader: every [data-book] on a page becomes a book whose pages turn like paper (CSS 3D).
   Two pages side by side when there is room, one page on phones. Drag a page, click its half, use the arrows or the keys.
   Only the preview pages are here; after them a last page says the rest is in the full book, with a Buy button.
   The pages: the admin's Book panel (MG.book.live, from the server's catalog), else assets/book/book.json (temporary placeholders).
   Reduced motion: pages change without turning. */
(function () {
  'use strict';
  const { $$, esc, t, L, fmt, price, bag, toast } = MG;
  const B = MG.book;
  let data = null; // { imgs, pages, preview, ratio, dir, title, credit }

  async function load() {
    if (B.live) return { imgs: B.live.imgs, pages: B.live.pages, ratio: B.live.ratio || 0.75, dir: B.live.dir || 'ltr' };
    try { const r = await fetch(B.manifest, { credentials: 'same-origin' }); const j = await r.json(); return { imgs: j.imgs, pages: j.pages, ratio: j.ratio || 0.75, dir: j.dir || 'ltr', placeholder: !!j.placeholder }; }
    catch (e) { return { imgs: [B.cover], pages: B.pages, ratio: 0.75, dir: 'ltr' }; }
  }

  /* the words around a reader: title, credit, page count, price */
  function words() {
    $$('[data-book-title]').forEach((e) => (e.textContent = L(B.title)));
    $$('[data-book-credit]').forEach((e) => (e.textContent = L(B.credit)));
    $$('[data-book-pages]').forEach((e) => (e.textContent = data ? t(`${data.pages} pages, a PDF`, `${data.pages} صفحة، ملف PDF`) : ''));
    $$('[data-book-preview]').forEach((e) => (e.textContent = data ? t(`The first ${data.imgs.length} pages to read here`, `أول ${data.imgs.length} صفحات للقراءة هنا`) : ''));
    $$('[data-buy-book]').forEach((e) => { const on = bag.has('book', B.id); e.textContent = on ? t('In your bag', 'في السلة') : t('Buy the book', 'اشتروا الكتاب'); e.setAttribute('aria-pressed', on); });
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-buy-book]'); if (!b) return; e.preventDefault();
    if (bag.has('book', B.id)) { MG.openBag(); return; }
    bag.add('book', B.id); toast(t('The book is in your bag.', 'أُضيف الكتاب إلى السلة.'));
  });

  function Reader(el) {
    const ltr = data.dir !== 'rtl', N = data.imgs.length;
    /* the pages: the preview pictures, then the page that sends readers to the full book */
    const end = () => `<div class="bk-end"><p class="hand">${t('The preview ends here', 'هنا تنتهي المعاينة')}</p><h3>${esc(L(B.title))}</h3>
      <p>${t(`${Math.max(0, data.pages - N)} more pages are in the full book.`, `في الكتاب الكامل ${Math.max(0, data.pages - N)} صفحة أخرى.`)}</p>
      <b class="fig">${fmt(price('book'))}</b><button type="button" class="ink" data-buy-book>${t('Buy the book', 'اشتروا الكتاب')}</button></div>`;
    const P = [...data.imgs.map((src, i) => `<img src="${esc(src)}" alt="${esc(t(`Page ${i + 1}`, `الصفحة ${i + 1}`))}" draggable="false" decoding="async">`), null];
    const face = (i) => (i == null || i >= P.length ? '<div class="bk-blank"></div>' : P[i] === null ? end() : P[i]);
    el.innerHTML = `<div class="bk-stage"><div class="bk-book"></div></div>
      <div class="bk-bar"><button type="button" class="bk-btn" data-go="-1" aria-label="${t('Previous page', 'الصفحة السابقة')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
      <span class="bk-n" aria-live="polite"></span><button type="button" class="bk-btn" data-go="1" aria-label="${t('Next page', 'الصفحة التالية')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button></div>`;
    el.classList.toggle('rtl', !ltr); el.classList.toggle('still', MG.still);
    if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
    el.setAttribute('role', 'region'); el.setAttribute('aria-roledescription', t('book', 'كتاب')); el.setAttribute('aria-label', L(B.title));
    const book = el.querySelector('.bk-book'), stage = el.querySelector('.bk-stage'), num = el.querySelector('.bk-n');
    let spread = false, cur = 0, leaves = [], max = 0;

    function build() {
      const keep = spread ? Math.max(0, 2 * cur - 1) : cur; // the first page in view stays in view
      spread = stage.clientWidth >= 640;
      const n = spread ? Math.ceil(P.length / 2) : P.length;
      leaves = []; book.innerHTML = '';
      for (let j = 0; j < n; j++) {
        const lf = document.createElement('div'); lf.className = 'bk-leaf';
        lf.innerHTML = spread ? `<div class="bk-f">${face(2 * j)}</div><div class="bk-b">${face(2 * j + 1)}</div>` : `<div class="bk-f">${face(j)}</div><div class="bk-b"><div class="bk-blank"></div></div>`;
        book.append(lf); leaves.push(lf);
      }
      max = spread ? (P.length % 2 ? n - 1 : n) : n - 1;
      cur = Math.min(max, spread ? Math.ceil(keep / 2) : keep);
      book.classList.toggle('two', spread); size(); paint(true);
    }
    function size() {
      const w = stage.clientWidth, hMax = Math.min(innerHeight * 0.78, 820), r = data.ratio;
      const pw = Math.floor(Math.min(spread ? w / 2 : w, hMax * r));
      book.style.setProperty('--pw', pw + 'px'); book.style.setProperty('--ph', Math.round(pw / r) + 'px');
    }
    const angle = (flipped) => (flipped ? (ltr ? -180 : 180) : 0);
    function paint(now) {
      leaves.forEach((lf, j) => {
        const f = j < cur; lf.classList.toggle('flipped', f);
        if (now) lf.style.transition = 'none';
        lf.style.transform = `rotateY(${angle(f)}deg)`;
        lf.style.zIndex = f ? j + 1 : leaves.length - j;
        /* only the faces in view can be reached */
        lf.querySelector('.bk-f').inert = f; lf.querySelector('.bk-b').inert = !f || !spread;
        if (now) { void lf.offsetWidth; lf.style.transition = ''; }
      });
      /* the closed book sits in the middle: the cover alone, or the last page alone */
      book.style.setProperty('--shift', spread ? (cur === 0 ? -0.5 : cur === leaves.length ? 0.5 : 0) * (ltr ? 1 : -1) : 0);
      const pg = (i) => String(i + 1).padStart(2, '0');
      const shown = spread ? [2 * cur - 1, 2 * cur].filter((i) => i >= 0 && i < P.length) : [cur];
      num.textContent = shown.some((i) => P[i] === null) ? t('The rest is in the book', 'البقية في الكتاب') : shown.map(pg).join('–') + ' / ' + pg(N - 1);
      el.querySelector('[data-go="-1"]').disabled = cur === 0; el.querySelector('[data-go="1"]').disabled = cur === max;
    }
    function go(d) {
      const to = Math.max(0, Math.min(max, cur + d)); if (to === cur) return;
      const lf = leaves[d > 0 ? cur : cur - 1]; lf.style.zIndex = 999; cur = to; paint();
      lf.style.zIndex = 999; clearTimeout(lf._z); lf._z = setTimeout(() => paint(true), MG.still ? 0 : 900);
    }
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) go(+b.dataset.go * 1); });
    el.addEventListener('keydown', (e) => {
      if (e.target.closest('button,a,input')) return;
      const k = e.key, fw = ltr ? 'ArrowRight' : 'ArrowLeft', bw = ltr ? 'ArrowLeft' : 'ArrowRight';
      if (k === fw || k === 'PageDown') { e.preventDefault(); go(1); } else if (k === bw || k === 'PageUp') { e.preventDefault(); go(-1); }
      else if (k === 'Home') { e.preventDefault(); cur = 0; paint(); } else if (k === 'End') { e.preventDefault(); cur = max; paint(); }
    });
    /* drag a page by its edge, or click a half */
    let drag = null;
    stage.addEventListener('pointerdown', (e) => {
      if (e.button || e.target.closest('a,button')) return;
      const r = book.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, fwdSide = ltr ? x > 0.5 : x < 0.5;
      const d = spread ? (fwdSide ? 1 : -1) : (ltr ? (x > 0.4 ? 1 : -1) : (x < 0.6 ? 1 : -1));
      if ((d > 0 && cur === max) || (d < 0 && cur === 0)) return;
      drag = { d, x0: e.clientX, t0: performance.now(), lf: leaves[d > 0 ? cur : cur - 1], w: r.width / (spread ? 2 : 1), moved: false };
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener('pointermove', (e) => {
      if (!drag) return; const dx = (e.clientX - drag.x0) * (ltr ? 1 : -1);
      if (!drag.moved && Math.abs(dx) < 6) return;
      if (!drag.moved) { drag.moved = true; drag.lf.style.transition = 'none'; drag.lf.style.zIndex = 999; el.classList.add('dragging'); }
      const p = Math.max(0, Math.min(1, drag.d > 0 ? -dx / (drag.w * 1.6) : 1 - dx / (drag.w * 1.6)));
      drag.p = p; drag.lf.style.transform = `rotateY(${p * angle(true)}deg)`;
    });
    const up = () => {
      if (!drag) return; const g = drag; drag = null; el.classList.remove('dragging'); g.lf.style.transition = '';
      if (!g.moved) { go(g.d); return; }
      const fast = performance.now() - g.t0 < 260, done = g.d > 0 ? g.p > 0.35 || (fast && g.p > 0.08) : g.p < 0.65 || (fast && g.p < 0.92);
      if (done) go(g.d); else paint();
    };
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
    new ResizeObserver(() => { const want = stage.clientWidth >= 640; if (want !== spread) build(); else size(); }).observe(stage);
    el._rebuild = build;
    build();
  }

  const readers = $$('[data-book]');
  load().then((d) => {
    data = d; words();
    readers.forEach((el) => Reader(el));
    MG.page((why) => { words(); if (why === 'lang') readers.forEach((el) => el._rebuild && el._rebuild()); });
  });
})();
