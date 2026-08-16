-- Table des rues pour l'autocomplétion d'adresse
-- À exécuter dans le SQL Editor de Supabase (supabase.com/dashboard)

-- Active l'extension trigramme pour la recherche par sous-chaîne
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

-- Colonne address_source sur orders (autocomplete / manual)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS address_source TEXT DEFAULT 'manual';

-- Colonnes séparées pour numéro et boîte
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS house_number TEXT,
  ADD COLUMN IF NOT EXISTS box TEXT;

-- RLS : lecture publique des rues actives, écriture admin seulement
ALTER TABLE streets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active streets"
  ON streets FOR SELECT
  USING (active = true);

CREATE POLICY "Service role full access"
  ON streets FOR ALL
  USING (true)
  WITH CHECK (true);
