-- =========================================================
-- Auth Boilerplate — PostgreSQL Schema
-- Run: npm run db:migrate
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            TEXT UNIQUE NOT NULL,
  password_hash    TEXT,                    -- NULL for pure OAuth users
  name             TEXT,
  avatar_url       TEXT,

  -- Verification
  is_email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  email_verify_token TEXT,
  email_verify_expires TIMESTAMPTZ,

  -- Password reset
  password_reset_token   TEXT,
  password_reset_expires TIMESTAMPTZ,

  -- Timestamps
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── OAuth Accounts ───────────────────────────────────────
-- One user can have multiple OAuth providers linked
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider     TEXT NOT NULL,        -- 'google' | 'github'
  provider_id  TEXT NOT NULL,        -- Provider's user ID
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (provider, provider_id)
);

-- ─── Refresh Tokens ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT UNIQUE NOT NULL,  -- Store hashed, never raw
  expires_at  TIMESTAMPTZ NOT NULL,
  user_agent  TEXT,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email                ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_email_verify_token   ON users(email_verify_token) WHERE email_verify_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id     ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id     ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash  ON refresh_tokens(token_hash);

-- ─── Auto-update updated_at ───────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();