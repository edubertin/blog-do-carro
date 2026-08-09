ALTER TABLE store_settings
ADD COLUMN storefront_mode TEXT NOT NULL DEFAULT 'waitlist'
CHECK (storefront_mode IN ('waitlist', 'demo', 'live'));

UPDATE store_settings
SET storefront_mode = 'waitlist', checkout_enabled = 0, version = version + 1;

CREATE TABLE audience_contacts (
  id TEXT PRIMARY KEY,
  email_lookup_hmac TEXT NOT NULL UNIQUE,
  email_ciphertext TEXT NOT NULL,
  email_iv TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE audience_subscriptions (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES audience_contacts(id) ON DELETE RESTRICT,
  purpose TEXT NOT NULL CHECK (purpose IN ('store_launch', 'editorial_newsletter')),
  product_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'revoked', 'suppressed')),
  source_path TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  consent_text_hash TEXT NOT NULL,
  requested_at INTEGER NOT NULL,
  confirmed_at INTEGER,
  revoked_at INTEGER,
  updated_at INTEGER NOT NULL,
  UNIQUE(contact_id, purpose, product_id)
);

CREATE TABLE audience_tokens (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL REFERENCES audience_subscriptions(id) ON DELETE CASCADE,
  token_kind TEXT NOT NULL CHECK (token_kind IN ('confirmation', 'unsubscribe')),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE audience_consent_events (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL REFERENCES audience_subscriptions(id) ON DELETE RESTRICT,
  event_type TEXT NOT NULL CHECK (event_type IN ('requested', 'confirmed', 'revoked', 'suppressed')),
  consent_version TEXT NOT NULL,
  source_path TEXT NOT NULL,
  occurred_at INTEGER NOT NULL
);

CREATE TABLE audience_request_limits (
  key_hash TEXT NOT NULL,
  limit_kind TEXT NOT NULL CHECK (limit_kind IN ('email', 'network')),
  window_started_at INTEGER NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count > 0),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (key_hash, limit_kind)
);

CREATE INDEX idx_audience_subscriptions_purpose_status
ON audience_subscriptions(purpose, status, requested_at DESC);

CREATE INDEX idx_audience_tokens_expiry
ON audience_tokens(expires_at, consumed_at);

CREATE INDEX idx_audience_consent_events_subscription
ON audience_consent_events(subscription_id, occurred_at DESC);

CREATE INDEX idx_audience_request_limits_updated
ON audience_request_limits(updated_at);

PRAGMA optimize;
