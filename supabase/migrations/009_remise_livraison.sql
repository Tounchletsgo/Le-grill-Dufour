-- 009: Delivery discount configuration + order discount tracking
-- Adds -10% delivery discount settings and removes desserts from delivery

-- Discount settings on delivery_config
ALTER TABLE delivery_config
  ADD COLUMN discount_percentage numeric(4,1) NOT NULL DEFAULT 10,
  ADD COLUMN discount_active boolean NOT NULL DEFAULT true;

-- Track discount amount per order
ALTER TABLE orders
  ADD COLUMN discount_amount numeric(10,2) NOT NULL DEFAULT 0;

-- Remove all desserts from delivery
UPDATE menu_items
  SET is_deliverable = false
  WHERE category_id IN (
    SELECT id FROM categories WHERE slug = 'desserts'
  );
