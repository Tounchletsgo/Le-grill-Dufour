-- ============================================================
-- 015 — Système de retour client après livraison
-- Table order_feedback, file d'attente e-mail, désinscription,
-- token de feedback sur orders, délai configurable.
-- ============================================================

-- 1. Token de feedback sur la table orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS feedback_token uuid DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_feedback_token ON orders (feedback_token) WHERE feedback_token IS NOT NULL;

-- 2. Désinscription e-mail (par téléphone, puisque c'est l'identifiant stable)
CREATE TABLE IF NOT EXISTS email_unsubscribes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;

-- 3. Retours clients
CREATE TABLE IF NOT EXISTS order_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_feedback_order ON order_feedback (order_id);
ALTER TABLE order_feedback ENABLE ROW LEVEL SECURITY;

-- 4. File d'attente d'envoi d'e-mails
CREATE TABLE IF NOT EXISTS email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  email_type text NOT NULL CHECK (email_type IN ('confirmation', 'feedback_request')),
  recipient text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_queue_pending ON email_queue (status, scheduled_at) WHERE status = 'pending';
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- 5. Délai configurable pour l'e-mail de feedback (en heures)
ALTER TABLE delivery_config ADD COLUMN IF NOT EXISTS feedback_delay_hours integer NOT NULL DEFAULT 2;
