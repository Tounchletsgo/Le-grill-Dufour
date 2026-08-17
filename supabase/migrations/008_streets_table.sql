-- ============================================================
-- 008 — Table des rues pour l'autocomplétion d'adresse
-- ============================================================
-- Crée la table streets + colonnes manquantes dans orders.
-- Reprend le contenu de scripts/create-streets-table.sql
-- sous forme de migration numérotée.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS streets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_normalized TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  municipality TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  active BOOLEAN DEFAULT true NOT NULL,
  source TEXT DEFAULT 'manual' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS streets_unique
  ON streets (name_normalized, postal_code);

CREATE INDEX IF NOT EXISTS streets_name_trgm
  ON streets USING gin (name_normalized gin_trgm_ops);

CREATE INDEX IF NOT EXISTS streets_postal
  ON streets (postal_code);

-- Colonnes supplémentaires sur orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS address_source TEXT DEFAULT 'manual';

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS house_number TEXT;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS box TEXT;

-- RLS
ALTER TABLE streets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'streets' AND policyname = 'Public read active streets'
  ) THEN
    CREATE POLICY "Public read active streets"
      ON streets FOR SELECT
      USING (active = true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'streets' AND policyname = 'Service role full access'
  ) THEN
    CREATE POLICY "Service role full access"
      ON streets FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;
