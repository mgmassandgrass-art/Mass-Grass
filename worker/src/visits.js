// Visits for the dashboard (owner, 25 Nov 2026): counts only, per day, country and page. A visit is the first page a browser
// opens in a session (a session cookie with no value worth anything marks the rest). Bots, link previews, prefetches and the
// signed-in admin are not counted. Nothing here names a person: no address, no id, no user agent is stored.
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|headless|lighthouse|pingdom|uptime|curl|wget|python|node-fetch|axios|go-http/i;
const SRC = [[/(^|\.)google\./, 'Google'], [/(^|\.)(instagram\.com)$/, 'Instagram'], [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, 'Facebook'],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, 'X'], [/(^|\.)tiktok\.com$/, 'TikTok'], [/(^|\.)(whatsapp\.com|wa\.me)$/, 'WhatsApp'],
  [/(^|\.)bing\.com$/, 'Bing'], [/(^|\.)duckduckgo\.com$/, 'DuckDuckGo'], [/(^|\.)pinterest\./, 'Pinterest'], [/(^|\.)linkedin\.com$/, 'LinkedIn'],
  [/(^|\.)youtube\.com$/, 'YouTube'], [/(^|\.)(mail\.google\.com|outlook\.|mail\.yahoo\.)/, 'E-mail']];
function source(req, url) {
  const utm = (url.searchParams.get('utm_source') || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 30);
  if (utm) { for (const [re, n] of SRC) if (re.test(utm + '.com')) return n; return utm; }
  let h = '';
  try { h = new URL(req.headers.get('referer') || '').hostname.toLowerCase().replace(/^www\./, ''); } catch { return 'direct'; }
  if (!h || h === url.hostname.replace(/^www\./, '')) return 'direct';
  for (const [re, n] of SRC) if (re.test(h)) return n;
  return h.slice(0, 60);
}
const device = (ua) => /iPad|Tablet/i.test(ua) ? 'tablet' : /Mobi|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop';

// Called with the finished page response; returns it (with the session marker when a visit begins) and writes the counts
// after the answer has gone (ctx.waitUntil), so a page never waits on them.
export function track(env, req, url, fp, res, admin) {
  try {
    if (req.method !== 'GET' || res.status !== 200 || !(res.headers.get('content-type') || '').includes('text/html')) return res;
    const ua = req.headers.get('user-agent') || '';
    if (!ua || BOT.test(ua) || /prefetch|prerender/i.test(req.headers.get('sec-purpose') || req.headers.get('purpose') || '') || admin) return res;
    const first = !/(?:^|;\s*)__Host-mgv=1/.test(req.headers.get('cookie') || '');
    const day = new Date().toISOString().slice(0, 10), c = env.VISITOR || '', path = fp.replace(/\.html$/, '').slice(0, 40);
    const q = [env.DB.prepare('INSERT INTO visits(day,country,path,views,visits) VALUES(?,?,?,1,?) ON CONFLICT(day,country,path) DO UPDATE SET views=views+1, visits=visits+excluded.visits').bind(day, c, path, first ? 1 : 0)];
    if (first) for (const [k, v] of [['src', source(req, url)], ['dev', device(ua)]])
      q.push(env.DB.prepare('INSERT INTO visit_stats(day,k,v,n) VALUES(?,?,?,1) ON CONFLICT(day,k,v) DO UPDATE SET n=n+1').bind(day, k, v));
    const w = env.DB.batch(q).catch((e) => console.error('visits', e));
    if (env.CTX && env.CTX.waitUntil) env.CTX.waitUntil(w);
    if (!first) return res;
    const h = new Headers(res.headers); h.append('set-cookie', '__Host-mgv=1; Path=/; HttpOnly; Secure; SameSite=Lax');
    return new Response(res.body, { status: res.status, headers: h });
  } catch (e) { console.error('visits', e); return res; }
}
