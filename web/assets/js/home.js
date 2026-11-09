/* Home: the paintings carousel, the calendar's finished pages, and a few pieces straight into the bag. */
(function () {
  'use strict';
  const { $, esc, t, L } = MG;
  const W = ['watercolour', 'ألوان مائية'];
  const S = [['hero', 'Al-Mawasi', 'المواصي', '50%', '62%'], ['boattop', 'Gaza port', 'ميناء غزة'], ['waves', 'Gaza beach', 'بحر غزة', '50%', '60%'], ['pcartgirl', 'Deir al-Balah', 'دير البلح'],
    ['blueflowers', 'Beit Lahia', 'بيت لاهيا', '50%', '35%'], ['bikeride', 'Al-Shati', 'الشاطئ'], ['dovegirl', 'Deir al-Balah', 'دير البلح', '50%', '30%'], ['pflower', 'Khan Younis', 'خان يونس']];
  const slides = S.map((s) => { const p = MG.product('painting', s[0]) || { title_en: s[0], title_ar: s[0] };
    return { src: MG.img(s[0], p), name: [p.title_en, p.title_ar || p.title_en], place: [`${s[1]}, ${W[0]}`, `${s[2]}، ${W[1]}`], alt: [`${p.title_en}, watercolour by Farah Al-Helou`, `${p.title_ar}، لوحة مائية لفرح الحلو`], fx: s[3], fy: s[4] }; });
  const show = MG.show($('#show'), slides);

  /* a few pieces from each shelf */
  const pick = (kind, ids) => ids.map((id) => MG.product(kind, id)).filter(Boolean);
  const J = [...pick('painting', ['psea', 'dovegirl', 'sparklers']), ...pick('sticker', ['s-kaak']), ...pick('painting', ['pcartgirl']), ...pick('postcard', ['pmoonsleep']), ...pick('sticker', ['s-jaffa']), ...pick('painting', ['snowglobe'])];
  const KN = { painting: ['Painting', 'لوحة'], postcard: ['Postcard', 'بطاقة بريدية'], sticker: ['Sticker', 'ملصق'] };
  const PAGE = { painting: 'paintings.html', postcard: 'postcards.html', sticker: 'stickers.html' };

  MG.page(function (why) {
    show.caption();
    $('#hpages').innerHTML = MG.calendar.pages.map((p) => `<li><a href="calendar.html#${p.k}"><span class="pg"><img src="assets/${p.k}.webp" alt="" loading="lazy" width="910" height="641"></span><b>${esc(L(p.n))}</b></a></li>`).join('');
    $('#grid').innerHTML = J.map((p) => `<li class="it"><span class="tag paper" data-tear="3"><span class="fill"></span>${MG.fmt(MG.price(p.kind, p.id))}</span>
      <a href="${PAGE[p.kind]}#${esc(p.id)}"><div class="bed paper${p.kind === 'sticker' ? ' stk' : ''}" data-tear="6"><span class="fill"></span><div class="pc"${p.kind === 'sticker' ? '' : ' data-tear="4"'}><img src="${esc(MG.thumb(p.id, p))}" alt="${esc(p.title_en)}, by Farah Al-Helou" loading="lazy"></div></div></a>
      <h3>${esc(MG.title(p))}</h3><span class="kind">${L(KN[p.kind])}</span>${MG.addBtn(p.kind, p.id)}</li>`).join('');
    document.querySelectorAll('[data-alt-ar]').forEach((e) => { if (e.dataset.altEn == null) e.dataset.altEn = e.alt; e.alt = MG.ar ? e.dataset.altAr : e.dataset.altEn; });
  });
})();
