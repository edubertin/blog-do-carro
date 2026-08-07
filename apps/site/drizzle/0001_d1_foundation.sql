PRAGMA foreign_keys = ON;

CREATE TABLE admin_principals (
  id TEXT PRIMARY KEY,
  subject_hmac TEXT NOT NULL UNIQUE,
  display_label TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'revoked')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  revoked_at INTEGER
);

CREATE TABLE admin_role_assignments (
  id TEXT PRIMARY KEY,
  principal_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'publisher', 'commerce_operator', 'support', 'analyst', 'integrations_admin')),
  assigned_by_principal_id TEXT,
  assigned_at INTEGER NOT NULL,
  revoked_at INTEGER,
  FOREIGN KEY (principal_id) REFERENCES admin_principals(id) ON DELETE RESTRICT,
  FOREIGN KEY (assigned_by_principal_id) REFERENCES admin_principals(id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX idx_admin_role_assignments_active
ON admin_role_assignments (principal_id, role)
WHERE revoked_at IS NULL;

CREATE TABLE connector_configurations (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL CHECK (mode IN ('disabled', 'sandbox', 'live')),
  configuration_status TEXT NOT NULL CHECK (configuration_status IN ('missing', 'configured', 'invalid')),
  health_status TEXT NOT NULL CHECK (health_status IN ('unknown', 'healthy', 'degraded', 'failing')),
  activation_status TEXT NOT NULL CHECK (activation_status IN ('inactive', 'pending_approval', 'active', 'suspended')),
  configuration_revision INTEGER NOT NULL DEFAULT 1 CHECK (configuration_revision > 0),
  observed_at INTEGER,
  last_health_checked_at INTEGER,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_connector_configurations_activation
ON connector_configurations (activation_status, updated_at DESC);

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  occurred_at INTEGER NOT NULL,
  request_id TEXT NOT NULL,
  actor_kind TEXT NOT NULL CHECK (actor_kind IN ('admin', 'system')),
  actor_principal_id TEXT,
  permission TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  environment TEXT NOT NULL CHECK (environment IN ('local', 'preview', 'production')),
  result TEXT NOT NULL CHECK (result IN ('allowed', 'denied', 'failed')),
  reason_code TEXT,
  before_patch_json TEXT CHECK (before_patch_json IS NULL OR json_valid(before_patch_json)),
  after_patch_json TEXT CHECK (after_patch_json IS NULL OR json_valid(after_patch_json)),
  FOREIGN KEY (actor_principal_id) REFERENCES admin_principals(id) ON DELETE RESTRICT
);

CREATE INDEX idx_audit_events_occurred_at
ON audit_events (occurred_at DESC);

CREATE INDEX idx_audit_events_actor
ON audit_events (actor_principal_id, occurred_at DESC);

CREATE INDEX idx_audit_events_resource
ON audit_events (resource_type, resource_id, occurred_at DESC);

CREATE INDEX idx_audit_events_failures
ON audit_events (occurred_at DESC)
WHERE result IN ('denied', 'failed');

CREATE TRIGGER prevent_audit_events_update
BEFORE UPDATE ON audit_events
BEGIN
  SELECT RAISE(ABORT, 'audit_events are append-only');
END;

CREATE TRIGGER prevent_audit_events_delete
BEFORE DELETE ON audit_events
BEGIN
  SELECT RAISE(ABORT, 'audit_events are append-only');
END;

CREATE TABLE idempotency_records (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('started', 'completed', 'failed')),
  resource_type TEXT,
  resource_id TEXT,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  UNIQUE (scope, idempotency_key)
);

CREATE INDEX idx_idempotency_records_expires_at
ON idempotency_records (expires_at);

CREATE TABLE category_groups (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 0),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  position INTEGER NOT NULL CHECK (position >= 0),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  FOREIGN KEY (group_id) REFERENCES category_groups(id) ON DELETE RESTRICT
);

CREATE INDEX idx_categories_group_position
ON categories (group_id, position);

CREATE TABLE authors (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE youtube_videos (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'youtube' CHECK (provider = 'youtube'),
  external_id TEXT NOT NULL,
  channel_handle TEXT NOT NULL,
  source_title TEXT NOT NULL,
  source_published_at INTEGER,
  poster_url TEXT NOT NULL,
  import_state TEXT NOT NULL CHECK (import_state IN ('detected', 'imported', 'ignored')),
  detected_at INTEGER NOT NULL,
  last_synced_at INTEGER,
  UNIQUE (provider, external_id)
);

CREATE TABLE articles (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN ('draft', 'active', 'archived')),
  source_video_id TEXT UNIQUE,
  working_revision_id TEXT,
  published_revision_id TEXT,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  archived_at INTEGER,
  FOREIGN KEY (source_video_id) REFERENCES youtube_videos(id) ON DELETE RESTRICT,
  FOREIGN KEY (working_revision_id) REFERENCES article_revisions(id) ON DELETE RESTRICT,
  FOREIGN KEY (published_revision_id) REFERENCES article_revisions(id) ON DELETE RESTRICT
);

CREATE INDEX idx_articles_lifecycle_updated
ON articles (lifecycle_state, updated_at DESC);

CREATE TABLE article_revisions (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  revision_number INTEGER NOT NULL CHECK (revision_number > 0),
  workflow_state TEXT NOT NULL CHECK (workflow_state IN ('draft', 'review', 'scheduled', 'published')),
  author_id TEXT,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  seo_description TEXT NOT NULL,
  body_json TEXT NOT NULL CHECK (json_valid(body_json)),
  opinion TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_alt TEXT NOT NULL,
  read_time_minutes INTEGER NOT NULL CHECK (read_time_minutes > 0),
  scheduled_at INTEGER,
  published_at INTEGER,
  created_by_principal_id TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE RESTRICT,
  FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by_principal_id) REFERENCES admin_principals(id) ON DELETE RESTRICT,
  UNIQUE (article_id, revision_number)
);

CREATE INDEX idx_article_revisions_workflow_created
ON article_revisions (workflow_state, created_at DESC);

CREATE INDEX idx_article_revisions_scheduled
ON article_revisions (scheduled_at)
WHERE workflow_state = 'scheduled';

CREATE TABLE article_revision_categories (
  revision_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
  PRIMARY KEY (revision_id, category_id),
  FOREIGN KEY (revision_id) REFERENCES article_revisions(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX idx_article_revision_primary_category
ON article_revision_categories (revision_id)
WHERE is_primary = 1;

CREATE TABLE article_revision_faqs (
  id TEXT PRIMARY KEY,
  revision_id TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 0),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  FOREIGN KEY (revision_id) REFERENCES article_revisions(id) ON DELETE CASCADE,
  UNIQUE (revision_id, position)
);

CREATE TABLE article_relations (
  article_id TEXT NOT NULL,
  related_article_id TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 0),
  PRIMARY KEY (article_id, related_article_id),
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (related_article_id) REFERENCES articles(id) ON DELETE RESTRICT,
  CHECK (article_id <> related_article_id),
  UNIQUE (article_id, position)
);

CREATE TABLE published_article_projections (
  article_id TEXT PRIMARY KEY,
  revision_id TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  category_name TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  seo_description TEXT NOT NULL,
  search_text TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_alt TEXT NOT NULL,
  youtube_video_external_id TEXT,
  date_label TEXT NOT NULL,
  body_json TEXT NOT NULL CHECK (json_valid(body_json)),
  opinion TEXT NOT NULL,
  faq_json TEXT NOT NULL CHECK (json_valid(faq_json)),
  read_time_minutes INTEGER NOT NULL CHECK (read_time_minutes > 0),
  published_at INTEGER,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE RESTRICT,
  FOREIGN KEY (revision_id) REFERENCES article_revisions(id) ON DELETE RESTRICT
);

CREATE INDEX idx_published_article_projections_published
ON published_article_projections (published_at DESC);

CREATE INDEX idx_published_article_projections_category
ON published_article_projections (category_slug, published_at DESC);

CREATE TABLE published_article_categories (
  article_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  published_at INTEGER NOT NULL,
  PRIMARY KEY (article_id, category_id),
  FOREIGN KEY (article_id) REFERENCES published_article_projections(article_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

CREATE INDEX idx_published_article_categories_listing
ON published_article_categories (category_id, published_at DESC);

CREATE TABLE menus (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at INTEGER NOT NULL
);

CREATE TABLE menu_items (
  id TEXT PRIMARY KEY,
  menu_id TEXT NOT NULL,
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 0),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
  UNIQUE (menu_id, position)
);

CREATE TABLE home_sections (
  id TEXT PRIMARY KEY,
  section_type TEXT NOT NULL CHECK (section_type IN ('hero', 'latest', 'categories', 'popular', 'recent', 'store')),
  title TEXT NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 0),
  status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at INTEGER NOT NULL,
  UNIQUE (position, status)
);

CREATE TABLE home_items (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('article', 'video', 'category', 'product')),
  article_id TEXT,
  video_id TEXT,
  category_id TEXT,
  product_id TEXT,
  question TEXT,
  kicker TEXT,
  support_text TEXT,
  meta_label TEXT,
  position INTEGER NOT NULL CHECK (position >= 0),
  FOREIGN KEY (section_id) REFERENCES home_sections(id) ON DELETE CASCADE,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE RESTRICT,
  FOREIGN KEY (video_id) REFERENCES youtube_videos(id) ON DELETE RESTRICT,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  UNIQUE (section_id, position)
);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  collection_code TEXT NOT NULL,
  collection_name TEXT NOT NULL,
  description TEXT NOT NULL,
  primary_image_url TEXT NOT NULL,
  primary_image_alt TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'preview', 'active', 'archived')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_products_status_updated
ON products (status, updated_at DESC);

CREATE TABLE product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'preview', 'active', 'archived')),
  currency TEXT NOT NULL DEFAULT 'BRL' CHECK (currency = 'BRL'),
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  price_kind TEXT NOT NULL CHECK (price_kind IN ('illustrative', 'sale')),
  max_per_cart INTEGER NOT NULL DEFAULT 5 CHECK (max_per_cart BETWEEN 1 AND 20),
  inventory_mode TEXT NOT NULL CHECK (inventory_mode IN ('untracked', 'tracked')),
  weight_grams INTEGER CHECK (weight_grams IS NULL OR weight_grams > 0),
  width_mm INTEGER CHECK (width_mm IS NULL OR width_mm > 0),
  height_mm INTEGER CHECK (height_mm IS NULL OR height_mm > 0),
  depth_mm INTEGER CHECK (depth_mm IS NULL OR depth_mm > 0),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

CREATE TABLE inventory_balances (
  variant_id TEXT PRIMARY KEY,
  on_hand INTEGER NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
  reserved INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0 AND reserved <= on_hand),
  state TEXT NOT NULL CHECK (state IN ('untracked', 'available', 'reserved', 'unavailable')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT
);

CREATE TABLE inventory_movements (
  id TEXT PRIMARY KEY,
  variant_id TEXT NOT NULL,
  quantity_delta INTEGER NOT NULL CHECK (quantity_delta <> 0),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('receive', 'reserve', 'release', 'ship', 'adjust')),
  reason_code TEXT NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  idempotency_key TEXT NOT NULL,
  actor_principal_id TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT,
  FOREIGN KEY (actor_principal_id) REFERENCES admin_principals(id) ON DELETE RESTRICT,
  UNIQUE (variant_id, idempotency_key)
);

CREATE INDEX idx_inventory_movements_variant_created
ON inventory_movements (variant_id, created_at DESC);

CREATE TRIGGER prevent_inventory_movements_update
BEFORE UPDATE ON inventory_movements
BEGIN
  SELECT RAISE(ABORT, 'inventory_movements are append-only');
END;

CREATE TRIGGER prevent_inventory_movements_delete
BEFORE DELETE ON inventory_movements
BEGIN
  SELECT RAISE(ABORT, 'inventory_movements are append-only');
END;

CREATE TABLE store_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  store_name TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('demo', 'live')),
  checkout_enabled INTEGER NOT NULL DEFAULT 0 CHECK (checkout_enabled IN (0, 1)),
  currency TEXT NOT NULL DEFAULT 'BRL' CHECK (currency = 'BRL'),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at INTEGER NOT NULL,
  CHECK (mode = 'live' OR checkout_enabled = 0)
);

PRAGMA optimize;
