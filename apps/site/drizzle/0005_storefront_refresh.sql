UPDATE products
SET status = 'active', version = version + 1, updated_at = 1786192800002
WHERE id = 'prd_chaveiro_presente';

UPDATE product_variants
SET status = 'active', price_cents = 990, version = version + 1, updated_at = 1786192800002
WHERE product_id = 'prd_chaveiro_presente';

UPDATE products
SET status = 'preview', version = version + 1, updated_at = 1786192800002
WHERE slug = 'miniatura-blog-do-carro';

UPDATE product_variants
SET status = 'preview', version = version + 1, updated_at = 1786192800002
WHERE product_id = 'miniatura-blog-do-carro';

UPDATE menu_items
SET active = 0
WHERE href = '/#categorias';
