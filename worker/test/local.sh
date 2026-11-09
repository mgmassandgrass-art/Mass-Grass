#!/bin/sh
# A fresh local database with a local-only admin, then the Worker on :8787.  sh test/local.sh  (then: npm test)
cd "$(dirname "$0")/.." || exit 1
rm -rf .state
npx wrangler d1 migrations apply mass-grass --local --persist-to .state -c wrangler.local.toml >/dev/null 2>&1 || exit 1
node tools/make-admin.mjs "${LOCAL_ADMIN_PW:-local-admin-only-1}" 2>/dev/null > .state/admin.sql
npx wrangler d1 execute mass-grass --local --persist-to .state -c wrangler.local.toml --file .state/admin.sql >/dev/null 2>&1 || exit 1
exec npx wrangler dev --local --persist-to .state -c wrangler.local.toml --port 8787
