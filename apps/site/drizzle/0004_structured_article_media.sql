PRAGMA foreign_keys = ON;

ALTER TABLE media_assets ADD COLUMN width INTEGER NOT NULL DEFAULT 1 CHECK (width BETWEEN 1 AND 12000);
ALTER TABLE media_assets ADD COLUMN height INTEGER NOT NULL DEFAULT 1 CHECK (height BETWEEN 1 AND 12000);
ALTER TABLE media_assets ADD COLUMN sha256 TEXT NOT NULL DEFAULT '';

CREATE TABLE article_revision_media (
  revision_id TEXT NOT NULL,
  media_asset_id TEXT NOT NULL,
  usage TEXT NOT NULL CHECK (usage IN ('cover', 'inline')),
  block_id TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 0),
  alt_text TEXT NOT NULL CHECK (length(alt_text) BETWEEN 5 AND 240),
  caption TEXT CHECK (caption IS NULL OR length(caption) <= 300),
  PRIMARY KEY (revision_id, block_id),
  FOREIGN KEY (revision_id) REFERENCES article_revisions(id) ON DELETE CASCADE,
  FOREIGN KEY (media_asset_id) REFERENCES media_assets(id) ON DELETE RESTRICT
);

CREATE INDEX idx_article_revision_media_asset ON article_revision_media (media_asset_id);
CREATE INDEX idx_article_revision_media_revision_position ON article_revision_media (revision_id, position);

PRAGMA optimize;
