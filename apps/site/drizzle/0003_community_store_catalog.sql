UPDATE products
SET
  slug = 'chaveiro-blog-do-carro',
  name = 'Chaveiro Blog do Carro',
  collection_code = 'loja-comunidade',
  collection_name = 'Loja da comunidade',
  description = 'O símbolo do Blog do Carro em uma peça rígida criada para impressão 3D.',
  primary_image_url = '/images/products/chaveiro-blog-do-carro-3d.png',
  primary_image_alt = 'Chaveiro rígido preto e amarelo do Blog do Carro com textura de impressão 3D',
  version = version + 1,
  updated_at = 1786192800001
WHERE id = 'prd_chaveiro_presente';

UPDATE product_variants
SET
  sku = 'BDC-CHV-DEMO',
  version = version + 1,
  updated_at = 1786192800001
WHERE product_id = 'prd_chaveiro_presente';

INSERT OR IGNORE INTO products (
  id, slug, name, collection_code, collection_name, description,
  primary_image_url, primary_image_alt, status, version, created_at, updated_at
) VALUES (
  'miniatura-blog-do-carro', 'miniatura-blog-do-carro', 'Miniatura Blog do Carro',
  'loja-comunidade', 'Loja da comunidade',
  'O personagem da comunidade transformado em uma miniatura conceitual para impressão 3D.',
  '/images/products/miniatura-blog-do-carro-3d.png',
  'Miniatura de menino acenando em base preta e amarela com textura de impressão 3D',
  'preview', 1, 1786192800000, 1786192800000
);

INSERT OR IGNORE INTO product_variants (
  id, product_id, sku, status, currency, price_cents, price_kind,
  max_per_cart, inventory_mode, weight_grams, width_mm, height_mm,
  depth_mm, version, created_at, updated_at
) VALUES (
  'var_miniatura_bdc_demo', 'miniatura-blog-do-carro', 'BDC-MIN-DEMO', 'preview',
  'BRL', 4990, 'illustrative', 5, 'untracked', NULL, NULL, NULL, NULL,
  1, 1786192800000, 1786192800000
);

INSERT OR IGNORE INTO inventory_balances (
  variant_id, on_hand, reserved, state, version, updated_at
) VALUES ('var_miniatura_bdc_demo', 0, 0, 'untracked', 1, 1786192800000);
