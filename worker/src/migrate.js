// The production database is brought up to date by the Worker itself, once, on the first request after a deploy
// (this session's Cloudflare token cannot reach the D1 API). Each step runs as one transaction: all of it or none.
// A step is applied when its check finds nothing; wrangler's own d1_migrations table records it as applied too.
import M0008 from '../migrations/0008_security_catalog.sql';

const STEPS = [{ name: '0008_security_catalog.sql', sql: M0008, done: "SELECT 1 FROM sqlite_master WHERE type='table' AND name='audit_log'" }];
const statements = (sql) => sql.split('\n').filter((l) => !/^\s*--/.test(l)).join('\n').split(/;\s*\n/).map((x) => x.trim().replace(/;$/, '')).filter(Boolean);
let ready = null;
export function migrate(env) {
  if (!ready) ready = run(env).catch((e) => { ready = null; throw e; });
  return ready;
}
async function run(env) {
  for (const s of STEPS) {
    if (await env.DB.prepare(s.done).first()) continue;
    const log = await env.DB.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='d1_migrations'").first();
    const batch = statements(s.sql).map((q) => env.DB.prepare(q));
    if (log) batch.push(env.DB.prepare('INSERT INTO d1_migrations(name) SELECT ? WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE name=?)').bind(s.name, s.name));
    try { await env.DB.batch(batch); console.log('migrated', s.name, batch.length, 'statements'); }
    catch (e) { if (!(await env.DB.prepare(s.done).first())) throw e; } // another request applied it at the same moment
  }
}
