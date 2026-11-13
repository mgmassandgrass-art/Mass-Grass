/* Mass & Grass · every piece shown in a real photograph (a frame on a wall, a card in a hand, a sticker on a laptop),
   the quick view that opens when a piece is clicked, the things that appear one by one on the way down the page,
   and the colour chart that follows the scroll. Loaded on every page after core.js. */
(function () {
  'use strict';
  const { $, $$, esc, t, L } = MG, doc = document, DIM = window.MG_ART || {};
  const asp = (id) => (DIM[id] ? DIM[id][0] / DIM[id][1] : 1.3);

  /* ---------- the photographs: size, and where the piece goes, as fractions of the photo ---------- */
  const ROOM = { 'wall-l': { w: 1600, h: 1200, x: .2553, y: .1775, ww: .5031, wh: .4608, n: ['On the wall', 'على الحائط'] }, 'mk-bench': { w: 1024, h: 768, x: .2139, y: .2194, ww: .4404, wh: .4154, n: ['On the bench', 'على المقعد'] },
    'mk-bed': { w: 1024, h: 768, x: .3091, y: .1374, ww: .3809, wh: .3086, n: ['Over the bed', 'فوق السرير'] }, 'mk-desk': { w: 1024, h: 1280, x: .2988, y: .207, ww: .4131, wh: .4641, n: ['On the desk', 'على المكتب'] },
    'mk-girl': { w: 1024, h: 1280, x: .3003, y: .3195, ww: .4141, wh: .418, n: ['In the hands', 'بين اليدين'] }, 'wall-p': { w: 680, h: 848, x: .2993, y: .1492, ww: .4118, wh: .4399, n: ['On the wall', 'على الحائط'] },
    'held-4x5': { w: 1080, h: 1350, x: .3079, y: .0845, ww: .3861, wh: .3896, n: ['Held up', 'مرفوعة'] }, 'held-1x1': { w: 1080, h: 1350, x: .2676, y: .1311, ww: .438, wh: .3519, n: ['Held up', 'مرفوعة'] } };
  const CARD = { 'pc-hands': { w: 1536, h: 1152, x: .1725, y: .1641, ww: .6628, wh: .5842, n: ['In the hand', 'في اليد'] }, 'pc-sea': { w: 1536, h: 1152, x: .2279, y: .2708, ww: .543, wh: .4384, n: ['By the sea', 'أمام البحر'] },
    'pcp-window': { w: 1536, h: 1920, x: .2168, y: .1391, ww: .5462, wh: .663, clip: '0.00% 0.47%,99.05% 0.00%,100.00% 99.92%,0.83% 100.00%', o: 'p', n: ['By the window', 'عند النافذة'] }, 'pcp-table': { w: 1536, h: 1152, x: .321, y: .1597, ww: .3561, wh: .6571, o: 'p', n: ['In both hands', 'بين اليدين'] } };
  const THING = { 'sk-laptop': { r: [.13, .15, .75, .70], s: .2, n: ['On a laptop', 'على الحاسوب'] }, 'sk-notebook': { r: [.275, .05, .395, .905], s: .24, n: ['On a notebook', 'على الدفتر'] }, 'sk-phone': { r: [.35, .25, .31, .665], s: .2, n: ['On a phone', 'على الهاتف'] } };
  const CAL = { 'cr2-wall': ['On the wall', 'على الحائط'], 'cr2-hands': ['In the hands', 'بين اليدين'], 'cr2-desk': ['On the desk', 'على المكتب'], 'cr2-flat': ['The pages', 'الصفحات'] };
  const fit = (id, set) => Object.keys(set).map((k) => [k, Math.abs(Math.log((set[k].ww * set[k].w) / (set[k].wh * set[k].h) / asp(id)))]).sort((a, b) => a[1] - b[1]);
  /* the painting whole inside the frame's mat: the same margin all round, a little more at the bottom, as framers cut it */
  function artBox(id, m) { const a = asp(id), mw = m.ww * m.w, mh = m.wh * m.h, g = .13 * Math.min(mw, mh), bw = mw - 2 * g, bh = mh - 2 * g; let w, h; if (a > bw / bh) { w = bw; h = w / a; } else { h = bh; w = h * a; }
    const top = (mh - h) / 2 - .012 * mh; return `left:${((m.x + (mw - w) / 2 / m.w) * 100).toFixed(3)}%;top:${((m.y + top / m.h) * 100).toFixed(3)}%;width:${((w / m.w) * 100).toFixed(3)}%;height:${((h / m.h) * 100).toFixed(3)}%`; }
  /* the photographs that suit one piece, best first: [key, name] */
  function scenes(kind, id) {
    if (kind === 'painting') { const d = fit(id, ROOM); return d.filter((x) => x[1] <= d[0][1] + .3).slice(0, 4).map((x) => [x[0], ROOM[x[0]].n]); }
    if (kind === 'postcard') return Object.keys(CARD).filter((k) => (CARD[k].o === 'p' ? asp(id) < 1.15 : asp(id) >= 1.15)).map((k) => [k, CARD[k].n]);
    if (kind === 'sticker') return Object.keys(THING).map((k) => [k, THING[k].n]);
    if (kind === 'calendar') return Object.keys(CAL).map((k) => [k, CAL[k]]);
    return [];
  }
  function scene(kind, id, key, p) {
    const src = esc(kind === 'calendar' ? '' : MG.img(id, p || MG.product(kind, id)));
    if (kind === 'painting') { const m = ROOM[key]; return `<div class="mscene" style="--ar:${m.w / m.h}"><img class="room" src="assets/${key}.webp" alt=""><img class="art framed" src="${src}" alt="" style="${artBox(id, m)}"></div>`; }
    if (kind === 'postcard') { const m = CARD[key], pos = `left:${m.x * 100}%;top:${m.y * 100}%;width:${m.ww * 100}%;height:${m.wh * 100}%`;
      return `<div class="mscene" style="--ar:${m.w / m.h}"><img class="room" src="assets/${key}.webp" alt=""><img class="art card" src="${src}" alt="" style="${pos}${m.clip ? `;clip-path:polygon(${m.clip})` : ''}"><img class="top" src="assets/${key}-top.webp" alt=""></div>`; }
    if (kind === 'sticker') { const m = THING[key], r = m.r, w = m.s * 1.5; return `<div class="mscene" style="--ar:${1536 / 1152}"><img class="room" src="assets/${key}.webp" alt=""><img class="art stuck" src="${src}" alt="" style="left:${(r[0] + r[2] / 2 - w / 2) * 100}%;top:${(r[1] + r[3] * .5) * 100}%;width:${w * 100}%"></div>`; }
    return `<div class="mscene" style="--ar:${3072 / 1728}"><img class="room" src="assets/${key}.webp" alt=""></div>`;
  }
  MG.mock = { scenes, scene, asp, ROOM, artBox };

  /* ---------- the quick view: click a piece anywhere and see it in a photograph ---------- */
  let dlg = null, cur = null;
  function peek(kind, id) {
    const p = kind === 'calendar' ? null : MG.product(kind, id); if (kind !== 'calendar' && !p) return false;
    const sc = scenes(kind, id); if (!sc.length) return false;
    if (!dlg) { dlg = doc.createElement('dialog'); dlg.className = 'peek'; dlg.setAttribute('aria-labelledby', 'peek-h'); doc.body.append(dlg);
      dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) return dlg.close();
        const b = e.target.closest('[data-sc]'); if (b) { cur.i = +b.dataset.sc; paint(); } });
      dlg.addEventListener('close', () => { cur = null; }); }
    cur = { kind, id, p, sc, i: 0 }; paint(); if (!dlg.open) dlg.showModal(); return true;
  }
  function paint() {
    if (!cur) return; const { kind, id, p, sc, i } = cur, cal = kind === 'calendar', plain = i === sc.length;
    const name = cal ? L(MG.calendar.title).replace(/[,،]\s*2027/, '') : MG.title(p), page = MG.PAGE[kind] + (cal ? '' : '#' + id);
    dlg.dir = MG.ar ? 'rtl' : 'ltr';
    dlg.innerHTML = `<div class="peek-in"><button class="x" type="button" data-close aria-label="${t('Close', 'إغلاق')}"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
      <div class="peek-v">${plain ? `<div class="mplain ${kind}"><img src="${esc(MG.img(id, p))}" alt=""></div>` : scene(kind, id, sc[i][0], p)}</div>
      <div class="peek-s" role="group" aria-label="${t('Where to see it', 'أين ترونها')}">${sc.map((s, k) => `<button type="button" data-sc="${k}" aria-pressed="${k === i}">${esc(L(s[1]))}</button>`).join('')}${cal ? '' : `<button type="button" data-sc="${sc.length}" aria-pressed="${plain}">${t('The piece itself', 'القطعة نفسها')}</button>`}</div>
      <div class="peek-t"><h2 class="hand" id="peek-h">${esc(name)}</h2><span class="kd">${esc(MG.kindLabel(kind))}</span><b class="fig">${MG.fmt(MG.price(kind, cal ? '' : id))}</b>
        <div class="acts">${cal ? `<button type="button" class="ink" data-add="calendar">${MG.bag.has('calendar', MG.calendar.id) ? t('In your bag', 'في السلة') : t('Add to bag', 'أضيفوه إلى السلة')}</button>` : MG.addBtn(kind, id, 'ink')}${MG.shareBtn(kind, cal ? '' : id)}</div>
        ${MG.printBtn(kind, cal ? '' : id)}<a class="go" href="${page}">${t('All the details', 'كل التفاصيل')}</a></div></div>`;
  }
  MG.peek = peek;
  doc.addEventListener('click', (e) => { const a = e.target.closest('[data-peek]'); if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return; const [k, id] = a.dataset.peek.split(':'); if (peek(k, id || '')) e.preventDefault(); });
  MG.page((why) => { if (cur && dlg && dlg.open) paint(); });

  /* ---------- things appear one by one on the way down ---------- */
  const RV = '.sech,.cols>*,.bento>li,.pages>li,.stage,.calrow,.st>*,.shgrid>li,.pghd>*,.ft>*,.wall>*,[data-rv]';
  let io = null, booted = false;
  function reveal() {
    if (MG.still || !('IntersectionObserver' in window)) return;
    if (!io) io = new IntersectionObserver((en) => en.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .05 });
    $$(RV).forEach((el) => { if (el._rv) return; el._rv = 1;
      const r = el.getBoundingClientRect(), inView = r.top < innerHeight && r.bottom > 0;
      if (booted && inView) return; /* redrawn in place (the bag changed): it is already there */
      const sib = el.parentNode ? [...el.parentNode.children].indexOf(el) : 0; el.style.setProperty('--rvd', Math.min(sib, 7) * 70 + 'ms'); el.classList.add('rv'); io.observe(el); });
    booted = true;
  }
  MG.page(() => requestAnimationFrame(reveal));

  /* ---------- the glass strip under the menu: the section in view, its number and a few words about it ---------- */
  function where(secs) {
    const bar = doc.createElement('div'); bar.className = 'where'; bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = '<div class="where-in"><span class="no"></span><span class="nm"></span><span class="meta"></span></div>';
    const head = $('header'); head.after(bar);
    const no = bar.querySelector('.no'), nm = bar.querySelector('.nm'), meta = bar.querySelector('.meta'), pad = (n) => String(n).padStart(2, '0');
    const name = (x) => (x.s.dataset[MG.ar ? 'whereAr' : 'where'] || (x.h.innerText || x.h.textContent)).replace(/\s+/g, ' ').trim();
    const words = (x) => (x.s.dataset[MG.ar ? 'metaAr' : 'meta'] || '').split('|').filter(Boolean);
    let cur = -1, shown = false;
    function paint(i, force) {
      if (i === cur && !force) return; cur = i; const x = secs[i];
      no.innerHTML = `<b>${pad(i + 1)}</b> / ${pad(secs.length)}`;
      nm.innerHTML = `<span><button type="button" tabindex="-1">${esc(name(x))}</button></span>`;
      meta.innerHTML = `<span>${words(x).map((w, k) => (k ? '<i></i>' : '') + esc(w)).join('')}</span>`;
    }
    nm.addEventListener('click', () => { if (cur >= 0) secs[cur].s.scrollIntoView({ behavior: MG.still ? 'auto' : 'smooth', block: 'start' }); });
    let q = false;
    function on() { q = false; const top = (parseFloat(getComputedStyle(doc.documentElement).getPropertyValue('--head')) || 49) + 60;
      let ci = 0; secs.forEach((x, k) => { if (x.s.getBoundingClientRect().top <= top) ci = k; });
      const show = scrollY > 120; if (show !== shown) { shown = show; bar.classList.toggle('on', show); }
      paint(ci); }
    addEventListener('scroll', () => { if (!q) { q = true; requestAnimationFrame(on); } }, { passive: true }); on();
    MG.page((why) => { if (why === 'lang') paint(cur < 0 ? 0 : cur, true); });
  }

  /* ---------- the ruler down the edge, after getartcraft.com ----------
     While reading it is zoomed in round where you are: the scale slides past a blue line that carries the percent, the
     section in view is named large at the top, those above it small and grey over it, those still to come small and grey
     at the foot. Bring the pointer onto it and it opens out to the whole page, 0 to 100: every section's name stands at
     its place, a grey box shows what is on screen, and a click or a drag goes there. */
  function rail() {
    const secs = $$('main > section').map((s) => { const h = s.querySelector('h1,h2'); return h ? { s, h } : null; }).filter(Boolean);
    if (secs.length < 2) return;
    where(secs);
    if (secs.length < 3) return;
    const el = doc.createElement('aside'); el.className = 'rail'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `<div class="rl-sc"><div class="rl-k">${[...Array(101)].map((_, i) => `<i class="${i % 5 ? '' : 'b'}" style="top:${i}%">${i % 5 ? '' : `<b>${i}</b>`}</i>`).join('')}</div>
      <div class="rl-w"></div><div class="rl-m"><b></b></div></div><ol class="rl-n"></ol>`;
    doc.body.append(el); doc.documentElement.classList.add('has-rail');
    const sc = el.querySelector('.rl-sc'), ks = el.querySelector('.rl-k'), win = el.querySelector('.rl-w'), mk = el.querySelector('.rl-m'), pct = mk.firstChild, list = el.querySelector('.rl-n');
    const name = (x) => (x.s.dataset[MG.ar ? 'whereAr' : 'where'] || (x.h.innerText || x.h.textContent)).replace(/\s+/g, ' ').trim();
    let lis = [];
    const names = () => { list.innerHTML = secs.map((x, i) => `<li><button type="button" tabindex="-1" data-go="${i}">${esc(name(x))}</button></li>`).join(''); lis = [...list.children]; };
    names(); MG.page((why) => { if (why === 'lang') { names(); tick(true); } });
    let z = 0, zt = 0, run = false, dragging = false;
    const ZOOM = 3.2, ANCHOR = .34, GAP = 18, BIG = 1.45;
    function tick(force) {
      const H = sc.clientHeight, docH = doc.documentElement.scrollHeight, max = Math.max(1, docH - innerHeight);
      const top = scrollY / docH, view = innerHeight / docH, prog = Math.min(1, Math.max(0, scrollY / max));
      z += (zt - z) * (MG.still ? 1 : .16); if (Math.abs(zt - z) < .002) z = zt;
      /* the scale: zoomed (z=0) the current place sits on the anchor; opened (z=1) the whole page fills the height */
      const uO = H / 100, uZ = uO * ZOOM, u = uZ + (uO - uZ) * z;
      const offZ = H * ANCHOR - prog * 100 * uZ, off = offZ + (0 - offZ) * z;
      ks.style.height = 100 * u + 'px'; ks.style.transform = `translateY(${off.toFixed(1)}px)`;
      ks.classList.toggle('fine', z > .5);
      /* the blue line reads the same number as its percent (how far down the page you are), the grey box is what is on screen */
      const y = off + top * 100 * u, ym = off + prog * 100 * u;
      mk.style.transform = `translateY(${ym.toFixed(1)}px)`; pct.textContent = String(Math.round(prog * 100)).padStart(3, '0') + '%';
      win.style.transform = `translateY(${y.toFixed(1)}px)`; win.style.height = Math.max(6, view * 100 * u) + 'px'; win.style.opacity = z;
      /* the names */
      let ci = 0; secs.forEach((x, i) => { if (x.s.getBoundingClientRect().top <= innerHeight * .4) ci = i; });
      const n = secs.length, prev = ci, next = n - ci - 1, atTop = ci === 0 && scrollY < innerHeight * .5;
      secs.forEach((x, i) => {
        const li = lis[i]; if (!li) return;
        const sy = off + (x.s.getBoundingClientRect().top + scrollY) / docH * 100 * u - 8;   /* opened: at its place */
        let zy, zs = 1, zo = .42;                                                          /* zoomed: stacked */
        if (i < ci) zy = 10 + i * GAP;
        else if (i === ci) { zy = 10 + prev * GAP + 6; zs = BIG; zo = atTop ? 0 : 1; }
        else zy = H - 14 - (n - i) * GAP;
        if (atTop && i > ci) zy = H - 14 - (n - i) * GAP;
        const yy = zy + (sy - zy) * z, ss = zs + (1 - zs) * z, oo = zo + (1 - zo) * z;
        li.style.transform = `translateY(${yy.toFixed(1)}px) scale(${ss.toFixed(3)})`; li.style.opacity = oo.toFixed(3);
        li.classList.toggle('on', i === ci);
      });
      if (!force && z !== zt) requestAnimationFrame(() => tick()); else run = false;
    }
    const go = () => { if (!run) { run = true; requestAnimationFrame(() => tick()); } };
    addEventListener('scroll', go, { passive: true }); addEventListener('scroll', () => doc.documentElement.style.setProperty('--sf', (scrollY / Math.max(1, doc.documentElement.scrollHeight - innerHeight)).toFixed(4)), { passive: true }); addEventListener('resize', () => tick(true)); addEventListener('load', () => tick(true)); tick(true);
    /* open out under the pointer; click or drag on the scale to go there */
    const open = (on) => { zt = on ? 1 : 0; run = false; go(); };
    el.addEventListener('pointerenter', () => open(true)); el.addEventListener('pointerleave', () => { if (!dragging) open(false); });
    const jump = (e) => { const r = sc.getBoundingClientRect(), f = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)), docH = doc.documentElement.scrollHeight;
      scrollTo({ top: f * docH - innerHeight / 2, behavior: dragging ? 'auto' : (MG.still ? 'auto' : 'smooth') }); };
    /* a press on the scale goes there and, held, drags; nothing on the ruler is ever selected as text, and letting go
       anywhere (or the press being cancelled) ends the drag and closes the ruler if the pointer has left it */
    const stop = () => { if (!dragging) return; dragging = false; if (!el.matches(':hover')) open(false); };
    sc.addEventListener('pointerdown', (e) => { if (e.button) return; e.preventDefault(); dragging = true; try { sc.setPointerCapture(e.pointerId); } catch (er) {} jump(e); });
    sc.addEventListener('pointermove', (e) => { if (dragging) jump(e); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => sc.addEventListener(ev, stop));
    addEventListener('blur', stop); el.addEventListener('selectstart', (e) => e.preventDefault()); el.addEventListener('dragstart', (e) => e.preventDefault());
    list.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) secs[+b.dataset.go].s.scrollIntoView({ behavior: MG.still ? 'auto' : 'smooth', block: 'start' }); });
  }
  doc.readyState === 'loading' ? doc.addEventListener('DOMContentLoaded', rail) : rail();

  /* ---------- smooth scrolling: a mouse wheel moves a target and the page glides to it (as on the reference). Anything that
     scrolls on its own (the bag, menus, dialogs) keeps its native wheel; keys, the scrollbar and touch are untouched. ---------- */
  (function () {
    if (MG.still || !matchMedia('(pointer:fine)').matches) return;
    let aim = scrollY, cur = scrollY, run = false, mine = false;
    const max = () => doc.documentElement.scrollHeight - innerHeight;
    const inner = (el, dy) => { for (; el && el !== doc.body && el.nodeType === 1; el = el.parentElement) {
      const cs = getComputedStyle(el); if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1) {
        if ((dy < 0 && el.scrollTop > 0) || (dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1)) return true; } } return false; };
    const step = () => {
      cur += (aim - cur) * .1; if (Math.abs(aim - cur) < .5) cur = aim;
      mine = true; scrollTo({ top: cur, behavior: 'instant' });
      if (cur !== aim) requestAnimationFrame(step); else run = false;
    };
    addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY) || doc.body.style.overflow === 'hidden' || doc.querySelector('dialog[open]') || inner(e.target, e.deltaY)) return;
      e.preventDefault();
      const d = e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? innerHeight : 1);
      if (!run) { aim = cur = scrollY; }
      aim = Math.max(0, Math.min(max(), aim + d));
      if (!run) { run = true; requestAnimationFrame(step); }
    }, { passive: false });
    addEventListener('scroll', () => { if (mine) { mine = false; return; } if (!run) aim = cur = scrollY; }, { passive: true });
  })();
})();
