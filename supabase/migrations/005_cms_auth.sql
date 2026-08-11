-- ============================================================
-- Migration 005: CMS content tables, user roles, menu enhancements
-- ============================================================

-- 1. USER ROLES (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- 2. SITE CONTENT BLOCKS
CREATE TABLE IF NOT EXISTS site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page TEXT NOT NULL,
  block_key TEXT NOT NULL,
  block_label TEXT NOT NULL DEFAULT '',
  content JSONB NOT NULL DEFAULT '{}',
  draft JSONB,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(page, block_key)
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published content" ON site_content
  FOR SELECT USING (is_published = true);

CREATE TRIGGER trg_site_content_updated BEFORE UPDATE ON site_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. CONTENT VERSION HISTORY
CREATE TABLE IF NOT EXISTS content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES site_content(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  published_by UUID,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;

-- 4. SITE IMAGES
CREATE TABLE IF NOT EXISTS site_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  size_bytes INTEGER,
  content_type TEXT DEFAULT 'image/webp',
  variants JSONB DEFAULT '[]',
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE site_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read images" ON site_images FOR SELECT USING (true);

-- 5. MENU ITEM ENHANCEMENTS
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS is_out_of_stock BOOLEAN NOT NULL DEFAULT false;

-- 6. CREATE STORAGE BUCKET (run manually if this fails)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('site-images', 'site-images', true)
-- ON CONFLICT DO NOTHING;

-- 7. SEED DEFAULT CONTENT BLOCKS
INSERT INTO site_content (page, block_key, block_label, content, is_published, published_at) VALUES
  ('accueil', 'hero', 'Bandeau principal', '{"eyebrow":"Restaurant & Grill · Mouscron","title":"Grill Dufour","tagline":"Viandes, grillades & produits frais","image":"https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=2000&auto=format&fit=crop","image_alt":"Viande grillée sur braises","cta_primary_label":"Commander en livraison","cta_primary_url":"/livraison","cta_secondary_label":"Réserver une table","cta_secondary_url":"#contact"}', true, now()),
  ('accueil', 'presentation', 'Le Restaurant', '{"eyebrow":"La Maison","title":"Une passion du feu & de la belle viande","text":"<p>Chez Grill Dufour, la viande se grille dans les règles : produits sélectionnés avec exigence, cuissons maîtrisées et générosité dans chaque assiette. Ici, la cuisine se fait devant vous, avec le crépitement du grill comme signature sonore de la maison.</p><p>Dans un cadre chic et chaleureux, entre bois brut, cuir patiné et éclairages tamisés, nous vous accueillons pour un moment convivial autour de grillades d''exception, de planches généreuses et d''une carte pensée pour tous les appétits.</p>","image":"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop","image_alt":"Intérieur chaleureux du restaurant Grill Dufour","stats":[{"number":"100%","label":"Cuisson au grill"},{"number":"7j/7","label":"Sauf mer. & jeu."},{"number":"20+","label":"Pers. en groupe"}]}', true, now()),
  ('accueil', 'specialites', 'Spécialités', '{"eyebrow":"Nos Spécialités","title":"L''excellence à chaque catégorie","subtitle":"Cinq univers, une seule exigence : la qualité au feu de bois.","cards":[{"title":"Viandes","description":"Pavé argentin, filet pur, côte à l''os — des pièces choisies avec exigence.","image":"https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=900&auto=format&fit=crop","image_alt":"Viandes grillées premium"},{"title":"Grillades","description":"Côtes piano, volaille épicée, et notre fameux flambadou.","image":"https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?q=80&w=900&auto=format&fit=crop","image_alt":"Grillades au feu de bois"},{"title":"Burgers","description":"Burger Dufour et Chti Burger, pain sésame et sauce BBQ maison.","image":"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=900&auto=format&fit=crop","image_alt":"Burger Dufour maison"},{"title":"Poissons","description":"Cabillaud, saumon et trilogie de poissons, selon arrivage.","image":"https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=900&auto=format&fit=crop","image_alt":"Poissons frais grillés"},{"title":"Planches","description":"La Dufour, Prestige ou du Boucher — à partager sans modération.","image":"https://images.unsplash.com/photo-1626200419199-391ae4be7a41?q=80&w=900&auto=format&fit=crop","image_alt":"Planche de charcuterie et fromages"}]}', true, now()),
  ('accueil', 'contact', 'Contact & réservation', '{"address":"Rue des Courtils - Hovenstraat 1B, 7700 Mouscron, Hainaut, Belgique","phone":"+32 56 34 28 70","email":"chriswillen@me.com","hours":"Lun, Mar, Ven, Sam : 11h45–15h & 18h45–22h\nDim : 11h45–15h · Mer & Jeu : Fermé","maps_url":"https://www.google.com/maps/search/?api=1&query=Rue+des+Courtils+1B+7700+Mouscron+Belgium","maps_embed":"https://www.google.com/maps?q=Rue+des+Courtils+1B,+7700+Mouscron,+Belgium&output=embed"}', true, now()),
  ('footer', 'main', 'Pied de page', '{"description":"Restaurant & grill au cœur de Mouscron. Produits frais, cuisson au feu de bois.","tva":"BE0726458932","facebook":"#","instagram":"#"}', true, now()),
  ('mentions-legales', 'main', 'Mentions légales', '{"text":"<h2>Éditeur du site</h2><p>Grill Dufour<br>Rue des Courtils - Hovenstraat 1B<br>7700 Mouscron, Belgique<br>Tél : +32 56 34 28 70<br>Email : chriswillen@me.com</p><h2>Hébergement</h2><p>Vercel Inc.<br>440 N Barranca Ave #4133<br>Covina, CA 91723, USA</p><h2>Propriété intellectuelle</h2><p>L''ensemble du contenu de ce site (textes, images, logo, mise en page) est la propriété exclusive de Grill Dufour, sauf mention contraire. Toute reproduction, même partielle, est interdite sans autorisation préalable.</p><h2>Limitation de responsabilité</h2><p>Les informations fournies sur ce site (menu, prix, horaires) sont données à titre indicatif et peuvent être modifiées sans préavis.</p><h2>Droit applicable</h2><p>Le présent site est soumis au droit belge. Tout litige sera de la compétence exclusive des tribunaux de l''arrondissement judiciaire de Tournai.</p>"}', true, now()),
  ('confidentialite', 'main', 'Politique de confidentialité', '{"text":""}', true, now())
ON CONFLICT (page, block_key) DO NOTHING;
