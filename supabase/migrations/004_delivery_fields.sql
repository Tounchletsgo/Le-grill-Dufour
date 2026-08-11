-- ============================================================
-- Migration 004: Delivery-specific fields on menu_items
-- ============================================================
-- Adds fields to separate dine-in menu from delivery menu.
-- Run this in the Supabase SQL Editor.
-- ============================================================

ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS is_deliverable BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_price DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS delivery_description TEXT,
  ADD COLUMN IF NOT EXISTS delivery_sort_order INTEGER,
  ADD COLUMN IF NOT EXISTS is_delivery_only BOOLEAN NOT NULL DEFAULT false;
