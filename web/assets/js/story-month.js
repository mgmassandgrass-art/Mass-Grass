/* The story behind one page of the Places in Gaza calendar: reached only by the QR code printed on that page
   (/g/00 cover, /g/01 .. /g/12 months; the Worker serves this page for them). Statically it also reads ?m=07.
   The text is assets/gaza/stories.json: [{m, title:[en,ar], text:[en,ar], date, photos}]. */
(function () {
  'use strict';
  const { $, esc, t, L } = MG, M = MG.calendar;
  const pm = location.pathname.match(/\/g\/(\d{1,2})\/?$/), qm = new URLSearchParams(location.search).get('m');
  const num = parseInt(pm ? pm[1] : qm, 10);
  const pad = (n) => String(n).padStart(2, '0');
  let story = null, state = 'wait';
  fetch('assets/gaza/stories.json').then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
    .then((all) => { story = all.find((s) => s.m === num) || null; state = story ? 'ok' : 'none'; MG.rerender('data'); })
    .catch(() => { state = 'none'; MG.rerender('data'); });
  const when = (d) => {
    if (!d) return '';
    const p = d.split('-').map(Number), dt = new Date(Date.UTC(p[0], p[1] - 1, p[2] || 1)), loc = MG.ar ? 'ar-u-nu-latn' : 'en-GB';
    return new Intl.DateTimeFormat(loc, Object.assign({ month: 'long', year: 'numeric', timeZone: 'UTC' }, p[2] ? { day: 'numeric' } : {})).format(dt);
  };
  MG.page(function () {
    if (state === 'wait') return;
    const ok = state === 'ok';
    const mon = !ok ? '' : num ? (MG.ar ? M.monthsAr[num - 1] : M.months[num - 1]) + ' 2027' : t('The cover', 'الغلاف');
    $('#smm').textContent = mon;
    $('#sm-h').textContent = ok ? L(story.title) : t('This page is not part of the calendar', 'هذه الصفحة ليست من التقويم');
    $('#smd').textContent = ok && story.date ? when(story.date) : '';
    $('#smtx').innerHTML = ok ? L(story.text).split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('') : '';
    $('#smph').innerHTML = ok ? story.photos.map((s) => `<li><img src="${esc(s)}" alt="${esc(L(story.title))}" loading="lazy" decoding="async"></li>`).join('') : '';
    const f = $('#smpgf'); f.hidden = !ok;
    if (ok) { $('#smpg').src = `assets/gz-${pad(num)}.webp`; $('#smpg').alt = `${mon}, ${L(story.title)}`; $('#smcap').textContent = t('The page in the calendar', 'الصفحة في التقويم'); }
    document.title = (ok ? L(story.title) : t('A place in Gaza', 'مكان من غزة')) + ' · Mass & Grass';
  });
})();
