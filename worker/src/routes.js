// Public addresses of the site's pages. The one list is web/routes.json (page file → path); the build writes the same list into the
// pages (canonical, sitemap, links) and this file serves it: every public path answers with its file, and every older address
// (/calendar, /calendar.html, /story, /designs ...) is sent to the new one with a 301.
import ROUTES from '../../web/routes.json';

export const FILE_PATH = ROUTES;                                                   // 'calendar.html' → '/calendars/things-kept-in-bottles-2027'
export const PATH_FILE = Object.fromEntries(Object.entries(ROUTES).map(([f, p]) => [p, f]));
export const pathOf = (file) => ROUTES[file] || '/' + file.replace(/\.html$/, ''); // pages with no public path keep their file name (admin-only views)

// pages with no public path of their own (the admin can still open them): served only to the signed-in admin
export const INTERNAL = new Set(['later.html', 'soon.html', '404.html', 'story-month.html']);

// old address → new address
export const LEGACY = (() => {
  const m = { '/index': '/', '/index.html': '/', '/calendars': ROUTES['calendar.html'] };
  for (const [file, path] of Object.entries(ROUTES)) {
    const base = '/' + file.replace(/\.html$/, '');
    if (base === '/index') continue;
    m[base + '.html'] = path;
    if (base !== path) m[base] = path;
  }
  return m;
})();

// href="calendar.html#x" → href="/calendars/things-kept-in-bottles-2027#x" (keeps the query and the hash)
export const cleanHref = (h) => h.replace(/^\/?([\w-]+\.html)(?=$|[?#])/, (m, f) => pathOf(f));
