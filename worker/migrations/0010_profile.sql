-- The customer's own details (kept for checkout), a photo, two-step sign-in by e-mail and devices that are remembered.
ALTER TABLE users ADD COLUMN phone TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN addr TEXT;                           -- JSON {country, city, line1, line2, postal}
ALTER TABLE users ADD COLUMN avatar_at INTEGER;                   -- when the photo was last changed (NULL = none)
ALTER TABLE users ADD COLUMN email2fa INTEGER NOT NULL DEFAULT 0; -- 1: each sign-in asks for a code sent by e-mail
CREATE TABLE avatars (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  data BLOB NOT NULL
);
-- One live code per account and purpose ('login' or 'setup'): stored hashed, 10 minutes, 5 tries.
CREATE TABLE email_codes (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  tries INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, purpose)
);
-- "Remember this device": a second cookie that lets this browser skip the second step for 30 days.
CREATE TABLE trusted_devices (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  ua TEXT NOT NULL DEFAULT ''
);
CREATE INDEX trusted_user ON trusted_devices(user_id);
