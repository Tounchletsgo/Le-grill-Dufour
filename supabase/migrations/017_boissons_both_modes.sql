-- ============================================================
-- 017 — Boissons disponibles en livraison ET retrait
--
-- Corrige la migration 011 :
--   - noms « Bouteille de … »
--   - prix 2,50 €
--   - is_delivery_only = false (visible en retrait aussi)
--
-- Ajoute category_slug sur order_items (ticket cuisine).
-- Ajoute discount_excluded_slugs sur delivery_config (exclusion
-- configurable de la remise).
-- ============================================================

-- 1. Mettre à jour les boissons existantes
UPDATE menu_items SET
  name = 'Bouteille de Coca-Cola',
  description = NULL,
  price = 2.50,
  is_delivery_only = false
WHERE category_id = (SELECT id FROM categories WHERE slug = 'boissons-livraison')
  AND name = 'Coca-Cola';

UPDATE menu_items SET
  name = 'Bouteille de Coca-Cola Zero',
  description = NULL,
  price = 2.50,
  is_delivery_only = false
WHERE category_id = (SELECT id FROM categories WHERE slug = 'boissons-livraison')
  AND name = 'Coca-Cola Zero';

UPDATE menu_items SET
  name = 'Bouteille de Fanta',
  description = NULL,
  price = 2.50,
  is_delivery_only = false
WHERE category_id = (SELECT id FROM categories WHERE slug = 'boissons-livraison')
  AND name = 'Fanta';

UPDATE menu_items SET
  name = 'Bouteille de Sprite',
  description = NULL,
  price = 2.50,
  is_delivery_only = false
WHERE category_id = (SELECT id FROM categories WHERE slug = 'boissons-livraison')
  AND name = 'Sprite';

UPDATE menu_items SET
  name = 'Bouteille d''Ice Tea',
  description = NULL,
  price = 2.50,
  is_delivery_only = false
WHERE category_id = (SELECT id FROM categories WHERE slug = 'boissons-livraison')
  AND name = 'Ice Tea';

UPDATE menu_items SET
  name = 'Bouteille d''eau plate',
  description = NULL,
  price = 2.50,
  is_delivery_only = false
WHERE category_id = (SELECT id FROM categories WHERE slug = 'boissons-livraison')
  AND name = 'Eau plate';

UPDATE menu_items SET
  name = 'Bouteille d''eau pétillante',
  description = NULL,
  price = 2.50,
  is_delivery_only = false
WHERE category_id = (SELECT id FROM categories WHERE slug = 'boissons-livraison')
  AND name = 'Eau pétillante';

-- 2. Ajouter category_slug aux order_items (pour regrouper sur le ticket)
ALTER TABLE order_items
  ADD COLUMN category_slug TEXT;

-- 3. Exclusion remise configurable
ALTER TABLE delivery_config
  ADD COLUMN discount_excluded_slugs TEXT[]
    NOT NULL DEFAULT ARRAY['boissons','boissons-livraison','desserts'];
