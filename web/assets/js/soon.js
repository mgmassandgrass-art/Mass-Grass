/* The coming-soon page: language toggle, torn edge, and the e-mail form (it only says thank you once the server has the address). */
(function () {
  'use strict';
  const d = document, root = d.documentElement, $ = (s) => d.querySelector(s);
  let AR = root.lang === 'ar'; const t = (en, ar) => (AR ? ar : en);
  function lang() {
    root.lang = AR ? 'ar' : 'en'; root.dir = AR ? 'rtl' : 'ltr'; root.classList.toggle('ar-on', AR);
    d.querySelectorAll('[data-ar]').forEach((e) => { if (e.dataset.en == null) e.dataset.en = e.innerHTML; e.innerHTML = AR ? e.dataset.ar : e.dataset.en; });
    $('#lang').textContent = AR ? 'EN' : 'ع'; $('#lang').setAttribute('aria-label', AR ? 'English' : 'العربية');
  }
  $('#lang').addEventListener('click', () => { AR = !AR; try { localStorage.mgLang = AR ? 'ar' : 'en'; } catch (e) {} lang(); });
  lang();
  /* the note's torn edge */
  const el = $('.soon-card'); let seed = 1097; const r = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  function tear() { const w = el.offsetWidth, h = el.offsetHeight, a = 6, st = 6, p = [], j = () => Math.max(0, a + (r() - .5) * 2 * a * .9), P = (x, y) => p.push(`${(x / w * 100).toFixed(2)}% ${(y / h * 100).toFixed(2)}%`);
    seed = 1097; for (let x = 0; x <= w; x += st) P(x, j()); for (let y = 0; y <= h; y += st) P(w - j(), y); for (let x = w; x >= 0; x -= st) P(x, h - j()); for (let y = h; y >= 0; y -= st) P(j(), y); el.style.clipPath = `polygon(${p.join(',')})`; }
  new ResizeObserver(tear).observe(el);
  $('#sf').addEventListener('submit', async (e) => {
    e.preventDefault(); const v = $('#se'), m = $('#sm');
    if (!(v.validity.valid && v.value)) { m.textContent = t('Please enter a valid email, like name@mail.com', 'اكتبوا بريدًا إلكترونيًا صحيحًا، مثل name@mail.com'); return; }
    m.textContent = t('Sending…', 'جارٍ الإرسال…');
    let ok = false; try { const res = await fetch('/api/subscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: v.value, source: 'soon' }) }); ok = res.ok; } catch (err) {}
    m.textContent = ok ? t('Thank you. We will write to you on opening day.', 'شكرًا لكم. سنكتب لكم يوم الافتتاح.') : t('That did not go through. Please try again later.', 'لم يصل الطلب. حاولوا مرة أخرى لاحقًا.'); if (ok) v.value = '';
  });
})();
