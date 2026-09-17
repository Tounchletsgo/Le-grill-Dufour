-- Migration: Add Stripe online payment support
-- Run this in the Supabase SQL Editor.

-- 1. Add Stripe columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- 2. Update payment_method constraint to allow 'online'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('cash', 'card', 'online'));

-- 3. Add status 'pending_payment' to allow pre-payment orders
-- (No constraint on status column in current schema, so nothing to change)

-- 4. Index for webhook lookups
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id
  ON orders (stripe_session_id) WHERE stripe_session_id IS NOT NULL;

-- 5. Index for cleanup of abandoned orders
CREATE INDEX IF NOT EXISTS idx_orders_pending_payment_cleanup
  ON orders (created_at) WHERE status = 'pending_payment';
