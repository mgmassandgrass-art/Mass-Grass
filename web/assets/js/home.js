/* Home: the pieces that circle the name, the calendar's views and pages, and a few pieces straight into the bag. */
(function () {
  'use strict';
  const { $, $$, esc, t, L } = MG;
  const PAGE = MG.PAGE;

  /* ---------- 1 · the wall: the chosen painting hangs in the frame of a real photograph ---------- */
  const HANG = ['hero', 'waves', 'dovegirl', 'blueflowers', 'boattop', 'pcartgirl', 'pflower', 'house'].map((id) => MG.product('painting', id)).filter(Boolean);
  const hang = $('#hang'), picks = $('#picks'), now = $('#now'), M = MG.mock.ROOM['wall-l'];
  let hi = 0, ht = 0;
  function hangIt(i, user) {
    hi = (i + HANG.length) % HANG.length; const p = HANG[hi];
    const im = document.createElement('img'); im.className = 'art'; im.alt = ''; im.src = MG.img(p.id, p); im.style.cssText = MG.mock.artBox(p.id, M);
    const go = () => { hang.append(im); requestAnimationFrame(() => requestAnimationFrame(() => im.classList.add('on')));
      [...hang.children].slice(0, -1).forEach((o) => { o.classList.remove('on'); setTimeout(() => { if (o.parentNode) o.parentNode.removeChild(o); }, 900); }); };
    im.decode ? im.decode().then(go, go) : go();
    $$('button', picks).forEach((b, k) => b.setAttribute('aria-pressed', k === hi)); label();
    clearInterval(ht); if (!user && !MG.still) ht = setInterval(() => hangIt(hi + 1), 4800);
  }
  function label() { const p = HANG[hi]; if (!p) return;
    now.innerHTML = `<div><span class="hand nm">${esc(MG.title(p))}</span><span class="pr">${MG.fmt(MG.price('painting', p.id))}</span></div><div class="acts">${MG.addBtn('painting', p.id)}${MG.shareBtn('painting', p.id)}<a class="add see" href="paintings.html#${esc(p.id)}" data-peek="painting:${esc(p.id)}">${t('See it closer', 'شاهدوها عن قرب')}</a></div>`; }
  if (picks) picks.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) hangIt(+b.dataset.i, true); });

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
    if (picks && HANG.length) { if (why === 'init' || why === 'lang') picks.innerHTML = HANG.map((p, i) => `<li><button type="button" data-i="${i}" aria-pressed="${i === hi}" aria-label="${esc(MG.title(p))}"><img src="${esc(MG.thumb(p.id, p))}" alt=""></button></li>`).join('');
      if (why === 'init') hangIt(0); else label(); }
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
