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
    sticker: ['Sticker, PNG', 'ملصق، PNG'], pack: ['Sticker pack, PNG', 'مجموعة ملصقات، PNG'], calendar: ['Calendar 2027, PDF in A5', 'تقويم 2027، PDF بمقاس A5'],
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
  function bump() { const b = $('#bagb'); if (b && b.animate && !still) b.animate([{ transform: 'scale(1.12) rotate(-4deg)' }, { transform: 'none' }], { duration: 320, easing: 'ease-out' }); }
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
    const bb = $('#bagb'); if (bb) bb.addEventListener('click', openBag);
    const mb = $('#menub'), mm = $('#mmenu');
    if (mb && mm) {
      const toggle = (open) => { mm.hidden = !open; mb.setAttribute('aria-expanded', open); doc.body.style.overflow = open ? 'hidden' : ''; };
      mb.addEventListener('click', () => toggle(mm.hidden));
      mm.addEventListener('click', (e) => { if (e.target.closest('a')) toggle(false); });
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
      const b = e.target.closest('[data-add]'); if (!b) return; e.preventDefault();
      if (b.dataset.fmt === 'print') { const on = bag.toggle(b.dataset.add, b.dataset.add === 'calendar' ? DEF.calendar.id : b.dataset.id, 'print'); if (on) toast(t('The printed copy is in your bag.', 'أُضيفت النسخة المطبوعة إلى السلة.')); }
      else if (b.dataset.add === 'calendar') { if (b.classList.contains('add') && bag.has('calendar', DEF.calendar.id)) bag.drop('calendar', DEF.calendar.id); else { const added = bag.add('calendar', DEF.calendar.id); toast(added ? t('The calendar is in your bag.', 'أُضيف التقويم إلى السلة.') : t('The calendar is already in your bag.', 'التقويم في السلة.')); } }
      else if (isFree(b.dataset.add, b.dataset.id) && !bag.has(b.dataset.add, b.dataset.id)) { bag.add(b.dataset.add, b.dataset.id); location.href = 'checkout.html'; }
      else bag.toggle(b.dataset.add, b.dataset.id);
    });
    addEventListener('storage', (e) => { if (e.key === 'mgBag') rerender('bag'); if (e.key === 'mgUser') rerender('user'); });
    new ResizeObserver(() => tear()).observe(doc.body); addEventListener('load', () => tear());
  }

  /* an add-to-bag button for one piece (kept in step by rerender) */
  const addBtn = (kind, id, cls) => { const on = bag.has(kind, id); return `<button type="button" class="${cls || 'add'}" data-add="${kind}" data-id="${esc(id)}" aria-pressed="${on}">${on ? t('In your bag', 'في السلة') : isFree(kind, id) ? t('Free download', 'حمّلوها مجانًا') : t('Add to bag', 'أضيفوها إلى السلة')}</button>`; };

  const printBtn = (kind, id, cls) => { const pr = printOf(kind, id); if (!pr) return ''; const on = bag.has(kind, id, 'print');
    return `<button type="button" class="${cls || 'add'} pbtn" data-add="${kind}" data-id="${esc(id)}" data-fmt="print" aria-pressed="${on}">${on ? t('Printed copy in your bag', 'النسخة المطبوعة في السلة') : t(`Printed and shipped, ${fmt(pr.price)}`, `مطبوعة وتُشحن، ${fmt(pr.price)}`)}</button>`; };
  /* one product as a tile (tiles.css): the piece on a coloured sheet, linked to its own page */
  const PAGE = { painting: 'paintings.html', postcard: 'postcards.html', sticker: 'stickers.html', calendar: 'calendar.html' };
  function tile(p) {
    const cal = p.kind === 'calendar', cls = cal ? 'cal' : p.kind === 'sticker' ? 'stk ' + ((p.extra && p.extra.shape) || 'die') : p.kind === 'postcard' ? 'card' : 'print';
    const src = cal ? 'assets/c27-00.webp' : thumb(p.id, p), href = PAGE[p.kind] + (cal ? '' : '#' + p.id);
    const btn = cal ? `<button type="button" class="add" data-add="calendar" aria-pressed="${bag.has('calendar', DEF.calendar.id)}">${bag.has('calendar', DEF.calendar.id) ? t('In your bag', 'في السلة') : t('Add to bag', 'أضيفوه إلى السلة')}</button>` : addBtn(p.kind, p.id);
    return `<li class="pr-it"><a class="lk" href="${href}"><div class="bed paper ${cls}" data-tear="5"><span class="fill"></span><img src="${esc(src)}" alt="${esc(p.title_en)}, by Farah Al-Helou" loading="lazy"></div></a>
      <div class="meta"><h3>${esc(title(p))}</h3><span class="pr">${fmt(price(p.kind, p.id))}</span></div><span class="kd">${esc(kindLabel(p.kind))}</span>${printOf(p.kind, cal ? '' : p.id) ? `<span class="kd pt">${t('Also printed and shipped', 'متوفرة مطبوعة أيضًا')}</span>` : ''}${btn}</li>`;
  }
  window.MG = { $, $$, esc, t, L, still, store, get ar() { return AR; }, setLang, cat, products, product, title, img, thumb, price, isFree, printOf, shipping, fmt, kindLabel, bag, openBag, api, user, toast, tear, page, rerender, addBtn, printBtn, tile, calendar: DEF.calendar };

  function boot() { applyLang(); shell(); ready = true; rerender('init'); user.sync(); }
  doc.readyState === 'loading' ? doc.addEventListener('DOMContentLoaded', boot) : boot();
})();
