-- Migration: Add test order support
-- Adds is_test flag to orders table for marking test orders
-- Adds test_mode_config table for managing test mode sessions

ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_orders_is_test ON orders (is_test) WHERE is_test = true;
