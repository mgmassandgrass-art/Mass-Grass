// A stand-in for PayPal's Orders v2 API, for local tests only (never deployed). node test/paypal-mock.mjs  → http://localhost:8899
// The Worker talks to it when run with PAYPAL_API=http://localhost:8899 (sh test/local.sh paypal).
// /approve?id=… plays the buyer approving on PayPal and sends them back to the shop with ?token=…; MOCK_HOLD=1 makes captures PENDING.
import http from 'node:http';
const orders = new Map();
const send = (res, code, body, headers = {}) => { res.writeHead(code, { 'content-type': 'application/json', ...headers }); res.end(JSON.stringify(body)); };
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://localhost:8899'); let body = '';
  for await (const c of req) body += c;
  const j = (() => { try { return JSON.parse(body || '{}'); } catch { return {}; } })();
  if (u.pathname === '/v1/oauth2/token') return /^Basic /.test(req.headers.authorization || '') ? send(res, 200, { access_token: 'mock-token' }) : send(res, 401, {});
  if (!/^Bearer mock-token$/.test(req.headers.authorization || '') && u.pathname.startsWith('/v2/')) return send(res, 401, {});
  if (u.pathname === '/v2/checkout/orders' && req.method === 'POST') {
    const id = 'PP' + Math.random().toString(36).slice(2, 12).toUpperCase(), pu = j.purchase_units[0], ctx = j.payment_source.paypal.experience_context;
    orders.set(id, { id, status: 'CREATED', amount: pu.amount, shipping: pu.shipping, ret: ctx.return_url });
    return send(res, 201, { id, status: 'PAYER_ACTION_REQUIRED', links: [{ rel: 'payer-action', href: `http://localhost:8899/approve?id=${id}` }] });
  }
  if (u.pathname === '/approve') { const o = orders.get(u.searchParams.get('id')); if (!o) return send(res, 404, {}); o.status = 'APPROVED';
    if (u.searchParams.get('stay')) return send(res, 200, { approved: o.id });
    res.writeHead(302, { location: `${o.ret}&token=${o.id}&PayerID=MOCKPAYER` }); return res.end(); }
  const m = u.pathname.match(/^\/v2\/checkout\/orders\/(\w+)(\/capture)?$/), o = m && orders.get(m[1]);
  if (!o) return send(res, 404, { name: 'RESOURCE_NOT_FOUND' });
  const view = () => ({ id: o.id, status: o.status, purchase_units: [{ amount: o.amount, shipping: o.shipping, payments: o.capture ? { captures: [o.capture] } : {} }] });
  if (m[2]) {
    if (o.capture) return send(res, 422, { name: 'UNPROCESSABLE_ENTITY', details: [{ issue: 'ORDER_ALREADY_CAPTURED' }] });
    if (o.status !== 'APPROVED') return send(res, 422, { name: 'UNPROCESSABLE_ENTITY', details: [{ issue: 'ORDER_NOT_APPROVED' }] });
    o.status = 'COMPLETED'; o.capture = { id: 'CAP' + o.id, status: process.env.MOCK_HOLD ? 'PENDING' : 'COMPLETED', amount: o.amount };
    return send(res, 201, view());
  }
  if (u.searchParams.get('release') !== null) { if (o.capture) o.capture.status = 'COMPLETED'; return send(res, 200, view()); }
  return send(res, 200, view());
}).listen(8899, () => console.log('paypal mock on :8899'));
