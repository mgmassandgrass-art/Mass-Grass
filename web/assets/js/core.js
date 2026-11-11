/* Mass & Grass · core. One object, window.MG, shared by every page:
   language (English / Arabic), the catalog and prices, the bag, who is signed in, torn-paper edges,
   the header, the phone menu and the newsletter form.
   A page registers itself with MG.page(render): render() runs once the page is ready and again whenever
   the language, the bag or the signed-in user changes what it shows. */
(function () {
  'use strict';
  const doc = document, root = doc.documentElement;
  const $ = (s, el) => (el || doc).querySelector(s), $$ = (s, el) => [...(el || doc).querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };

  /* ---------- language ---------- */
  let AR = root.lang === 'ar';
  const t = (en, ar) => (AR ? ar : en);
  const L = (pair) => (Array.isArray(pair) ? pair[AR ? 1 : 0] : pair);
  function applyLang() {
    root.lang = AR ? 'ar' : 'en'; root.dir = AR ? 'rtl' : 'ltr'; root.classList.toggle('ar-on', AR);
    $$('[data-ar]').forEach((e) => { if (e.dataset.en == null) e.dataset.en = e.innerHTML; e.innerHTML = AR ? e.dataset.ar : e.dataset.en; });
    $$('[data-ph-ar]').forEach((e) => { if (e.dataset.phEn == null) e.dataset.phEn = e.placeholder; e.placeholder = AR ? e.dataset.phAr : e.dataset.phEn; });
    $$('[data-label-ar]').forEach((e) => { if (e.dataset.labelEn == null) e.dataset.labelEn = e.getAttribute('aria-label') || ''; e.setAttribute('aria-label', AR ? e.dataset.labelAr : e.dataset.labelEn); });
    const lb = $('#lang'); if (lb) { lb.textContent = AR ? 'EN' : 'ع'; lb.setAttribute('aria-label', AR ? 'English' : 'العربية'); }
  }
  function setLang(ar) { AR = !!ar; try { localStorage.mgLang = AR ? 'ar' : 'en'; } catch (e) {} applyLang(); rerender('lang'); }

  /* ---------- catalog ---------- */
  const DEF = window.MG_DEFAULT || { prices: {}, products: [] };
  let server = null;
  try { const el = doc.getElementById('mg-cat'); if (el) server = JSON.parse(el.textContent); } catch (e) {}
  const cat = {
    prices: Object.assign({}, DEF.prices, server && server.prices),
    products: server && server.products && server.products.length ? server.products : DEF.products,
    links: (server && server.links) || {},
    live: !!server,
  };
  const products = (kind) => cat.products.filter((p) => p.kind === kind);
  const product = (kind, id) => cat.products.find((p) => p.kind === kind && p.id === id) || null;
  const title = (p) => (p ? (AR ? p.title_ar || p.title_en : p.title_en) : '');
  const img = (id, p) => (p && p.extra && p.extra.img) || 'assets/' + id + '.webp';
  /* small copy for grids: paintings have one (t-<id>), stickers and uploads use the image itself */
  const thumb = (id, p) => ((p && p.extra && p.extra.img) || /^(s-|u-)|^(girl-bike|truck)$/.test(id) ? img(id, p) : 'assets/t-' + id + '.webp');
  function price(kind, id) {
    const base = cat.prices[kind] != null ? cat.prices[kind] : 0;
    if (kind === 'pack' || kind === 'calendar' || !id) return base;
    const p = product(kind, id); if (!p) return base;
    const e = p.price != null ? p.price : base;
    return Math.round(e * (100 - (p.sale || 0))) / 100;
  }
  /* a printed copy, shipped: the admin switches it on per piece (extra.print = {on, price, size}); the calendar's is prices.calendarPrint */
  function printOf(kind, id) {
    if (kind === 'calendar') { const e = cat.prices.calendarPrint; return e > 0 ? { price: e, size: ['A5, landscape', 'A5 عرضي'] } : null; }
    const p = id && product(kind, id), pr = p && p.extra && p.extra.print;
    return pr && pr.on && Number(pr.price) > 0 ? { price: Number(pr.price), size: pr.size ? [pr.size, pr.size_ar || pr.size] : null } : null;
  }
  const shipping = (server && server.shipping) || {};
  const isFree = (kind, id) => { const p = id && product(kind, id); return !!p && p.price === 0; };
  const fmt = (e) => (e === 0 ? t('Free', 'مجانًا') : '€' + (Math.round(e * 100) % 100 ? e.toFixed(2) : String(Math.round(e))));
  const KIND = {
    painting: ['Painting, PDF and PNG', 'لوحة، PDF وPNG'], postcard: ['Postcard, PDF and PNG', 'بطاقة بريدية، PDF وPNG'],
    sticker: ['Sticker, PNG', 'ملصق، PNG'], pack: ['Sticker pack, PNG', 'مجموعة ملصقات، PNG'], calendar: ['Calendar, PDF in A5', 'تقويم، PDF بمقاس A5'],
  };
  const kindLabel = (k) => L(KIND[k] || ['Digital file', 'ملف رقمي']);

  /* ---------- the bag (kept in this browser; the server prices every line again at checkout) ---------- */
  const bag = {
    get() { const a = store.get('mgBag', []); return Array.isArray(a) ? a : []; },
    set(a) { store.set('mgBag', a); paintBag(); rerender('bag'); },
    count() { return this.get().length; },
    total() { return this.get().reduce((n, x) => n + (+x.p || 0) * (x.q || 1), 0); },
    printed() { return this.get().some((x) => x.fmt === 'print'); },
    /* a line is one piece in one form: the file (fmt unset) or a printed copy (fmt 'print', with a quantity q) */
    has(kind, id, fmt) { return this.get().some((x) => x.kind === kind && x.k === id && (x.fmt || '') === (fmt || '')); },
    add(kind, id, extra) {
      const fmt = (extra && extra.fmt) || '', a = this.get();
      if (kind !== 'pack' && a.some((x) => x.kind === kind && x.k === id && (x.fmt || '') === fmt)) return false;
      const p = product(kind, id), c = DEF.calendar;
      const line = kind === 'calendar' ? { k: c.id, kind, t: c.title[0], ta: c.title[1], p: price('calendar'), img: 'assets/c27-00.webp' }
        : { k: id, kind, t: p ? p.title_en : id, ta: p ? p.title_ar || p.title_en : id, p: price(kind, id), img: thumb(id, p) };
      if (fmt === 'print') { const pr = printOf(kind, id); if (!pr) return false; line.p = pr.price; line.fmt = 'print'; line.q = 1; }
      a.push(Object.assign(line, extra || {})); this.set(a); bump(); return true;
    },
    remove(i) { const a = this.get(); a.splice(i, 1); this.set(a); },
    qty(i, q) { const a = this.get(); if (a[i] && a[i].fmt === 'print') { a[i].q = Math.max(1, Math.min(10, q)); this.set(a); } },
    drop(kind, id, fmt) { this.set(this.get().filter((x) => !(x.kind === kind && x.k === id && (x.fmt || '') === (fmt || '')))); },
    toggle(kind, id, fmt) { if (this.has(kind, id, fmt)) { this.drop(kind, id, fmt); return false; } this.add(kind, id, fmt ? { fmt } : undefined); return true; },
    clear() { this.set([]); },
    /* stickers: every six (or four and more left over) go in as one pack at the pack price, the rest one by one */
    stickers(ids) {
      const a = this.get(); const free = ids.filter((id) => isFree('sticker', id)); let rest = ids.filter((id) => !free.includes(id));
      while (rest.length) {
        const n = rest.length >= 6 ? 6 : rest.length > 3 ? rest.length : 0; if (!n) break;
        const pk = rest.slice(0, n); rest = rest.slice(n);
        a.push({ k: 'pack-' + Date.now().toString(36) + a.length, kind: 'pack', t: `Sticker pack, ${pk.length} stickers`, ta: `مجموعة ملصقات، ${pk.length} ملصقات`, p: price('pack'), img: thumb(pk[0], product('sticker', pk[0])), pack: pk });
      }
      rest.concat(free).forEach((id) => { const p = product('sticker', id); a.push({ k: id, kind: 'sticker', t: p ? p.title_en : id, ta: p ? p.title_ar : id, p: price('sticker', id), img: thumb(id, p) }); });
      this.set(a); bump();
    },
  };
  function bump() { if (still) return; $$('.bagb .bn').forEach((b) => b.animate && b.animate([{ transform: 'translateY(-4px)' }, { transform: 'none' }], { duration: 280, easing: 'cubic-bezier(.22,1,.36,1)' })); }
  function paintBag() {
    const n = bag.count();
    $$('[data-bagn]').forEach((e) => (e.textContent = n));
    $$('.bagb').forEach((b) => { b.classList.toggle('has', n > 0); b.setAttribute('aria-label', t('Bag', 'السلة') + (n ? ` (${n})` : '')); });
    if (sheetEl && sheetEl.open) fillSheet();
  }

  /* the bag sheet */
  let sheetEl = null;
  function openBag() {
    if (!sheetEl) {
      sheetEl = doc.createElement('dialog'); sheetEl.className = 'bagd'; sheetEl.setAttribute('aria-labelledby', 'bagd-h'); doc.body.append(sheetEl);
      sheetEl.addEventListener('click', (e) => { if (e.target === sheetEl || e.target.closest('[data-close]')) sheetEl.close(); const r = e.target.closest('[data-rm]'); if (r) bag.remove(+r.dataset.rm); });
    }
    fillSheet(); if (!sheetEl.open) sheetEl.showModal();
  }
  function fillSheet() {
    const a = bag.get(); sheetEl.dir = AR ? 'rtl' : 'ltr';
    sheetEl.innerHTML = `<div class="bagd-in paper"><span class="fill"></span>
      <div class="bagd-hd"><h2 id="bagd-h">${t('Your bag', 'سلتكم')}</h2><button class="x" type="button" data-close aria-label="${t('Close', 'إغلاق')}">✕</button></div>
      ${a.length ? `<ul class="bagd-ls">${a.map((x, i) => `<li><span class="th"><img src="${esc(x.img)}" alt=""></span><div class="nm"><b>${esc(AR ? x.ta || x.t : x.t)}</b><small>${x.fmt === 'print' ? esc(t('Printed and shipped', 'مطبوعة وتُشحن')) + (x.q > 1 ? ' × ' + x.q : '') : esc(kindLabel(x.kind))}</small></div><div class="pr"><span>${fmt((+x.p || 0) * (x.q || 1))}</span><button type="button" class="rm" data-rm="${i}">${t('Remove', 'إزالة')}</button></div></li>`).join('')}</ul>
      <div class="bagd-ft"><p class="tt"><span>${t('Total', 'المجموع')}</span><b>${fmt(bag.total())}</b></p><a class="ink" href="checkout.html">${t('Checkout', 'إتمام الشراء')}</a><p class="note">${bag.printed() ? t('Shipping is added at checkout.', 'تُضاف أجرة الشحن عند إتمام الشراء.') : t('Digital files. The download links reach your email as soon as you pay.', 'ملفات رقمية. تصل روابط التحميل إلى بريدكم فور الدفع.')}</p></div>`
      : `<div class="bagd-em"><p>${t('Your bag is empty.', 'السلة فارغة.')}</p><a class="go" href="shop.html">${t('See the shop', 'تصفحوا المتجر')}</a></div>`}</div>`;
  }

  /* ---------- the server ---------- */
  async function api(method, path, body) {
    try {
      const r = await fetch(path, { method, credentials: 'same-origin', headers: body ? { 'content-type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
      if (!(r.headers.get('content-type') || '').includes('json')) return { ok: false, status: r.status, offline: true, data: null };
      return { ok: r.ok, status: r.status, data: await r.json() };
    } catch (e) { return { ok: false, status: 0, offline: true, data: null }; }
  }
  const user = {
    get() { return store.get('mgUser', null); },
    set(u) { const was = JSON.stringify(this.get()); store.set('mgUser', u); paintAcct(); if (ready && was !== JSON.stringify(u)) rerender('user'); },
    async sync() { const r = await api('GET', '/api/me'); if (r.offline) return this.get(); const u = (r.data && r.data.user) || null; this.set(u); return u; },
    async out() { this.set(null); await api('POST', '/api/logout'); },
  };
  function paintAcct() {
    const u = user.get();
    $$('.acct').forEach((a) => {
      a.href = u ? 'profile.html' : 'account.html';
      a.innerHTML = u ? `<b aria-hidden="true">${esc((u.name || u.email || '?').trim()[0].toUpperCase())}</b><span class="sr">${t('Your account', 'حسابكم')}</span>` : `<span>${t('Sign in', 'الدخول')}</span>`;
    });
  }

  /* ---------- a short note at the foot of the screen ---------- */
  function toast(msg) {
    let el = $('.mgtoast'); if (!el) { el = doc.createElement('p'); el.className = 'mgtoast'; el.setAttribute('role', 'status'); doc.body.append(el); }
    el.textContent = msg; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 2400);
  }

  /* ---------- torn edges: a ragged polygon per element, redrawn when sizes change ---------- */
  const rnd = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  function tearOne(el, amp, seed, topOnly) {
    return; /* the collage's torn edges were retired with the Nov 2026 design system: sheets are flat now */
    const w = el.offsetWidth, h = el.offsetHeight; if (!w || !h) return;
    const key = w + 'x' + h; if (el._torn === key) return; el._torn = key;
    const r = rnd(seed), pts = [], step = Math.max(5, amp * 0.9);
    const j = () => Math.max(0, amp + (r() - 0.5) * 2 * amp * 0.9), P = (x, y) => pts.push(`${((x / w) * 100).toFixed(2)}% ${((y / h) * 100).toFixed(2)}%`);
    for (let x = 0; x <= w; x += step) P(x, j());
    if (topOnly) { P(w, h); P(0, h); }
    else { for (let y = 0; y <= h; y += step) P(w - j(), y); for (let x = w; x >= 0; x -= step) P(x, h - j()); for (let y = h; y >= 0; y -= step) P(j(), y); }
    el.style.clipPath = `polygon(${pts.join(',')})`;
  }
  let tearQueued = false;
  function tear() {
    if (tearQueued) return; tearQueued = true;
    requestAnimationFrame(() => {
      tearQueued = false;
      $$('[data-tear],[data-tear-top]').forEach((el) => {
        if (el._seed == null) { el._seed = 1000 + (tear.n = (tear.n || 0) + 1) * 97; }
        tearOne(el, +(el.dataset.tear || el.dataset.tearTop), el._seed, 'tearTop' in el.dataset);
      });
    });
  }

  /* ---------- pages ---------- */
  const pages = []; let ready = false;
  function page(fn) { pages.push(fn); if (ready) run(fn, 'init'); }
  function run(fn, why) { try { fn(why); } catch (e) { console.error(e); } }
  function rerender(why) { if (!ready) return; pages.forEach((fn) => run(fn, why || 'init')); $$('[data-price]').forEach((e) => (e.textContent = fmt(price(e.dataset.price)))); paintAcct(); paintBag(); tear(); }

  /* ---------- header, menu, newsletter ---------- */
  function shell() {
    const head = $('header');
    if (head) {
      const set = () => root.style.setProperty('--head', head.offsetHeight + 'px'); set(); new ResizeObserver(set).observe(head);
      const on = () => head.classList.toggle('stuck', scrollY > 4); on(); addEventListener('scroll', on, { passive: true });
    }
    const lb = $('#lang'); if (lb) lb.addEventListener('click', () => setLang(!AR));
    $$('.bagb').forEach((b) => b.addEventListener('click', openBag));
    const sb = $('#shopb'), sd = $('#shopdd');
    if (sb && sd) {
      const here = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '');
      if (['shop', 'paintings', 'postcards', 'stickers', 'calendar'].includes(here)) { sb.classList.add('cur'); const a = sd.querySelector(`a[href="${here}.html"]`); if (a) a.setAttribute('aria-current', 'page'); }
      const open = (on) => { sd.hidden = !on; sb.setAttribute('aria-expanded', on); };
      sb.addEventListener('click', (e) => { e.stopPropagation(); open(sd.hidden); });
      /* with a mouse the list opens on hover, as on the reference, and closes a moment after the pointer leaves */
      if (matchMedia('(hover:hover)').matches) { const dd = sb.parentNode; let tm = 0;
        dd.addEventListener('pointerenter', () => { clearTimeout(tm); open(true); });
        dd.addEventListener('pointerleave', () => { tm = setTimeout(() => open(false), 160); }); }
      doc.addEventListener('click', (e) => { if (!sd.hidden && !e.target.closest('.dd')) open(false); });
      addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sd.hidden) { open(false); sb.focus(); } });
    }
    paintSocial(); pages.push((why) => { if (why === 'lang') paintSocial(); });
    const mb = $('#menub'), mm = $('#mmenu');
    if (mb && mm) {
      const toggle = (open) => { mm.hidden = !open; mb.setAttribute('aria-expanded', open); doc.body.style.overflow = open ? 'hidden' : ''; };
      mb.addEventListener('click', () => toggle(mm.hidden));
      mm.addEventListener('click', (e) => { if (e.target.closest('a')) toggle(false); if (e.target.closest('[data-openbag]')) { toggle(false); openBag(); } });
      addEventListener('keydown', (e) => { if (e.key === 'Escape' && !mm.hidden) toggle(false); });
    }
    /* newsletter: it only says thank you once the server has the address */
    const nl = $('#nl');
    if (nl) nl.addEventListener('submit', async (e) => {
      e.preventDefault(); const v = $('#nl-mail'), ok = $('#nl-ok'), bad = t('That did not go through. Please try again later.', 'لم يصل الطلب. حاولوا مرة أخرى لاحقًا.');
      if (!(v.validity.valid && v.value)) { ok.textContent = t('Please enter a valid email, like name@mail.com', 'اكتبوا بريدًا إلكترونيًا صحيحًا، مثل name@mail.com'); return; }
      ok.textContent = t('Sending…', 'جارٍ الإرسال…');
      const r = await api('POST', '/api/subscribe', { email: v.value, source: 'footer' });
      ok.textContent = r.ok ? t('Thank you. Your first postcard is on its way.', 'شكرًا لكم. أول بطاقة في الطريق.') : bad; if (r.ok) v.value = '';
    });
    /* any [data-add="calendar"] puts the calendar in the bag; [data-add-kind][data-add-id] toggles one piece */
    doc.addEventListener('click', (e) => {
      const sh = e.target.closest('[data-share]'); if (sh) { e.preventDefault(); share(sh); return; }
      if (shrm && !e.target.closest('.shrm')) closeShare();
      const b = e.target.closest('[data-add]'); if (!b) return; e.preventDefault();
      if (b.dataset.fmt === 'print') { const on = bag.toggle(b.dataset.add, b.dataset.add === 'calendar' ? DEF.calendar.id : b.dataset.id, 'print'); if (on) toast(t('The printed copy is in your bag.', 'أُضيفت النسخة المطبوعة إلى السلة.')); }
      else if (b.dataset.add === 'calendar') { if (b.classList.contains('add') && bag.has('calendar', DEF.calendar.id)) bag.drop('calendar', DEF.calendar.id); else { const added = bag.add('calendar', DEF.calendar.id); toast(added ? t('The calendar is in your bag.', 'أُضيف التقويم إلى السلة.') : t('The calendar is already in your bag.', 'التقويم في السلة.')); } }
      else if (isFree(b.dataset.add, b.dataset.id) && !bag.has(b.dataset.add, b.dataset.id)) { bag.add(b.dataset.add, b.dataset.id); location.href = 'checkout.html'; }
      else bag.toggle(b.dataset.add, b.dataset.id);
    });
    addEventListener('keydown', (e) => { if (e.key === 'Escape') closeShare(); }); addEventListener('scroll', closeShare, { passive: true });
    addEventListener('storage', (e) => { if (e.key === 'mgBag') rerender('bag'); if (e.key === 'mgUser') rerender('user'); });
    new ResizeObserver(() => tear()).observe(doc.body); addEventListener('load', () => tear());
  }

  /* ---------- share: the phone's own share sheet when there is one, else a small menu ---------- */
  const PAGE = { painting: 'paintings.html', postcard: 'postcards.html', sticker: 'stickers.html', calendar: 'calendar.html' };
  const IC = {
    share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4M8 7.5L12 3.5l4 4M5 12.5v6.2c0 .7.6 1.3 1.3 1.3h11.4c.7 0 1.3-.6 1.3-1.3v-6.2"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2a9.8 9.8 0 0 0-8.4 14.8L2.2 21.8l4.9-1.3A9.8 9.8 0 1 0 12 2.2zm0 1.8a8 8 0 1 1-4.2 14.8l-.3-.2-2.8.8.8-2.7-.2-.3A8 8 0 0 1 12 4zm-3.300 3.900c-.2 0-.5.1-.7.4-.3.300-1 1-1 2.300s1 2.700 1.200 2.900c.1.2 2 3.200 5 4.300 2.400.9 2.900.7 3.400.7.500-.1 1.700-.7 1.900-1.400.2-.7.2-1.200.2-1.400-.1-.1-.3-.2-.600-.4l-2-.9c-.300-.1-.5-.2-.7.1l-.9 1.200c-.2.2-.3.2-.6.1-.300-.2-1.200-.5-2.300-1.400-.9-.800-1.400-1.700-1.600-2-.2-.3 0-.5.1-.600l.5-.5c.1-.2.2-.300.3-.5.1-.2 0-.4 0-.5l-.9-2.200c-.2-.5-.4-.5-.6-.5z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.500 21v-7.500h2.500l.4-3h-2.900V8.600c0-.9.300-1.500 1.500-1.500h1.500V4.400c-.3 0-1.200-.1-2.200-.1-2.200 0-3.800 1.400-3.800 3.900v2.300H8v3h2.500V21z"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.700 3.500h3l-6.600 7.500 7.700 10.200h-6l-4.700-6.200-5.400 6.200h-3l7-8L2.300 3.500h6.200l4.300 5.600zm-1 15.900h1.700L7.500 5.200H5.700z"/></svg>',
    pinterest: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.500a9.500 9.500 0 0 0-3.500 18.300c-.1-.8-.2-2 0-2.800l1.100-4.700s-.3-.6-.3-1.400c0-1.300.8-2.300 1.700-2.300.800 0 1.200.6 1.200 1.300 0 .8-.5 2-.8 3.100-.2.9.5 1.700 1.400 1.700 1.700 0 3-1.800 3-4.400 0-2.300-1.700-3.900-4-3.900a4.200 4.200 0 0 0-4.400 4.200c0 .8.3 1.700.7 2.200.1.100.1.200.1.300l-.3 1.100c0 .2-.1.200-.3.100-1.200-.6-1.900-2.300-1.900-3.700 0-3 2.200-5.800 6.300-5.800 3.300 0 5.900 2.400 5.900 5.500 0 3.300-2.100 6-5 6-1 0-1.900-.5-2.200-1.100l-.6 2.300c-.2.800-.8 1.900-1.200 2.500A9.500 9.500 0 1 0 12 2.500z"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.700 4.300L3.600 10.900c-1.200.5-1.200 1.100-.2 1.400l4.400 1.400 1.700 5.100c.2.600.4.800.8.800s.600-.2.900-.5l2.100-2.100 4.400 3.300c.8.400 1.400.2 1.600-.8l2.900-13.600c.3-1.200-.5-1.800-1.500-1.600zM9.400 13.400l8.300-5.200c.4-.2.700-.1.4.2l-6.900 6.200-.3 3.200z"/></svg>',
    link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.600 13.400a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1 1.400 1.400 1-1a2 2 0 0 1 2.900 2.900l-3 3a2 2 0 0 1-2.900 0zm2.800-2.800a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1-1.400-1.400-1 1a2 2 0 0 1-2.900-2.900l3-3a2 2 0 0 1 2.900 0z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7.300a4.700 4.700 0 1 0 0 9.400 4.700 4.700 0 0 0 0-9.400zm0 7.700a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm6-7.900a1.100 1.100 0 1 1-2.200 0 1.100 1.100 0 0 1 2.200 0zM16.300 3H7.700A4.700 4.700 0 0 0 3 7.700v8.600A4.700 4.700 0 0 0 7.700 21h8.600a4.700 4.700 0 0 0 4.700-4.700V7.700A4.700 4.700 0 0 0 16.300 3zm3 13.300a3 3 0 0 1-3 3H7.700a3 3 0 0 1-3-3V7.700a3 3 0 0 1 3-3h8.600a3 3 0 0 1 3 3z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.500 3h-3v12.300a2.600 2.600 0 1 1-2.600-2.600c.3 0 .5 0 .8.100V9.700a5.700 5.700 0 1 0 4.800 5.600V9.100c1.200.9 2.600 1.300 4 1.300V7.400c-2.200 0-4-1.900-4-4.400z"/></svg>',
    email: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.500 5.500h17a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1zm1.300 1.800v.4l7.200 5 7.200-5v-.4zm14.400 2.600L12 14.900 4.800 9.900v6.800h14.400z"/></svg>',
  };
  /* the address people share: on the live site a small page of its own (so the link shows the piece's picture), else the piece's place on its page */
  const shareUrl = (kind, id) => { const base = 'https://www.massandgrass.com/'; return cat.live ? `${base}s/${kind}/${encodeURIComponent(id || 'calendar')}` : base + PAGE[kind].replace('.html', '') + (kind === 'calendar' ? '' : '#' + id); };
  const shareName = (kind, id) => { const p = product(kind, id); return kind === 'calendar' ? t('Things kept in bottles, the calendar', 'أشياء نحفظها في قوارير، التقويم') : title(p) || id; };
  const shareBtn = (kind, id) => `<button type="button" class="shr" data-share="${kind}" data-id="${esc(id || '')}" aria-label="${esc(t('Share', 'شاركوها') + ': ' + shareName(kind, id))}">${IC.share}</button>`;
  let shrm = null;
  function closeShare() { if (shrm) { shrm.remove(); shrm = null; } }
  async function share(btn) {
    const kind = btn.dataset.share, id = btn.dataset.id, url = shareUrl(kind, id), name = shareName(kind, id);
    const text = t(`${name}, a watercolour by Farah Al-Helou from Gaza`, `${name}، لوحة مائية لفرح الحلو من غزة`);
    if (navigator.share && matchMedia('(pointer:coarse)').matches) { try { await navigator.share({ title: 'Mass & Grass', text, url }); } catch (e) {} return; }
    if (shrm && shrm._for === btn) return closeShare(); closeShare();
    const u = encodeURIComponent(url), tx = encodeURIComponent(text), image = encodeURIComponent('https://www.massandgrass.com/' + (kind === 'calendar' ? 'assets/c27-00.webp' : img(id, product(kind, id))));
    const rows = [['whatsapp', 'WhatsApp', `https://wa.me/?text=${tx}%20${u}`], ['facebook', 'Facebook', `https://www.facebook.com/sharer/sharer.php?u=${u}`], ['x', 'X', `https://twitter.com/intent/tweet?text=${tx}&url=${u}`],
      ['pinterest', 'Pinterest', `https://pinterest.com/pin/create/button/?url=${u}&media=${image}&description=${tx}`], ['telegram', 'Telegram', `https://t.me/share/url?url=${u}&text=${tx}`]];
    shrm = doc.createElement('div'); shrm.className = 'shrm'; shrm._for = btn; shrm.setAttribute('role', 'menu'); shrm.dir = AR ? 'rtl' : 'ltr';
    shrm.innerHTML = rows.map((r) => `<a role="menuitem" href="${r[2]}" target="_blank" rel="noopener noreferrer">${IC[r[0]]}${r[1]}</a>`).join('') + `<button type="button" role="menuitem" data-copy>${IC.link}${t('Copy the link', 'انسخوا الرابط')}</button>`;
    (btn.closest('dialog') || doc.body).append(shrm);
    const r = btn.getBoundingClientRect(), host = btn.closest('dialog'), hr = host ? host.getBoundingClientRect() : { left: -scrollX, top: -scrollY };
    const w = shrm.offsetWidth, h = shrm.offsetHeight, left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 8)), top = r.bottom + h + 8 > innerHeight ? r.top - h - 8 : r.bottom + 8;
    shrm.style.left = left - hr.left + 'px'; shrm.style.top = top - hr.top + 'px';
    shrm.addEventListener('click', async (e) => { if (e.target.closest('[data-copy]')) { try { await navigator.clipboard.writeText(url); toast(t('Link copied.', 'نُسخ الرابط.')); } catch (er) { toast(url); } } closeShare(); });
    shrm.querySelector('a').focus();
  }
  /* the shop's own social links (the admin's settings); the contact e-mail is always there */
  function paintSocial() {
    const el = $('#soc'); if (!el) return; const k = cat.links || {}, mail = k.email || 'info@massandgrass.com';
    const url = (v, base) => (/^https?:\/\//.test(v) ? v : base + String(v).replace(/^@/, ''));
    const rows = [k.instagram && ['instagram', 'Instagram', url(k.instagram, 'https://instagram.com/')], k.facebook && ['facebook', 'Facebook', url(k.facebook, 'https://facebook.com/')], k.tiktok && ['tiktok', 'TikTok', url(k.tiktok, 'https://tiktok.com/@')],
      k.whatsapp && ['whatsapp', 'WhatsApp', url(k.whatsapp, 'https://wa.me/').replace(/[+\s]/g, '')], ['email', 'E-mail', 'mailto:' + mail]].filter(Boolean);
    el.innerHTML = rows.map((r) => `<a href="${esc(r[2])}" aria-label="${r[1]}"${r[0] === 'email' ? '' : ' target="_blank" rel="noopener noreferrer"'}>${IC[r[0]]}</a>`).join('');
    /* the footer's contact list: help, the e-mail, WhatsApp and Instagram when set, and how to support Farah */
    const fc = $('#ftc'); if (!fc) return; const ext = ' target="_blank" rel="noopener noreferrer"', sup = k.donate || k.kofi;
    fc.innerHTML = `<li><a href="help.html">${t('Help and questions', 'المساعدة والأسئلة')}</a></li><li><a href="mailto:${esc(mail)}" dir="ltr">${esc(mail)}</a></li>` +
      rows.filter((r) => r[0] === 'whatsapp' || r[0] === 'instagram').map((r) => `<li><a href="${esc(r[2])}"${ext}>${r[1]}</a></li>`).join('') +
      `<li><a href="${sup ? esc(url(sup, 'https://')) + '"' + ext : 'story.html#support"'}>${t('Support Farah', 'ادعموا فرح')}</a></li>`;
  }

  /* an add-to-bag button for one piece (kept in step by rerender) */
  const addBtn = (kind, id, cls) => { const on = bag.has(kind, id); return `<button type="button" class="${cls || 'add'}" data-add="${kind}" data-id="${esc(id)}" aria-pressed="${on}">${on ? t('In your bag', 'في السلة') : isFree(kind, id) ? t('Free download', 'حمّلوها مجانًا') : t('Add to bag', 'أضيفوها إلى السلة')}</button>`; };

  const printBtn = (kind, id, cls) => { const pr = printOf(kind, id); if (!pr) return ''; const on = bag.has(kind, id, 'print');
    return `<button type="button" class="${cls || 'add'} pbtn" data-add="${kind}" data-id="${esc(id)}" data-fmt="print" aria-pressed="${on}">${on ? t('Printed copy in your bag', 'النسخة المطبوعة في السلة') : t(`Printed and shipped, ${fmt(pr.price)}`, `مطبوعة وتُشحن، ${fmt(pr.price)}`)}</button>`; };
  /* one product as a tile (tiles.css): the piece on a coloured sheet, linked to its own page */
  function tile(p) {
    const cal = p.kind === 'calendar', cls = cal ? 'cal' : p.kind === 'sticker' ? 'stk ' + ((p.extra && p.extra.shape) || 'die') : p.kind === 'postcard' ? 'card' : 'print';
    const src = cal ? 'assets/c27-00.webp' : thumb(p.id, p), href = PAGE[p.kind] + (cal ? '' : '#' + p.id);
    const btn = cal ? `<button type="button" class="add" data-add="calendar" aria-pressed="${bag.has('calendar', DEF.calendar.id)}">${bag.has('calendar', DEF.calendar.id) ? t('In your bag', 'في السلة') : t('Add to bag', 'أضيفوه إلى السلة')}</button>` : addBtn(p.kind, p.id);
    return `<li class="pr-it"><a class="lk" href="${href}" data-peek="${p.kind}:${cal ? '' : esc(p.id)}"><div class="bed paper ${cls}"><span class="fill"></span><img src="${esc(src)}" alt="${esc(p.title_en)}, by Farah Al-Helou" loading="lazy"></div></a>
      <div class="meta"><h3>${esc(title(p))}</h3><span class="pr">${fmt(price(p.kind, p.id))}</span></div><span class="kd">${esc(kindLabel(p.kind))}</span>${printOf(p.kind, cal ? '' : p.id) ? `<span class="kd pt">${t('Also printed and shipped', 'متوفرة مطبوعة أيضًا')}</span>` : ''}<div class="acts">${btn}${shareBtn(p.kind, cal ? '' : p.id)}</div></li>`;
  }
  window.MG = { $, $$, esc, t, L, still, store, get ar() { return AR; }, setLang, cat, products, product, title, img, thumb, price, isFree, printOf, shipping, fmt, kindLabel, bag, openBag, api, user, toast, tear, page, rerender, addBtn, printBtn, shareBtn, tile, PAGE, calendar: DEF.calendar };

  function boot() { applyLang(); shell(); ready = true; rerender('init'); user.sync(); }
  doc.readyState === 'loading' ? doc.addEventListener('DOMContentLoaded', boot) : boot();
})();
