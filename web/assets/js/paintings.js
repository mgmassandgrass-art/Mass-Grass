/* Paintings: a wall of prints; each opens up close with its details, a zoom, and the rooms it is shown in. */
(function () {
  'use strict';
  const { $, esc, t, L } = MG, DIM = window.MG_ART || {};
  /* where each one was painted */
  const PLACE = { hero: ['Al-Mawasi', 'المواصي'], sparklers: ['Gaza City', 'مدينة غزة'], dovegirl: ['Deir al-Balah', 'دير البلح'], boattop: ['Gaza port', 'ميناء غزة'], guitar: ['Tel al-Hawa', 'تل الهوا'],
    house: ['Az-Zawayda', 'الزوايدة'], alley: ['Old City', 'البلدة القديمة'], blueflowers: ['Beit Lahia', 'بيت لاهيا'], seafish: ['Al-Shati', 'الشاطئ'], hill: ['Khan Younis', 'خان يونس'],
    waves: ['Gaza beach', 'بحر غزة'], deirbalah: ['Deir al-Balah', 'دير البلح'], boatman: ['Gaza port', 'ميناء غزة'], bikeride: ['Al-Shati', 'الشاطئ'] };
  const NEW = ['bikeride', 'snowglobe', 'boatman'];
  const place = (p) => (p.place_en && p.place_en !== 'Gaza' ? [p.place_en, p.place_ar || p.place_en] : PLACE[p.id] || ['Gaza', 'غزة']);
  const isNew = (p) => (MG.cat.live ? !!p.is_new : NEW.includes(p.id));
  const asp = (id) => (DIM[id] ? DIM[id][0] / DIM[id][1] : 1.3);

  /* the rooms: photo size and the frame's mat as fractions of the photo */
  const MK = { 'mk-bench': { w: 1024, h: 768, x: .2139, y: .2194, ww: .4404, wh: .4154 }, 'mk-bed': { w: 1024, h: 768, x: .3091, y: .1374, ww: .3809, wh: .3086 }, 'mk-desk': { w: 1024, h: 1280, x: .2988, y: .207, ww: .4131, wh: .4641 },
    'mk-girl': { w: 1024, h: 1280, x: .3003, y: .3195, ww: .4141, wh: .418 }, 'wall-l': { w: 1600, h: 1200, x: .2553, y: .1775, ww: .5031, wh: .4608 }, 'wall-p': { w: 680, h: 848, x: .2993, y: .1492, ww: .4118, wh: .4399 },
    'held-4x5': { w: 1080, h: 1350, x: .3079, y: .0845, ww: .3861, wh: .3896 }, 'held-3x4': { w: 1080, h: 1350, x: .3365, y: .1304, ww: .337, wh: .3593 }, 'held-5x4': { w: 1080, h: 1350, x: .1829, y: .2156, ww: .6398, wh: .4244 }, 'held-1x1': { w: 1080, h: 1350, x: .2676, y: .1311, ww: .438, wh: .3519 } };
  const FR = Object.entries(MK).map(([k, m]) => [k, (m.ww * m.w) / (m.wh * m.h)]);
  /* the rooms whose frame suits a painting's shape best */
  const scenesOf = (id) => FR.map(([k, r]) => [k, Math.abs(Math.log(r / asp(id)))]).sort((x, y) => x[1] - y[1]).slice(0, 3).map((x) => x[0]);
  function sceneFor(id, i) { const d = FR.map(([k, r]) => [k, Math.abs(Math.log(r / asp(id)))]).sort((x, y) => x[1] - y[1]), ok = d.filter((x) => x[1] <= d[0][1] + .12); return ok[i % ok.length][0]; }
  /* the painting whole inside the frame's mat: the same margin all round, a little more at the bottom, as framers cut it */
  function artBox(id, m) { const a = asp(id), mw = m.ww * m.w, mh = m.wh * m.h, g = .13 * Math.min(mw, mh), bw = mw - 2 * g, bh = mh - 2 * g; let w, h; if (a > bw / bh) { w = bw; h = w / a; } else { h = bh; w = h * a; }
    const top = (mh - h) / 2 - .012 * mh; return { l: (m.x + (mw - w) / 2 / m.w) * 100, t: (m.y + top / m.h) * 100, w: (w / m.w) * 100, h: (h / m.h) * 100 }; }
  function mock(p, i, size, sk) { const k = sk || sceneFor(p.id, i), m = MK[k], b = artBox(p.id, m);
    return `<div class="scene" style="--ar:${m.w / m.h}"><img class="room" src="assets/${size === 'thumb' ? 'sc-' + k : k}.webp" alt="" decoding="async"><img class="art" src="${size ? MG.thumb(p.id, p) : MG.img(p.id, p)}" alt="" decoding="async" style="left:${b.l}%;top:${b.t}%;width:${b.w}%;height:${b.h}%"></div>`; }

  /* a painting's details, worked out from its file: shape, the papers it prints sharp on, the frames it fits */
  const PAPER = [['A6', 10.5, 14.8], ['A5', 14.8, 21], ['A4', 21, 29.7], ['A3', 29.7, 42], ['A2', 42, 59.4]];
  const FRAMES = [[13, 18, 'cm'], [20, 25, 'cm'], [21, 29.7, 'cm'], [30, 40, 'cm'], [40, 50, 'cm'], [50, 70, 'cm'], [20, 20, 'cm'], [30, 30, 'cm'], [20, 30, 'cm'], [8, 10, 'in'], [11, 14, 'in'], [12, 16, 'in']];
  function maxPaper(px, dpi) { let best = null; const Lg = Math.max(...px), S = Math.min(...px), a = Lg / S; for (const [n, ps, pl] of PAPER) { const s = Math.min(pl / a, ps), l = s * a; if (Lg / (l / 2.54) >= dpi && S / (s / 2.54) >= dpi) best = [n, ps, pl]; } return best; }
  function shapeOf(a) { const r = a >= 1 ? a : 1 / a, R = [[1, '1:1'], [1.25, '5:4'], [1.333, '4:3'], [1.414, '√2:1'], [1.5, '3:2']], n = R.reduce((x, y) => (Math.abs(y[0] - r) < Math.abs(x[0] - r) ? y : x));
    if (a > .94 && a < 1.06) return [['Square', 'مربّعة'], '1:1'];
    if (n[1] === '1:1') return [a > 1 ? ['Landscape, almost square', 'عرضية، شبه مربّعة'] : ['Portrait, almost square', 'طولية، شبه مربّعة'], ''];
    return [a > 1 ? ['Landscape', 'عرضية'] : ['Portrait', 'طولية'], a >= 1 ? n[1] : n[1].split(':').reverse().join(':')]; }
  const framesFor = (a) => { const r = a >= 1 ? a : 1 / a; return FRAMES.filter((f) => Math.abs(Math.max(f[0], f[1]) / Math.min(f[0], f[1]) - r) / r < .04).map((f) => (a >= 1 ? `${f[1]} × ${f[0]} ${f[2]}` : `${f[0]} × ${f[1]} ${f[2]}`)); };
  function spec(id) { const px = DIM[id]; if (!px) return ''; const a = px[0] / px[1], sh = shapeOf(a), sharp = maxPaper(px, 300), good = maxPaper(px, 150), fr = framesFor(a), c = t(', ', '، ');
    const paper = (p) => (p ? `${t('up to', 'حتى')} ${p[0]} (<span dir="ltr">${a >= 1 ? p[2] + ' × ' + p[1] : p[1] + ' × ' + p[2]} cm</span>)` : t('below A6', 'أصغر من A6'));
    const rows = [[t('Original', 'الأصل'), t('Watercolour on paper', 'ألوان مائية على ورق')], [t('Shape', 'الشكل'), L(sh[0]) + (sh[1] ? c + sh[1] : '')], [t('File', 'الملف'), t('PNG and PDF, high resolution', 'PNG وPDF بدقة عالية')], [t('Prints', 'الطباعة'), t('sharp up to A3', 'واضحة حتى مقاس A3')]];
    if (fr.length) rows.push([t('Fits frames', 'تناسب إطارات'), fr.slice(0, 3).map((f) => `<span dir="ltr">${f}</span>`).join(c) + t(', no cropping', '، دون قص')]);
    return rows.map((r) => `<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join(''); }

  const wall = $('#wall'), filt = $('#filt'), view = $('#view'), big = $('.view .big'), vimg = $('#vimg');
  let mode = 'all', shown = [], vi = 0, vmode = 'art', zoomed = false;
  const FL = [['all', 'All', 'الكل', () => true], ['new', 'New', 'الجديدة', isNew]];

  function render(why) {
    const P = MG.products('painting');
    if (why !== 'bag' && why !== 'user') {
      filt.innerHTML = FL.map((f) => `<li><button type="button" data-f="${f[0]}" aria-pressed="${mode === f[0]}">${t(f[1], f[2])}<sup>${P.filter(f[3]).length}</sup></button></li>`).join('');
      shown = P.filter(FL.find((f) => f[0] === mode)[3]);
      wall.innerHTML = shown.map((p, i) => `<a class="pp ac-cell" href="#${esc(p.id)}" data-i="${i}">
        <span class="ac-hd"><b class="no">${String(i + 1).padStart(2, '0')}</b>${isNew(p) ? `<span class="nw">${t('New', 'جديدة')}</span>` : ''}<span class="lb">${esc(L(place(p)))}</span></span>
        <span class="ac-im"><span class="pc"><img src="${esc(MG.thumb(p.id, p))}" alt="${esc(p.title_en)}, watercolour by Farah Al-Helou" loading="lazy" decoding="async" width="560" height="${Math.round(560 / asp(p.id))}"></span><span class="mk" aria-hidden="true">${mock(p, i, 'small')}</span></span>
        <span class="ac-ft"><h2 class="hand">${esc(MG.title(p))}</h2><span class="pr">${MG.fmt(MG.price('painting', p.id))}</span></span></a>`).join('');
    }
    if (view.open) open_(vi);
  }
  filt.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; mode = b.dataset.f; render('view'); MG.tear(); });
  /* the room behind a painting is only fetched when someone hovers it */
  wall.addEventListener('click', (e) => { const a = e.target.closest('.pp'); if (!a) return; e.preventDefault(); open_(+a.dataset.i); });
  $('#vthumbs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; vmode = b.dataset.v; open_(vi); });

  function printBlock(kind,id){const pr=MG.printOf(kind,id);if(!pr)return '';const z=pr.size?MG.L(pr.size):'',sh=Object.values(MG.shipping);
  return `${MG.printBtn(kind,id,'add')}<p class="pnote">${z?MG.esc(z)+MG.t('. ','. '):''}${sh.length?MG.t('Shipped to ','نشحنها إلى ')+sh.map(c=>MG.L(c.name)).join(MG.t(' and ',' و')):MG.t('Shipping opens soon.','الشحن قريبًا.')}</p>`}
  function open_(i) {
    vi = (i + shown.length) % shown.length; const p = shown[vi]; if (!p) return; unzoom();
    if (vimg.dataset.k !== p.id) { vimg.src = MG.img(p.id, p); vimg.dataset.k = p.id; } vimg.alt = `${p.title_en}, watercolour by Farah Al-Helou`;
    $('#v-h').textContent = MG.title(p); $('#vspec').innerHTML = spec(p.id); $('#vwhere').textContent = L(place(p)) + t(', watercolour on paper', '، ألوان مائية على ورق');
    const b = $('#vadd'), inb = MG.bag.has('painting', p.id), pr = MG.fmt(MG.price('painting', p.id));
    b.textContent = inb ? t('In your bag', 'في السلة') : (MG.isFree('painting', p.id) ? t('Free download', 'حمّلوها مجانًا') : t(`Add to bag (${pr})`, `أضيفوها إلى السلة (${pr})`)); b.setAttribute('aria-pressed', inb); $('.view .price').textContent = pr; $('#vprint').innerHTML = printBlock('painting', p.id);
    const sc = scenesOf(p.id); if (vmode !== 'art' && !sc.includes(vmode)) vmode = sc[0];
    $('#vthumbs').innerHTML = `<button type="button" data-v="art" aria-pressed="${vmode === 'art'}" aria-label="${t('The painting', 'اللوحة')}"><span class="th art"><img src="${esc(MG.thumb(p.id, p))}" alt=""></span></button>` +
      sc.map((k, j) => `<button type="button" data-v="${k}" aria-pressed="${vmode === k}" aria-label="${t('In a room ', 'في غرفة ') + (j + 1)}"><span class="th mk">${mock(p, 0, 'thumb', k)}</span></button>`).join('');
    big.dataset.mode = vmode === 'art' ? 'art' : 'wall'; let vm = big.querySelector('.mk'); if (!vm) { vm = document.createElement('div'); vm.className = 'mk'; big.append(vm); }
    vm.innerHTML = mock(p, 0, '', vmode === 'art' ? sc[0] : vmode); $('#vzoom').hidden = vmode !== 'art';
    /* the next painting is fetched while this one is looked at */
    const n = shown[(vi + 1) % shown.length]; new Image().src = MG.img(n.id, n);
    if (!view.open) { view.showModal(); MG.tear(); } history.replaceState(null, '', '#' + p.id);
  }
  /* zoom: click the painting (or the button) to see the brush strokes; move the pointer to look around */
  function unzoom() { zoomed = false; big.classList.remove('zoom'); vimg.style.transformOrigin = ''; $('#vzoom').setAttribute('aria-pressed', 'false'); }
  function zoomAt(x, y) { const r = vimg.getBoundingClientRect(); vimg.style.transformOrigin = `${Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100))}% ${Math.max(0, Math.min(100, ((y - r.top) / r.height) * 100))}%`; }
  function toggleZoom(e) { if (big.dataset.mode !== 'art') return; zoomed = !zoomed; big.classList.toggle('zoom', zoomed); $('#vzoom').setAttribute('aria-pressed', zoomed); if (zoomed && e && e.clientX) zoomAt(e.clientX, e.clientY); else if (!zoomed) vimg.style.transformOrigin = ''; }
  vimg.addEventListener('click', toggleZoom); $('#vzoom').addEventListener('click', () => toggleZoom());
  big.addEventListener('pointermove', (e) => { if (zoomed) zoomAt(e.clientX, e.clientY); });
  $('#vadd').addEventListener('click', () => { const p = shown[vi]; if (MG.isFree('painting', p.id) && !MG.bag.has('painting', p.id)) { MG.bag.add('painting', p.id); location.href = 'checkout.html'; return; } if (MG.bag.toggle('painting', p.id)) MG.toast(t('The painting is in your bag.', 'أُضيفت اللوحة إلى السلة.')); });
  $('#vnext').addEventListener('click', () => open_(vi + 1)); $('#vprev').addEventListener('click', () => open_(vi - 1));
  $('#vx').addEventListener('click', () => view.close()); view.addEventListener('close', () => history.replaceState(null, '', location.pathname));
  view.addEventListener('click', (e) => { if (e.target === view) view.close(); });
  addEventListener('keydown', (e) => { if (!view.open) return; if (e.key === 'ArrowRight') open_(vi + (MG.ar ? -1 : 1)); if (e.key === 'ArrowLeft') open_(vi - (MG.ar ? -1 : 1)); });

  let first = true;
  MG.page(function (why) { render(why); if (first) { first = false; const i = shown.findIndex((p) => p.id === location.hash.slice(1)); if (i >= 0) open_(i); } });
})();
