# Mass & Grass API (Cloudflare Worker + D1)

Step 1: accounts and sign-in. Next: PayPal orders/subscriptions, R2 file delivery, admin.

Routes: `POST /api/signup|login|logout|forgot|reset`, `GET /api/me`, `PATCH|DELETE /api/me`,
`GET /api/me/export`, `GET /api/auth/google` (+ `/callback`).

Security: PBKDF2-SHA256 (100k iterations, the Workers maximum) with a salt per user; random session tokens
stored only as SHA-256 hashes; `__Host-` cookie (`HttpOnly; Secure; SameSite=Lax`); Origin check on every non-GET;
rate limits on signup/login/forgot/reset; same answer for unknown e-mails; a password reset signs out all sessions.

## Local test
    npm i && npm run db:local && npm run dev     # then, in another shell:
    npm test

## Deploy (needs the owner's Cloudflare login)
1. `npx wrangler d1 create mass-grass`, then paste the `database_id` into `wrangler.toml`.
2. `npx wrangler d1 migrations apply mass-grass --remote`
3. Google Cloud Console: OAuth client (Web), redirect URI `https://www.massandgrass.com/api/auth/google/callback`;
   `npx wrangler secret put GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
4. Reset e-mails: a Resend key with massandgrass.com verified, `npx wrangler secret put RESEND_API_KEY`.
5. `npx wrangler deploy` (route `www.massandgrass.com/api/*` sits in front of Pages).
6. Make `prototype/` the Pages root when publishing.
