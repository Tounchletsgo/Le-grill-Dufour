-- Migration: remove Mollie, add blacklist, add refused_at
-- Run this in the Supabase SQL Editor if you already have the database set up.

-- 1. Remove mollie_payment_id column
ALTER TABLE orders DROP COLUMN IF EXISTS mollie_payment_id;

-- 2. Add refused_at column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refused_at TIMESTAMPTZ;

-- 3. Update payment_method constraint (remove 'online')
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('cash', 'card'));

-- 4. Create blacklist table
CREATE TABLE IF NOT EXISTS blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;
