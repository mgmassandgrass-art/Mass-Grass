/* The calendars page: every calendar on sale (MG.calendars, each with a `mock`), so a new year added to the catalog appears here by itself.
   1 · the calendars side by side on one white floor, turning their months together;
   2 · choose one: its photograph, name, line, buy (PDF or printed) and a link to its own page. */
(function () {
  'use strict';
  const { $, $$, esc, t, L } = MG, CS = MG.calendars.filter((c) => c.mock), M = MG.calendar;
  const pad = (n) => String(n).padStart(2, '0');
  const pageOf = (c, m) => c.mock.page.replace('{m}', pad(m));

  /* one calendar in its photograph; on the stage its twelve month pages are stacked and the chosen one shown */
  const fig = (c, big) => {
    const k = c.mock, pos = k.pg ? `left:${k.pg[0]}%;top:${k.pg[1]}%;width:${k.pg[2]}%;height:${k.pg[3]}%` : 'inset:0';
    const pages = big ? Array.from({ length: 12 }, (_, i) => `<img src="${pageOf(c, i + 1)}" alt="" ${i ? 'loading="lazy" ' : ''}decoding="async" draggable="false">`).join('') : '';
    return `<span class="ca-im${k.whole ? ' whole' : ''}${k.edge ? ' edge' : ''}" style="--ar:${k.w}/${k.h};--s:${k.s || 1};--foot:${k.foot || 1}"><img class="ca-base" src="${k.base}" alt="" width="${k.w}" height="${k.h}" draggable="false"><span class="ca-pg" style="${pos}">${pages}</span></span>`;
  };

  let cur = 0, timer = 0;
  function render() {
    $('#castage').innerHTML = CS.map((c) => `<a class="ca-one" href="${c.page}" aria-label="${esc(L(c.title))}">${fig(c, true)}<span class="ca-n"><b class="hand">${esc(L(c.short || c.title))}</b><i>${c.year || 2027}</i></span></a>`).join('');
    $('#cpgrid').innerHTML = CS.map((c) => `<li class="cp-card">
      <a class="cp-ph" href="${c.page}" tabindex="-1" aria-hidden="true">${fig(c, false)}</a>
      <div class="cp-tx">
        <h3 class="hand"><a href="${c.page}">${esc(L(c.short || c.title))}</a></h3>
        <p class="cp-y">${c.year || 2027}</p>
        ${c.line ? `<p class="cp-l">${esc(L(c.line))}</p>` : ''}
        <div class="cp-buy"><button class="ink" type="button" data-add="calendar" data-cal="${esc(c.id)}">${t('Digital PDF', 'رقمي PDF')}, ${MG.fmt(MG.price('calendar'))}</button>${MG.printBtn ? MG.printBtn('calendar', c.id, 'ghost') : ''}</div>
        <a class="go" href="${c.page}">${t('See every month', 'تصفّحوا الأشهر')}</a>
      </div></li>`).join('');
    show(cur);
  }

  /* the months turn together; the month's name sits under the calendars */
  function show(i) {
    cur = (i + 12) % 12;
    $$('.ca-stage .ca-pg').forEach((pg) => [...pg.children].forEach((im, j) => im.classList.toggle('on', j === cur)));
    $('#camon').textContent = (MG.ar ? M.monthsAr[cur] : M.months[cur]) + ' 2027';
  }
  function loop() { clearInterval(timer); if (!MG.still) timer = setInterval(() => { if (!document.hidden) show(cur + 1); }, 3200); }

  MG.page(function (why) { render(); if (why !== 'bag' && why !== 'user') loop(); });
})();
