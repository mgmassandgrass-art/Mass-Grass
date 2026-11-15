// The profile's details and photo, two-step sign-in by e-mail and remembered devices, against the local Worker
// (sh test/local.sh; DEV_CODES in wrangler.local.toml hands the e-mailed code back on localhost only). Run: node test/profile.test.mjs
const B = 'http://localhost:8787';
let bad = 0; const ok = (n, c, x) => { console.log(c ? 'ok  ' : 'FAIL', n, c ? '' : x ?? ''); if (!c) bad++; };
const req = (m, p, body, jar = '', type = 'application/json') => fetch(B + p, { method: m, redirect: 'manual',
  headers: { 'content-type': type, origin: B, 'cf-connecting-ip': '10.9.9.9', // its own address, so the shared per-address sign-in limit stays for the other tests
   ...(jar ? { cookie: jar } : {}) }, body: body == null ? undefined : (body instanceof Uint8Array ? body : JSON.stringify(body)) });
const cookiesOf = (r) => (r.headers.getSetCookie ? r.headers.getSetCookie() : [r.headers.get('set-cookie') || '']);
const pick = (r, name) => (cookiesOf(r).find((c) => c.startsWith(name + '=')) || '');
const jarOf = (...cs) => cs.filter(Boolean).map((c) => c.split(';')[0]).join('; ');

const email = `p${Date.now()}@example.com`, password = 'a-long-password-1';
const s = await req('POST', '/api/signup', { name: 'Profile Test', email, password });
let jar = jarOf(pick(s, '__Host-mg'));
ok('sign up', s.status === 201, s.status);

// details
{ const r = await req('PATCH', '/api/me', { name: 'Profile Test', phone: '+971 50 123 4567', addr: { country: 'AE', city: 'Dubai', line1: 'Street 1', line2: '', postal: '<b>12</b>' } }, jar);
  const j = await r.json();
  ok('details saved', r.status === 200 && j.user.phone === '+971 50 123 4567' && j.user.addr.city === 'Dubai', JSON.stringify(j));
  ok('address text is cleaned', j.user.addr.postal === 'b12/b', j.user.addr.postal);
  ok('a bad phone is refused', (await req('PATCH', '/api/me', { phone: 'call me' }, jar)).status === 400);
  ok('a made-up country is dropped', (await (await req('PATCH', '/api/me', { addr: { country: 'XYZ' } }, jar)).json()).user.addr.country === ''); }

// photo
{ const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1]);
  const r = await req('POST', '/api/me/avatar', png, jar, 'image/png'); const j = await r.json();
  ok('photo saved', r.status === 200 && /^\/api\/me\/avatar\?v=\d+$/.test(j.user.photo || ''), JSON.stringify(j));
  const g = await req('GET', '/api/me/avatar', null, jar);
  ok('photo served to its owner, private', g.status === 200 && g.headers.get('content-type') === 'image/png' && /private/.test(g.headers.get('cache-control')));
  ok('photo comes back as the same bytes', (await g.arrayBuffer()).byteLength === png.length);
  ok('photo not served without the session', (await req('GET', '/api/me/avatar')).status === 401);
  ok('a fake picture is refused', (await req('POST', '/api/me/avatar', new TextEncoder().encode('<svg onload=alert(1)></svg>....'), jar, 'image/png')).status === 400);
  ok('photo removed', (await (await req('DELETE', '/api/me/avatar', null, jar)).json()).user.photo === null); }

// two-step by e-mail
let code;
{ const st = await req('POST', '/api/me/2fa/email/start', {}, jar); const j = await st.json(); code = j.dev_code;
  ok('setup code sent', st.status === 200 && /^\d{6}$/.test(code || ''), JSON.stringify(j));
  ok('a wrong setup code is refused', (await req('POST', '/api/me/2fa/email/enable', { code: code === '000000' ? '111111' : '000000' }, jar)).status === 400);
  const en = await req('POST', '/api/me/2fa/email/enable', { code }, jar);
  ok('e-mail two-step on', en.status === 200, en.status);
  const me = await (await req('GET', '/api/me', null, jar)).json();
  ok('the account says e-mail', me.user.twofa === true && me.user.twofa_method === 'email');
  ok('the app cannot be set up on top', (await req('POST', '/api/me/2fa/setup', {}, jar)).status === 409); }

await req('POST', '/api/logout', {}, jar);
let trust = '';
{ const a = await req('POST', '/api/login', { email, password }); const j = await a.json();
  ok('password alone asks for the e-mail code', a.status === 401 && j.error === 'email_code_sent' && /^\d{6}$/.test(j.dev_code || ''), JSON.stringify(j));
  ok('no session yet', !pick(a, '__Host-mg'));
  const w = await req('POST', '/api/login', { email, password, code: j.dev_code === '000000' ? '111111' : '000000' });
  ok('a wrong code is refused', w.status === 401 && (await w.json()).error === 'code_invalid');
  const g = await req('POST', '/api/login', { email, password, code: j.dev_code, remember: true });
  ok('the right code signs in', g.status === 200, g.status);
  trust = pick(g, '__Host-mgd'); jar = jarOf(pick(g, '__Host-mg'));
  ok('the device is remembered for 30 days', /Max-Age=2592000/.test(trust) && /HttpOnly/.test(trust) && /Secure/.test(trust), trust);
  ok('a code works once', (await req('POST', '/api/login', { email, password, code: j.dev_code })).status === 401); }

{ await req('POST', '/api/logout', {}, jar);
  const r = await req('POST', '/api/login', { email, password, remember: true }, jarOf(trust));
  ok('a remembered device skips the code', r.status === 200, r.status);
  jar = jarOf(pick(r, '__Host-mg'));
  const r2 = await req('POST', '/api/login', { email, password, remember: false });
  ok('another device still needs the code', r2.status === 401);
  const c2 = (await r2.json()).dev_code, r3 = await req('POST', '/api/login', { email, password, code: c2, remember: false });
  ok('not remembered: a session that ends with the browser, no device cookie', r3.status === 200 && !/Max-Age/.test(pick(r3, '__Host-mg')) && !pick(r3, '__Host-mgd'), cookiesOf(r3).join(' | ')); }

{ ok('turning it off needs the password', (await req('POST', '/api/me/2fa/email/disable', { password: 'wrong-password-x' }, jar)).status === 401);
  ok('turned off with the password', (await req('POST', '/api/me/2fa/email/disable', { password }, jar)).status === 200);
  await req('POST', '/api/logout', {}, jar);
  const r = await req('POST', '/api/login', { email, password });
  ok('then the password alone signs in', r.status === 200, r.status);
  const ex = await (await req('GET', '/api/me/export', null, jarOf(pick(r, '__Host-mg')))).json();
  ok('the data export carries the details', ex.user.phone === '+971 50 123 4567' && Array.isArray(ex.remembered_devices)); }

console.log(bad ? `${bad} failed` : 'all passed'); process.exit(bad ? 1 : 0);
