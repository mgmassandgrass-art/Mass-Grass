/* Track your order: the order number and the e-mail it was made with; then where it stands, step by step, and for a printed
   copy the parcel's tracking number with a link to follow it with the carrier. */
(function () {
  'use strict';
  const { $, esc, t } = MG;
  const Q = new URLSearchParams(location.search);
  const f = $('#tf'), res = $('#tres'), msg = $('#tmsg');
  let last = null;
  if (Q.get('order')) $('#tid').value = Q.get('order');
  const u = MG.user.get(); if (u && u.email) $('#tem').value = u.email;
  const date = (d) => new Date(d).toLocaleDateString(MG.ar ? 'ar-u-nu-latn' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  function show(o) {
    last = o;
    const paid = o.status === 'paid', st = o.ship_status;
    /* the steps: ordered, paid, then (printed copies) printed, sent, delivered */
    const steps = [[t('Ordered', 'طُلب'), true], [t('Paid', 'دُفع'), paid]]
      .concat(o.printed ? [[t('Being printed', 'قيد الطباعة'), paid], [t('On its way', 'في الطريق'), st === 'sent' || st === 'delivered'], [t('Delivered', 'وصل'), st === 'delivered']] : [[t('Files ready', 'الملفات جاهزة'), paid]]);
    const now = steps.filter((s) => s[1]).length - 1;
    res.innerHTML = `<article class="tr-card">
      <div class="tr-hd"><b>${esc(o.id)}</b><span>${date(o.date)}</span></div>
      <ol class="tr-steps">${steps.map((s, i) => `<li class="${s[1] ? 'done' : ''}${i === now ? ' now' : ''}"><span></span>${esc(s[0])}</li>`).join('')}</ol>
      <ul class="tr-its">${o.items.map((i) => `<li>${esc(MG.ar ? i.ta || i.t : i.t)}<small>${i.fmt === 'print' ? t('Printed and shipped', 'مطبوع ومشحون') + (i.q > 1 ? ' ×' + i.q : '') : t('Digital PDF', 'رقمي PDF')}</small></li>`).join('')}</ul>
      ${o.status === 'cancelled' || o.status === 'refunded' ? `<p class="fmsg">${t('This order was cancelled.', 'أُلغي هذا الطلب.')}</p>` : ''}
      ${o.printed ? (o.tracking ? `<div class="tr-num"><span>${t('Tracking number', 'رقم التتبّع')}</span><b dir="ltr">${esc(o.tracking)}</b>
        <a class="ink" href="https://t.17track.net/en#nums=${encodeURIComponent(o.tracking)}" target="_blank" rel="noopener noreferrer">${t('Follow the parcel', 'تتبّعوا الطرد')}</a></div>`
        : paid ? `<p class="tr-note">${t('The tracking number shows here, and reaches your e-mail, the day the parcel is sent.', 'يظهر رقم التتبّع هنا ويصل إلى بريدكم يوم يُرسل الطرد.')}</p>` : '') : ''}
      ${!o.printed && paid ? `<p class="tr-note">${t('Your files are in the e-mail we sent, and in your account if you have one.', 'ملفاتكم في الرسالة التي أرسلناها، وفي حسابكم إن كان لديكم حساب.')}</p>` : ''}
    </article>`;
  }
  f.addEventListener('submit', async (e) => {
    e.preventDefault(); msg.textContent = '';
    const id = $('#tid').value.trim(), email = $('#tem').value.trim();
    if (!id || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { msg.textContent = t('Write the order number and the e-mail you ordered with.', 'اكتبوا رقم الطلب والبريد الذي طلبتم به.'); return; }
    const r = await MG.api('POST', '/api/track', { id, email });
    if (r.ok) show(r.data.order);
    else { res.innerHTML = ''; msg.textContent = r.status === 429 ? t('Too many tries. Please wait a little.', 'محاولات كثيرة. انتظروا قليلًا.') : t('We found no order with that number and e-mail.', 'لم نجد طلبًا بهذا الرقم وهذا البريد.'); }
  });
  MG.page((why) => { if (why === 'lang' && last) show(last); });
  if (Q.get('order') && $('#tem').value) f.requestSubmit();
})();
