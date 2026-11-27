/* The order page of a calendar (owner, 27 Nov 2026: "like the big shops"): ?cal=<id>&fmt=pdf|print.
   The calendar in its photographs; the format (the PDF, or printed and shipped); the quantity and the shipping where the
   visitor is (printed only); the total; Buy now (to checkout) or Add to bag; what arrives and how; why paying is safe. */
(function () {
  'use strict';
  const { $, $$, esc, t, L } = MG, Q = new URLSearchParams(location.search);
  const C = MG.calOf(Q.get('cal') || ''), G = C.gallery || [C.cover];
  let fmt = Q.get('fmt') === 'print' && MG.printOf('calendar', C.id) ? 'print' : 'pdf', qty = 1, pic = 0, cc = MG.visitor || '';
  const sz = () => (C.size ? L(C.size).split(/[,،]/)[0] : 'A5');
  const specOf = (k) => { const r = (C.spec || []).find((x) => x[0][0] === k); return r ? L(r[1]) : ''; };
  const ship = () => { const z = MG.shipZone(cc); return z ? { fee: z.fee || 0, days: z.days || '' } : null; };

  /* what arrives, said plainly, for the format chosen */
  function receive() {
    const pages = specOf('Pages'), weeks = specOf('Weeks'), li = (s) => `<li>${esc(s)}</li>`;
    if (fmt === 'pdf') return [
      t(`A PDF of ${pages ? pages.toLowerCase() : 'the cover and twelve months'}, ${sz()}`, `ملف PDF فيه ${pages || 'الغلاف واثنا عشر شهرًا'}، بمقاس ${sz()}`),
      t('High resolution, ready to print at home or at any print shop', 'بدقة عالية، جاهز للطباعة في البيت أو عند أي مطبعة'),
      t('The download link by e-mail and on your order page, as soon as you pay', 'رابط التحميل بالبريد الإلكتروني وفي صفحة الطلب، فور الدفع'),
      t('The link stays on your order page, to download it again whenever you need', 'يبقى الرابط في صفحة الطلب، لتحمّلوه من جديد متى احتجتم')].map(li).join('');
    const s = ship();
    return [
      t(`The calendar printed in colour, ${sz()}`, `التقويم مطبوعًا بالألوان، بمقاس ${sz()}`),
      pages ? t(`${pages}${weeks ? '; weeks ' + weeks.charAt(0).toLowerCase() + weeks.slice(1) : ''}`, `${pages}${weeks ? '، والأسبوع ' + weeks : ''}`) : '',
      t('Posted from the UAE with a tracking number, which we e-mail you when it leaves', 'يُرسل بالبريد من الإمارات مع رقم للتتبّع، نرسله إليكم بالبريد الإلكتروني عند خروجه'),
      s && s.days ? t(`Delivery in ${s.days}`, `يصل خلال ${s.days}`) : ''].filter(Boolean).map(li).join('');
  }
  function totals() {
    const pr = MG.printOf('calendar', C.id), s = ship();
    if (fmt === 'pdf') return { all: MG.price('calendar'), fee: 0 };
    const sub = pr.price * qty; return { all: sub + (s ? s.fee : 0), fee: s ? s.fee : null };
  }
  function draw() {
    const pr = MG.printOf('calendar', C.id), tt = totals(), s = ship(), name = L(C.short || C.title);
    const opt = (v, n, line, price) => `<label class="by-o${fmt === v ? ' on' : ''}"><input type="radio" name="byf" value="${v}"${fmt === v ? ' checked' : ''}><span class="by-on"><b>${n}</b><i>${line}</i></span><em>${price}</em></label>`;
    const fee = !cc ? '' : s ? (s.fee ? MG.fmt(s.fee) : t('Free', 'مجانًا')) + (s.days ? `<small>${esc(s.days)}</small>` : '') : `<small>${t('We will write to you about shipping there', 'سنراسلكم بشأن الشحن إلى هناك')}</small>`;
    $('#buy').innerHTML = `<div class="by-grid">
      <div class="by-gal"><div class="by-main"><img id="bymain" src="${esc(G[pic])}" alt="${esc(name)}"></div>
        <ul class="by-th">${G.map((g, i) => `<li><button type="button" data-pic="${i}" aria-pressed="${i === pic}" aria-label="${t('Picture', 'صورة')} ${i + 1}"><img src="${esc(g)}" alt="" loading="lazy"></button></li>`).join('')}</ul></div>
      <div class="by-pan">
        <p class="by-k">${t('Calendar 2027', 'تقويم 2027')}</p>
        <p class="hand by-n">${esc(name)}</p>
        <a class="by-ab" href="${esc(C.page)}">${t('About this calendar', 'عن هذا التقويم')}</a>
        <fieldset class="by-fmt"><legend>${t('Format', 'الشكل')}</legend>
          ${opt('pdf', t('Digital PDF', 'ملف PDF رقمي'), t('Download right after payment', 'تحمّلونه فور الدفع'), MG.fmt(MG.price('calendar')))}
          ${pr ? opt('print', t('Printed and shipped', 'مطبوع ومشحون'), t('Posted from the UAE, tracked', 'بالبريد من الإمارات، مع التتبّع'), MG.fmt(pr.price)) : ''}
        </fieldset>
        ${fmt === 'print' ? `<div class="by-row"><span class="by-l">${t('Quantity', 'الكمية')}</span><span class="qty"><button type="button" data-d="-1" aria-label="${t('One less', 'نسخة أقل')}"${qty <= 1 ? ' disabled' : ''}>−</button><b aria-live="polite">${qty}</b><button type="button" data-d="1" aria-label="${t('One more', 'نسخة أخرى')}"${qty >= 10 ? ' disabled' : ''}>+</button></span></div>
        <div class="by-row by-ship"><label class="by-l" for="bycc">${t('Shipping to', 'الشحن إلى')}</label><select id="bycc"><option value="">${t('Choose a country', 'اختاروا الدولة')}</option>${MG.countries().map(([c, n]) => `<option value="${c}"${c === cc ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select><span class="by-fee">${fee}</span></div>` : ''}
        <div class="by-row by-tot"><span class="by-l">${t('Total', 'المجموع')}</span><b>${MG.fmt(tt.all)}</b></div>
        ${fmt === 'print' && tt.fee == null ? `<p class="by-note">${t('Shipping is added at checkout, from your address.', 'تُضاف كلفة الشحن عند إتمام الشراء، حسب عنوانكم.')}</p>` : ''}
        <div class="by-btns"><button type="button" class="ink" id="bynow">${t('Buy now', 'اشتروا الآن')}</button><button type="button" class="ghost" id="byadd">${t('Add to bag', 'أضيفوه إلى السلة')}</button></div>
        <div class="by-get"><p class="hand by-gh">${t('What you receive', 'ما يصلكم')}</p><ul>${receive()}</ul></div>
        <ul class="by-trust">
          <li><b>${t('Safe payment', 'دفع آمن')}</b><span>${t('Through PayPal, by card or a PayPal account. Your card details go to PayPal only, never to us.', 'عبر PayPal، بالبطاقة أو بحساب PayPal. تذهب بيانات بطاقتكم إلى PayPal وحده، ولا تصلنا أبدًا.')}</span><span class="by-pay"><img src="assets/pay/paypal.svg" alt="PayPal" width="40" height="25"><img src="assets/pay/visa.svg" alt="Visa" width="40" height="25"><img src="assets/pay/mastercard.svg" alt="Mastercard" width="40" height="25"></span></li>
          <li><b>${t('Follow your order', 'تابعوا طلبكم')}</b><span>${t('Every order has its own page, and every parcel a tracking number. ', 'لكل طلب صفحته، ولكل طرد رقم للتتبّع. ')}<a href="track.html">${t('Track your order', 'تتبّعوا طلبكم')}</a></span></li>
          <li><b>${t('Questions', 'أسئلة')}</b><span>${t('Before or after you buy, write to us: ', 'قبل الشراء أو بعده، راسلونا: ')}<a href="mailto:info@massandgrass.com" dir="ltr">info@massandgrass.com</a></span></li>
          <li><b>${t('From Gaza', 'من غزة')}</b><span>${t('Painted by Farah Al-Helou. Every order supports her work.', 'بريشة فرح الحلو. كل طلب يدعم عملها.')}</span></li>
        </ul>
      </div></div>`;
  }
  function put(go) {
    const B = MG.bag;
    if (fmt === 'pdf') { if (!B.has('calendar', C.id)) B.add('calendar', C.id); }
    else {
      if (!B.has('calendar', C.id, 'print')) B.add('calendar', C.id, { fmt: 'print' });
      const i = B.get().findIndex((x) => x.kind === 'calendar' && x.k === C.id && x.fmt === 'print'); if (i >= 0) B.qty(i, qty);
    }
    if (go) location.href = 'checkout.html';   /* the Worker sends /checkout.html on to /checkout */
    else MG.toast(t('In your bag', 'في السلة'));
  }
  document.addEventListener('change', (e) => {
    if (e.target.name === 'byf') { fmt = e.target.value; draw(); }
    else if (e.target.id === 'bycc') { cc = e.target.value; draw(); }
  });
  document.addEventListener('click', (e) => {
    const p = e.target.closest('[data-pic]');
    if (p) { pic = +p.dataset.pic; $('#bymain').src = G[pic]; $$('[data-pic]').forEach((b) => b.setAttribute('aria-pressed', String(b === p))); return; }
    const d = e.target.closest('.by-row [data-d]');
    if (d) { qty = Math.max(1, Math.min(10, qty + +d.dataset.d)); draw(); return; }
    if (e.target.closest('#bynow')) put(true); else if (e.target.closest('#byadd')) put(false);
  });
  MG.page(function (why) {
    if (why === 'bag' || why === 'user') return;
    draw(); $('#cspec').innerHTML = MG.calSpec(C.id);
    document.title = `${L(C.short || C.title)} · Mass & Grass`;
  });
})();
