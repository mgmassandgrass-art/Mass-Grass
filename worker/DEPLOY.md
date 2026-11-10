# Deploying the rebuilt site (`web/`)

Nothing here runs by itself. Deploy only when the owner says so ("انشر").

## Before
1. Tests, all three must end with "all passed":
   ```
   sh test/local.sh            # terminal 1 (a fresh local database)
   npm test && node test/e2e.test.cjs
   sh test/local.sh paypal     # terminal 1 again: stand-in PayPal on :8899
   node test/pay.test.cjs      # bag → PayPal → back → files, token-only return, admin check, cron
   ```
2. `npm run check`: builds the pages and the manifest and does a dry-run deploy (uploads nothing).
3. Secrets on the production Worker (names only: `npx wrangler secret list`): `PAYPAL_CLIENT_ID`, `PAYPAL_SECRET`,
   `RESEND_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. All five were there on 10 Nov 2026.
   `PAYPAL_ENV = "live"` is in `wrangler.toml` (a deploy wipes variables set only on the dashboard).

## Order matters: the database first, then the code
The new Worker reads tables and columns that only migration `0008_security_catalog.sql` adds (`audit_log`, `messages`,
two-step sign-in, session devices). Deploying the code first would break sign-in.

1. Apply the migration to the production database:
   `CLOUDFLARE_API_TOKEN=placeholder npx wrangler d1 migrations apply mass-grass --remote`
   This needs the session's Cloudflare token to reach the D1 API (`/client/v4/accounts/<id>/d1/...`). On 10 Nov 2026 the
   proxy only covered `/workers/s...` and `/zones`, so this step was refused. Either widen that network secret to the D1
   path, or the owner runs it in the Cloudflare dashboard: D1 → mass-grass → Console, paste the whole of
   `migrations/0008_security_catalog.sql`, then (so wrangler does not run it again later)
   `INSERT INTO d1_migrations(name) VALUES ('0008_security_catalog.sql');`
2. `CLOUDFLARE_API_TOKEN=placeholder npm run deploy` (builds `web/`, the manifest, then deploys; a 400 on
   `/workers/workers/...` after "Deployed" is harmless).
3. `sh test/smoke.sh` (read-only checks of the live site).
4. In the admin (sign in at `/account.html`, then `/admin/`): turn on two-step sign-in (Security), cancel the setup test
   order `MG-94828A67` (Orders), upload the sale files (Products: the overview lists the pieces without a file).

## Launch (after the files are in)
1. `SOON = "0"` in `wrangler.toml`, then `npm run deploy` again.
2. A real purchase: a €1 sticker with a personal PayPal account. Check the page shows the file, the e-mail arrives, the
   order is paid in the admin; then refund it from PayPal and mark it refunded in the admin.

## Going back
`npx wrangler rollback` returns the Worker to the previous version (the database keeps the new tables; the old code ignores them).
