-- ============================================================
-- Le Grill du Four — Supabase Schema
-- ============================================================
-- Run this in the Supabase SQL Editor to create all tables.
-- After running, execute seed.sql to populate menu data.
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  intro TEXT,
  note TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. MENU ITEMS
-- ============================================================
CREATE TABLE menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(8,2),
  price_label TEXT,
  weight TEXT,
  volume TEXT,
  is_orderable BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. ITEM VARIANTS (croquettes sizes, planche portions, etc.)
-- ============================================================
CREATE TABLE item_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  price DECIMAL(8,2) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- 4. ITEM SUPPLEMENTS (foie gras, étage, flambadou, etc.)
-- ============================================================
CREATE TABLE item_supplements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  price DECIMAL(8,2) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- 5. FIXED MENUS (Menu Enfant, Menu Grill, etc.)
-- ============================================================
CREATE TABLE fixed_menus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(8,2) NOT NULL,
  description TEXT,
  is_highlight BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. SAUCES
-- ============================================================
CREATE TABLE sauces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- 7. OPENING HOURS
-- ============================================================
CREATE TABLE opening_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  day_label TEXT NOT NULL,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  open_time TIME,
  close_time TIME,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- 8. DELIVERY CONFIG (single-row config table)
-- ============================================================
CREATE TABLE delivery_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  min_order DECIMAL(8,2) NOT NULL DEFAULT 20,
  fee DECIMAL(8,2) NOT NULL DEFAULT 4,
  free_from DECIMAL(8,2) NOT NULL DEFAULT 35,
  zone_description TEXT DEFAULT 'Rayon de 15 km autour de 7700 Mouscron',
  zone_radius_km INTEGER DEFAULT 15,
  zone_center_postal TEXT DEFAULT '7700',
  estimated_time TEXT DEFAULT '25 min',
  pickup_time TEXT DEFAULT '15 min',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. ORDERS
-- ============================================================
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','preparing','ready','delivering','delivered','cancelled')),
  mode TEXT NOT NULL CHECK (mode IN ('delivery','pickup')),

  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,

  delivery_address TEXT,
  delivery_postal TEXT,
  delivery_city TEXT,

  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash','card')),
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending','paid','refunded')),
  refused_at TIMESTAMPTZ,

  subtotal DECIMAL(8,2) NOT NULL,
  delivery_fee DECIMAL(8,2) NOT NULL DEFAULT 0,
  total DECIMAL(8,2) NOT NULL,

  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  prepared_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  estimated_delivery_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES item_variants(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  variant_label TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(8,2) NOT NULL,
  total_price DECIMAL(8,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 11. ORDER ITEM SUPPLEMENTS
-- ============================================================
CREATE TABLE order_item_supplements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  supplement_id UUID REFERENCES item_supplements(id) ON DELETE SET NULL,
  label TEXT NOT NULL,
  price DECIMAL(8,2) NOT NULL
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_active ON menu_items(is_active) WHERE is_active = true;
CREATE INDEX idx_item_variants_item ON item_variants(item_id);
CREATE INDEX idx_item_supplements_item ON item_supplements(item_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_menu_items_updated BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_fixed_menus_updated BEFORE UPDATE ON fixed_menus
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_delivery_config_updated BEFORE UPDATE ON delivery_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ORDER NUMBER SEQUENCE
-- ============================================================
CREATE SEQUENCE order_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'GDF-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(nextval('order_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_number BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE sauces ENABLE ROW LEVEL SECURITY;
ALTER TABLE opening_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_supplements ENABLE ROW LEVEL SECURITY;

-- Public read on menu data
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read menu_items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Public read item_variants" ON item_variants FOR SELECT USING (true);
CREATE POLICY "Public read item_supplements" ON item_supplements FOR SELECT USING (true);
CREATE POLICY "Public read fixed_menus" ON fixed_menus FOR SELECT USING (true);
CREATE POLICY "Public read sauces" ON sauces FOR SELECT USING (true);
CREATE POLICY "Public read opening_hours" ON opening_hours FOR SELECT USING (true);
CREATE POLICY "Public read delivery_config" ON delivery_config FOR SELECT USING (true);

-- Orders: anyone can insert (anon creates orders), service_role manages
CREATE POLICY "Anon can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can create order_items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon can create order_item_supplements" ON order_item_supplements FOR INSERT WITH CHECK (true);

-- Orders: read own order by id (will use server-side for tracking page)
CREATE POLICY "Read own order" ON orders FOR SELECT USING (true);
CREATE POLICY "Read order items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Read order item supplements" ON order_item_supplements FOR SELECT USING (true);

-- ============================================================
-- BLACKLIST (anti-abuse)
-- ============================================================
CREATE TABLE IF NOT EXISTS blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- REALTIME (enable for kitchen tablet)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
