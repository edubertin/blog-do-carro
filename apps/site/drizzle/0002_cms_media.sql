PRAGMA foreign_keys = ON;

ALTER TABLE article_revisions ADD COLUMN version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0);
ALTER TABLE article_revisions ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0;

CREATE TABLE media_assets (
  id TEXT PRIMARY KEY,
  object_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
  byte_size INTEGER NOT NULL CHECK (byte_size BETWEEN 1 AND 5242880),
  alt_text TEXT NOT NULL,
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN ('staged', 'published', 'archived')),
  created_by_principal_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (created_by_principal_id) REFERENCES admin_principals(id) ON DELETE RESTRICT
);

CREATE INDEX idx_media_assets_lifecycle_created
ON media_assets (lifecycle_state, created_at DESC);

PRAGMA optimize;
