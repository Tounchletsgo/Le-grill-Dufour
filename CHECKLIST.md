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

### Stripe
- [ ] Webhook configure vers `https://<domaine>/api/webhooks/stripe`
- [ ] Evenement `checkout.session.completed` active dans le dashboard Stripe

## Apres deploiement

### Verification rapide
1. Aller sur `https://<domaine>/api/health` — verifier que tout est `"ok"`
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
