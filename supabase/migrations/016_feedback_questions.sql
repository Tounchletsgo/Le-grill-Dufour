-- ============================================================
-- 016 — Questions rapides retour client + marquage traité
-- ============================================================

-- 1. Trois questions rapides sur order_feedback
ALTER TABLE order_feedback
  ADD COLUMN IF NOT EXISTS is_complete boolean,
  ADD COLUMN IF NOT EXISTS is_hot boolean,
  ADD COLUMN IF NOT EXISTS is_on_time boolean;

-- 2. Marquage "traité" par le restaurant
ALTER TABLE order_feedback
  ADD COLUMN IF NOT EXISTS is_handled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS handled_note text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS handled_at timestamptz;

-- 3. Enregistrer aussi les confirmations dans email_queue
-- (déjà supporté par le CHECK constraint 'confirmation' | 'feedback_request')

-- 4. Variables e-mail configurables
-- (gérées via .env, pas de colonne supplémentaire)
