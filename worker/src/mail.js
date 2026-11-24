// E-mails through Resend: order confirmation with download links, gifts, the owner's notice, contact messages.
import { orderFiles } from './files.js';
import { calFile } from './util.js';

export async function sendMail(env, to, subject, html, replyTo) {
  if (!env.RESEND_API_KEY) { console.log('[mail not configured]', to, subject); return false; }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: env.MAIL_FROM, to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!r.ok) console.error('resend', r.status, (await r.text()).slice(0, 300));
  return r.ok;
}

const e = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// The site's look in an e-mail (owner, 24 Nov 2026: like the calendar page): a white sheet, fine grey rules, the logo, headings
// lettered in the calendar's hand (as pictures, since Gmail ignores web fonts), the reading text in Quicksand where the mail app
// allows it and a plain sans where it does not, the calendar's rose for links.
const ORIGIN = 'https://www.massandgrass.com';
export const C = { paper: '#FFFFFF', sheet: '#FFFFFF', soft: '#F7F6F3', ink: '#2B2F2C', grey: '#6E5640', rose: '#9C4F52', line: '#E3E1DC' };
export const MONO = "'Quicksand','Helvetica Neue',Helvetica,Arial,sans-serif";
const cap = `font:500 11px/1.5 ${MONO};letter-spacing:.15em;text-transform:uppercase;color:${C.grey}`;
export const btn = (href, label) => `<a href="${e(href)}" style="display:inline-block;background:${C.ink};color:#FFFFFF;text-decoration:none;padding:12px 18px;font:500 11px/1 ${MONO};letter-spacing:.15em;text-transform:uppercase">${e(label)}</a>`;
// a heading lettered in the hand: the English and the Arabic pictures (made by the session's tools, in web/assets)
export const heading = (en, ar, alt) => `<div style="margin:0 0 6px"><img src="${ORIGIN}/assets/mail-${en}.png" alt="${e(alt)}" height="56" style="display:block;height:56px;width:auto;border:0"></div>${ar ? `<div dir="rtl" style="text-align:right;margin:0 0 20px"><img src="${ORIGIN}/assets/mail-${ar}.png" alt="" height="40" style="display:inline-block;height:40px;width:auto;border:0"></div>` : ''}`;
export const p = (html, extra = '') => `<p style="margin:0 0 16px;font:400 14px/1.75 ${MONO};color:${C.ink};${extra}">${html}</p>`;
export const pAr = (html) => `<p dir="rtl" style="margin:0 0 16px;text-align:right;font:400 15px/1.8 'Readex Pro',Tahoma,Arial,sans-serif;color:${C.ink}">${html}</p>`;
export const small = (html) => `<p style="margin:16px 0 0;font:400 12px/1.7 ${MONO};color:${C.grey}">${html}</p>`;
export const layout = (body) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light">
<style>@font-face{font-family:'Quicksand';font-weight:400;src:url(${ORIGIN}/fonts/quicksand-latin-400-normal.woff2) format('woff2')}@font-face{font-family:'Quicksand';font-weight:500;src:url(${ORIGIN}/fonts/quicksand-latin-500-normal.woff2) format('woff2')}@font-face{font-family:'Readex Pro';font-weight:500;src:url(${ORIGIN}/fonts/readex-pro-arabic-500.woff2) format('woff2')}
a{color:${C.rose}}@media(max-width:620px){.pad{padding:28px 4px!important}}</style></head>
<body style="margin:0;padding:0;background:${C.paper}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper}"><tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
<tr><td align="center" style="padding:0 0 24px"><a href="${ORIGIN}" style="text-decoration:none"><img src="${ORIGIN}/assets/mail-logo.png" alt="MASS &amp; GRASS" width="74" height="56" style="display:block;border:0"></a></td></tr>
<tr><td class="pad" style="background:${C.sheet};border-top:1px solid ${C.ink};border-bottom:1px solid ${C.line};padding:40px 8px">${body}</td></tr>
<tr><td style="padding:20px 4px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="${cap}">Painted by hand in Gaza</td><td align="right" style="${cap}"><a href="mailto:info@massandgrass.com" style="color:${C.rose};text-decoration:none">info@massandgrass.com</a></td></tr></table></td></tr>
</table></td></tr></table></body></html>`;
// a ruled list of label / value rows (the receipt)
const rows = (list) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.ink};margin:0 0 32px">${list.map(([k, v]) =>
  `<tr><td style="padding:12px 0;border-bottom:1px solid ${C.line};${cap}">${k}</td><td align="right" style="padding:12px 0;border-bottom:1px solid ${C.line};font:500 13px/1.4 ${MONO};color:${C.ink}">${v}</td></tr>`).join('')}</table>`;
const thumbOf = (it) => `${ORIGIN}/assets/${it.kind === 'calendar' ? (it.k === 'palestine-2027' ? 't-ps-00' : 't-v2-00') : it.kind === 'book' ? 'book/pg-01' : it.kind === 'design' ? it.k : 't-' + (it.kind === 'pack' ? (it.pack || [])[0] : it.k)}.webp`;
const KIND = { painting: 'Painting', postcard: 'Postcard', sticker: 'Sticker', pack: 'Sticker pack', calendar: 'Calendar', design: 'Design', book: 'Book' };
const filesOf = (it, files) => it.kind === 'pack' ? files.filter((f) => f.kind === 'sticker' && (it.pack || []).includes(f.product_id))
  : it.kind === 'calendar' ? files.filter((f) => f.kind === 'calendar' && f.product_id === calFile(it.k)) : files.filter((f) => f.kind === it.kind && f.product_id === it.k);
const fileRows = (env, fs) => fs.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 0">${fs.map((f) =>
  `<tr><td style="padding:8px 0;border-top:1px solid ${C.line};font:500 12px/1.4 ${MONO};color:${C.ink};word-break:break-all">${e(f.name)}</td><td align="right" style="padding:8px 0 8px 12px;border-top:1px solid ${C.line};white-space:nowrap">${btn(env.SITE_ORIGIN + f.url, 'Download')}</td></tr>`).join('')}</table>`
  : `<p style="margin:8px 0 0;font:400 12px/1.6 ${MONO};color:${C.grey}">Farah is preparing this file; it reaches you within a day. · يُجهَّز الملف ويصلكم خلال يوم.</p>`;
const KIND_AR = { painting: 'لوحة', postcard: 'بطاقة بريدية', sticker: 'ملصق', pack: 'مجموعة ملصقات', calendar: 'تقويم', design: 'تصميم', book: 'كتاب' };
// one piece: its picture on the cream, its name (and the Arabic one), what it is, then its files
const piece = (env, it, files) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px"><tr>
  <td width="88" valign="top" style="padding:0 16px 0 0"><div style="width:88px;height:88px;background:${C.paper};border:1px solid ${C.line};text-align:center;line-height:88px"><img src="${e(thumbOf(it))}" alt="" width="64" style="vertical-align:middle;max-width:64px;max-height:64px;background:#fff;padding:3px;border:0"></div></td>
  <td valign="top"><div style="font:500 15px/1.4 ${MONO};color:${C.ink}">${e(it.t || it.k)}</div>${it.ta ? `<div dir="rtl" style="text-align:left;font:500 14px/1.6 'Readex Pro',Tahoma,sans-serif;color:${C.ink}">${e(it.ta)}</div>` : ''}
  <div style="margin:4px 0 0;${cap};color:${C.rose}">${KIND[it.kind] || ''}${it.fmt === 'print' ? ` · printed${it.q > 1 ? ' × ' + it.q : ''}` : ''} · ${KIND_AR[it.kind] || ''}</div>
  ${it.fmt === 'print' ? '' : fileRows(env, filesOf(it, files))}</td></tr></table>`;

// Sent once, when an order becomes paid.
export async function orderPaidEmails(env, o) {
  const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
  const files = await orderFiles(env, { ...o, status: 'paid' });
  const gifts = items.filter((it) => it.gift);
  const when = new Date(o.paid_at || o.created_at || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  await sendMail(env, o.email, `Your files from Gaza · ${o.id} · ملفاتكم من غزة`, layout(`
    ${heading('thanks', 'thanks-ar', 'Thank you')}
    ${p(`${o.name ? e(o.name) + ', your' : 'Your'} order is sealed in Gaza and sent to you. Each piece you take home helps Farah keep painting.`)}
    ${pAr('خُتم طلبكم في غزة وأُرسل إليكم. كل قطعة تأخذونها تساعد فرح على مواصلة الرسم.')}
    ${rows([['Order', e(o.id)], ['Date', e(when)], ['Total', o.total_cents ? '€' + (o.total_cents / 100).toFixed(2) : 'Free · مجانًا']])}
    ${items.filter((it) => !it.gift).map((it) => piece(env, it, files)).join('')}
    ${shipBlock(o)}${gifts.length ? p(`Gifts on their way to ${gifts.map((g) => e(g.gift.to)).join(', ')}.`) : ''}
    <img src="${ORIGIN}/assets/signature.png" alt="Farah" width="120" style="display:block;margin:24px 0 0;border:0">
    ${small('Keep this e-mail: the links are yours. With an account, you also find them in your profile.')}
    <p dir="rtl" style="margin:4px 0 0;text-align:right;font:400 13px/1.7 'Readex Pro',Tahoma,sans-serif;color:${C.grey}">احفظوا هذه الرسالة: الروابط لكم، وتجدونها أيضًا في حسابكم.</p>`));
  for (const g of gifts) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(g.gift.em || '')) continue;
    await sendMail(env, g.gift.em, `A gift from Gaza for you · هدية لكم من غزة`, layout(`
      ${heading('gift', 'gift-ar', 'A gift for you')}
      ${p(`${e(g.gift.to)}, someone sent you a watercolour from Gaza, painted by Farah Al-Helou.`)}
      ${pAr('أرسل إليكم أحدهم لوحة مائية من غزة، رسمتها فرح الحلو.')}
      ${g.gift.m ? `<div style="margin:0 0 24px;padding:16px 20px;border-left:2px solid ${C.rose};background:${C.soft};font:400 14px/1.75 ${MONO};color:${C.ink}">${e(g.gift.m)}</div>` : ''}
      ${piece(env, g, files)}`), o.email);
  }
  if (env.ADMIN_EMAIL && o.total_cents > 0) await sendMail(env, env.ADMIN_EMAIL, `New order ${o.id} · €${(o.total_cents / 100).toFixed(2)} · طلب جديد`, layout(`
    ${p(`<b>${e(o.name || '')}</b> &lt;${e(o.email)}&gt; paid <b>€${(o.total_cents / 100).toFixed(2)}</b>.`)}
    ${rows(items.map((it) => [e(KIND[it.kind] || it.kind), `${e(it.t || it.k)}${it.fmt === 'print' ? ` · PRINTED × ${it.q || 1}` : ''}${it.gift ? ` → gift for ${e(it.gift.to)}` : ''}`]))}${shipBlock(o)}
    <p style="margin:24px 0 0">${btn(env.SITE_ORIGIN + '/admin/#orders', 'Open orders')}</p>`), o.email);
}

// The shipping address on an order, for the buyer's and the owner's e-mails.
function shipBlock(o) {
  const s = o.ship ? (typeof o.ship === 'string' ? JSON.parse(o.ship) : o.ship) : null;
  if (!s) return '';
  return `<div style="margin:8px 0 24px;padding:16px 20px;background:${C.soft};border:1px solid ${C.line}"><div style="${cap};margin:0 0 8px">Shipping to · الشحن إلى</div>
    <div style="font:400 13px/1.7 ${MONO};color:${C.ink}">${e(s.name)}<br>${e(s.line1)}${s.line2 ? '<br>' + e(s.line2) : ''}<br>${e(s.postal ? s.postal + ' ' : '')}${e(s.city)}, ${e(s.country)}<br>${e(s.phone)}</div></div>`;
}
// Sent when the admin marks a printed order as sent.
export async function shippedEmail(env, o) {
  return sendMail(env, o.email, `Your prints are on their way · ${o.id} · طلبكم في الطريق`, layout(`
    ${heading('way', 'way-ar', 'On their way')}
    ${p(`Your printed pieces from order <b>${e(o.id)}</b> left Farah’s studio today.`)}
    ${pAr(`خرجت قطعكم المطبوعة من الطلب ${e(o.id)} من المرسم اليوم.`)}
    ${o.tracking ? rows([['Tracking · رقم التتبع', e(o.tracking)]]) : ''}${shipBlock(o)}`));
}

export async function contactEmail(env, b) {
  return sendMail(env, env.ADMIN_EMAIL || 'info@massandgrass.com', `Contact · ${b.topic || 'Message'} · ${b.name || b.email}`, layout(`
    ${p(`<b>${e(b.name || '')}</b> &lt;${e(b.email)}&gt;`)}${b.topic ? p(`<b>${e(b.topic)}</b>`) : ''}
    <div style="white-space:pre-wrap;background:${C.soft};border:1px solid ${C.line};padding:16px 20px;font:400 14px/1.75 ${MONO};color:${C.ink}">${e(b.message)}</div>
    ${small('Reply to this e-mail to answer them.')}`), b.email);
}

// A request for a design of one's own ("Request a design"): to the owner, who answers by replying.
const WHAT = { painting: ['A painting', 'لوحة'], portrait: ['A portrait', 'بورتريه'], design: ['A design', 'تصميم'], other: ['Something else', 'شيء آخر'] };
const BUDGET = { 'under-50': 'Under €50', '50-150': '€50 to €150', '150-400': '€150 to €400', 'over-400': 'Over €400', unsure: 'Not sure yet' };
export async function commissionEmail(env, c) {
  const w = WHAT[c.what] || [c.what, c.what];
  return sendMail(env, env.ADMIN_EMAIL || 'info@massandgrass.com', `Request · ${w[0]} · ${c.name} · طلب تصميم`, layout(`
    ${p(`<b>${e(c.name)}</b> &lt;${e(c.email)}&gt; asks for ${e(w[0].toLowerCase())}.`)}
    ${pAr(`طلب جديد: ${e(w[1])} من ${e(c.name)}.`)}
    ${rows([['What · ماذا', e(w[0])], ['Size or use · المقاس', e(c.size || '—')], ['Budget · الميزانية', e(BUDGET[c.budget] || '—')], ['By · الموعد', e(c.deadline || '—')], ['Phone · الهاتف', e(c.phone || '—')], ['Picture · صورة', c.ref ? 'Yes, in the admin' : 'None']])}
    <div style="white-space:pre-wrap;background:${C.soft};border:1px solid ${C.line};padding:16px 20px;font:400 14px/1.75 ${MONO};color:${C.ink}" dir="auto">${e(c.body)}</div>
    <p style="margin:24px 0 0">${btn(env.SITE_ORIGIN + '/admin/#requests', 'Open requests')}</p>
    ${small('Reply to this e-mail to answer them.')}`), c.email);
}
