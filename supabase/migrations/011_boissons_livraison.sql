-- ============================================================
-- 011 — Catégorie « Boissons » livraison uniquement
-- 7 bouteilles plastique, prix à 0 (à compléter dans le back-office)
-- is_delivery_only = true, is_deliverable = true
-- ============================================================

INSERT INTO categories (slug, label, intro, note, sort_order)
VALUES ('boissons-livraison', 'Boissons', NULL, NULL, 50);

INSERT INTO menu_items (category_id, name, description, price, is_orderable, is_deliverable, is_delivery_only, sort_order)
VALUES
  ((SELECT id FROM categories WHERE slug = 'boissons-livraison'), 'Coca-Cola',          'Bouteille plastique', 0, true, true, true, 1),
  ((SELECT id FROM categories WHERE slug = 'boissons-livraison'), 'Coca-Cola Zero',     'Bouteille plastique', 0, true, true, true, 2),
  ((SELECT id FROM categories WHERE slug = 'boissons-livraison'), 'Fanta',              'Bouteille plastique', 0, true, true, true, 3),
  ((SELECT id FROM categories WHERE slug = 'boissons-livraison'), 'Sprite',             'Bouteille plastique', 0, true, true, true, 4),
  ((SELECT id FROM categories WHERE slug = 'boissons-livraison'), 'Ice Tea',            'Bouteille plastique', 0, true, true, true, 5),
  ((SELECT id FROM categories WHERE slug = 'boissons-livraison'), 'Eau plate',          'Bouteille plastique', 0, true, true, true, 6),
  ((SELECT id FROM categories WHERE slug = 'boissons-livraison'), 'Eau pétillante',     'Bouteille plastique', 0, true, true, true, 7);
