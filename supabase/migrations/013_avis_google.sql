-- ============================================================
-- 013 — Avis Google (reprise manuelle)
-- Table des avis + config (note moyenne, total, lien Google)
-- ============================================================

CREATE TABLE IF NOT EXISTS google_reviews_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  average_rating numeric(2,1) NOT NULL DEFAULT 4.7,
  total_count integer NOT NULL DEFAULT 984,
  google_maps_url text NOT NULL DEFAULT 'https://www.google.com/maps/place/Le+grill+Dufour/@50.7466257,3.2136073,17z/data=!4m8!3m7!1s0x47c3c321943758ad:0x54dba0a679e06d45!8m2!3d50.7466257!4d3.2161822!9m1!1b1!16s%2Fg%2F11hz1sr9kp',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO google_reviews_config (average_rating, total_count) VALUES (4.7, 984);

CREATE TABLE IF NOT EXISTS google_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_date text NOT NULL,
  review_text text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE google_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_reviews_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read reviews" ON google_reviews FOR SELECT USING (true);
CREATE POLICY "Public read reviews config" ON google_reviews_config FOR SELECT USING (true);
