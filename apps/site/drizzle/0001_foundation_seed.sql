INSERT OR IGNORE INTO category_groups (id, slug, name, description, position, active) VALUES
  ('grp_comprar_negociar', 'comprar-negociar', 'Comprar e negociar', 'Preço, proposta, troca e leitura do mercado.', 1, 1),
  ('grp_escolher_carro', 'escolher-carro', 'Escolher o carro certo', 'Modelos, carrocerias e comparações sem enrolação.', 2, 1),
  ('grp_cuidar_prejuizo', 'cuidar-evitar-prejuizo', 'Cuidar e evitar prejuízo', 'Problemas conhecidos e decisões de manutenção.', 3, 1);

INSERT OR IGNORE INTO categories (id, group_id, slug, name, position, active) VALUES
  ('cat_compra_venda', 'grp_comprar_negociar', 'compra-e-venda', 'Compra e Venda', 1, 1),
  ('cat_negociacoes', 'grp_comprar_negociar', 'negociacoes', 'Negociações', 2, 1),
  ('cat_mercado', 'grp_comprar_negociar', 'mercado-automotivo', 'Mercado Automotivo', 3, 1),
  ('cat_suv', 'grp_escolher_carro', 'suv', 'SUV', 1, 1),
  ('cat_sedan', 'grp_escolher_carro', 'sedan', 'Sedan', 2, 1),
  ('cat_hatch', 'grp_escolher_carro', 'hatch', 'Hatch', 3, 1),
  ('cat_picapes', 'grp_escolher_carro', 'picapes', 'Picapes', 4, 1),
  ('cat_comparativos', 'grp_escolher_carro', 'comparativos', 'Comparativos', 5, 1),
  ('cat_problemas', 'grp_cuidar_prejuizo', 'problemas-cronicos', 'Problemas Crônicos', 1, 1),
  ('cat_dicas', 'grp_cuidar_prejuizo', 'dicas', 'Dicas', 2, 1);

INSERT OR IGNORE INTO youtube_videos (
  id, provider, external_id, channel_handle, source_title, source_published_at,
  poster_url, import_state, detected_at, last_synced_at
) VALUES
  ('vid_youtube_jT0j_rCgbbc', 'youtube', 'jT0j_rCgbbc', '@negociobaum', 'Esse senhor trocou sua moto numa Spin e financiou o restante', NULL, '/images/videos/spin-financiada-frame-source.png', 'imported', 0, NULL),
  ('vid_youtube_E1mywkvsMEk', 'youtube', 'E1mywkvsMEk', '@negociobaum', 'Esse foi um negócio de gente grande', NULL, '/images/videos/negocio-gente-grande-frame-source.png', 'imported', 0, NULL),
  ('vid_youtube_pBwSpjFqNYk', 'youtube', 'pBwSpjFqNYk', '@negociobaum', 'Tentaram trocar uma Spin de leilão em uma Saveiro e um Gol', NULL, '/images/videos/spin-leilao-frame-source.png', 'imported', 0, NULL),
  ('vid_youtube_6Ad2yXex_oc', 'youtube', '6Ad2yXex_oc', '@negociobaum', 'Ônix por um Nissan Versa com sinistro', NULL, '/images/videos/onix-versa-frame-source.png', 'imported', 0, NULL);

INSERT OR IGNORE INTO articles (
  id, slug, lifecycle_state, source_video_id, working_revision_id,
  published_revision_id, version, created_at, updated_at, archived_at
) VALUES (
  'art_moto_spin_financiada', 'moto-por-spin-financiada-bom-negocio', 'draft',
  'vid_youtube_jT0j_rCgbbc', NULL, NULL, 1, 0, 0, NULL
);

INSERT OR IGNORE INTO article_revisions (
  id, article_id, revision_number, workflow_state, author_id, title, subtitle,
  seo_description, body_json, opinion, image_url, image_alt, read_time_minutes,
  scheduled_at, published_at, created_by_principal_id, created_at
) VALUES (
  'rev_moto_spin_001', 'art_moto_spin_financiada', 1, 'draft', NULL,
  'Trocar uma moto por uma Spin financiada: foi bom negócio?',
  'O vídeo diverte, mas a conta pede atenção: entrada, prazo, juros e custo de uso mudam completamente o resultado da troca.',
  'Entenda como avaliar entrada, juros e custo total antes de trocar uma moto por uma Chevrolet Spin financiada.',
  '["Trocar uma moto por um carro familiar resolve uma necessidade real de espaço, conforto e proteção.","Para saber se a troca faz sentido, some o valor entregue na moto, o total financiado, juros, seguro, combustível e manutenção provável."]',
  'Se a Spin resolve a vida da família, a troca pode fazer sentido. Mas o bom negócio só aparece depois de olhar o valor total, não apenas a parcela.',
  '/images/videos/spin-financiada-frame-source.png',
  'Frame do vídeo sobre a troca de uma moto por uma Chevrolet Spin',
  6, NULL, NULL, NULL, 0
);

UPDATE articles
SET working_revision_id = 'rev_moto_spin_001'
WHERE id = 'art_moto_spin_financiada' AND working_revision_id IS NULL;

INSERT OR IGNORE INTO article_revision_categories (revision_id, category_id, is_primary) VALUES
  ('rev_moto_spin_001', 'cat_negociacoes', 1);

INSERT OR IGNORE INTO article_revision_faqs (id, revision_id, position, question, answer) VALUES
  ('faq_moto_spin_001', 'rev_moto_spin_001', 1, 'O que comparar antes de financiar a diferença?', 'Valor total financiado, CET, prazo, seguro, consumo e manutenção do carro que entra na troca.'),
  ('faq_moto_spin_002', 'rev_moto_spin_001', 2, 'Uma parcela menor significa melhor negócio?', 'Não necessariamente. Prazos longos reduzem a parcela e podem elevar bastante o total pago.');

INSERT OR IGNORE INTO products (
  id, slug, name, collection_code, collection_name, description,
  primary_image_url, primary_image_alt, status, version, created_at, updated_at
) VALUES (
  'prd_chaveiro_presente', 'chaveiro-presente', 'Chaveiro Presente',
  'presenca-ed01', 'Coleção Presença · Edição 01',
  'Para quem chega cedo, comenta “presente” e faz parte da nossa garagem.',
  '/images/products/chaveiro-presente.png',
  'Chaveiro Blog do Carro com personagem dizendo Presente',
  'preview', 1, 0, 0
);

INSERT OR IGNORE INTO product_variants (
  id, product_id, sku, status, currency, price_cents, price_kind,
  max_per_cart, inventory_mode, weight_grams, width_mm, height_mm,
  depth_mm, version, created_at, updated_at
) VALUES (
  'var_chp_demo_ed01', 'prd_chaveiro_presente', 'CHP-DEMO-01', 'preview',
  'BRL', 2990, 'illustrative', 5, 'untracked', NULL, NULL, NULL, NULL, 1, 0, 0
);

INSERT OR IGNORE INTO inventory_balances (
  variant_id, on_hand, reserved, state, version, updated_at
) VALUES ('var_chp_demo_ed01', 0, 0, 'untracked', 1, 0);

INSERT OR IGNORE INTO store_settings (
  id, store_name, mode, checkout_enabled, currency, version, updated_at
) VALUES (1, 'Loja da Comunidade', 'demo', 0, 'BRL', 1, 0);

INSERT OR IGNORE INTO menus (id, name, status, version, updated_at)
VALUES ('main', 'Menu principal', 'published', 1, 0);

INSERT OR IGNORE INTO menu_items (id, menu_id, label, href, position, active) VALUES
  ('menu_inicio', 'main', 'Início', '/', 0, 1),
  ('menu_artigos', 'main', 'Artigos', '/#ultimos', 1, 1),
  ('menu_categorias', 'main', 'Categorias', '/#categorias', 2, 1),
  ('menu_loja', 'main', 'Loja', '/loja', 3, 1),
  ('menu_sobre', 'main', 'Sobre', '/sobre', 4, 1),
  ('menu_contato', 'main', 'Contato', '/contato', 5, 1),
  ('menu_marketplace', 'main', 'Marketplace', '/marketplace', 6, 0);

INSERT OR IGNORE INTO home_sections (id, section_type, title, position, status, version, updated_at) VALUES
  ('home_hero', 'hero', 'Vídeo em destaque', 0, 'published', 1, 0),
  ('home_latest', 'latest', 'Agora no Blog', 1, 'published', 1, 0),
  ('home_categories', 'categories', 'Categorias', 2, 'published', 1, 0),
  ('home_store', 'store', 'Loja da comunidade', 3, 'published', 1, 0),
  ('home_popular', 'popular', 'Leituras em destaque', 4, 'published', 1, 0);

INSERT OR IGNORE INTO connector_configurations (
  id, mode, configuration_status, health_status, activation_status,
  configuration_revision, observed_at, last_health_checked_at, updated_at
) VALUES
  ('youtube', 'sandbox', 'missing', 'unknown', 'inactive', 1, NULL, NULL, 0),
  ('resend', 'disabled', 'missing', 'unknown', 'inactive', 1, NULL, NULL, 0),
  ('mercado-pago-pix', 'disabled', 'missing', 'unknown', 'inactive', 1, NULL, NULL, 0),
  ('meu-envio', 'disabled', 'missing', 'unknown', 'inactive', 1, NULL, NULL, 0),
  ('mercado-livre', 'disabled', 'missing', 'unknown', 'inactive', 1, NULL, NULL, 0);
