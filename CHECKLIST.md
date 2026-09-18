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
