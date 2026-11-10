// Browser test of the whole site against the local Worker (sh test/local.sh). Run: node test/e2e.test.cjs
// Every page in English and Arabic, desktop and phone: no script errors (the strict CSP would show here), no missing files,
// no sideways scroll. Then the shop's flows: bag, sticker pack, checkout, account, language, phone menu.
const { chromium } = require('playwright');
const B = process.env.SITE || 'http://localhost:8787';
const PAGES = ['', 'shop', 'paintings', 'postcards', 'stickers', 'calendar', 'story', 'account', 'checkout', 'help', 'terms', 'nothing-here'];
let bad = 0; const ok = (n, c, extra) => { if (!c) { bad++; console.log('FAIL', n, extra || ''); } else if (process.env.VERBOSE) console.log('ok  ', n); };
(async () => {
  const b = await chromium.launch();
  async function ctx(w, h, ar) {
    const c = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    await c.addInitScript((a) => { try { if (!sessionStorage.mgT) { localStorage.mgLang = a ? 'ar' : 'en'; sessionStorage.mgT = 1; } } catch (e) {} }, ar);
    const p = await c.newPage(), errs = [];
    p.on('pageerror', (x) => errs.push(x.message)); p.on('console', (m) => { if (m.type() === 'error' && !/status of 40[14]/.test(m.text())) errs.push(m.text()); });
    p.on('response', (r) => { if (r.status() >= 400 && !/\/api\/|nothing-here/.test(r.url())) errs.push(r.status() + ' ' + r.url()); });
    return { c, p, errs };
  }
  // 1 · every page
  for (const [w, h, ar] of [[1440, 900, false], [1440, 900, true], [390, 844, true], [390, 844, false]]) {
    const { c, p, errs } = await ctx(w, h, ar);
    for (const pg of PAGES) {
      errs.length = 0; await p.goto(`${B}/${pg}`, { waitUntil: 'load' }); await p.waitForTimeout(350);
      await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 900) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } });
      await p.waitForTimeout(250);
      const tag = `${pg || 'home'} ${w} ${ar ? 'ar' : 'en'}`;
      ok('no errors: ' + tag, !errs.length, errs.slice(0, 3).join(' | '));
      ok('no sideways scroll: ' + tag, (await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0);
      ok('language applied: ' + tag, (await p.evaluate(() => document.documentElement.lang)) === (ar ? 'ar' : 'en'));
      ok('one h1: ' + tag, (await p.locator('h1').count()) === 1);
      const broken = await p.evaluate(() => [...document.images].filter((i) => i.complete && !i.naturalWidth && i.getAttribute('src')).map((i) => i.getAttribute('src')));
      ok('no broken images: ' + tag, !broken.length, broken.slice(0, 3).join(', '));
    }
    await c.close();
  }
  // 2 · the bag, a sticker pack and checkout
  { const { c, p, errs } = await ctx(1440, 900, false);
    await p.goto(B + '/shop', { waitUntil: 'load' }); await p.click('#shgrid .add >> nth=0'); await p.waitForTimeout(200);
    ok('bag counts one', (await p.textContent('[data-bagn]')) === '1');
    ok('button says in your bag', /In your bag/.test(await p.textContent('#shgrid .add >> nth=0')));
    await p.goto(B + '/paintings#dovegirl', { waitUntil: 'load' }); await p.waitForSelector('dialog#view[open]'); await p.click('#vadd'); await p.waitForTimeout(200);
    ok('painting added from its sheet', (await p.textContent('[data-bagn]')) === '2');
    await p.goto(B + '/stickers', { waitUntil: 'load' }); for (let i = 0; i < 6; i++) await p.click(`#grid .sc >> nth=${i}`);
    await p.click('#pbAdd'); await p.waitForTimeout(300);
    ok('six stickers go in as one pack', (await p.textContent('[data-bagn]')) === '3');
    await p.goto(B + '/calendar', { waitUntil: 'load' }); await p.click('.card-h [data-add=calendar]'); await p.waitForTimeout(200);
    await p.click('#bagb'); await p.waitForSelector('dialog.bagd[open]');
    ok('bag sheet totals 12+12+3+8', /€35/.test(await p.textContent('.bagd .tt')));
    await p.click('.bagd a.ink'); await p.waitForURL('**/checkout**'); await p.waitForSelector('#f');
    await p.fill('#em', 'buyer@example.com'); if (await p.locator('#nm').count()) await p.fill('#nm', 'Test Buyer');
    await p.click('#f [type=submit]'); await p.waitForTimeout(1200);
    ok('checkout says payments open soon (no keys here)', /Payments open/.test(await p.textContent('#co')));
    ok('flow had no errors', !errs.length, errs.join(' | '));
    await c.close(); }
  // 3 · account: sign up, profile, sign out; language stays; phone menu fills the screen
  { const { c, p, errs } = await ctx(390, 844, false);
    await p.goto(B + '/account?mode=up', { waitUntil: 'load' }); await p.waitForSelector('#f');
    const em = `e2e${Date.now()}@example.com`; await p.fill('#nm', 'Lina'); await p.fill('#em', em); await p.fill('#pw', 'correct horse battery'); await p.click('#f [type=submit]');
    await p.waitForURL('**/profile**'); await p.waitForSelector('#nm'); ok('profile shows the name', (await p.inputValue('#nm')) === 'Lina');
    await p.click('#lang'); await p.waitForTimeout(200); ok('language toggles to Arabic', (await p.evaluate(() => document.documentElement.dir)) === 'rtl');
    await p.goto(B + '/', { waitUntil: 'load' }); ok('language is remembered', (await p.evaluate(() => document.documentElement.lang)) === 'ar');
    await p.click('#menub'); await p.waitForTimeout(200); const r = await p.evaluate(() => document.getElementById('mmenu').getBoundingClientRect().width);
    ok('phone menu fills the screen', r >= 389); ok('account link in the menu is the profile', /profile/.test(await p.getAttribute('#mmenu .acct', 'href')));
    ok('account flow had no errors', !errs.length, errs.join(' | '));
    await c.close(); }
  // 4 · the admin page is closed to a visitor's browser too
  { const { c, p } = await ctx(1440, 900, false); await p.goto(B + '/admin/', { waitUntil: 'load' }); ok('admin redirects to sign-in', /account/.test(p.url())); await c.close(); }
  await b.close(); console.log(bad ? `${bad} failed` : 'all passed'); process.exit(bad ? 1 : 0);
})();
