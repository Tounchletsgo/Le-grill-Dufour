# Checklist de Deploiement — Le Grill Dufour

## Avant deploiement

### Variables d'environnement Vercel
Verifier que toutes les variables sont configurees dans Vercel > Settings > Environment Variables :

- [ ] `NEXT_PUBLIC_SUPABASE_URL` — `https://<project-ref>.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — cle publique Supabase
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — cle secrete Supabase (serveur uniquement)
- [ ] `STRIPE_SECRET_KEY` — cle secrete Stripe
- [ ] `STRIPE_WEBHOOK_SECRET` — secret du webhook Stripe
- [ ] `NEXT_PUBLIC_SITE_URL` — `https://le-grill-dufour.vercel.app` (ou domaine personnalise)
- [ ] `ADMIN_PIN` — code PIN pour l'acces staff
- [ ] `CRON_SECRET` — secret pour les taches cron
- [ ] `RESEND_API_KEY` — cle API Resend (emails)
- [ ] `TELEGRAM_BOT_TOKEN` — token du bot Telegram
- [ ] `TELEGRAM_CHAT_ID` — ID du chat Telegram

### Migrations Supabase
Avant le premier deploiement sur un nouveau projet Supabase, executer dans l'ordre :
1. Les migrations de base (tables, RLS, etc.)
2. `004_stripe_payment.sql` — ajoute les colonnes Stripe et autorise `payment_method = 'online'`
3. `023_test_orders.sql` — ajoute la colonne `is_test` a la table `orders` (necessaire pour le tableau de bord et le mode test)
4. `026_delivery_drivers.sql` — cree les tables `drivers` et `driver_messages`, ajoute les colonnes livreur a `orders`
5. `027_push_subscriptions.sql` — cree la table `driver_push_subscriptions` pour les notifications push

### Variables d'environnement push notifications
- [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — cle publique VAPID pour Web Push
- [ ] `VAPID_PRIVATE_KEY` — cle privee VAPID pour Web Push

### Stripe
- [ ] Webhook configure vers `https://<domaine>/api/webhooks/stripe`
- [ ] Evenement `checkout.session.completed` active dans le dashboard Stripe

## Apres deploiement

### Verification rapide
1. Aller sur `https://<domaine>/api/health` — verifier que le statut est `"ok"` (details env visibles uniquement avec auth admin)
2. Tester la page d'accueil — les avis Google doivent apparaitre
3. Tester la page `/commander` — le menu doit charger depuis Supabase (pas de `local-` dans la console)
4. Tester un ajout au panier + checkout (en dehors des heures fermees)
5. Verifier le back-office `/admin`
6. Verifier la tablette cuisine `/staff`

### Verification tableau de bord admin
7. Aller sur `/admin` > onglet "Tableau de bord" — les stats doivent s'afficher
8. Tester les differentes periodes (aujourd'hui, hier, semaine, mois)
9. Tester l'export CSV — le fichier doit s'ouvrir correctement dans Excel
10. Verifier les graphiques (CA journalier, articles populaires, heures de pointe)

### Verification mode test
11. Aller sur `/admin` > onglet "Mode test"
12. Activer le mode test — verifier le compte a rebours (1h)
13. Passer une commande test — doit contourner les horaires et Stripe
14. Verifier sur `/staff` que la commande porte le badge TEST et le bandeau MODE TEST apparait
15. Verifier dans le tableau de bord que la commande test n'apparait PAS dans les stats
16. Desactiver le mode test — verifier que les commandes normales reprennent le flux Stripe

### Verification bilingue FR/NL
7. Aller sur `https://<domaine>/nl` — la version NL doit s'afficher
8. Verifier le selecteur FR | NL dans la navbar et le footer
9. Tester la navigation NL : `/nl/de-kaart`, `/nl/bestellen`, `/nl/reserveren`, `/nl/cadeaubonnen`, `/nl/contact`
10. Passer une commande test en NL — verifier que :
    - L'email de confirmation arrive en neerlandais
    - Le checkout Stripe est en neerlandais
    - Le kitchen board affiche le badge "NL" sur la commande
    - La note client est marquee "(NL)" sur le kitchen board
11. Verifier le sitemap : `https://<domaine>/sitemap.xml` — les URLs NL doivent apparaitre
12. Verifier les hreflang tags dans le code source de chaque page
13. Changer de langue via le selecteur — verifier que le panier est preserve
14. En navigation privee, verifier la detection automatique (navigateur en NL → redirection vers `/nl`)

### Verification SEO et securite
15. Verifier `https://<domaine>/robots.txt` — /admin, /staff, /api doivent etre bloques
16. Verifier `https://<domaine>/sitemap.xml` — les URLs FR et NL doivent apparaitre
17. Verifier dans le code source que les hreflang tags sont presents
18. Verifier que `/staff` et `/commander/checkout` ont `noindex` dans le code source
19. Tester la page `/api/health` sans authentification — seul le statut doit s'afficher (pas de details env)

### Verification paiement et confirmation
20. Passer une commande test avec paiement en ligne — apres Stripe, la page `/commande/[id]?payment=success` doit afficher une banniere verte "Paiement confirme"
21. Verifier que le recap (articles, options, adresse/retrait, total) s'affiche correctement
22. Verifier que l'email de confirmation arrive (Resend)
23. Verifier que la notification Telegram est envoyee
24. Verifier que la commande apparait immediatement dans `/admin` et `/staff`
25. Verifier le bouton "Retour a l'accueil" sur la page de confirmation
26. Tester en mode livraison ET en mode emporter
27. Recharger la page de confirmation — le recap doit persister (pas de page blanche)

### Verification suivi de commande en temps reel
28. Apres une commande payee, verifier que le message de remerciement chaleureux s'affiche avec le prenom du client
29. Verifier que la mention d'envoi de l'email apparait avec l'adresse email du client
30. Depuis `/staff`, accepter la commande — verifier que la page de suivi cote client passe a "En preparation" sans recharger
31. Depuis `/staff`, marquer la commande comme "Prete" — verifier le changement sur la page de suivi
32. Depuis `/staff`, marquer la commande comme "En livraison" puis "Livree" — verifier chaque changement cote client
33. Verifier qu'une commande en attente depuis plus de 10 minutes affiche un indicateur orange sur `/staff`

### Verification ecran staff
34. Ouvrir `/staff` sur tablette — verifier que l'ecran ne s'eteint pas (Wake Lock)
35. Passer une commande — verifier que l'alarme sonore est suffisamment forte
36. Verifier le bouton "Activer le son" fonctionne toujours

### Verification interface livreur
37. Aller sur `/livreur` — la page de login doit s'afficher
38. Creer un livreur via `/admin` > gestion des livreurs (ajouter nom + telephone + PIN unique)
39. Se connecter sur `/livreur` avec le PIN du livreur — la liste des commandes doit s'afficher
40. Verifier le rate limiting : entrer 5 mauvais PIN — verifier le blocage 15 min
41. Assigner une commande "Prete" a un livreur depuis `/staff` — verifier qu'elle apparait sur `/livreur`
42. Cliquer sur une commande — verifier le detail (adresse, telephone, articles, total, notes)
43. Tester le bouton "Naviguer" — doit ouvrir Google Maps avec l'adresse
44. Tester le bouton "Appeler" — doit lancer un appel au client
45. Tester l'avancement : "J'ai recupere" → "En route" → "Livree" — verifier les changements sur `/staff`
46. Tester "Signaler un probleme" — verifier que le probleme apparait cote staff
47. Tester la messagerie : envoyer un message rapide depuis `/livreur` — verifier reception sur `/staff`
48. Tester la messagerie : envoyer un message depuis `/staff` — verifier reception sur `/livreur`
49. Tester un message texte libre dans les deux sens
50. Verifier la notification sonore cote staff quand un message livreur arrive
51. Aller sur l'onglet "Historique" — verifier les stats du jour (total livraisons + montant)
52. Verifier que l'ecran ne s'eteint pas (Wake Lock)
53. Verifier que `/livreur` est bloque dans `robots.txt`
54. Verifier que `/livreur` a `noindex` dans le code source

### PWA et notifications push livreur
55. Sur mobile, aller sur `/livreur` — verifier la proposition "Ajouter a l'ecran d'accueil"
56. Installer la PWA — verifier qu'elle s'ouvre en plein ecran (standalone)
57. Se connecter — verifier la demande de permission pour les notifications
58. Depuis `/staff`, passer une commande en statut "Prete" — verifier la notification push sur le mobile du livreur
59. Depuis `/staff`, envoyer un message a un livreur — verifier la notification push
60. Cliquer sur la notification — verifier qu'elle ouvre `/livreur`
61. Si notifications refusees, verifier la banniere "Activer les notifications"

### ETA livreur
62. Prendre une commande en livraison — verifier le bouton "Indiquer un temps d'arrivee"
63. Cliquer sur un bouton ETA (ex: 10 min) — verifier l'affichage heure + minutes restantes
64. Verifier le bouton "Modifier" pour changer l'ETA en cours de route
65. Verifier le bouton "Retirer" pour effacer l'ETA
66. Sur la page de suivi client (`/commande/[id]`) — verifier que l'ETA s'affiche ("Vers 19h25")

### Verification securite (audit octobre 2026)
67. Verifier que le mode test ne fuite PAS vers les vrais clients (commande sans header `x-test-device-id` = paiement obligatoire)
68. Verifier que la validation du code postal s'applique aux adresses autocomplete ET manuelles
69. Verifier que le webhook Stripe et le verify-payment ne dupliquent PAS les notifications (garde `.eq("status", "pending_payment")` sur les deux updates)
70. Verifier que l'endpoint public `/api/commande/[id]` ne renvoie PAS `customer_email` ni `notes`
71. Verifier que le header `x-driver-id` est valide au format UUID avant traitement
72. Verifier que la recherche admin sanitise bien les caracteres speciaux
73. Verifier que les maps de rate limiting ont un nettoyage periodique (auth.ts, driver-auth.ts, streets/search)
74. Verifier que les logs Stripe ne contiennent PAS de secret partiel
75. Verifier que les erreurs Stripe ne sont PAS renvoyees au client en detail

### Verification sons et notifications (4 sons distincts)
76. Sur `/staff`, activer le son — passer une commande : verifier l'ALARME CUISINE (bip grave repete avec vibration)
77. Depuis `/livreur`, envoyer un message a la cuisine : verifier le CHIME MESSAGE (son aigu distinct de l'alarme)
78. Sur `/livreur`, activer le son — passer une commande en "Prete" : verifier l'ALERTE LIVREUR (bip + vibration longue)
79. Depuis `/staff`, envoyer un message au livreur : verifier la NOTIFICATION PUSH (son systeme)
80. Verifier que l'alarme cuisine SE REPETE toutes les 4s jusqu'au toucher de l'ecran
81. Verifier que le badge messages CLIGNOTE quand des messages non lus existent
82. Verifier la reconnexion : couper le wifi 30s, reconnecter — les commandes manquees doivent apparaitre
83. Verifier le reveil apres mise en veille de la tablette — le son doit toujours fonctionner
84. Verifier la banniere rouge si le son n'est pas active
85. Verifier que le bouton fermer messages fonctionne sur TOUS les ecrans (cuisine et livreur)

### Verification paiement Stripe post-deploy
86. Commander avec carte test `4242 4242 4242 4242` — la page doit rediriger vers `/commande/[id]?payment=success`
87. Verifier que la commande passe de `pending_payment` a `confirmed` sans page intermediaire
88. Verifier que la notification cuisine arrive UNE SEULE FOIS (pas de doublon webhook + verify-payment)
89. Verifier dans les logs Stripe que le webhook recoit bien `checkout.session.completed`
90. Simuler un retour client rapide (avant webhook) : la verification cote client doit confirmer le paiement

### Verification confirmations et messages
91. Sur `/staff`, accepter une commande puis la passer en « Prêt » — verifier que le dialog de confirmation apparait
92. Confirmer « Prêt » — verifier que le statut change apres confirmation
93. Sur `/livreur`, marquer une commande comme « Livrée » — verifier le dialog de confirmation
94. Annuler une commande sur `/staff` — verifier le bandeau undo (10 secondes pour annuler)
95. Sur `/staff`, ouvrir les messages d'un livreur — verifier les separateurs de jour (« Aujourd'hui », « Hier »)
96. Cliquer sur un message — verifier le dialog « Supprimer ce message ? »
97. Confirmer la suppression — verifier que le message disparait en temps reel
98. Cliquer sur l'icone corbeille en haut — verifier le dialog « Effacer toute la conversation ? »
99. Confirmer — verifier que tous les messages sont supprimes
100. Verifier que le cron `/api/cron/cleanup-messages` supprime les messages avant 5h00 Bruxelles

### Verification coherence tableau de bord
101. Verifier que le nombre de « Commandes payées » correspond au total revenue / panier moyen
102. Verifier que les articles populaires ne comptent que des commandes payées
103. Verifier que les heures de pointe ne comptent que des commandes payees
104. Verifier que les commandes test n'apparaissent dans aucune stat
105. Activer le mode test, passer une commande test — verifier qu'elle n'influe pas les stats

### Si les commandes sont bloquees
- Verifier `/api/health` pour diagnostiquer le probleme de connexion Supabase
- Verifier les logs Vercel pour les erreurs `[menu]`
- Si le panier contient des articles obsoletes, les clients doivent vider leur panier et recharger

## Changement de projet Vercel

Si le projet Vercel est recree :
1. Reconfigurer TOUTES les variables d'environnement
2. Mettre a jour l'URL du webhook Stripe
3. Verifier que `NEXT_PUBLIC_SITE_URL` pointe vers le bon domaine
4. Relancer un deploiement
5. Tester avec `/api/health`
