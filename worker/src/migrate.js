// The production database is brought up to date by the Worker itself, once, on the first request after a deploy
// (this session's Cloudflare token cannot reach the D1 API). Each step runs as one transaction: all of it or none.
// A step is applied when its check finds nothing; wrangler's own d1_migrations table records it as applied too.
import M0008 from '../migrations/0008_security_catalog.sql';
import M0009 from '../migrations/0009_shipping.sql';
import M0010 from '../migrations/0010_profile.sql';
import M0011 from '../migrations/0011_designs.sql';
import M0012 from '../migrations/0012_calendar_launch.sql';
import M0013 from '../migrations/0013_gcc_shipping.sql';
import M0014 from '../migrations/0014_emirates_post_zones.sql';
import M0015 from '../migrations/0015_orders_control.sql';
import M0016 from '../migrations/0016_visits.sql';

const STEPS = [
  { name: '0008_security_catalog.sql', sql: M0008, done: "SELECT 1 FROM sqlite_master WHERE type='table' AND name='audit_log'" },
  { name: '0009_shipping.sql', sql: M0009, done: "SELECT 1 FROM pragma_table_info('orders') WHERE name='ship'" },
  { name: '0010_profile.sql', sql: M0010, done: "SELECT 1 FROM sqlite_master WHERE type='table' AND name='trusted_devices'" },
  { name: '0011_designs.sql', sql: M0011, done: "SELECT 1 FROM sqlite_master WHERE type='table' AND name='commissions'" },
  { name: '0012_calendar_launch.sql', sql: M0012, done: "SELECT 1 FROM settings WHERE k='launch_0012'" },
  { name: '0013_gcc_shipping.sql', sql: M0013, done: "SELECT 1 FROM settings WHERE k='launch_0013'" },
  { name: '0014_emirates_post_zones.sql', sql: M0014, done: "SELECT 1 FROM settings WHERE k='launch_0014'" },
  { name: '0015_orders_control.sql', sql: M0015, done: "SELECT 1 FROM pragma_table_info('orders') WHERE name='note'" },
  { name: '0016_visits.sql', sql: M0016, done: "SELECT 1 FROM sqlite_master WHERE type='table' AND name='visit_stats'" },
];
const statements = (sql) => sql.split('\n').filter((l) => !/^\s*--/.test(l)).join('\n').split(/;\s*\n/).map((x) => x.trim().replace(/;$/, '')).filter(Boolean);
let ready = null;
export function migrate(env) {
  if (!ready) ready = run(env).catch((e) => { ready = null; throw e; });
  return ready;
}
// one query tells whether every step is already in (the usual case); a passing hiccup in D1 is retried once
const ALL = 'SELECT ' + STEPS.map((s) => `EXISTS(${s.done})`).join('+') + ' AS n';
async function count(env) {
  try { return (await env.DB.prepare(ALL).first()).n; }
  catch (e) { await new Promise((r) => setTimeout(r, 300)); return (await env.DB.prepare(ALL).first()).n; }
}
async function run(env) {
  if ((await count(env)) === STEPS.length) return;
  for (const s of STEPS) {
    if (await env.DB.prepare(s.done).first()) continue;
    const log = await env.DB.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='d1_migrations'").first();
    const batch = statements(s.sql).map((q) => env.DB.prepare(q));
    if (log) batch.push(env.DB.prepare('INSERT INTO d1_migrations(name) SELECT ? WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE name=?)').bind(s.name, s.name));
    try { await env.DB.batch(batch); console.log('migrated', s.name, batch.length, 'statements'); }
    catch (e) { if (!(await env.DB.prepare(s.done).first())) { e.pending = s.name; throw e; } } // another request applied it at the same moment
  }
}
