-- ============================================================
-- Le Grill du Four — Seed Data
-- ============================================================
-- Run AFTER schema.sql. Populates all menu data from the
-- restaurant's current carte.
-- ============================================================

-- ============================================================
-- CATEGORIES
-- ============================================================
INSERT INTO categories (slug, label, intro, note, sort_order) VALUES
  ('lunch', 'Lunch', 'En semaine, sur le temps du midi, notre Chef vous propose ses différentes formules « lunch ».', 'Possibilité de suppléments selon les produits.', 1),
  ('entrees', 'Entrées', NULL, 'Entrée disponible en plat, accompagnement compris.', 2),
  ('croquettes', 'Croquettes', NULL, NULL, 3),
  ('planches', 'Planches', NULL, 'Nos planches sont servies soit en apéritif à partager soit en entrée.', 4),
  ('viandes', 'Viandes', NULL, NULL, 5),
  ('grillades', 'Grillades', NULL, NULL, 6),
  ('poissons', 'Poissons', NULL, 'N''hésitez pas à consulter nos suggestions.', 7),
  ('salades', 'Salades & Veggies', NULL, 'À base de légumes, avec ou sans œufs et fromage.', 8),
  ('desserts', 'Desserts', NULL, NULL, 9),
  ('boissons', 'Boissons', NULL, NULL, 10),
  ('digestifs', 'Digestifs', NULL, NULL, 11),
  ('cocktails', 'Cocktails', NULL, NULL, 12),
  ('whisky', 'Whisky', NULL, NULL, 13),
  ('rhum', 'Rhum', NULL, NULL, 14),
  ('jacoulot', 'Jacoulot', NULL, NULL, 15);

-- ============================================================
-- LUNCH FORMULES
-- ============================================================
INSERT INTO menu_items (category_id, name, description, price, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug='lunch'), 'Entrée', NULL, 6, 1),
  ((SELECT id FROM categories WHERE slug='lunch'), 'Plat', NULL, 14, 2),
  ((SELECT id FROM categories WHERE slug='lunch'), 'Dessert', NULL, 6, 3),
  ((SELECT id FROM categories WHERE slug='lunch'), 'Formule 1', 'Plat du jour', 14, 4),
  ((SELECT id FROM categories WHERE slug='lunch'), 'Formule 2', 'Entrée + Plat du jour', 20, 5),
  ((SELECT id FROM categories WHERE slug='lunch'), 'Formule 3', 'Plat du jour + Dessert', 20, 6),
  ((SELECT id FROM categories WHERE slug='lunch'), 'Formule 4', 'Entrée + Plat du jour + Dessert', 26, 7);

-- ============================================================
-- ENTRÉES
-- ============================================================
INSERT INTO menu_items (category_id, name, description, price, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug='entrees'), 'Salade de scampis croustillants', NULL, 14.50, 1),
  ((SELECT id FROM categories WHERE slug='entrees'), 'Salade burratina, pesto, balsamique', NULL, 16, 2),
  ((SELECT id FROM categories WHERE slug='entrees'), 'Carpaccio de Holstein', NULL, 22, 3),
  ((SELECT id FROM categories WHERE slug='entrees'), 'Moëlle du chef', 'Pain de campagne, moëlle, fines herbes', 14, 4),
  ((SELECT id FROM categories WHERE slug='entrees'), 'Scampis à l''ail ou à la diable', NULL, 15, 5),
  ((SELECT id FROM categories WHERE slug='entrees'), 'Terrine façon Yves Stal', NULL, NULL, 6),
  ((SELECT id FROM categories WHERE slug='entrees'), 'Saumon fumé', 'Toast, guacamole, shimeji, oignons', 16, 7),
  ((SELECT id FROM categories WHERE slug='entrees'), 'Tomates crevettes', NULL, 23, 8),
  ((SELECT id FROM categories WHERE slug='entrees'), 'Assiette anglaise', NULL, 14, 9);

-- ============================================================
-- CROQUETTES (items with variants)
-- ============================================================
INSERT INTO menu_items (category_id, name, description, price, weight, is_orderable, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug='croquettes'), 'Croquettes de fromage', NULL, NULL, '60g', true, 1),
  ((SELECT id FROM categories WHERE slug='croquettes'), 'Croquettes de crevette', NULL, NULL, '60g', true, 2);

INSERT INTO item_variants (item_id, label, price, sort_order) VALUES
  ((SELECT id FROM menu_items WHERE name='Croquettes de fromage'), 'Entrée (2 pièces)', 14.50, 1),
  ((SELECT id FROM menu_items WHERE name='Croquettes de fromage'), 'Plat (3 pièces)', 19.50, 2),
  ((SELECT id FROM menu_items WHERE name='Croquettes de crevette'), 'Entrée (2 pièces)', 20, 1),
  ((SELECT id FROM menu_items WHERE name='Croquettes de crevette'), 'Plat (3 pièces)', 27, 2);

-- ============================================================
-- PLANCHES (items with variants)
-- ============================================================
INSERT INTO menu_items (category_id, name, description, price, is_orderable, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug='planches'), 'La Dufour', 'Foie gras et sa confiture, Burratina, Gressins et tapenade d''olives, Terrine du grand-père, 3 sortes de charcuteries fines, Saumon fumé, Croquettes maison, Fromages', NULL, true, 1),
  ((SELECT id FROM categories WHERE slug='planches'), 'Planche du Boucher', 'Boudin, Saucisse, Merguez, Piano, 4 sauces', NULL, true, 2),
  ((SELECT id FROM categories WHERE slug='planches'), 'Big Planche La Dufour', NULL, NULL, true, 3),
  ((SELECT id FROM categories WHERE slug='planches'), 'Planche Prestige', 'Bellota, Jambon de Parme, Carpaccio Holstein fumé maturé, Croquettes Maison, Fromages', NULL, true, 4);

INSERT INTO item_variants (item_id, label, price, sort_order) VALUES
  ((SELECT id FROM menu_items WHERE name='La Dufour' AND category_id=(SELECT id FROM categories WHERE slug='planches')), '2 personnes', 18, 1),
  ((SELECT id FROM menu_items WHERE name='La Dufour' AND category_id=(SELECT id FROM categories WHERE slug='planches')), '4 personnes', 32, 2),
  ((SELECT id FROM menu_items WHERE name='Planche du Boucher'), '2 personnes', 18, 1),
  ((SELECT id FROM menu_items WHERE name='Planche du Boucher'), '4 personnes', 32, 2),
  ((SELECT id FROM menu_items WHERE name='Big Planche La Dufour'), '6 personnes', 44, 1),
  ((SELECT id FROM menu_items WHERE name='Planche Prestige'), '2 personnes', 20, 1),
  ((SELECT id FROM menu_items WHERE name='Planche Prestige'), '4 personnes', 36, 2);

-- ============================================================
-- VIANDES
-- ============================================================
INSERT INTO menu_items (category_id, name, description, price, price_label, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug='viandes'), 'Pavé de bœuf argentin', NULL, 22.50, NULL, 1),
  ((SELECT id FROM categories WHERE slug='viandes'), 'Filet pur', NULL, 34, NULL, 2),
  ((SELECT id FROM categories WHERE slug='viandes'), 'Filet pur Rossini', NULL, 39, NULL, 3),
  ((SELECT id FROM categories WHERE slug='viandes'), 'Côte à l''os', '±450g', 31, NULL, 4),
  ((SELECT id FROM categories WHERE slug='viandes'), 'Tartare de bœuf non préparé', NULL, 19.50, NULL, 5),
  ((SELECT id FROM categories WHERE slug='viandes'), 'Tartare préparé sur chariot', 'Supplément', NULL, '+3 €', 6);

-- ============================================================
-- GRILLADES
-- ============================================================
INSERT INTO menu_items (category_id, name, description, price, price_label, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug='grillades'), 'Côtes Piano', NULL, 28, NULL, 1),
  ((SELECT id FROM categories WHERE slug='grillades'), 'Côtes Piano XXL', NULL, 18, NULL, 2),
  ((SELECT id FROM categories WHERE slug='grillades'), 'Filet de volaille épicée', NULL, 20, NULL, 3),
  ((SELECT id FROM categories WHERE slug='grillades'), 'Filet de volaille au maroilles', NULL, 18, NULL, 4),
  ((SELECT id FROM categories WHERE slug='grillades'), 'Scampis grillés épicés', NULL, NULL, NULL, 5),
  ((SELECT id FROM categories WHERE slug='grillades'), 'Burger Dufour', 'Porc & bœuf — Pain au sésame, steak haché, cheddar vieilli, sauce BBQ maison, salade, tomates.', 21, NULL, 6),
  ((SELECT id FROM categories WHERE slug='grillades'), 'Votre viande flambadou', NULL, NULL, '+5 €', 7),
  ((SELECT id FROM categories WHERE slug='grillades'), 'Chti Burger', 'Porc & bœuf — Burger Dufour + œuf poché et crème de maroilles', 25, NULL, 8);

INSERT INTO item_supplements (item_id, label, price, sort_order) VALUES
  ((SELECT id FROM menu_items WHERE name='Burger Dufour'), 'Supplément foie gras', 5, 1),
  ((SELECT id FROM menu_items WHERE name='Burger Dufour'), 'Supplément étage', 6, 2);

-- ============================================================
-- POISSONS
-- ============================================================
INSERT INTO menu_items (category_id, name, description, price, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug='poissons'), 'Trilogie de poisson', NULL, 22, 1),
  ((SELECT id FROM categories WHERE slug='poissons'), 'Cabillaud', NULL, 27, 2),
  ((SELECT id FROM categories WHERE slug='poissons'), 'Feuilleté de saumon', 'Purée, béarnaise', 25, 3),
  ((SELECT id FROM categories WHERE slug='poissons'), 'Nouilles sautées aux scampis façon Thaï', NULL, 24, 4),
  ((SELECT id FROM categories WHERE slug='poissons'), 'Poisson du jour', 'Selon arrivage', 20, 5);

-- ============================================================
-- SALADES & VEGGIES
-- ============================================================
INSERT INTO menu_items (category_id, name, description, price, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug='salades'), 'Salade de briques de chèvre chaud', 'Miel, lardons, noix', 20, 1),
  ((SELECT id FROM categories WHERE slug='salades'), 'Salade César', 'Poulet, vinaigrette César, copeaux de Parmesan', 21, 2),
  ((SELECT id FROM categories WHERE slug='salades'), 'Salade Dufour', 'Mix Terre & Mer et foie gras', 26, 3),
  ((SELECT id FROM categories WHERE slug='salades'), 'Salade de la Mer', NULL, 24, 4),
  ((SELECT id FROM categories WHERE slug='salades'), 'Inspiration du chef chaud', '7 sortes de légumes sautés au beurre d''ail, œufs parfait, burratina, coupelle de feuille de brique', 21, 5),
  ((SELECT id FROM categories WHERE slug='salades'), 'Inspiration du chef froid', 'Coupelle de feuille de brique, salade, légumes crus et marinés, œuf poché, burratina', 19, 6);

-- ============================================================
-- DESSERTS
-- ============================================================
INSERT INTO menu_items (category_id, name, description, price, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug='desserts'), 'Dessert signature by Dufour', NULL, 12, 1),
  ((SELECT id FROM categories WHERE slug='desserts'), 'Crème brûlée', NULL, 10, 2),
  ((SELECT id FROM categories WHERE slug='desserts'), 'Salade de fruits frais', NULL, NULL, 3),
  ((SELECT id FROM categories WHERE slug='desserts'), 'Trilogie de sorbets', 'Citron, fruits passion, fruits rouges', 9, 4),
  ((SELECT id FROM categories WHERE slug='desserts'), 'Dame blanche', 'Glace vanille, chocolat chaud', 8, 5),
  ((SELECT id FROM categories WHERE slug='desserts'), 'Dame noire', 'Glace chocolat, chocolat chaud', 8, 6),
  ((SELECT id FROM categories WHERE slug='desserts'), 'Demi-ananas flambé au Cointreau', NULL, NULL, 7),
  ((SELECT id FROM categories WHERE slug='desserts'), 'Fondant au chocolat maison', '15 min de cuisson', NULL, 8),
  ((SELECT id FROM categories WHERE slug='desserts'), 'Café ou thé gourmand', NULL, NULL, 9),
  ((SELECT id FROM categories WHERE slug='desserts'), 'Colonel citron vodka blanche', NULL, NULL, 10),
  ((SELECT id FROM categories WHERE slug='desserts'), 'Colonel Framboise Ma Belle', NULL, NULL, 11),
  ((SELECT id FROM categories WHERE slug='desserts'), 'Poire Colonel', NULL, NULL, 12),
  ((SELECT id FROM categories WHERE slug='desserts'), 'Mousse au chocolat trompe-l''œil', NULL, NULL, 13),
  ((SELECT id FROM categories WHERE slug='desserts'), 'Tiramisu Oreo', NULL, NULL, 14),
  ((SELECT id FROM categories WHERE slug='desserts'), 'Suggestion de la pâtissière', 'Voir tableau', NULL, 15),
  ((SELECT id FROM categories WHERE slug='desserts'), 'La planche fromagère', 'Par personne', 10.50, 16);

-- ============================================================
-- BOISSONS CHAUDES
-- ============================================================
INSERT INTO menu_items (category_id, name, description, price, is_orderable, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug='boissons'), 'Café', NULL, NULL, false, 1),
  ((SELECT id FROM categories WHERE slug='boissons'), 'Café aromatisé', NULL, NULL, false, 2),
  ((SELECT id FROM categories WHERE slug='boissons'), 'Spéculoos', NULL, NULL, false, 3),
  ((SELECT id FROM categories WHERE slug='boissons'), 'Cookie', NULL, NULL, false, 4),
  ((SELECT id FROM categories WHERE slug='boissons'), 'Noisette', NULL, NULL, false, 5),
  ((SELECT id FROM categories WHERE slug='boissons'), 'Vanille', NULL, NULL, false, 6),
  ((SELECT id FROM categories WHERE slug='boissons'), 'Cappuccino', NULL, NULL, false, 7),
  ((SELECT id FROM categories WHERE slug='boissons'), 'Thé', NULL, NULL, false, 8),
  ((SELECT id FROM categories WHERE slug='boissons'), 'Chocolat chaud', NULL, NULL, false, 9),
  ((SELECT id FROM categories WHERE slug='boissons'), 'Chocolat chaud viennois', NULL, NULL, false, 10),
  ((SELECT id FROM categories WHERE slug='boissons'), 'Irish Coffee', NULL, NULL, false, 11),
  ((SELECT id FROM categories WHERE slug='boissons'), 'Italian Coffee', NULL, NULL, false, 12),
  ((SELECT id FROM categories WHERE slug='boissons'), 'French Coffee', NULL, NULL, false, 13),
  ((SELECT id FROM categories WHERE slug='boissons'), 'Caribbean Coffee', NULL, NULL, false, 14),
  ((SELECT id FROM categories WHERE slug='boissons'), 'Russian Coffee', NULL, NULL, false, 15);

-- ============================================================
-- DIGESTIFS
-- ============================================================
INSERT INTO menu_items (category_id, name, description, price, volume, is_orderable, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug='digestifs'), 'Get 27', NULL, NULL, '6cl', false, 1),
  ((SELECT id FROM categories WHERE slug='digestifs'), 'Baileys', NULL, NULL, '6cl', false, 2),
  ((SELECT id FROM categories WHERE slug='digestifs'), 'Limoncello Ma Belle', NULL, NULL, '6cl', false, 3),
  ((SELECT id FROM categories WHERE slug='digestifs'), 'Frangelico', NULL, NULL, '6cl', false, 4),
  ((SELECT id FROM categories WHERE slug='digestifs'), 'Amaretto Ma Belle', NULL, NULL, '4cl', false, 5),
  ((SELECT id FROM categories WHERE slug='digestifs'), 'Cointreau', NULL, NULL, '4cl', false, 6),
  ((SELECT id FROM categories WHERE slug='digestifs'), 'Grand Marnier', NULL, NULL, '4cl', false, 7),
  ((SELECT id FROM categories WHERE slug='digestifs'), 'Cognac Drouet', NULL, NULL, '4cl', false, 8),
  ((SELECT id FROM categories WHERE slug='digestifs'), 'Armagnac', NULL, NULL, '4cl', false, 9),
  ((SELECT id FROM categories WHERE slug='digestifs'), 'Calvados', NULL, NULL, '4cl', false, 10),
  ((SELECT id FROM categories WHERE slug='digestifs'), 'Poire Williams', NULL, NULL, '4cl', false, 11),
  ((SELECT id FROM categories WHERE slug='digestifs'), 'Poire Cognac Ma Belle', NULL, NULL, '6cl', false, 12),
  ((SELECT id FROM categories WHERE slug='digestifs'), 'Framboise Ma Belle', NULL, NULL, '6cl', false, 13),
  ((SELECT id FROM categories WHERE slug='digestifs'), 'Chartreuse', NULL, NULL, '4cl', false, 14),
  ((SELECT id FROM categories WHERE slug='digestifs'), 'Disaronno Velvet', NULL, NULL, '4cl', false, 15),
  ((SELECT id FROM categories WHERE slug='digestifs'), 'Armagnac VSOP', NULL, NULL, '4cl', false, 16);

-- ============================================================
-- COCKTAILS DIGESTIFS
-- ============================================================
INSERT INTO menu_items (category_id, name, description, price, is_orderable, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug='cocktails'), 'Espresso Martini', NULL, NULL, false, 1),
  ((SELECT id FROM categories WHERE slug='cocktails'), 'Madeleine', 'Cointreau, Amaretto, ananas', NULL, false, 2),
  ((SELECT id FROM categories WHERE slug='cocktails'), 'Orgasme', 'Jet 27, Baileys', NULL, false, 3),
  ((SELECT id FROM categories WHERE slug='cocktails'), 'Café Storme Vittorio', NULL, NULL, false, 4),
  ((SELECT id FROM categories WHERE slug='cocktails'), 'Irish / Italian Coffee', NULL, NULL, false, 5),
  ((SELECT id FROM categories WHERE slug='cocktails'), 'French / Caribbean Coffee', NULL, NULL, false, 6),
  ((SELECT id FROM categories WHERE slug='cocktails'), 'Russian / Baileys Coffee', NULL, NULL, false, 7),
  ((SELECT id FROM categories WHERE slug='cocktails'), 'Irish Coffee Glacé', NULL, NULL, false, 8),
  ((SELECT id FROM categories WHERE slug='cocktails'), 'Irish Coffee XXL', NULL, 16.30, false, 9);

-- ============================================================
-- WHISKY
-- ============================================================
INSERT INTO menu_items (category_id, name, description, price, volume, is_orderable, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug='whisky'), 'Aberfeldy 12 ans', NULL, NULL, '4cl', false, 1),
  ((SELECT id FROM categories WHERE slug='whisky'), 'Chivas 12 ans', NULL, NULL, '4cl', false, 2),
  ((SELECT id FROM categories WHERE slug='whisky'), 'Talisker 10 ans', NULL, NULL, '4cl', false, 3),
  ((SELECT id FROM categories WHERE slug='whisky'), 'Oban 14 ans', NULL, NULL, '4cl', false, 4);

-- ============================================================
-- RHUM
-- ============================================================
INSERT INTO menu_items (category_id, name, description, price, volume, is_orderable, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug='rhum'), 'Diplomatico', NULL, NULL, '4cl', false, 1),
  ((SELECT id FROM categories WHERE slug='rhum'), 'Santa Teresa 1796', NULL, NULL, '4cl', false, 2),
  ((SELECT id FROM categories WHERE slug='rhum'), 'Don Papa', NULL, NULL, '4cl', false, 3),
  ((SELECT id FROM categories WHERE slug='rhum'), 'El Dorado Demerara 1996', NULL, NULL, '4cl', false, 4);

-- ============================================================
-- JACOULOT
-- ============================================================
INSERT INTO menu_items (category_id, name, description, price, volume, is_orderable, sort_order) VALUES
  ((SELECT id FROM categories WHERE slug='jacoulot'), 'Jacoulot Menthe poivrée', NULL, NULL, '4cl', false, 1),
  ((SELECT id FROM categories WHERE slug='jacoulot'), 'Jacoulot Abricot', NULL, NULL, '4cl', false, 2),
  ((SELECT id FROM categories WHERE slug='jacoulot'), 'Jacoulot Mandarine', NULL, NULL, '4cl', false, 3);

-- ============================================================
-- FIXED MENUS
-- ============================================================
INSERT INTO fixed_menus (name, price, description, is_highlight, sort_order) VALUES
  ('Menu Enfant', 15, 'Une formule pensée pour les plus jeunes gourmets.', false, 1),
  ('Menu Grill', 38, 'Le classique du Grill du Four, viande grillée et accompagnements au choix.', false, 2),
  ('Menu Bistrot', 39, 'Une sélection bistrot généreuse, entre tradition et gourmandise.', false, 3),
  ('Menu Côte à l''Os', 47, 'La pièce emblématique de la maison, cuisson maîtrisée à la perfection.', true, 4),
  ('Menu Prestige', 56, 'Notre offre la plus raffinée pour une expérience grill d''exception.', true, 5);

-- ============================================================
-- SAUCES
-- ============================================================
INSERT INTO sauces (name, sort_order) VALUES
  ('Champignons', 1),
  ('Poivre', 2),
  ('Échalotes', 3),
  ('Béarnaise', 4),
  ('Maroilles', 5),
  ('Truffes', 6),
  ('Mayonnaise maison', 7),
  ('Ketchup', 8),
  ('BBQ maison', 9);

-- ============================================================
-- OPENING HOURS
-- ============================================================
INSERT INTO opening_hours (day_of_week, day_label, is_closed, open_time, close_time, sort_order) VALUES
  (0, 'Lundi', false, '11:45', '15:00', 1),
  (0, 'Lundi', false, '18:45', '22:00', 2),
  (1, 'Mardi', false, '11:45', '15:00', 3),
  (1, 'Mardi', false, '18:45', '22:00', 4),
  (2, 'Mercredi', true, NULL, NULL, 5),
  (3, 'Jeudi', true, NULL, NULL, 6),
  (4, 'Vendredi', false, '11:45', '15:00', 7),
  (4, 'Vendredi', false, '18:45', '22:00', 8),
  (5, 'Samedi', false, '11:45', '15:00', 9),
  (5, 'Samedi', false, '18:45', '22:00', 10),
  (6, 'Dimanche', false, '11:45', '15:00', 11);

-- ============================================================
-- DELIVERY CONFIG
-- ============================================================
INSERT INTO delivery_config (is_enabled, min_order, fee, free_from, zone_description, zone_radius_km, zone_center_postal, estimated_time, pickup_time)
VALUES (true, 20, 4, 35, 'Rayon de 15 km autour de 7700 Mouscron', 15, '7700', '25 min', '15 min');
