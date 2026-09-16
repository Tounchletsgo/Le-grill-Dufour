-- Add auto_reset_stock to delivery_config (reuses existing single-row config pattern)
ALTER TABLE delivery_config
  ADD COLUMN IF NOT EXISTS auto_reset_stock boolean NOT NULL DEFAULT true;
