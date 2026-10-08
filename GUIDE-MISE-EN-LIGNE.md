# Guide de mise en ligne — Le Grill Dufour

**Dernière mise à jour** : 8 octobre 2026

---

## 1. Prérequis patron (section 16 du cahier des charges)

Ces étapes doivent être réalisées par le patron **avant** la mise en production :

### 1.1 Nom de domaine
- [ ] Pointer `legrilldufour.be` vers Vercel (CNAME ou A record)
- [ ] Configurer le domaine dans Vercel > Settings > Domains
- [ ] Mettre à jour `NEXT_PUBLIC_SITE_URL` avec `https://legrilldufour.be`

### 1.2 Compte Stripe réel
- [ ] Créer le compte Stripe Business (BE 0726.458.932, IBAN pro, identité du gérant)
- [ ] Attendre la validation Stripe
- [ ] Récupérer les clés **live** : `sk_live_...` et `pk_live_...`
- [ ] Configurer le webhook live vers `https://legrilldufour.be/api/webhooks/stripe`
- [ ] Activer l'événement `checkout.session.completed` dans le dashboard Stripe
- [ ] Mettre à jour les variables Vercel :
  - `STRIPE_SECRET_KEY` → clé live
  - `STRIPE_WEBHOOK_SECRET` → secret du webhook live
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → clé publique live

### 1.3 E-mails
- [ ] Configurer SPF, DKIM et DMARC pour `chriswillen@me.com`
- [ ] Vérifier l'adresse dans Resend (ou configurer un domaine d'envoi)
- [ ] Tester l'envoi d'un e-mail réel

### 1.4 Codes de connexion
- [ ] Changer `ADMIN_PIN` dans Vercel (ne jamais utiliser le PIN de test en production)
- [ ] Changer les PINs livreurs dans l'admin (`/admin` > Livreurs)
- [ ] Changer le mot de passe Supabase Auth de l'administrateur

### 1.5 Contenu
- [ ] Fournir les photos d'ambiance et de viande pour l'accueil
- [ ] Fournir les liens Facebook et Instagram officiels
- [ ] Fournir l'adresse de la fiche Google Business
- [ ] Remplacer `poisson-restaurant.jpg` si souhaité (le cahier exclut le poisson de la galerie viande)

### 1.6 Décisions métier
- [ ] Espèces : conservées ou supprimées ?
- [ ] Plats livrables : liste définitive
- [ ] Alcool / Lunch en livraison ?
- [ ] Menus complets livrables ?
- [ ] Plats du jour : tous les services ou midi seulement ?
- [ ] Nombre de tablettes cuisine
- [ ] Imprimante de tickets : oui/non ?

---

## 2. Basculement en production

### 2.1 Variables d'environnement Vercel

Toutes ces variables doivent être configurées dans Vercel > Settings > Environment Variables :

| Variable | Valeur production |
|----------|-------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé secrète Supabase |
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (webhook live) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
| `NEXT_PUBLIC_SITE_URL` | `https://legrilldufour.be` |
| `ADMIN_PIN` | PIN production |
| `CRON_SECRET` | Secret pour les tâches cron |
| `RESEND_API_KEY` | Clé API Resend |
| `TELEGRAM_BOT_TOKEN` | Token du bot Telegram |
| `TELEGRAM_CHAT_ID` | ID du chat Telegram |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Clé publique VAPID |
| `VAPID_PRIVATE_KEY` | Clé privée VAPID |

### 2.2 Cron jobs Vercel

Vérifier dans `vercel.json` que les crons sont actifs :

| Cron | Horaire | Fonction |
|------|---------|----------|
| `/api/cron/cleanup-messages` | `0 3 * * *` UTC | Supprime les messages avant 5h Bruxelles |
| `/api/cron/feedback` | `0 * * * *` | Envoie les e-mails de feedback |
| `/api/cron/reset-stock` | `0 4 * * *` UTC | Remet les stocks à jour |
| `/api/cron/cleanup-orders` | `0 2 * * *` UTC | Nettoie les commandes abandonnées |

### 2.3 Vérification post-basculement

Dérouler la checklist complète dans `CHECKLIST.md`.

Points critiques à vérifier en premier :
1. `/api/health` retourne `"ok"`
2. La page d'accueil charge correctement
3. Le menu charge depuis Supabase (pas de `local-` dans les IDs)
4. Passer une commande test avec carte `4242 4242 4242 4242`
5. Vérifier que la notification arrive en cuisine
6. Vérifier que l'e-mail de confirmation arrive
7. Vérifier les notifications push livreur

---

## 3. Procédure de rollback

Si un problème survient après la mise en ligne :

### 3.1 Rollback Vercel
1. Aller sur Vercel > Deployments
2. Trouver le dernier déploiement fonctionnel
3. Cliquer sur "..." > "Promote to Production"
4. Le site revient à la version précédente en 30 secondes

### 3.2 Rollback base de données
- Les migrations Supabase sont **additives** (ajout de colonnes/tables). Un rollback Vercel ne nécessite pas de rollback de la base.
- En cas de problème avec les données : restaurer depuis un backup Supabase (disponible dans le dashboard Supabase > Database > Backups).

### 3.3 Rollback Stripe
- Si les clés live posent problème, remettre les clés test dans Vercel et redéployer.
- Les commandes test n'affectent jamais les vrais paiements.

---

## 4. Monitoring post-lancement

### 4.1 Vérifications quotidiennes (première semaine)
- [ ] Consulter le tableau de bord admin : vérifier les alertes Stripe (rapprochement)
- [ ] Vérifier les logs Vercel pour les erreurs 500
- [ ] Vérifier que les crons tournent (logs Vercel > Functions)
- [ ] Vérifier que les e-mails de feedback partent (Resend dashboard)

### 4.2 Points de vigilance
- **Commandes bloquées en `pending_payment`** → Le rapprochement Stripe les signale dans le tableau de bord admin
- **Webhook Stripe en erreur** → Vérifier le dashboard Stripe > Webhooks > Events
- **E-mails non reçus** → Vérifier le dashboard Resend
- **Notifications push échouées** → Vérifier les logs Vercel pour les erreurs VAPID

### 4.3 Contact en cas d'urgence
- Supabase : dashboard.supabase.com (accès au support selon le plan)
- Stripe : dashboard.stripe.com/support
- Vercel : vercel.com/help
- Resend : resend.com/support

---

## 5. Architecture de sécurité

| Couche | Protection |
|--------|------------|
| Authentification admin | PIN + rate limiting (5 tentatives, blocage 15 min) |
| Authentification livreur | PIN individuel + timing-safe + rate limiting |
| Authentification API | Bearer token Supabase + vérification des rôles |
| Paiement | Webhook Stripe signé + recalcul prix serveur |
| XSS | Sanitization des champs libres (notes, messages) |
| Headers sécurité | CSP, HSTS, X-Frame-Options, X-Content-Type-Options |
| SEO | robots.txt bloque /admin, /staff, /livreur, /api |
| Données | Commandes payées non supprimables (obligation comptable) |
| Test mode | Isolé par appareil (cookie + device ID) |
