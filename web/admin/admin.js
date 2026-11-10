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
    totp_invalid: ['الرمز غير صحيح.', 'That code is not right.'], bad_credentials: ['كلمة السر أو الرمز غير صحيح.', 'The password or the code is wrong.'], password_short: ['كلمة السر 10 أحرف على الأقل.', 'The password needs 10 characters or more.'], rate_limited: ['محاولات كثيرة. انتظروا قليلًا.', 'Too many tries. Wait a little.'], offline: ['لا اتصال بالخادم.', 'The server did not answer.'] };
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
  const KIND = { painting: ['لوحة', 'Painting'], postcard: ['بطاقة بريدية', 'Postcard'], sticker: ['ملصق', 'Sticker'], pack: ['مجموعة ملصقات', 'Sticker pack'], calendar: ['التقويم', 'Calendar'] };
  const KINDS = { painting: ['اللوحات', 'Paintings'], postcard: ['البطاقات البريدية', 'Postcards'], sticker: ['الملصقات', 'Stickers'] };
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
    const o = r.data; o.twofa = !!(me.data.user && me.data.user.twofa); badge('messages', o.unread); badge('security', o.alerts);
    const delta = (now, prev, money) => { if (!prev && !now) return `<span class="d">${t('لا مبيعات بعد', 'No sales yet')}</span>`; if (!prev) return `<span class="d up">${t('أول مبيعات في هذه الفترة', 'First sales in this period')}</span>`; const p = Math.round(((now - prev) / prev) * 100); return `<span class="d ${p >= 0 ? 'up' : 'down'}">${p >= 0 ? '+' : ''}${p}% ${t('عن الفترة السابقة', 'on the period before')} (${money ? eur(prev) : num(prev)})</span>`; };
    const max = Math.max(1, ...o.byDay.map((d) => d.revenue)), W = 100 / o.byDay.length;
    const bars = o.byDay.map((d, i) => { const h = d.revenue ? Math.max(2, (d.revenue / max) * 150) : 1.5; return `<rect class="${d.revenue ? 'b' : 'b0'}" x="${(i * W + W * 0.15).toFixed(2)}%" y="${(160 - h).toFixed(1)}" width="${(W * 0.7).toFixed(2)}%" height="${h.toFixed(1)}" rx="1"><title>${d.date}: ${eur(d.revenue)}, ${d.orders} ${t('طلب', 'orders')}</title></rect>`; }).join('');
    const todo = [
      [o.payments === 'live', t('الدفع', 'Payments'), o.payments === 'live' ? t('PayPal يعمل بأموال حقيقية.', 'PayPal is live.') : o.payments === 'sandbox' ? t('PayPal في وضع التجربة (Sandbox). ضعوا مفاتيح Live عند الإطلاق.', 'PayPal is in sandbox. Put the live keys in before launch.') : t('لم تُضف مفاتيح PayPal بعد، فالطلبات تُسجَّل دون دفع.', 'No PayPal keys yet: orders are recorded but cannot be paid.')],
      [!o.noFile.length && o.calendarFile, t('ملفات البيع', 'Files to deliver'), !o.noFile.length && o.calendarFile ? t('كل قطعة معروضة لها ملف.', 'Every piece on sale has a file.') : `${o.noFile.length + (o.calendarFile ? 0 : 1)} ${t('قطعة معروضة بلا ملف يُسلَّم للمشتري.', 'pieces on sale have no file for the buyer.')}`, '#products'],
      [o.mail, t('البريد', 'E-mail'), o.mail ? t('رسائل الطلبات واستعادة كلمة السر تُرسَل.', 'Order and password e-mails are sent.') : t('مفتاح البريد (Resend) غير موجود: لا تُرسل رسائل التأكيد.', 'No mail key (Resend): confirmation e-mails are not sent.')],
      [o.twofa, t('التحقق بخطوتين', 'Two-step sign-in'), o.twofa ? t('حساب الإدارة محمي برمز إضافي.', 'The admin account asks for a second code.') : t('فعّلوه لحماية حساب الإدارة.', 'Turn it on to protect the admin account.'), '#security'],
      [!o.soon, t('الموقع', 'The site'), o.soon ? t('صفحة «قريبًا» ظاهرة للزوار. أنتم فقط ترون الموقع.', 'Visitors see the coming-soon page. Only you see the site.') : t('الموقع مفتوح للزوار.', 'The site is open to visitors.')],
      [o.google, t('الدخول بحساب Google', 'Google sign-in'), o.google ? t('يعمل.', 'Working.') : t('غير مفعّل (اختياري).', 'Not set up (optional).')],
    ];
    view.innerHTML = `
      <section class="today" aria-label="${t('الأرقام', 'Figures')}">
        <div class="lead"><span class="k">${t('المبيعات في آخر', 'Sales in the last')} ${o.days} ${t('يومًا', 'days')}</span><span class="v">${eur(o.period.revenue)}</span>${delta(o.period.revenue, o.previous.revenue, true)}</div>
        <div><a href="#orders"><span class="k">${t('طلبات مدفوعة', 'Paid orders')}</span><span class="v">${num(o.period.orders)}</span><span class="d">${t('الإجمالي', 'All time')} ${num(o.totals.orders)}, ${eur(o.totals.revenue)}</span></a></div>
        <div><a href="#customers"><span class="k">${t('العملاء', 'Customers')}</span><span class="v">${num(o.users)}</span><span class="d">+${num(o.newUsers)} ${t('في الفترة', 'in the period')}</span></a></div>
        <div><a href="#subscribers"><span class="k">${t('مشتركو البريد', 'Subscribers')}</span><span class="v">${num(o.subscribers)}</span><span class="d">${t('لوحة كل شهر', 'A painting a month')}</span></a></div>
        <div><a href="#messages"><span class="k">${t('رسائل غير مقروءة', 'Unread messages')}</span><span class="v">${num(o.unread)}</span><span class="d">${t('من', 'of')} ${num(o.messages)}</span></a></div>
      </section>
      <div class="cols">
        <div style="display:grid;gap:24px">
          <section class="leaf"><div class="hd"><h2>${t('المبيعات يومًا بيوم', 'Sales day by day')}</h2><span class="hint">${t('بالأيام، يورو', 'per day, euro')}</span></div>
            <div class="chart"><svg viewBox="0 0 100 164" preserveAspectRatio="none" role="img" aria-label="${t('مخطط المبيعات اليومية', 'Daily sales chart')}"><line class="ax" x1="0" x2="100%" y1="160.5" y2="160.5"/>${bars}</svg>
            <div class="legend"><span class="num">${o.byDay[0].date}</span><span>${t('أعلى يوم', 'Best day')} ${eur(Math.max(...o.byDay.map((d) => d.revenue)))}</span><span class="num">${o.byDay[o.byDay.length - 1].date}</span></div></div></section>
          <section class="leaf"><div class="hd"><h2>${t('آخر الطلبات', 'Latest orders')}</h2><a class="hint" href="#orders">${t('كل الطلبات', 'All orders')}</a></div>
            ${o.recent.length ? `<div class="scroll"><table class="rows"><tbody>${o.recent.map((x) => `<tr data-open="${esc(x.id)}"><td class="tight num"><b>${esc(x.id)}</b><small>${when(x.date)}</small></td><td>${esc(x.name || x.email)}<small>${itemsLine(x)}</small></td><td class="tight">${stamp(x.status)}</td><td class="tight end num"><b>${price(x.total)}</b></td></tr>`).join('')}</tbody></table></div>` : `<div class="empty">${t('لا طلبات بعد. ستظهر هنا فور وصول أول طلب.', 'No orders yet. The first one will show here.')}</div>`}</section>
        </div>
        <div style="display:grid;gap:24px">
          <section class="leaf"><div class="hd"><h2>${t('قبل الإطلاق', 'Before launch')}</h2></div><ul class="todo">${todo.map((x) => `<li class="${x[0] ? 'ok' : 'no'}"><span class="m" aria-hidden="true"></span><div><b>${x[1]}</b><span>${x[2]}</span></div>${x[3] && !x[0] ? `<a class="btn sm" href="${x[3]}">${t('افتحوا', 'Open')}</a>` : '<span></span>'}</li>`).join('')}</ul></section>
          <section class="leaf"><div class="hd"><h2>${t('الأكثر مبيعًا', 'Best sellers')}</h2></div>
            ${o.top.length ? `<table class="rows"><tbody>${o.top.map((x) => `<tr><td>${esc(AR ? x.title_ar || x.title : x.title || x.id)}<small>${kind(x.kind)}</small></td><td class="tight end num"><b>${num(x.n)}</b><small>${eur(x.revenue)}</small></td></tr>`).join('')}</tbody></table>` : `<div class="empty">${t('تظهر القائمة بعد أول بيع.', 'This fills in after the first sale.')}</div>`}</section>
          <section class="leaf"><div class="hd"><h2>${t('المتجر الآن', 'The shop now')}</h2></div><table class="rows"><tbody>
            <tr><td>${t('قطع معروضة', 'Pieces on sale')}</td><td class="end num"><b>${num(o.products - o.hidden)}</b></td></tr>
            <tr><td>${t('قطع مخفية', 'Hidden pieces')}</td><td class="end num"><b>${num(o.hidden)}</b></td></tr>
            <tr><td>${t('ملفات مرفوعة', 'Files uploaded')}</td><td class="end num"><b>${num(o.files)}</b> <small>${size(o.fileBytes)}</small></td></tr>
            <tr><td>${t('طلبات بانتظار الدفع (7 أيام)', 'Awaiting payment (7 days)')}</td><td class="end num"><b>${num(o.pending)}</b></td></tr>
            <tr><td>${t('تنزيلات مجانية في الفترة', 'Free downloads in the period')}</td><td class="end num"><b>${num(o.freeDownloads || 0)}</b></td></tr></tbody></table></section>
        </div>
      </div>`;
    $('#ovd').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { ovDays = +b.dataset.d; overview(); } });
    view.addEventListener('click', openOrderRow);
  }
  function openOrderRow(e) { const tr = e.target.closest('tr[data-open]'); if (tr && /^MG-/.test(tr.dataset.open)) orderSheet(tr.dataset.open); }

  /* =====================================================================
     2 · Orders
     ===================================================================== */
  let ordF = 'all', ordQ = '', ORD = [];
  async function orders() {
    head(t('الطلبات', 'Orders'), '', `<button type="button" class="btn" id="ordCsv">${t('تنزيل CSV', 'Download CSV')}</button>`); loading();
    const r = await api('GET', '/api/admin/orders'); if (!r.ok) return; ORD = r.data.orders;
    $('#sub').textContent = `${num(ORD.length)} ${t('طلب', 'orders')}, ${num(ORD.filter((o) => o.status === 'paid').length)} ${t('مدفوع', 'paid')}`;
    view.innerHTML = `<div class="bar"><div class="seg" id="ordSeg">${[['all', 'الكل', 'All'], ['paid', 'مدفوع', 'Paid'], ['pending', 'بانتظار الدفع', 'Awaiting'], ['cancelled', 'ملغى', 'Cancelled'], ['refunded', 'مُستردّ', 'Refunded']].map((s) => `<button type="button" data-f="${s[0]}" aria-pressed="${s[0] === ordF}">${t(s[1], s[2])}</button>`).join('')}</div>
      <input class="grow" type="search" id="ordQ" value="${esc(ordQ)}" placeholder="${t('ابحثوا برقم الطلب أو البريد أو الاسم', 'Search by order, e-mail or name')}" aria-label="${t('بحث', 'Search')}"></div><section class="leaf" id="ordL"></section>`;
    const paint = () => {
      const q = ordQ.trim().toLowerCase(), L = ORD.filter((o) => (ordF === 'all' || o.status === ordF) && (!q || (o.id + ' ' + o.email + ' ' + o.name).toLowerCase().includes(q)));
      $('#ordL').innerHTML = L.length ? `<div class="scroll"><table class="rows"><thead><tr><th>${t('الطلب', 'Order')}</th><th>${t('العميل', 'Customer')}</th><th>${t('القطع', 'Pieces')}</th><th>${t('الحالة', 'State')}</th><th class="end">${t('المبلغ', 'Amount')}</th></tr></thead><tbody>${L.map((x) => `<tr data-open="${esc(x.id)}"><td class="tight num"><b>${esc(x.id)}</b><small>${when(x.date)}</small></td><td>${esc(x.name || '')}<small dir="ltr">${esc(x.email)}</small></td><td>${itemsLine(x)}</td><td class="tight">${stamp(x.status)}</td><td class="tight end num"><b>${price(x.total)}</b></td></tr>`).join('')}</tbody></table></div>` : `<div class="empty">${ORD.length ? t('لا طلبات بهذا البحث.', 'No orders match.') : t('لا طلبات بعد.', 'No orders yet.')}</div>`;
    };
    paint();
    $('#ordSeg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; ordF = b.dataset.f; $$('#ordSeg button').forEach((x) => x.setAttribute('aria-pressed', x === b)); paint(); });
    $('#ordQ').addEventListener('input', (e) => { ordQ = e.target.value; paint(); });
    $('#ordL').addEventListener('click', openOrderRow);
    $('#ordCsv').addEventListener('click', () => csv('orders', ['order', 'date', 'status', 'name', 'email', 'total_eur', 'items'], ORD.map((o) => [o.id, o.date, o.status, o.name, o.email, o.total, o.items.map((i) => i.t || i.k).join(' | ')])));
  }
  async function orderSheet(id) {
    const r = await api('GET', '/api/admin/order?id=' + encodeURIComponent(id)); if (!r.ok) return toast(why(r), true); const o = r.data.order;
    sheet(o.id, `<div class="row" style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:center">${stamp(o.status)}<b class="num" style="font-size:var(--fs-h2)">${price(o.total)}</b></div>
      <table class="rows"><tbody><tr><td>${t('العميل', 'Customer')}</td><td>${esc(o.name || '')}<small dir="ltr">${esc(o.email)}</small></td></tr>
      <tr><td>${t('أُنشئ', 'Created')}</td><td>${when(o.date)}</td></tr>${o.paid ? `<tr><td>${t('دُفع', 'Paid')}</td><td>${when(o.paid)}</td></tr>` : ''}
      <tr><td>PayPal</td><td class="num" dir="ltr">${esc(o.paypal_id || t('لا يوجد', 'none'))}</td></tr><tr><td>${t('حساب', 'Account')}</td><td>${o.user_id ? t('اشترى وهو مسجّل الدخول', 'Bought while signed in') : t('ضيف', 'Guest')}</td></tr></tbody></table>
      <section class="leaf"><h2>${t('القطع', 'Pieces')}</h2><table class="rows"><tbody>${o.items.map((i) => `<tr><td>${esc(AR ? i.ta || i.t : i.t || i.k)}<small>${kind(i.kind)}${i.pack ? ': ' + esc(i.pack.join(', ')) : ''}${i.gift ? ' · ' + t('هدية إلى', 'gift for') + ' ' + esc(i.gift.to) : ''}</small></td><td class="end num">${eur((i.cents || 0) / 100)}</td></tr>`).join('')}</tbody></table></section>
      <section class="leaf"><h2>${t('الملفات التي يستلمها', 'Files the buyer gets')}</h2>${o.status !== 'paid' ? `<div class="empty">${t('تُتاح الملفات بعد الدفع.', 'Files open once the order is paid.')}</div>` : o.files.length ? `<ul class="files" style="border:0">${o.files.map((f) => `<li><span>${esc(f.name)}</span><span class="hint num">${size(f.size)}</span></li>`).join('')}</ul>` : `<div class="empty">${t('لا ملفات مرفوعة لهذه القطع بعد. ارفعوها من صفحة المنتجات.', 'No files uploaded for these pieces yet. Upload them from Products.')}</div>`}</section>`,
      `<a class="btn" href="mailto:${esc(o.email)}?subject=${encodeURIComponent('Mass & Grass · ' + o.id)}">${t('راسلوا العميل', 'E-mail the customer')}</a><span class="bar">${o.status === 'pending' && o.paypal_id ? `<button type="button" class="btn" data-check>${t('اسألوا PayPal عن الدفع', 'Ask PayPal about the payment')}</button>` : ''}${['paid', 'refunded', 'cancelled'].filter((s) => s !== o.status).map((s) => `<button type="button" class="btn ${s === 'paid' ? 'go' : s === 'cancelled' ? 'warn' : ''}" data-st="${s}">${t(...{ paid: ['سجّلوه مدفوعًا', 'Mark paid'], refunded: ['سجّلوه مُستردًّا', 'Mark refunded'], cancelled: ['ألغوا الطلب', 'Cancel order'] }[s])}</button>`).join('')}</span>`);
    dlg.querySelector('.sh-ft').addEventListener('click', async (e) => {
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
    head(t('المنتجات', 'Products'), '', `<button type="button" class="btn go" id="pAdd">${t('أضيفوا قطعة', 'Add a piece')}</button>`); loading();
    const [a, f, s] = await Promise.all([api('GET', '/api/admin/products'), api('GET', '/api/admin/files'), api('GET', '/api/admin/settings')]); if (!a.ok) return;
    PRODS = a.data.products; FILES = {}; (f.data.files || []).forEach((x) => (FILES[x.kind + ':' + x.product_id] = x)); const prices = (s.data && s.data.prices) || {};
    $('#sub').textContent = `${num(PRODS.length)} ${t('قطعة', 'pieces')}, ${num(PRODS.filter((p) => !FILES[p.kind + ':' + p.id]).length)} ${t('بلا ملف', 'without a file')}`;
    const calF = FILES['calendar:current'];
    view.innerHTML = `<div class="bar"><div class="seg" id="pSeg">${Object.keys(KINDS).map((k) => `<button type="button" data-k="${k}" aria-pressed="${k === prodK}">${t(...KINDS[k])} <span class="num">${PRODS.filter((p) => p.kind === k).length}</span></button>`).join('')}<button type="button" data-k="calendar" aria-pressed="${prodK === 'calendar'}">${t('التقويم', 'Calendar')}</button></div>
      <label class="chk"><input type="checkbox" id="pNoFile"> ${t('بلا ملف فقط', 'Only without a file')}</label></div><div id="pL"></div>`;
    const paint = () => {
      if (prodK === 'calendar') return ($('#pL').innerHTML = `<section class="leaf"><div class="hd"><h2>${t('تقويم 2027: أشياء نحفظها في قوارير', 'Calendar 2027: Things kept in bottles')}</h2><span class="num">${eur(prices.calendar || 0)}</span></div><div class="in form"><p class="hint">${t('التقويم قطعة واحدة: ملف PDF واحد يستلمه كل من يشتريه. السعر من الإعدادات.', 'The calendar is one piece: one PDF every buyer receives. Its price is in Settings.')}</p><div id="calFiles"></div></div></section>`, filesBox($('#calFiles'), 'calendar', 'current'));
      const only = $('#pNoFile').checked, L = PRODS.filter((p) => p.kind === prodK && (!only || !FILES[p.kind + ':' + p.id]));
      $('#pL').innerHTML = L.length ? `<div class="shelf">${L.map((p) => { const fl = FILES[p.kind + ':' + p.id]; return `<button type="button" class="pc${p.hidden ? ' hid' : ''}" data-id="${esc(p.id)}"><span class="im"><img src="${esc(pimg(p))}" alt="" loading="lazy"></span><span class="tx"><b>${esc(AR ? p.title_ar || p.title_en : p.title_en)}</b><span class="mt"><span class="num">${p.price === 0 ? `<span class="tag on">${t('مجاني', 'Free')}</span>` : eur(p.price != null ? p.price : prices[p.kind] || 0)}</span>${p.sale ? `<span class="tag on">-${p.sale}%</span>` : ''}${p.is_new ? `<span class="tag">${t('جديدة', 'New')}</span>` : ''}${p.hidden ? `<span class="tag">${t('مخفية', 'Hidden')}</span>` : ''}<span class="tag ${fl ? 'on' : 'off'}">${fl ? fl.n + ' ' + t('ملف', 'files') : t('بلا ملف', 'No file')}</span></span><span class="mt">${t('بيع', 'Sold')} <span class="num">${num(p.sold)}</span></span></span></button>`; }).join('')}</div>` : `<div class="leaf empty">${t('لا قطع هنا.', 'Nothing here.')}</div>`;
    };
    paint();
    $('#pSeg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; prodK = b.dataset.k; $$('#pSeg button').forEach((x) => x.setAttribute('aria-pressed', x === b)); paint(); });
    $('#pNoFile').addEventListener('change', paint);
    $('#pL').addEventListener('click', (e) => { const b = e.target.closest('.pc'); if (b) productSheet(PRODS.find((p) => p.id === b.dataset.id && p.kind === prodK)); });
    $('#pAdd').addEventListener('click', () => productSheet(null));
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
    const isNew = !p, x = p || { kind: prodK === 'calendar' ? 'painting' : prodK, id: '', title_en: '', title_ar: '', place_en: '', place_ar: '', story_en: '', story_ar: '', price: null, sale: 0, is_new: true, hidden: false, sort: 0, extra: {} };
    const v = (n) => esc(x[n] ?? '');
    sheet(isNew ? t('قطعة جديدة', 'A new piece') : (AR ? x.title_ar || x.title_en : x.title_en), `<form class="form" id="pf">
      ${isNew ? `<div class="two"><label class="f">${t('القسم', 'Shelf')}<select name="kind">${Object.keys(KINDS).map((k) => `<option value="${k}"${k === x.kind ? ' selected' : ''}>${t(...KINDS[k])}</option>`).join('')}</select></label>
        <label class="f">${t('الصورة (تُحوَّل إلى WebP)', 'Image (converted to WebP)')}<input type="file" name="img" accept="image/*" required></label></div>` : `<div class="row"><span class="thumb" style="width:72px;height:72px"><img src="${esc(pimg(x))}" alt=""></span><span class="hint">${kind(x.kind)} · <span class="num" dir="ltr">${esc(x.id)}</span><br>${t('لتغيير الصورة استعملوا مكتبة الصور.', 'To change the image use the image library.')}</span></div>`}
      <div class="two"><label class="f">${t('الاسم بالعربية', 'Title in Arabic')}<input type="text" name="title_ar" value="${v('title_ar')}" dir="rtl" maxlength="80"></label><label class="f">${t('الاسم بالإنجليزية', 'Title in English')}<input type="text" name="title_en" value="${v('title_en')}" dir="ltr" maxlength="80" required></label></div>
      <div class="two"><label class="f">${t('المكان بالعربية', 'Place in Arabic')}<input type="text" name="place_ar" value="${v('place_ar')}" dir="rtl" maxlength="80"></label><label class="f">${t('المكان بالإنجليزية', 'Place in English')}<input type="text" name="place_en" value="${v('place_en')}" dir="ltr" maxlength="80"></label></div>
      <div class="three"><label class="f">${t('السعر باليورو (فارغ = سعر القسم، 0 = مجاني)', 'Price in euro (empty = shelf price, 0 = free)')}<input type="number" name="price" value="${x.price ?? ''}" min="0" step="0.5" dir="ltr"></label><label class="f">${t('خصم %', 'Discount %')}<input type="number" name="sale" value="${x.sale || 0}" min="0" max="90" dir="ltr"></label>
        <label class="f">${t('شكل الملصق', 'Sticker cut')}<select name="shape"><option value="">${t('لا ينطبق', 'n/a')}</option>${[['die', 'مقصوص على الرسم', 'Die-cut'], ['round', 'دائري', 'Round'], ['rect', 'مستطيل', 'Rectangle']].map((s) => `<option value="${s[0]}"${(x.extra || {}).shape === s[0] ? ' selected' : ''}>${t(s[1], s[2])}</option>`).join('')}</select></label></div>
      <div class="row"><label class="chk"><input type="checkbox" name="is_new"${x.is_new ? ' checked' : ''}> ${t('جديدة', 'New')}</label><label class="chk"><input type="checkbox" name="hidden"${x.hidden ? ' checked' : ''}> ${t('مخفية عن الزوار', 'Hidden from visitors')}</label></div>
      ${isNew ? '' : '<div id="pfFiles"></div>'}<p class="msgl" id="pfMsg" role="alert"></p></form>`,
      `${isNew ? '<span></span>' : `<button type="button" class="btn warn" id="pDel">${t('حذف القطعة', 'Delete the piece')}</button>`}<button type="submit" form="pf" class="btn go">${isNew ? t('أضيفوها', 'Add it') : t('حفظ', 'Save')}</button>`);
    if (!isNew) filesBox($('#pfFiles'), x.kind, x.id);
    $('#pf').addEventListener('submit', async (e) => {
      e.preventDefault(); const f = e.target, msg = $('#pfMsg'), say = (m) => { msg.textContent = m; };
      const body = { id: x.id, kind: isNew ? f.kind.value : x.kind, title_en: f.title_en.value.trim(), title_ar: f.title_ar.value.trim(), place_en: f.place_en.value.trim() || 'Gaza', place_ar: f.place_ar.value.trim() || 'غزة', story_en: x.story_en || '', story_ar: x.story_ar || '',
        price: f.price.value, sale: f.sale.value, is_new: f.is_new.checked, hidden: f.hidden.checked, sort: x.sort || 0, extra: Object.assign({}, x.extra, f.shape.value ? { shape: f.shape.value } : {}) };
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
    const r = await api('GET', '/api/admin/subscribers'); if (!r.ok) return; const L = r.data.subscribers; $('#sub').textContent = `${num(L.length)} ${t('مشترك في «لوحة كل شهر»', 'signed up for a painting a month')}`;
    const SRC = { footer: ['أسفل الموقع', 'Footer form'], soon: ['صفحة «قريبًا»', 'Coming-soon page'], checkout: ['عند الشراء', 'At checkout'] };
    view.innerHTML = `<section class="leaf">${L.length ? `<div class="scroll"><table class="rows"><thead><tr><th>${t('البريد', 'E-mail')}</th><th>${t('من أين', 'Where from')}</th><th>${t('متى', 'When')}</th><th></th></tr></thead><tbody>${L.map((s) => `<tr><td dir="ltr" style="text-align:start"><b>${esc(s.email)}</b></td><td>${t(...(SRC[s.source] || [s.source, s.source]))}</td><td class="tight">${day(s.date)}</td><td class="tight end"><button type="button" class="btn sm warn" data-del="${esc(s.email)}">${t('إزالة', 'Remove')}</button></td></tr>`).join('')}</tbody></table></div>` : `<div class="empty">${t('لا مشتركين بعد.', 'No subscribers yet.')}</div>`}</section>`;
    view.onclick = async (e) => { const b = e.target.closest('[data-del]'); if (b && sure(t('إزالة هذا البريد من القائمة؟', 'Remove this address from the list?'))) { done(await api('DELETE', '/api/admin/subscribers?email=' + encodeURIComponent(b.dataset.del)), t('أُزيل.', 'Removed.')); subscribers(); } };
    $('#sCsv').addEventListener('click', () => csv('subscribers', ['email', 'source', 'date'], L.map((s) => [s.email, s.source, s.date])));
  }
  async function messages() {
    head(t('الرسائل', 'Messages'), t('ما يكتبه الزوار في صفحة المساعدة', 'What visitors write on the help page')); loading();
    const r = await api('GET', '/api/admin/messages'); if (!r.ok) return; const L = r.data.messages; badge('messages', L.filter((m) => !m.read).length);
    view.innerHTML = `<section class="leaf">${L.length ? L.map((m) => `<article class="msg${m.read ? '' : ' new'}"><div class="hdr"><span><b>${esc(m.name || m.email)}</b> <span class="hint" dir="ltr">${esc(m.email)}</span>${m.topic ? ` <span class="tag">${esc(m.topic)}</span>` : ''}</span><span class="hint">${when(m.date)}${m.mailed ? '' : ' · ' + t('لم تُرسل بالبريد', 'not e-mailed')}</span></div><p dir="auto">${esc(m.body)}</p>
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
  const PNAME = { 'index.html': ['الرئيسية', 'Home'], 'shop.html': ['المتجر', 'Shop'], 'paintings.html': ['اللوحات', 'Paintings'], 'postcards.html': ['البطاقات البريدية', 'Postcards'], 'stickers.html': ['الملصقات', 'Stickers'], 'calendar.html': ['التقويم', 'Calendar'], 'story.html': ['الحكاية', 'Story'], 'account.html': ['الدخول', 'Sign in'], 'profile.html': ['الحساب', 'Account'], 'checkout.html': ['إتمام الشراء', 'Checkout'], 'help.html': ['المساعدة', 'Help'], 'terms.html': ['الشروط والخصوصية', 'Terms'], '404.html': ['صفحة غير موجودة', 'Not found'], 'soon.html': ['قريبًا', 'Coming soon'] };
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

  /* =====================================================================
     9 · Settings
     ===================================================================== */
  async function settings() {
    head(t('الإعدادات', 'Settings'), t('الأسعار والروابط', 'Prices and links')); loading();
    const r = await api('GET', '/api/admin/settings'); if (!r.ok) return; const P = r.data.prices || {}, K = r.data.links || {};
    const PR = [['painting', 'اللوحة', 'A painting'], ['postcard', 'البطاقة البريدية', 'A postcard'], ['sticker', 'الملصق الواحد', 'One sticker'], ['pack', 'مجموعة 6 ملصقات', 'A pack of 6 stickers'], ['calendar', 'التقويم', 'The calendar']];
    const LK = [['instagram', 'Instagram'], ['whatsapp', 'WhatsApp'], ['email', t('بريد التواصل', 'Contact e-mail')], ['donate', t('رابط التبرع', 'Donation link')], ['kofi', 'Ko-fi']];
    view.innerHTML = `<div class="cols even"><section class="leaf"><h2>${t('الأسعار باليورو', 'Prices in euro')}</h2><form class="in form" id="prF">${PR.map((p) => `<label class="f">${t(p[1], p[2])}<input type="number" name="${p[0]}" value="${P[p[0]] ?? ''}" min="0" step="0.5" dir="ltr" required></label>`).join('')}
      <p class="hint">${t('السعر هنا هو ما يُحسب عند الشراء. لكل قطعة سعر خاص اختياري من صفحة المنتجات.', 'These are the prices charged at checkout. A piece can have its own price in Products.')}</p><div><button class="btn go">${t('حفظ الأسعار', 'Save prices')}</button></div></form></section>
      <section class="leaf"><h2>${t('روابط التواصل والدعم', 'Contact and support links')}</h2><form class="in form" id="lkF">${LK.map((l) => `<label class="f">${l[1]}<input type="text" name="${l[0]}" value="${esc(K[l[0]] || '')}" dir="ltr" maxlength="200"></label>`).join('')}
      <p class="hint">${t('الفارغ يعني أن الرابط لا يظهر في الموقع.', 'An empty link is not shown on the site.')}</p><div><button class="btn go">${t('حفظ الروابط', 'Save links')}</button></div></form></section></div>`;
    $('#prF').addEventListener('submit', async (e) => { e.preventDefault(); const o = {}; PR.forEach((p) => (o[p[0]] = Number(e.target[p[0]].value))); done(await api('PUT', '/api/admin/settings', { prices: Object.assign({}, P, o) })); });
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
        ${u.twofa ? `<p style="margin:0">${t('عند كل دخول يُطلب رمز من تطبيق المصادقة بعد كلمة السر.', 'Every sign-in asks for a code from your authenticator app after the password.')}</p>
          <form class="form" id="tfOff"><div class="two"><label class="f">${t('كلمة السر', 'Password')}<input type="password" name="pw" autocomplete="current-password" dir="ltr" required></label><label class="f">${t('رمز من التطبيق أو رمز استرجاع', 'A code from the app or a recovery code')}<input type="text" name="code" inputmode="numeric" autocomplete="one-time-code" dir="ltr" required></label></div><div><button class="btn warn">${t('أوقفوا التحقق بخطوتين', 'Turn two-step off')}</button></div></form>`
        : `<p style="margin:0">${t('كلمة السر وحدها لا تكفي بعد التفعيل: يُطلب رمز من تطبيق مثل Google Authenticator أو Authy. هذه أقوى حماية لحساب الإدارة.', 'After this, the password alone is not enough: sign-in also asks for a code from an app such as Google Authenticator or Authy. It is the strongest protection for the admin account.')}</p><div><button type="button" class="btn go" id="tfOn">${t('ابدؤوا التفعيل', 'Start setting it up')}</button></div>`}</div></section>
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
    const off = $('#tfOff'); if (off) off.addEventListener('submit', async (e) => { e.preventDefault(); if (!sure(t('إيقاف التحقق بخطوتين يضعف حماية حساب الإدارة. متأكدون؟', 'Turning two-step off weakens the admin account. Sure?'))) return; if (done(await api('POST', '/api/me/2fa/disable', { password: e.target.pw.value, code: e.target.code.value }), t('أُوقف التحقق بخطوتين.', 'Two-step sign-in is off.'))) security(); });
  }

  /* ---------- the index and the router ---------- */
  const NAV = [['overview', 'نظرة عامة', 'Overview', overview], ['orders', 'الطلبات', 'Orders', orders], ['products', 'المنتجات', 'Products', products], ['customers', 'العملاء', 'Customers', customers], ['subscribers', 'مشتركو البريد', 'Subscribers', subscribers], ['messages', 'الرسائل', 'Messages', messages], null,
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
    view.onclick = null; view.onchange = null; nav(); $('#index').classList.remove('open'); $('#menuB').setAttribute('aria-expanded', 'false'); n[3](); view.focus({ preventScroll: true }); scrollTo(0, 0);
  }
  addEventListener('hashchange', route);
  $('#langB').addEventListener('click', () => { AR = !AR; try { localStorage.mgAdminLang = AR ? 'ar' : 'en'; } catch (e) {} route(); });
  $('#outB').addEventListener('click', async () => { await api('POST', '/api/logout'); try { localStorage.removeItem('mgUser'); } catch (e) {} location.href = '../index.html'; });
  $('#menuB').addEventListener('click', () => { const o = $('#index').classList.toggle('open'); $('#menuB').setAttribute('aria-expanded', o); });
  route();
})();
