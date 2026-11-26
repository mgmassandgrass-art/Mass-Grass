/* Mass & Grass · the shop's ledger (admin). One file, no dependencies.
   Every figure comes from the server; nothing is made up on this page. Arabic first, English on the toggle. */
(function () {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s), $$ = (s, el) => [...(el || document).querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let AR = true; try { AR = localStorage.mgAdminLang !== 'en'; } catch (e) {}
  const t = (ar, en) => (AR ? ar : en);
  const eur = (n) => '€' + (Math.round(n * 100) % 100 ? Number(n).toFixed(2) : String(Math.round(n)));
  const price = (n) => (Number(n) === 0 ? t('مجاني', 'Free') : eur(n));
  const num = (n) => Number(n || 0).toLocaleString('en-US');
  const day = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString(AR ? 'ar-u-nu-latn' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); };
  const when = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleString(AR ? 'ar-u-nu-latn' : 'en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); };
  const size = (b) => (b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');
  const view = $('#view'), dlg = $('#dlg');

  /* ---------- the server ---------- */
  async function api(method, path, body, raw) {
    const opt = { method, credentials: 'same-origin', headers: {} };
    if (raw) { opt.body = raw.body; opt.headers['content-type'] = raw.type; }
    else if (body) { opt.body = JSON.stringify(body); opt.headers['content-type'] = 'application/json'; }
    let r; try { r = await fetch(path, opt); } catch (e) { return { ok: false, status: 0, data: { error: 'offline' } }; }
    if (r.status === 404 && path.startsWith('/api/admin/') && method === 'GET') { location.href = '../account.html?next=admin/'; return { ok: false, status: 404, data: {} }; }
    let data = {}; try { data = await r.json(); } catch (e) {}
    return { ok: r.ok, status: r.status, data };
  }
  const ERR = { last_item: ['لا يمكن إخفاء آخر قطعة ظاهرة في قسمها.', 'A shelf must keep one visible piece.'], exists: ['هذا المعرّف مستخدم.', 'That id is taken.'], title_required: ['الاسم بالإنجليزية مطلوب.', 'The English title is needed.'], too_big: ['الملف أكبر من الحد المسموح.', 'The file is too big.'], bad_type: ['نوع الملف غير مقبول.', 'That file type is not accepted.'],
    in_use: ['الصورة مستخدمة في منتج.', 'The image is used by a product.'], changed_meanwhile: ['تغيّر النص في مكان آخر. أعيدوا فتح الصفحة.', 'The text changed elsewhere. Open the page again.'], bad_text: ['النص لا يقبل وسوم HTML.', 'Texts cannot hold HTML tags.'], system_page: ['هذه الصفحة أساسية ولا تُخفى.', 'This page cannot be hidden.'],
    totp_invalid: ['الرمز غير صحيح.', 'That code is not right.'], code_invalid: ['الرمز غير صحيح أو انتهت صلاحيته.', 'That code is wrong or has expired.'], mail_failed: ['لم يُرسل البريد. حاولوا بعد قليل.', 'The e-mail did not go out. Try again shortly.'], already_on: ['التحقق بخطوتين مفعّل أصلًا.', 'Two-step sign-in is already on.'], bad_credentials: ['كلمة السر أو الرمز غير صحيح.', 'The password or the code is wrong.'], password_short: ['كلمة السر 10 أحرف على الأقل.', 'The password needs 10 characters or more.'], rate_limited: ['محاولات كثيرة. انتظروا قليلًا.', 'Too many tries. Wait a little.'], offline: ['لا اتصال بالخادم.', 'The server did not answer.'] };
  const why = (r) => { const e = ERR[r.data && r.data.error]; return e ? t(...e) : t('لم يتم الحفظ.', 'That did not save.') + (r.data && r.data.error ? ' (' + r.data.error + ')' : ''); };
  function toast(msg, bad) { const el = $('#toast'); el.textContent = msg; el.className = 'toast on' + (bad ? ' bad' : ''); clearTimeout(el._t); el._t = setTimeout(() => (el.className = 'toast'), 2600); }
  const done = (r, msg) => { if (r.ok) toast(msg || t('تم الحفظ.', 'Saved.')); else toast(why(r), true); return r.ok; };

  /* ---------- the sheet (one dialog) ---------- */
  function sheet(title, body, foot) {
    dlg.innerHTML = `<div class="sh-hd"><h2>${esc(title)}</h2><button type="button" class="x" data-x aria-label="${t('إغلاق', 'Close')}">✕</button></div><div class="sh-bd">${body}</div>${foot ? `<div class="sh-ft">${foot}</div>` : ''}`;
    dlg.dir = AR ? 'rtl' : 'ltr'; if (!dlg.open) dlg.showModal(); return dlg;
  }
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-x]')) dlg.close(); });
  const sure = (q) => window.confirm(q);

  /* ---------- small pieces ---------- */
  const STATUS = { paid: ['مدفوع', 'Paid'], pending: ['بانتظار الدفع', 'Awaiting payment'], cancelled: ['ملغى', 'Cancelled'], refunded: ['مُستردّ', 'Refunded'] };
  const stamp = (s) => `<span class="stamp ${s}">${t(...(STATUS[s] || [s, s]))}</span>`;
  const KIND = { painting: ['لوحة', 'Painting'], postcard: ['بطاقة بريدية', 'Postcard'], sticker: ['ملصق', 'Sticker'], pack: ['مجموعة ملصقات', 'Sticker pack'], calendar: ['التقويم', 'Calendar'], design: ['تصميم', 'Design'], book: ['الكتاب', 'The book'] };
  const KINDS = { painting: ['اللوحات', 'Paintings'], postcard: ['البطاقات البريدية', 'Postcards'], sticker: ['الملصقات', 'Stickers'], design: ['تصاميم متنوعة', 'More designs'] };
  const kind = (k) => t(...(KIND[k] || [k, k]));
  const pimg = (p) => (p.extra && p.extra.img) || `../assets/${/^(s-|u-)|^(girl-bike|truck)$/.test(p.id) ? '' : 't-'}${p.id}.webp`;
  const itemsLine = (o) => o.items.map((i) => esc(AR ? i.ta || i.t || i.k : i.t || i.k)).join(t('، ', ', '));
  function csv(name, head, rows) {
    const q = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const blob = new Blob(['﻿' + [head, ...rows].map((r) => r.map(q).join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name + '-' + new Date().toISOString().slice(0, 10) + '.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  /* any photo becomes a WebP the database can hold (under 1.8 MB) */
  async function toWebp(file, max = 1800) {
    const bmp = await createImageBitmap(file), s = Math.min(1, max / Math.max(bmp.width, bmp.height)), c = document.createElement('canvas');
    c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s); c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    for (const q of [0.9, 0.82, 0.74, 0.62, 0.5]) { const b = await new Promise((r) => c.toBlob(r, 'image/webp', q)); if (b && b.size < 1.75e6) return b; }
    throw new Error('too_big');
  }
  const loading = () => (view.innerHTML = `<div class="empty">${t('جارٍ التحميل…', 'Loading…')}</div>`);
  function head(title, sub, actions) { $('#title').textContent = title; $('#sub').textContent = sub || ''; $('#actions').innerHTML = actions || ''; document.title = title + ' · Mass & Grass'; }

  /* =====================================================================
     1 · Overview
     ===================================================================== */
  let ovDays = 30;
  async function overview() {
    head(t('نظرة عامة', 'Overview'), new Date().toLocaleDateString(AR ? 'ar-u-nu-latn' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      `<div class="seg" id="ovd">${[7, 30, 90, 365].map((d) => `<button type="button" data-d="${d}" aria-pressed="${d === ovDays}">${d === 365 ? t('سنة', 'Year') : d + ' ' + t('يومًا', 'days')}</button>`).join('')}</div>`);
    loading();
    const [r, me] = await Promise.all([api('GET', '/api/admin/overview?days=' + ovDays), api('GET', '/api/me')]); if (!r.ok) return (view.innerHTML = `<div class="empty">${why(r)}</div>`);
    const o = r.data; o.twofa = !!(me.data.user && me.data.user.twofa); badge('messages', o.unread); badge('requests', o.newRequests || 0); badge('security', o.alerts); badge('orders', o.toShip || 0);
    const delta = (now, prev, money) => { if (!prev && !now) return `<span class="d">${t('لا مبيعات بعد', 'No sales yet')}</span>`; if (!prev) return `<span class="d up">${t('أول مبيعات في هذه الفترة', 'First sales in this period')}</span>`; const p = Math.round(((now - prev) / prev) * 100); return `<span class="d ${p >= 0 ? 'up' : 'down'}">${p >= 0 ? '+' : ''}${p}% ${t('عن الفترة السابقة', 'on the period before')} (${money ? eur(prev) : num(prev)})</span>`; };
    const todo = [
      [o.payments === 'live', t('الدفع', 'Payments'), o.payments === 'live' ? t('PayPal يعمل بأموال حقيقية.', 'PayPal is live.') : o.payments === 'sandbox' ? t('PayPal في وضع التجربة (Sandbox). ضعوا مفاتيح Live عند الإطلاق.', 'PayPal is in sandbox. Put the live keys in before launch.') : t('لم تُضف مفاتيح PayPal بعد، فالطلبات تُسجَّل دون دفع.', 'No PayPal keys yet: orders are recorded but cannot be paid.')],
      ...(o.toShip ? [[false, t('طرود للشحن', 'Parcels to send'), `${num(o.toShip)} ${t('طلب مدفوع ينتظر الطباعة والشحن.', 'paid orders wait to be printed and shipped.')}`, '#orders']] : []),
      [!o.noFile.length && o.calendarFile, t('ملفات البيع', 'Files to deliver'), !o.noFile.length && o.calendarFile ? t('كل قطعة معروضة لها ملف.', 'Every piece on sale has a file.') : `${o.noFile.length + (o.calendarFile ? 0 : 1)} ${t('قطعة معروضة بلا ملف يُسلَّم للمشتري.', 'pieces on sale have no file for the buyer.')}`, '#products'],
      [!!o.bookFile, t('الكتاب', 'The book'), o.bookFile ? t('ملف الكتاب مرفوع.', 'The book’s PDF is uploaded.') : t('ارفعوا ملف الكتاب من المنتجات ثم «الكتاب».', 'Upload the book’s PDF in Products, then Book.'), '#products'],
      ...(o.newRequests ? [[false, t('طلبات تصميم', 'Design requests'), `${num(o.newRequests)} ${t('طلب جديد ينتظر الرد.', 'new requests wait for an answer.')}`, '#requests']] : []),
      [o.mail, t('البريد', 'E-mail'), o.mail ? t('رسائل الطلبات واستعادة كلمة السر تُرسَل.', 'Order and password e-mails are sent.') : t('مفتاح البريد (Resend) غير موجود: لا تُرسل رسائل التأكيد.', 'No mail key (Resend): confirmation e-mails are not sent.')],
      [o.twofa, t('التحقق بخطوتين', 'Two-step sign-in'), o.twofa ? t('حساب الإدارة محمي برمز إضافي.', 'The admin account asks for a second code.') : t('فعّلوه لحماية حساب الإدارة.', 'Turn it on to protect the admin account.'), '#security'],
      [!o.soon, t('الموقع', 'The site'), o.soon ? t('صفحة «قريبًا» ظاهرة للزوار. أنتم فقط ترون الموقع.', 'Visitors see the coming-soon page. Only you see the site.') : t('الموقع مفتوح للزوار.', 'The site is open to visitors.')],
      [o.google, t('الدخول بحساب Google', 'Google sign-in'), o.google ? t('يعمل.', 'Working.') : t('غير مفعّل (اختياري).', 'Not set up (optional).')],
    ];
    /* the dashboard (owner, 25 Nov 2026, after the two references): figure cards in the calendar's soft tints, the sales line with
       a reading under the pointer, best sellers and recent orders with their pictures, top buyers, digital against printed, and
       where the parcels go; then the before-launch list and the shop's numbers */
    const pct = (now, prev) => (!prev ? (now ? null : 0) : Math.round(((now - prev) / prev) * 100));
    const chip = (now, prev) => { const v = pct(now, prev); return v === null ? `<span class="chip up">${t('جديد', 'New')}</span>` : `<span class="chip ${v > 0 ? 'up' : v < 0 ? 'down' : ''}">${v > 0 ? '▲' : v < 0 ? '▼' : '•'} ${Math.abs(v)}%</span>`; };
    const V = o.visits || { period: 0, views: 0, previous: 0, countries: [], pages: [], sources: [], devices: [] };
    const conv = (a, b) => (b ? (Math.round((a / b) * 1000) / 10).toLocaleString('en') + '%' : '—');
    const avg = o.period.orders ? o.period.revenue / o.period.orders : 0, pavg = o.previous.orders ? o.previous.revenue / o.previous.orders : 0;
    const cards = [
      ['rose', t('المبيعات', 'Revenue'), eur(o.period.revenue), chip(o.period.revenue, o.previous.revenue), `${t('السابقة', 'Before')} ${eur(o.previous.revenue)}`, '#orders'],
      ['sage', t('طلبات مدفوعة', 'Paid orders'), num(o.period.orders), chip(o.period.orders, o.previous.orders), `${t('الإجمالي', 'All time')} ${num(o.totals.orders)}`, '#orders'],
      ['sand', t('متوسط الطلب', 'Average order'), eur(avg), chip(avg, pavg), `${t('السابقة', 'Before')} ${eur(pavg)}`, '#orders'],
      ['blue', t('الزيارات', 'Visits'), num(V.period), chip(V.period, V.previous), `${num(V.views)} ${t('صفحة شوهدت', 'pages seen')}`, '#overview'],
      ['lilac', t('نسبة الشراء', 'Conversion'), conv(o.period.orders, V.period), chip(V.period ? o.period.orders / V.period : 0, V.previous ? o.previous.orders / V.previous : 0), t('طلبات مدفوعة من كل 100 زيارة', 'paid orders per 100 visits'), '#overview'],
      ['sand2', t('عملاء جدد', 'New customers'), num(o.newUsers), '', `${t('الكل', 'In all')} ${num(o.users)}`, '#customers'],
    ];
    /* the sales line: revenue (rose, filled) and orders (ink, thin), on one scale each */
    const D = o.byDay, n = D.length, maxR = Math.max(1, ...D.map((d) => d.revenue)), maxO = Math.max(1, ...D.map((d) => d.orders)), X = (i) => (n === 1 ? 50 : (i / (n - 1)) * 100);
    const line = (f, mx) => D.map((d, i) => `${i ? 'L' : 'M'}${X(i).toFixed(2)},${(96 - (f(d) / mx) * 86).toFixed(2)}`).join(' ');
    const rev = line((d) => d.revenue, maxR), ord = line((d) => d.orders, maxO), maxV = Math.max(1, ...D.map((d) => d.visits || 0)), vis = line((d) => d.visits || 0, maxV);
    const thumb = (kind, id) => kind === 'calendar' ? `../assets/${id === 'palestine-2027' ? 't-ps-00' : id === 'gaza-2027' ? 't-gz-00' : 't-v2-00'}.webp` : kind === 'book' ? '../assets/book/pg-01.webp' : `../assets/t-${id}.webp`;
    const pic = (kind, id) => `<span class="pic"><img src="${esc(thumb(kind, id))}" alt="" loading="lazy"></span>`;
    const sp = o.split || { digital: { n: 0, revenue: 0 }, printed: { n: 0, revenue: 0 } }, spT = sp.digital.n + sp.printed.n, spD = spT ? sp.digital.n / spT : 0;
    const ring = `<svg viewBox="0 0 42 42" class="ring" aria-hidden="true"><circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--ring-b)" stroke-width="5"/>${spT ? `<circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--kraft)" stroke-width="5" stroke-dasharray="${(spD * 100).toFixed(1)} ${(100 - spD * 100).toFixed(1)}" stroke-dashoffset="25"/>` : ''}<text x="21" y="23" text-anchor="middle">${spT ? Math.round(spD * 100) + '%' : '—'}</text></svg>`;
    const F = o.funnel || { visits: 0, calendar: 0, checkout: 0, started: 0, paid: 0 };
    const funnel = [[t('زيارات', 'Visits'), F.visits], [t('فتحوا صفحة الدفع', 'Opened checkout'), F.checkout], [t('بدأوا طلبًا', 'Started an order'), F.started], [t('دفعوا', 'Paid'), F.paid]];
    const fMax = Math.max(1, ...funnel.map((x) => x[1])), devT = V.devices.reduce((a, x) => a + x.n, 0);
    view.innerHTML = `
      <p class="hello">${t('أهلًا بكم في دفتر المتجر', 'Welcome back to the shop’s book')}<span>${t('هذا ما جرى في آخر', 'Here is what happened in the last')} ${o.days} ${t('يومًا', 'days')}</span></p>
      <section class="kcards" aria-label="${t('الأرقام', 'Figures')}">${cards.map(([c, k, v, ch, d, href]) => `<a class="kc ${c}" href="${href}"><span class="k">${k}</span><span class="v num">${v}</span><span class="f">${ch}<small>${d}</small></span></a>`).join('')}</section>
      <div class="dgrid">
        <section class="leaf span2"><div class="hd"><h2>${t('المبيعات', 'Sales')}</h2><span class="lg"><i class="r"></i>${t('الإيراد', 'Revenue')}<i class="o"></i>${t('الطلبات', 'Orders')}<i class="v"></i>${t('الزيارات', 'Visits')}</span></div>
          <div class="sline" id="sline"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            ${[0, 1, 2, 3].map((g) => `<line class="g" x1="0" x2="100" y1="${10 + g * 28.7}" y2="${10 + g * 28.7}"/>`).join('')}
            <path class="ra" d="${rev} L100,100 L0,100 Z"/><path class="rl" d="${rev}"/><path class="vl" d="${vis}"/><path class="ol" d="${ord}"/><line class="cur" id="scur" x1="0" x2="0" y1="0" y2="100"/></svg>
            <div class="tip" id="stip" hidden></div>
            <div class="ax"><span class="num">${D[0].date}</span><span class="num">${D[Math.floor((n - 1) / 2)].date}</span><span class="num">${D[n - 1].date}</span></div></div></section>
        <section class="leaf"><div class="hd"><h2>${t('رقمي أم مطبوع', 'Digital or printed')}</h2></div>
          <div class="split">${ring}<ul><li><i class="dg"></i><span>${t('رقمي PDF', 'Digital PDF')}</span><b class="num">${num(sp.digital.n)}</b><small>${eur(sp.digital.revenue)}</small></li><li><i class="pr"></i><span>${t('مطبوع ومشحون', 'Printed and shipped')}</span><b class="num">${num(sp.printed.n)}</b><small>${eur(sp.printed.revenue)}</small></li></ul></div></section>
        <section class="leaf span3 wmap"><div class="hd"><h2>${t('من أين يشترون ويزورون', 'Where buyers and visitors are')}</h2>
          <div class="seg" id="mapSeg">${[['orders', 'المشترون', 'Buyers'], ['visits', 'الزوار', 'Visitors']].map(([k, a, e]) => `<button type="button" data-m="${k}" aria-pressed="${k === mapBy}">${t(a, e)}</button>`).join('')}</div></div>
          <div class="wm"><div class="wm-map" id="wmMap"><div class="wm-tip" id="wmTip" hidden></div></div><div class="wm-side"><div class="wm-sum" id="wmSum"></div><ul class="cbars" id="wmList"></ul>
          <p class="wm-key"><span>${t('أقل', 'Fewer')}</span><i></i><i></i><i></i><i></i><i></i><span>${t('أكثر', 'More')}</span></p></div></div></section>
        <section class="leaf"><div class="hd"><h2>${t('من الزيارة إلى الشراء', 'From a visit to a sale')}</h2></div>
          <ol class="fun">${funnel.map(([k, v], i) => `<li><span>${k}</span><span class="bar"><i style="width:${Math.max(v ? 2 : 0, Math.round((v / fMax) * 100))}%"></i></span><b class="num">${num(v)}</b><small class="num">${i ? conv(v, funnel[0][1]) : ''}</small></li>`).join('')}</ol>
          <p class="note">${t('الزيارة أول صفحة يفتحها الزائر. لا نحفظ عنوانًا ولا اسمًا، أرقامًا فقط.', 'A visit is the first page a visitor opens. Only counts are kept, no address or name.')}</p></section>
        <section class="leaf"><div class="hd"><h2>${t('من أين يأتون', 'Where visits come from')}</h2></div>
          ${V.sources.length ? `<ul class="cbars">${V.sources.map((x) => `<li><span>${esc(srcName(x.name))}</span><span class="bar"><i style="width:${Math.round((x.n / V.sources[0].n) * 100)}%"></i></span><b class="num">${num(x.n)}</b></li>`).join('')}</ul>` : `<div class="empty">${t('تظهر المصادر بعد أول زيارة.', 'Sources show after the first visit.')}</div>`}
          ${V.devices.length ? `<p class="devs">${V.devices.map((x) => `<span><b class="num">${conv(x.n, devT)}</b>${t(...({ mobile: ['هاتف', 'Phone'], desktop: ['حاسوب', 'Computer'], tablet: ['لوحي', 'Tablet'] }[x.name] || [x.name, x.name]))}</span>`).join('')}</p>` : ''}</section>
        <section class="leaf"><div class="hd"><h2>${t('أكثر الصفحات زيارة', 'Most viewed pages')}</h2></div>
          ${V.pages.length ? `<ul class="cbars">${V.pages.map((x) => `<li><span>${esc(pageName(x.path))}</span><span class="bar"><i style="width:${Math.round((x.views / V.pages[0].views) * 100)}%"></i></span><b class="num">${num(x.views)}</b></li>`).join('')}</ul>` : `<div class="empty">${t('تظهر الصفحات بعد أول زيارة.', 'Pages show after the first visit.')}</div>`}</section>
        <section class="leaf span2"><div class="hd"><h2>${t('آخر الطلبات', 'Recent orders')}</h2><a class="btn sm" href="#orders">${t('كل الطلبات', 'View all')}</a></div>
          ${o.recent.length ? `<div class="scroll"><table class="rows ro"><thead><tr><th>${t('القطعة', 'Piece')}</th><th>${t('العميل', 'Customer')}</th><th>${t('الطلب', 'Order')}</th><th>${t('التاريخ', 'Date')}</th><th>${t('الحالة', 'Status')}</th><th class="end">${t('المبلغ', 'Amount')}</th></tr></thead><tbody>${o.recent.map((x) => { const i0 = x.items[0] || {}; return `<tr data-open="${esc(x.id)}"><td><span class="pr-c">${pic(i0.kind, i0.k)}<span>${esc(AR ? i0.ta || i0.t : i0.t || '')}${x.items.length > 1 ? ` <small>+${x.items.length - 1}</small>` : ''}<small>${x.ship ? t('مطبوع', 'Printed') : t('رقمي', 'Digital')}</small></span></span></td><td>${esc(x.name || '')}<small dir="ltr">${esc(x.email)}</small></td><td class="num">${esc(x.id)}</td><td class="num">${day(x.date)}</td><td><span class="pill ${x.status === 'paid' && x.ship_status === 'sent' ? 'sent' : x.status}">${x.status === 'paid' && x.ship ? shipWord(x.ship_status) : t(...(STATUS[x.status] || [x.status, x.status]))}</span></td><td class="end num"><b>${price(x.total)}</b></td></tr>`; }).join('')}</tbody></table></div>` : `<div class="empty">${t('لا طلبات بعد. ستظهر هنا فور وصول أول طلب.', 'No orders yet. The first one will show here.')}</div>`}</section>
        <section class="leaf"><div class="hd"><h2>${t('الأكثر مبيعًا', 'Best sellers')}</h2></div>
          ${o.top.length ? `<ul class="bs">${o.top.slice(0, 5).map((x) => `<li>${pic(x.kind, x.id)}<span>${esc(AR ? x.title_ar || x.title : x.title || x.id)}<small>${kind(x.kind)}</small></span><b class="num">${num(x.n)}<small>${t('مبيع', 'sold')}</small></b></li>`).join('')}</ul>` : `<div class="empty">${t('تظهر القائمة بعد أول بيع.', 'This fills in after the first sale.')}</div>`}</section>
        <section class="leaf"><div class="hd"><h2>${t('أكثر العملاء شراءً', 'Top customers')}</h2></div>
          ${(o.buyers || []).length ? `<ul class="bs">${o.buyers.map((c) => `<li><span class="av">${esc(((c.name || c.email || '?').trim()[0] || '?').toUpperCase())}</span><span>${esc(c.name || c.email)}<small dir="ltr">${esc(c.email)}</small></span><b class="num">${eur(c.revenue)}<small>${num(c.n)} ${t('طلب', 'orders')}</small></b></li>`).join('')}</ul>` : `<div class="empty">${t('يظهر العملاء هنا بعد أول طلب مدفوع.', 'Buyers show here after the first paid order.')}</div>`}</section>
        <section class="leaf"><div class="hd"><h2>${t('قبل الإطلاق', 'Before launch')}</h2></div><ul class="todo">${todo.map((x) => `<li class="${x[0] ? 'ok' : 'no'}"><span class="m" aria-hidden="true"></span><div><b>${x[1]}</b><span>${x[2]}</span></div>${x[3] && !x[0] ? `<a class="btn sm" href="${x[3]}">${t('افتحوا', 'Open')}</a>` : '<span></span>'}</li>`).join('')}</ul></section>
        <section class="leaf"><div class="hd"><h2>${t('المتجر الآن', 'The shop now')}</h2></div><table class="rows"><tbody>
            <tr><td>${t('قطع معروضة', 'Pieces on sale')}</td><td class="end num"><b>${num(o.products - o.hidden)}</b></td></tr>
            <tr><td>${t('ملفات مرفوعة', 'Files uploaded')}</td><td class="end num"><b>${num(o.files)}</b> <small>${size(o.fileBytes)}</small></td></tr>
            <tr><td>${t('طرود للشحن', 'Parcels to send')}</td><td class="end num"><b>${num(o.toShip || 0)}</b></td></tr>
            <tr><td>${t('بانتظار الدفع (7 أيام)', 'Awaiting payment (7 days)')}</td><td class="end num"><b>${num(o.pending)}</b></td></tr>
            <tr><td>${t('مشتركو البريد', 'Subscribers')}</td><td class="end num"><b>${num(o.subscribers)}</b></td></tr>
            <tr><td>${t('رسائل غير مقروءة', 'Unread messages')}</td><td class="end num"><b>${num(o.unread)}</b></td></tr>
            <tr><td>${t('الإجمالي منذ البداية', 'All time')}</td><td class="end num"><b>${eur(o.totals.revenue)}</b></td></tr></tbody></table></section>
      </div>`;
    /* the reading under the pointer: that day's revenue and orders */
    const sl = $('#sline'), tip = $('#stip'), cur = $('#scur');
    sl.addEventListener('pointermove', (e) => { const r = sl.getBoundingClientRect(), f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), i = Math.round(f * (n - 1)), d = D[i], x = X(i);
      cur.setAttribute('x1', x); cur.setAttribute('x2', x); cur.style.opacity = 1; tip.hidden = false; tip.innerHTML = `<b class="num">${eur(d.revenue)}</b><span>${num(d.orders)} ${t('طلب', 'orders')}</span><span>${num(d.visits || 0)} ${t('زيارة', 'visits')}</span><small class="num">${d.date}</small>`;
      tip.style.left = Math.min(r.width - 120, Math.max(0, (x / 100) * r.width - 60)) + 'px'; });
    sl.addEventListener('pointerleave', () => { tip.hidden = true; cur.style.opacity = 0; });
    $('#ovd').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { ovDays = +b.dataset.d; overview(); } });
    drawMap(o, V);
    $('#mapSeg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; mapBy = b.dataset.m; $$('#mapSeg button').forEach((x) => x.setAttribute('aria-pressed', x === b)); drawMap(o, V); });
    view.addEventListener('click', openOrderRow);
  }
  /* the world map: countries tinted by how many bought (or visited) from them in the period; the list beside it, the reading under
     the pointer. The map is Natural Earth's outline (world.svg, one path per country with its ISO code), loaded once. */
  let mapBy = 'orders', WORLD = null, MAPROWS = {};
  /* zoom and pan: the wheel or the buttons zoom (round the pointer), a drag moves, two fingers pinch, a double click zooms in */
  function zoomable(box, svg) {
    if (svg.dataset.zoom) return; svg.dataset.zoom = 1;
    const W0 = 960, H0 = 470, v = { x: 0, y: 0, w: W0, h: H0 }, MIN = W0 / 16;
    const set = () => { v.w = Math.min(W0, Math.max(MIN, v.w)); v.h = v.w * H0 / W0; v.x = Math.min(W0 - v.w, Math.max(0, v.x)); v.y = Math.min(H0 - v.h, Math.max(0, v.y));
      svg.setAttribute('viewBox', `${v.x} ${v.y} ${v.w} ${v.h}`); box.classList.toggle('zoomed', v.w < W0 - 1); };
    const pt = (cx, cy) => { const r = svg.getBoundingClientRect(); return [v.x + ((cx - r.left) / r.width) * v.w, v.y + ((cy - r.top) / r.height) * v.h, r]; };
    const zoom = (k, cx, cy) => { const r = svg.getBoundingClientRect(); if (cx == null) { cx = r.left + r.width / 2; cy = r.top + r.height / 2; } const [px, py] = pt(cx, cy), nw = Math.min(W0, Math.max(MIN, v.w / k));
      v.x = px - ((cx - r.left) / r.width) * nw; v.y = py - ((cy - r.top) / r.height) * (nw * H0 / W0); v.w = nw; set(); };
    svg.addEventListener('wheel', (e) => { e.preventDefault(); zoom(Math.exp(-e.deltaY * 0.0022), e.clientX, e.clientY); }, { passive: false });
    svg.addEventListener('dblclick', (e) => zoom(2, e.clientX, e.clientY));
    const P = new Map(); let last = null, pinch = 0;
    svg.addEventListener('pointerdown', (e) => { P.set(e.pointerId, [e.clientX, e.clientY]); svg.setPointerCapture(e.pointerId); last = [e.clientX, e.clientY]; if (P.size === 2) { const [a, b] = [...P.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
    svg.addEventListener('pointermove', (e) => { if (!P.has(e.pointerId)) return; P.set(e.pointerId, [e.clientX, e.clientY]); const r = svg.getBoundingClientRect();
      if (P.size === 2) { const [a, b] = [...P.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) zoom(d / pinch, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); pinch = d; return; }
      v.x -= ((e.clientX - last[0]) / r.width) * v.w; v.y -= ((e.clientY - last[1]) / r.height) * v.h; last = [e.clientX, e.clientY]; box.classList.add('drag'); set(); });
    const up = (e) => { P.delete(e.pointerId); pinch = 0; if (P.size === 1) last = [...P.values()][0]; if (!P.size) box.classList.remove('drag'); };
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    box.insertAdjacentHTML('beforeend', `<div class="wm-z"><button type="button" data-z="in" aria-label="${t('تكبير', 'Zoom in')}">+</button><button type="button" data-z="out" aria-label="${t('تصغير', 'Zoom out')}">−</button><button type="button" data-z="reset" aria-label="${t('العالم كله', 'Whole world')}">⟲</button></div>`);
    box.querySelector('.wm-z').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.z === 'reset') { v.x = 0; v.y = 0; v.w = W0; set(); } else zoom(b.dataset.z === 'in' ? 1.8 : 1 / 1.8); });
  }
  const SRCN = { direct: ['مباشرة أو رابط محفوظ', 'Direct or a saved link'] };
  const srcName = (n) => t(...(SRCN[n] || [n, n]));
  const pageName = (p) => ({ index: t('الرئيسية', 'Home'), calendar: t('التقويم', 'Calendar'), checkout: t('الدفع', 'Checkout'), account: t('الحساب', 'Account'), profile: t('الملف الشخصي', 'Profile'), track: t('تتبع الطلب', 'Track order'), later: t('قريبًا', 'Opening soon'), help: t('المساعدة', 'Help'), terms: t('الشروط', 'Terms'), palestine: t('تقويم فلسطين', 'Palestine calendar'), gaza: t('تقويم أماكن من غزة', 'Places in Gaza calendar'), 'story-month': t('حكايات التقويم', 'Calendar stories') }[p] || p);
  async function drawMap(o, V) {
    const box = $('#wmMap'); if (!box) return;
    if (!WORLD) { try { const r = await fetch('world.svg', { credentials: 'same-origin' }); WORLD = r.ok ? await r.text() : ''; } catch (e) { WORLD = ''; } }
    if (!$('#wmMap')) return;
    const src = mapBy === 'orders' ? (o.map || []) : V.countries, acc = {};
    for (const x of src) { if (!x.country) continue; const c = x.country === 'IL' ? 'PS' : x.country, a = acc[c] || (acc[c] = { country: c, n: 0, revenue: 0, views: 0 }); a.n += x.n; a.revenue += x.revenue || 0; a.views += x.views || 0; }
    const rows = Object.values(acc).sort((a, b) => b.n - a.n), byC = Object.fromEntries(rows.map((x) => [x.country, x]));
    const total = rows.reduce((a, x) => a + x.n, 0), unknown = (mapBy === 'orders' ? (o.map || []) : V.countries).filter((x) => !x.country).reduce((a, x) => a + x.n, 0), mx = Math.max(1, ...rows.map((x) => x.n));
    let svg = box.querySelector('svg');
    if (!svg && WORLD) { box.insertAdjacentHTML('afterbegin', WORLD); svg = box.querySelector('svg'); if (svg) { svg.setAttribute('aria-hidden', 'true'); svg.querySelectorAll('title').forEach((x) => x.remove()); } }
    if (svg) svg.querySelectorAll('path').forEach((pth) => { const c = pth.dataset.c, r = c && byC[c]; pth.removeAttribute('class'); if (r) pth.setAttribute('class', 'l' + Math.min(5, Math.max(1, Math.ceil((Math.sqrt(r.n) / Math.sqrt(mx)) * 5)))); });
    MAPROWS = byC; const tip = $('#wmTip');
    if (svg) zoomable(box, svg);
    if (svg && !svg.dataset.wired) { svg.dataset.wired = 1;
      svg.addEventListener('pointermove', (e) => { const pth = e.target.closest('path[data-c]'); if (!pth) { tip.hidden = true; return; } const c = pth.dataset.c, r = MAPROWS[c], bx = box.getBoundingClientRect();
        tip.hidden = false; tip.innerHTML = `<b>${esc(cname(c))}</b><span class="num">${r ? (mapBy === 'orders' ? `${num(r.n)} ${t('طلب', 'orders')}, ${eur(r.revenue)}` : `${num(r.n)} ${t('زيارة', 'visits')}`) : t('لا شيء بعد', 'Nothing yet')}</span>`;
        tip.style.left = Math.min(bx.width - 170, Math.max(0, e.clientX - bx.left + 12)) + 'px'; tip.style.top = Math.max(0, e.clientY - bx.top - 50) + 'px'; });
      svg.addEventListener('pointerleave', () => { tip.hidden = true; }); }
    $('#wmSum').innerHTML = `<b class="num">${num(total + unknown)}</b><span>${mapBy === 'orders' ? t('طلب مدفوع', 'paid orders') : t('زيارة', 'visits')} ${t('من', 'from')} <b class="num">${num(rows.length)}</b> ${t('بلد', 'countries')}</span>${unknown ? `<small>${num(unknown)} ${t('بلا بلد معروف', 'with no known country')}</small>` : ''}`;
    $('#wmList').innerHTML = rows.length ? rows.slice(0, 8).map((x) => `<li><span>${esc(cname(x.country))}</span><span class="bar"><i style="width:${Math.round((x.n / mx) * 100)}%"></i></span><b class="num">${num(x.n)}${mapBy === 'orders' ? `<small>${eur(x.revenue)}</small>` : ''}</b></li>`).join('')
      : `<li class="none">${mapBy === 'orders' ? t('تظهر البلدان بعد أول طلب مدفوع.', 'Countries show after the first paid order.') : t('تظهر البلدان بعد أول زيارة.', 'Countries show after the first visit.')}</li>`;
  }
  function openOrderRow(e) { const tr = e.target.closest('tr[data-open]'); if (tr && /^MG-/.test(tr.dataset.open)) orderSheet(tr.dataset.open); }

  /* =====================================================================
     2 · Orders
     ===================================================================== */
  let ordF = 'all', ordT = 'all', ordQ = '', ORD = [];
  const PICK = new Set();
  const SHIPC = { AE: ['الإمارات العربية المتحدة', 'United Arab Emirates'], DK: ['الدنمارك', 'Denmark'] };
  /* a country's name in the panel's language (every country can be shipped to now) */
  const cname = (c) => { try { return new Intl.DisplayNames([AR ? 'ar' : 'en'], { type: 'region' }).of(c); } catch (e) { return t(...(SHIPC[c] || [c, c])); } };
  const shipWord = (s) => t(...({ to_print: ['للطباعة والشحن', 'To print and ship'], sent: ['أُرسل', 'Sent'], delivered: ['وصل', 'Delivered'] }[s] || ['', '']));
  /* what an order is: printed and shipped (it has an address), digital only, or both in one order */
  const otype = (o) => { const pr = o.items.some((i) => i.fmt === 'print'), dg = o.items.some((i) => i.fmt !== 'print'); return pr && dg ? 'both' : pr ? 'ship' : 'digital'; };
  const typeTag = (o) => { const k = otype(o); return `<span class="tag ${k === 'digital' ? '' : 'on'}">${k === 'digital' ? t('رقمي', 'Digital') : k === 'ship' ? t('شحن', 'Shipped') : t('شحن + رقمي', 'Shipped + digital')}</span>${o.ship ? `<small>${esc(cname(o.ship.country))}</small>` : ''}`; };
  const parcel = (o) => o.ship ? `<span class="pst ${o.ship_status || ''}">${o.status === 'paid' ? shipWord(o.ship_status) : t('بعد الدفع', 'After payment')}</span>${o.tracking ? `<small dir="ltr">${esc(o.tracking)}</small>` : ''}` : `<span class="hint">${t('يُنزَّل فورًا', 'Downloaded at once')}</span>`;
  async function orders() {
    head(t('الطلبات', 'Orders'), '', `<button type="button" class="btn" id="ordCsv">${t('تنزيل CSV', 'Download CSV')}</button>`); loading();
    const r = await api('GET', '/api/admin/orders'); if (!r.ok) return; ORD = r.data.orders;
    const paid = ORD.filter((o) => o.status === 'paid'), cnt = (f) => ORD.filter(f).length;
    $('#sub').textContent = `${num(ORD.length)} ${t('طلب', 'orders')}, ${num(paid.length)} ${t('مدفوع', 'paid')}`;
    /* the four numbers that say what needs doing, each a shortcut to its list */
    const cards = [['ship', 'to_ship', t('للطباعة والشحن', 'To print and ship'), cnt((o) => o.status === 'paid' && o.ship && o.ship_status === 'to_print'), t('مدفوعة وتنتظر الإرسال', 'Paid, waiting to be sent')],
      ['ship', 'sent', t('في الطريق', 'On their way'), cnt((o) => o.status === 'paid' && o.ship_status === 'sent'), t('أُرسلت ولم تصل بعد', 'Sent, not delivered yet')],
      ['digital', 'paid', t('طلبات رقمية مدفوعة', 'Paid digital orders'), cnt((o) => o.status === 'paid' && otype(o) === 'digital'), t('الملفات أُرسلت تلقائيًا', 'Files sent by themselves')],
      ['all', 'pending', t('بانتظار الدفع', 'Awaiting payment'), cnt((o) => o.status === 'pending'), t('لم يكتمل الدفع في PayPal', 'Not finished in PayPal')]];
    view.innerHTML = `<section class="today ordk" aria-label="${t('ما ينتظر', 'What needs doing')}">${cards.map(([ty, st, k, v, d]) => `<div><a href="#orders" data-ty="${ty}" data-st="${st}"><span class="k">${k}</span><span class="v">${num(v)}</span><span class="d">${d}</span></a></div>`).join('')}</section>
      <div class="bar"><div class="seg" id="ordTy" aria-label="${t('النوع', 'Kind')}">${[['all', 'كل الأنواع', 'All kinds'], ['ship', 'شحن', 'Shipped'], ['digital', 'رقمي', 'Digital']].map((s) => `<button type="button" data-t="${s[0]}" aria-pressed="${s[0] === ordT}">${t(s[1], s[2])}</button>`).join('')}</div>
      <div class="seg" id="ordSeg" aria-label="${t('الحالة', 'State')}">${[['all', 'الكل', 'All'], ['paid', 'مدفوع', 'Paid'], ['pending', 'بانتظار الدفع', 'Awaiting'], ['to_ship', 'للشحن', 'To ship'], ['sent', 'في الطريق', 'On the way'], ['delivered', 'وصل', 'Delivered'], ['closed', 'ملغى أو مُستردّ', 'Cancelled or refunded']].map((s) => `<button type="button" data-f="${s[0]}" aria-pressed="${s[0] === ordF}">${t(s[1], s[2])}</button>`).join('')}</div>
      <input class="grow" type="search" id="ordQ" value="${esc(ordQ)}" placeholder="${t('ابحثوا برقم الطلب أو البريد أو الاسم أو البلد', 'Search by order, e-mail, name or country')}" aria-label="${t('بحث', 'Search')}"></div><section class="leaf" id="ordL"></section>`;
    const stOk = (o) => ordF === 'all' || (ordF === 'closed' ? ['cancelled', 'refunded'].includes(o.status) : ordF === 'to_ship' ? o.status === 'paid' && o.ship && o.ship_status === 'to_print' : ordF === 'sent' || ordF === 'delivered' ? o.status === 'paid' && o.ship_status === ordF : o.status === ordF);
    const tyOk = (o) => ordT === 'all' || (ordT === 'ship' ? !!o.ship : otype(o) === 'digital');
    const paint = () => {
      const q = ordQ.trim().toLowerCase(), L = ORD.filter((o) => stOk(o) && tyOk(o) && (!q || [o.id, o.email, o.name, o.ship ? o.ship.country + ' ' + cname(o.ship.country) + ' ' + o.ship.city : ''].join(' ').toLowerCase().includes(q)));
      $('#ordL').innerHTML = L.length ? `<div class="scroll"><table class="rows"><thead><tr><th class="tight"><input type="checkbox" id="ordAll" aria-label="${t('اختيار الكل', 'Select all')}"></th><th>${t('الطلب', 'Order')}</th><th>${t('العميل', 'Customer')}</th><th>${t('النوع', 'Kind')}</th><th>${t('القطع', 'Pieces')}</th><th>${t('الدفع', 'Payment')}</th><th>${t('الطرد', 'Parcel')}</th><th class="end">${t('المبلغ', 'Amount')}</th></tr></thead><tbody>${L.map((x) => `<tr data-open="${esc(x.id)}"><td class="tight"><input type="checkbox" class="ordPick" value="${esc(x.id)}"${PICK.has(x.id) ? ' checked' : ''} aria-label="${esc(x.id)}"></td><td class="tight num"><b>${esc(x.id)}</b><small>${when(x.date)}</small>${x.note ? `<small class="onote">${esc(x.note.slice(0, 40))}</small>` : ''}</td><td>${esc(x.name || '')}<small dir="ltr">${esc(x.email)}</small></td><td class="tight">${typeTag(x)}</td><td>${itemsLine(x)}${x.items.some((i) => i.fmt === 'print') ? `<small>${t('نسخ مطبوعة', 'Printed copies')}: ${x.items.filter((i) => i.fmt === 'print').reduce((n, i) => n + (i.q || 1), 0)}</small>` : ''}</td><td class="tight">${stamp(x.status)}</td><td class="tight">${parcel(x)}</td><td class="tight end num"><b>${price(x.total)}</b>${x.shipping ? `<small>${t('القطع', 'Pieces')} ${eur(x.total - x.shipping)}</small><small>${t('الشحن', 'Shipping')} ${eur(x.shipping)}</small>` : ''}</td></tr>`).join('')}</tbody></table></div>` : `<div class="empty">${ORD.length ? t('لا طلبات بهذا الاختيار.', 'No orders match.') : t('لا طلبات بعد. ستظهر هنا فور وصول أول طلب.', 'No orders yet. The first one will show here.')}</div>`;
    };
    paint();
    /* ticked orders: a bar appears with how many and a delete button */
    const pickBar = () => { const n = PICK.size, el = $('#ordPickBar'); el.hidden = !n; el.querySelector('b').textContent = num(n); };
    view.querySelector('#ordL').insertAdjacentHTML('beforebegin', `<div class="pickbar" id="ordPickBar" hidden><span>${t('محدد', 'Selected')}: <b>0</b></span><button type="button" class="btn sm" id="ordNone">${t('إلغاء التحديد', 'Clear')}</button><button type="button" class="btn sm warn" id="ordDel">${t('احذفوا المحدد', 'Delete selected')}</button></div>`);
    $('#ordL').addEventListener('change', (e) => { const c = e.target; if (c.id === 'ordAll') { $$('.ordPick').forEach((x) => { x.checked = c.checked; if (c.checked) PICK.add(x.value); else PICK.delete(x.value); }); } else if (c.classList.contains('ordPick')) { if (c.checked) PICK.add(c.value); else PICK.delete(c.value); } pickBar(); });
    $('#ordL').addEventListener('click', (e) => { if (e.target.closest('input[type=checkbox]')) e.stopPropagation(); }, true);
    $('#ordNone').addEventListener('click', () => { PICK.clear(); paint(); pickBar(); });
    $('#ordDel').addEventListener('click', async () => { const ids = [...PICK]; if (!ids.length || !sure(t(`حذف ${ids.length} طلب نهائيًا؟ لا يمكن التراجع.`, `Delete ${ids.length} orders for good? This cannot be undone.`))) return;
      if (done(await api('POST', '/api/admin/orders/delete', { ids }), t('حُذفت الطلبات.', 'Orders deleted.'))) { PICK.clear(); orders(); } });
    const setT = (v) => { ordT = v; $$('#ordTy button').forEach((x) => x.setAttribute('aria-pressed', x.dataset.t === v)); }, setF = (v) => { ordF = v; $$('#ordSeg button').forEach((x) => x.setAttribute('aria-pressed', x.dataset.f === v)); };
    $('#ordTy').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { setT(b.dataset.t); paint(); } });
    $('#ordSeg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { setF(b.dataset.f); paint(); } });
    view.querySelector('.ordk').addEventListener('click', (e) => { const a = e.target.closest('a[data-ty]'); if (!a) return; e.preventDefault(); setT(a.dataset.ty); setF(a.dataset.st); paint(); $('#ordL').scrollIntoView({ block: 'start', behavior: 'smooth' }); });
    $('#ordQ').addEventListener('input', (e) => { ordQ = e.target.value; paint(); });
    $('#ordL').addEventListener('click', openOrderRow);
    /* the whole list for a spreadsheet: one row per order, with the address and the parcel for shipped ones */
    $('#ordCsv').addEventListener('click', () => csv('orders', ['order', 'date', 'kind', 'status', 'parcel', 'tracking', 'name', 'email', 'total_eur', 'pieces_eur', 'shipping_eur', 'items', 'printed_copies', 'ship_name', 'phone', 'country', 'city', 'address', 'postcode'],
      ORD.map((o) => { const s = o.ship || {}; return [o.id, o.date, otype(o), o.status, o.ship_status || '', o.tracking || '', o.name, o.email, o.total, Math.round((o.total - (o.shipping || 0)) * 100) / 100, o.shipping || 0, o.items.map((i) => (i.t || i.k) + (i.fmt === 'print' ? ' (printed x' + (i.q || 1) + ')' : '')).join(' | '), o.items.filter((i) => i.fmt === 'print').reduce((n, i) => n + (i.q || 1), 0), s.name || '', s.phone || '', s.country ? cname(s.country) : '', [s.city, s.region].filter(Boolean).join(', '), [s.line1, s.line2].filter(Boolean).join(', '), s.postal || '']; })));
  }
  async function orderSheet(id) {
    const r = await api('GET', '/api/admin/order?id=' + encodeURIComponent(id)); if (!r.ok) return toast(why(r), true); const o = r.data.order;
    sheet(o.id, `<div class="row" style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center">${stamp(o.status)}<b class="num" style="font-size:var(--fs-h2)">${price(o.total)}</b></div>
      <table class="rows"><tbody><tr><td>${t('العميل', 'Customer')}</td><td>${esc(o.name || '')}<small dir="ltr">${esc(o.email)}</small></td></tr>
      <tr><td>${t('أُنشئ', 'Created')}</td><td>${when(o.date)}</td></tr>${o.paid ? `<tr><td>${t('دُفع', 'Paid')}</td><td>${when(o.paid)}</td></tr>` : ''}
      <tr><td>PayPal</td><td class="num" dir="ltr">${esc(o.paypal_id || t('لا يوجد', 'none'))}</td></tr><tr><td>${t('حساب', 'Account')}</td><td>${o.user_id ? t('اشترى وهو مسجّل الدخول', 'Bought while signed in') : t('ضيف', 'Guest')}</td></tr></tbody></table>
      <section class="leaf"><h2>${t('القطع', 'Pieces')}</h2><table class="rows"><tbody>${o.items.map((i) => `<tr><td>${esc(AR ? i.ta || i.t : i.t || i.k)}<small>${kind(i.kind)}${i.pack ? ': ' + esc(i.pack.join(', ')) : ''}${i.gift ? ' · ' + t('هدية إلى', 'gift for') + ' ' + esc(i.gift.to) : ''}${i.fmt === 'print' ? ' · ' + t('مطبوعة', 'printed') + ' × ' + (i.q || 1) : ''}</small></td><td class="end num">${eur((i.cents || 0) / 100)}</td></tr>`).join('')}${o.ship ? `<tr><td>${t('الشحن', 'Shipping')}</td><td class="end num">${eur(o.shipping)}</td></tr>` : ''}</tbody></table></section>
      ${o.ship ? `<section class="leaf"><h2>${t('الشحن', 'Shipping')}</h2><address class="addr">${esc(o.ship.name)}<br>${esc(o.ship.line1)}${o.ship.line2 ? '<br>' + esc(o.ship.line2) : ''}<br>${esc(o.ship.city)}${o.ship.region ? ', ' + esc(o.ship.region) : ''}${o.ship.postal ? ' ' + esc(o.ship.postal) : ''}<br>${esc(cname(o.ship.country))}<br><span dir="ltr">${esc(o.ship.phone)}</span></address>
        ${o.status === 'paid' ? `<form class="form" id="shipF"><div class="two"><label class="f">${t('حالة الطرد', 'Parcel')}<select name="st">${['to_print', 'sent', 'delivered'].map((s) => `<option value="${s}"${o.ship_status === s ? ' selected' : ''}>${shipWord(s)}</option>`).join('')}</select></label><label class="f">${t('رقم التتبّع (اختياري)', 'Tracking number (optional)')}<input name="tr" value="${esc(o.tracking || '')}" dir="ltr" maxlength="120"></label></div>
        <p class="hint">${t('عند اختيار «أُرسل» نراسل العميل برقم التتبّع.', 'Choosing "sent" e-mails the customer with the tracking number.')}</p><div><button class="btn go">${t('حفظ حالة الطرد', 'Save the parcel state')}</button></div></form>` : `<div class="empty">${t('يُطبع الطلب ويُشحن بعد الدفع.', 'It is printed and shipped once paid.')}</div>`}</section>` : ''}
      <section class="leaf"><h2>${t('ملاحظة داخلية', 'Your note')}</h2><form class="form" id="noteF"><label class="f"><textarea name="note" rows="3" maxlength="2000" placeholder="${t('لا يراها العميل', 'The customer never sees it')}">${esc(o.note || '')}</textarea></label><div><button class="btn">${t('حفظ الملاحظة', 'Save the note')}</button></div></form></section>
      ${o.ship ? `<section class="leaf"><h2>${t('تعديل العنوان', 'Correct the address')}</h2><form class="form" id="addrF">
        <div class="two"><label class="f">${t('الاسم', 'Name')}<input name="name" value="${esc(o.ship.name || '')}" maxlength="80" required></label><label class="f">${t('الهاتف', 'Phone')}<input name="phone" value="${esc(o.ship.phone || '')}" maxlength="30" dir="ltr"></label></div>
        <label class="f">${t('العنوان', 'Address')}<input name="line1" value="${esc(o.ship.line1 || '')}" maxlength="120" required></label><label class="f">${t('الشقة، الطابق', 'Apartment, floor')}<input name="line2" value="${esc(o.ship.line2 || '')}" maxlength="120"></label>
        <div class="two"><label class="f">${t('المدينة', 'City')}<input name="city" value="${esc(o.ship.city || '')}" maxlength="60" required></label><label class="f">${t('الولاية', 'State')}<input name="region" value="${esc(o.ship.region || '')}" maxlength="60"></label></div>
        <div class="two"><label class="f">${t('الرمز البريدي', 'Postal code')}<input name="postal" value="${esc(o.ship.postal || '')}" maxlength="16" dir="ltr"></label><label class="f">${t('رمز البلد', 'Country code')}<input name="country" value="${esc(o.ship.country || '')}" maxlength="2" dir="ltr"></label></div>
        <div><button class="btn">${t('حفظ العنوان', 'Save the address')}</button></div></form></section>` : ''}
      <section class="leaf"><h2>${t('الملفات التي يستلمها', 'Files the buyer gets')}</h2>${o.status !== 'paid' ? `<div class="empty">${t('تُتاح الملفات بعد الدفع.', 'Files open once the order is paid.')}</div>` : o.files.length ? `<ul class="files" style="border:0">${o.files.map((f) => `<li><span>${esc(f.name)}</span><span class="hint num">${size(f.size)}</span></li>`).join('')}</ul>` : `<div class="empty">${t('لا ملفات مرفوعة لهذه القطع بعد. ارفعوها من صفحة المنتجات.', 'No files uploaded for these pieces yet. Upload them from Products.')}</div>`}</section>`,
      /* the sheet's foot in three plain groups: talk to the customer, change the order's state, and (apart, at the end) delete it */
      `<div class="ftg"><small>${t('العميل', 'Customer')}</small><div><a class="btn sm" href="mailto:${esc(o.email)}?subject=${encodeURIComponent('Mass & Grass · ' + o.id)}">${t('راسلوه', 'E-mail them')}</a>${o.status === 'paid' ? `<button type="button" class="btn sm" data-resend>${t('أعيدوا رسالة الطلب', 'Resend order e-mail')}</button>` : ''}</div></div>
       <div class="ftg"><small>${t('حالة الطلب', 'Order state')}</small><div>${o.status === 'pending' && o.paypal_id ? `<button type="button" class="btn sm" data-check>${t('اسألوا PayPal', 'Ask PayPal')}</button>` : ''}${['paid', 'refunded', 'cancelled'].filter((s) => s !== o.status).map((s) => `<button type="button" class="btn sm ${s === 'paid' ? 'go' : ''}" data-st="${s}">${t(...{ paid: ['مدفوع', 'Paid'], refunded: ['مُستردّ', 'Refunded'], cancelled: ['ملغى', 'Cancelled'] }[s])}</button>`).join('')}</div></div>
       <div class="ftg end"><small>&nbsp;</small><div><button type="button" class="btn sm warn" data-del-order>${t('احذفوا الطلب', 'Delete order')}</button></div></div>`);
    $('#noteF').addEventListener('submit', async (e) => { e.preventDefault(); done(await api('PUT', '/api/admin/orders/note', { id: o.id, note: e.target.note.value }), t('حُفظت الملاحظة.', 'Note saved.')); });
    const af = $('#addrF'); if (af) af.addEventListener('submit', async (e) => { e.preventDefault(); const g = (k) => af[k].value.trim();
      done(await api('PUT', '/api/admin/orders/address', { id: o.id, ship: { name: g('name'), phone: g('phone'), line1: g('line1'), line2: g('line2'), city: g('city'), region: g('region'), postal: g('postal'), country: g('country').toUpperCase() } }), t('حُفظ العنوان.', 'Address saved.')); });
    const sf = $('#shipF'); if (sf) sf.addEventListener('submit', async (e) => { e.preventDefault();
      if (done(await api('PUT', '/api/admin/orders/ship', { id: o.id, status: sf.st.value, tracking: sf.tr.value.trim() }))) { dlg.close(); route(); } });
    dlg.querySelector('.sh-ft').addEventListener('click', async (e) => {
      if (e.target.closest('[data-resend]')) { done(await api('POST', '/api/admin/orders/resend', { id: o.id }), t('أُعيد إرسال الرسالة.', 'The e-mail was sent again.')); return; }
      if (e.target.closest('[data-del-order]')) { if (!sure(t('حذف هذا الطلب نهائيًا؟ لا يمكن التراجع.', 'Delete this order for good? This cannot be undone.'))) return;
        if (done(await api('POST', '/api/admin/orders/delete', { ids: [o.id] }), t('حُذف الطلب.', 'Order deleted.'))) { dlg.close(); route(); } return; }
      if (e.target.closest('[data-check]')) { const r = await api('POST', '/api/admin/orders/check', { id: o.id });
        if (r.ok && r.data.order) { toast(t('الدفع تمّ وأُرسلت الملفات.', 'Paid: the files were sent.')); dlg.close(); route(); }
        else toast(r.status === 202 ? t('PayPal ما زال يراجع الدفع.', 'PayPal is still reviewing the payment.') : t('لم يُدفع هذا الطلب بعد.', 'This order has not been paid.'), r.status !== 202); return; }
      const b = e.target.closest('[data-st]'); if (!b) return;
      if (b.dataset.st === 'paid' && !sure(t('تسجيل الطلب مدفوعًا يرسل الملفات للعميل. متأكدون أن المبلغ وصل؟', 'Marking it paid sends the files to the customer. Has the money arrived?'))) return;
      if (done(await api('PUT', '/api/admin/orders', { id: o.id, status: b.dataset.st }))) { dlg.close(); route(); }
    });
  }

  /* =====================================================================
     3 · Products (and the files buyers receive)
     ===================================================================== */
  let prodK = 'painting', PRODS = [], FILES = {};
  async function products() {
    head(t('المنتجات', 'Products'), '', `<button type="button" class="btn" id="pBulk">${t('رفع ملفات كثيرة', 'Upload many files')}</button><button type="button" class="btn go" id="pAdd">${t('أضيفوا قطعة', 'Add a piece')}</button>`); loading();
    const [a, f, s] = await Promise.all([api('GET', '/api/admin/products'), api('GET', '/api/admin/files'), api('GET', '/api/admin/settings')]); if (!a.ok) return;
    PRODS = a.data.products; FILES = {}; (f.data.files || []).forEach((x) => (FILES[x.kind + ':' + x.product_id] = x)); const prices = (s.data && s.data.prices) || {};
    $('#sub').textContent = `${num(PRODS.length)} ${t('قطعة', 'pieces')}, ${num(PRODS.filter((p) => !FILES[p.kind + ':' + p.id]).length)} ${t('بلا ملف', 'without a file')}`;
    const calF = FILES['calendar:current'];
    view.innerHTML = `<div class="bar"><div class="seg" id="pSeg">${Object.keys(KINDS).map((k) => `<button type="button" data-k="${k}" aria-pressed="${k === prodK}">${t(...KINDS[k])} <span class="num">${PRODS.filter((p) => p.kind === k).length}</span></button>`).join('')}<button type="button" data-k="calendar" aria-pressed="${prodK === 'calendar'}">${t('التقويم', 'Calendar')}</button><button type="button" data-k="book" aria-pressed="${prodK === 'book'}">${t('الكتاب', 'Book')}</button></div>
      <label class="chk"><input type="checkbox" id="pNoFile"> ${t('بلا ملف فقط', 'Only without a file')}</label></div><div id="pL"></div>`;
    const paint = () => {
      if (prodK === 'calendar') return ($('#pL').innerHTML = `<section class="leaf"><div class="hd"><h2>${t('تقويم 2027: أشياء نحفظها في قوارير', 'Calendar 2027: Things kept in bottles')}</h2><span class="num">${eur(prices.calendar || 0)}</span></div><div class="in form"><p class="hint">${t('التقويم قطعة واحدة: ملف PDF واحد يستلمه كل من يشتريه. السعر من الإعدادات.', 'The calendar is one piece: one PDF every buyer receives. Its price is in Settings.')}</p><div id="calFiles"></div></div></section><section class="leaf"><div class="hd"><h2>${t('تقويم فلسطين: رحلة عبر الزمان والمكان (نسخة 2027)', 'Palestine: a journey through time and space (2027 edition)')}</h2><span class="num">${eur(prices.calendar || 0)}</span></div><div class="in form"><p class="hint">${t('تقويم 2026 بتواريخ 2027. ملف PDF واحد، وسعره سعر التقويم في الإعدادات.', 'The 2026 calendar set for 2027. One PDF; it costs the calendar price in Settings.')}</p><div id="psFiles"></div></div></section><section class="leaf"><div class="hd"><h2>${t('تقويم أماكن من غزة (نسخة 2027)', 'Places in Gaza (2027 edition)')}</h2><span class="num">${eur(prices.calendar || 0)}</span></div><div class="in form"><p class="hint">${t('تقويم 2025 بتواريخ 2027. ملف PDF واحد، وسعره سعر التقويم في الإعدادات.', 'The 2025 calendar set for 2027. One PDF; it costs the calendar price in Settings.')}</p><div id="gzFiles"></div></div></section>`, filesBox($('#calFiles'), 'calendar', 'current'), filesBox($('#psFiles'), 'calendar', 'palestine-2027'), filesBox($('#gzFiles'), 'calendar', 'gaza-2027'));
      if (prodK === 'book') return bookPanel($('#pL'), prices);
      const only = $('#pNoFile').checked, L = PRODS.filter((p) => p.kind === prodK && (!only || !FILES[p.kind + ':' + p.id]));
      $('#pL').innerHTML = L.length ? `<div class="shelf">${L.map((p) => { const fl = FILES[p.kind + ':' + p.id]; return `<button type="button" class="pc${p.hidden ? ' hid' : ''}" data-id="${esc(p.id)}"><span class="im"><img src="${esc(pimg(p))}" alt="" loading="lazy"></span><span class="tx"><b>${esc(AR ? p.title_ar || p.title_en : p.title_en)}</b><span class="mt"><span class="num">${p.price === 0 ? `<span class="tag on">${t('مجاني', 'Free')}</span>` : eur(p.price != null ? p.price : prices[p.kind] || 0)}</span>${p.sale ? `<span class="tag on">-${p.sale}%</span>` : ''}${p.is_new ? `<span class="tag">${t('جديدة', 'New')}</span>` : ''}${p.hidden ? `<span class="tag">${t('مخفية', 'Hidden')}</span>` : ''}<span class="tag ${fl ? 'on' : 'off'}">${fl ? fl.n + ' ' + t('ملف', 'files') : t('بلا ملف', 'No file')}</span></span><span class="mt">${t('بيع', 'Sold')} <span class="num">${num(p.sold)}</span></span></span></button>`; }).join('')}</div>` : `<div class="leaf empty">${t('لا قطع هنا.', 'Nothing here.')}</div>`;
    };
    paint();
    $('#pSeg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; prodK = b.dataset.k; $$('#pSeg button').forEach((x) => x.setAttribute('aria-pressed', x === b)); paint(); });
    $('#pNoFile').addEventListener('change', paint);
    $('#pL').addEventListener('click', (e) => { const b = e.target.closest('.pc'); if (b) productSheet(PRODS.find((p) => p.id === b.dataset.id && p.kind === prodK)); });
    $('#pAdd').addEventListener('click', () => productSheet(null));
    $('#pBulk').addEventListener('click', bulkSheet);
  }

  /* ---------- many files at once: each named <kind>__<id>.<ext> (painting__hero.pdf, book__zero-waste.pdf, calendar__palestine-2027.pdf) ---------- */
  const FKINDS = ['painting', 'postcard', 'sticker', 'design', 'calendar', 'book'];
  async function bulkSheet() {
    const bk = await api('GET', '/api/admin/book'), bookId = (bk.data && bk.data.id) || 'zero-waste';
    const CAL = { 'calendar-2027': 'current', current: 'current', 'palestine-2027': 'palestine-2027', 'gaza-2027': 'gaza-2027' };
    let rows = [];
    const match = (f) => {
      const m = f.name.match(/^([a-z]+)__([a-z0-9-]{2,40})\.(pdf|png|jpe?g|webp|zip)$/i);
      if (!m) return { f, err: t('الاسم لا يتبع النمط kind__id.ext', 'The name is not kind__id.ext') };
      const kind = m[1].toLowerCase(), id = m[2].toLowerCase(), ext = m[3].toLowerCase();
      if (!FKINDS.includes(kind)) return { f, err: t('قسم غير معروف: ', 'Unknown kind: ') + kind };
      if (f.size > 45 * 1048576) return { f, err: t('أكبر من 45 MB', 'Over 45 MB') };
      if (kind === 'calendar') return CAL[id] ? { f, kind, pid: CAL[id], name: (id === 'palestine-2027' ? 'Palestine 2027' : id === 'gaza-2027' ? 'Places in Gaza 2027' : 'Calendar 2027') + '.' + ext } : { f, err: t('لا تقويم بهذا المعرّف', 'No calendar with that id') };
      if (kind === 'book') return id === bookId ? { f, kind, pid: id, name: 'Zero Waste.' + ext } : { f, err: t('معرّف الكتاب هو ', 'The book’s id is ') + bookId };
      const pr = PRODS.find((x) => x.kind === kind && x.id === id);
      return pr ? { f, kind, pid: id, name: (pr.title_en || id).replace(/[^\w.\- ()]/g, '_') + '.' + ext } : { f, err: t('لا قطعة بهذا المعرّف', 'No piece with that id') };
    };
    const list = () => rows.length ? rows.map((r, i) => `<li data-i="${i}"><span><b dir="ltr">${esc(r.f.name)}</b> <span class="hint num">${size(r.f.size)}</span>${r.kind ? `<br><span class="hint">${kind(r.kind)} · <span dir="ltr">${esc(r.pid)}</span></span>` : ''}</span><span class="msgl${r.ok ? ' ok' : ''}">${esc(r.err || r.st || t('جاهز', 'Ready'))}</span></li>`).join('') : `<li><span class="hint">${t('لم تُختر ملفات بعد.', 'No files chosen yet.')}</span></li>`;
    sheet(t('رفع ملفات كثيرة', 'Upload many files'), `<form class="form" id="buF"><p class="hint">${t('سمّوا كل ملف باسم قسمه ومعرّفه: painting__hero.pdf أو sticker__s-lemons.png أو calendar__palestine-2027.pdf أو book__', 'Name each file by its kind and id: painting__hero.pdf, sticker__s-lemons.png, calendar__palestine-2027.pdf or book__')}${esc(bookId)}.pdf</p>
      <label class="f">${t('الملفات', 'Files')}<input type="file" id="buIn" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.zip"></label><ul class="files" id="buL">${list()}</ul><p class="msgl" id="buMsg" role="status" aria-live="polite"></p></form>`,
      `<span></span><button type="submit" form="buF" class="btn go">${t('ارفعوها', 'Upload them')}</button>`);
    $('#buIn').addEventListener('change', (e) => { rows = [...e.target.files].map(match); $('#buL').innerHTML = list(); $('#buMsg').textContent = `${rows.filter((r) => !r.err).length} ${t('من', 'of')} ${rows.length} ${t('جاهزة للرفع', 'ready to upload')}`; });
    $('#buF').addEventListener('submit', async (e) => {
      e.preventDefault(); const go = rows.filter((r) => !r.err && !r.ok); if (!go.length) return; const btn = dlg.querySelector('[type=submit]'); btn.disabled = true; let n = 0;
      for (const r of go) {
        r.st = t('جارٍ الرفع…', 'Uploading…'); $('#buL').innerHTML = list();
        const res = await api('POST', `/api/admin/files?kind=${r.kind}&pid=${encodeURIComponent(r.pid)}&name=${encodeURIComponent(r.name)}`, null, { body: r.f, type: r.f.type || 'application/octet-stream' });
        if (res.ok) { r.ok = true; r.st = t('رُفع', 'Uploaded'); n++; } else { r.err = why(res); }
        $('#buL').innerHTML = list(); $('#buMsg').textContent = `${n} / ${go.length}`;
      }
      btn.disabled = false; toast(`${n} ${t('ملف رُفع', 'files uploaded')}`, n < go.length);
    });
    dlg.addEventListener('close', () => { if (rows.some((r) => r.ok) && location.hash.startsWith('#products')) products(); }, { once: true });
  }

  /* ---------- the book: the owner's PDF becomes the preview pages on the site and the file buyers receive ---------- */
  let pdfLib = null;
  function loadPdf() {
    if (pdfLib) return pdfLib;
    pdfLib = new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'vendor/pdf.min.js'; s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js'; ok(window.pdfjsLib); }; s.onerror = () => { pdfLib = null; no(new Error('pdfjs')); }; document.head.append(s); });
    return pdfLib;
  }
  async function pageWebp(pdf, i, tall) {
    const page = await pdf.getPage(i), vp0 = page.getViewport({ scale: 1 }), vp = page.getViewport({ scale: tall / vp0.height });
    const c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    await page.render({ canvasContext: g, viewport: vp }).promise;
    for (const q of [0.84, 0.74, 0.62, 0.5]) { const b = await new Promise((r) => c.toBlob(r, 'image/webp', q)); if (b && b.type === 'image/webp' && b.size < 1.7e6) return { blob: b, ratio: vp0.width / vp0.height }; }
    throw new Error('too_big');
  }
  async function bookPanel(box, prices) {
    const r = await api('GET', '/api/admin/book'), B = (r.data && r.data.book) || {}, id = (r.data && r.data.id) || 'zero-waste';
    const v = (k, d) => esc(B[k] != null ? B[k] : d);
    box.innerHTML = `<div class="cols even"><section class="leaf"><div class="hd"><h2>${t('الكتاب', 'The book')}</h2><span class="num">${eur(prices.book || 0)}</span></div>
      <form class="in form" id="bkF">
        <div class="two"><label class="f">${t('العنوان بالعربية', 'Title in Arabic')}<input name="title_ar" dir="rtl" maxlength="120" value="${v('title_ar', 'صفر نفايات وأجدادنا الفلسطينيون')}"></label><label class="f">${t('العنوان بالإنجليزية', 'Title in English')}<input name="title_en" dir="ltr" maxlength="120" value="${v('title_en', 'Zero Waste & Our Palestinian Ancestors')}"></label></div>
        <div class="two"><label class="f">${t('المؤلفون بالعربية', 'Credit in Arabic')}<input name="credit_ar" dir="rtl" maxlength="160" value="${v('credit_ar', 'النص: نجلاء عبد اللطيف، الرسوم: فرح الحلو')}"></label><label class="f">${t('المؤلفون بالإنجليزية', 'Credit in English')}<input name="credit_en" dir="ltr" maxlength="160" value="${v('credit_en', 'Text: Najla Abdellatif, drawings: Farah Al-Helou')}"></label></div>
        <div class="two"><label class="f">${t('صفحات المعاينة (مع الغلاف)', 'Preview pages (with the cover)')}<input name="preview" type="number" min="2" max="24" value="${B.imgs ? B.imgs.length : 8}" dir="ltr"></label><label class="f">${t('اتجاه الكتاب', 'The book reads')}<select name="dir"><option value="ltr"${B.dir !== 'rtl' ? ' selected' : ''}>${t('من اليسار إلى اليمين', 'Left to right')}</option><option value="rtl"${B.dir === 'rtl' ? ' selected' : ''}>${t('من اليمين إلى اليسار', 'Right to left')}</option></select></label></div>
        <label class="f">${t('ملف الكتاب PDF (حتى 45 MB)', 'The book as a PDF (up to 45 MB)')}<input type="file" name="pdf" accept="application/pdf,.pdf"></label>
        <p class="hint">${t('يقرأ المتصفح الملف هنا: يرسم الغلاف وصفحات المعاينة صورًا تظهر في الموقع، ثم يرفع الملف كاملًا ليستلمه من يشتري الكتاب. السعر من الإعدادات.', 'Your browser reads the PDF here: it draws the cover and the preview pages as pictures for the site, then uploads the whole PDF for buyers. The price is in Settings.')}</p>
        <ul class="files" id="bkP" hidden></ul><p class="msgl" id="bkM" role="status" aria-live="polite"></p>
        <div><button class="btn go">${t('انشروا الكتاب', 'Publish the book')}</button></div></form></section>
      <section class="leaf"><div class="hd"><h2>${t('في الموقع الآن', 'On the site now')}</h2><span class="num">${B.imgs ? `${B.imgs.length} / ${B.pages}` : t('صفحات مؤقتة', 'Placeholder pages')}</span></div>
        <div class="in">${B.imgs ? `<div class="bk-thumbs">${B.imgs.map((s) => `<img src="../${esc(s)}" alt="" loading="lazy">`).join('')}</div>` : `<p class="hint">${t('يعرض الموقع ثماني صفحات مؤقتة حتى تنشروا الكتاب.', 'The site shows eight placeholder pages until you publish the book.')}</p>`}
        <div id="bkFiles" style="margin-top:16px"></div></div></section></div>`;
    filesBox($('#bkFiles'), 'book', id);
    $('#bkF').addEventListener('submit', async (e) => {
      e.preventDefault(); const f = e.target, msg = $('#bkM'), P = $('#bkP'), file = f.pdf.files[0], btn = f.querySelector('button');
      const step = (txt, ok) => { P.hidden = false; P.insertAdjacentHTML('beforeend', `<li><span>${esc(txt)}</span><span class="msgl${ok === false ? '' : ' ok'}">${ok === false ? '✕' : ok ? '✓' : '…'}</span></li>`); return P.lastElementChild; };
      const set = (li, ok) => { li.lastElementChild.textContent = ok ? '✓' : '✕'; li.lastElementChild.className = 'msgl' + (ok ? ' ok' : ''); };
      const body = { title_en: f.title_en.value.trim(), title_ar: f.title_ar.value.trim(), credit_en: f.credit_en.value.trim(), credit_ar: f.credit_ar.value.trim(), dir: f.dir.value, imgs: B.imgs, pages: B.pages, ratio: B.ratio };
      if (!file && !B.imgs) { msg.textContent = t('اختاروا ملف الكتاب أولًا.', 'Choose the book’s PDF first.'); return; }
      if (file && (file.size > 45 * 1048576 || !/pdf$/i.test(file.type || file.name))) { msg.textContent = t('ملف PDF حتى 45 MB فقط.', 'A PDF of up to 45 MB only.'); return; }
      btn.disabled = true; P.innerHTML = ''; msg.textContent = '';
      try {
        if (file) {
          let li = step(t('قراءة الملف', 'Reading the PDF')); const lib = await loadPdf(); const pdf = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise; set(li, true);
          const n = Math.max(2, Math.min(24, parseInt(f.preview.value) || 8, pdf.numPages)), stamp = Date.now(), imgs = []; let ratio = 0.75;
          for (let i = 1; i <= n; i++) {
            li = step(`${i === 1 ? t('الغلاف', 'The cover') : t('الصفحة', 'Page') + ' ' + i} / ${n}`);
            const pg = await pageWebp(pdf, i, 1100); if (i === 1) ratio = pg.ratio;
            const key = 'u-book-pg-' + String(i).padStart(2, '0'), up = await api('POST', `/api/admin/image?key=${key}&name=${encodeURIComponent('Book page ' + i)}`, null, { body: pg.blob, type: 'image/webp' });
            if (!up.ok) { set(li, false); throw new Error(why(up)); } set(li, true); imgs.push(`assets/${key}.webp?v=${stamp}`);
          }
          Object.assign(body, { imgs, pages: pdf.numPages, ratio });
        }
        let li = step(t('حفظ بيانات الكتاب', 'Saving the book’s details')); const sv = await api('PUT', '/api/admin/book', body); if (!sv.ok) { set(li, false); throw new Error(why(sv)); } set(li, true);
        if (file) {
          li = step(t('رفع الملف كاملًا للمشترين', 'Uploading the whole PDF for buyers'));
          const old = ((await api('GET', `/api/admin/files?kind=book&pid=${id}`)).data.files || []);
          const up = await api('POST', `/api/admin/files?kind=book&pid=${id}&name=${encodeURIComponent(file.name)}`, null, { body: file, type: 'application/pdf' });
          if (!up.ok) { set(li, false); throw new Error(why(up)); } set(li, true);
          for (const o of old) await api('DELETE', '/api/admin/files?id=' + o.id); // the new PDF replaces the old one
        }
        toast(t('نُشر الكتاب.', 'The book is published.')); bookPanel(box, prices);
      } catch (er) { msg.textContent = er.message === 'pdfjs' ? t('تعذّر تحميل قارئ PDF.', 'The PDF reader did not load.') : er.message || t('لم يتم.', 'That did not work.'); btn.disabled = false; }
    });
  }
  async function filesBox(box, k, pid) {
    const r = await api('GET', `/api/admin/files?kind=${k}&pid=${encodeURIComponent(pid)}`), L = (r.data && r.data.files) || [];
    box.innerHTML = `<label class="f">${t('الملفات التي يستلمها المشتري (PDF، PNG، ZIP حتى 45 MB)', 'Files the buyer receives (PDF, PNG, ZIP up to 45 MB)')}</label>
      ${L.length ? `<ul class="files">${L.map((f) => `<li><span>${esc(f.name)} <span class="hint num">${size(f.size)}</span></span><button type="button" class="btn sm warn" data-del="${esc(f.id)}">${t('حذف', 'Delete')}</button></li>`).join('')}</ul>` : `<p class="hint" style="margin:0">${t('لا ملفات بعد: من يشتري هذه القطعة لن يستلم شيئًا حتى ترفعوا ملفها.', 'No files yet: a buyer gets nothing until its file is here.')}</p>`}
      <div class="row" style="margin-top:8px"><input type="file" data-up accept=".pdf,.png,.jpg,.jpeg,.webp,.zip" aria-label="${t('ارفعوا ملفًا', 'Upload a file')}"><span class="msgl" data-msg></span></div>`;
    box.onclick = async (e) => { const b = e.target.closest('[data-del]'); if (b && sure(t('حذف هذا الملف؟', 'Delete this file?'))) { done(await api('DELETE', '/api/admin/files?id=' + b.dataset.del), t('حُذف الملف.', 'File deleted.')); filesBox(box, k, pid); } };
    box.querySelector('[data-up]').onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return; const m = box.querySelector('[data-msg]'); m.className = 'msgl ok'; m.textContent = t('جارٍ الرفع…', 'Uploading…');
      const r2 = await api('POST', `/api/admin/files?kind=${k}&pid=${encodeURIComponent(pid)}&name=${encodeURIComponent(f.name)}`, null, { body: f, type: f.type || 'application/octet-stream' });
      if (done(r2, t('رُفع الملف.', 'File uploaded.'))) filesBox(box, k, pid); else { m.className = 'msgl'; m.textContent = why(r2); }
    };
  }
  function productSheet(p) {
    const isNew = !p, x = p || { kind: KINDS[prodK] ? prodK : 'painting', id: '', title_en: '', title_ar: '', place_en: '', place_ar: '', story_en: '', story_ar: '', price: null, sale: 0, is_new: true, hidden: false, sort: 0, extra: {} };
    const v = (n) => esc(x[n] ?? ''), PRT = (x.extra && x.extra.print) || {};
    sheet(isNew ? t('قطعة جديدة', 'A new piece') : (AR ? x.title_ar || x.title_en : x.title_en), `<form class="form" id="pf">
      ${isNew ? `<div class="two"><label class="f">${t('القسم', 'Shelf')}<select name="kind">${Object.keys(KINDS).map((k) => `<option value="${k}"${k === x.kind ? ' selected' : ''}>${t(...KINDS[k])}</option>`).join('')}</select></label>
        <label class="f">${t('الصورة (تُحوَّل إلى WebP)', 'Image (converted to WebP)')}<input type="file" name="img" accept="image/*" required></label></div>` : `<div class="row"><span class="thumb" style="width:72px;height:72px"><img src="${esc(pimg(x))}" alt=""></span><span class="hint">${kind(x.kind)} · <span class="num" dir="ltr">${esc(x.id)}</span><br>${t('لتغيير الصورة استعملوا مكتبة الصور.', 'To change the image use the image library.')}</span></div>`}
      <div class="two"><label class="f">${t('الاسم بالعربية', 'Title in Arabic')}<input type="text" name="title_ar" value="${v('title_ar')}" dir="rtl" maxlength="80"></label><label class="f">${t('الاسم بالإنجليزية', 'Title in English')}<input type="text" name="title_en" value="${v('title_en')}" dir="ltr" maxlength="80" required></label></div>
      <div class="two"><label class="f">${t('المكان بالعربية', 'Place in Arabic')}<input type="text" name="place_ar" value="${v('place_ar')}" dir="rtl" maxlength="80"></label><label class="f">${t('المكان بالإنجليزية', 'Place in English')}<input type="text" name="place_en" value="${v('place_en')}" dir="ltr" maxlength="80"></label></div>
      <div class="three"><label class="f">${t('السعر باليورو (فارغ = سعر القسم، 0 = مجاني)', 'Price in euro (empty = shelf price, 0 = free)')}<input type="number" name="price" value="${x.price ?? ''}" min="0" step="0.5" dir="ltr"></label><label class="f">${t('خصم %', 'Discount %')}<input type="number" name="sale" value="${x.sale || 0}" min="0" max="90" dir="ltr"></label>
        <label class="f">${t('شكل الملصق', 'Sticker cut')}<select name="shape"><option value="">${t('لا ينطبق', 'n/a')}</option>${[['die', 'مقصوص على الرسم', 'Die-cut'], ['round', 'دائري', 'Round'], ['rect', 'مستطيل', 'Rectangle']].map((s) => `<option value="${s[0]}"${(x.extra || {}).shape === s[0] ? ' selected' : ''}>${t(s[1], s[2])}</option>`).join('')}</select></label></div>
      <div class="row"><label class="chk"><input type="checkbox" name="is_new"${x.is_new ? ' checked' : ''}> ${t('جديدة', 'New')}</label><label class="chk"><input type="checkbox" name="hidden"${x.hidden ? ' checked' : ''}> ${t('مخفية عن الزوار', 'Hidden from visitors')}</label></div>
      ${x.kind === 'sticker' ? '' : `<fieldset class="f print"><legend>${t('النسخة المطبوعة', 'The printed copy')}</legend><label class="chk"><input type="checkbox" name="pr_on"${PRT.on ? ' checked' : ''}> ${t('نطبعها ونشحنها', 'We print and ship it')}</label>
        <div class="three"><label class="f">${t('سعر المطبوعة باليورو', 'Printed price in euro')}<input type="number" name="pr_price" value="${PRT.price ?? ''}" min="0.5" step="0.5" dir="ltr"></label><label class="f">${t('المقاس بالعربية', 'Size in Arabic')}<input type="text" name="pr_size_ar" value="${esc(PRT.size_ar || '')}" dir="rtl" maxlength="60" placeholder="30 × 40 سم"></label><label class="f">${t('المقاس بالإنجليزية', 'Size in English')}<input type="text" name="pr_size" value="${esc(PRT.size || '')}" dir="ltr" maxlength="60" placeholder="30 × 40 cm"></label></div>
        <p class="hint">${t('الشحن يُضاف عند الشراء حسب البلد، وتُضبط أجوره من الإعدادات.', 'Shipping is added at checkout by country; set the fees in Settings.')}</p></fieldset>`}
      ${isNew ? '' : '<div id="pfFiles"></div>'}<p class="msgl" id="pfMsg" role="alert"></p></form>`,
      `${isNew ? '<span></span>' : `<button type="button" class="btn warn" id="pDel">${t('حذف القطعة', 'Delete the piece')}</button>`}<button type="submit" form="pf" class="btn go">${isNew ? t('أضيفوها', 'Add it') : t('حفظ', 'Save')}</button>`);
    if (!isNew) filesBox($('#pfFiles'), x.kind, x.id);
    $('#pf').addEventListener('submit', async (e) => {
      e.preventDefault(); const f = e.target, msg = $('#pfMsg'), say = (m) => { msg.textContent = m; };
      const body = { id: x.id, kind: isNew ? f.kind.value : x.kind, title_en: f.title_en.value.trim(), title_ar: f.title_ar.value.trim(), place_en: f.place_en.value.trim() || 'Gaza', place_ar: f.place_ar.value.trim() || 'غزة', story_en: x.story_en || '', story_ar: x.story_ar || '',
        price: f.price.value, sale: f.sale.value, is_new: f.is_new.checked, hidden: f.hidden.checked, sort: x.sort || 0, extra: Object.assign({}, x.extra, f.shape.value ? { shape: f.shape.value } : {}) };
      if (f.pr_on) { const pp = Number(f.pr_price.value); if (f.pr_on.checked && !(pp > 0)) return say(t('اكتبوا سعر النسخة المطبوعة.', 'Give the printed copy a price.'));
        body.extra.print = { on: f.pr_on.checked, price: pp > 0 ? pp : null, size: f.pr_size.value.trim(), size_ar: f.pr_size_ar.value.trim() }; }
      if (isNew) {
        say(t('جارٍ تجهيز الصورة…', 'Preparing the image…')); let blob; try { blob = await toWebp(f.img.files[0]); } catch (er) { return say(t('الصورة كبيرة جدًا أو لا تُقرأ.', 'The image is too big or unreadable.')); }
        const up = await api('POST', '/api/admin/image?name=' + encodeURIComponent(f.img.files[0].name), null, { body: blob, type: 'image/webp' }); if (!up.ok) return say(why(up));
        body.id = up.data.key;
      }
      const r = await api(isNew ? 'POST' : 'PUT', '/api/admin/products', body); if (!r.ok) return say(why(r));
      toast(t('تم الحفظ.', 'Saved.')); dlg.close(); if (isNew) prodK = body.kind; products();
    });
    const del = $('#pDel'); if (del) del.addEventListener('click', async () => { if (!sure(t('حذف هذه القطعة من المتجر؟ تبقى في الطلبات السابقة.', 'Delete this piece from the shop? Past orders keep it.'))) return; if (done(await api('DELETE', `/api/admin/products?id=${encodeURIComponent(x.id)}&kind=${x.kind}`), t('حُذفت القطعة.', 'Piece deleted.'))) { dlg.close(); products(); } });
  }

  /* =====================================================================
     4 · Customers   5 · Subscribers   6 · Messages
     ===================================================================== */
  async function customers() {
    head(t('العملاء', 'Customers'), '', `<button type="button" class="btn" id="cCsv">${t('تنزيل CSV', 'Download CSV')}</button>`); loading();
    const r = await api('GET', '/api/admin/customers'); if (!r.ok) return; const L = r.data.customers; $('#sub').textContent = `${num(L.length)} ${t('حساب', 'accounts')}`;
    view.innerHTML = `<section class="leaf">${L.length ? `<div class="scroll"><table class="rows"><thead><tr><th>${t('العميل', 'Customer')}</th><th>${t('الدخول', 'Signs in with')}</th><th>${t('انضم', 'Joined')}</th><th>${t('آخر دخول', 'Last sign-in')}</th><th class="end">${t('طلبات', 'Orders')}</th><th class="end">${t('أنفق', 'Spent')}</th><th></th></tr></thead><tbody>${L.map((c) => `<tr><td><span class="who"><span class="av">${esc((c.name || c.email)[0].toUpperCase())}</span><span>${esc(c.name)} ${c.role === 'admin' ? `<span class="tag on">${t('الإدارة', 'Admin')}</span>` : ''}<small dir="ltr">${esc(c.email)}</small></span></span></td><td>${c.via === 'google' ? 'Google' : t('بريد وكلمة سر', 'E-mail and password')}${c.twofa ? ` <span class="tag on">${t('خطوتان', '2-step')}</span>` : ''}</td><td class="tight">${day(c.joined)}</td><td class="tight">${c.last ? when(c.last) : '<span class="hint">—</span>'}</td><td class="end num">${num(c.orders)}</td><td class="end num"><b>${eur(c.spent)}</b></td><td class="tight end">${c.role === 'admin' ? '' : `<button type="button" class="btn sm warn" data-del="${esc(c.id)}">${t('حذف', 'Delete')}</button>`}</td></tr>`).join('')}</tbody></table></div>` : `<div class="empty">${t('لا حسابات بعد.', 'No accounts yet.')}</div>`}</section>`;
    view.onclick = async (e) => { const b = e.target.closest('[data-del]'); if (b && sure(t('حذف هذا الحساب نهائيًا؟', 'Delete this account for good?'))) { done(await api('DELETE', '/api/admin/customers?id=' + b.dataset.del), t('حُذف الحساب.', 'Account deleted.')); customers(); } };
    $('#cCsv').addEventListener('click', () => csv('customers', ['name', 'email', 'via', 'joined', 'orders', 'spent_eur'], L.map((c) => [c.name, c.email, c.via, c.joined, c.orders, c.spent])));
  }
  async function subscribers() {
    head(t('مشتركو البريد', 'Subscribers'), '', `<button type="button" class="btn" id="sCsv">${t('تنزيل CSV', 'Download CSV')}</button>`); loading();
    const r = await api('GET', '/api/admin/subscribers'); if (!r.ok) return; const L = r.data.subscribers; $('#sub').textContent = `${num(L.length)} ${t('مشترك في رسائل الأعمال الجديدة', 'signed up for new pieces by e-mail')}`;
    const SRC = { footer: ['أسفل الموقع', 'Footer form'], soon: ['صفحة «قريبًا»', 'Coming-soon page'], checkout: ['عند الشراء', 'At checkout'] };
    view.innerHTML = `<section class="leaf">${L.length ? `<div class="scroll"><table class="rows"><thead><tr><th>${t('البريد', 'E-mail')}</th><th>${t('من أين', 'Where from')}</th><th>${t('متى', 'When')}</th><th></th></tr></thead><tbody>${L.map((s) => `<tr><td dir="ltr" style="text-align:start"><b>${esc(s.email)}</b></td><td>${t(...(SRC[s.source] || [s.source, s.source]))}</td><td class="tight">${day(s.date)}</td><td class="tight end"><button type="button" class="btn sm warn" data-del="${esc(s.email)}">${t('إزالة', 'Remove')}</button></td></tr>`).join('')}</tbody></table></div>` : `<div class="empty">${t('لا مشتركين بعد.', 'No subscribers yet.')}</div>`}</section>`;
    view.onclick = async (e) => { const b = e.target.closest('[data-del]'); if (b && sure(t('إزالة هذا البريد من القائمة؟', 'Remove this address from the list?'))) { done(await api('DELETE', '/api/admin/subscribers?email=' + encodeURIComponent(b.dataset.del)), t('أُزيل.', 'Removed.')); subscribers(); } };
    $('#sCsv').addEventListener('click', () => csv('subscribers', ['email', 'source', 'date'], L.map((s) => [s.email, s.source, s.date])));
  }
  async function messages() {
    head(t('الرسائل', 'Messages'), t('ما يكتبه الزوار في صفحة المساعدة', 'What visitors write on the help page')); loading();
    const r = await api('GET', '/api/admin/messages'); if (!r.ok) return; const L = r.data.messages; badge('messages', L.filter((m) => !m.read).length);
    view.innerHTML = `<section class="leaf">${L.length ? L.map((m) => `<article class="msg${m.read ? '' : ' new'}"><div class="hdr"><span><b>${esc(m.name || m.email)}</b> <span class="hint" dir="ltr">${esc(m.email)}</span>${m.topic ? ` <span class="tag">${esc(m.topic)}</span>` : ''}</span><span class="hint">${when(m.date)}${m.mailed ? '' : ' · ' + t('لم تُرسل بالبريد', 'not e-mailed')}</span></div><p class="bidi">${esc(m.body)}</p>
      <div class="acts"><a class="btn sm go" href="mailto:${esc(m.email)}?subject=${encodeURIComponent('Re: ' + (m.topic || 'Mass & Grass'))}">${t('ردّوا بالبريد', 'Reply by e-mail')}</a><button type="button" class="btn sm" data-read="${m.id}" data-v="${m.read ? 0 : 1}">${m.read ? t('غير مقروءة', 'Mark unread') : t('مقروءة', 'Mark read')}</button><button type="button" class="btn sm warn" data-del="${m.id}">${t('حذف', 'Delete')}</button></div></article>`).join('') : `<div class="empty">${t('لا رسائل بعد.', 'No messages yet.')}</div>`}</section>`;
    view.onclick = async (e) => {
      const a = e.target.closest('[data-read]'), d = e.target.closest('[data-del]');
      if (a) { await api('PUT', '/api/admin/messages', { id: +a.dataset.read, read: a.dataset.v === '1' }); messages(); }
      if (d && sure(t('حذف هذه الرسالة؟', 'Delete this message?'))) { await api('DELETE', '/api/admin/messages?id=' + d.dataset.del); messages(); }
    };
  }

  /* =====================================================================
     7 · Pages (visibility, sections, texts)
     ===================================================================== */
  const PNAME = { 'index.html': ['الرئيسية', 'Home'], 'shop.html': ['المتجر', 'Shop'], 'paintings.html': ['اللوحات', 'Paintings'], 'postcards.html': ['البطاقات البريدية', 'Postcards'], 'stickers.html': ['الملصقات', 'Stickers'], 'calendar.html': ['التقويم', 'Calendar'], 'designs.html': ['تصاميم متنوعة', 'More designs'], 'book.html': ['الكتاب', 'The book'], 'commission.html': ['اطلبوا تصميمًا', 'Request a design'], 'story.html': ['الحكاية', 'Story'], 'account.html': ['الدخول', 'Sign in'], 'profile.html': ['الحساب', 'Account'], 'checkout.html': ['إتمام الشراء', 'Checkout'], 'help.html': ['المساعدة', 'Help'], 'terms.html': ['الشروط والخصوصية', 'Terms'], '404.html': ['صفحة غير موجودة', 'Not found'], 'soon.html': ['قريبًا', 'Coming soon'] };
  const pname = (p) => t(...(PNAME[p] || [p, p]));
  async function pages() {
    head(t('الصفحات', 'Pages'), t('أخفوا صفحة أو قسمًا، وعدّلوا أي نص بالعربية والإنجليزية', 'Hide a page or a section, and edit any text in Arabic and English')); loading();
    const r = await api('GET', '/api/admin/pages'); if (!r.ok) return; const L = r.data.pages;
    view.innerHTML = `<section class="leaf"><div class="scroll"><table class="rows"><thead><tr><th>${t('الصفحة', 'Page')}</th><th>${t('الأقسام', 'Sections')}</th><th>${t('الحالة', 'State')}</th><th></th></tr></thead><tbody>${L.map((p) => `<tr><td><b>${pname(p.path)}</b><small dir="ltr">${esc(p.url)}</small></td>
      <td>${p.sections.length ? p.sections.map((s) => `<label class="chk" style="margin-inline-end:12px"><input type="checkbox" data-sec="${esc(s.id)}" data-path="${esc(p.path)}"${s.hidden ? '' : ' checked'}> <span class="num" dir="ltr">${esc(s.id)}</span></label>`).join('') : `<span class="hint">—</span>`}</td>
      <td class="tight">${p.system ? `<span class="tag">${t('أساسية', 'Core page')}</span>` : `<label class="chk"><input type="checkbox" data-vis="${esc(p.path)}"${p.hidden ? '' : ' checked'}> ${t('ظاهرة', 'Visible')}</label>`}${p.edited ? ` <span class="tag on">${t('معدّلة', 'Edited')}</span>` : ''}</td>
      <td class="tight end"><button type="button" class="btn sm" data-edit="${esc(p.path)}">${t('النصوص', 'Texts')} <span class="num">${p.texts}</span></button> <a class="btn sm" href="..${esc(p.url)}" target="_blank" rel="noopener">${t('افتحوها', 'Open')}</a></td></tr>`).join('')}</tbody></table></div></section>
      <p class="hint">${t('القسم غير المؤشَّر يختفي من الصفحة عند كل الزوار. الصفحة المخفية تعطي «غير موجودة» وتختفي روابطها.', 'An unticked section disappears for every visitor. A hidden page answers “not found” and its links disappear.')}</p>`;
    view.onchange = async (e) => {
      const v = e.target.closest('[data-vis]'), s = e.target.closest('[data-sec]');
      if (v && !done(await api('PUT', '/api/admin/page/visibility', { path: v.dataset.vis, hidden: !v.checked }))) v.checked = !v.checked;
      if (s && !done(await api('PUT', '/api/admin/page/visibility', { path: s.dataset.path, section: s.dataset.sec, sectionHidden: !s.checked }))) s.checked = !s.checked;
    };
    view.onclick = (e) => { const b = e.target.closest('[data-edit]'); if (b) pageTexts(b.dataset.edit); };
  }
  async function pageTexts(path) {
    head(t('نصوص: ', 'Texts: ') + pname(path), '', `<a class="btn" href="#pages">${t('رجوع', 'Back')}</a><button type="button" class="btn go" id="txSave" disabled>${t('حفظ التغييرات', 'Save changes')}</button>`); loading();
    const r = await api('GET', '/api/admin/page?path=' + encodeURIComponent(path)); if (!r.ok) return; const T = r.data.texts, V = r.data.versions || [];
    view.innerHTML = `<div class="bar"><input class="grow" type="search" id="txQ" placeholder="${t('ابحثوا في النصوص', 'Search the texts')}" aria-label="${t('بحث', 'Search')}"><span class="hint">${num(T.length)} ${t('نص. اليمين عربي واليسار إنجليزي.', 'texts. Arabic and English side by side.')}</span></div>
      <section class="leaf" id="txL">${T.map((x) => `<div class="pair" data-id="${esc(x.id)}"><textarea dir="rtl" data-l="ar" rows="1" aria-label="${t('عربي', 'Arabic')}">${esc(x.ar)}</textarea><textarea dir="ltr" data-l="en" rows="1" aria-label="${t('إنجليزي', 'English')}">${esc(x.en)}</textarea></div>`).join('')}</section>
      <section class="leaf"><div class="hd"><h2>${t('النسخ السابقة', 'Earlier versions')}</h2><button type="button" class="btn sm warn" data-restore="">${t('أعيدوا الصفحة إلى أصلها', 'Back to the original page')}</button></div>${V.length ? `<table class="rows"><tbody>${V.map((v) => `<tr><td>${when(new Date(v.created_at).toISOString())}<small>${esc(v.note || '')}</small></td><td class="end"><button type="button" class="btn sm" data-restore="${v.id}">${t('استرجاع', 'Restore')}</button></td></tr>`).join('')}</tbody></table>` : `<div class="empty">${t('لا نسخ محفوظة بعد.', 'No saved versions yet.')}</div>`}</section>`;
    const dirty = () => $$('#txL .pair').filter((p) => { const x = T.find((y) => y.id === p.dataset.id), d = p.querySelector('[data-l=ar]').value !== x.ar || p.querySelector('[data-l=en]').value !== x.en; p.classList.toggle('dirty', d); return d; });
    $('#txL').addEventListener('input', () => ($('#txSave').disabled = !dirty().length));
    $('#txQ').addEventListener('input', (e) => { const q = e.target.value.trim().toLowerCase(); $$('#txL .pair').forEach((p) => (p.hidden = !!q && !p.textContent.toLowerCase().includes(q) && ![...p.querySelectorAll('textarea')].some((a) => a.value.toLowerCase().includes(q)))); });
    $('#txSave').addEventListener('click', async () => {
      const changes = dirty().map((p) => { const x = T.find((y) => y.id === p.dataset.id); return { id: x.id, old_en: x.en, old_ar: x.ar, en: p.querySelector('[data-l=en]').value, ar: p.querySelector('[data-l=ar]').value }; });
      if (done(await api('PUT', '/api/admin/page', { path, changes }), t('حُفظت النصوص وهي ظاهرة الآن في الموقع.', 'Texts saved and live on the site.'))) pageTexts(path);
    });
    view.onclick = async (e) => { const b = e.target.closest('[data-restore]'); if (!b) return; if (!sure(b.dataset.restore ? t('استرجاع هذه النسخة؟', 'Restore this version?') : t('إعادة الصفحة إلى نصوصها الأصلية؟', 'Put the page back to its original texts?'))) return; if (done(await api('POST', '/api/admin/page/restore', { path, version: b.dataset.restore ? +b.dataset.restore : undefined }), t('تم الاسترجاع.', 'Restored.'))) pageTexts(path); };
  }

  /* =====================================================================
     8 · Images
     ===================================================================== */
  let libQ = '', libF = 'all';
  async function images() {
    head(t('مكتبة الصور', 'Image library'), '', `<label class="btn go" style="cursor:pointer">${t('ارفعوا صورة', 'Upload an image')}<input type="file" id="libUp" accept="image/*" hidden></label>`); loading();
    const r = await api('GET', '/api/admin/library'); if (!r.ok) return; const L = r.data.images;
    $('#sub').textContent = `${num(L.length)} ${t('صورة', 'images')}, ${num(L.filter((i) => i.replaced).length)} ${t('مستبدلة', 'replaced')}, ${num(L.filter((i) => !i.builtin).length)} ${t('مرفوعة', 'uploaded')}`;
    view.innerHTML = `<div class="bar"><div class="seg" id="libSeg">${[['all', 'الكل', 'All'], ['product', 'صور المنتجات', 'Product images'], ['up', 'مرفوعة', 'Uploaded'], ['rep', 'مستبدلة', 'Replaced'], ['free', 'غير مستعملة', 'Unused']].map((s) => `<button type="button" data-f="${s[0]}" aria-pressed="${s[0] === libF}">${t(s[1], s[2])}</button>`).join('')}</div><input class="grow" type="search" id="libQ" value="${esc(libQ)}" placeholder="${t('ابحثوا باسم الملف', 'Search by file name')}" aria-label="${t('بحث', 'Search')}"></div><div id="libL"></div>`;
    const paint = () => {
      const q = libQ.trim().toLowerCase(), M = L.filter((i) => (!q || i.file.toLowerCase().includes(q)) && (libF === 'all' || (libF === 'product' && i.products.length) || (libF === 'up' && !i.builtin) || (libF === 'rep' && i.replaced) || (libF === 'free' && !i.products.length && !i.pages.length)));
      $('#libL').innerHTML = M.length ? `<div class="lib">${M.slice(0, 400).map((i) => `<button type="button" class="pc" data-file="${esc(i.file)}"><span class="im"><img src="..${esc(i.url)}" alt="" loading="lazy"></span><span class="tx"><b dir="ltr">${esc(i.file)}</b><span class="mt">${i.replaced ? `<span class="tag on">${t('مستبدلة', 'Replaced')}</span>` : ''}${i.products.length ? `<span class="tag">${t('منتج', 'Product')}</span>` : ''}${i.pages.length ? `<span class="tag">${i.pages.length} ${t('صفحة', 'pages')}</span>` : ''}</span></span></button>`).join('')}</div>` : `<div class="leaf empty">${t('لا صور بهذا البحث.', 'No images match.')}</div>`;
    };
    paint();
    $('#libSeg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; libF = b.dataset.f; $$('#libSeg button').forEach((x) => x.setAttribute('aria-pressed', x === b)); paint(); });
    $('#libQ').addEventListener('input', (e) => { libQ = e.target.value; paint(); });
    $('#libUp').addEventListener('change', async (e) => { const f = e.target.files[0]; if (!f) return; let b; try { b = await toWebp(f); } catch (er) { return toast(t('الصورة كبيرة جدًا أو لا تُقرأ.', 'The image is too big or unreadable.'), true); } if (done(await api('POST', '/api/admin/image?name=' + encodeURIComponent(f.name), null, { body: b, type: 'image/webp' }), t('رُفعت الصورة.', 'Image uploaded.'))) images(); });
    $('#libL').addEventListener('click', (e) => { const b = e.target.closest('.pc'); if (!b) return; const i = L.find((x) => x.file === b.dataset.file);
      sheet(i.file, `<div class="thumb" style="width:100%;height:auto;aspect-ratio:3/2"><img src="..${esc(i.url)}?${Date.now()}" alt=""></div>
        <table class="rows"><tbody><tr><td>${t('المنتجات', 'Products')}</td><td>${i.products.length ? i.products.map((p) => esc((AR ? p.title_ar : p.title_en) + ' (' + kind(p.kind) + ')')).join(t('، ', ', ')) : '—'}</td></tr><tr><td>${t('الصفحات', 'Pages')}</td><td>${i.pages.length ? i.pages.map(pname).join(t('، ', ', ')) : '—'}</td></tr></tbody></table>
        ${i.builtin ? `<label class="f">${t('استبدلوها بصورة أخرى (تتغيّر في كل مكان تظهر فيه)', 'Replace it with another image (changes everywhere it appears)')}<input type="file" id="libRep" accept="image/*"></label>` : ''}`,
        `${i.replaced ? `<button type="button" class="btn" id="libRest">${t('أعيدوا الصورة الأصلية', 'Bring the original back')}</button>` : '<span></span>'}${i.deletable ? `<button type="button" class="btn warn" id="libDel">${t('حذف الصورة', 'Delete the image')}</button>` : ''}`);
      const rep = $('#libRep'); if (rep) rep.onchange = async (ev) => { let bl; try { bl = await toWebp(ev.target.files[0]); } catch (er) { return toast(t('الصورة كبيرة جدًا أو لا تُقرأ.', 'The image is too big or unreadable.'), true); } if (done(await api('POST', '/api/admin/library/replace?file=' + encodeURIComponent(i.file), null, { body: bl, type: 'image/webp' }), t('استُبدلت الصورة.', 'Image replaced.'))) { dlg.close(); images(); } };
      const rs = $('#libRest'); if (rs) rs.onclick = async () => { if (done(await api('DELETE', '/api/admin/library/replace?file=' + encodeURIComponent(i.file)), t('عادت الصورة الأصلية.', 'The original is back.'))) { dlg.close(); images(); } };
      const dl = $('#libDel'); if (dl) dl.onclick = async () => { if (sure(t('حذف هذه الصورة؟', 'Delete this image?')) && done(await api('DELETE', '/api/admin/image?key=' + encodeURIComponent(i.file.replace(/\.webp$/, ''))), t('حُذفت.', 'Deleted.'))) { dlg.close(); images(); } };
    });
  }

  /* ---------- design requests ("Request a design") ---------- */
  let reqF = 'new';
  const WHAT = { painting: ['لوحة', 'A painting'], portrait: ['بورتريه', 'A portrait'], design: ['تصميم', 'A design'], other: ['شيء آخر', 'Something else'] };
  const BUDGET = { 'under-50': ['أقل من 50 يورو', 'Under €50'], '50-150': ['50 إلى 150 يورو', '€50 to €150'], '150-400': ['150 إلى 400 يورو', '€150 to €400'], 'over-400': ['أكثر من 400 يورو', 'Over €400'], unsure: ['لم يقرروا', 'Not sure yet'] };
  async function requests() {
    head(t('طلبات التصميم', 'Design requests'), t('ما يطلبه الزوار من صفحة «اطلبوا تصميمًا»', 'What visitors ask for on the Request a design page')); loading();
    const r = await api('GET', '/api/admin/commissions'); if (!r.ok) return; const all = r.data.requests; badge('requests', all.filter((x) => x.status === 'new').length);
    const L = all.filter((x) => reqF === 'all' || x.status === reqF);
    $('#actions').innerHTML = `<div class="seg" id="rqS">${[['new', 'جديدة', 'New'], ['answered', 'تمّ الرد', 'Answered'], ['all', 'الكل', 'All']].map((f) => `<button type="button" data-f="${f[0]}" aria-pressed="${f[0] === reqF}">${t(f[1], f[2])} <span class="num">${f[0] === 'all' ? all.length : all.filter((x) => x.status === f[0]).length}</span></button>`).join('')}</div>`;
    const row = (k, v) => (v ? `<span><span class="hint">${k}</span> ${esc(v)}</span>` : '');
    view.innerHTML = `<section class="leaf">${L.length ? L.map((q) => `<article class="msg${q.status === 'new' ? ' new' : ''}"><div class="hdr"><span><b>${esc(q.name)}</b> <span class="hint" dir="ltr">${esc(q.email)}</span> <span class="tag on">${t(...(WHAT[q.what] || [q.what, q.what]))}</span>${q.status === 'answered' ? ` <span class="tag">${t('تمّ الرد', 'Answered')}</span>` : ''}</span><span class="hint">${when(q.date)}${q.mailed ? '' : ' · ' + t('لم يُرسل بالبريد', 'not e-mailed')}</span></div>
      <div class="rq-meta">${row(t('المقاس أو الاستعمال:', 'Size or use:'), q.size)}${row(t('الميزانية:', 'Budget:'), t(...(BUDGET[q.budget] || [q.budget, q.budget])))}${row(t('قبل:', 'By:'), q.deadline)}${q.phone ? `<span><span class="hint">${t('الهاتف:', 'Phone:')}</span> <span dir="ltr">${esc(q.phone)}</span></span>` : ''}${row(t('لغة الطلب:', 'Written in:'), q.lang === 'ar' ? t('العربية', 'Arabic') : t('الإنجليزية', 'English'))}</div>
      <p class="bidi">${esc(q.body)}</p>${q.ref ? `<a class="rq-ref" href="${esc(q.ref)}" target="_blank" rel="noopener"><img src="${esc(q.ref)}" alt="${t('الصورة المرجعية', 'The reference picture')}" loading="lazy"></a>` : ''}
      <div class="acts"><a class="btn sm go" href="mailto:${esc(q.email)}?subject=${encodeURIComponent('Mass & Grass · ' + (WHAT[q.what] || ['', q.what])[1])}">${t('ردّوا بالبريد', 'Reply by e-mail')}</a><button type="button" class="btn sm" data-st="${q.id}" data-v="${q.status === 'new' ? 'answered' : 'new'}">${q.status === 'new' ? t('تمّ الرد', 'Mark answered') : t('أعيدوها جديدة', 'Mark new')}</button><button type="button" class="btn sm warn" data-del="${q.id}">${t('حذف', 'Delete')}</button></div></article>`).join('') : `<div class="empty">${reqF === 'new' ? t('لا طلبات جديدة.', 'No new requests.') : t('لا طلبات بعد.', 'No requests yet.')}</div>`}</section>`;
    $('#rqS').onclick = (e) => { const b = e.target.closest('button'); if (b) { reqF = b.dataset.f; requests(); } };
    view.onclick = async (e) => {
      const a = e.target.closest('[data-st]'), d = e.target.closest('[data-del]');
      if (a) { done(await api('PUT', '/api/admin/commissions', { id: +a.dataset.st, status: a.dataset.v })); requests(); }
      if (d && sure(t('حذف هذا الطلب؟', 'Delete this request?'))) { done(await api('DELETE', '/api/admin/commissions?id=' + d.dataset.del), t('حُذف الطلب.', 'Request deleted.')); requests(); }
    };
  }

  /* =====================================================================
     9 · Settings
     ===================================================================== */
  async function settings() {
    head(t('الإعدادات', 'Settings'), t('الأسعار والروابط والشحن', 'Prices, links and shipping')); loading();
    const r = await api('GET', '/api/admin/settings'); if (!r.ok) return; const P = r.data.prices || {}, K = r.data.links || {};
    const PR = [['painting', 'اللوحة', 'A painting'], ['postcard', 'البطاقة البريدية', 'A postcard'], ['sticker', 'الملصق الواحد', 'One sticker'], ['pack', 'مجموعة 6 ملصقات', 'A pack of 6 stickers'], ['calendar', 'التقويم', 'The calendar'], ['design', 'التصميم الواحد', 'One design'], ['book', 'الكتاب', 'The book'], ['calendarPrint', 'التقويم مطبوعًا (فارغ = غير متاح)', 'The printed calendar (empty = not offered)']];
    const LK = [['instagram', 'Instagram'], ['whatsapp', 'WhatsApp'], ['email', t('بريد التواصل', 'Contact e-mail')], ['donate', t('رابط التبرع', 'Donation link')], ['kofi', 'Ko-fi']];
    view.innerHTML = `<div class="cols even"><section class="leaf"><h2>${t('الأسعار باليورو', 'Prices in euro')}</h2><form class="in form" id="prF">${PR.map((p) => `<label class="f">${t(p[1], p[2])}<input type="number" name="${p[0]}" value="${P[p[0]] ?? ''}" min="0" step="0.5" dir="ltr"${p[0] === 'calendarPrint' ? '' : ' required'}></label>`).join('')}
      <p class="hint">${t('السعر هنا هو ما يُحسب عند الشراء. لكل قطعة سعر خاص اختياري من صفحة المنتجات.', 'These are the prices charged at checkout. A piece can have its own price in Products.')}</p><div><button class="btn go">${t('حفظ الأسعار', 'Save prices')}</button></div></form></section>
      <section class="leaf"><h2>${t('روابط التواصل والدعم', 'Contact and support links')}</h2><form class="in form" id="lkF">${LK.map((l) => `<label class="f">${l[1]}<input type="text" name="${l[0]}" value="${esc(K[l[0]] || '')}" dir="ltr" maxlength="200"></label>`).join('')}
      <p class="hint">${t('الفارغ يعني أن الرابط لا يظهر في الموقع.', 'An empty link is not shown on the site.')}</p><div><button class="btn go">${t('حفظ الروابط', 'Save links')}</button></div></form></section>
      <section class="leaf"><h2>${t('شحن القطع المطبوعة', 'Shipping printed pieces')}</h2><form class="in form" id="shF">${Object.entries(r.data.countries || {}).map(([c, n]) => { const z = (r.data.shipping || {})[c] || {}; return `<fieldset class="f print"><legend>${t(n[1], n[0])}</legend><label class="chk"><input type="checkbox" name="${c}_on"${z.on ? ' checked' : ''}> ${t('نشحن إليها', 'We ship here')}</label>
        <div class="two"><label class="f">${t('أجرة الشحن باليورو (0 = مجاني)', 'Shipping fee in euro (0 = free)')}<input type="number" name="${c}_fee" value="${z.fee ?? ''}" min="0" step="0.5" dir="ltr"></label><label class="f">${t('مدة الوصول', 'Delivery time')}<input type="text" name="${c}_days" value="${esc(z.days || '')}" maxlength="60" placeholder="${t('7 إلى 10 أيام', '7 to 10 days')}"></label></div></fieldset>`; }).join('')}
      <p class="hint">${t('يُرسل المطبوع من الإمارات عبر بريد الإمارات. اكتبوا أجرة كل منطقة كما يسعّرها بريد الإمارات لوزن التقويم؛ أي بلد خارج المناطق يأخذ أجرة «كل الدول الأخرى». تظهر للزبون مضافة إلى سعر المطبوع حسب بلده.', 'Prints go from the UAE by Emirates Post. Write each zone\'s fee as Emirates Post prices it for the calendar\'s weight; a country outside the zones takes the "every other country" fee. Buyers see it added to the printed price for their country.')}</p><div><button class="btn go">${t('حفظ الشحن', 'Save shipping')}</button></div></form></section></div>`;
    $('#prF').addEventListener('submit', async (e) => { e.preventDefault(); const o = {}; PR.forEach((p) => (o[p[0]] = e.target[p[0]].value === '' ? 0 : Number(e.target[p[0]].value))); done(await api('PUT', '/api/admin/settings', { prices: Object.assign({}, P, o) })); });
    $('#shF').addEventListener('submit', async (e) => { e.preventDefault(); const f = e.target, o = {}; Object.keys(r.data.countries || {}).forEach((c) => (o[c] = { on: f[c + '_on'].checked, fee: f[c + '_fee'].value, days: f[c + '_days'].value.trim() }));
      if (Object.values(o).some((z) => z.on && z.fee === '')) return toast(t('اكتبوا أجرة الشحن لكل بلد مفعّل.', 'Give every country that is on a shipping fee.'), true); done(await api('PUT', '/api/admin/settings', { shipping: o })); });
    $('#lkF').addEventListener('submit', async (e) => { e.preventDefault(); const o = {}; LK.forEach((l) => (o[l[0]] = e.target[l[0]].value.trim())); done(await api('PUT', '/api/admin/settings', { links: o })); });
  }

  /* =====================================================================
     10 · Security: two-step sign-in, sessions, password, the audit log
     ===================================================================== */
  let audF = 'all';
  const ACT = { login: ['دخول', 'Signed in'], login_google: ['دخول بحساب Google', 'Signed in with Google'], login_failed: ['محاولة دخول فاشلة', 'Failed sign-in'], login_locked: ['حساب مقفل مؤقتًا بعد محاولات كثيرة', 'Account locked after many tries'], login_2fa_failed: ['رمز تحقق خاطئ', 'Wrong second code'], recovery_code_used: ['استُعمل رمز استرجاع', 'A recovery code was used'],
    signup: ['حساب جديد', 'New account'], account_deleted: ['حذف حساب', 'Account deleted'], password_reset: ['استعادة كلمة السر', 'Password reset'], password_changed: ['تغيير كلمة السر', 'Password changed'], sessions_ended: ['إنهاء جلسات', 'Sessions ended'], admin_denied: ['محاولة دخول إلى لوحة الإدارة', 'Tried to reach the admin'],
    '2fa_enabled': ['تفعيل التحقق بخطوتين', 'Two-step sign-in turned on'], '2fa_disabled': ['إيقاف التحقق بخطوتين', 'Two-step sign-in turned off'], '2fa_disable_failed': ['محاولة فاشلة لإيقاف التحقق بخطوتين', 'Failed try to turn two-step off'] };
  async function security() {
    head(t('الحماية', 'Security'), t('من يدخل، ومن أين، وماذا تغيّر', 'Who signs in, from where, and what changed')); loading();
    const [me, se, au] = await Promise.all([api('GET', '/api/me'), api('GET', '/api/me/sessions'), api('GET', '/api/admin/audit' + (audF === 'all' ? '' : '?level=' + audF))]);
    const u = me.data.user, S = (se.data && se.data.sessions) || [], A = (au.data && au.data.log) || [];
    const ua = (s) => { const b = /Edg\//.test(s) ? 'Edge' : /Chrome\//.test(s) ? 'Chrome' : /Firefox\//.test(s) ? 'Firefox' : /Safari\//.test(s) ? 'Safari' : t('متصفح', 'Browser'), o = /Windows/.test(s) ? 'Windows' : /iPhone|iPad/.test(s) ? 'iOS' : /Android/.test(s) ? 'Android' : /Mac OS/.test(s) ? 'macOS' : /Linux/.test(s) ? 'Linux' : ''; return b + (o ? t(' على ', ' on ') + o : ''); };
    view.innerHTML = `<div class="cols even">
      <section class="leaf"><div class="hd"><h2>${t('التحقق بخطوتين', 'Two-step sign-in')}</h2>${u.twofa ? `<span class="stamp paid">${t('مفعّل', 'On')}</span>` : `<span class="stamp alert">${t('غير مفعّل', 'Off')}</span>`}</div><div class="in form" id="tfa">
        ${u.twofa_method === 'email' ? `<p style="margin:0">${t('عند كل دخول يصل رمز إلى بريد الإدارة بعد كلمة السر. الأجهزة التي تختارون تذكّرها لا تطلبه لمدة 30 يومًا.', 'Every sign-in sends a code to the admin e-mail after the password. Devices you choose to remember skip it for 30 days.')}</p>
          <form class="form" id="tfOffE"><label class="f">${t('كلمة السر', 'Password')}<input type="password" name="pw" autocomplete="current-password" dir="ltr" required></label><div><button class="btn warn">${t('أوقفوا التحقق بالبريد', 'Turn the e-mail code off')}</button></div></form>`
        : u.twofa ? `<p style="margin:0">${t('عند كل دخول يُطلب رمز من تطبيق المصادقة بعد كلمة السر.', 'Every sign-in asks for a code from your authenticator app after the password.')}</p>
          <form class="form" id="tfOff"><div class="two"><label class="f">${t('كلمة السر', 'Password')}<input type="password" name="pw" autocomplete="current-password" dir="ltr" required></label><label class="f">${t('رمز من التطبيق أو رمز استرجاع', 'A code from the app or a recovery code')}<input type="text" name="code" inputmode="numeric" autocomplete="one-time-code" dir="ltr" required></label></div><div><button class="btn warn">${t('أوقفوا التحقق بخطوتين', 'Turn two-step off')}</button></div></form>`
        : `<p style="margin:0">${t('كلمة السر وحدها لا تكفي بعد التفعيل: يُطلب رمز من تطبيق مثل Google Authenticator أو Authy. هذه أقوى حماية لحساب الإدارة.', 'After this, the password alone is not enough: sign-in also asks for a code from an app such as Google Authenticator or Authy. It is the strongest protection for the admin account.')}</p><div class="bar"><button type="button" class="btn go" id="tfOn">${t('بتطبيق المصادقة (الأقوى)', 'With an authenticator app (strongest)')}</button><button type="button" class="btn" id="tfMail">${t('برمز على البريد', 'With a code by e-mail')}</button></div>
          <p class="hint">${t('الرمز على البريد أسهل، لكنه أضعف: من يصل إلى البريد يصل إلى الرمز أيضًا.', 'The e-mail code is easier but weaker: whoever reaches the e-mail reaches the code too.')}</p>`}</div></section>
      <section class="leaf"><h2>${t('كلمة السر', 'Password')}</h2><form class="in form" id="pwF"><label class="f">${t('الحالية', 'Current')}<input type="password" name="old" autocomplete="current-password" dir="ltr" required></label><label class="f">${t('الجديدة (10 أحرف على الأقل)', 'New (10 characters or more)')}<input type="password" name="pw" autocomplete="new-password" minlength="10" dir="ltr" required></label><div><button class="btn">${t('غيّروا كلمة السر', 'Change the password')}</button></div><p class="hint">${t('تغييرها ينهي كل الجلسات الأخرى.', 'Changing it ends every other session.')}</p></form></section></div>
      <section class="leaf"><div class="hd"><h2>${t('الأجهزة المسجّلة الدخول', 'Devices signed in')}</h2>${S.length > 1 ? `<button type="button" class="btn sm warn" data-end="">${t('أخرجوا كل الأجهزة الأخرى', 'Sign out all other devices')}</button>` : ''}</div><div class="scroll"><table class="rows"><tbody>${S.map((s) => `<tr><td><b>${esc(ua(s.ua))}</b>${s.current ? ` <span class="tag on">${t('هذا الجهاز', 'This device')}</span>` : ''}<small class="num" dir="ltr">${esc(s.ip)}</small></td><td>${t('آخر نشاط', 'Last active')} ${when(new Date(s.seen).toISOString())}<small>${t('منذ', 'since')} ${day(new Date(s.created).toISOString())}</small></td><td class="tight end">${s.current ? '' : `<button type="button" class="btn sm" data-end="${esc(s.id)}">${t('أخرجوه', 'Sign out')}</button>`}</td></tr>`).join('')}</tbody></table></div></section>
      <section class="leaf"><div class="hd"><h2>${t('سجل الأحداث', 'Audit log')}</h2><div class="seg" id="audSeg">${[['all', 'الكل', 'All'], ['warn', 'تنبيهات', 'Warnings'], ['alert', 'مهمّة', 'Alerts']].map((s) => `<button type="button" data-f="${s[0]}" aria-pressed="${s[0] === audF}">${t(s[1], s[2])}</button>`).join('')}</div></div>
        ${A.length ? `<div class="scroll"><table class="rows"><thead><tr><th>${t('متى', 'When')}</th><th>${t('الحدث', 'Event')}</th><th>${t('من', 'Who')}</th><th>IP</th></tr></thead><tbody>${A.map((l) => `<tr><td class="tight">${when(l.date)}</td><td><span class="stamp ${l.level}">${ACT[l.action] ? t(...ACT[l.action]) : esc(l.action)}</span>${l.detail ? ` <span class="hint" dir="ltr">${esc(l.detail)}</span>` : ''}</td><td dir="ltr" style="text-align:start">${esc(l.actor)}</td><td class="tight num" dir="ltr">${esc(l.ip)}</td></tr>`).join('')}</tbody></table></div>` : `<div class="empty">${t('لا أحداث من هذا النوع.', 'No events of this kind.')}</div>`}</section>`;
    $('#audSeg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { audF = b.dataset.f; security(); } });
    view.onclick = async (e) => { const b = e.target.closest('[data-end]'); if (b && done(await api('DELETE', '/api/me/sessions' + (b.dataset.end ? '?id=' + b.dataset.end : '')), t('تم إخراج الجهاز.', 'Signed out.'))) security(); };
    $('#pwF').addEventListener('submit', async (e) => { e.preventDefault(); if (done(await api('POST', '/api/me/password', { old: e.target.old.value, password: e.target.pw.value }), t('تغيّرت كلمة السر.', 'Password changed.'))) e.target.reset(); });
    const on = $('#tfOn'); if (on) on.addEventListener('click', async () => {
      const r = await api('POST', '/api/me/2fa/setup'); if (!r.ok) return toast(why(r), true);
      sheet(t('تفعيل التحقق بخطوتين', 'Set up two-step sign-in'), `<ol style="margin:0;padding-inline-start:20px;display:grid;gap:8px"><li>${t('افتحوا تطبيق المصادقة (Google Authenticator، Authy، 1Password…) واختاروا «إضافة حساب» ثم «إدخال مفتاح».', 'Open your authenticator app (Google Authenticator, Authy, 1Password…), choose “Add account”, then “Enter a key”.')}</li><li>${t('انسخوا هذا المفتاح إلى التطبيق:', 'Copy this key into the app:')}</li></ol>
        <div class="code">${esc(r.data.secret.match(/.{1,4}/g).join(' '))}</div><div class="bar"><button type="button" class="btn sm" id="tfCopy">${t('انسخوا المفتاح', 'Copy the key')}</button><a class="btn sm" href="${esc(r.data.uri)}">${t('على الهاتف: افتحوه في التطبيق مباشرة', 'On a phone: open it in the app')}</a></div>
        <form class="form" id="tfF"><label class="f">${t('اكتبوا الرمز المكوّن من 6 أرقام الذي يظهر في التطبيق', 'Type the 6-digit code the app shows')}<input type="text" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9 ]{6,7}" dir="ltr" required></label><p class="msgl" id="tfMsg" role="alert"></p></form>`,
        `<span></span><button type="submit" form="tfF" class="btn go">${t('فعّلوا', 'Turn it on')}</button>`);
      $('#tfCopy').onclick = () => navigator.clipboard.writeText(r.data.secret).then(() => toast(t('نُسخ المفتاح.', 'Key copied.')));
      $('#tfF').addEventListener('submit', async (e) => { e.preventDefault(); const r2 = await api('POST', '/api/me/2fa/enable', { code: e.target.code.value }); if (!r2.ok) return ($('#tfMsg').textContent = why(r2));
        sheet(t('احفظوا رموز الاسترجاع', 'Keep these recovery codes'), `<p style="margin:0">${t('التحقق بخطوتين مفعّل. إذا ضاع الهاتف، كل رمز من هذه يُدخلكم مرة واحدة. احفظوها في مكان آمن خارج هذا الجهاز: لن تظهر مرة أخرى.', 'Two-step sign-in is on. If the phone is lost, each of these codes signs you in once. Keep them somewhere safe away from this device: they are not shown again.')}</p><div class="code codes">${r2.data.recovery.map((c) => `<span>${esc(c)}</span>`).join('')}</div><div><button type="button" class="btn" id="rcCopy">${t('انسخوا الرموز', 'Copy the codes')}</button></div>`, `<span></span><button type="button" class="btn go" data-x>${t('حفظتُها', 'I have saved them')}</button>`);
        $('#rcCopy').onclick = () => navigator.clipboard.writeText(r2.data.recovery.join('\n')).then(() => toast(t('نُسخت الرموز.', 'Codes copied.')));
        dlg.addEventListener('close', () => security(), { once: true }); });
    });
    const em = $('#tfMail'); if (em) em.addEventListener('click', async () => {
      const r = await api('POST', '/api/me/2fa/email/start'); if (!r.ok) return toast(why(r), true);
      sheet(t('التحقق برمز على البريد', 'Two-step with an e-mail code'), `<p style="margin:0">${t('أرسلنا رمزًا من 6 أرقام إلى', 'We sent a 6-digit code to')} <b dir="ltr">${esc(u.email)}</b>. ${t('صالح 10 دقائق.', 'It is valid for 10 minutes.')}</p>
        <form class="form" id="tfE"><label class="f">${t('الرمز', 'The code')}<input type="text" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" dir="ltr" required></label><p class="msgl" id="tfEMsg" role="alert"></p></form>`,
        `<span></span><button type="submit" form="tfE" class="btn go">${t('فعّلوا', 'Turn it on')}</button>`);
      $('#tfE').addEventListener('submit', async (e) => { e.preventDefault(); const r2 = await api('POST', '/api/me/2fa/email/enable', { code: e.target.code.value.trim() }); if (!r2.ok) return ($('#tfEMsg').textContent = why(r2));
        dlg.close(); toast(t('التحقق بالبريد مفعّل.', 'The e-mail code is on.')); security(); });
    });
    const offE = $('#tfOffE'); if (offE) offE.addEventListener('submit', async (e) => { e.preventDefault(); if (!sure(t('إيقاف التحقق بخطوتين يضعف حماية حساب الإدارة. متأكدون؟', 'Turning two-step off weakens the admin account. Sure?'))) return; if (done(await api('POST', '/api/me/2fa/email/disable', { password: e.target.pw.value }), t('أُوقف التحقق بخطوتين.', 'Two-step sign-in is off.'))) security(); });
    const off = $('#tfOff'); if (off) off.addEventListener('submit', async (e) => { e.preventDefault(); if (!sure(t('إيقاف التحقق بخطوتين يضعف حماية حساب الإدارة. متأكدون؟', 'Turning two-step off weakens the admin account. Sure?'))) return; if (done(await api('POST', '/api/me/2fa/disable', { password: e.target.pw.value, code: e.target.code.value }), t('أُوقف التحقق بخطوتين.', 'Two-step sign-in is off.'))) security(); });
  }

  /* ---------- the index and the router ---------- */
  const NAV = [['overview', 'نظرة عامة', 'Overview', overview], ['orders', 'الطلبات', 'Orders', orders], ['products', 'المنتجات', 'Products', products], ['customers', 'العملاء', 'Customers', customers], ['subscribers', 'مشتركو البريد', 'Subscribers', subscribers], ['messages', 'الرسائل', 'Messages', messages], ['requests', 'طلبات التصميم', 'Design requests', requests], null,
    ['pages', 'الصفحات', 'Pages', pages], ['images', 'مكتبة الصور', 'Image library', images], ['settings', 'الإعدادات', 'Settings', settings], ['security', 'الحماية', 'Security', security]];
  const counts = {};
  function badge(k, n) { counts[k] = n; const a = $(`#nav a[href="#${k}"] .n`); if (a) { a.textContent = n; a.hidden = !n; } }
  function nav() {
    const cur = location.hash.slice(1).split('/')[0] || 'overview';
    $('#nav').innerHTML = NAV.map((n) => (n ? `<a href="#${n[0]}"${n[0] === cur ? ' aria-current="page"' : ''}>${t(n[1], n[2])}<span class="n"${counts[n[0]] ? '' : ' hidden'}>${counts[n[0]] || ''}</span></a>` : '<hr>')).join('');
    $('#brandT').textContent = t('دفتر المتجر', 'The shop’s ledger'); $('#langB').textContent = AR ? 'English' : 'العربية'; $('#outB').textContent = t('خروج', 'Sign out');
    document.documentElement.lang = AR ? 'ar' : 'en'; document.documentElement.dir = AR ? 'rtl' : 'ltr';
  }
  function route() {
    const h = location.hash.slice(1).split('/')[0] || 'overview', n = NAV.find((x) => x && x[0] === h) || NAV[0];
    if (dlg.open) dlg.close(); view.onclick = null; view.onchange = null; nav(); $('#index').classList.remove('open'); $('#menuB').setAttribute('aria-expanded', 'false'); n[3](); view.focus({ preventScroll: true }); scrollTo(0, 0);
  }
  addEventListener('hashchange', route);
  $('#langB').addEventListener('click', () => { AR = !AR; try { localStorage.mgAdminLang = AR ? 'ar' : 'en'; } catch (e) {} route(); });
  $('#outB').addEventListener('click', async () => { await api('POST', '/api/logout'); try { localStorage.removeItem('mgUser'); } catch (e) {} location.href = '../index.html'; });
  $('#menuB').addEventListener('click', () => { const o = $('#index').classList.toggle('open'); $('#menuB').setAttribute('aria-expanded', o); });
  route();
})();
