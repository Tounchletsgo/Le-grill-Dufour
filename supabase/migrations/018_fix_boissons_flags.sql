-- ============================================================
-- 018 — Fix boissons : s'assurer que tous les items de la
--       catégorie boissons-livraison sont bien visibles
--       en livraison ET en emporter.
--
--       Ne dépend pas des noms (match sur category_id).
-- ============================================================

-- S'assurer que la catégorie elle-même est active
UPDATE categories SET is_active = true
WHERE slug = 'boissons-livraison';

-- Mettre à jour TOUS les items de cette catégorie
UPDATE menu_items SET
  is_orderable     = true,
  is_deliverable   = true,
  is_delivery_only = false,
  price            = CASE WHEN price = 0 OR price IS NULL THEN 2.50 ELSE price END
WHERE category_id = (SELECT id FROM categories WHERE slug = 'boissons-livraison');

-- Renommer les items qui n'ont pas encore le préfixe "Bouteille"
UPDATE menu_items SET name = 'Bouteille de ' || name
WHERE category_id = (SELECT id FROM categories WHERE slug = 'boissons-livraison')
  AND name NOT LIKE 'Bouteille%';
