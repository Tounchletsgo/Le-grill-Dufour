-- 026: Delivery drivers system
-- Tables for driver accounts, messaging, and order assignment

-- ── Drivers table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drivers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  pin TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Driver messages (staff ↔ driver real-time messaging) ───
CREATE TABLE IF NOT EXISTS driver_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('driver', 'staff')),
  message TEXT NOT NULL,
  is_quick BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_messages_driver
  ON driver_messages(driver_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_driver_messages_unread
  ON driver_messages(driver_id, read_at) WHERE read_at IS NULL;

-- ── Add driver columns to orders ───────────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS assigned_driver_id UUID REFERENCES drivers(id),
  ADD COLUMN IF NOT EXISTS driver_picked_up_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS driver_issue TEXT,
  ADD COLUMN IF NOT EXISTS driver_issue_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_driver
  ON orders(assigned_driver_id) WHERE assigned_driver_id IS NOT NULL;

-- ── RLS ────────────────────────────────────────────────────
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on drivers"
  ON drivers FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on driver_messages"
  ON driver_messages FOR ALL
  USING (auth.role() = 'service_role');

-- ── Realtime ───────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE driver_messages;
