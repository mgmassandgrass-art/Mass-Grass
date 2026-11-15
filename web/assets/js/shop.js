/* The shop: the whole catalog on one page, filtered by category (the category lives in the address: shop.html#sticker). */
(function () {
  'use strict';
  const { $, t } = MG;
  const CATS = [['all', 'Everything', 'الكل'], ['painting', 'Paintings', 'اللوحات'], ['postcard', 'Postcards', 'البطاقات البريدية'], ['sticker', 'Stickers', 'الملصقات'], ['calendar', 'Calendars', 'التقاويم']];
  const cals = MG.calendars.map((c) => ({ kind: 'calendar', id: c.id, title_en: c.title[0], title_ar: c.title[1] }));
  const items = () => [...MG.products('painting'), ...MG.products('postcard'), ...MG.products('sticker'), ...cals];
  let cat = location.hash.slice(1); if (!CATS.some((c) => c[0] === cat)) cat = 'all';
  MG.page(function () {
    const all = items();
    $('#cats').innerHTML = CATS.map((c) => `<button type="button" data-c="${c[0]}" aria-pressed="${c[0] === cat}">${t(c[1], c[2])}<sup>${c[0] === 'all' ? all.length : all.filter((x) => x.kind === c[0]).length}</sup></button>`).join('');
    $('#shgrid').innerHTML = all.filter((x) => cat === 'all' || x.kind === cat).map(MG.tile).join('');
  });
  $('#cats').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; cat = b.dataset.c; history.replaceState(null, '', cat === 'all' ? location.pathname : '#' + cat); MG.rerender('view'); });
  addEventListener('hashchange', () => { const h = location.hash.slice(1); if (CATS.some((c) => c[0] === h)) { cat = h; MG.rerender('view'); } });
})();
