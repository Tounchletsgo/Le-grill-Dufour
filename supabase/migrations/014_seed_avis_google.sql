-- ============================================================
-- 014 — Insertion des vrais avis Google (5 étoiles uniquement)
-- Avis copiés manuellement depuis la page Google Business.
-- is_active = true  → affiché sur le site (sélection courte)
-- is_active = false → stocké mais masqué (activable via back-office)
-- ============================================================

INSERT INTO google_reviews (author_name, rating, review_date, review_text, sort_order, is_active) VALUES

-- ===== ACTIFS (sélection de ~15 avis courts et marquants) =====

('Daneluzzi juliette', 5, 'il y a un mois',
 'Super restaurant, il y en a pour tous les goûts. Les plats sont excellents tout comme l''accueil. Les prix sont raisonnables, on a pu profiter de la terrasse. Stationnement facile dans la rue. A refaire sans modération',
 1, true),

('Michèle Labeeuw', 5, 'il y a 3 mois',
 'Lorsque nous venons à Mouscron nous faisons systématiquement un passage au Grill du Four. On y trouve un accueil chaleureux et une cuisine telle qu''on ne trouve malheureusement plus à Bruxelles: des plats du jour inventifs et des suggestions vraiment originales, une cuisine vraiment maison aussi délicieuse que généreuse.',
 2, true),

('Cyrille Dermaux', 5, 'il y a 4 mois',
 'Terrasse très agréable, le service au top et nous nous sommes régalés. Quand c''est bien il faut le dire ! Bravo à toute l''équipe',
 3, true),

('Eric Branchési', 5, 'il y a 2 mois',
 'Super resto belle découverte. Serveur génial marrant top. Ambiance au rendez vous également et je vous raconte paa les plats ;) de belles photos valent mieux qu''un discours.',
 4, true),

('Faustine Baldinazzo', 5, 'il y a 4 mois',
 'Juste incroyable. La qualité du plat est exceptionnelle, les serveurs sont adorables, rien à dire. Je reviendrai encore et encore !',
 5, true),

('louise bosquillon', 5, 'il y a 5 mois',
 'c''était pour nous "une première",mais pas "la dernière"....trop "bon",une équipe au "top" et surtout : ne pas hésiter à découvrir ce très bel établissement !!!! Marlène et Louise "les filles de la table haute" !',
 6, true),

('shanon coulembier', 5, 'il y a 2 mois',
 'Venu le 22 juin 2026. Excellent restaurant ! Service impeccable, personnel accueillant et plats délicieux. Nous avons très bien mangé. Je recommande sans hésitation.',
 7, true),

('johan sabbe', 5, 'il y a 4 mois',
 'Nourriture absolument délicieuse ! Service impeccable ! Nous reviendrons sans hésiter.',
 8, true),

('henrique fontan', 5, 'il y a 2 ans',
 'Très bonne ambiance,cuisine et service très professionnel, rapport qualité/prix impeccable et pour rien gâcher le prix des vins et des boissons sont plus que corrects! Première visite et sûrement pas la dernière .',
 9, true),

('Dennis Zee van der', 5, 'il y a 3 ans',
 'Excellente cuisine et service impeccable. Belle terrasse chauffée avec musique d''ambiance. Possibilité de faire préparer sa viande à table et les boissons offertes étaient un vrai régal. À recommander absolument !',
 10, true),

('Enjoy your life', 5, 'il y a un an',
 'Tout a dépassé mes attentes ! Accueil chaleureux, propreté impeccable, ambiance conviviale, cuisine ouverte, plats délicieux ; bref, je recommande vivement !',
 11, true),

('christophe mey', 5, 'il y a 4 ans',
 'Un restaurant de grande qualité, deux frères extrêmement professionnels, une expérience culinaire sans cesse renouvelée, merci',
 12, true),

('Raphaël Matta', 5, 'il y a 9 mois',
 'Super soirée , très bon sévices, conviviale, agréable, avec le sourire! Les plats exceptionnel! Et la fin très bonne!!',
 13, true),

('Laurens Scherpereel', 5, 'il y a 10 mois',
 'Phénoménal ! La qualité pour ce prix est fortement recommandée.',
 14, true),

('Dominique Nizet', 5, 'il y a 6 ans',
 'Nouvelle terrasse installée, très sympa. Personnel charmant et viandes de qualité. Prix très correct',
 15, true),

('durnez joël', 5, 'il y a 4 ans',
 'Nourriture délicieuse et service très sympathique, je recommande sans hésiter.',
 16, true),

-- ===== INACTIFS (disponibles dans le back-office) =====

('Maeva Morel', 5, 'il y a 5 mois',
 'Nous avons passé un moment absolument génial dans ce restaurant ! Du début à la fin, tout était parfait. Nous nous sommes vraiment régalés : de la…',
 17, false),

('Karen Leroy', 5, 'il y a 6 mois',
 'Que dire de cette soirée ❤️ Les serveur/se/s aux petits soins, de bons conseils et hyper sympathiques Ils ont tout fait pour que nos désirs soient exaucés…',
 18, false),

('Marie Debucquoy', 5, 'il y a 4 mois',
 'Super bon ! 😋 Viandes excellentes et repas de grande qualité, avec des produits vraiment bien travaillés…',
 19, false),

('Séverine Dangleant', 5, 'il y a un mois',
 'Très bonne adresse, Très beau cadre très belle terrasse une bonne cuisine un personnel au top très professionnel…',
 20, false),

('Delphine Defebvre', 5, 'il y a 10 mois',
 'Dîner en amoureux pour l''anniversaire de mon conjoint où nous avons passé une superbe soirée! Cadre très chaleureux avec un personnel aux petits soins! Le service était parfait avec de magnifiques cocktails aussi beaux que bon! Merci Tim 😍…',
 21, false),

('Arnaud Devoldere', 5, 'il y a 2 mois',
 'Excellente expérience au Grill Dufour ! La viande est de très grande qualité, cuite à la perfection, et les accompagnements sont délicieux. Le personnel est accueillant, souriant et très professionnel. Le cadre est chaleureux et on s''y sent…',
 22, false),

('Michel Mascart', 5, 'il y a un an',
 'Nous sommes allés manger le mardi midi J''ai pris une formule à moins 20€ et mon épouse une planche . Jolie Décoration du restaurant…',
 23, false),

('Claire Gobé', 5, 'il y a 2 mois',
 'Un grand merci à Sabrina et Laurent pour leur accueil chaleureux, leur professionnalisme et leur gentillesse tout au long de notre repas. Le service était impeccable, l''ambiance conviviale et les plats délicieux. Nous avons passé un…',
 24, false),

('Laetitia Wana', 5, 'il y a 6 mois',
 'Avons passé un excellent moment pour un anniversaire en famille .cuisine, très bonne, je recommande++',
 25, false),

('Celi', 5, 'il y a 3 mois',
 'Nous sommes déjà venus deux fois au Grill Dufour et c''est toujours un plaisir. Nous avons passé un très bon diner au grill Dufour pour l''anniversaire de mon compagnon ! Les prix des menus sont correctes pour la qualité proposée, on se…',
 26, false),

('Pili Carnicero', 5, 'il y a 2 ans',
 'Nous avons été bien accueilli, les plats sont servis avec professionnalisme. Nous avons très bien mangé. Un digestif nous a été offert à la fin du repas.',
 27, false),

('Sophie Lacroix', 5, 'il y a 3 semaines',
 'Très belle endroit, avec des serveurs et serveuses fort souriantes et sur tout une superbe ambiance, un lieu vraiment magnifique, je vous le recommande vivement…',
 28, false),

('steve V', 5, 'il y a 6 mois',
 'J''en sors à l''instant...et franchement ça fait plaisir !! Enfin un resto qui ne prend pas ses clients pour des billes. J''y étais pour l''anniversaire de ma compagne. Grosse bouteille de vin, viande excellente, produits frais...et verre du…',
 29, false),

('Fab Rice', 5, 'il y a 7 mois',
 'Un moment parfait du début à la fin ! Tout était au rendez-vous : un service impeccable, une cuisine délicieuse et une ambiance très chaleureuse…',
 30, false),

('Cathy Mazereel', 5, 'il y a 4 mois',
 'Délicieux ! Service excellent !',
 31, false),

('markistance', 5, 'il y a 10 mois',
 'J''ai adoré cet endroit. Excellente cuisine et service impeccable 👌…',
 32, false),

('Maik Teichgräber', 5, 'il y a 3 ans',
 'Excellent, merveilleux ! J''ai dégusté un steak Tomahawk parfait. Je le recommande vivement !',
 33, false),

('Cathy Desmet', 5, 'il y a 5 ans',
 'C''est un dessert vraiment délicieux et très agréable à déguster, allez-y absolument, et ce n''est pas cher.',
 34, false),

('Gilles', 5, 'il y a 4 ans',
 'Restaurant magnifique ; la qualité des plats est toujours au rendez-vous. Les plateaux d''entrées sont incontournables. La carte est variée, et je vous recommande tout particulièrement les plats de viande : un vrai délice ! Vous n''aurez plus…',
 35, false),

('Edwin Vanhauwaert', 5, 'il y a 2 ans',
 'Un bistro très branché proposant des plats classiques revisités avec modernité. Un incontournable pour les amateurs de viande. Ambiance agréable et service impeccable : un de nos restaurants préférés.',
 36, false),

('Cait Boer', 5, 'il y a 5 ans',
 'La nourriture ici est absolument délicieuse. J''ai pris la salade de saumon fumé en entrée, un vrai régal. Mon mari a choisi les langoustines au curry et à la noix de coco, et j''y ai goûté : c''était tout aussi incroyable. Qualité irréprochable.',
 37, false),

('Kris Holsters', 5, 'il y a 4 ans',
 'Super. Délicieux et ambiance agréable.',
 38, false),

('Amandine Mendes', 5, 'il y a 4 ans',
 'Un super restaurant si vous aimez la bonne viande et les produits de qualité ! Nous avons déjeuné à 7 adultes et 2 enfants, l''ambiance était incroyable. Nous avons pu profiter de la sublime terrasse et le service était impeccable ! ( Un…',
 39, false),

('Chantal Demets', 5, 'il y a 6 ans',
 'Un restaurant à ne pas manquer super bon et convivial j''y retournerai avec plaisir cadre et relaxant avec une superbe terrasse',
 40, false),

('Mélanie Vandenbussche', 5, 'il y a 6 ans',
 'On y mange très bien! Toujours de belles assiettes, autant le décor que dans la bouche, j''aime y venir passer un bon petit moment! Service au top!! Et la qualité n''en parlons même pas 🤤…',
 41, false),

('Marleen xx', 5, 'il y a 2 ans',
 'Une première qui va se répéter, ambiance et service au top. Très bonne cuisine 👍👍…',
 42, false),

('Cathy Duwez', 5, 'il y a 6 ans',
 'Personnel très sympathique et cuisine savoureuse. Fortement recommandé aux amateurs de viande, mais tout le reste est d''excellente qualité…',
 43, false),

('MisterShen', 5, 'il y a 4 ans',
 'Très bien accueilli, je suis arrivé avec ma compagne et nous nous sommes fait servir comme des rois ! Je recommande ce restaurant pour les amateurs de bonnes viandes !…',
 44, false),

('Valerie Vercamst', 5, 'il y a un an',
 'Excellent endroit pour découvrir des saveurs de viande de très bonne qualité, un grand choix de plats et viande ou poisson grillé. Au choix du menu ou à la carte. Très beau restaurant avec une superbe terrasse très agréable et bien décorée.',
 45, false),

('Camille Rossie', 5, 'il y a 7 mois',
 'Moment agréable pour l''anniversaire de mon conjoint.',
 46, false),

('Remi JEAN', 5, 'il y a 4 mois',
 'Très sympas, personnel très agréable Comptez 5 mins à pied car rue très fréquentée pour se garer (très proche hôpital de Mouscron) Je recommande',
 47, false),

('JeanNo', 5, 'il y a 11 mois',
 'Bonne ambiance, plats de qualité et service souriant ! What''else ?',
 48, false),

('Tom', 5, 'il y a 4 ans',
 'J''ai dégusté un délicieux grill mixte.',
 49, false),

('Mellax DropxDead', 5, 'il y a 9 mois',
 'Le personnel était très accueillant et la nourriture délicieuse ! Malheureusement, mon cocktail préféré, l''Amaretto/Disaronno Sour, n''était plus à…',
 50, false);
