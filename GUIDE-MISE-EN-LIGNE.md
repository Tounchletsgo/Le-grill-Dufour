# Guide de mise en ligne — Le Grill Dufour

**Dernière mise à jour** : 28 octobre 2026
**Statut** : EN COURS — Audit sécurité complet terminé (PR #90, #91) — Interrupteur « Bientôt disponible » en place

---

## Résumé rapide

| Catégorie | Bloquant | À faire par | Statut |
|---|---|---|---|
| A. Nom de domaine | OUI | Patron + Claude | EN ATTENTE |
| B. Stripe (paiement réel) | OUI | Patron + Claude | EN ATTENTE |
| C. E-mail (Resend) | OUI | Patron + Claude | EN ATTENTE |
| D. Codes de connexion | OUI | Patron | EN ATTENTE |
| E. Variables d'environnement | OUI | Patron | EN ATTENTE |
| F. Base de données | Non | Patron (vérifier) | À VÉRIFIER |
| G. Tâches planifiées (cron) | Non | Claude (vérifier) | OK |
| H. SEO et référencement | Non | Claude + Patron | PARTIEL |
| I. Mentions légales | Non | Patron (vérifier) | À VÉRIFIER |
| J. Sécurité | Non | Claude (vérifier) | OK |
| K. Surveillance (monitoring) | Non | Claude | PARTIEL |
| L. Contenu et décisions métier | Non | Patron | EN ATTENTE |
| M. Matériel restaurant | Non | Patron | EN ATTENTE |

**7 points bloquants** (A, B, C, D, E, et partiellement F et H).
**6 points pour Claude** (code, tests, documentation).
**10+ points pour le patron** (comptes, DNS, clés, contenu, matériel).

---

## A. NOM DE DOMAINE

### État actuel
- **Domaine prévu** : `legrilldufour.be` (indiqué dans le cahier des charges, section 1).
- **État DNS** : le domaine semble résoudre (curl reçoit une réponse 403 de Vercel), ce qui signifie qu'il est probablement déjà acheté et que le DNS pointe quelque part, mais **Vercel n'accepte pas encore la connexion** (le domaine n'est pas ajouté au projet Vercel).
- **Site actuel** : le projet est déployé sur Vercel mais l'URL `le-grill-dufour.vercel.app` retourne aussi 403 — le site fonctionne probablement sous une autre URL Vercel ou a une restriction d'accès.
- **`www.legrilldufour.be`** : même réponse 403.

### Ce qu'il faut faire (patron)
- [ ] **Étape 1** : Ajouter `legrilldufour.be` dans Vercel → Settings → Domains
- [ ] **Étape 2** : Ajouter aussi `www.legrilldufour.be` (Vercel gérera la redirection www → sans www)
- [ ] **Étape 3** : Si le DNS n'est pas encore configuré, ajouter chez le registraire :
  - Enregistrement **A** : `@` → `76.76.21.21` (IP Vercel)
  - Enregistrement **CNAME** : `www` → `cname.vercel-dns.com`
- [ ] **Étape 4** : Attendre la propagation DNS (5 min à 48h, généralement < 1h)
- [ ] **Étape 5** : Vercel génère automatiquement le certificat HTTPS (Let's Encrypt)
- [ ] **Étape 6** : Vérifier que `https://legrilldufour.be` affiche le site

### Ce que le code contient (Claude a vérifié)
- [x] `NEXT_PUBLIC_SITE_URL` est utilisé dynamiquement dans toutes les URLs transactionnelles (Stripe, emails, feedback, suivi). **Valeur à mettre : `https://legrilldufour.be`**
- [x] Les URLs SEO sont déjà en dur sur `legrilldufour.be` dans 7 fichiers (layout.tsx, sitemap.ts, robots.txt, pages publiques, restaurantData.js). C'est correct pour la production.
- [x] Les manifestes PWA utilisent des chemins relatifs — aucun changement nécessaire.
- [x] Les emails utilisent `baseUrl` dynamique — aucun changement nécessaire.
- [x] Stripe checkout utilise `baseUrl` pour les URLs de retour — fonctionnera dès que la variable est configurée.

### Ce que Claude corrige (code)
- [ ] Mettre à jour le test unitaire qui utilise encore `le-grill-dufour.vercel.app` comme stub
- [ ] Mettre à jour `CHECKLIST.md` qui référence encore `le-grill-dufour.vercel.app`

---

## B. STRIPE (PAIEMENT)

### État actuel
- **Mode** : le site est en **mode test Stripe**. Les clés en place commencent par `sk_test_` et `pk_test_`.
- **Variables présentes** (noms seulement, jamais les valeurs) :
  - `STRIPE_SECRET_KEY` — clé secrète Stripe (test)
  - `STRIPE_WEBHOOK_SECRET` — secret du webhook Stripe (test)
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — listée dans la CI et le guide, mais **pas utilisée dans le code** car le site utilise la redirection Stripe Checkout hébergée (pas Stripe.js côté client)
- **Séparation test/réel** : le code ne mélange jamais les clés. La distinction vient uniquement de la valeur des variables d'environnement Vercel. Le webhook vérifie la signature Stripe, et les commandes sont marquées `is_test` automatiquement via le champ `livemode` de Stripe.

### Ce qu'il faut faire (patron — dans le dashboard Stripe)
- [ ] **Étape 1** : Compléter le profil Stripe Business
  - Informations de l'entreprise : BE 0726.458.932
  - IBAN professionnel du restaurant
  - Pièce d'identité du gérant
  - Adresse : Rue Des Courtils – Hovenstraat 1b, 7700 Mouscron
- [ ] **Étape 2** : Attendre la validation par Stripe (quelques heures à quelques jours)
- [ ] **Étape 3** : Activer les moyens de paiement
  - Bancontact (obligatoire pour la Belgique)
  - Cartes (Visa, Mastercard)
  - Apple Pay / Google Pay (activés automatiquement avec Stripe Checkout)
- [ ] **Étape 4** : Configurer le nom sur les relevés bancaires (ex: « LE GRILL DUFOUR » ou « GRILL DUFOUR MOUSC »)
- [ ] **Étape 5** : Créer le webhook en mode live
  - URL : `https://legrilldufour.be/api/webhooks/stripe`
  - Événement à activer : `checkout.session.completed`
  - Copier le **Signing secret** (`whsec_...`)
- [ ] **Étape 6** : Récupérer les clés live
  - Clé secrète : `sk_live_...`
  - Clé publique : `pk_live_...` (pas utilisée par le code, mais bonne pratique de la garder)
- [ ] **Étape 7** : Mettre les clés live dans Vercel (section E ci-dessous)

### Ce que le code garantit (Claude a vérifié)
- [x] Aucune clé de test codée en dur dans le code source
- [x] La confirmation de paiement ne vient QUE du webhook signé (`stripe.webhooks.constructEvent`)
- [x] Le fallback `verify-payment` vérifie aussi auprès de Stripe (pas de confirmation sans preuve)
- [x] Le CAS guard empêche les doubles confirmations
- [x] Le mode test admin ne peut pas toucher aux vrais paiements (les commandes test sont marquées `is_test` et exclues des stats)
- [x] Le champ `livemode` de Stripe est vérifié dans le webhook ET le verify-payment
- [x] Stripe Checkout redirige (pas d'intégration côté client) — `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` n'est pas nécessaire dans le code

### Plan de test final (après mise en live)
1. Passer une vraie commande de quelques euros (un article peu cher)
2. Vérifier : la commande arrive en cuisine, l'email part, le suivi fonctionne
3. Rembourser immédiatement depuis l'admin (bouton Rembourser)
4. Vérifier que le remboursement apparaît dans Stripe et dans l'admin
5. Vérifier que la commande n'apparaît PAS comme test dans les stats

---

## C. E-MAIL

### État actuel
- **Service d'envoi** : Resend (API `https://api.resend.com/emails`)
- **Variable** : `RESEND_API_KEY` — **NON CONFIGURÉE** actuellement (l'erreur « RESEND_API_KEY not configured » a été constatée)
- **Adresse d'expédition** : `EMAIL_FROM` = `Le Grill Dufour <chriswillen@me.com>`
- **Adresse de réponse** : `EMAIL_REPLY_TO` = `chriswillen@me.com`
- **Adresse de notification** : `EMAIL_RESTAURANT_NOTIF` = `chriswillen@me.com`
- **Types d'emails envoyés** :
  1. Confirmation de commande (au client, après paiement)
  2. Demande d'avis / feedback (au client, 2h après livraison)
  3. Notification de commande (au restaurant, à chriswillen@me.com)
  4. Alertes monitoring (webhook en échec, paiement orphelin)

### Point technique important — adresse @me.com

**Problème** : `chriswillen@me.com` est une adresse Apple (iCloud). Resend (ou tout service d'envoi tiers) ne peut PAS envoyer des emails « depuis » cette adresse de manière fiable, car :
- Apple contrôle le SPF et le DKIM du domaine `me.com`
- Resend ne peut pas signer les emails pour `@me.com`
- Résultat : les emails risquent d'atterrir en **spam** ou d'être **rejetés** par Gmail, Outlook, etc.

### Solution recommandée

**Option A (recommandée)** : Envoyer depuis une adresse du domaine `legrilldufour.be`
- Adresse d'expédition : `commande@legrilldufour.be` ou `noreply@legrilldufour.be`
- Adresse de réponse (reply-to) : `chriswillen@me.com` (les réponses arrivent bien chez toi)
- Adresse de contact affichée sur le site : `chriswillen@me.com` (rien ne change pour les visiteurs)
- Avantage : Resend peut signer correctement (SPF + DKIM), les emails n'atterrissent pas en spam
- Inconvénient : il faut ajouter des enregistrements DNS pour vérifier le domaine dans Resend

**Option B** : Garder `chriswillen@me.com` comme expéditeur
- Risque élevé de spam/rejet
- Pas d'authentification SPF/DKIM possible
- Non recommandée

**Décision du patron requise avant de continuer.**

### Ce qu'il faut faire (selon l'option choisie)

#### Si option A (domaine legrilldufour.be) :
- [ ] Ajouter le domaine `legrilldufour.be` dans Resend → Domains → Add Domain
- [ ] Ajouter les enregistrements DNS fournis par Resend :
  - 1 enregistrement **MX** (pour recevoir les emails, si souhaité)
  - 2 enregistrements **TXT** (SPF et vérification)
  - 3 enregistrements **CNAME** (DKIM)
  - 1 enregistrement **TXT** pour DMARC (ex: `_dmarc.legrilldufour.be` → `v=DMARC1; p=none; rua=mailto:chriswillen@me.com`)
- [ ] Attendre la vérification par Resend (quelques minutes à 24h)
- [ ] Mettre à jour `EMAIL_FROM` dans Vercel : `Le Grill Dufour <commande@legrilldufour.be>`
- [ ] Garder `EMAIL_REPLY_TO` = `chriswillen@me.com`
- [ ] Tester l'envoi vers Gmail, iCloud, et Outlook

#### Si option B (garder @me.com) :
- [ ] Vérifier l'adresse dans Resend (Resend envoie un email de vérification)
- [ ] Accepter le risque de spam

### Boîte de réception du restaurant
- Les messages de contact du site arrivent à `chriswillen@me.com` (formulaire de contact)
- Les alertes monitoring arrivent à `chriswillen@me.com`
- Les notifications de commande arrivent sur **Telegram** (notification cuisine) ET par email à `chriswillen@me.com`

---

## D. CODES DE CONNEXION

### État actuel
- **Admin** : `ADMIN_PIN` est défini dans Vercel (variable d'environnement). La valeur par défaut dans `.env.example` est `0000`. **Si la production utilise encore `0000`, c'est un risque de sécurité critique.**
- **Livreurs** : PINs stockés dans la table `drivers` en base de données. Créés/modifiés depuis l'admin.
- **Staff cuisine** : utilise le même PIN admin ou un PIN séparé selon la configuration.
- **Rate limiting** : 5 tentatives max, blocage 15 minutes par IP (code vérifié dans `auth.ts`).
- **Comparaison** : timing-safe pour les PINs livreurs (`crypto.timingSafeEqual`).

### Ce qu'il faut faire (patron)
- [ ] **ADMIN_PIN** : Choisir un nouveau PIN (6+ chiffres), le mettre dans Vercel → Settings → Environment Variables. Ne jamais utiliser 0000.
- [ ] **PINs livreurs** : Aller dans `/admin` → Livreurs → Modifier chaque livreur avec un PIN unique.
- [ ] **Mot de passe Supabase Auth** : Si un compte admin utilise email/mot de passe (Supabase Auth), changer le mot de passe.
- [ ] **Vérifier** : se connecter avec l'ancien PIN 0000 — ça ne doit plus marcher.

---

## E. VARIABLES D'ENVIRONNEMENT VERCEL

### Liste complète des variables requises en production

| Variable | Description | Qui la fournit | Bloquant |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase | Déjà en place | Non |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase | Déjà en place | Non |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé secrète Supabase | Déjà en place | Non |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe **live** (`sk_live_...`) | Patron (Stripe) | OUI |
| `STRIPE_WEBHOOK_SECRET` | Secret du webhook Stripe **live** (`whsec_...`) | Patron (Stripe) | OUI |
| `NEXT_PUBLIC_SITE_URL` | `https://legrilldufour.be` | Patron (mettre à jour) | OUI |
| `ADMIN_PIN` | PIN admin production (pas 0000) | Patron | OUI |
| `CRON_SECRET` | Secret pour les tâches cron | Déjà en place (vérifier) | Non |
| `RESEND_API_KEY` | Clé API Resend | Patron (Resend) | OUI |
| `TELEGRAM_BOT_TOKEN` | Token du bot Telegram | Déjà en place (vérifier) | Non |
| `TELEGRAM_CHAT_ID` | ID du chat Telegram | Déjà en place (vérifier) | Non |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Clé publique VAPID (push) | Déjà en place (vérifier) | Non |
| `VAPID_PRIVATE_KEY` | Clé privée VAPID (push) | Déjà en place (vérifier) | Non |
| `EMAIL_FROM` | Adresse d'expédition | Patron (décision C) | OUI |
| `EMAIL_REPLY_TO` | Adresse de réponse | `chriswillen@me.com` | Non |
| `EMAIL_RESTAURANT_NOTIF` | Adresse notifications | `chriswillen@me.com` | Non |
| `NEXT_PUBLIC_BARESTHO_URL` | URL réservation Barestho | Déjà en place | Non |
| `NEXT_PUBLIC_BARESTHO_CADEAUX_URL` | URL chèques cadeaux | Déjà en place | Non |

**Note** : `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` figure dans le guide précédent mais n'est PAS utilisée dans le code. Le site utilise la redirection Stripe Checkout hébergée. On peut l'ajouter par précaution (`pk_live_...`), mais ce n'est pas bloquant.

---

## F. BASE DE DONNÉES (Supabase)

### Migrations
27 migrations existent dans `supabase/migrations/`. Toutes doivent être exécutées sur la base de production.

### À vérifier (patron)
- [ ] Toutes les migrations sont-elles appliquées sur la base Supabase de production ?
- [ ] Les sauvegardes automatiques sont-elles actives ? (Supabase → Database → Backups)
- [ ] Les données de test (commandes test, sessions test) ont-elles été nettoyées ?
- [ ] Le plan Supabase inclut-il les sauvegardes quotidiennes ?

### Séparation test/réel
- Les commandes test portent le flag `is_test = true` et sont exclues de toutes les stats.
- Le mode test crée des entrées dans `test_mode_sessions` (expiration 1h, nettoyage automatique).
- Le cron `cleanup-orders` supprime les commandes abandonnées (`pending_payment` > 1h), mais vérifie d'abord auprès de Stripe qu'elles ne sont pas payées.

---

## G. TÂCHES PLANIFIÉES (CRON)

### Déclarées dans vercel.json (OK)

| Cron | Horaire UTC | Heure Bruxelles (~) | Fonction |
|---|---|---|---|
| `send-feedback-emails` | 10:00 | 12:00 | Envoie les demandes d'avis |
| `reset-stock` | 04:00 | 06:00 | Remet les stocks à jour |
| `cleanup-orders` | 03:00 | 05:00 | Nettoie les commandes abandonnées |
| `cleanup-messages` | 03:00 | 05:00 | Supprime les messages avant 5h Bruxelles |

Tous protégés par `CRON_SECRET`. Fonctionnent sur le plan Vercel Hobby (cron quotidien) ou Pro (cron horaire). Le feedback (`send-feedback-emails`) est déclaré quotidien à 10h UTC dans `vercel.json`, mais `FONCTIONNALITES.md` indique aussi un cron horaire — vérifier la cohérence.

---

## H. SEO ET RÉFÉRENCEMENT

### Déjà en place (Claude a vérifié)
- [x] Sitemap bilingue (FR + NL) avec hreflang — `app/sitemap.ts`
- [x] robots.txt bloque /admin, /staff, /livreur, /api
- [x] Données structurées JSON-LD (Restaurant, adresse, horaires, coordonnées GPS)
- [x] Meta OpenGraph complètes (titre, description, image)
- [x] Hreflang tags dans le layout (fr, nl-BE, x-default)
- [x] Canonical URLs sur toutes les pages publiques
- [x] noindex sur les pages internes (staff, livreur, checkout, feedback)
- [x] Redirections permanentes (/menu → /la-carte, etc.)

### À faire (patron)
- [ ] **Google Search Console** : ajouter `legrilldufour.be`, soumettre le sitemap
- [ ] **Fiche Google Business** : créer ou mettre à jour avec le lien du site, les horaires, le lien de commande, le lien de réservation
- [ ] **Liens Facebook et Instagram** : fournir les URLs officielles (le pied de page et les données structurées les attendent)

### À faire (Claude — code)
- [ ] Vérifier que l'image de partage OG existe et est de bonne taille (1200x630)

---

## I. MENTIONS LÉGALES ET CONFORMITÉ

### Déjà en place
- [x] Page mentions légales (`/mentions-legales`)
- [x] Page politique de confidentialité (`/politique-de-confidentialite`)

### À vérifier (patron)
- [ ] Les informations légales sont-elles complètes et exactes ?
  - Raison sociale, forme juridique
  - Numéro d'entreprise : BE 0726.458.932
  - Siège social : Rue Des Courtils – Hovenstraat 1b, 7700 Mouscron
  - Téléphone : 056 34 28 70
  - E-mail : chriswillen@me.com
  - Hébergeur : Vercel Inc.
- [ ] Conditions générales de vente et de livraison : sont-elles présentes et complètes pour la Belgique ?
- [ ] Bandeau cookies : est-il présent et conforme au RGPD ?
- [ ] Lien de désinscription dans les emails : OK (vérifié dans le code)

---

## J. SÉCURITÉ

### Déjà en place (Claude a vérifié — audit complet 28 octobre 2026)
- [x] En-têtes de sécurité : HSTS, CSP complet (frame-ancestors, object-src, upgrade-insecure-requests), X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- [x] `X-Powered-By` supprimé (poweredByHeader: false)
- [x] HTTPS forcé (via Vercel + HSTS)
- [x] Rate limiting : 5 tentatives auth, 10 commandes/5min, 30/min tracker, 20/min verify-payment, 5/5min feedback
- [x] Sanitisation des entrées (XSS) : remarques, messages, recherche admin (wildcards SQL échappés)
- [x] Webhook Stripe signé (HMAC) + GET retourne 405
- [x] Prix recalculés côté serveur
- [x] Aucune clé dans le code source ni dans l'historique Git
- [x] `.gitignore` protège les fichiers `.env`
- [x] Cookies avec flag Secure
- [x] CSP inclut form-action, base-uri, frame-ancestors, object-src, upgrade-insecure-requests
- [x] Auth cron timing-safe (module partagé `verifyCronSecret` avec `crypto.timingSafeEqual`)
- [x] Validation UUID sur tous les endpoints livreur (x-driver-id)
- [x] PINs livreurs masqués dans l'API pour les rôles non-admin
- [x] JSON.parse protégé par try/catch dans l'upload (données de recadrage)
- [x] Voir `COMPTE-RENDU-SECURITE.md` pour le rapport détaillé

### Points d'attention
- **PINs livreurs en clair en base** : le cahier des charges mentionne qu'il faudrait les hasher (bcrypt). C'est une amélioration de sécurité, pas un bloquant immédiat.
- **Branche principale non protégée** : recommander la protection de `main` dans GitHub (Settings → Branches → Branch protection rules).

---

## K. SURVEILLANCE (MONITORING)

### Déjà en place
- [x] Alertes email webhook en échec → chriswillen@me.com
- [x] Alertes email paiement orphelin → chriswillen@me.com
- [x] Rapprochement Stripe ↔ commandes dans le tableau de bord admin
- [x] Endpoint `/api/health` pour diagnostic

### À configurer (patron)
- [ ] **Uptime monitoring** : service externe qui vérifie que le site répond (ex: UptimeRobot gratuit, Vercel Analytics)
- [ ] **Vercel Logs** : consulter régulièrement la première semaine
- [ ] **Resend Dashboard** : vérifier que les emails partent
- [ ] **Stripe Dashboard** : vérifier les webhooks (Events → Filter → Failed)

---

## L. CONTENU ET DÉCISIONS MÉTIER (patron)

Issues du cahier des charges, section 16 :

- [ ] Photos d'ambiance et de viande pour l'accueil
- [ ] Liens Facebook et Instagram officiels
- [ ] Adresse de la fiche Google Business
- [ ] **Décision** : espèces conservées ou supprimées ?
- [ ] **Décision** : liste définitive des plats livrables (croquettes, moëlle du chef, crème brûlée, fondant au chocolat, veggies, salade de scampis croustillants, feuilleté de saumon, poisson du jour, salade de chèvre chaud)
- [ ] **Décision** : alcool ou Lunch en livraison ?
- [ ] **Décision** : menus complets livrables ?
- [ ] **Décision** : plats du jour à tous les services ou midi seulement ?
- [ ] **Décision** : nombre de tablettes cuisine
- [ ] **Décision** : imprimante de tickets ?

---

## M. MATÉRIEL RESTAURANT

- [ ] **Tablette cuisine** : écran toujours allumé, son activé, application `/staff` ouverte, bouton « Activer le son » appuyé
- [ ] **Téléphones livreurs** : application `/livreur` installée sur l'écran d'accueil (PWA), notifications autorisées
- [ ] **Tests sons réels** : alarme cuisine, notification messages, alertes livreur
- [ ] **Tests sur iPhone** : Safari iOS gère différemment les notifications push — tester spécifiquement

---

## Procédure de rollback

### Vercel
1. Aller sur Vercel → Deployments
2. Trouver le dernier déploiement fonctionnel
3. Cliquer sur "..." → "Promote to Production"
4. Le site revient à la version précédente en 30 secondes

### Base de données
- Les migrations sont additives. Un rollback Vercel ne nécessite pas de rollback de la base.
- En cas de problème : restaurer depuis un backup Supabase (Dashboard → Database → Backups).

### Stripe
- Remettre les clés test dans Vercel et redéployer pour revenir en mode test.

---

## N. INTERRUPTEUR « BIENTÔT DISPONIBLE »

### État actuel
- **Statut** : ACTIF — les commandes sont en mode « Bientôt disponible ».
- **Toggle** : Admin > Paramètres > « Commandes ouvertes / Bientôt disponible ».
- **Effet** : tous les boutons de commande affichent un modal au lieu de naviguer. Les pages `/commander` et `/commander/checkout` redirigent vers `/la-carte`. Les API refusent les nouvelles commandes.
- **Sécurité** : si la base de données est inaccessible, le site reste en « Bientôt disponible » par défaut.
- **Mode test** : l'équipe peut toujours passer des commandes test même quand les commandes sont en pause.

### Pour réouvrir les commandes (patron)
1. Aller sur `/admin` → onglet « Paramètres »
2. Cliquer le bouton « Commandes ouvertes / Bientôt disponible »
3. Confirmer dans le dialog
4. Vérifier sur le site public que les boutons « Commander » fonctionnent normalement
5. Le changement est immédiat et journalisé

### Migration nécessaire
- [ ] Exécuter `supabase/migrations/028_orders_paused.sql` sur la base de production (ajoute la colonne `orders_paused` et la table `orders_paused_log`)

---

## Ordre recommandé pour la mise en ligne

1. [ ] Nom de domaine relié et en HTTPS, redirections en place
2. [ ] E-mail : authentification domaine et test de réception
3. [ ] Stripe : activation, webhook live, clés dans Vercel
4. [ ] Codes de connexion remplacés (admin, livreurs)
5. [ ] Variables d'environnement complètes
6. [ ] Migration `028_orders_paused.sql` exécutée
7. [ ] Fiche Google et référencement
8. [ ] Matériel (tablette cuisine, téléphones livreurs)
9. [ ] Test final : une vraie commande de quelques euros, de bout en bout
10. [ ] Bascule officielle : le patron dit « on ouvre » → toggle « Commandes ouvertes » dans l'admin

---
## Architecture de sécurité

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
