// Run: npm run db:local && npm run dev (in another shell), then npm test
const B = process.env.API || 'http://localhost:8787', O = 'http://localhost:3000';
let jar = '';
async function call(method, path, body, extra = {}) {
  const r = await fetch(B + path, { method, redirect: 'manual',
    headers: { 'content-type': 'application/json', origin: O, cookie: jar, ...extra }, body: body ? JSON.stringify(body) : undefined });
  const sc = r.headers.get('set-cookie'); if (sc) jar = sc.split(';')[0].endsWith('=') ? '' : sc.split(';')[0];
  return { s: r.status, j: await r.json().catch(() => null) };
}
let bad = 0; const ok = (n, c) => { console.log(c ? 'ok  ' : 'FAIL', n); if (!c) bad++; };
const em = `t${Date.now()}@example.com`;
let r = await call('POST', '/api/signup', { name: 'Lina', email: em, password: 'short' }); ok('short pw rejected', r.s === 400 && r.j.error === 'password_short');
r = await call('POST', '/api/signup', { name: 'Lina', email: em, password: 'correct horse' }); ok('signup', r.s === 201 && r.j.user.email === em && !('pw_hash' in r.j.user));
r = await call('GET', '/api/me'); ok('me after signup', r.j.user?.name === 'Lina');
r = await call('POST', '/api/signup', { name: 'X', email: em, password: 'correct horse' }); ok('duplicate email', r.s === 409);
r = await call('PATCH', '/api/me', { name: 'Lina K' }); ok('rename', r.j.user.name === 'Lina K');
await call('POST', '/api/logout'); r = await call('GET', '/api/me'); ok('logged out', r.j.user === null);
r = await call('POST', '/api/login', { email: em, password: 'wrong password' }); ok('wrong pw 401', r.s === 401);
r = await call('POST', '/api/login', { email: em, password: 'correct horse' }); ok('login', r.s === 200);
r = await call('GET', '/api/me/export'); ok('export', r.j.user.email === em);
r = await call('POST', '/api/login', { email: em, password: 'x' }, { origin: 'https://evil.example' }); ok('bad origin blocked', r.s === 403);
r = await call('POST', '/api/forgot', { email: 'nobody@example.com' }); ok('forgot gives same answer for unknown email', r.j.ok === true);
r = await call('POST', '/api/reset', { token: 'nope', password: 'whatever123' }); ok('bad reset token', r.s === 400);
r = await call('DELETE', '/api/me'); ok('delete account', r.s === 200);
r = await call('POST', '/api/login', { email: em, password: 'correct horse' }); ok('deleted account cannot login', r.s === 401);
r = await call('GET', '/api/auth/google'); ok('google off until configured', r.s === 503 || r.s === 302);
console.log(bad ? `${bad} failed` : 'all passed'); process.exit(bad ? 1 : 0);
