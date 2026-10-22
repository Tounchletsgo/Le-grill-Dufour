-- Add orders_paused flag to delivery_config (default: true = orders are paused)
ALTER TABLE delivery_config ADD COLUMN IF NOT EXISTS orders_paused BOOLEAN NOT NULL DEFAULT true;

-- Audit log for orders_paused toggle changes
CREATE TABLE IF NOT EXISTS orders_paused_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  changed_by TEXT NOT NULL,
  old_value BOOLEAN NOT NULL,
  new_value BOOLEAN NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
