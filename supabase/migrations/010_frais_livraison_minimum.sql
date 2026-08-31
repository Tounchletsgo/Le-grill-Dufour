-- 010: Fixed delivery fee (5€), minimum order (25€), remove free_from threshold

-- Update delivery config: fee = 5€, min_order = 25€
UPDATE delivery_config
  SET fee = 5,
      min_order = 25;

-- Remove the free_from column (no longer used)
ALTER TABLE delivery_config
  DROP COLUMN IF EXISTS free_from;
