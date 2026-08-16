-- ============================================================
-- 006 — Choix de cuisson des viandes
-- ============================================================
-- Adds cooking doneness support:
--   - cooking_levels: 7 universal doneness levels
--   - cooking_groups: 7 meat groups with delivery offset
--   - cooking_group_levels: junction (which levels per group)
--   - menu_items gains cooking_group_id + cooking_required
--   - order_items gains doneness_key + doneness_label (snapshot)
-- ============================================================

-- ── cooking_levels ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cooking_levels (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text UNIQUE NOT NULL,
  label      text NOT NULL,
  description text,
  temperature text,
  color      text NOT NULL DEFAULT '#888888',
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE cooking_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cooking_levels_public_read" ON cooking_levels
  FOR SELECT USING (true);

-- ── cooking_groups ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cooking_groups (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key             text UNIQUE NOT NULL,
  label           text NOT NULL,
  delivery_offset integer NOT NULL DEFAULT 1,
  sort_order      integer NOT NULL DEFAULT 0
);

ALTER TABLE cooking_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cooking_groups_public_read" ON cooking_groups
  FOR SELECT USING (true);

-- ── cooking_group_levels (junction) ─────────────────────────
CREATE TABLE IF NOT EXISTS cooking_group_levels (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id           uuid NOT NULL REFERENCES cooking_groups(id) ON DELETE CASCADE,
  level_id           uuid NOT NULL REFERENCES cooking_levels(id) ON DELETE CASCADE,
  is_default         boolean NOT NULL DEFAULT false,
  is_recommended     boolean NOT NULL DEFAULT false,
  available_delivery boolean NOT NULL DEFAULT true,
  UNIQUE (group_id, level_id)
);

ALTER TABLE cooking_group_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cooking_group_levels_public_read" ON cooking_group_levels
  FOR SELECT USING (true);

-- ── menu_items: add cooking columns ─────────────────────────
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS cooking_group_id uuid REFERENCES cooking_groups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cooking_required boolean NOT NULL DEFAULT false;

-- ── order_items: snapshot doneness ──────────────────────────
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS doneness_key   text,
  ADD COLUMN IF NOT EXISTS doneness_label text;

-- ============================================================
-- SEED: cooking_levels (7 levels)
-- ============================================================
INSERT INTO cooking_levels (key, label, description, temperature, color, sort_order) VALUES
  ('bleu',         'Bleu',         'Saisi à l''extérieur, rouge et froid à cœur',   '45-50°C', '#4A90D9', 1),
  ('saignant',     'Saignant',     'Croûte dorée, cœur rouge et chaud',            '50-55°C', '#DC2626', 2),
  ('mi_saignant',  'Mi-saignant',  'Rosé soutenu au centre, juteux',               '55-60°C', '#E85D75', 3),
  ('a_point',      'À point',      'Rosé léger au centre, tendre',                 '60-65°C', '#F59E0B', 4),
  ('mi_cuit',      'Mi-cuit',      'Légèrement rosé, cuisson homogène',            '65-70°C', '#D97706', 5),
  ('bien_cuit',    'Bien cuit',    'Uniformément cuit, pas de rosé',               '70-75°C', '#92400E', 6),
  ('cuit_a_coeur', 'Cuit à cœur',  'Cuisson complète obligatoire (viande hachée, volaille, porc)', '75°C+', '#6B7280', 7)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- SEED: cooking_groups (7 groups)
-- ============================================================
INSERT INTO cooking_groups (key, label, delivery_offset, sort_order) VALUES
  ('boeuf',           'Bœuf',            1, 1),
  ('magret',          'Magret',           1, 2),
  ('agneau',          'Agneau',           1, 3),
  ('veau',            'Veau',             1, 4),
  ('gibier',          'Gibier',           1, 5),
  ('abats_rouges',    'Abats rouges',     1, 6),
  ('cuisson_imposee', 'Cuisson imposée',  0, 7)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- SEED: cooking_group_levels
-- ============================================================
-- Bœuf: bleu → bien_cuit, default à_point
INSERT INTO cooking_group_levels (group_id, level_id, is_default, is_recommended) VALUES
  ((SELECT id FROM cooking_groups WHERE key='boeuf'), (SELECT id FROM cooking_levels WHERE key='bleu'),        false, false),
  ((SELECT id FROM cooking_groups WHERE key='boeuf'), (SELECT id FROM cooking_levels WHERE key='saignant'),    false, true),
  ((SELECT id FROM cooking_groups WHERE key='boeuf'), (SELECT id FROM cooking_levels WHERE key='mi_saignant'), false, true),
  ((SELECT id FROM cooking_groups WHERE key='boeuf'), (SELECT id FROM cooking_levels WHERE key='a_point'),     true,  true),
  ((SELECT id FROM cooking_groups WHERE key='boeuf'), (SELECT id FROM cooking_levels WHERE key='mi_cuit'),     false, false),
  ((SELECT id FROM cooking_groups WHERE key='boeuf'), (SELECT id FROM cooking_levels WHERE key='bien_cuit'),   false, false);

-- Magret: saignant → à_point, default saignant
INSERT INTO cooking_group_levels (group_id, level_id, is_default, is_recommended) VALUES
  ((SELECT id FROM cooking_groups WHERE key='magret'), (SELECT id FROM cooking_levels WHERE key='saignant'),    true,  true),
  ((SELECT id FROM cooking_groups WHERE key='magret'), (SELECT id FROM cooking_levels WHERE key='mi_saignant'), false, true),
  ((SELECT id FROM cooking_groups WHERE key='magret'), (SELECT id FROM cooking_levels WHERE key='a_point'),     false, false);

-- Agneau: saignant → bien_cuit, default mi_saignant
INSERT INTO cooking_group_levels (group_id, level_id, is_default, is_recommended) VALUES
  ((SELECT id FROM cooking_groups WHERE key='agneau'), (SELECT id FROM cooking_levels WHERE key='saignant'),    false, true),
  ((SELECT id FROM cooking_groups WHERE key='agneau'), (SELECT id FROM cooking_levels WHERE key='mi_saignant'), true,  true),
  ((SELECT id FROM cooking_groups WHERE key='agneau'), (SELECT id FROM cooking_levels WHERE key='a_point'),     false, true),
  ((SELECT id FROM cooking_groups WHERE key='agneau'), (SELECT id FROM cooking_levels WHERE key='mi_cuit'),     false, false),
  ((SELECT id FROM cooking_groups WHERE key='agneau'), (SELECT id FROM cooking_levels WHERE key='bien_cuit'),   false, false);

-- Veau: à_point → bien_cuit, default à_point
INSERT INTO cooking_group_levels (group_id, level_id, is_default, is_recommended) VALUES
  ((SELECT id FROM cooking_groups WHERE key='veau'), (SELECT id FROM cooking_levels WHERE key='a_point'),   true,  true),
  ((SELECT id FROM cooking_groups WHERE key='veau'), (SELECT id FROM cooking_levels WHERE key='mi_cuit'),   false, true),
  ((SELECT id FROM cooking_groups WHERE key='veau'), (SELECT id FROM cooking_levels WHERE key='bien_cuit'), false, false);

-- Gibier: saignant → à_point, default mi_saignant
INSERT INTO cooking_group_levels (group_id, level_id, is_default, is_recommended) VALUES
  ((SELECT id FROM cooking_groups WHERE key='gibier'), (SELECT id FROM cooking_levels WHERE key='saignant'),    false, true),
  ((SELECT id FROM cooking_groups WHERE key='gibier'), (SELECT id FROM cooking_levels WHERE key='mi_saignant'), true,  true),
  ((SELECT id FROM cooking_groups WHERE key='gibier'), (SELECT id FROM cooking_levels WHERE key='a_point'),     false, false);

-- Abats rouges: saignant → à_point, default saignant
INSERT INTO cooking_group_levels (group_id, level_id, is_default, is_recommended) VALUES
  ((SELECT id FROM cooking_groups WHERE key='abats_rouges'), (SELECT id FROM cooking_levels WHERE key='saignant'),    true,  true),
  ((SELECT id FROM cooking_groups WHERE key='abats_rouges'), (SELECT id FROM cooking_levels WHERE key='mi_saignant'), false, true),
  ((SELECT id FROM cooking_groups WHERE key='abats_rouges'), (SELECT id FROM cooking_levels WHERE key='a_point'),     false, false);

-- Cuisson imposée: cuit_a_coeur ONLY, locked
INSERT INTO cooking_group_levels (group_id, level_id, is_default, is_recommended) VALUES
  ((SELECT id FROM cooking_groups WHERE key='cuisson_imposee'), (SELECT id FROM cooking_levels WHERE key='cuit_a_coeur'), true, false);
