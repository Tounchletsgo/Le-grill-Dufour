# CAHIER DES CHARGES — Le Grill Dufour

> Référence unique du projet. Tout ce qui figure ici a été demandé par le patron et doit fonctionner en
> permanence. Ne jamais retirer, affaiblir ou contourner une ligne sans demande explicite du patron.
> Légende : [DÉCIDÉ] = décision ferme · [EN ATTENTE] = dépend d'une action ou d'une décision du patron.

## 1. Informations officielles du restaurant
- Nom : « Le Grill Dufour » (Dufour en un mot). Le logo porte déjà « RESTAURANT » : pas de sous-titre
  « Steakhouse ».
- Adresse : Rue Des Courtils – Hovenstraat 1b, 7700 Mouscron, Hainaut, Belgique.
- Téléphone : 056 34 28 70 / +32 56 34 28 70. TVA : BE 0726.458.932.
- UNE SEULE adresse e-mail dans tout le projet : **chriswillen@me.com** (site, pied de page, contact,
  expéditeur ET adresse de réponse des e-mails automatiques, données structurées Google, variables
  d'environnement). Aucune autre adresse nulle part.
- Équipe : Loïc en cuisine, Christopher en salle.
- Horaires (ne pas modifier) : lundi et mardi 11h45–15h00 et 18h45–22h00 · mercredi et jeudi FERMÉ ·
  vendredi et samedi 11h45–15h00 et 18h45–22h00 · dimanche 11h45–15h00.
- Domaine : legrilldufour.be [EN ATTENTE : pointage à faire par le patron]. Hébergement : Vercel.
- Réservation : https://legrilldufour.reservation.barestho.com/ (lien direct).
- Chèques cadeaux : https://legrilldufour.reservation.barestho.com/shopping
- Fuseau horaire de référence pour toute date et toute heure : Europe/Brussels.

## 2. Identité visuelle
- Couleurs de marque : bordeaux, blanc, noir. Aucune modification du site public sans demande explicite.
- Logo en trois versions (noir, blanc, bordeaux) : toujours la version BLANCHE sur fond sombre ou
  bordeaux, noire ou bordeaux sur fond clair. Le logo ne doit jamais être invisible. Favicon : tête de
  taureau.
- Le site doit garder ses propres couleurs en mode sombre du téléphone (aucun fond noir imprévu).
- Contrastes lisibles partout. Aucun bordeaux sur noir illisible dans les outils internes.

## 3. Site public
- Navigation : ACCUEIL · LA CARTE · COMMANDER · RÉSERVER · CHÈQUES CADEAUX · CONTACT, avec le
  téléphone et les boutons RÉSERVER et COMMANDER. Barre classique sur ordinateur ; menu « trois
  barres » sur téléphone UNIQUEMENT, avec une seule croix de fermeture, sans carré bleu de sélection.
- Phrase exacte sous le logo du bandeau d'accueil : « Amateur de bonne viande ou fin gourmet, il y en
  aura pour tous les goûts. »
- Page d'accueil : bandeau avec logo, présentation du restaurant, galerie de photos de viande et de
  grillades (pas de poisson), section chèques cadeaux (photo assombrie où le chèque ressort), section
  « Venez nous rencontrer » avec Google Maps (ne pas toucher), horaires, pied de page.
- Supprimés : les blocs « 100 % cuisson grill », « 7 sur 7 », « 20 ou plus personnes en groupe » ;
  la section « Nos spécialités ».
- Les AVIS CLIENTS Google s'affichent sur l'accueil. INTERDIT d'inventer un avis. Si les vrais avis ne
  sont pas disponibles, la section se masque proprement.
- « La Carte » : les 6 photos de la carte réelle, lisibles sur téléphone, vue agrandie avec grande
  croix de fermeture, bouton « ← Retour à l'accueil » en haut et en bas de page. Le bouton « retour »
  du téléphone ferme la photo sans quitter le site.
- Animation discrète au défilement (stries de grillade, apparitions douces, ligne de progression), avec
  interrupteur en une ligne et respect de « réduire les animations » [si mise en place].
- Pied de page : « Restaurant Le Grill Dufour », liens Facebook et Instagram [EN ATTENTE : liens
  officiels à fournir par le patron].
- Bilinguisme français / néerlandais [si mis en place] : sélecteur « FR | NL » sobre et visible (barre
  du haut et menu mobile), sans drapeau ni page de choix ; détection de la langue du navigateur ; le
  panier est conservé au changement de langue ; adresses /nl/ pour le néerlandais ; néerlandais de
  Belgique, vouvoiement ; tout est traduit (erreurs, e-mails, confirmations) sauf les photos de la
  carte, les noms propres des plats et les outils internes (en français) ; une commande passée en
  néerlandais s'affiche EN FRANÇAIS en cuisine.
- Référencement : titres et descriptions, données structurées du restaurant, plan du site,
  redirections des anciennes adresses (/menu, /contact).
- Réseaux et partage : image de partage correcte. Accessibilité de base.

## 4. Commande en ligne — règles métier [DÉCIDÉ]
- Deux modes : livraison et retrait sur place.
- LIVRAISON : remise de −10 % sur tous les plats (prix du restaurant conservé en base, remise
  appliquée par-dessus, arrondi au 0,05 € près) ; frais de livraison fixes de 5,00 €, aucun seuil de
  gratuité ; minimum de commande de 25,00 € calculé APRÈS remise et HORS frais ; les boissons à 2,50 €
  sont EXCLUES de la remise.
- Tous les prix, remises, frais, minimums et durées sont recalculés CÔTÉ SERVEUR.
- Délai : estimation automatique de l'heure d'arrivée selon l'adresse (trajet + préparation), affichée
  sous la forme « vers 19h40, dans environ 40 minutes » ; si le calcul échoue, repli sur « Livraison
  entre 20 minutes et 1 heure, selon l'affluence et votre lieu de résidence ». La cuisine peut signaler
  un retard en un clic et l'heure affichée au client se met à jour en temps réel. Le livreur peut
  aussi affiner l'estimation par boutons rapides.
- Adresse : autocomplétion des rues (registre BeSt Address), recherche par début de chaque mot en
  ignorant les mots génériques (rue, avenue, chaussée, place…), numéro de maison dans un champ SÉPARÉ.
  L'adresse s'affiche proprement et à l'identique partout (ex. « Chaussée de Luingne 30, 7700
  Mouscron »), sans doublon ni code postal erroné.
- Remarque libre du client : neutralisée avant tout affichage (risque d'injection dans la tablette).
- CUISSONS : sept niveaux (bleu, saignant, rosé, à point, medium, bien cuit, cuit à cœur) et sept
  groupes (bœuf, magret, agneau, veau, gibier, abats rouges, cuisson imposée). Haché, volaille et porc :
  cuisson à cœur IMPOSÉE, verrouillée côté serveur. Décalage d'un cran en cuisine pour la livraison,
  réglable.
- ACCOMPAGNEMENTS : DEUX choix inclus et obligatoires — un féculent (frites, croquettes, gratin
  dauphinois, purée, riz, pâtes) ET légumes chauds ou salade. Exceptions sans accompagnement : feuilleté
  de saumon, nouilles thaï aux scampis, salades, veggies.
- SAUCES TOUTES PAYANTES : 3,00 € (champignons, poivre, échalotes, béarnaise, maroilles) ; 3,50 €
  (truffes) ; 2,00 € (beurre à l'ail) ; 1,00 € (mayonnaise maison, ketchup, BBQ maison). Supplément
  légumes de saison 4,00 €. Burger : foie gras +5,00 €, étage +6,00 €. Entrée disponible en plat,
  accompagnement compris : +6,50 €.
- PLATS DU JOUR : deux plats, prix de référence 14,00 € (12,60 € en livraison), disponibles en
  livraison ET en retrait, saisis chaque matin par le personnel avec un écran très simple et un
  historique réutilisable ; la catégorie disparaît automatiquement si rien n'est saisi ; remise à zéro
  nocturne. Si rien n'est saisi, ce n'est pas un bug.
- BOISSONS (livraison et retrait, 2,50 € chacune, sans option) : Coca-Cola, Coca-Cola Zero, Fanta,
  Sprite, Ice Tea, eau plate, eau pétillante. Pas d'alcool en ligne.
- NON LIVRABLES : La Potence Dufour, tartare de bœuf, carpaccio de Holstein, option flambadou,
  glaces et sorbets, dame blanche, dame noire, colonels, demi-ananas flambé, cafés et boissons
  chaudes, digestifs / whisky / rhum, Lunch, Menu Prestige, formule de groupe. Ces plats restent sur la
  carte générale, seulement exclus de la sélection livraison. La terrine façon Yves Stal est
  SUPPRIMÉE du système de commande (elle reste sur les photos de la carte).
- Plats « à trancher par le patron » côté livraison [EN ATTENTE] : croquettes, moëlle du chef, crème
  brûlée, fondant au chocolat, veggies, salade de scampis croustillants, feuilleté de saumon, poisson
  du jour, salade de chèvre chaud. Ne rien retirer sans décision.
- Le paiement en espèces à la livraison existe actuellement à côté de Stripe [EN ATTENTE : le patron
  décidera s'il le conserve]. Tant qu'il existe, il doit fonctionner correctement, avec « encaissé » et
  « à encaisser » bien distincts, et un geste simple pour confirmer l'encaissement.

### Valeurs de référence de la carte (à comparer avec les 6 photos de la carte du dépôt)
- Entrées : salade de scampis croustillants 14 · salade burratina pesto balsamique 16 · carpaccio de
  Holstein 22 · moëlle du chef 14 · scampis à l'ail ou à la diable 15 · saumon fumé 16 · tomates
  crevettes 23 · assiette anglaise 14 · croquettes fromage 2 pc 14 / 3 pc 19 · croquettes crevette
  2 pc 20 / 3 pc 27.
- Viandes : pavé de bœuf argentin 22,50 · filet pur 34 · filet pur Rossini 39 · côte à l'os ±450 g 31 ·
  Burger Dufour 21 · Chti Burger 25.
- Grillades : côtes piano 19 · côtes piano XXL 28 · filet de volaille épicée 18 · filet de volaille au
  maroilles 20 · scampis grillés épicés 18.
- Poissons : trilogie de poisson 22 · cabillaud 27 · feuilleté de saumon purée béarnaise 25 · nouilles
  thaï aux scampis 24 · poisson du jour 20.
- Salades : briques de chèvre chaud 20 · César 21 · Dufour 26 · de la Mer 24. Veggies : inspiration du
  chef chaud 21 · froid 19.
- Planches : La Dufour 18 (2 p) / 32 (4 p) · du Boucher 18 / 32 · Big Planche 44 (6 p) · Prestige
  20 / 36.
- Desserts livrables éventuels : dessert signature 12 · crème brûlée 9 · salade de fruits 10 · fondant
  chocolat 9 · mousse trompe-l'œil 10 · tiramisu Oreo 8,50.

## 5. Paiement
- Stripe, avec BANCONTACT obligatoire (Belgique), cartes, Apple Pay / Google Pay, page de paiement
  hébergée.
- Une commande n'apparaît en cuisine QU'APRÈS confirmation par notification serveur signée de Stripe,
  JAMAIS sur le simple retour du navigateur ; aucun doublon si la notification arrive deux fois.
- Après paiement réussi, le client est renvoyé automatiquement et directement sur sa page de suivi. Si
  il revient avant la confirmation officielle, il voit un état d'attente rassurant (« Paiement reçu,
  nous finalisons votre commande ») qui se met à jour seul, jamais « commande introuvable ».
- Une commande payée en mode test Stripe est automatiquement marquée « test » (indicateur de mode
  réel / mode test fourni par Stripe).
- Rapprochement automatique Stripe ↔ commandes, avec alerte visible dans l'administration si un
  paiement n'a pas de commande, ou l'inverse.
- Compte Stripe réel [EN ATTENTE : création, vérification et passage en mode réel par le patron].

## 6. Après la commande — côté client
- Page de confirmation : message court, chaleureux, qui remercie et dit qu'un e-mail de confirmation a
  été envoyé à l'adresse du client ; récapitulatif (plats, options, adresse ou retrait, montant,
  heure estimée) ; numéro de commande (format GDF-AAAAMMJJ-NNNN) ; bouton clair « Retour à l'accueil ».
- Suivi de commande en temps réel, SANS rechargement : Commande confirmée → En préparation → Prête →
  En livraison → Livrée. Il doit avancer dès que la cuisine ou le livreur change le statut. Ce lien a
  déjà régressé plusieurs fois.
- E-mail de confirmation envoyé à l'adresse du client, depuis chriswillen@me.com, avec une note finale
  sympathique.
- E-mail de retour privé envoyé 2 h après la livraison ; le bouton « laisser un avis Google » est
  proposé à TOUS les clients, jamais conditionné à une bonne note. Pas d'e-mail de retour pour les
  commandes de test.

## 7. Écran cuisine (tablette staff)
- Les commandes payées arrivent en temps réel, sans rechargement, avec un SON d'alerte.
- Le son se RÉPÈTE jusqu'à ce qu'on touche l'écran pour prendre en compte ; volume au maximum
  raisonnable sans distorsion ; pastille visuelle clignotante en complément.
- Bouton « Activer le son » au démarrage (les navigateurs l'exigent) ; bandeau rouge tant qu'il n'est pas
  activé ; le son reste actif ensuite pendant tout le service, y compris après coupure réseau,
  rechargement ou mise en veille.
- Écran qui ne s'éteint JAMAIS tant que la page est ouverte.
- Indicateur de connexion ; reconnexion automatique avec récupération de ce qui a été manqué.
- Statuts en un geste (accepter, en préparation, prête…), grands boutons utilisables avec des gants.
  Signaler un retard en un clic. Marquer un plat en rupture. Corriger un statut. Saisir les plats du
  jour en un écran très simple.
- ONGLET MESSAGES grand et lisible (boutons de messages rapides d'au moins 56 px de haut), pastille de
  messages non lus, grande croix de fermeture qui répond toujours.
- Un message reçu du livreur déclenche un son (distinct de celui des commandes) ET une notification
  visuelle, côté cuisine.
- Les commandes de test portent un bandeau « TEST » très visible.
- Aucun contenu saisi par un client ne s'exécute à l'écran (neutralisation).

## 8. Interface livreur
- Adresse séparée, protégée, accès par code à 4 chiffres propre à chaque livreur, session qui reste
  ouverte longtemps ; compte par livreur ; création et désactivation depuis l'administration.
- Application installable sur l'écran d'accueil du téléphone (icône propre, plein écran), SEULEMENT pour
  cet espace.
- Liste des commandes en temps réel ; détail : adresse lisible, bouton d'itinéraire vers l'application
  de navigation, nom et téléphone du client avec bouton d'appel, contenu de la commande, montant à
  encaisser si espèces, remarque du client concernant la livraison.
- Statuts en gros boutons : « J'ai récupéré la commande », « En route », « Livrée ». Bouton
  « Problème » (client absent, adresse introuvable…) qui remonte à la cuisine et à l'administration.
  Indication de l'heure d'arrivée par boutons rapides (5, 10, 15, 20 min), mise à jour en temps réel
  chez le client.
- NOTIFICATIONS : une alerte sonore (et une vibration) dès qu'une commande est « Prête », et à chaque
  message de la cuisine, MÊME application fermée ou en arrière-plan (notifications push). Permission
  demandée simplement ; l'interface reste utilisable sans.
- Messages rapides prédéfinis comme moyen principal de communication (le livreur ne doit jamais avoir
  à écrire en conduisant) ; champ libre pour un arrêt. Grande croix de fermeture de l'onglet messages
  qui répond TOUJOURS, plus fermeture en touchant à côté, en glissant, ou avec le bouton retour.
- Historique des livraisons du jour. Écran qui reste allumé.
- Il ne voit que ses propres commandes.

## 9. Messagerie cuisine ↔ livreur
- Envoi INSTANTANÉ dans les deux sens, notification visuelle et sonore chez le destinataire.
- Messages rangés par jour. Suppression d'un message précis ; « Effacer toute la conversation » côté
  cuisine et administration (pas côté livreur, qui supprime seulement ses propres messages).
- Nettoyage automatique chaque jour : suppression DÉFINITIVE des messages de la journée de service
  écoulée, la journée se terminant à 5 h 00 (Bruxelles). Tâche planifiée + filet de sécurité au premier
  accès du jour. Dernier nettoyage visible dans l'administration. L'historique des statuts, les retards
  et les signalements « Problème » ne sont PAS supprimés.

## 10. Confirmations anti-erreur
- Fenêtre de confirmation précise (numéro de commande, nom du client, action) avec deux gros boutons
  (« Non, annuler » plus accessible) pour : « Livrée » (et encaissement en espèces), « Accepter »,
  « Refuser », « Prête », « Signaler un retard », rupture d'un plat, annulation / remboursement,
  suppression de commandes de test ou de messages, activation du mode test, fermeture temporaire,
  désactivation d'un livreur, changement de prix ou de réglage important.
- Pour les étapes fréquentes sans gravité : pas de fenêtre, un bandeau « Annuler » pendant ~10 secondes.
- Protection contre le double appui, y compris côté serveur (une action ne s'exécute qu'une fois).
  Le serveur refuse les enchaînements de statuts illogiques.
- « Corriger le statut » depuis la cuisine et l'administration, sans e-mail ni notification au client.
  Historique de qui a fait quoi, visible en administration.

## 11. Administration
- Rubriques : Tableau de bord · Commandes · Menu · Carte livraison · Plats du jour · Cuissons · Rues ·
  Avis Google · Retours · E-mails · Contenu · Mode test · Livreurs · Paramètres. Chaque rubrique doit
  s'afficher et ENREGISTRER réellement ses modifications (modifier, enregistrer, recharger, vérifier
  sur le site public).
- TABLEAU DE BORD en première page : chiffres du jour (CA, nombre de commandes, panier moyen, répartition
  livraison / retrait), mois en cours avec graphique et comparaison au mois précédent, sélecteur de
  période (aujourd'hui, hier, cette semaine, ce mois-ci, mois dernier, personnalisé), liste des commandes
  avec filtres et recherche, articles populaires, heures de pointe, export CSV.
- UNE SEULE règle de calcul pour tout l'écran. EXCLUS de tous les chiffres : commandes du mode test,
  annulées, impayées, paiements Stripe en mode test. Comptées : vraies commandes payées en ligne
  (confirmées par Stripe) et commandes en espèces, avec « encaissé » et « à encaisser » séparés.
  Montants TVA comprise, indiqué à l'écran. Dates à l'heure de Bruxelles. Les sommes sont cohérentes
  entre toutes les zones. L'en-tête ne recouvre aucune case.
- Une vraie commande payée ne peut JAMAIS être supprimée (annulation ou remboursement seulement). Seules
  les commandes de test ou non payées peuvent l'être, avec confirmation et archive de ce qui est
  supprimé.
- MODE TEST PRIVÉ : bouton qui dure UNE HEURE puis s'éteint seul ; ne s'applique QU'À l'administrateur,
  sur son appareil ; bandeau visible avec temps restant ; ignore horaires et fermeture ; aucun débit
  réel ; la commande arrive en cuisine comme une vraie, avec le son et un bandeau « TEST » ; exclue des
  chiffres ; pas d'e-mail de retour ; protégé côté serveur.
- Accès réservé aux rôles ; le personnel ne voit ni chiffres ni prix modifiables.

## 12. Connexions et accès
- Trois espaces internes séparés (administration, cuisine, livreur), chacun protégé côté serveur : être
  connecté à l'un ne donne aucun accès aux autres.
- Codes à 4 chiffres faciles à taper, compensés par blocage temporaire après essais ratés, délai
  croissant et journalisation. Des codes simples de test (type 0000) sont utilisés pour les essais
  [EN ATTENTE : à remplacer par de vrais codes, un par personne, avant l'ouverture publique].
- La connexion doit réussir à tous les coups, sur téléphone, tablette et ordinateur, y compris depuis
  l'application installée.

## 13. Outils internes : ergonomie et couleurs
- Palette fonctionnelle identique dans les trois outils : une couleur par signification (nouvelle ou
  urgente, en préparation, prête, problème, information), contrastes confortables. Pas de bordeaux
  illisible sur noir. Simplicité maximale, grandes zones de toucher, rien d'accessoire en plein service.

## 14. Sécurité (permanent)
- Aucune page interne accessible sans connexion ; chaque rôle ne voit que ce qui le concerne ; chaque
  point d'accès vérifie l'authentification et le rôle côté serveur.
- Prix et règles recalculés côté serveur ; requêtes modifiées refusées.
- Confirmation de paiement par notification signée uniquement ; liens de suivi imprévisibles ;
  impossible de voir la commande d'un autre client.
- Toutes les saisies libres neutralisées (remarque, contact, messages).
- Aucune clé ni mot de passe dans le code ou visible du navigateur, ni dans l'historique du dépôt.
- Limitation de débit, en-têtes de sécurité, HTTPS, cookies protégés, dépendances à jour, aucune trace
  technique visible à l'écran, erreurs journalisées côté serveur, sauvegarde de la base vérifiée.

## 15. Qualité et mémoire
- Aucune fonctionnalité de ce cahier ne doit disparaître quand on en ajoute d'autres. Tests automatiques
  bloquants, `CHECKLIST.md` après chaque déploiement, `FONCTIONNALITES.md` à jour, `CLAUDE.md` en place.
- Affichage irréprochable sur téléphone, tablette et ordinateur, en mode clair et en mode sombre.

## 16. En attente — à faire par le patron
1. Pointer le nom de domaine legrilldufour.be vers le site.
2. Créer et faire valider le compte Stripe (BE 0726.458.932, IBAN professionnel, pièce d'identité du
   gérant), puis passer en mode réel.
3. Configurer l'envoi d'e-mails depuis chriswillen@me.com (SPF, DKIM, DMARC).
4. Remplacer les codes de connexion de test.
5. Fournir : photos d'ambiance et de viande pour l'accueil, liens Facebook et Instagram officiels,
   adresse de la fiche Google Business.
6. Trancher : espèces conservées ou non ; plats livrables à décider ; alcool ou Lunch en livraison ;
   menus complets livrables ; plats du jour à tous les services ou midi seulement ; nombre de
   tablettes ; imprimante de tickets.
7. Tests réels avec de vrais appareils : sons en cuisine, notifications sur iPhone et Android.
