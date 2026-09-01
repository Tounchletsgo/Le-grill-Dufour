-- ============================================================
-- 012 — Fourchette de délai livraison (min / max en minutes)
-- Remplace le champ texte estimated_time par deux bornes numériques
-- ============================================================

ALTER TABLE delivery_config
  ADD COLUMN IF NOT EXISTS delivery_min_time integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS delivery_max_time integer NOT NULL DEFAULT 60;
