/* Request a design: the form goes to /api/commission as multipart (the picture is checked again on the server by its bytes).
   A picture over the limit is redrawn smaller in the browser first. The thank-you shows only once the server has it. */
(function () {
  'use strict';
  const { $, t } = MG;
  const LIMIT = 1950000, f = $('#cmf'), msg = $('#cm-msg'), file = $('#cm-ref'), thumb = $('#cm-thumb'), rm = $('#cm-x');
  let pic = null, sent = false;
  const say = (m, ok) => { msg.textContent = m; msg.classList.toggle('ok', !!ok); };
  /* the date can't be in the past */
  try { $('#cm-date').min = new Date().toISOString().slice(0, 10); } catch (e) {}
  /* a signed-in visitor's name and e-mail are filled in */
  MG.page((why) => { const u = MG.user.get(); if (u && (why === 'init' || why === 'user')) { if (!$('#cm-name').value) $('#cm-name').value = u.name || ''; if (!$('#cm-email').value) $('#cm-email').value = u.email || ''; if (!$('#cm-phone').value && u.phone) $('#cm-phone').value = u.phone; } if (sent && why === 'lang') thanks(); });

  async function shrink(fl) {
    const bmp = await createImageBitmap(fl);
    for (const max of [2400, 1800, 1400, 1000]) {
      const s = Math.min(1, max / Math.max(bmp.width, bmp.height)), c = document.createElement('canvas');
      c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s); c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      for (const q of [0.88, 0.78, 0.66]) { const b = await new Promise((r) => c.toBlob(r, 'image/jpeg', q)); if (b && b.size <= LIMIT) return new File([b], (fl.name || 'reference').replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }); }
    }
    throw new Error('too_big');
  }
  file.addEventListener('change', async () => {
    const fl = file.files[0]; pic = null; thumb.hidden = true; rm.hidden = true; say('');
    if (!fl) return;
    if (!/^image\/(png|jpeg|webp)$/.test(fl.type)) { file.value = ''; return say(t('Please choose a PNG, JPEG or WebP picture.', 'اختاروا صورة PNG أو JPEG أو WebP.')); }
    try { pic = fl.size > LIMIT ? await shrink(fl) : fl; } catch (e) { file.value = ''; return say(t('That picture is too big. Please choose a smaller one.', 'الصورة كبيرة جدًا. اختاروا صورة أصغر.')); }
    thumb.src = URL.createObjectURL(pic); thumb.hidden = false; rm.hidden = false;
  });
  rm.addEventListener('click', () => { file.value = ''; pic = null; thumb.hidden = true; rm.hidden = true; file.focus(); });

  function thanks() {
    f.innerHTML = `<h2>${t('Thank you', 'شكرًا لكم')}</h2><p class="fmsg ok" role="status">${t('Your request reached Farah. We reply by e-mail within three days.', 'وصل طلبكم إلى فرح، ونرد عليكم بالبريد خلال ثلاثة أيام.')}</p><a class="go" href="designs.html">${t('Back to more designs', 'عودوا إلى التصاميم')}</a>`;
  }
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = (id) => $(id).value.trim(), email = v('#cm-email'), body = v('#cm-body'), name = v('#cm-name'), phone = v('#cm-phone');
    if (body.length < 10) { say(t('Please tell us a little more.', 'أخبرونا بالمزيد قليلًا.')); return $('#cm-body').focus(); }
    if (!name) { say(t('Please write your name.', 'اكتبوا اسمكم.')); return $('#cm-name').focus(); }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { say(t('We need your e-mail to reply.', 'نحتاج إلى بريدكم لنرد عليكم.')); return $('#cm-email').focus(); }
    if (phone && !/^[+\d][\d\s()-]{5,}$/.test(phone)) { say(t('That phone number does not look right.', 'رقم الهاتف غير صحيح.')); return $('#cm-phone').focus(); }
    const fd = new FormData();
    fd.append('what', (f.querySelector('[name=what]:checked') || {}).value || 'other');
    [['size', '#cm-size'], ['body', '#cm-body'], ['budget', '#cm-budget'], ['deadline', '#cm-date'], ['name', '#cm-name'], ['email', '#cm-email'], ['phone', '#cm-phone']].forEach(([k, id]) => fd.append(k, v(id)));
    fd.append('lang', MG.ar ? 'ar' : 'en');
    if (pic) fd.append('ref', pic, pic.name || 'reference');
    const b = f.querySelector('[type=submit]'); b.disabled = true; say(t('Sending…', 'جارٍ الإرسال…'), true);
    let r; try { r = await fetch('/api/commission', { method: 'POST', body: fd, credentials: 'same-origin' }); } catch (er) { r = null; }
    b.disabled = false;
    let j = {}; try { j = r ? await r.json() : {}; } catch (er) {}
    if (r && r.ok) { sent = true; thanks(); f.scrollIntoView({ block: 'start' }); return; }
    const E = { rate_limited: t('Too many requests. Please try again later.', 'طلبات كثيرة. حاولوا لاحقًا.'), bad_type: t('The picture could not be read. Please choose another.', 'تعذّرت قراءة الصورة. اختاروا صورة أخرى.'), too_big: t('That picture is too big.', 'الصورة كبيرة جدًا.') };
    say(E[j.error] || t('It did not go through. Write to info@massandgrass.com.', 'لم يصل الطلب. راسلونا على info@massandgrass.com.'));
  });
})();
