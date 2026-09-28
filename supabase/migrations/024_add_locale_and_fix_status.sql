-- Migration 024: Add missing locale column + fix status constraint
-- This migration fixes the order creation error ("Erreur lors de la création de la commande.")
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- 1. Add locale column to orders (stores the customer's language: 'fr' or 'nl')
ALTER TABLE orders ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'fr';

-- 2. Update status constraint to include 'pending_payment' (needed for Stripe online payments)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'pending_payment', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'));
