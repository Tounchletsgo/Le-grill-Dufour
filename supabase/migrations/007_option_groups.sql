-- ============================================================
-- 007 — Groupes d'options (accompagnement, sauces, etc.)
-- ============================================================
-- Ajoute une colonne option_groups à menu_items pour stocker
-- les clés des groupes d'options rattachés à chaque produit.
-- En attendant l'exécution de cette migration, le code dérive
-- les groupes d'options depuis la catégorie du produit.
-- ============================================================

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS option_groups text[] NOT NULL DEFAULT '{}';

-- Peupler les valeurs par défaut selon la catégorie
UPDATE menu_items SET option_groups = ARRAY['entree_en_plat','accompagnement_feculent','accompagnement_legumes','sauces']
  WHERE category_id IN (SELECT id FROM categories WHERE slug = 'entrees')
  AND option_groups = '{}';

UPDATE menu_items SET option_groups = ARRAY['accompagnement_feculent','accompagnement_legumes','sauces']
  WHERE category_id IN (SELECT id FROM categories WHERE slug = 'croquettes')
  AND option_groups = '{}';

UPDATE menu_items SET option_groups = ARRAY['accompagnement_feculent','accompagnement_legumes','sauces','supplement_legumes','flambadou']
  WHERE category_id IN (SELECT id FROM categories WHERE slug = 'viandes')
  AND option_groups = '{}'
  AND id NOT IN (SELECT item_id FROM item_supplements);

UPDATE menu_items SET option_groups = ARRAY['accompagnement_feculent','accompagnement_legumes','sauces','supplement_burger']
  WHERE category_id IN (SELECT id FROM categories WHERE slug = 'viandes')
  AND option_groups = '{}'
  AND id IN (SELECT item_id FROM item_supplements);

UPDATE menu_items SET option_groups = ARRAY['accompagnement_feculent','accompagnement_legumes','sauces','supplement_legumes','flambadou']
  WHERE category_id IN (SELECT id FROM categories WHERE slug = 'grillades')
  AND option_groups = '{}';

UPDATE menu_items SET option_groups = ARRAY['accompagnement_feculent','accompagnement_legumes','sauces','supplement_legumes']
  WHERE category_id IN (SELECT id FROM categories WHERE slug = 'poissons')
  AND option_groups = '{}';
