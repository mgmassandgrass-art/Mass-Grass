// E-mails through Resend: order confirmation with download links, gifts, the owner's notice, contact messages.
import { orderFiles } from './files.js';

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
const btn = (href, label) => `<a href="${e(href)}" style="display:inline-block;background:#2E241B;color:#FAF5E9;text-decoration:none;padding:9px 14px;margin:4px 6px 4px 0;font:600 13px monospace;border:2px solid #2E241B">${e(label)}</a>`;
export const layout = (body) => `<!doctype html><html><body style="margin:0;background:#E9DCC2;padding:24px 12px;font-family:Arial,Helvetica,sans-serif;color:#2E241B">
<div style="max-width:560px;margin:auto;background:#FAF5E9;border:2px solid #2E241B;box-shadow:6px 6px 0 rgba(46,36,27,.85)">
<div style="background:#2E241B;color:#FAF5E9;padding:14px 20px;font:700 18px/1 Arial;letter-spacing:.12em">MASS &amp; GRASS</div>
<div style="padding:22px 20px;font-size:15px;line-height:1.6">${body}</div>
<div style="border-top:1.5px dashed #2E241B;padding:12px 20px;font:12px monospace;color:#6f604d">Painted by hand in Gaza · info@massandgrass.com</div></div></body></html>`;

const KIND = { painting: 'Painting', postcard: 'Postcard', sticker: 'Sticker', pack: 'Sticker pack', calendar: 'Calendar' };
const filesOf = (it, files) => it.kind === 'pack' ? files.filter((f) => f.kind === 'sticker' && (it.pack || []).includes(f.product_id))
  : it.kind === 'calendar' ? files.filter((f) => f.kind === 'calendar') : files.filter((f) => f.kind === it.kind && f.product_id === it.k);
const links = (env, fs) => fs.length ? fs.map((f) => btn(env.SITE_ORIGIN + f.url, `${f.name} ↓`)).join('')
  : '<span style="color:#6f604d;font-size:13px">Your file is being prepared; it will appear in your profile and we will email you. · ملفك عم يتجهّز.</span>';

// Sent once, when an order becomes paid.
export async function orderPaidEmails(env, o) {
  const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
  const files = await orderFiles(env, { ...o, status: 'paid' });
  const rows = items.filter((it) => !it.gift).map((it) => `<div style="padding:10px 0;border-bottom:1px solid #e3d6bd"><b>${e(it.t || it.k)}</b>${it.ta ? ` · <span dir="rtl">${e(it.ta)}</span>` : ''}<br><small style="color:#6f604d">${KIND[it.kind] || ''}</small><br>${links(env, filesOf(it, files))}</div>`).join('');
  const gifts = items.filter((it) => it.gift);
  await sendMail(env, o.email, `Your files from Gaza · ${o.id} · ملفاتك من غزة`, layout(`
    <h2 style="margin:0 0 6px;font:700 24px Arial">Sealed in Gaza ✉</h2>
    <p>Thank you${o.name ? ', ' + e(o.name) : ''}. Your order <b>${e(o.id)}</b> (€${(o.total_cents / 100).toFixed(2)}) is paid. Your files:</p>
    <p dir="rtl" style="text-align:right">شكرًا إلك. طلبك مدفوع، وهاي ملفاتك:</p>
    ${rows}${gifts.length ? `<p>Gifts on their way to: ${gifts.map((g) => e(g.gift.to)).join(', ')}.</p>` : ''}
    <p style="font-size:13px;color:#6f604d">Keep this email: the links are yours. Signed-in buyers also find them in their profile.</p>`));
  for (const g of gifts) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(g.gift.em || '')) continue;
    await sendMail(env, g.gift.em, `A gift from Gaza for you · هدية من غزة إلك`, layout(`
      <h2 style="margin:0 0 6px;font:700 24px Arial">A gift for you, ${e(g.gift.to)} ✉</h2>
      <p>Someone sent you a watercolour from Gaza, painted by Farah Al-Helou: <b>${e(g.t || g.k)}</b>.</p>
      ${g.gift.m ? `<blockquote style="margin:12px 0;padding:10px 14px;border-inline-start:4px solid #C4593F;background:#fff">${e(g.gift.m)}</blockquote>` : ''}
      <p>${links(env, filesOf(g, files))}</p><p dir="rtl" style="text-align:right">حدا بعتلك هدية من غزة. حمّلها من الأزرار فوق.</p>`), o.email);
  }
  if (env.ADMIN_EMAIL) await sendMail(env, env.ADMIN_EMAIL, `New order ${o.id} · €${(o.total_cents / 100).toFixed(2)} · طلب جديد`, layout(`
    <p><b>${e(o.name || '')}</b> &lt;${e(o.email)}&gt; paid <b>€${(o.total_cents / 100).toFixed(2)}</b>.</p>
    <ul>${items.map((it) => `<li>${e(it.t || it.k)} (${KIND[it.kind] || it.kind})${it.gift ? ` → gift for ${e(it.gift.to)}` : ''}</li>`).join('')}</ul>
    <p>${btn(env.SITE_ORIGIN + '/admin/#orders', 'Open orders')}</p>`), o.email);
}

export async function contactEmail(env, b) {
  return sendMail(env, env.ADMIN_EMAIL || 'info@massandgrass.com', `Contact · ${b.topic || 'Message'} · ${b.name || b.email}`, layout(`
    <p><b>${e(b.name || '')}</b> &lt;${e(b.email)}&gt;</p><p><b>${e(b.topic || '')}</b></p>
    <div style="white-space:pre-wrap;background:#fff;border:1.5px solid #2E241B;padding:12px">${e(b.message)}</div>
    <p style="font-size:13px;color:#6f604d">Reply to this email to answer them.</p>`), b.email);
}
